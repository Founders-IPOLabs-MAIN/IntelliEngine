from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import Response
from shared import (db, fs_bucket, logger, User, get_current_user,
    datetime, timezone, uuid, ObjectId)
from pydantic import BaseModel
from typing import Optional
from drhp_checklist_seed import DRHP_DOCUMENT_CHECKLIST

router = APIRouter()

DOCREPO_ALLOWED_MIME = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
DOCREPO_ALLOWED_IMAGE_PREFIX = "image/"
DOCREPO_MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB


async def _log_project_audit(
    project_id: str,
    user_obj: "User",
    action: str,
    module: str,
    details: dict = None,
    request: Request = None,
):
    """Record an audit event scoped to a single DRHP project."""
    entry = {
        "log_id": f"plog_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "user_id": getattr(user_obj, "user_id", None),
        "user_email": getattr(user_obj, "email", None),
        "user_name": getattr(user_obj, "name", None),
        "action": action,       # e.g. "view_repository", "upload_document", "reupload_document", "delete_file", "add_line", "delete_line", "view_audit_log"
        "module": module,       # "document_repository" | "audit_log" | "command_center"
        "details": details or {},
        "ip": request.client.host if request and request.client else None,
        "user_agent": request.headers.get("user-agent") if request else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.project_audit_logs.insert_one(entry)


async def _ensure_repository_seeded(project_id: str, project_owner_id: str):
    """On first access of a project's repository, seed the line items from the SEBI checklist."""
    existing = await db.document_repository.count_documents({"project_id": project_id})
    if existing > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for cat in DRHP_DOCUMENT_CHECKLIST:
        for idx, item in enumerate(cat["items"], start=1):
            docs.append({
                "item_id": f"dri_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                "project_owner_id": project_owner_id,
                "category": cat["category"],
                "category_order": cat["order"],
                "sub_order": idx,
                "title": item["title"],
                "remarks": item["remarks"],
                "is_custom": False,
                "file": None,
                "created_at": now,
                "updated_at": now,
            })
    if docs:
        await db.document_repository.insert_many(docs)


def _sanitise_repo_item(d: dict) -> dict:
    d.pop("_id", None)
    if d.get("file") and isinstance(d["file"], dict):
        d["file"].pop("gridfs_id", None)
    return d


@router.get("/projects/{project_id}/document-repository")
async def get_document_repository(project_id: str, request: Request, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await _ensure_repository_seeded(project_id, user.user_id)
    raw = await db.document_repository.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    items = [_sanitise_repo_item(i) for i in raw]

    # Split parents vs children
    parents = [i for i in items if not i.get("parent_item_id")]
    children_map: dict = {}
    for i in items:
        pid = i.get("parent_item_id")
        if pid:
            children_map.setdefault(pid, []).append(i)
    for pid in children_map:
        children_map[pid].sort(key=lambda x: (x.get("sub_line_order") or 0, x.get("created_at", "")))

    parents.sort(key=lambda p: (p.get("category_order") or 0, p.get("sub_order") or 0))
    for p in parents:
        p["children"] = children_map.get(p["item_id"], [])

    # Group by category
    grouped: dict = {}
    for p in parents:
        grouped.setdefault(p["category"], {"category": p["category"], "order": p["category_order"], "items": []})
        grouped[p["category"]]["items"].append(p)
    groups = sorted(grouped.values(), key=lambda g: g["order"])

    total_lines = len(items)  # parents + children all count
    uploaded_count = sum(1 for i in items if i.get("file"))
    pending_count = total_lines - uploaded_count

    await _log_project_audit(project_id, user, "view_repository", "document_repository", request=request)
    return {
        "project": {"project_id": project_id, "company_name": project.get("company_name")},
        "groups": groups,
        "summary": {
            "total_lines": total_lines,
            "uploaded": uploaded_count,
            "pending": pending_count,
        },
    }


class DocRepoCustomItem(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    remarks: Optional[str] = ""
    description: Optional[str] = ""
    parent_item_id: Optional[str] = None


class DocRepoItemPatch(BaseModel):
    description: Optional[str] = None
    title: Optional[str] = None
    remarks: Optional[str] = None


@router.post("/projects/{project_id}/document-repository/items")
async def add_repository_item(project_id: str, payload: DocRepoCustomItem, request: Request, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not (payload.title or "").strip() and not payload.parent_item_id:
        raise HTTPException(status_code=400, detail="Title is required")

    now = datetime.now(timezone.utc).isoformat()
    parent = None
    if payload.parent_item_id:
        parent = await db.document_repository.find_one({"item_id": payload.parent_item_id, "project_id": project_id}, {"_id": 0})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent line item not found")
        # Disallow nesting beyond one level
        if parent.get("parent_item_id"):
            raise HTTPException(status_code=400, detail="Sub-items cannot have further sub-items")

        category = parent["category"]
        category_order = parent["category_order"]
        sub_order = parent["sub_order"]
        # Compute next sub_line_order among siblings
        last_sib = await db.document_repository.find_one(
            {"project_id": project_id, "parent_item_id": payload.parent_item_id},
            {"sub_line_order": 1, "_id": 0},
            sort=[("sub_line_order", -1)],
        )
        sub_line_order = (last_sib.get("sub_line_order") or 0) + 1 if last_sib else 1
        # Default title if not provided
        title = (payload.title or "").strip() or f"Additional document for: {parent.get('title')}"
    else:
        # Top-level custom item (existing behaviour)
        category = (payload.category or "").strip()
        if not category:
            raise HTTPException(status_code=400, detail="Category is required for top-level lines")
        cat_entry = await db.document_repository.find_one({"project_id": project_id, "category": category}, {"category_order": 1, "_id": 0}, sort=[("category_order", 1)])
        if cat_entry:
            category_order = cat_entry["category_order"]
        else:
            last = await db.document_repository.find_one({"project_id": project_id}, {"category_order": 1, "_id": 0}, sort=[("category_order", -1)])
            category_order = (last["category_order"] + 1) if last else 1
        last_sub = await db.document_repository.find_one(
            {"project_id": project_id, "category": category, "parent_item_id": None},
            {"sub_order": 1, "_id": 0},
            sort=[("sub_order", -1)],
        )
        sub_order = (last_sub["sub_order"] + 1) if last_sub else 1
        sub_line_order = None
        title = payload.title.strip()

    item = {
        "item_id": f"dri_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "project_owner_id": user.user_id,
        "category": category,
        "category_order": category_order,
        "sub_order": sub_order,
        "sub_line_order": sub_line_order,
        "parent_item_id": payload.parent_item_id,
        "title": title,
        "remarks": (payload.remarks or "").strip(),
        "description": (payload.description or "").strip(),
        "is_custom": True,
        "file": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.document_repository.insert_one(item)
    item.pop("_id", None)
    await _log_project_audit(
        project_id, user,
        "add_sub_line" if payload.parent_item_id else "add_line",
        "document_repository",
        details={
            "item_id": item["item_id"],
            "title": item["title"],
            "category": item["category"],
            "parent_item_id": payload.parent_item_id,
        },
        request=request,
    )
    return {"message": "Line item added", "item": item}


@router.patch("/projects/{project_id}/document-repository/items/{item_id}")
async def patch_repository_item(project_id: str, item_id: str, payload: DocRepoItemPatch, request: Request, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    item = await db.document_repository.find_one({"item_id": item_id, "project_id": project_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Line item not found")
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    changed_fields = []
    if payload.description is not None and payload.description != item.get("description"):
        update["description"] = payload.description
        changed_fields.append("description")
    if payload.title is not None and payload.title.strip() and payload.title != item.get("title"):
        update["title"] = payload.title.strip()
        changed_fields.append("title")
    if payload.remarks is not None and payload.remarks != item.get("remarks"):
        update["remarks"] = payload.remarks
        changed_fields.append("remarks")
    if not changed_fields:
        return {"message": "No changes"}
    await db.document_repository.update_one({"item_id": item_id, "project_id": project_id}, {"$set": update})
    await _log_project_audit(
        project_id, user, "edit_line", "document_repository",
        details={"item_id": item_id, "title": item.get("title"), "fields": changed_fields},
        request=request,
    )
    return {"message": "Updated", "fields": changed_fields}


@router.delete("/projects/{project_id}/document-repository/items/{item_id}")
async def delete_repository_item(project_id: str, item_id: str, request: Request, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    item = await db.document_repository.find_one({"item_id": item_id, "project_id": project_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Line item not found")
    # If a file is attached, remove from GridFS as well
    if item.get("file") and item["file"].get("gridfs_id"):
        try:
            await fs_bucket.delete(ObjectId(item["file"]["gridfs_id"]))
        except Exception:
            pass
    await db.document_repository.delete_one({"item_id": item_id, "project_id": project_id})
    await _log_project_audit(
        project_id, user, "delete_line", "document_repository",
        details={"item_id": item_id, "title": item.get("title"), "had_file": bool(item.get("file")),
                 "deleted_filename": (item.get("file") or {}).get("filename")},
        request=request,
    )
    return {"message": "Line item deleted"}


@router.post("/projects/{project_id}/document-repository/items/{item_id}/upload")
async def upload_repository_file(
    project_id: str,
    item_id: str,
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    item = await db.document_repository.find_one({"item_id": item_id, "project_id": project_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Line item not found")

    content_type = (file.content_type or "").lower()
    is_image = content_type.startswith(DOCREPO_ALLOWED_IMAGE_PREFIX)
    is_allowed = content_type in DOCREPO_ALLOWED_MIME or is_image
    if not is_allowed:
        raise HTTPException(
            status_code=415,
            detail="Only PDF, Word (.doc/.docx), or image files are allowed. Please re-upload in a supported format.",
        )

    data = await file.read()
    size = len(data)
    if size > DOCREPO_MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the 5MB limit ({size / (1024*1024):.2f}MB). Please re-upload a smaller file.",
        )
    if size == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    is_reupload = bool(item.get("file"))
    # Delete previous file from GridFS if re-uploading
    if is_reupload and item["file"].get("gridfs_id"):
        try:
            await fs_bucket.delete(ObjectId(item["file"]["gridfs_id"]))
        except Exception:
            pass

    gridfs_id = await fs_bucket.upload_from_stream(file.filename, data, metadata={"project_id": project_id, "item_id": item_id})
    now = datetime.now(timezone.utc).isoformat()
    file_meta = {
        "filename": file.filename,
        "content_type": content_type,
        "size": size,
        "gridfs_id": str(gridfs_id),
        "uploaded_by_email": user.email,
        "uploaded_by_user_id": user.user_id,
        "uploaded_at": now,
    }
    await db.document_repository.update_one(
        {"item_id": item_id, "project_id": project_id},
        {"$set": {"file": file_meta, "updated_at": now}},
    )
    action = "reupload_document" if is_reupload else "upload_document"
    await _log_project_audit(
        project_id, user, action, "document_repository",
        details={
            "item_id": item_id,
            "title": item.get("title"),
            "filename": file.filename,
            "content_type": content_type,
            "size_bytes": size,
        },
        request=request,
    )
    # Hide gridfs_id from response
    safe_meta = {k: v for k, v in file_meta.items() if k != "gridfs_id"}
    return {"message": "File uploaded", "item_id": item_id, "file": safe_meta, "reupload": is_reupload}


@router.delete("/projects/{project_id}/document-repository/items/{item_id}/file")
async def delete_repository_file(project_id: str, item_id: str, request: Request, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    item = await db.document_repository.find_one({"item_id": item_id, "project_id": project_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Line item not found")
    if not item.get("file"):
        raise HTTPException(status_code=400, detail="No file attached to this item")
    gridfs_id = item["file"].get("gridfs_id")
    filename = item["file"].get("filename")
    if gridfs_id:
        try:
            await fs_bucket.delete(ObjectId(gridfs_id))
        except Exception:
            pass
    await db.document_repository.update_one(
        {"item_id": item_id, "project_id": project_id},
        {"$set": {"file": None, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await _log_project_audit(
        project_id, user, "delete_file", "document_repository",
        details={"item_id": item_id, "title": item.get("title"), "filename": filename},
        request=request,
    )
    return {"message": "File removed"}


@router.get("/projects/{project_id}/document-repository/items/{item_id}/download")
async def download_repository_file(project_id: str, item_id: str, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    item = await db.document_repository.find_one({"item_id": item_id, "project_id": project_id}, {"_id": 0})
    if not item or not item.get("file"):
        raise HTTPException(status_code=404, detail="File not found")
    gridfs_id = item["file"]["gridfs_id"]
    filename = item["file"]["filename"]
    content_type = item["file"].get("content_type") or "application/octet-stream"
    stream = await fs_bucket.open_download_stream(ObjectId(gridfs_id))
    data = await stream.read()
    return Response(content=data, media_type=content_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/projects/{project_id}/audit-log")
async def get_project_audit_log(project_id: str, request: Request, limit: int = 200, user: User = Depends(get_current_user)):
    """Returns the audit trail scoped strictly to this project only."""
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await _log_project_audit(project_id, user, "view_audit_log", "audit_log", request=request)
    logs = await db.project_audit_logs.find({"project_id": project_id}, {"_id": 0}).sort("timestamp", -1).to_list(max(1, min(limit, 1000)))
    return {
        "project": {"project_id": project_id, "company_name": project.get("company_name")},
        "logs": logs,
        "count": len(logs),
    }
