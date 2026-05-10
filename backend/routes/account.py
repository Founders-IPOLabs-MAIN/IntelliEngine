from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import Response
from shared import (
    DEFAULT_ROLES, SUBSCRIPTION_PLANS,db, fs_bucket, limiter, logger, User, get_current_user,
    log_audit_action, validate_upload, is_central_admin, audit_admin_cross_access,
    datetime, timezone, uuid, io, os, ObjectId)
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ============ ACCOUNT DETAILS MODULE ============

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    designation: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# Subscription Plans (MOCKED - Razorpay placeholders)

DEFAULT_MODULE_PERMISSIONS = {
    "assessment": True,
    "matchmaker": True,
    "drhp": True,
    "funding": True,
    "valuation": True
}

ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASSWORD = "admin@123"


@router.get("/account/profile")
async def get_user_profile(user: User = Depends(get_current_user)):
    """Get current user's profile"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get role details
    role_id = user_doc.get("role", "viewer").lower().replace(" ", "_")
    if role_id in DEFAULT_ROLES:
        user_doc["role_details"] = DEFAULT_ROLES[role_id]
    
    # Get subscription info
    subscription = await db.subscriptions.find_one({"user_id": user.user_id}, {"_id": 0})
    if subscription:
        user_doc["subscription"] = subscription
    else:
        user_doc["subscription"] = {
            "plan_id": "free",
            "status": "active",
            "started_at": user_doc.get("created_at")
        }

    return user_doc


# ============ DRHP ONBOARDING (one-time profile capture) ============

class DRHPOnboardingPayload(BaseModel):
    user_login_type: str          # "merchant_banker" | "company" | "ca_firm"
    company_name: str
    full_name: str
    mobile: str
    email: str
    website: Optional[str] = ""
    referral_source: Optional[str] = ""   # "Friends" | "Google" | "Event" | "Reference"


@router.get("/account/drhp-onboarding")
async def get_drhp_onboarding(user: User = Depends(get_current_user)):
    """Returns the saved one-time onboarding profile (or completed=False if never filled)."""
    doc = await db.user_drhp_onboarding.find_one({"user_id": user.user_id}, {"_id": 0})
    if not doc:
        return {"completed": False}
    return {"completed": True, **doc}


@router.post("/account/drhp-onboarding")
async def save_drhp_onboarding(payload: DRHPOnboardingPayload, user: User = Depends(get_current_user)):
    """Save the user's first-time DRHP onboarding capture. Idempotent — calling
    again updates the record (we still keep it as the single source of truth)."""
    if payload.user_login_type not in ("merchant_banker", "company", "ca_firm"):
        raise HTTPException(status_code=400, detail="Invalid user_login_type")
    for field, label in (("company_name", "Company name"), ("full_name", "Full name"),
                         ("mobile", "Mobile"), ("email", "Email")):
        if not (getattr(payload, field) or "").strip():
            raise HTTPException(status_code=400, detail=f"{label} is required")

    now = datetime.now(timezone.utc).isoformat()
    record = payload.model_dump()
    record["user_id"] = user.user_id
    record["updated_at"] = now

    existing = await db.user_drhp_onboarding.find_one({"user_id": user.user_id}, {"_id": 0})
    if existing:
        await db.user_drhp_onboarding.update_one(
            {"user_id": user.user_id}, {"$set": record}
        )
    else:
        record["created_at"] = now
        await db.user_drhp_onboarding.insert_one(record)

    return {"message": "Onboarding saved", "user_login_type": payload.user_login_type}


@router.get("/admin/users/{target_user_id}/drhp-onboarding")
async def admin_get_user_drhp_onboarding(target_user_id: str, user: User = Depends(get_current_user)):
    """Central-admin-only endpoint: fetch any user's DRHP onboarding profile."""
    if not is_central_admin(user):
        raise HTTPException(status_code=403, detail="Central admin access required")
    doc = await db.user_drhp_onboarding.find_one({"user_id": target_user_id}, {"_id": 0})
    await audit_admin_cross_access(
        user, action="view_drhp_onboarding", resource_type="user_drhp_onboarding",
        target_user_id=target_user_id,
    )
    if not doc:
        return {"completed": False, "user_id": target_user_id}
    return {"completed": True, **doc}


