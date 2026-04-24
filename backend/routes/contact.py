from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, EmailStr
from typing import Optional
from shared import (
    db, logger, User, get_current_user, require_admin,
    RESEND_API_KEY, SENDER_EMAIL,
    datetime, timezone, uuid, asyncio
)

router = APIRouter()

# ============ CONTACT LEADS ============

class ContactLeadRequest(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    module: Optional[str] = None
    query: Optional[str] = ""
    lead_type: str = "support"


class ContactLeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


@router.post("/contact/lead")
async def submit_contact_lead(payload: ContactLeadRequest):
    import resend as _resend
    full_name = (payload.full_name or "").strip()
    mobile = (payload.mobile or "").strip()
    email = (payload.email or "").strip().lower()
    if not full_name or not mobile or not email:
        raise HTTPException(status_code=400, detail="Full name, mobile, and email are required")
    if payload.lead_type not in ("sales", "support"):
        raise HTTPException(status_code=400, detail="lead_type must be 'sales' or 'support'")

    lead = {
        "lead_id": f"lead_{uuid.uuid4().hex[:12]}",
        "lead_type": payload.lead_type,
        "full_name": full_name, "mobile": mobile, "email": email,
        "module": (payload.module or "").strip() or None,
        "query": (payload.query or "").strip(),
        "recipient": "founders@ipo-labs.com",
        "status": "new", "email_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contact_leads.insert_one(lead)
    lead.pop("_id", None)

    email_sent = False
    if RESEND_API_KEY and RESEND_API_KEY != 're_placeholder_key':
        try:
            email_params = {
                "from": SENDER_EMAIL, "to": ["founders@ipo-labs.com"],
                "subject": f"[SETU - {payload.lead_type.upper()}] New lead from {full_name}",
                "html": (f"<h2>New {payload.lead_type.title()} Lead</h2>"
                         f"<p><b>Name:</b> {full_name}</p><p><b>Mobile:</b> {mobile}</p>"
                         f"<p><b>Email:</b> {email}</p><p><b>Module:</b> {lead['module'] or 'N/A'}</p>"
                         f"<p><b>Query:</b><br/>{(lead['query'] or 'N/A')}</p>"),
            }
            await asyncio.to_thread(_resend.Emails.send, email_params)
            email_sent = True
            await db.contact_leads.update_one({"lead_id": lead["lead_id"]}, {"$set": {"email_sent": True}})
        except Exception as e:
            logger.error(f"Contact lead email send failed: {e}")

    return {
        "message": "Thanks! Your request has been received. Our team will reach out shortly.",
        "lead_id": lead["lead_id"], "email_sent": email_sent,
    }


@router.get("/contact/leads")
async def list_contact_leads(user: User = Depends(require_admin)):
    leads = await db.contact_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"leads": leads}


@router.patch("/contact/leads/{lead_id}")
async def update_contact_lead_status(lead_id: str, payload: ContactLeadStatusUpdate, user: User = Depends(require_admin)):
    if payload.status not in ("new", "contacted", "closed"):
        raise HTTPException(status_code=400, detail="status must be 'new', 'contacted', or 'closed'")
    update = {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user.email}
    if payload.notes is not None:
        update["admin_notes"] = payload.notes
    result = await db.contact_leads.update_one({"lead_id": lead_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = await db.contact_leads.find_one({"lead_id": lead_id}, {"_id": 0})
    return {"message": "Lead updated", "lead": lead}


@router.delete("/contact/leads/{lead_id}")
async def delete_contact_lead(lead_id: str, user: User = Depends(require_admin)):
    result = await db.contact_leads.delete_one({"lead_id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}
