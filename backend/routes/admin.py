from fastapi import APIRouter, HTTPException, Depends, Request, Response, Body
from shared import (
    DEFAULT_ROLES, PLATFORM_FEATURES,db, limiter, logger, User, get_current_user,
    require_admin, require_super_admin, log_audit_action, is_master_admin,
    CENTRAL_ADMIN_EMAILS, DEFAULT_MODULE_PERMISSIONS,
    hash_password, verify_password, EmailAuthRequest,
    datetime, timezone, timedelta, uuid)
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ============ ADMIN CENTER MODULE ============


# Default Roles and Permissions


# Admin Center Models
class RoleCreate(BaseModel):
    role_id: str
    name: str
    description: str
    permissions: dict

class UserRoleAssignment(BaseModel):
    user_email: str
    role_id: str


class AuditLogEntry(BaseModel):
    action_type: str  # login, logout, view, create, update, delete, download
    module: str
    details: Optional[str] = None
    resource_id: Optional[str] = None

@router.get("/admin/roles")
async def get_all_roles(user: User = Depends(require_admin)):
    """Get all available roles with their permissions"""
    # Get custom roles from DB
    custom_roles = await db.custom_roles.find({}, {"_id": 0}).to_list(100)
    
    # Combine default and custom roles
    all_roles = []
    for role_id, role_data in DEFAULT_ROLES.items():
        all_roles.append({
            "role_id": role_id,
            "is_default": True,
            **role_data
        })
    
    for custom_role in custom_roles:
        all_roles.append({**custom_role, "is_default": False})
    
    return {"roles": all_roles}

@router.get("/admin/features")
async def get_platform_features(user: User = Depends(require_admin)):
    """Get all platform features for permission matrix"""
    return {"features": PLATFORM_FEATURES}

@router.get("/admin/permission-matrix")
async def get_permission_matrix(user: User = Depends(require_admin)):
    """Get full permission matrix (roles vs features)"""
    roles_response = await get_all_roles(user)
    roles = roles_response["roles"]
    
    matrix = []
    for feature in PLATFORM_FEATURES:
        row = {"feature": feature}
        for role in roles:
            permissions = role.get("permissions", {}).get(feature["id"], [])
            row[role["role_id"]] = permissions
        matrix.append(row)
    
    return {
        "matrix": matrix,
        "roles": [{"role_id": r["role_id"], "name": r["name"]} for r in roles],
        "features": PLATFORM_FEATURES
    }

@router.post("/admin/roles")
async def create_custom_role(
    role_data: RoleCreate,
    user: User = Depends(require_super_admin)
):
    """Create a new custom role"""
    # Check if role_id already exists
    existing = await db.custom_roles.find_one({"role_id": role_data.role_id})
    if existing or role_data.role_id in DEFAULT_ROLES:
        raise HTTPException(status_code=400, detail="Role ID already exists")
    
    role_doc = {
        "role_id": role_data.role_id,
        "name": role_data.name,
        "description": role_data.description,
        "permissions": role_data.permissions,
        "max_users": None,
        "level": 30,  # Custom roles have medium level
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.custom_roles.insert_one(role_doc)
    await log_audit_action(user.user_id, "create", "admin_center", f"Created role: {role_data.name}", role_data.role_id)
    
    return {"message": "Role created successfully", "role_id": role_data.role_id}

@router.put("/admin/roles/{role_id}")
async def update_role_permissions(
    role_id: str,
    permissions: dict,
    user: User = Depends(require_super_admin)
):
    """Update permissions for a role"""
    if role_id in DEFAULT_ROLES:
        raise HTTPException(status_code=400, detail="Cannot modify default roles")
    
    result = await db.custom_roles.update_one(
        {"role_id": role_id},
        {"$set": {"permissions": permissions, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    await log_audit_action(user.user_id, "update", "admin_center", f"Updated role permissions: {role_id}", role_id)
    
    return {"message": "Role updated successfully"}

@router.delete("/admin/roles/{role_id}")
async def delete_custom_role(
    role_id: str,
    user: User = Depends(require_super_admin)
):
    """Delete a custom role"""
    if role_id in DEFAULT_ROLES:
        raise HTTPException(status_code=400, detail="Cannot delete default roles")
    
    result = await db.custom_roles.delete_one({"role_id": role_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Reset users with this role to 'viewer'
    await db.users.update_many({"role": role_id}, {"$set": {"role": "viewer"}})
    
    await log_audit_action(user.user_id, "delete", "admin_center", f"Deleted role: {role_id}", role_id)
    
    return {"message": "Role deleted successfully"}

@router.get("/admin/users")
async def get_all_users(user: User = Depends(require_admin), user_type: Optional[str] = None):
    """Get all users with their roles. Filter by user_type: internal or external"""
    query = {}
    if user_type == "internal":
        query["$or"] = [{"user_type": "internal"}, {"user_type": {"$exists": False}}, {"role": {"$in": ["admin", "super_admin", "master_admin"]}}]
    elif user_type == "external":
        query["user_type"] = "external"
    elif user_type == "employee":
        query["user_type"] = "employee"
    elif user_type == "existing_user":
        query["user_type"] = "existing_user"
    elif user_type == "new_user":
        query["user_type"] = "new_user"

    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(500)
    
    # Add role details and default permissions
    for u in users:
        role_id = u.get("role", "viewer").lower().replace(" ", "_")
        if role_id in DEFAULT_ROLES:
            u["role_details"] = DEFAULT_ROLES[role_id]
        else:
            custom_role = await db.custom_roles.find_one({"role_id": role_id}, {"_id": 0})
            u["role_details"] = custom_role if custom_role else DEFAULT_ROLES["viewer"]
        if not u.get("module_permissions"):
            u["module_permissions"] = DEFAULT_MODULE_PERMISSIONS.copy()
    
    return {"users": users}

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user: User = Depends(require_admin)):
    """Permanently delete a user and all their sessions"""
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("email") in CENTRAL_ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Cannot delete a Central Admin account")

    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})

    await log_audit_action(
        user.user_id, "delete", "user_management",
        f"Deleted user {target.get('email')} ({user_id})", user_id
    )
    return {"message": f"User {target.get('email')} deleted"}

@router.post("/admin/users/{user_id}/suspend")
async def admin_suspend_user(user_id: str, user: User = Depends(require_admin)):
    """Suspend a user — revokes all access"""
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("email") in CENTRAL_ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Cannot suspend a Central Admin account")

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc).isoformat(), "suspended_by": user.user_id}}
    )
    await db.user_sessions.delete_many({"user_id": user_id})

    await log_audit_action(
        user.user_id, "update", "user_management",
        f"Suspended user {target.get('email')}", user_id
    )
    return {"message": f"User {target.get('email')} suspended"}

