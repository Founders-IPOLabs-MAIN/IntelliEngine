from fastapi import APIRouter, HTTPException, Depends
from shared import (db, User, get_current_user, promote_new_user,
    Project, ProjectCreate, ProjectUpdate, DRHPSection, SectionUpdate,
    is_central_admin, admin_aware_user_filter, audit_admin_cross_access,
    datetime, timezone, timedelta, uuid)
from typing import List, Optional

router = APIRouter()

PROJECT_DELETE_RETENTION_DAYS = 60

# ============ PROJECT ENDPOINTS ============

@router.get("/projects", response_model=List[Project])
async def get_projects(user: User = Depends(get_current_user), user_login_type: Optional[str] = None):
    """Get all projects for current user. Central admins receive every user's
    project (full cross-user visibility). Optionally filter by user_login_type."""
    query = {**admin_aware_user_filter(user)}
    if user_login_type:
        query["user_login_type"] = user_login_type
    # Admins may have many users — bump the cap when admin
    cap = 5000 if is_central_admin(user) else 100
    projects = await db.projects.find(query, {"_id": 0}).to_list(cap)

    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])

    if is_central_admin(user):
        await audit_admin_cross_access(
            user, action="list_projects", resource_type="projects",
            details={"count": len(projects), "user_login_type": user_login_type},
        )
    return projects

@router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, user: User = Depends(get_current_user)):
    """Create a new IPO project"""
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    project_doc = {
        "project_id": project_id,
        "user_id": user.user_id,
        "company_name": project_data.company_name,
        "sector": project_data.sector,
        "current_stage": "Assessment",
        "progress_percentage": 0,
        "user_login_type": project_data.user_login_type,
        "board_type": project_data.board_type,
        "exchange": project_data.exchange,
        "issue_type": project_data.issue_type,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.projects.insert_one(project_doc)
    
    # Auto-promote new_user to existing_user
    await promote_new_user(user.user_id)
    
    # Create default DRHP sections
    drhp_sections = [
        "Cover Page", "Definitions and Abbreviations", "Risk Factors",
        "Introduction and Summary", "Capital Structure", "Objects of the Issue",
        "Basis for Issue Price", "Industry Overview", "Business Overview",
        "Management & Promoter Group", "Financial Information",
        "Legal and Regulatory Matters", "Other Information/Disclosures"
    ]
    
    for section_name in drhp_sections:
        section_doc = {
            "section_id": f"sec_{uuid.uuid4().hex[:12]}",
            "project_id": project_id,
            "section_name": section_name,
            "content": {},
            "last_edited_by": None,
            "status": "Draft",
            "documents": [],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.drhp_sections.insert_one(section_doc)
    
    project_doc["created_at"] = now
    project_doc["updated_at"] = now
    if "_id" in project_doc:
        del project_doc["_id"]
    
    return Project(**project_doc)

@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    """Get a specific project. Central admins can view any user's project."""
    project = await db.projects.find_one(
        {"project_id": project_id, **admin_aware_user_filter(user)},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project.get('updated_at'), str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])

    if is_central_admin(user) and project.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="view_project", resource_type="project",
            target_user_id=project.get("user_id"), resource_id=project_id,
            details={"company_name": project.get("company_name")},
        )

    return Project(**project)

@router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate, user: User = Depends(get_current_user)):
    """Update a project. Central admins can update any user's project."""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    # First locate the project to capture target user (for audit) before mutating
    target = await db.projects.find_one(
        {"project_id": project_id, **admin_aware_user_filter(user)},
        {"_id": 0, "user_id": 1, "company_name": 1},
    )
    if not target:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.projects.update_one(
        {"project_id": project_id},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    if is_central_admin(user) and target.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="update_project", resource_type="project",
            target_user_id=target.get("user_id"), resource_id=project_id,
            details={"fields": list(update_dict.keys()),
                     "company_name": target.get("company_name")},
        )

    return await get_project(project_id, user)