@router.get("/admin/users/{target_user_id}/projects")
async def admin_list_user_projects(target_user_id: str, user: User = Depends(get_current_user)):
    """Central-admin-only: list every project belonging to a specific user."""
    if not is_central_admin(user):
        raise HTTPException(status_code=403, detail="Central admin access required")
    projects = await db.projects.find({"user_id": target_user_id}, {"_id": 0}).to_list(5000)
    await audit_admin_cross_access(
        user, action="list_user_projects", resource_type="projects",
        target_user_id=target_user_id, details={"count": len(projects)},
    )
    return {"count": len(projects), "projects": projects}


@router.get("/admin/audit/cross-user-access")
async def admin_list_cross_user_audit(
    user: User = Depends(get_current_user), limit: int = 500,
    target_user_id: Optional[str] = None, admin_user_id: Optional[str] = None,
):
    """Central-admin-only: read the trail of every cross-user action a central
    admin has performed (this lets admins see what other admins are doing)."""
    if not is_central_admin(user):
        raise HTTPException(status_code=403, detail="Central admin access required")
    q: dict = {}
    if target_user_id:
        q["target_user_id"] = target_user_id
    if admin_user_id:
        q["admin_user_id"] = admin_user_id
    cap = max(1, min(limit, 5000))
    logs = await db.admin_cross_user_audit.find(q, {"_id": 0}).sort("timestamp", -1).to_list(cap)
    return {"count": len(logs), "logs": logs}

@router.put("/account/profile")
async def update_user_profile(
    profile: ProfileUpdate,
    user: User = Depends(get_current_user)
):
    """Update user profile information"""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update_data}
    )
    
    await log_audit_action(user.user_id, "update", "account", "Updated profile information")
    
    return {"message": "Profile updated successfully"}