@router.post("/admin/users/{user_id}/unsuspend")
async def admin_unsuspend_user(user_id: str, user: User = Depends(require_admin)):
    """Reactivate a suspended user"""
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"status": "active"}, "$unset": {"suspended_at": "", "suspended_by": ""}}
    )

    await log_audit_action(
        user.user_id, "update", "user_management",
        f"Unsuspended user {target.get('email')}", user_id
    )
    return {"message": f"User {target.get('email')} reactivated"}

@router.post("/admin/users/{user_id}/transfer")
async def admin_transfer_user(user_id: str, user: User = Depends(require_admin)):
    """Transfer a user from external to internal"""
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("user_type") not in ["external", "new_user"]:
        raise HTTPException(status_code=400, detail="Only external/new users can be transferred")

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"user_type": "internal", "transferred_at": datetime.now(timezone.utc).isoformat(), "transferred_by": user.user_id}}
    )

    await log_audit_action(
        user.user_id, "update", "user_management",
        f"Transferred user {target.get('email')} from external to internal", user_id
    )
    return {"message": f"User {target.get('email')} transferred to internal"}

@router.post("/admin/users/assign-role")
async def assign_user_role(
    assignment: UserRoleAssignment,
    user: User = Depends(require_admin)
):
    """Assign a role to a user"""
    # Find user by email
    target_user = await db.users.find_one({"email": assignment.user_email})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate role exists
    role_id = assignment.role_id.lower().replace(" ", "_")
    if role_id not in DEFAULT_ROLES:
        custom_role = await db.custom_roles.find_one({"role_id": role_id})
        if not custom_role:
            raise HTTPException(status_code=404, detail="Role not found")
    
    # Check super_admin limit
    if role_id == "super_admin":
        super_admin_count = await db.users.count_documents({"role": "super_admin"})
        if super_admin_count >= 3:
            raise HTTPException(status_code=400, detail="Maximum of 3 Super Admins allowed")
        # Only super admin can assign super admin role
        if user.role.lower().replace(" ", "_") != "super_admin":
            raise HTTPException(status_code=403, detail="Only Super Admin can assign Super Admin role")
    
    # Update user role
    await db.users.update_one(
        {"email": assignment.user_email},
        {"$set": {"role": role_id, "role_updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_audit_action(
        user.user_id, "update", "user_management",
        f"Assigned role '{role_id}' to user: {assignment.user_email}",
        target_user.get("user_id")
    )
    
    return {"message": f"Role '{role_id}' assigned to {assignment.user_email}"}

class AddUserRequest(BaseModel):
    email: str
    name: Optional[str] = None
    role: str = "editor"
    user_type: str = "existing_user"

@router.post("/admin/users/add")
async def admin_add_user(data: AddUserRequest, user: User = Depends(require_admin)):
    """Admin adds a new user by email with a role and user_type"""
    email = data.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    role_id = data.role.lower().replace(" ", "_")
    valid_roles = list(DEFAULT_ROLES.keys()) + ["master_admin"]
    if role_id not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    user_type = data.user_type if data.user_type in ["employee", "existing_user", "new_user"] else "existing_user"
    name = (data.name or "").strip() or email.split("@")[0]
    user_id = f"user_{uuid.uuid4().hex[:12]}"

    new_user = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": None,
        "role": role_id,
        "user_type": user_type,
        "auth_type": "invited",
        "status": "active",
        "company_id": None,
        "module_permissions": DEFAULT_MODULE_PERMISSIONS.copy(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "invited_by": user.user_id
    }
    await db.users.insert_one(new_user)

    await log_audit_action(
        user.user_id, "create", "user_management",
        f"Added {user_type} user {email} with role '{role_id}'",
        user_id
    )

    new_user.pop("_id", None)
    return {"message": f"User {email} added as {user_type} with role '{role_id}'", "user": new_user}

@router.get("/admin/audit-logs")
async def get_audit_logs(
    user: User = Depends(require_admin),
    limit: int = 100,
    offset: int = 0,
    action_type: Optional[str] = None,
    module: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Get audit logs with filtering"""
    query = {}
    if action_type:
        query["action_type"] = action_type
    if module:
        query["module"] = module
    if user_id:
        query["user_id"] = user_id
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.audit_logs.count_documents(query)
    
    # Enrich with user names
    for log in logs:
        if "user_id" in log and log["user_id"]:
            log_user = await db.users.find_one({"user_id": log["user_id"]}, {"name": 1, "email": 1, "_id": 0})
            if log_user:
                log["user_name"] = log_user.get("name", "Unknown")
                log["user_email"] = log_user.get("email", "Unknown")
            else:
                log["user_name"] = "Unknown"
                log["user_email"] = "Unknown"
        else:
            log["user_name"] = "System"
            log["user_email"] = "system@ipolabs.com"
    
    return {"logs": logs, "total": total, "limit": limit, "offset": offset}

@router.post("/admin/audit-logs")
async def create_audit_log(
    entry: AuditLogEntry,
    user: User = Depends(get_current_user)
):
    """Create an audit log entry (for frontend tracking)"""
    await log_audit_action(user.user_id, entry.action_type, entry.module, entry.details, entry.resource_id)
    return {"message": "Audit log created"}

@router.post("/admin/login")
@limiter.limit("5/minute")
async def admin_login(request: Request, data: EmailAuthRequest, response: Response):
    """Admin-only login endpoint"""
    email = data.email.strip().lower()
    password = data.password.strip()

    admin_user = await db.users.find_one({"email": email}, {"_id": 0})
    if not admin_user:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Hard rule: only users in Admin tab (user_type=internal, admin roles, or CENTRAL_ADMIN_EMAILS)
    role_lower = (admin_user.get("role") or "").lower().replace(" ", "_")
    is_internal = admin_user.get("user_type") == "internal"
    has_admin_role = role_lower in ["admin", "super_admin", "master_admin"]
    is_central = is_master_admin(email)
    if not (is_internal or has_admin_role or is_central):
        raise HTTPException(status_code=403, detail="This account does not have admin privileges. Only approved administrators can sign in here.")

    if not admin_user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Admin password not set. Contact support.")

    if not verify_password(password, admin_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    session_token = str(uuid.uuid4())
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": admin_user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=24*60*60
    )

    return {
        "user": {
            "user_id": admin_user["user_id"],
            "email": admin_user["email"],
            "name": admin_user.get("name", ""),
            "role": admin_user.get("role", "admin"),
        },
        "session_token": session_token,
        "is_admin": True
    }

@router.get("/admin/users/{user_id}/permissions")
async def get_user_permissions(user_id: str, user: User = Depends(require_admin)):
    """Get a user's module permissions"""
    # First check if user exists (without projection to avoid empty dict issue)
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return {"permissions": target.get("module_permissions", DEFAULT_MODULE_PERMISSIONS)}

@router.put("/admin/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, data: dict = Body(...), user: User = Depends(require_admin)):
    """Update a user's module permissions"""
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    permissions = data.get("permissions", {})
    valid_modules = ["assessment", "matchmaker", "drhp", "funding"]
    clean_perms = {}
    for mod in valid_modules:
        clean_perms[mod] = bool(permissions.get(mod, DEFAULT_MODULE_PERMISSIONS.get(mod, False)))

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"module_permissions": clean_perms}}
    )

    await log_audit_action(
        user.user_id, "update", "user_management",
        f"Updated module permissions for {target.get('email')}: {clean_perms}",
        user_id
    )

    return {"status": "updated", "permissions": clean_perms}