# ============ PROJECT DELETE / ARCHIVE / RESTORE ============

# Collections that hold project-scoped data. Each row in these collections is
# expected to carry a `project_id` field. We snapshot all of these on delete,
# and re-insert them on restore.
PROJECT_SCOPED_COLLECTIONS = [
    "project_dashboards",
    "document_repository",
    "document_audit_versions",
    "promoters",
    "kmps",
    "project_audit_logs",
    "drhp_sections",
    "drhp_chapter_content",
    "drhp_chapters",
    "company_data",
    "pre_ipo_tracker",
    "non_drhp_tracker",
]


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    """Soft-delete a project: snapshot the project + every scoped row into
    `project_deletion_archive` (60-day retention), then remove the live records.
    The user can restore from `/projects/deleted` within the retention window.
    Central admins can delete any user's project (audited).
    """
    project = await db.projects.find_one(
        {"project_id": project_id, **admin_aware_user_filter(user)}, {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    now = datetime.now(timezone.utc)
    snapshots: dict = {}
    total_rows = 0
    for coll_name in PROJECT_SCOPED_COLLECTIONS:
        rows = await db[coll_name].find({"project_id": project_id}, {"_id": 0}).to_list(10000)
        if rows:
            snapshots[coll_name] = rows
            total_rows += len(rows)

    archive_id = f"parch_{uuid.uuid4().hex[:12]}"
    archive_entry = {
        "archive_id": archive_id,
        "project_id": project_id,
        # Preserve the original owner so restore returns it to them
        "user_id": project.get("user_id"),
        "company_name": project.get("company_name"),
        "sector": project.get("sector"),
        "board_type": project.get("board_type"),
        "exchange": project.get("exchange"),
        "issue_type": project.get("issue_type"),
        "current_stage": project.get("current_stage"),
        "progress_percentage": project.get("progress_percentage"),
        "deleted_by_email": user.email,
        "deleted_by_user_id": user.user_id,
        "deleted_at": now.isoformat(),
        "purge_after": (now + timedelta(days=PROJECT_DELETE_RETENTION_DAYS)).isoformat(),
        "project_snapshot": project,
        "snapshots": snapshots,
        "total_rows_archived": total_rows,
        "retention_days": PROJECT_DELETE_RETENTION_DAYS,
    }
    await db.project_deletion_archive.insert_one(archive_entry)

    # Now remove the live rows
    for coll_name in PROJECT_SCOPED_COLLECTIONS:
        await db[coll_name].delete_many({"project_id": project_id})
    await db.projects.delete_one({"project_id": project_id})

    if is_central_admin(user) and project.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="delete_project", resource_type="project",
            target_user_id=project.get("user_id"), resource_id=project_id,
            details={
                "company_name": project.get("company_name"),
                "archive_id": archive_id,
                "total_rows_archived": total_rows,
            },
        )

    return {
        "message": "Project deleted",
        "archive_id": archive_id,
        "total_rows_archived": total_rows,
        "retention_days": PROJECT_DELETE_RETENTION_DAYS,
        "purge_after": archive_entry["purge_after"],
    }


@router.get("/projects/deleted/list")
async def list_deleted_projects(user: User = Depends(get_current_user)):
    """List the current user's archived (soft-deleted) projects still within
    the 60-day retention window. Central admins receive archives across every
    user. Heavy snapshot fields are stripped to keep the response light."""
    # Opportunistic purge of expired archives
    now_iso = datetime.now(timezone.utc).isoformat()
    expired = db.project_deletion_archive.find(
        {"purge_after": {"$lt": now_iso}}, {"_id": 0, "archive_id": 1}
    )
    async for v in expired:
        await db.project_deletion_archive.delete_one({"archive_id": v["archive_id"]})

    cap = 5000 if is_central_admin(user) else 200
    archives = await db.project_deletion_archive.find(
        {**admin_aware_user_filter(user)},
        {"_id": 0, "snapshots": 0, "project_snapshot": 0},
    ).sort("deleted_at", -1).to_list(cap)

    if is_central_admin(user):
        await audit_admin_cross_access(
            user, action="list_deleted_projects", resource_type="project_archives",
            details={"count": len(archives)},
        )

    return {
        "retention_days": PROJECT_DELETE_RETENTION_DAYS,
        "count": len(archives),
        "archives": archives,
    }


@router.post("/projects/deleted/{archive_id}/restore")
async def restore_deleted_project(archive_id: str, user: User = Depends(get_current_user)):
    """Restore a soft-deleted project from `project_deletion_archive`. The
    project itself plus every scoped row is re-inserted exactly as captured.
    Central admins can restore any user's archived project (audited)."""
    archive = await db.project_deletion_archive.find_one(
        {"archive_id": archive_id, **admin_aware_user_filter(user)}, {"_id": 0}
    )
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found or access denied")

    project_id = archive["project_id"]
    # Refuse to restore if a live project with this id already exists
    existing = await db.projects.find_one({"project_id": project_id}, {"_id": 1})
    if existing:
        raise HTTPException(status_code=409, detail="A live project with this id already exists")

    project_doc = archive.get("project_snapshot") or {}
    if project_doc:
        project_doc.pop("_id", None)
        project_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.projects.insert_one(project_doc)

    snapshots = archive.get("snapshots") or {}
    restored_rows = 0
    for coll_name, rows in snapshots.items():
        if not rows:
            continue
        for r in rows:
            r.pop("_id", None)
        await db[coll_name].insert_many(rows)
        restored_rows += len(rows)

    # Remove the archive entry now that it's restored
    await db.project_deletion_archive.delete_one({"archive_id": archive_id})

    if is_central_admin(user) and archive.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="restore_project", resource_type="project",
            target_user_id=archive.get("user_id"), resource_id=project_id,
            details={"archive_id": archive_id, "restored_rows": restored_rows,
                     "company_name": archive.get("company_name")},
        )

    return {
        "message": "Project restored",
        "project_id": project_id,
        "restored_rows": restored_rows,
    }



