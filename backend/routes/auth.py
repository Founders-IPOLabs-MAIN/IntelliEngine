from fastapi import APIRouter, HTTPException, Depends, Request, Response, Body
from shared import (db, limiter, logger, User, get_current_user, is_master_admin,
    is_approved_admin, CENTRAL_ADMIN_EMAILS, DEFAULT_MODULE_PERMISSIONS, hash_password, verify_password,
    promote_new_user, SessionRequest, EmailAuthRequest,
    datetime, timezone, timedelta, uuid)
import httpx

router = APIRouter()

@router.post("/auth/session")
@limiter.limit("10/minute")
async def process_session(request: Request, session_request: SessionRequest, response: Response):
    """Process session_id from Emergent OAuth and create session"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        async with httpx.AsyncClient() as http_client:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_request.session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            auth_data = auth_response.json()
    except httpx.RequestError as e:
        logger.error(f"Auth request failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if changed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        auto_role = "master_admin" if email.lower() in [e.lower() for e in CENTRAL_ADMIN_EMAILS] else "Editor"
        is_admin_user = auto_role == "master_admin"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": auto_role,
            "company_id": None,
            "user_type": "internal" if is_admin_user else "new_user",
            "registration_module": "google_oauth",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        if is_admin_user:
            user_doc["module_permissions"] = {"assessment": True, "matchmaker": True, "drhp": True, "funding": True, "valuation": True}
            user_doc["is_master_admin"] = True
        await db.users.insert_one(user_doc)
    
    # Create session
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc, "session_token": session_token}

@router.get("/auth/me")
async def get_me(request: Request, user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    data = user.model_dump()
    if not data.get("module_permissions"):
        data["module_permissions"] = DEFAULT_MODULE_PERMISSIONS.copy()
    # Admin access: only users in Admin tab (user_type=internal, admin roles, or CENTRAL_ADMIN_EMAILS)
    data["is_admin"] = is_approved_admin(user)

    # Get login_role from session
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            data["login_role"] = session.get("login_role", "existing_user")
    if not data.get("user_type"):
        data["user_type"] = "existing_user"

    return data

@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ EMAIL/PASSWORD AUTH ============

import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

@router.post("/auth/register")
@limiter.limit("5/minute")
async def register_email(request: Request, data: dict = Body(...), response: Response = None):
    """Register a new user with email/password and optional mobile"""
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    name = (data.get("name") or "").strip() or email.split("@")[0]
    mobile = data.get("mobile", "").strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = await db.users.find_one({"email": email})
    if existing:
        if existing.get("password_hash"):
            raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")
        # User exists from Google OAuth but has no password — let them set one
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(password), "name": name or existing.get("name", "")}}
        )
        user_id = existing["user_id"]
        user_name = name or existing.get("name", "")
        user_role = existing.get("role", "Editor")
        user_picture = existing.get("picture")
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "mobile": mobile or None,
            "picture": None,
            "password_hash": hash_password(password),
            "auth_type": "email",
            "role": "Editor",
            "company_id": None,
            "user_type": "new_user",
            "registration_module": "email_signup",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        user_name = name
        user_role = "Editor"
        user_picture = None

    session_token = str(uuid.uuid4())
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60
    )

    return {
        "user": {
            "user_id": user_id, "email": email, "name": user_name,
            "role": user_role, "picture": user_picture,
            "is_admin": False
        },
        "session_token": session_token
    }

@router.post("/auth/check-email")
async def check_email_exists(data: dict = Body(...)):
    """Check if an email already exists in the system"""
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = await db.users.find_one({"email": email}, {"_id": 0, "email": 1, "auth_type": 1})
    return {"exists": bool(user), "email": email}

@router.post("/auth/forgot-password")
async def forgot_password(data: dict = Body(...)):
    """Forgot password — lookup by email or mobile, return masked email"""
    email = data.get("email", "").strip().lower()
    mobile = data.get("mobile", "").strip()

    user = None
    if email:
        user = await db.users.find_one({"email": email}, {"_id": 0, "email": 1, "user_id": 1, "name": 1})
    elif mobile:
        user = await db.users.find_one({"mobile": mobile}, {"_id": 0, "email": 1, "user_id": 1, "name": 1})

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email or mobile number")

    found_email = user.get("email", "")
    # Mask email: show first 2 chars + ****@domain
    if "@" in found_email:
        local, domain = found_email.split("@", 1)
        masked = local[:2] + "****@" + domain
    else:
        masked = "****"

    # Generate reset token
    reset_token = str(uuid.uuid4())
    await db.password_resets.insert_one({
        "user_id": user["user_id"],
        "email": found_email,
        "token": reset_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"email_found": masked, "reset_token": reset_token, "message": "Password reset ready"}

@router.post("/auth/reset-password")
async def reset_password(data: dict = Body(...)):
    """Reset password using token"""
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "").strip()

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    reset = await db.password_resets.find_one({"token": token})
    if not reset:
        raise HTTPException(status_code=404, detail="Invalid or expired reset token")

    expires = reset.get("expires_at", "")
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=410, detail="Reset token has expired")

    await db.users.update_one(
        {"user_id": reset["user_id"]},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    await db.password_resets.delete_many({"user_id": reset["user_id"]})

    return {"message": "Password reset successfully. You can now sign in."}

@router.post("/auth/lookup-mobile")
async def lookup_mobile(data: dict = Body(...)):
    """Lookup email by mobile number"""
    mobile = data.get("mobile", "").strip()
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number is required")
    user = await db.users.find_one({"mobile": mobile}, {"_id": 0, "email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this mobile number")
    email = user.get("email", "")
    if "@" in email:
        local, domain = email.split("@", 1)
        masked = local[:2] + "****@" + domain
    else:
        masked = "****"
    return {"email_found": masked}

@router.post("/auth/save-mobile")
async def save_mobile(data: dict = Body(...), user: User = Depends(get_current_user)):
    """Save mobile number for authenticated user (post Google Auth)"""
    mobile = data.get("mobile", "").strip()
    if not mobile or len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Valid mobile number is required")
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"mobile": mobile}})
    return {"message": "Mobile number saved"}

@router.post("/auth/login")
@limiter.limit("10/minute")
async def login_email(request: Request, data: dict = Body(...), response: Response = None):
    """Login with email/password and role selection"""
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    login_role = data.get("login_role", "existing_user")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    # Brute force check
    client_ip = request.client.host if request.client else "unknown"
    attempt_key = f"{client_ip}:{email}"
    attempts_doc = await db.login_attempts.find_one({"identifier": attempt_key})
    if attempts_doc and attempts_doc.get("count", 0) >= 5:
        locked_at = attempts_doc.get("locked_at")
        if locked_at:
            if isinstance(locked_at, str):
                locked_at = datetime.fromisoformat(locked_at)
            if locked_at.tzinfo is None:
                locked_at = locked_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - locked_at < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
            else:
                await db.login_attempts.delete_one({"identifier": attempt_key})

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        await db.login_attempts.update_one(
            {"identifier": attempt_key},
            {"$inc": {"count": 1}, "$set": {"locked_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": attempt_key},
            {"$inc": {"count": 1}, "$set": {"locked_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Validate login_role against actual user role
    user_role = user.get("role", "Editor").lower().replace(" ", "_")
    user_type = user.get("user_type", "existing_user")

    # Admin access: only users in Admin tab (user_type=internal, admin roles, or CENTRAL_ADMIN_EMAILS)
    is_internal = user.get("user_type") == "internal"
    has_admin_role = user_role in ["admin", "super_admin", "master_admin"]
    is_central = is_master_admin(email)
    is_admin_user = is_internal or has_admin_role or is_central

    if login_role == "admin":
        if not is_admin_user:
            raise HTTPException(status_code=403, detail="This account does not have admin access. Only approved administrators can sign in here.")
    elif login_role == "employee":
        if user_type != "employee" and not is_admin_user:
            raise HTTPException(status_code=403, detail="This account is not registered as an employee. Please contact your admin.")

    # Clear failed attempts on success
    await db.login_attempts.delete_many({"identifier": attempt_key})

    session_token = str(uuid.uuid4())
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "session_token": session_token,
        "login_role": login_role,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60
    )

    return {
        "user": {
            "user_id": user["user_id"], "email": user["email"], "name": user.get("name", ""),
            "role": user.get("role", "Editor"), "picture": user.get("picture"),
            "user_type": user_type, "login_role": login_role,
            "is_admin": is_admin_user
        },
        "session_token": session_token
    }
