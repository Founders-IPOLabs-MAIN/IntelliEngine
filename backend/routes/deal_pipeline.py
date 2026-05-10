"""
Deal Pipeline tracker — used on the Merchant Banker / CA Firm DRHP landing page
to track all active and ongoing IPO mandates beneath the project list.

Columns mirror the spreadsheet the user supplied:
  Client Name · Project Lead · Segment · Stage · Key Pending Items · Issues
  · Target Filing · TechFlow
"""
from fastapi import APIRouter, HTTPException, Depends
from shared import db, User, get_current_user, datetime, timezone, uuid
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class DealMandate(BaseModel):
    client_name: Optional[str] = ""
    project_lead: Optional[str] = ""
    segment: Optional[str] = ""           # SME | Main Board | Other
    stage: Optional[str] = ""             # Drafting | Filing | Listed | Hold | Financial Audit | …
    key_pending_items: Optional[str] = ""
    issues: Optional[str] = ""
    target_filing: Optional[str] = ""     # free-text, supports "Already Filed" or a date
    techflow: Optional[str] = ""          # numerical workflow indicator (kept as string)


@router.get("/drhp/deal-pipeline")
async def list_mandates(user: User = Depends(get_current_user)):
    rows = await db.drhp_deal_pipeline.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return {"mandates": rows}


@router.post("/drhp/deal-pipeline")
async def create_mandate(data: DealMandate, user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "mandate_id": f"mand_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.drhp_deal_pipeline.insert_one(record)
    record.pop("_id", None)
    return {"mandate": record}


@router.patch("/drhp/deal-pipeline/{mandate_id}")
async def update_mandate(mandate_id: str, data: DealMandate,
                          user: User = Depends(get_current_user)):
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.drhp_deal_pipeline.update_one(
        {"mandate_id": mandate_id, "user_id": user.user_id}, {"$set": update}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mandate not found")
    rec = await db.drhp_deal_pipeline.find_one(
        {"mandate_id": mandate_id, "user_id": user.user_id}, {"_id": 0}
    )
    return {"mandate": rec}


@router.delete("/drhp/deal-pipeline/{mandate_id}")
async def delete_mandate(mandate_id: str, user: User = Depends(get_current_user)):
    res = await db.drhp_deal_pipeline.delete_one(
        {"mandate_id": mandate_id, "user_id": user.user_id}
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mandate not found")
    return {"message": "Deleted"}


class BulkPayload(BaseModel):
    mandates: List[DealMandate]


@router.post("/drhp/deal-pipeline/bulk-replace")
async def bulk_replace(payload: BulkPayload, user: User = Depends(get_current_user)):
    """Save the entire pipeline in one shot (used by the front-end Save button)."""
    now = datetime.now(timezone.utc).isoformat()
    await db.drhp_deal_pipeline.delete_many({"user_id": user.user_id})
    docs = []
    for m in payload.mandates:
        docs.append({
            "mandate_id": f"mand_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            **m.model_dump(),
            "created_at": now,
            "updated_at": now,
        })
    if docs:
        await db.drhp_deal_pipeline.insert_many(docs)
        for d in docs:
            d.pop("_id", None)
    return {"mandates": docs}
