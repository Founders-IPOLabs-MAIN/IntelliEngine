from fastapi import APIRouter, HTTPException, Depends
from shared import (db, User, get_current_user, promote_new_user,
    Project, ProjectCreate, ProjectUpdate, DRHPSection, SectionUpdate,
    datetime, timezone, uuid)
from typing import List, Optional

router = APIRouter()

# ============ PROJECT ENDPOINTS ============

@router.get("/projects", response_model=List[Project])
async def get_projects(user: User = Depends(get_current_user), user_login_type: Optional[str] = None):
    """Get all projects for current user. Optionally filter by user_login_type."""
    query = {"user_id": user.user_id}
    if user_login_type:
        query["user_login_type"] = user_login_type
    projects = await db.projects.find(query, {"_id": 0}).to_list(100)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
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
    """Get a specific project"""
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project.get('updated_at'), str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
    return Project(**project)

@router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate, user: User = Depends(get_current_user)):
    """Update a project"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.projects.update_one(
        {"project_id": project_id, "user_id": user.user_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return await get_project(project_id, user)

# ============ DRHP SECTION ENDPOINTS ============

@router.get("/projects/{project_id}/sections", response_model=List[DRHPSection])
async def get_sections(project_id: str, user: User = Depends(get_current_user)):
    """Get all DRHP sections for a project"""
    # Verify project ownership
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id},
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
