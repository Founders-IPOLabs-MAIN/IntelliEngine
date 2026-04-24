from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import Response
from shared import (
    db, fs_bucket, logger, limiter, User, get_current_user, require_admin,
    RESEND_API_KEY, SENDER_EMAIL,
    sanitize_filename, validate_upload,
    log_audit_action, promote_new_user,
    datetime, timezone, uuid, io, os, asyncio, re, ObjectId
)
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# ============ CAREERS MODULE ============

class CareerPositionCreate(BaseModel):
    title: str
    department: str
    location: str
    type: str = "Full-time"
    experience: str = ""
    description: str = ""
    requirements: Optional[list] = None
    responsibilities: Optional[list] = None
    tags: Optional[list] = None
    freshers_welcome: bool = False


@router.get("/careers/positions")
async def get_career_positions():
    positions = await db.career_positions.find({"status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"positions": positions}


@router.post("/careers/positions")
async def create_career_position(data: CareerPositionCreate, user: User = Depends(require_admin)):
    position = {
        "position_id": f"pos_{uuid.uuid4().hex[:12]}",
        "title": data.title.strip(), "department": data.department.strip(),
        "location": data.location.strip(), "type": data.type.strip(),
        "experience": data.experience.strip(), "description": data.description.strip(),
        "requirements": data.requirements or [], "responsibilities": data.responsibilities or [],
        "tags": data.tags or [], "freshers_welcome": data.freshers_welcome,
        "status": "active", "applicant_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(), "created_by": user.user_id
    }
    await db.career_positions.insert_one(position)
    position.pop("_id", None)
    return {"message": "Position created", "position": position}


@router.delete("/careers/positions/{position_id}")
async def delete_career_position(position_id: str, user: User = Depends(require_admin)):
    result = await db.career_positions.update_one({"position_id": position_id}, {"$set": {"status": "closed"}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    return {"message": "Position closed"}


@router.post("/careers/apply/{position_id}")
async def apply_to_position(position_id: str, request: Request):
    import resend as _resend
    import base64
    form = await request.form()
    name = form.get("name", "").strip()
    email = form.get("email", "").strip()
    phone = form.get("phone", "").strip()
    date_of_joining = form.get("date_of_joining", "").strip()
    sales_experience = form.get("sales_experience", "").strip()
    accounting_experience = form.get("accounting_experience", "").strip()
    current_address = form.get("current_address", "").strip()
    cv_file = form.get("cv")
    if not name or not email or not date_of_joining:
        raise HTTPException(status_code=400, detail="Name, email, and date of joining are required")
    position = await db.career_positions.find_one({"position_id": position_id, "status": "active"})
    if not position:
        raise HTTPException(status_code=404, detail="Position not found or closed")
    cv_filename = None
    cv_data_b64 = None
    if cv_file and hasattr(cv_file, 'read'):
        cv_bytes = await cv_file.read()
        cv_filename = cv_file.filename
        cv_data_b64 = base64.b64encode(cv_bytes).decode('utf-8')
    application = {
        "application_id": f"app_{uuid.uuid4().hex[:12]}", "position_id": position_id,
        "position_title": position.get("title", ""), "name": name, "email": email,
        "phone": phone, "date_of_joining": date_of_joining,
        "sales_experience": sales_experience, "accounting_experience": accounting_experience,
        "current_address": current_address, "cv_filename": cv_filename,
        "status": "submitted", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.career_applications.insert_one(application)
    application.pop("_id", None)
    await db.career_positions.update_one({"position_id": position_id}, {"$inc": {"applicant_count": 1}})
    email_sent = False
    if RESEND_API_KEY and RESEND_API_KEY != 're_placeholder_key':
        try:
            email_params = {
                "from": SENDER_EMAIL, "to": ["founders.ipolabs@gmail.com"],
                "subject": f"New Job Application: {position.get('title', '')} - {name}",
                "html": f"<h2>New Job Application</h2><p><b>Position:</b> {position.get('title','')}</p><p><b>Name:</b> {name}</p><p><b>Email:</b> {email}</p><p><b>Phone:</b> {phone}</p>"
            }
            if cv_data_b64 and cv_filename:
                email_params["attachments"] = [{"filename": cv_filename, "content": cv_data_b64}]
            await asyncio.to_thread(_resend.Emails.send, email_params)
            email_sent = True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
    return {"message": "Application submitted successfully", "application": application, "email_sent": email_sent}


@router.get("/careers/applications")
async def get_career_applications(user: User = Depends(require_admin)):
    apps = await db.career_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"applications": apps}
