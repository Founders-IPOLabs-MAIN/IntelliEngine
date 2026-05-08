"""
SETU API - Main Application Entry Point
Thin orchestrator that imports modular route files.
"""
from fastapi import FastAPI, APIRouter, Request
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import os
import logging

from shared import (
    client, db, limiter, logger,
    hash_password, ensure_master_admin_exists,
    ADMIN_EMAIL, ADMIN_PASSWORD, DEFAULT_MODULE_PERMISSIONS
)
from datetime import datetime, timezone
import uuid

# ============ APP CREATION ============

app = FastAPI(title="SETU API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create the main API router with /api prefix
api_router = APIRouter(prefix="/api")

# ============ IMPORT ROUTE MODULES ============

from routes.auth import router as auth_router
from routes.projects import router as projects_router
from routes.documents import router as documents_router
from routes.drhp import router as drhp_router
from routes.matchmaker import router as matchmaker_router
from routes.funding import router as funding_router
from routes.assessment import router as assessment_router
from routes.admin import router as admin_router
from routes.account import router as account_router
from routes.command_center import router as command_center_router
from routes.trackers import router as trackers_router
from routes.market import router as market_router
from routes.valuation import router as valuation_router
from routes.careers import router as careers_router
from routes.contact import router as contact_router
from routes.document_repository import router as document_repository_router
from routes.expert_registration import router as expert_registration_router
from routes.doceditor_proxy import router as doceditor_proxy_router
from routes.payments import router as payments_router
from routes.consent import router as consent_router
from routes.market_analytics import router as market_analytics_router
from routes.bv_projects import router as bv_projects_router

# ============ INCLUDE ALL ROUTERS ============

api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(documents_router)
api_router.include_router(drhp_router)
api_router.include_router(matchmaker_router)
api_router.include_router(funding_router)
api_router.include_router(assessment_router)
api_router.include_router(admin_router)
api_router.include_router(account_router)
api_router.include_router(command_center_router)
api_router.include_router(trackers_router)
api_router.include_router(market_router)
api_router.include_router(valuation_router)
api_router.include_router(careers_router)
api_router.include_router(contact_router)
api_router.include_router(document_repository_router)
api_router.include_router(expert_registration_router)
api_router.include_router(doceditor_proxy_router)
api_router.include_router(payments_router)
api_router.include_router(consent_router)
api_router.include_router(market_analytics_router)
api_router.include_router(bv_projects_router)

# ============ ROOT & HEALTH ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "SETU API v1.0", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the main router
app.include_router(api_router)

# ============ SECURITY MIDDLEWARE ============

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# CORS Configuration
cors_origins = os.environ.get('CORS_ORIGINS', '').split(',')
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]
if not cors_origins or cors_origins == ['*']:
    logger.warning("CORS is set to allow all origins. Configure CORS_ORIGINS for production!")
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Session-ID"],
)

app.add_middleware(GZipMiddleware, minimum_size=1024)
# ============ STARTUP & SHUTDOWN ============

@app.on_event("startup")
async def create_indexes():
    try:
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
        await db.users.create_index("email", unique=True)
        await db.projects.create_index("user_id")
        await db.projects.create_index("project_id", unique=True)
        await db.drhp_sections.create_index("project_id")
        await db.drhp_sections.create_index("section_id", unique=True)
        await db.audit_logs.create_index("timestamp")
        logger.info("MongoDB indexes created successfully")
    except Exception as e:
        logger.error(f"Index creation error: {e}")

    # Seed admin account
    try:
        existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
        if not existing_admin:
            await db.users.insert_one({
                "user_id": f"admin_{uuid.uuid4().hex[:12]}",
                "email": ADMIN_EMAIL,
                "name": "Platform Admin",
                "picture": None,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "auth_type": "email",
                "role": "admin",
                "company_id": None,
                "module_permissions": DEFAULT_MODULE_PERMISSIONS.copy(),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Admin account seeded: {ADMIN_EMAIL}")
        elif not existing_admin.get("password_hash"):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin"}}
            )
            logger.info(f"Admin password updated for: {ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Admin seeding error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
