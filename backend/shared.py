"""
Shared dependencies for all route modules.
Contains: DB connection, models, auth helpers, config, utility functions.
"""
from fastapi import HTTPException, Depends, Request, UploadFile
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from pathlib import Path
from slowapi import Limiter
from slowapi.util import get_remote_address
import os
import re
import uuid
import io
import logging
import asyncio
import bcrypt
import resend

# ============ INITIALIZATION ============

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GridFS bucket for document storage
fs_bucket = AsyncIOMotorGridFSBucket(db)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ EMAIL CONFIG ============

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
MASTER_ADMIN_EMAIL = os.environ.get('MASTER_ADMIN_EMAIL', 'ronraj2312@gmail.com')

if RESEND_API_KEY and RESEND_API_KEY != 're_placeholder_key':
    resend.api_key = RESEND_API_KEY

# ============ ADMIN CONFIG ============

CENTRAL_ADMIN_EMAILS = [
    "ronraj2312@gmail.com",
    "founders.ipolabs@gmail.com",
    "cajagrutisahu@gmail.com"
]

MASTER_ADMIN_CONFIG = {
    "email": "ronraj2312@gmail.com",
    "name": "Ronak Rajan",
    "title": "IPO Labs Operations",
    "role": "master_admin",
    "permissions": "all"
}

ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASSWORD = "admin@123"

DEFAULT_MODULE_PERMISSIONS = {
    "assessment": True,
    "matchmaker": True,
    "drhp": True,
    "funding": True,
    "valuation": True
}

# ============ FILE UPLOAD SECURITY ============

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

ALLOWED_FILE_TYPES = {
    "document": {
        "extensions": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"},
        "mime_types": {
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain", "text/csv"
        }
    },
    "image": {
        "extensions": {".jpg", ".jpeg", ".png", ".gif", ".webp"},
        "mime_types": {"image/jpeg", "image/png", "image/gif", "image/webp"}
    },
    "ocr_document": {
        "extensions": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"},
        "mime_types": {
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg", "image/png"
        }
    },
    "profile_picture": {
        "extensions": {".jpg", ".jpeg", ".png", ".webp"},
        "mime_types": {"image/jpeg", "image/png", "image/webp"}
    },
    "id_document": {
        "extensions": {".pdf", ".jpg", ".jpeg", ".png"},
        "mime_types": {"application/pdf", "image/jpeg", "image/png"}
    }
}

BLOCKED_EXTENSIONS = {
    ".zip", ".rar", ".7z", ".tar", ".gz", ".exe", ".dll", ".bat", ".cmd",
    ".sh", ".ps1", ".js", ".vbs", ".jar", ".msi", ".dmg", ".app", ".iso"
}

# ============ UTILITY FUNCTIONS ============

def sanitize_filename(filename: str, uploader_name: Optional[str] = None) -> str:
    filename = os.path.basename(filename)
    name, ext = os.path.splitext(filename)
    name = re.sub(r'[^\w\-]', '_', name)
    name = name[:50]
    if uploader_name:
        safe_uploader = re.sub(r'[^\w\-]', '_', uploader_name)[:20]
        name = f"{safe_uploader}_{name}"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return f"{name}_{timestamp}{ext.lower()}"


def validate_file_type(filename: str, content_type: str, context: str = "document") -> Tuple[bool, str]:
    ext = os.path.splitext(filename)[1].lower()
    if ext in BLOCKED_EXTENSIONS:
        return False, f"File type '{ext}' is not allowed. ZIP, executable, and archive files are blocked for security reasons."
    allowed = ALLOWED_FILE_TYPES.get(context, ALLOWED_FILE_TYPES["document"])
    if ext not in allowed["extensions"]:
        allowed_list = ", ".join(sorted(allowed["extensions"]))
        return False, f"Invalid file type '{ext}'. Allowed types for {context}: {allowed_list}"
    if content_type not in allowed["mime_types"]:
        return False, f"Invalid content type '{content_type}'. The file extension doesn't match its content."
    return True, ""


def validate_file_size(content: bytes) -> Tuple[bool, str]:
    size_mb = len(content) / (1024 * 1024)
    if len(content) > MAX_FILE_SIZE:
        return False, f"File size ({size_mb:.2f}MB) exceeds the maximum allowed size of 5MB. Please compress or reduce the file size."
    if len(content) > 4 * 1024 * 1024:
        logger.warning(f"Large file upload: {size_mb:.2f}MB (approaching 5MB limit)")
    return True, ""