@router.post("/account/profile-picture")
@limiter.limit("5/minute")
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload profile picture to GridFS with security validation"""
    content = await file.read()
    
    # Validate and sanitize the upload with content moderation
    sanitized_filename, warnings = await validate_upload(
        file=file,
        content=content,
        context="profile_picture",
        uploader_name=user.name,
        scan_content=True  # Scan for explicit content
    )
    
    # Delete existing profile picture if exists
    existing_user = await db.users.find_one({"user_id": user.user_id})
    if existing_user and existing_user.get("profile_picture_id"):
        try:
            await fs_bucket.delete(ObjectId(existing_user["profile_picture_id"]))
        except:
            pass
    
    # Upload to GridFS with sanitized filename
    file_id = await fs_bucket.upload_from_stream(
        sanitized_filename,
        io.BytesIO(content),
        metadata={
            "user_id": user.user_id,
            "content_type": file.content_type,
            "type": "profile_picture",
            "original_filename": file.filename
        }
    )
    
    # Update user record
    picture_url = f"/api/account/profile-picture/{str(file_id)}"
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "picture": picture_url,
            "profile_picture_id": str(file_id),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit_action(user.user_id, "update", "account", "Updated profile picture")
    
    response = {"message": "Profile picture uploaded", "picture_url": picture_url}
    if warnings:
        response["warnings"] = warnings
    return response

@router.get("/account/profile-picture/{file_id}")
async def get_profile_picture(file_id: str, user: User = Depends(get_current_user)):
    """Get profile picture from GridFS - authenticated & ownership verified"""
    try:
        grid_out = await fs_bucket.open_download_stream(ObjectId(file_id))
        metadata = grid_out.metadata or {}
        if metadata.get("user_id") and metadata["user_id"] != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this file")
        content = await grid_out.read()
        content_type = metadata.get("content_type", "image/jpeg")
        
        return Response(
            content=content,
            media_type=content_type,
            headers={"Cache-Control": "max-age=86400"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get profile picture: {e}")
        raise HTTPException(status_code=404, detail="Profile picture not found")

@router.post("/account/change-password")
async def change_password(
    password_data: PasswordChange,
    user: User = Depends(get_current_user)
):
    """Change user password (for future email/password auth)"""
    # This is a placeholder for when email/password auth is implemented
    # Currently using Google OAuth, so password change is not applicable
    
    # In future implementation:
    # 1. Verify current password
    # 2. Hash new password
    # 3. Update in database
    # 4. Invalidate existing sessions
    
    await log_audit_action(user.user_id, "update", "account", "Password change attempted (OAuth user)")
    
    return {
        "message": "Password change is not available for OAuth users. Your account is secured via Google authentication.",
        "auth_type": "google_oauth"
    }

@router.get("/account/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    """Get current subscription details"""
    subscription = await db.subscriptions.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not subscription:
        # Return free plan by default
        subscription = {
            "plan_id": "free",
            "plan_name": "Free",
            "status": "active",
            "started_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at)
        }
    
    # Get plan details
    plan = next((p for p in SUBSCRIPTION_PLANS if p["plan_id"] == subscription["plan_id"]), SUBSCRIPTION_PLANS[0])
    subscription["plan_details"] = plan
    
    return subscription

@router.get("/account/subscription/plans")
async def get_available_plans():
    """Get all available subscription plans"""
    return {"plans": SUBSCRIPTION_PLANS}

@router.post("/account/subscription/upgrade")
async def upgrade_subscription(
    plan_id: str,
    user: User = Depends(get_current_user)
):
    """Initiate subscription upgrade (MOCKED - Razorpay placeholder)"""
    # Validate plan
    plan = next((p for p in SUBSCRIPTION_PLANS if p["plan_id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan_id == "free":
        raise HTTPException(status_code=400, detail="Cannot upgrade to free plan")
    
    # MOCKED: In real implementation, this would:
    # 1. Create Razorpay subscription
    # 2. Return payment link
    # 3. Handle webhook for payment confirmation
    
    # Placeholder response
    subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
    
    # Store pending subscription
    await db.subscriptions.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "user_id": user.user_id,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "status": "pending",  # Would be 'active' after payment
            "amount": plan["price"],
            "currency": plan["currency"],
            "billing_cycle": plan["billing_cycle"],
            "razorpay_subscription_id": subscription_id,  # Placeholder
            "started_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "create", "billing", f"Initiated upgrade to {plan['name']} plan")
    
    # MOCKED: Return placeholder payment info
    return {
        "message": "Subscription upgrade initiated",
        "subscription_id": subscription_id,
        "plan": plan,
        "payment_info": {
            "gateway": "razorpay",
            "status": "MOCKED - Payment gateway not integrated",
            "note": "In production, this would return a Razorpay payment link"
        }
    }

@router.post("/account/subscription/cancel")
async def cancel_subscription(user: User = Depends(get_current_user)):
    """Cancel current subscription (MOCKED)"""
    subscription = await db.subscriptions.find_one({"user_id": user.user_id})
    
    if not subscription or subscription.get("plan_id") == "free":
        raise HTTPException(status_code=400, detail="No active paid subscription to cancel")
    
    # MOCKED: In real implementation, would cancel via Razorpay API
    await db.subscriptions.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "ends_at": datetime.now(timezone.utc).isoformat()  # Would be end of billing period
        }}
    )
    
    await log_audit_action(user.user_id, "update", "billing", "Cancelled subscription")
    
    return {
        "message": "Subscription cancelled",
        "note": "MOCKED - In production, subscription would end at current billing period"
    }

@router.get("/account/billing/transactions")
async def get_transaction_history(
    user: User = Depends(get_current_user),
    limit: int = 20
):
    """Get billing transaction history (MOCKED)"""
    transactions = await db.transactions.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # If no transactions, return mock data for demo
    if not transactions:
        transactions = [
            {
                "transaction_id": "txn_demo_001",
                "type": "subscription",
                "description": "Free Plan - No charge",
                "amount": 0,
                "currency": "INR",
                "status": "completed",
                "created_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at)
            }
        ]
    
    return {"transactions": transactions, "note": "MOCKED - Razorpay integration placeholder"}

@router.get("/account/billing/invoice/{transaction_id}")
async def download_invoice(
    transaction_id: str,
    user: User = Depends(get_current_user)
):
    """Download invoice for a transaction (MOCKED)"""
    # MOCKED: In real implementation, would generate PDF invoice
    await log_audit_action(user.user_id, "download", "billing", f"Downloaded invoice: {transaction_id}")
    
    return {
        "message": "Invoice download",
        "transaction_id": transaction_id,
        "note": "MOCKED - In production, this would return a PDF invoice",
        "invoice_url": f"/api/account/billing/invoice/{transaction_id}/pdf"
    }
