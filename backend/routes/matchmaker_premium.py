"""
MatchMaker Premium — Advanced Data, Identifier Uploads, Audit Log, Soft-Delete.

This module is intentionally kept separate from `expert_registration.py` because:
  • All premium / advanced-data records live in dedicated MongoDB collections
    (matchmaker_premium_profiles, matchmaker_audit_log, matchmaker_deleted_archive).
  • All file uploads go to a dedicated GridFS bucket (`matchmaker_uploads`) so
    every user's documents are stored separately under their own header
    (per the IT-data-segregation requirement).
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from shared import db, logger, User, get_current_user, datetime, timezone, uuid, io, os, ObjectId
from pydantic import BaseModel
from typing import Optional, List
from datetime import timedelta

from routes.expert_registration import EXPERTISE_AREAS, VERIFICATION_FIELDS

router = APIRouter()

# Dedicated GridFS bucket — stores every file in its own per-user header.
mm_fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="matchmaker_uploads")

# ============ PRICING (INR 1,999 + 18% GST) ============
PREMIUM_BASE_PRICE = 1999.00
PREMIUM_GST_PERCENT = 18
PREMIUM_GST_AMOUNT = round(PREMIUM_BASE_PRICE * PREMIUM_GST_PERCENT / 100, 2)  # 359.82
PREMIUM_TOTAL_AMOUNT = round(PREMIUM_BASE_PRICE + PREMIUM_GST_AMOUNT, 2)        # 2358.82
PREMIUM_VALIDITY_DAYS = 365

# ============ FILE UPLOAD CONFIG ============
MM_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MM_ALLOWED_EXTS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
MM_ALLOWED_MIMES = {
    "application/pdf",
    "image/jpeg", "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
SOFT_DELETE_RETENTION_DAYS = 30


# ============ AUDIT HELPER ============
async def _audit(user: User, expert_id: Optional[str], action: str,
                 details: Optional[dict] = None, ip: Optional[str] = None):
    await db.matchmaker_audit_log.insert_one({
        "log_id": f"mmaudit_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "user_email": user.email,
        "expert_id": expert_id,
        "action": action,
        "details": details or {},
        "ip": ip,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ============ PRICING ENDPOINT ============
@router.get("/matchmaker/expert/premium/pricing")
async def get_premium_pricing():
    return {
        "base_price": PREMIUM_BASE_PRICE,
        "gst_percent": PREMIUM_GST_PERCENT,
        "gst_amount": PREMIUM_GST_AMOUNT,
        "total_amount": PREMIUM_TOTAL_AMOUNT,
        "currency": "INR",
        "validity_days": PREMIUM_VALIDITY_DAYS,
        "plan_name": "Premium Expert — 1 Year",
    }


# ============ PAYMENT FLOW (Mock Razorpay) ============

class InitiateOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str
    razorpay_key_id: str
    is_mock: bool


@router.post("/matchmaker/expert/premium/initiate-order")
async def initiate_premium_order(request: Request, user: User = Depends(get_current_user)):
    """Create a (mocked) Razorpay order. In production this would call
    razorpay.Order.create(). We persist the order so verify-payment can
    reconcile against it."""
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Please complete basic expert registration first")
    if profile.get("is_premium"):
        raise HTTPException(status_code=400, detail="You are already a Premium member")

    order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    order_doc = {
        "order_id": order_id,
        "user_id": user.user_id,
        "expert_id": profile["expert_id"],
        "amount": PREMIUM_TOTAL_AMOUNT,
        "base_price": PREMIUM_BASE_PRICE,
        "gst_amount": PREMIUM_GST_AMOUNT,
        "currency": "INR",
        "status": "created",
        "is_mock": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.matchmaker_payment_orders.insert_one(order_doc)
    await _audit(user, profile["expert_id"], "premium_order_initiated",
                 {"order_id": order_id, "amount": PREMIUM_TOTAL_AMOUNT}, _client_ip(request))

    return InitiateOrderResponse(
        order_id=order_id,
        amount=PREMIUM_TOTAL_AMOUNT,
        currency="INR",
        razorpay_key_id="rzp_test_MOCK_KEY",
        is_mock=True,
    )


class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


@router.post("/matchmaker/expert/premium/verify-payment")
async def verify_premium_payment(data: VerifyPaymentRequest, request: Request,
                                  user: User = Depends(get_current_user)):
    """In production, verify razorpay_signature using HMAC-SHA256 with the
    secret key. For now we trust the client-provided order_id and mark the
    profile as premium."""
    order = await db.matchmaker_payment_orders.find_one({"order_id": data.order_id, "user_id": user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=PREMIUM_VALIDITY_DAYS)

    payment_id = data.razorpay_payment_id or f"pay_mock_{uuid.uuid4().hex[:14]}"
    await db.matchmaker_payment_orders.update_one(
        {"order_id": data.order_id},
        {"$set": {
            "status": "paid",
            "razorpay_payment_id": payment_id,
            "paid_at": now.isoformat(),
        }}
    )
    await db.expert_profiles.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "is_premium": True,
            "premium_activated_at": now.isoformat(),
            "premium_expires_at": expires_at.isoformat(),
            "updated_at": now.isoformat(),
        }}
    )
    await _audit(user, profile["expert_id"], "premium_payment_verified",
                 {"order_id": data.order_id, "payment_id": payment_id, "amount": order["amount"]},
                 _client_ip(request))

    return {
        "message": "Premium activated successfully",
        "payment_id": payment_id,
        "premium_expires_at": expires_at.isoformat(),
        "next_step": "advanced-data",
    }


# ============ EXPERTISE / IDENTIFIERS METADATA ============
@router.get("/matchmaker/expert/premium/expertise-catalog")
async def get_expertise_catalog():
    """Return all 15 expertise areas + their primary/secondary identifiers
    (used to render the Advanced Data form)."""
    catalog = []
    for area in EXPERTISE_AREAS:
        spec = VERIFICATION_FIELDS.get(area["id"], {})
        catalog.append({
            "id": area["id"],
            "label": area["label"],
            "regulator": spec.get("regulator", ""),
            "primary": spec.get("primary", []),
            "secondary": spec.get("secondary", []),
        })
    return {"areas": catalog}


# ============ ADVANCED DATA SAVE ============

class AdvancedDataPayload(BaseModel):
    firm_name: Optional[str] = ""
    primary_area: str
    primary_identifiers: dict     # {key: value}
    secondary_identifiers: dict   # {key: value}
    confidentiality_accepted: bool


@router.post("/matchmaker/expert/premium/save-advanced-data")
async def save_advanced_data(data: AdvancedDataPayload, request: Request,
                              user: User = Depends(get_current_user)):
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    if not profile.get("is_premium"):
        raise HTTPException(status_code=403, detail="Premium membership required")
    if not data.confidentiality_accepted:
        raise HTTPException(status_code=400, detail="You must accept the confidentiality terms")

    spec = VERIFICATION_FIELDS.get(data.primary_area)
    if not spec:
        raise HTTPException(status_code=400, detail="Invalid primary area of expertise")

    # All primary identifiers must be filled
    missing = [
        f["label"] for f in spec["primary"]
        if not str(data.primary_identifiers.get(f["key"], "")).strip()
    ]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Mandatory primary identifiers missing: {', '.join(missing)}"
        )

    now = datetime.now(timezone.utc).isoformat()
    existing = await db.matchmaker_premium_profiles.find_one({"user_id": user.user_id}, {"_id": 0})

    payload = {
        "user_id": user.user_id,
        "expert_id": profile["expert_id"],
        "firm_name": (data.firm_name or "").strip(),
        "primary_area": data.primary_area,
        "primary_identifiers": data.primary_identifiers,
        "secondary_identifiers": data.secondary_identifiers,
        "confidentiality_accepted": True,
        "confidentiality_accepted_at": now,
        "updated_at": now,
    }

    if existing:
        # Audit the diff for traceability
        diff = {}
        for k in ["firm_name", "primary_area", "primary_identifiers", "secondary_identifiers"]:
            if existing.get(k) != payload[k]:
                diff[k] = {"before": existing.get(k), "after": payload[k]}
        await db.matchmaker_premium_profiles.update_one(
            {"user_id": user.user_id}, {"$set": payload}
        )
        await _audit(user, profile["expert_id"], "advanced_data_updated",
                     {"diff": diff}, _client_ip(request))
        action_msg = "Advanced data updated"
    else:
        payload["created_at"] = now
        await db.matchmaker_premium_profiles.insert_one(payload)
        await _audit(user, profile["expert_id"], "advanced_data_created",
                     {"primary_area": data.primary_area}, _client_ip(request))
        action_msg = "Advanced data saved"

    # Mark profile as verified once advanced data is in
    await db.expert_profiles.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "is_verified": True,
            "verified_areas": [data.primary_area],
            "verification_submitted_at": now,
            "updated_at": now,
        }}
    )

    payload.pop("_id", None)
    return {"message": action_msg, "data": payload}


# ============ FILE UPLOAD / DELETE for IDENTIFIER ============

@router.post("/matchmaker/expert/premium/upload-file")
async def upload_identifier_file(
    request: Request,
    identifier_key: str = Form(...),
    identifier_type: str = Form(...),   # "primary" | "secondary"
    primary_area: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    if not profile.get("is_premium"):
        raise HTTPException(status_code=403, detail="Premium membership required")
    if identifier_type not in {"primary", "secondary"}:
        raise HTTPException(status_code=400, detail="identifier_type must be 'primary' or 'secondary'")

    content = await file.read()
    if len(content) > MM_MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File must be 5 MB or smaller")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in MM_ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Allowed file types: PDF, JPG, PNG, DOC, DOCX")
    if file.content_type and file.content_type not in MM_ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"Content-Type '{file.content_type}' not allowed")

    # Strict per-user header — every file lives under its own user_id metadata
    storage_filename = f"mm_{user.user_id}_{identifier_key}_{uuid.uuid4().hex[:8]}{ext}"
    grid_id = await mm_fs_bucket.upload_from_stream(
        storage_filename,
        io.BytesIO(content),
        metadata={
            "user_id": user.user_id,
            "expert_id": profile["expert_id"],
            "identifier_key": identifier_key,
            "identifier_type": identifier_type,
            "primary_area": primary_area,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    file_record = {
        "file_id": f"mmf_{uuid.uuid4().hex[:14]}",
        "user_id": user.user_id,
        "expert_id": profile["expert_id"],
        "gridfs_id": str(grid_id),
        "identifier_key": identifier_key,
        "identifier_type": identifier_type,
        "primary_area": primary_area,
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "is_deleted": False,
    }
    await db.matchmaker_identifier_files.insert_one(file_record)
    await _audit(user, profile["expert_id"], "identifier_file_uploaded",
                 {"identifier_key": identifier_key, "file_id": file_record["file_id"],
                  "filename": file.filename}, _client_ip(request))

    file_record.pop("_id", None)
    return {"message": "File uploaded", "file": file_record}


@router.get("/matchmaker/expert/premium/file/{file_id}")
async def download_identifier_file(file_id: str, user: User = Depends(get_current_user)):
    rec = await db.matchmaker_identifier_files.find_one({"file_id": file_id}, {"_id": 0})
    if not rec or rec.get("is_deleted"):
        raise HTTPException(status_code=404, detail="File not found")
    if rec["user_id"] != user.user_id:
        # Allow central admins to view as well
        from shared import is_central_admin
        if not is_central_admin(user):
            raise HTTPException(status_code=403, detail="Not allowed")
    grid_out = await mm_fs_bucket.open_download_stream(ObjectId(rec["gridfs_id"]))
    return StreamingResponse(grid_out, media_type=rec.get("content_type", "application/octet-stream"))


@router.delete("/matchmaker/expert/premium/file/{file_id}")
async def soft_delete_identifier_file(file_id: str, request: Request,
                                       user: User = Depends(get_current_user)):
    rec = await db.matchmaker_identifier_files.find_one({"file_id": file_id}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    if rec["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if rec.get("is_deleted"):
        raise HTTPException(status_code=400, detail="File already deleted")

    now = datetime.now(timezone.utc)
    purge_at = now + timedelta(days=SOFT_DELETE_RETENTION_DAYS)

    await db.matchmaker_identifier_files.update_one(
        {"file_id": file_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now.isoformat(),
            "scheduled_purge_at": purge_at.isoformat(),
        }}
    )
    # Mirror into the deleted-archive collection (for IT-compliance traceability)
    archive_doc = {**rec, "is_deleted": True,
                   "deleted_at": now.isoformat(),
                   "scheduled_purge_at": purge_at.isoformat()}
    archive_doc.pop("_id", None)
    await db.matchmaker_deleted_archive.insert_one(archive_doc)
    await _audit(user, rec["expert_id"], "identifier_file_deleted",
                 {"file_id": file_id, "scheduled_purge_at": purge_at.isoformat()},
                 _client_ip(request))

    return {"message": "File scheduled for deletion (30-day retention)",
            "scheduled_purge_at": purge_at.isoformat()}


# ============ READ ENDPOINTS ============
@router.get("/matchmaker/expert/premium/my-data")
async def get_my_premium_data(user: User = Depends(get_current_user)):
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        return {"profile": None, "premium_data": None, "files": []}
    premium = await db.matchmaker_premium_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    files = await db.matchmaker_identifier_files.find(
        {"user_id": user.user_id, "is_deleted": {"$ne": True}}, {"_id": 0}
    ).sort("uploaded_at", -1).to_list(200)
    return {
        "is_premium": profile.get("is_premium", False),
        "premium_expires_at": profile.get("premium_expires_at"),
        "premium_data": premium,
        "files": files,
    }


@router.get("/matchmaker/expert/premium/audit-log")
async def get_my_audit_log(user: User = Depends(get_current_user), limit: int = 100):
    """Return the user's own audit-log entries (most recent first)."""
    logs = await db.matchmaker_audit_log.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(min(limit, 500))
    return {"logs": logs}