async def scan_image_for_explicit_content(content: bytes, content_type: str) -> Tuple[bool, str]:
    if not content_type.startswith("image/"):
        return True, ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.warning("EMERGENT_LLM_KEY not configured - skipping content moderation")
            return True, ""
        chat = LlmChat(
            api_key=api_key, model="gemini-2.5-flash",
            system_message="You are a content moderation system. Analyze the image and respond with ONLY 'SAFE' or 'UNSAFE'. Mark as UNSAFE if the image contains: nudity, explicit sexual content, violence, gore, illegal content, or inappropriate material for a professional business platform."
        )
        import base64
        file_content = FileContentWithMimeType(
            content=base64.b64encode(content).decode("utf-8"), mime_type=content_type
        )
        response = await asyncio.to_thread(
            chat.send_message,
            UserMessage(text="Analyze this image for explicit or inappropriate content. Respond with ONLY 'SAFE' or 'UNSAFE'.", files=[file_content])
        )
        result = response.text.strip().upper()
        if "UNSAFE" in result:
            logger.warning("Explicit content detected in uploaded image")
            return False, "This image has been flagged as potentially containing inappropriate content. Such files are not allowed and will be deleted. Please upload appropriate professional content only."
        return True, ""
    except Exception as e:
        logger.error(f"Content moderation scan failed: {e}")
        return True, ""


async def validate_upload(
    file: UploadFile, content: bytes, context: str = "document",
    uploader_name: Optional[str] = None, scan_content: bool = True
) -> Tuple[str, List[str]]:
    warnings = []
    size_valid, size_error = validate_file_size(content)
    if not size_valid:
        raise HTTPException(status_code=400, detail=size_error)
    type_valid, type_error = validate_file_type(file.filename, file.content_type, context)
    if not type_valid:
        raise HTTPException(status_code=400, detail=type_error)
    if scan_content and file.content_type.startswith("image/"):
        is_safe, content_warning = await scan_image_for_explicit_content(content, file.content_type)
        if not is_safe:
            raise HTTPException(status_code=400, detail=content_warning)
    sanitized_name = sanitize_filename(file.filename, uploader_name)
    if file.content_type.startswith("image/"):
        warnings.append("Note: All uploaded images are scanned for inappropriate content. Files violating our content policy will be deleted.")
    return sanitized_name, warnings


def sanitize_regex_input(pattern: str) -> str:
    return re.escape(pattern)

# ============ PYDANTIC MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "Editor"
    company_id: Optional[str] = None
    module_permissions: Optional[dict] = None
    user_type: Optional[str] = None
    created_at: datetime


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str
    user_id: str
    company_name: str
    sector: str
    current_stage: str = "Assessment"
    progress_percentage: int = 0
    user_login_type: Optional[str] = None
    board_type: Optional[str] = None
    exchange: Optional[str] = None
    issue_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DRHPSection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    section_id: str
    project_id: str
    section_name: str
    content: dict = {}
    last_edited_by: Optional[str] = None
    status: str = "Draft"
    documents: List[str] = []
    created_at: datetime
    updated_at: datetime


class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    document_id: str
    user_id: str
    project_id: Optional[str] = None
    section_id: Optional[str] = None
    filename: str
    content_type: str
    gridfs_id: str
    ocr_text: Optional[str] = None
    ocr_status: str = "pending"
    file_size: int
    created_at: datetime


class SessionRequest(BaseModel):
    session_id: str


class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class ProjectCreate(BaseModel):
    company_name: str
    sector: str
    user_login_type: Optional[str] = None
    board_type: Optional[str] = None
    exchange: Optional[str] = None
    issue_type: Optional[str] = None


class ProjectUpdate(BaseModel):
    company_name: Optional[str] = None
    sector: Optional[str] = None
    current_stage: Optional[str] = None
    progress_percentage: Optional[int] = None


class SectionUpdate(BaseModel):
    content: Optional[dict] = None
    status: Optional[str] = None


class OCRRequest(BaseModel):
    document_id: str
    prompt: Optional[str] = "Extract all text from this document. Provide structured output."

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    if user_doc.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact an administrator.")
    return User(**user_doc)


async def promote_new_user(user_id: str):
    user_doc = await db.users.find_one({"user_id": user_id, "user_type": "new_user"})
    if user_doc:
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"user_type": "existing_user", "promoted_at": datetime.now(timezone.utc).isoformat()}}
        )


