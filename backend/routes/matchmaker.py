from fastapi import APIRouter, HTTPException, Depends, Body
from shared import (db, logger, User, get_current_user, is_master_admin,
    CENTRAL_ADMIN_EMAILS, MASTER_ADMIN_CONFIG, MASTER_ADMIN_EMAIL, RESEND_API_KEY, SENDER_EMAIL,
    promote_new_user, send_registration_email, sanitize_regex_input, require_admin,
    datetime, timezone, uuid, os)
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import re as regex_module

router = APIRouter()

# ============ MASTER ADMIN CONFIGURATION ============

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

def is_master_admin(user_email: str) -> bool:
    """Check if user is a central admin"""
    return user_email.lower() in [e.lower() for e in CENTRAL_ADMIN_EMAILS]

async def ensure_master_admin_exists():
    """Ensure all central admin users exist in database with correct role"""
    all_perms = {"assessment": True, "matchmaker": True, "drhp": True, "funding": True, "valuation": True}
    for email in CENTRAL_ADMIN_EMAILS:
        existing = await db.users.find_one({"email": email})
        if existing:
            if existing.get("role") != "master_admin":
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"role": "master_admin", "is_master_admin": True, "module_permissions": all_perms}}
                )
    # If user doesn't exist, they'll be created on first login with master admin role

# ============ MATCH MAKER MODELS ============

# ---- Wallets & Credit Economy ----
import re as regex_module

CIN_REGEX = r'^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$'
GSTIN_REGEX = r'^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$'

DEFAULT_ISSUER_CREDITS = 5
DEFAULT_EXPERT_TOKENS = 3
COST_PER_UNLOCK = 1

LISTING_INTENT_OPTIONS = ["immediate", "midterm", "discovery"]
CONTACT_PERSONA_OPTIONS = ["founder", "md", "cfo", "company_ca"]

class IssuerRegisterRequest(BaseModel):
    company_name: str
    cin: str
    gstin: str
    mobile: str
    email: str
    listing_intent: str
    contact_persona: str
    hiring: bool = False
    hiring_experts: Optional[list] = None

class ConnectionRequest(BaseModel):
    target_id: str
    target_type: str = "expert"

# --- Wallet endpoints ---

