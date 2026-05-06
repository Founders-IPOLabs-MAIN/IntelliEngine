"""BV Engine Projects — CRUD + 30-day soft-delete archive.

Each project stores:
- header: company_name, website, plan_for_ipo (yes/no), ipo_timeline (12m/18m/beyond)
- fy_labels: ["FY 2024", "FY 2025", "FY 2026"]  (editable, oldest → latest)
- pl: { row_id: { fy0: number, fy1: number, fy2: number } }   # raw P&L inputs
- bs: { row_id: { fy0, fy1, fy2 } }                            # raw BS inputs
- assumptions: { wacc, revenue_cagr, ebitda_margin_steady, ... }
- engine_config: { weights, comparable multiples, sector_id }

Central admins can see/edit every user's projects per the cross-user policy.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Dict, List, Optional

from shared import (
    db, User, get_current_user,
    is_central_admin, is_approved_admin, admin_aware_user_filter, audit_admin_cross_access,
    datetime, timezone, timedelta, uuid,
)

router = APIRouter()

BV_DELETE_RETENTION_DAYS = 30


def _bv_admin_bypass(user: User) -> bool:
    """For BV projects we grant cross-user visibility to every admin role
    (Admin, Super Admin, Master Admin, Central Admins, Internal staff) — not
    just the 4 CENTRAL_ADMIN_EMAILS. This matches how every other module
    surfaces 'all users' data inside the Admin Center."""
    return is_approved_admin(user)


def _bv_owner_filter(user: User) -> dict:
    return {} if _bv_admin_bypass(user) else {"user_id": user.user_id}


def _default_assumptions() -> Dict[str, float]:
    """Default assumption values per the input sheet (DCF Assumptions tab)."""
    return {
        "wacc": 0.12,
        "revenue_cagr": 0.15,
        "ebitda_margin_steady": None,        # None = "auto-suggest from PL avg"
        "depreciation_pct": None,
        "capex_pct": None,
        "wc_change_pct": None,
        "tax_rate": 0.25,
        "terminal_growth": 0.04,
        "projection_years": 5,
    }


def _default_engine_config() -> Dict[str, Any]:
    return {
        "sector_id": "edtech_training",
        "ev_ebitda_multiple": 10,
        "ev_revenue_multiple": 3,
        "pe_multiple": 15,
        "apply_unlisted_discount": True,
        "weight_dcf": 0.50,
        "weight_nav": 0.25,
        "weight_comparable": 0.25,
        "intangible_brand": 0,
        "goodwill": 0,
    }


@router.get("/bv-projects")
async def list_bv_projects(user: User = Depends(get_current_user)):
    cap = 5000 if _bv_admin_bypass(user) else 200
    items = await db.bv_projects.find(
        {**_bv_owner_filter(user)},
        {"_id": 0, "pl": 0, "bs": 0, "assumptions": 0, "engine_config": 0},
    ).sort("updated_at", -1).to_list(cap)

    # When the caller is an admin, decorate each row with the owner's
    # email/name so the UI can show "owned by" tags. Single round-trip lookup.
    if _bv_admin_bypass(user) and items:
        owner_ids = list({i.get("user_id") for i in items if i.get("user_id")})
        owners = await db.users.find(
            {"user_id": {"$in": owner_ids}},
            {"_id": 0, "user_id": 1, "email": 1, "name": 1},
        ).to_list(len(owner_ids))
        by_id = {o["user_id"]: o for o in owners}
        for it in items:
            owner = by_id.get(it.get("user_id"))
            if owner:
                it["owner_email"] = owner.get("email")
                it["owner_name"] = owner.get("name")

    if is_central_admin(user):
        await audit_admin_cross_access(
            user, action="list_bv_projects", resource_type="bv_projects",
            details={"count": len(items)},
        )
    return {"projects": items}


@router.post("/bv-projects")
async def create_bv_project(
    payload: Dict[str, Any],
    user: User = Depends(get_current_user),
):
    project_id = f"bvp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    payload = payload or {}
    company_name = (payload.get("company_name") or "").strip() or "Untitled BV Project"
    fy_labels = payload.get("fy_labels") or ["FY 2023-24", "FY 2024-25", "FY 2025-26"]

    # The frontend may pass an engine_config (e.g. sector_id picked at create time).
    # Merge it into the defaults.
    engine_config = _default_engine_config()
    engine_config.update(payload.get("engine_config") or {})

    doc = {
        "project_id": project_id,
        "user_id": user.user_id,
        "company_name": company_name,
        "website": payload.get("website", "").strip(),
        "plan_for_ipo": payload.get("plan_for_ipo"),
        "ipo_timeline": payload.get("ipo_timeline"),
        "fy_labels": fy_labels,
        "pl": {},
        "bs": {},
        "assumptions": _default_assumptions(),
        "engine_config": engine_config,
        "created_at": now,
        "updated_at": now,
    }
    await db.bv_projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/bv-projects/{project_id}")
async def get_bv_project(project_id: str, user: User = Depends(get_current_user)):
    doc = await db.bv_projects.find_one(
        {"project_id": project_id, **_bv_owner_filter(user)}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="BV project not found")
    if is_central_admin(user) and doc.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="view_bv_project", resource_type="bv_project",
            target_user_id=doc.get("user_id"), resource_id=project_id,
            details={"company_name": doc.get("company_name")},
        )
    return doc


@router.put("/bv-projects/{project_id}")
async def update_bv_project(
    project_id: str,
    payload: Dict[str, Any],
    user: User = Depends(get_current_user),
):
    target = await db.bv_projects.find_one(
        {"project_id": project_id, **_bv_owner_filter(user)},
        {"_id": 0, "user_id": 1, "company_name": 1},
    )
    if not target:
        raise HTTPException(status_code=404, detail="BV project not found")

    # Only accept these fields. The body may carry partial updates.
    ALLOWED = {
        "company_name", "website", "plan_for_ipo", "ipo_timeline",
        "fy_labels", "pl", "bs", "assumptions", "engine_config",
    }
    update = {k: v for k, v in (payload or {}).items() if k in ALLOWED}
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.bv_projects.update_one(
        {"project_id": project_id}, {"$set": update}
    )

    if is_central_admin(user) and target.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="update_bv_project", resource_type="bv_project",
            target_user_id=target.get("user_id"), resource_id=project_id,
            details={"fields": list(update.keys()),
                     "company_name": target.get("company_name")},
        )

    fresh = await db.bv_projects.find_one({"project_id": project_id}, {"_id": 0})
    return fresh


@router.delete("/bv-projects/{project_id}")
async def delete_bv_project(project_id: str, user: User = Depends(get_current_user)):
    """Soft-delete: archive the full project for 30 days, then purge."""
    project = await db.bv_projects.find_one(
        {"project_id": project_id, **_bv_owner_filter(user)}, {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="BV project not found")

    now = datetime.now(timezone.utc)
    archive_id = f"bvarch_{uuid.uuid4().hex[:12]}"
    archive = {
        "archive_id": archive_id,
        "project_id": project_id,
        "user_id": project.get("user_id"),
        "company_name": project.get("company_name"),
        "deleted_by_email": user.email,
        "deleted_by_user_id": user.user_id,
        "deleted_at": now.isoformat(),
        "purge_after": (now + timedelta(days=BV_DELETE_RETENTION_DAYS)).isoformat(),
        "retention_days": BV_DELETE_RETENTION_DAYS,
        "snapshot": project,
    }
    await db.bv_project_archives.insert_one(archive)
    await db.bv_projects.delete_one({"project_id": project_id})

    if is_central_admin(user) and project.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="delete_bv_project", resource_type="bv_project",
            target_user_id=project.get("user_id"), resource_id=project_id,
            details={"company_name": project.get("company_name"),
                     "archive_id": archive_id},
        )

    return {
        "message": "BV project deleted",
        "archive_id": archive_id,
        "purge_after": archive["purge_after"],
        "retention_days": BV_DELETE_RETENTION_DAYS,
    }


@router.get("/bv-projects/deleted/list")
async def list_deleted_bv_projects(user: User = Depends(get_current_user)):
    """Return archives still inside the 30-day retention window. Older ones are
    opportunistically purged on read."""
    now_iso = datetime.now(timezone.utc).isoformat()
    expired = db.bv_project_archives.find(
        {"purge_after": {"$lt": now_iso}}, {"_id": 0, "archive_id": 1}
    )
    async for v in expired:
        await db.bv_project_archives.delete_one({"archive_id": v["archive_id"]})

    cap = 5000 if _bv_admin_bypass(user) else 200
    archives = await db.bv_project_archives.find(
        {**_bv_owner_filter(user)},
        {"_id": 0, "snapshot": 0},
    ).sort("deleted_at", -1).to_list(cap)
    return {
        "retention_days": BV_DELETE_RETENTION_DAYS,
        "count": len(archives),
        "archives": archives,
    }


@router.post("/bv-projects/deleted/{archive_id}/restore")
async def restore_bv_project(archive_id: str, user: User = Depends(get_current_user)):
    archive = await db.bv_project_archives.find_one(
        {"archive_id": archive_id, **_bv_owner_filter(user)}, {"_id": 0}
    )
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found or access denied")

    snapshot = archive.get("snapshot") or {}
    snapshot.pop("_id", None)
    project_id = snapshot.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="Corrupt archive — missing project_id")

    if await db.bv_projects.find_one({"project_id": project_id}, {"_id": 1}):
        raise HTTPException(status_code=409, detail="A live BV project with this id already exists")

    snapshot["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.bv_projects.insert_one(snapshot)
    await db.bv_project_archives.delete_one({"archive_id": archive_id})

    if is_central_admin(user) and archive.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="restore_bv_project", resource_type="bv_project",
            target_user_id=archive.get("user_id"), resource_id=project_id,
            details={"archive_id": archive_id, "company_name": archive.get("company_name")},
        )

    return {"message": "BV project restored", "project_id": project_id}