def is_master_admin(user_email: str) -> bool:
    return user_email.lower() in [e.lower() for e in CENTRAL_ADMIN_EMAILS]


async def ensure_master_admin_exists():
    all_perms = {"assessment": True, "matchmaker": True, "drhp": True, "funding": True, "valuation": True}
    for email in CENTRAL_ADMIN_EMAILS:
        existing = await db.users.find_one({"email": email})
        if existing:
            if existing.get("role") != "master_admin":
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"role": "master_admin", "is_master_admin": True, "module_permissions": all_perms}}
                )


def is_approved_admin(user: User) -> bool:
    """Check if user is an approved admin (appears in Admin tab of Admin Center).
    Only users with user_type='internal' or in CENTRAL_ADMIN_EMAILS can access admin features."""
    role_lower = (user.role or "").lower().replace(" ", "_")
    has_admin_role = role_lower in ["admin", "super_admin", "master_admin"]
    is_internal = user.user_type == "internal"
    is_central = is_master_admin(user.email)
    return is_internal or has_admin_role or is_central


async def require_admin(user: User = Depends(get_current_user)):
    if not is_approved_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_super_admin(user: User = Depends(get_current_user)):
    if user.role not in ["super_admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user


async def log_audit_action(user_id: str, action_type: str, module: str, details: str = None, resource_id: str = None):
    audit_entry = {
        "log_id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "action_type": action_type,
        "module": module,
        "details": details,
        "resource_id": resource_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip_address": None
    }
    await db.audit_logs.insert_one(audit_entry)


# ============ EMAIL NOTIFICATION ============

async def send_registration_email(
    recipient_email: str, professional_name: str, category: str,
    action: str, reason: Optional[str] = None, send_to_master_admin: bool = True
) -> dict:
    if not RESEND_API_KEY or RESEND_API_KEY == 're_placeholder_key':
        logger.warning("Resend API key not configured - skipping email")
        return {"status": "skipped", "message": "Email not configured"}

    if action == "approve":
        subject = f"Registration Approved - Welcome to SETU!"
        status_color = "#22c55e"
        status_text = "APPROVED"
        body_text = f"""<p>Congratulations! Your professional registration as a <strong>{category}</strong> has been approved.</p>
            <p>You are now part of India's premier IPO professional network.</p>"""
    elif action == "reject":
        subject = "Registration Update - Action Required"
        status_color = "#ef4444"
        status_text = "NOT APPROVED"
        body_text = f"""<p>We regret to inform you that your professional registration as a <strong>{category}</strong> could not be approved at this time.</p>
            {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}"""
    elif action == "reapply":
        subject = "Registration Update - Re-submission Required"
        status_color = "#f59e0b"
        status_text = "NEEDS RE-SUBMISSION"
        body_text = f"""<p>Your professional registration as a <strong>{category}</strong> requires some corrections before it can be approved.</p>
            {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}"""
    else:
        return {"status": "error", "message": f"Unknown action: {action}"}

    html_content = f"""<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#1DA1F2 0%,#0d8ecf 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;">SETU</h1><p style="color:rgba(255,255,255,0.9);margin:5px 0 0 0;">IPO Readiness Platform</p>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;">
            <div style="text-align:center;margin-bottom:20px;"><span style="background:{status_color};color:white;padding:8px 20px;border-radius:20px;font-weight:bold;">{status_text}</span></div>
            <p>Dear <strong>{professional_name}</strong>,</p>{body_text}
        </div></body></html>"""

    results = []
    try:
        params = {"from": SENDER_EMAIL, "to": [recipient_email], "subject": subject, "html": html_content}
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        results.append({"recipient": recipient_email, "status": "sent", "email_id": email_result.get("id")})
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        results.append({"recipient": recipient_email, "status": "failed", "error": str(e)})

    if send_to_master_admin and MASTER_ADMIN_EMAIL:
        try:
            admin_params = {"from": SENDER_EMAIL, "to": [MASTER_ADMIN_EMAIL],
                            "subject": f"[Admin] Registration {action.upper()}: {professional_name}",
                            "html": f"<p>Action: {status_text}</p><p>Professional: {professional_name}</p><p>Category: {category}</p>"}
            await asyncio.to_thread(resend.Emails.send, admin_params)
        except Exception as e:
            logger.error(f"Failed to send admin notification: {str(e)}")

    return {"status": "completed", "results": results}


# ============ SHARED CONSTANTS (used across modules) ============

DEFAULT_ROLES = {
    "super_admin": {
        "name": "Super Admin",
        "description": "Full access to all features and admin controls",
        "max_users": 3,
        "level": 100,
        "permissions": {
            "dashboard": ["read", "write", "delete"],
            "assessment": ["read", "write", "delete"],
            "drhp_builder": ["read", "write", "delete"],
            "funding": ["read", "write", "delete"],
            "matchmaker": ["read", "write", "delete"],
            "analytics": ["read", "write", "delete"],
            "admin_center": ["read", "write", "delete"],
            "user_management": ["read", "write", "delete"]
        }
    },
    "admin": {
        "name": "Admin",
        "description": "Manage users and most platform features",
        "max_users": None,
        "level": 80,
        "permissions": {
            "dashboard": ["read", "write"],
            "assessment": ["read", "write"],
            "drhp_builder": ["read", "write"],
            "funding": ["read", "write"],
            "matchmaker": ["read", "write"],
            "analytics": ["read", "write"],
            "admin_center": ["read"],
            "user_management": ["read", "write"]
        }
    },
    "editor": {
        "name": "Editor",
        "description": "Create and edit content across modules",
        "max_users": None,
        "level": 50,
        "permissions": {
            "dashboard": ["read"],
            "assessment": ["read", "write"],
            "drhp_builder": ["read", "write"],
            "funding": ["read"],
            "matchmaker": ["read"],
            "analytics": ["read"],
            "admin_center": [],
            "user_management": []
        }
    },
    "viewer": {
        "name": "Viewer",
        "description": "View-only access to platform content",
        "max_users": None,
        "level": 10,
        "permissions": {
            "dashboard": ["read"],
            "assessment": ["read"],
            "drhp_builder": ["read"],
            "funding": ["read"],
            "matchmaker": ["read"],
            "analytics": ["read"],
            "admin_center": [],
            "user_management": []
        }
    }
}

PLATFORM_FEATURES = [
    {"id": "dashboard", "name": "Dashboard", "description": "Main dashboard and overview"},
    {"id": "assessment", "name": "IPO Assessment", "description": "IPO readiness assessment tool"},
    {"id": "drhp_builder", "name": "DRHP Builder", "description": "Draft Red Herring Prospectus builder"},
    {"id": "funding", "name": "IPO Funding", "description": "Funding options and partners"},
    {"id": "matchmaker", "name": "The Match-Making Platform", "description": "Professional matching service"},    {"id": "analytics", "name": "Analytics", "description": "Market and DRHP analytics"},
    {"id": "admin_center", "name": "Admin Center", "description": "Role and user management"},
    {"id": "user_management", "name": "User Management", "description": "Manage team members"}
]

SUBSCRIPTION_PLANS = [
    {
        "plan_id": "free",
        "name": "Free",
        "price": 0,
        "currency": "INR",
        "billing_cycle": "monthly",
        "features": ["IPO Assessment", "Basic DRHP Templates", "Match Maker Access"],
        "limits": {"projects": 1, "users": 1, "storage_gb": 1}
    },
    {
        "plan_id": "starter",
        "name": "Starter",
        "price": 9999,
        "currency": "INR",
        "billing_cycle": "monthly",
        "features": ["Everything in Free", "Full DRHP Builder", "Funding Module", "5 Team Members"],
        "limits": {"projects": 3, "users": 5, "storage_gb": 10},
        "razorpay_plan_id": "plan_PLACEHOLDER_STARTER"  # Razorpay placeholder
    },
    {
        "plan_id": "professional",
        "name": "Professional",
        "price": 24999,
        "currency": "INR",
        "billing_cycle": "monthly",
        "features": ["Everything in Starter", "Analytics Module", "Priority Support", "Unlimited Projects"],
        "limits": {"projects": -1, "users": 20, "storage_gb": 50},
        "razorpay_plan_id": "plan_PLACEHOLDER_PROFESSIONAL"  # Razorpay placeholder
    },
    {
        "plan_id": "enterprise",
        "name": "Enterprise",
        "price": 99999,
        "currency": "INR",
        "billing_cycle": "monthly",
        "features": ["Everything in Professional", "Dedicated Account Manager", "Custom Integrations", "SLA"],
        "limits": {"projects": -1, "users": -1, "storage_gb": -1},
        "razorpay_plan_id": "plan_PLACEHOLDER_ENTERPRISE"  # Razorpay placeholder
    }
]