@router.get("/matchmaker/wallet")
async def get_wallet(user: User = Depends(get_current_user)):
    """Get current user's wallet"""
    wallet = await db.wallets.find_one({"user_id": user.user_id}, {"_id": 0})
    if not wallet:
        wallet = {
            "user_id": user.user_id,
            "issuer_credits": DEFAULT_ISSUER_CREDITS,
            "expert_tokens": DEFAULT_EXPERT_TOKENS,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wallets.insert_one(wallet)
        wallet.pop("_id", None)
    return wallet

@router.post("/matchmaker/wallet/topup")
async def topup_wallet(data: dict = Body(...), user: User = Depends(get_current_user)):
    """MOCKED - Top up wallet with credits/tokens (Razorpay integration pending)"""
    credit_type = data.get("type", "issuer_credits")
    amount = int(data.get("amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if credit_type not in ["issuer_credits", "expert_tokens"]:
        raise HTTPException(status_code=400, detail="Invalid credit type")

    wallet = await db.wallets.find_one({"user_id": user.user_id})
    if not wallet:
        wallet = {"user_id": user.user_id, "issuer_credits": DEFAULT_ISSUER_CREDITS, "expert_tokens": DEFAULT_EXPERT_TOKENS, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.wallets.insert_one(wallet)

    await db.wallets.update_one(
        {"user_id": user.user_id},
        {"$inc": {credit_type: amount}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    updated = await db.wallets.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"message": f"MOCKED: Added {amount} {credit_type}", "wallet": updated}

# --- Issuer endpoints ---

@router.post("/matchmaker/issuer/register")
async def register_issuer(data: IssuerRegisterRequest, user: User = Depends(get_current_user)):
    """Register as an IPO-bound issuer company"""
    existing = await db.issuer_profiles.find_one({"user_id": user.user_id})
    if existing:
        raise HTTPException(status_code=409, detail="Issuer profile already exists")

    cin = data.cin.strip().upper()
    gstin = data.gstin.strip().upper()

    if not regex_module.match(CIN_REGEX, cin):
        raise HTTPException(status_code=400, detail="Invalid CIN format")
    if not regex_module.match(GSTIN_REGEX, gstin):
        raise HTTPException(status_code=400, detail="Invalid GSTIN format")
    if data.listing_intent not in LISTING_INTENT_OPTIONS:
        raise HTTPException(status_code=400, detail="Invalid listing intent")
    if data.contact_persona not in CONTACT_PERSONA_OPTIONS:
        raise HTTPException(status_code=400, detail="Invalid contact persona")

    # MOCKED MCA21/GSTN auto-fill
    mca_data = {
        "registered_address": "Auto-filled address (MCA API pending)",
        "date_of_incorporation": "2020-01-15",
        "authorized_capital": "10,00,00,000"
    }

    profile = {
        "issuer_id": f"issuer_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "company_name": data.company_name.strip(),
        "cin": cin,
        "gstin": gstin,
        "mobile": data.mobile.strip(),
        "email": data.email.strip().lower(),
        "listing_intent": data.listing_intent,
        "contact_persona": data.contact_persona,
        "hiring": data.hiring,
        "hiring_experts": data.hiring_experts or [],
        "mca_data": mca_data,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.issuer_profiles.insert_one(profile)
    profile.pop("_id", None)
    await promote_new_user(user.user_id)

    # Initialize wallet
    existing_wallet = await db.wallets.find_one({"user_id": user.user_id})
    if not existing_wallet:
        await db.wallets.insert_one({
            "user_id": user.user_id,
            "issuer_credits": DEFAULT_ISSUER_CREDITS,
            "expert_tokens": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # Tag user as external with module
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"registration_module": "matchmaker_issuer"}}
    )

    return {"message": "Issuer registered successfully", "profile": profile, "mca_data": mca_data}

@router.get("/matchmaker/issuer/profile")
async def get_issuer_profile(user: User = Depends(get_current_user)):
    """Get current user's issuer profile"""
    profile = await db.issuer_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        return {"profile": None}
    return {"profile": profile}

@router.get("/matchmaker/issuer/dashboard")
async def get_issuer_dashboard(user: User = Depends(get_current_user)):
    """Get issuer dashboard data"""
    profile = await db.issuer_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    wallet = await db.wallets.find_one({"user_id": user.user_id}, {"_id": 0})
    if not wallet:
        wallet = {"issuer_credits": DEFAULT_ISSUER_CREDITS, "expert_tokens": 0}

    connections = await db.connections.find({"requester_id": user.user_id}).to_list(100)
    total_connections = len(connections)
    accepted = len([c for c in connections if c.get("status") == "accepted"])
    pending = len([c for c in connections if c.get("status") == "pending"])

    # Get IPO readiness score if available
    assessment = await db.ipo_assessments.find_one(
        {"user_id": user.user_id}, {"_id": 0, "readiness_score": 1}
    )

    return {
        "profile": profile,
        "wallet": wallet,
        "stats": {
            "available_credits": wallet.get("issuer_credits", 0),
            "ipo_readiness_score": assessment.get("readiness_score") if assessment else None,
            "expert_consultations": accepted,
            "pending_requests": pending,
            "total_connections": total_connections
        }
    }

# --- Expert dashboard ---

@router.get("/matchmaker/expert/dashboard")
async def get_expert_dashboard(user: User = Depends(get_current_user)):
    """Get expert dashboard data"""
    wallet = await db.wallets.find_one({"user_id": user.user_id}, {"_id": 0})
    if not wallet:
        wallet = {"issuer_credits": 0, "expert_tokens": DEFAULT_EXPERT_TOKENS}

    # Leads unlocked = connections initiated by this expert
    connections = await db.connections.find({"requester_id": user.user_id}).to_list(100)
    leads_unlocked = len([c for c in connections if c.get("status") == "accepted"])

    # Active invitations = connections where this expert is the target
    invitations = await db.connections.find({"target_id": user.user_id, "status": "pending"}).to_list(100)

    return {
        "wallet": wallet,
        "stats": {
            "available_tokens": wallet.get("expert_tokens", 0),
            "leads_unlocked": leads_unlocked,
            "active_invitations": len(invitations)
        }
    }

# --- Connection / Handshake endpoints ---

@router.post("/matchmaker/connections/request")
async def create_connection_request(data: ConnectionRequest, user: User = Depends(get_current_user)):
    """Send a connection request (deducts credits/tokens)"""
    # Check if connection already exists
    existing = await db.connections.find_one({
        "requester_id": user.user_id,
        "target_id": data.target_id,
        "status": {"$in": ["pending", "accepted"]}
    })
    if existing:
        raise HTTPException(status_code=409, detail="Connection already exists")

    wallet = await db.wallets.find_one({"user_id": user.user_id})
    if not wallet:
        raise HTTPException(status_code=400, detail="No wallet found. Please register first.")

    # Determine deduction type
    issuer_profile = await db.issuer_profiles.find_one({"user_id": user.user_id})
    if issuer_profile:
        if wallet.get("issuer_credits", 0) < COST_PER_UNLOCK:
            raise HTTPException(status_code=402, detail="Insufficient credits. Please top up.")
        deduct_field = "issuer_credits"
    else:
        if wallet.get("expert_tokens", 0) < COST_PER_UNLOCK:
            raise HTTPException(status_code=402, detail="Insufficient tokens. Please top up.")
        deduct_field = "expert_tokens"

    connection = {
        "connection_id": f"conn_{uuid.uuid4().hex[:12]}",
        "requester_id": user.user_id,
        "requester_type": "issuer" if issuer_profile else "expert",
        "target_id": data.target_id,
        "target_type": data.target_type,
        "status": "pending",
        "credits_deducted": COST_PER_UNLOCK if deduct_field == "issuer_credits" else 0,
        "tokens_deducted": COST_PER_UNLOCK if deduct_field == "expert_tokens" else 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.connections.insert_one(connection)
    connection.pop("_id", None)

    await db.wallets.update_one(
        {"user_id": user.user_id},
        {"$inc": {deduct_field: -COST_PER_UNLOCK}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {"message": "Connection request sent", "connection": connection}

@router.post("/matchmaker/connections/{connection_id}/accept")
async def accept_connection(connection_id: str, user: User = Depends(get_current_user)):
    """Accept a connection request — unlocks PII for both parties"""
    conn = await db.connections.find_one({"connection_id": connection_id, "target_id": user.user_id, "status": "pending"})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    await db.connections.update_one(
        {"connection_id": connection_id},
        {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Connection accepted — contact details unlocked"}

@router.post("/matchmaker/connections/{connection_id}/reject")
async def reject_connection(connection_id: str, user: User = Depends(get_current_user)):
    """Reject a connection request"""
    conn = await db.connections.find_one({"connection_id": connection_id, "target_id": user.user_id, "status": "pending"})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    await db.connections.update_one(
        {"connection_id": connection_id},
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Connection rejected"}

@router.get("/matchmaker/connections")
async def get_connections(user: User = Depends(get_current_user)):
    """Get all connections for the current user"""
    sent = await db.connections.find({"requester_id": user.user_id}, {"_id": 0}).to_list(100)
    received = await db.connections.find({"target_id": user.user_id}, {"_id": 0}).to_list(100)
    return {"sent": sent, "received": received}

@router.get("/matchmaker/issuer/leads")
async def get_issuer_leads(user: User = Depends(get_current_user)):
    """Get list of issuers for experts (masked by default)"""
    issuers = await db.issuer_profiles.find({"status": "active"}, {"_id": 0}).to_list(200)

    # Check which ones the current user has unlocked
    user_connections = await db.connections.find({
        "requester_id": user.user_id, "status": "accepted"
    }).to_list(200)
    unlocked_ids = {c["target_id"] for c in user_connections}

    result = []
    for iss in issuers:
        masked = {
            "issuer_id": iss["issuer_id"],
            "user_id": iss["user_id"],
            "company_name": iss["company_name"],
            "listing_intent": iss["listing_intent"],
            "contact_persona": iss["contact_persona"],
            "hiring": iss.get("hiring", False),
            "hiring_experts": iss.get("hiring_experts", []),
            "created_at": iss["created_at"]
        }
        if iss["user_id"] in unlocked_ids:
            masked["mobile"] = iss["mobile"]
            masked["email"] = iss["email"]
            masked["cin"] = iss["cin"]
            masked["gstin"] = iss["gstin"]
            masked["unlocked"] = True
        else:
            masked["mobile"] = iss["mobile"][:3] + "****" + iss["mobile"][-2:] if len(iss.get("mobile", "")) > 5 else "****"
            masked["email"] = iss["email"][:2] + "****@" + iss["email"].split("@")[-1] if "@" in iss.get("email", "") else "****"
            masked["unlocked"] = False
        result.append(masked)

    return {"leads": result}

# Professional Categories for The Match-Making Platform
PROFESSIONAL_CATEGORIES = [
    {"id": "ipo_consultants", "name": "IPO Consultant", "description": "Expert guidance for IPO journey and SME listings", "icon": "Briefcase"},
    {"id": "merchant_bankers", "name": "SEBI-registered Merchant Bankers", "description": "Licensed merchant banking services for IPO management", "icon": "Building2"},
    {"id": "cfo_finance", "name": "CFO & Finance Heads", "description": "Experienced financial leadership for IPO readiness", "icon": "TrendingUp"},
    {"id": "chartered_accountants", "name": "Chartered Accountants (CA)", "description": "Audit, taxation, and financial reporting expertise", "icon": "Calculator"},
    {"id": "company_secretaries", "name": "Company Secretaries (CS)", "description": "Corporate governance and compliance specialists", "icon": "FileCheck"},
    {"id": "legal_tax", "name": "Legal & Tax Advisors", "description": "Legal structuring and tax planning for IPOs", "icon": "Scale"},
    {"id": "peer_auditors", "name": "Peer Review Auditors", "description": "Independent audit review and quality assurance", "icon": "Search"},
    {"id": "independent_directors", "name": "Independent Directors", "description": "Board-level expertise and corporate governance", "icon": "Users"},
    {"id": "valuation_experts", "name": "Registered Valuation Experts", "description": "Professional business and asset valuation services", "icon": "PieChart"},
    {"id": "rta", "name": "RTA (Registrar & Transfer Agents)", "description": "Share registry and transfer management services", "icon": "FileSpreadsheet"},
    {"id": "bankers", "name": "Bankers", "description": "Banking services and escrow account management", "icon": "Landmark"},
    {"id": "nse_bse_brokers", "name": "NSE / BSE Registered Brokers", "description": "Market making and trading services", "icon": "TrendingUp"},
    {"id": "credit_rating", "name": "Credit Rating Agency", "description": "Credit assessment and rating services", "icon": "Star"},
    {"id": "monitoring_agency", "name": "Monitoring Agency", "description": "IPO proceeds utilization monitoring", "icon": "Eye"},
    {"id": "underwriters", "name": "Underwriters", "description": "IPO underwriting and risk management", "icon": "Shield"}
]

EXPERTISE_TAGS = [
    "SEBI Regulations", "Due Diligence", "Corporate Governance", "Taxation",
    "Financial Reporting", "Risk Management", "Compliance", "Valuation",
    "FinTech IPOs", "Manufacturing IPOs", "IT/Tech IPOs", "Healthcare IPOs",
    "SME IPO", "Mainboard IPO", "Regulatory Compliance", "Investor Relations"
]

INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Chandigarh",
    "Indore", "Nagpur", "Coimbatore", "Kochi", "Vadodara", "Gurgaon",
    "Noida", "Thane", "Navi Mumbai", "Visakhapatnam", "Bhopal", "Patna"
]

class Professional(BaseModel):
    model_config = ConfigDict(extra="ignore")
    professional_id: str
    user_id: Optional[str] = None
    category_id: str
    name: str
    agency_name: Optional[str] = None
    email: str
    mobile: str
    mobile_verified: bool = False
    profile_picture: Optional[str] = None
    locations: List[str] = []
    years_experience: int = 0
    professional_summary: Optional[str] = None
    expertise_tags: List[str] = []
    ipo_track_record: List[dict] = []
    certifications: List[dict] = []
    sebi_registration: Optional[str] = None
    ca_cs_membership: Optional[str] = None
    linkedin_url: Optional[str] = None  # LinkedIn profile URL
    services: List[dict] = []
    pricing_model: Optional[str] = None  # hourly/fixed/negotiable
    hourly_rate: Optional[int] = None
    clients: List[str] = []
    ratings_count: int = 0
    average_rating: float = 0.0
    reviews: List[dict] = []
    is_verified: bool = False
    consent_display: bool = True
    consent_marketing: bool = False
    status: str = "active"  # active/inactive/pending
    created_at: datetime
    updated_at: datetime

class ProfessionalCreate(BaseModel):
    category_id: str
    name: str
    agency_name: Optional[str] = None
    email: str
    mobile: str
    linkedin_url: Optional[str] = None  # LinkedIn profile URL
    locations: List[str] = []
    years_experience: int = 0
    professional_summary: Optional[str] = None
    expertise_tags: List[str] = []
    top_3_expertise: List[str] = []  # New: Top 3 selected expertise
    registration_numbers: dict = {}  # New: Category-specific registration numbers
    # Document uploads (base64 encoded)
    pan_document: Optional[str] = None
    pan_file_name: Optional[str] = None
    aadhaar_document: Optional[str] = None
    aadhaar_file_name: Optional[str] = None
    registration_document: Optional[str] = None
    registration_file_name: Optional[str] = None
    registration_expiry_date: Optional[str] = None
    # Legacy fields (kept for compatibility)
    sebi_registration: Optional[str] = None
    ca_cs_membership: Optional[str] = None
    services: List[dict] = []
    pricing_model: Optional[str] = None
    hourly_rate: Optional[int] = None
    consent_display: bool = True
    consent_marketing: bool = False

class ProfessionalUpdate(BaseModel):
    name: Optional[str] = None
    agency_name: Optional[str] = None
    linkedin_url: Optional[str] = None  # LinkedIn profile URL
    locations: Optional[List[str]] = None
    years_experience: Optional[int] = None
    professional_summary: Optional[str] = None
    expertise_tags: Optional[List[str]] = None
    top_3_expertise: Optional[List[str]] = None
    registration_numbers: Optional[dict] = None
    pan_document: Optional[str] = None
    pan_file_name: Optional[str] = None
    aadhaar_document: Optional[str] = None
    aadhaar_file_name: Optional[str] = None
    registration_document: Optional[str] = None
    registration_file_name: Optional[str] = None
    registration_expiry_date: Optional[str] = None
    ipo_track_record: Optional[List[dict]] = None
    certifications: Optional[List[dict]] = None
    sebi_registration: Optional[str] = None
    ca_cs_membership: Optional[str] = None
    services: Optional[List[dict]] = None
    pricing_model: Optional[str] = None
    hourly_rate: Optional[int] = None
    clients: Optional[List[str]] = None
    consent_display: Optional[bool] = None
    consent_marketing: Optional[bool] = None

class ReviewCreate(BaseModel):
    professional_id: str
    rating: int  # 1-5
    review_text: str
    reviewer_name: Optional[str] = None

class EnquiryCreate(BaseModel):
    professional_id: str
    subject: str
    message: str
    company_name: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None

class ConsultationRequest(BaseModel):
    professional_id: str
    preferred_date: str
    preferred_time: str
    consultation_type: str = "video"  # video/audio/in-person
    topic: str
    notes: Optional[str] = None

# ============ MATCH MAKER ENDPOINTS ============

@router.get("/matchmaker/categories")
async def get_professional_categories():
    """Get all professional categories for The Match-Making Platform"""
    return {"categories": PROFESSIONAL_CATEGORIES}

@router.get("/matchmaker/cities")
async def get_cities():
    """Get list of available cities"""
    return {"cities": INDIAN_CITIES}

@router.get("/matchmaker/expertise-tags")
async def get_expertise_tags():
    """Get list of expertise tags for filtering"""
    return {"tags": EXPERTISE_TAGS}

@router.get("/matchmaker/professionals")
async def search_professionals(
    category_id: Optional[str] = None,
    city: Optional[str] = None,
    min_experience: Optional[int] = None,
    max_experience: Optional[int] = None,
    expertise: Optional[str] = None,
    ipo_experience: Optional[str] = None,  # "5+", "sme", "mainboard"
    verified_only: bool = False,
    sort_by: str = "rating",  # rating/experience/name
    page: int = 1,
    limit: int = 20
):
    """Search and filter professionals"""
    query = {"status": "active", "consent_display": True}
    
    if category_id:
        query["category_id"] = category_id
    if city:
        query["locations"] = {"$in": [city]}
    if min_experience is not None:
        query["years_experience"] = {"$gte": min_experience}
    if max_experience is not None:
        if "years_experience" in query:
            query["years_experience"]["$lte"] = max_experience
        else:
            query["years_experience"] = {"$lte": max_experience}
    if expertise:
        query["expertise_tags"] = {"$in": expertise.split(",")}
    if verified_only:
        query["is_verified"] = True
    
    # IPO experience filter
    if ipo_experience:
        if ipo_experience == "5+":
            query["$expr"] = {"$gte": [{"$size": "$ipo_track_record"}, 5]}
        elif ipo_experience == "sme":
            query["expertise_tags"] = {"$in": ["SME IPO"]}
        elif ipo_experience == "mainboard":
            query["expertise_tags"] = {"$in": ["Mainboard IPO"]}
    
    # Sorting
    sort_field = "average_rating" if sort_by == "rating" else "years_experience" if sort_by == "experience" else "name"
    sort_order = -1 if sort_by in ["rating", "experience"] else 1
    
    # Pagination
    skip = (page - 1) * limit
    
    # Get professionals
    professionals = await db.professionals.find(
        query,
        {"_id": 0}
    ).sort(sort_field, sort_order).skip(skip).limit(limit).to_list(limit)
    
    # Get total count
    total = await db.professionals.count_documents(query)
    
    # Convert datetime strings
    for prof in professionals:
        if isinstance(prof.get('created_at'), str):
            prof['created_at'] = datetime.fromisoformat(prof['created_at'])
        if isinstance(prof.get('updated_at'), str):
            prof['updated_at'] = datetime.fromisoformat(prof['updated_at'])
    
    return {
        "professionals": professionals,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# NOTE: /all route must be defined BEFORE /{professional_id} to avoid route conflict
@router.get("/matchmaker/professionals/all")
async def get_all_professionals(
    page: int = 1,
    limit: int = 20,
    category: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get all professionals (master database) with pagination and filters"""
    query = {"status": {"$in": ["active", "pending_review"]}, "consent_display": True}
    
    if category:
        query["category_id"] = category
    if city:
        query["locations"] = city
    if search:
        # Sanitize search input to prevent ReDoS attacks
        safe_search = sanitize_regex_input(search)
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"agency_name": {"$regex": safe_search, "$options": "i"}},
            {"expertise_tags": {"$regex": safe_search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    # Get total count
    total = await db.professionals.count_documents(query)
    
    # Get professionals with pagination
    cursor = db.professionals.find(query, {"_id": 0, "pan_document": 0, "aadhaar_document": 0, "registration_document": 0}).sort("created_at", -1).skip(skip).limit(limit)
    professionals = await cursor.to_list(length=limit)
    
    return {
        "professionals": professionals,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

# ============ PROFESSIONAL DRAFT ENDPOINTS ============
# NOTE: Draft routes must be defined BEFORE /{professional_id} to avoid route conflict

class ProfessionalDraftModel(BaseModel):
    draft_id: Optional[str] = None
    current_step: int = 1
    data: dict = {}

@router.post("/matchmaker/professionals/draft")
async def save_professional_draft_route(
    draft_data: ProfessionalDraftModel,
    user: User = Depends(get_current_user)
):
    """Save or update a professional registration draft"""
    now = datetime.now(timezone.utc)
    
    if draft_data.draft_id:
        # Update existing draft
        result = await db.professional_drafts.update_one(
            {"draft_id": draft_data.draft_id, "user_id": user.user_id},
            {
                "$set": {
                    "current_step": draft_data.current_step,
                    "data": draft_data.data,
                    "updated_at": now.isoformat()
                }
            }
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Draft not found")
        return {"draft_id": draft_data.draft_id, "message": "Draft updated", "updated_at": now.isoformat()}
    else:
        # Create new draft
        draft_id = f"draft_{uuid.uuid4().hex[:12]}"
        draft_doc = {
            "draft_id": draft_id,
            "user_id": user.user_id,
            "current_step": draft_data.current_step,
            "data": draft_data.data,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        # Delete any existing draft for this user first
        await db.professional_drafts.delete_many({"user_id": user.user_id})
        await db.professional_drafts.insert_one(draft_doc)
        
        return {"draft_id": draft_id, "message": "Draft created", "updated_at": now.isoformat()}

@router.get("/matchmaker/professionals/draft")
async def get_user_draft_route(user: User = Depends(get_current_user)):
    """Get the current user's professional registration draft"""
    draft = await db.professional_drafts.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found")
    return draft

@router.get("/matchmaker/professionals/draft/{draft_id}")
async def get_draft_by_id_route(draft_id: str, user: User = Depends(get_current_user)):
    """Get a specific draft by ID"""
    draft = await db.professional_drafts.find_one(
        {"draft_id": draft_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.delete("/matchmaker/professionals/draft/{draft_id}")
async def delete_draft_route(draft_id: str, user: User = Depends(get_current_user)):
    """Delete a draft"""
    result = await db.professional_drafts.delete_one(
        {"draft_id": draft_id, "user_id": user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"message": "Draft deleted"}

@router.get("/matchmaker/professionals/{professional_id}")
async def get_professional(professional_id: str):
    """Get a specific professional profile"""
    professional = await db.professionals.find_one(
        {"professional_id": professional_id, "status": "active"},
        {"_id": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    if isinstance(professional.get('created_at'), str):
        professional['created_at'] = datetime.fromisoformat(professional['created_at'])
    if isinstance(professional.get('updated_at'), str):
        professional['updated_at'] = datetime.fromisoformat(professional['updated_at'])
    
    # Log profile view for audit
    await db.audit_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "action": "profile_view",
        "professional_id": professional_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return professional

@router.get("/matchmaker/my-profile")
async def get_my_professional_profile(user: User = Depends(get_current_user)):
    """Get the current user's professional profile"""
    professional = await db.professionals.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="No professional profile found for this user")
    
    return professional

@router.post("/matchmaker/professionals")
async def create_professional(
    prof_data: ProfessionalCreate,
    user: User = Depends(get_current_user)
):
    """Register as a professional (service provider)"""
    professional_id = f"prof_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    prof_doc = {
        "professional_id": professional_id,
        "user_id": user.user_id,
        "category_id": prof_data.category_id,
        "name": prof_data.name,
        "agency_name": prof_data.agency_name,
        "email": prof_data.email,
        "mobile": prof_data.mobile,
        "mobile_verified": False,
        "profile_picture": user.picture,
        "linkedin_url": prof_data.linkedin_url,
        "locations": prof_data.locations,
        "years_experience": prof_data.years_experience,
        "professional_summary": prof_data.professional_summary,
        "expertise_tags": prof_data.expertise_tags,
        "top_3_expertise": prof_data.top_3_expertise,
        "registration_numbers": prof_data.registration_numbers,
        # Document uploads
        "pan_document": prof_data.pan_document,
        "pan_file_name": prof_data.pan_file_name,
        "aadhaar_document": prof_data.aadhaar_document,
        "aadhaar_file_name": prof_data.aadhaar_file_name,
        "registration_document": prof_data.registration_document,
        "registration_file_name": prof_data.registration_file_name,
        "registration_expiry_date": prof_data.registration_expiry_date,
        # Legacy and other fields
        "ipo_track_record": [],
        "certifications": [],
        "sebi_registration": prof_data.sebi_registration,
        "ca_cs_membership": prof_data.ca_cs_membership,
        "linkedin_url": prof_data.linkedin_url,
        "services": prof_data.services,
        "pricing_model": prof_data.pricing_model,
        "hourly_rate": prof_data.hourly_rate,
        "clients": [],
        "ratings_count": 0,
        "average_rating": 0.0,
        "reviews": [],
        "is_verified": False,
        "documents_verified": False,
        "consent_display": prof_data.consent_display,
        "consent_marketing": prof_data.consent_marketing,
        "status": "pending_review",  # New profiles need review
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.professionals.insert_one(prof_doc)
    
    # Also add to city-wise collections for quick lookup
    for location in prof_data.locations:
        city_doc = {
            "professional_id": professional_id,
            "city": location,
            "category_id": prof_data.category_id,
            "name": prof_data.name,
            "expertise_tags": prof_data.expertise_tags,
            "years_experience": prof_data.years_experience,
            "created_at": now.isoformat()
        }
        await db.professionals_by_city.insert_one(city_doc)
    
    # Delete any existing draft for this user
    await db.professional_drafts.delete_many({"user_id": user.user_id})
    
    prof_doc["created_at"] = now
    prof_doc["updated_at"] = now
    if "_id" in prof_doc:
        del prof_doc["_id"]
    
    return Professional(**prof_doc)

# ============ MASTER DATABASE & BROWSE ALL ============
# NOTE: /all and /draft routes moved above /{professional_id} to avoid route conflict

@router.get("/matchmaker/professionals/by-city/{city}")
async def get_professionals_by_city(
    city: str,
    category: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get professionals filtered by city"""
    query = {"city": city}
    if category:
        query["category_id"] = category
    
    cursor = db.professionals_by_city.find(query, {"_id": 0})
    results = await cursor.to_list(length=100)
    
    return {"city": city, "professionals": results, "count": len(results)}

@router.get("/matchmaker/statistics")
async def get_matchmaker_statistics(user: User = Depends(get_current_user)):
    """Get statistics for the matchmaker module"""
    try:
        total_professionals = await db.professionals.count_documents({"status": {"$in": ["active", "pending_review"]}})
        
        # Get counts by category
        pipeline = [
            {"$match": {"status": {"$in": ["active", "pending_review"]}}},
            {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_counts = await db.professionals.aggregate(pipeline).to_list(length=20)
        
        # Get unique cities - with proper null handling
        unique_cities = 0
        if total_professionals > 0:
            cities_pipeline = [
                {"$match": {"status": {"$in": ["active", "pending_review"]}, "locations": {"$exists": True, "$ne": []}}},
                {"$unwind": "$locations"},
                {"$group": {"_id": "$locations"}},
                {"$count": "total"}
            ]
            cities_result = await db.professionals.aggregate(cities_pipeline).to_list(length=1)
            unique_cities = cities_result[0]["total"] if cities_result else 0
        
        return {
            "total_professionals": total_professionals,
            "categories": category_counts,
            "unique_cities": unique_cities
        }
    except Exception as e:
        print(f"Error in statistics: {e}")
        return {
            "total_professionals": 0,
            "categories": [],
            "unique_cities": 0
        }

# ============ REGISTRATION APPROVAL SYSTEM (Master Admin) ============

class RegistrationAction(BaseModel):
    action: str  # "approve", "reject", "reapply"
    reason: Optional[str] = None

@router.get("/admin/pending-registrations")
async def get_pending_registrations(
    page: int = 1,
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    """Get all pending professional registrations (Master Admin only)"""
    # Check if user is master admin or has admin role
    if not is_master_admin(user.email) and user.role not in ["admin", "super_admin", "master_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"status": "pending_review"}
    skip = (page - 1) * limit
    
    total = await db.professionals.count_documents(query)
    cursor = db.professionals.find(query, {"_id": 0, "pan_document": 0, "aadhaar_document": 0, "registration_document": 0}).sort("created_at", -1).skip(skip).limit(limit)
    registrations = await cursor.to_list(length=limit)
    
    return {
        "registrations": registrations,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@router.post("/admin/registrations/{professional_id}/action")
async def process_registration(
    professional_id: str,
    action_data: RegistrationAction,
    user: User = Depends(get_current_user)
):
    """Approve, Reject, or Request Re-application for a registration (Master Admin only)"""
    # Check if user is master admin or has admin role
    if not is_master_admin(user.email) and user.role not in ["admin", "super_admin", "master_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get the registration
    registration = await db.professionals.find_one(
        {"professional_id": professional_id},
        {"_id": 0}
    )
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    now = datetime.now(timezone.utc)
    
    if action_data.action == "approve":
        # Approve the registration - change status to active
        await db.professionals.update_one(
            {"professional_id": professional_id},
            {
                "$set": {
                    "status": "active",
                    "is_verified": True,
                    "approved_by": user.email,
                    "approved_at": now.isoformat(),
                    "updated_at": now.isoformat()
                }
            }
        )
        message = "Registration approved successfully"
        
    elif action_data.action == "reject":
        # Reject the registration
        await db.professionals.update_one(
            {"professional_id": professional_id},
            {
                "$set": {
                    "status": "rejected",
                    "rejection_reason": action_data.reason,
                    "rejected_by": user.email,
                    "rejected_at": now.isoformat(),
                    "updated_at": now.isoformat()
                }
            }
        )
        message = "Registration rejected"
        
    elif action_data.action == "reapply":
        # Ask to re-apply - send back for corrections
        await db.professionals.update_one(
            {"professional_id": professional_id},
            {
                "$set": {
                    "status": "needs_resubmission",
                    "reapply_reason": action_data.reason,
                    "reapply_requested_by": user.email,
                    "reapply_requested_at": now.isoformat(),
                    "updated_at": now.isoformat()
                }
            }
        )
        message = "Re-application requested"
        
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve', 'reject', or 'reapply'")
    
    # Log the action
    await db.audit_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "user_email": user.email,
        "user_name": user.name,
        "action_type": f"registration_{action_data.action}",
        "module": "matchmaker",
        "details": f"Processed registration for {registration.get('name', 'Unknown')} ({professional_id}): {action_data.action}",
        "timestamp": now.isoformat()
    })
    
    # Send email notification automatically
    email_result = {"status": "not_sent"}
    try:
        # Get category name for email
        category_name = registration.get("category_id", "Professional")
        for cat in PROFESSIONAL_CATEGORIES:
            if cat["id"] == registration.get("category_id"):
                category_name = cat["name"]
                break
        
        email_result = await send_registration_email(
            recipient_email=registration.get("email", ""),
            professional_name=registration.get("name", "Professional"),
            category=category_name,
            action=action_data.action,
            reason=action_data.reason,
            send_to_master_admin=True
        )
    except Exception as e:
        logger.error(f"Failed to send notification email: {str(e)}")
        email_result = {"status": "error", "message": str(e)}
    
    return {
        "message": message, 
        "professional_id": professional_id, 
        "new_status": action_data.action,
        "email_notification": email_result
    }

# Model for manual email sending
class ManualEmailRequest(BaseModel):
    professional_id: str
    action: str  # "welcome", "reminder", "custom"
    custom_subject: Optional[str] = None
    custom_message: Optional[str] = None

@router.post("/admin/send-email/{professional_id}")
async def send_manual_email(
    professional_id: str,
    email_type: str = "status_update",
    user: User = Depends(get_current_user)
):
    """Manually send email notification to a professional (Master Admin button)"""
    if not is_master_admin(user.email) and user.role not in ["admin", "super_admin", "master_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get the professional
    professional = await db.professionals.find_one(
        {"professional_id": professional_id},
        {"_id": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    # Get category name
    category_name = professional.get("category_id", "Professional")
    for cat in PROFESSIONAL_CATEGORIES:
        if cat["id"] == professional.get("category_id"):
            category_name = cat["name"]
            break
    
    # Determine the action based on current status
    status = professional.get("status", "pending_review")
    if status == "active":
        action = "approve"
    elif status == "rejected":
        action = "reject"
    elif status == "needs_resubmission":
        action = "reapply"
    else:
        # For pending, send a generic notification
        action = "approve"  # Will be a welcome/reminder type
    
    # Get reason if exists
    reason = professional.get("rejection_reason") or professional.get("reapply_reason")
    
    try:
        email_result = await send_registration_email(
            recipient_email=professional.get("email", ""),
            professional_name=professional.get("name", "Professional"),
            category=category_name,
            action=action,
            reason=reason,
            send_to_master_admin=True
        )
        
        # Log the manual email
        await db.audit_logs.insert_one({
            "log_id": f"log_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "user_email": user.email,
            "user_name": user.name,
            "action_type": "manual_email_sent",
            "module": "matchmaker",
            "details": f"Manual email sent to {professional.get('name', 'Unknown')} ({professional_id})",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "message": "Email sent successfully",
            "professional_id": professional_id,
            "professional_email": professional.get("email"),
            "email_result": email_result
        }
    except Exception as e:
        logger.error(f"Failed to send manual email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.get("/admin/email-config")
async def get_email_config(user: User = Depends(get_current_user)):
    """Get email configuration status for admin"""
    if not is_master_admin(user.email) and user.role not in ["admin", "super_admin", "master_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    is_configured = RESEND_API_KEY and RESEND_API_KEY != 're_placeholder_key'
    
    return {
        "email_configured": is_configured,
        "sender_email": SENDER_EMAIL if is_configured else None,
        "master_admin_email": MASTER_ADMIN_EMAIL,
        "message": "Email notifications are enabled" if is_configured else "Please configure RESEND_API_KEY in backend/.env"
    }

@router.get("/admin/master-profile")
async def get_master_admin_profile(user: User = Depends(get_current_user)):
    """Get master admin profile info"""
    if not is_master_admin(user.email) and user.role not in ["admin", "super_admin", "master_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "master_admin": MASTER_ADMIN_CONFIG,
        "central_admins": CENTRAL_ADMIN_EMAILS,
        "is_current_user_master": is_master_admin(user.email)
    }

@router.get("/admin/registration-stats")
async def get_registration_stats(user: User = Depends(get_current_user)):
    """Get registration statistics for admin dashboard"""
    if not is_master_admin(user.email) and user.role not in ["admin", "super_admin", "master_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pending = await db.professionals.count_documents({"status": "pending_review"})
    approved = await db.professionals.count_documents({"status": "active"})
    rejected = await db.professionals.count_documents({"status": "rejected"})
    needs_resubmission = await db.professionals.count_documents({"status": "needs_resubmission"})
    
    return {
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "needs_resubmission": needs_resubmission,
        "total": pending + approved + rejected + needs_resubmission
    }

@router.put("/matchmaker/professionals/{professional_id}")
async def update_professional(
    professional_id: str,
    update_data: ProfessionalUpdate,
    user: User = Depends(get_current_user)
):
    """Update professional profile"""
    # Verify ownership
    existing = await db.professionals.find_one(
        {"professional_id": professional_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not existing:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.professionals.update_one(
        {"professional_id": professional_id},
        {"$set": update_dict}
    )
    
    return await get_professional(professional_id)

@router.post("/matchmaker/professionals/{professional_id}/review")
async def add_review(
    professional_id: str,
    review_data: ReviewCreate,
    user: User = Depends(get_current_user)
):
    """Add a review for a professional (one review per user per professional)"""
    professional = await db.professionals.find_one(
        {"professional_id": professional_id},
        {"_id": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    # Check if user has already reviewed this professional
    existing_reviews = professional.get("reviews", [])
    for existing_review in existing_reviews:
        if existing_review.get("user_id") == user.user_id:
            raise HTTPException(
                status_code=400, 
                detail="You have already reviewed this professional. Each user can only submit one review per professional."
            )
    
    # Prevent self-review
    if professional.get("user_id") == user.user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot review your own profile"
        )
    
    review = {
        "review_id": f"rev_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "reviewer_name": review_data.reviewer_name or user.name,
        "rating": min(max(review_data.rating, 1), 5),
        "review_text": review_data.review_text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update professional with new review
    current_count = professional.get("ratings_count", 0)
    current_avg = professional.get("average_rating", 0.0)
    new_count = current_count + 1
    new_avg = ((current_avg * current_count) + review["rating"]) / new_count
    
    await db.professionals.update_one(
        {"professional_id": professional_id},
        {
            "$push": {"reviews": review},
            "$set": {
                "ratings_count": new_count,
                "average_rating": round(new_avg, 1),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Review added successfully", "review": review}

@router.get("/matchmaker/professionals/{professional_id}/review-status")
async def get_review_status(
    professional_id: str,
    user: User = Depends(get_current_user)
):
    """Check if current user has already reviewed this professional"""
    professional = await db.professionals.find_one(
        {"professional_id": professional_id},
        {"reviews": 1, "user_id": 1, "_id": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    # Check if this is the user's own profile
    is_own_profile = professional.get("user_id") == user.user_id
    
    # Check if user has already reviewed
    has_reviewed = False
    user_review = None
    for review in professional.get("reviews", []):
        if review.get("user_id") == user.user_id:
            has_reviewed = True
            user_review = review
            break
    
    return {
        "has_reviewed": has_reviewed,
        "is_own_profile": is_own_profile,
        "can_review": not has_reviewed and not is_own_profile,
        "user_review": user_review
    }

@router.post("/matchmaker/enquiry")
async def send_enquiry(
    enquiry_data: EnquiryCreate,
    user: User = Depends(get_current_user)
):
    """Send an enquiry to a professional"""
    enquiry_id = f"enq_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    enquiry_doc = {
        "enquiry_id": enquiry_id,
        "professional_id": enquiry_data.professional_id,
        "user_id": user.user_id,
        "subject": enquiry_data.subject,
        "message": enquiry_data.message,
        "company_name": enquiry_data.company_name,
        "contact_email": enquiry_data.contact_email,
        "contact_phone": enquiry_data.contact_phone,
        "status": "pending",  # pending/responded/closed
        "created_at": now.isoformat()
    }
    
    await db.enquiries.insert_one(enquiry_doc)
    
    return {"message": "Enquiry sent successfully", "enquiry_id": enquiry_id}

@router.post("/matchmaker/consultation")
async def book_consultation(
    consultation_data: ConsultationRequest,
    user: User = Depends(get_current_user)
):
    """Book a consultation with a professional"""
    consultation_id = f"cons_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    consultation_doc = {
        "consultation_id": consultation_id,
        "professional_id": consultation_data.professional_id,
        "user_id": user.user_id,
        "preferred_date": consultation_data.preferred_date,
        "preferred_time": consultation_data.preferred_time,
        "consultation_type": consultation_data.consultation_type,
        "topic": consultation_data.topic,
        "notes": consultation_data.notes,
        "status": "requested",  # requested/confirmed/completed/cancelled
        "created_at": now.isoformat()
    }
    
    await db.consultations.insert_one(consultation_doc)
    
    return {"message": "Consultation request submitted", "consultation_id": consultation_id}

@router.get("/matchmaker/my-profile")
async def get_my_professional_profile(user: User = Depends(get_current_user)):
    """Get current user's professional profile if exists"""
    profile = await db.professionals.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not profile:
        return {"profile": None}
    
    if isinstance(profile.get('created_at'), str):
        profile['created_at'] = datetime.fromisoformat(profile['created_at'])
    if isinstance(profile.get('updated_at'), str):
        profile['updated_at'] = datetime.fromisoformat(profile['updated_at'])
    
    return {"profile": profile}

# ============ AI-POWERED MATCHING ============

class AIMatchRequest(BaseModel):
    company_name: str
    sector: str
    current_stage: str  # Pre-IPO/Assessment/Drafting
    target_exchange: str  # SME/Mainboard
    estimated_issue_size: Optional[str] = None
    specific_needs: List[str] = []  # e.g., ["Need CA for audit", "Legal advisor for compliance"]
    preferred_cities: List[str] = []
    budget_range: Optional[str] = None
    timeline: Optional[str] = None  # e.g., "6 months", "1 year"
    additional_context: Optional[str] = None

@router.post("/matchmaker/ai-recommend")
async def get_ai_recommendations(
    request: AIMatchRequest,
    user: User = Depends(get_current_user)
):
    """AI-powered professional matching based on company IPO requirements"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    try:
        # Fetch all active professionals
        professionals = await db.professionals.find(
            {"status": "active", "consent_display": True},
            {"_id": 0}
        ).to_list(100)
        
        if not professionals:
            return {
                "recommendations": [],
                "ai_analysis": "No professionals available in the database.",
                "match_summary": None
            }
        
        # Prepare professional summaries for AI
        prof_summaries = []
        for i, prof in enumerate(professionals):
            summary = f"""
Professional {i+1}:
- ID: {prof['professional_id']}
- Name: {prof['name']}
- Category: {prof['category_id']}
- Agency: {prof.get('agency_name', 'Independent')}
- Experience: {prof['years_experience']} years
- Locations: {', '.join(prof.get('locations', []))}
- Expertise: {', '.join(prof.get('expertise_tags', []))}
- IPOs Managed: {len(prof.get('ipo_track_record', []))}
- Rating: {prof.get('average_rating', 0)}/5 ({prof.get('ratings_count', 0)} reviews)
- Verified: {'Yes' if prof.get('is_verified') else 'No'}
- SEBI Registered: {prof.get('sebi_registration', 'N/A')}
- CA/CS Membership: {prof.get('ca_cs_membership', 'N/A')}
- Services: {', '.join([s.get('name', '') for s in prof.get('services', [])])}
"""
            prof_summaries.append(summary)
        
        # Prepare company requirements for AI
        company_context = f"""
COMPANY IPO REQUIREMENTS:
- Company Name: {request.company_name}
- Sector: {request.sector}
- Current Stage: {request.current_stage}
- Target Exchange: {request.target_exchange}
- Estimated Issue Size: {request.estimated_issue_size or 'Not specified'}
- Specific Needs: {', '.join(request.specific_needs) if request.specific_needs else 'General IPO assistance'}
- Preferred Cities: {', '.join(request.preferred_cities) if request.preferred_cities else 'Pan India'}
- Budget Range: {request.budget_range or 'Flexible'}
- Timeline: {request.timeline or 'Not specified'}
- Additional Context: {request.additional_context or 'None'}

AVAILABLE PROFESSIONALS:
{''.join(prof_summaries)}
"""
        
        # Initialize AI chat
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ai_match_{uuid.uuid4().hex[:8]}",
            system_message="""You are an expert IPO advisor AI assistant for SETU by IPO Labs. 
Your task is to analyze company IPO requirements and recommend the most suitable professionals from the available pool.

Consider these factors when matching:
1. Relevant expertise and specialization
2. Experience in the company's sector
3. Track record with similar IPO types (SME vs Mainboard)
4. Geographic availability
5. Verified status and ratings
6. Specific certifications (SEBI registration, CA/CS membership)

Provide recommendations in JSON format with clear reasoning for each match."""
        ).with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""{company_context}

Based on the company's IPO requirements, analyze and recommend the TOP 5 most suitable professionals.

Return your response in this exact JSON format:
{{
    "match_summary": "A brief 2-3 sentence summary of the company's needs and overall matching strategy",
    "recommendations": [
        {{
            "professional_id": "prof_xxx",
            "match_score": 95,
            "match_reason": "Detailed explanation why this professional is recommended (2-3 sentences)",
            "key_strengths": ["strength1", "strength2", "strength3"],
            "recommended_for": "Specific service they should provide for this IPO"
        }}
    ],
    "additional_advice": "Any additional advice for the company's IPO journey"
}}

Important: Only include professionals from the provided list. Match score should be 0-100 based on fit."""

        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse AI response
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            ai_result = json.loads(json_match.group())
        else:
            ai_result = {
                "match_summary": "Unable to parse AI recommendations. Showing top-rated professionals instead.",
                "recommendations": [],
                "additional_advice": "Please try again or contact support."
            }
        
        # Enrich recommendations with full professional data
        enriched_recommendations = []
        for rec in ai_result.get("recommendations", []):
            prof_id = rec.get("professional_id")
            prof_data = next((p for p in professionals if p["professional_id"] == prof_id), None)
            if prof_data:
                if isinstance(prof_data.get('created_at'), str):
                    prof_data['created_at'] = datetime.fromisoformat(prof_data['created_at'])
                if isinstance(prof_data.get('updated_at'), str):
                    prof_data['updated_at'] = datetime.fromisoformat(prof_data['updated_at'])
                enriched_recommendations.append({
                    **rec,
                    "professional": prof_data
                })
        
        # Log the AI matching request
        await db.ai_match_logs.insert_one({
            "log_id": f"aimatch_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "company_name": request.company_name,
            "sector": request.sector,
            "recommendations_count": len(enriched_recommendations),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "match_summary": ai_result.get("match_summary", ""),
            "recommendations": enriched_recommendations,
            "additional_advice": ai_result.get("additional_advice", ""),
            "ai_powered": True
        }
        
    except Exception as e:
        logger.error(f"AI matching failed: {e}")
        # Fallback to top-rated professionals
        fallback_profs = await db.professionals.find(
            {"status": "active", "consent_display": True},
            {"_id": 0}
        ).sort("average_rating", -1).limit(5).to_list(5)
        
        for prof in fallback_profs:
            if isinstance(prof.get('created_at'), str):
                prof['created_at'] = datetime.fromisoformat(prof['created_at'])
            if isinstance(prof.get('updated_at'), str):
                prof['updated_at'] = datetime.fromisoformat(prof['updated_at'])
        
        return {
            "match_summary": "AI analysis temporarily unavailable. Showing top-rated professionals.",
            "recommendations": [
                {
                    "professional_id": p["professional_id"],
                    "match_score": 80,
                    "match_reason": "Top-rated professional in our network",
                    "key_strengths": p.get("expertise_tags", [])[:3],
                    "recommended_for": "General IPO Advisory",
                    "professional": p
                }
                for p in fallback_profs
            ],
            "additional_advice": "Please try again later for personalized AI recommendations.",
            "ai_powered": False
        }

# ============ IPO FUNDING MODULE ============