# ============ DRHP SECTION ENDPOINTS ============

@router.get("/projects/{project_id}/sections", response_model=List[DRHPSection])
async def get_sections(project_id: str, user: User = Depends(get_current_user)):
    """Get all DRHP sections for a project. Central admins bypass ownership."""
    project = await db.projects.find_one(
        {"project_id": project_id, **admin_aware_user_filter(user)},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    sections = await db.drhp_sections.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(100)
    
    for section in sections:
        if isinstance(section.get('created_at'), str):
            section['created_at'] = datetime.fromisoformat(section['created_at'])
        if isinstance(section.get('updated_at'), str):
            section['updated_at'] = datetime.fromisoformat(section['updated_at'])
    
    return sections

@router.get("/projects/{project_id}/sections/{section_id}", response_model=DRHPSection)
async def get_section(project_id: str, section_id: str, user: User = Depends(get_current_user)):
    """Get a specific DRHP section"""
    section = await db.drhp_sections.find_one(
        {"section_id": section_id, "project_id": project_id},
        {"_id": 0}
    )
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if isinstance(section.get('created_at'), str):
        section['created_at'] = datetime.fromisoformat(section['created_at'])
    if isinstance(section.get('updated_at'), str):
        section['updated_at'] = datetime.fromisoformat(section['updated_at'])
    
    return DRHPSection(**section)

@router.put("/projects/{project_id}/sections/{section_id}", response_model=DRHPSection)
async def update_section(
    project_id: str,
    section_id: str,
    update_data: SectionUpdate,
    user: User = Depends(get_current_user)
):
    """Update a DRHP section"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["last_edited_by"] = user.user_id
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.drhp_sections.update_one(
        {"section_id": section_id, "project_id": project_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return await get_section(project_id, section_id, user)
