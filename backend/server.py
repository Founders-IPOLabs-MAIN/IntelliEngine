from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GridFS bucket for document storage
fs_bucket = AsyncIOMotorGridFSBucket(db)

# Create the main app
app = FastAPI(title="IntelliEngine API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "Editor"  # Admin/Editor/Viewer
    company_id: Optional[str] = None
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
    current_stage: str = "Assessment"  # Assessment/Drafting/Filed
    progress_percentage: int = 0
    created_at: datetime
    updated_at: datetime

class DRHPSection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    section_id: str
    project_id: str
    section_name: str
    content: dict = {}
    last_edited_by: Optional[str] = None
    status: str = "Draft"  # Draft/Review/Final
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
    ocr_status: str = "pending"  # pending/processing/completed/failed
    file_size: int
    created_at: datetime

# ============ REQUEST/RESPONSE MODELS ============

class SessionRequest(BaseModel):
    session_id: str

class ProjectCreate(BaseModel):
    company_name: str
    sector: str

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

async def get_current_user(request: Request) -> User:
    """Get current user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/session")
async def process_session(request: SessionRequest, response: Response):
    """Process session_id from Emergent OAuth and create session"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
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
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "Editor",
            "company_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
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

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ PROJECT ENDPOINTS ============

@api_router.get("/projects", response_model=List[Project])
async def get_projects(user: User = Depends(get_current_user)):
    """Get all projects for current user"""
    projects = await db.projects.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
    return projects

@api_router.post("/projects", response_model=Project)
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
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.projects.insert_one(project_doc)
    
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

@api_router.get("/projects/{project_id}", response_model=Project)
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

@api_router.put("/projects/{project_id}", response_model=Project)
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

@api_router.get("/projects/{project_id}/sections", response_model=List[DRHPSection])
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

@api_router.get("/projects/{project_id}/sections/{section_id}", response_model=DRHPSection)
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

@api_router.put("/projects/{project_id}/sections/{section_id}", response_model=DRHPSection)
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

# ============ DOCUMENT ENDPOINTS ============

@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    section_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Upload a document to GridFS"""
    content = await file.read()
    
    # Store in GridFS
    gridfs_id = await fs_bucket.upload_from_stream(
        file.filename,
        io.BytesIO(content),
        metadata={
            "user_id": user.user_id,
            "project_id": project_id,
            "section_id": section_id,
            "content_type": file.content_type
        }
    )
    
    # Create document record
    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    doc_record = {
        "document_id": document_id,
        "user_id": user.user_id,
        "project_id": project_id,
        "section_id": section_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "gridfs_id": str(gridfs_id),
        "ocr_text": None,
        "ocr_status": "pending",
        "file_size": len(content),
        "created_at": now.isoformat()
    }
    
    await db.documents.insert_one(doc_record)
    
    # Update section documents list if section_id provided
    if section_id:
        await db.drhp_sections.update_one(
            {"section_id": section_id},
            {"$push": {"documents": document_id}}
        )
    
    if "_id" in doc_record:
        del doc_record["_id"]
    doc_record["created_at"] = now
    
    return Document(**doc_record)

@api_router.get("/documents/{document_id}/download")
async def download_document(document_id: str, user: User = Depends(get_current_user)):
    """Download a document from GridFS"""
    doc_record = await db.documents.find_one(
        {"document_id": document_id},
        {"_id": 0}
    )
    
    if not doc_record:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Download from GridFS
    gridfs_id = ObjectId(doc_record["gridfs_id"])
    grid_out = await fs_bucket.open_download_stream(gridfs_id)
    content = await grid_out.read()
    
    return StreamingResponse(
        io.BytesIO(content),
        media_type=doc_record["content_type"],
        headers={"Content-Disposition": f'attachment; filename="{doc_record["filename"]}"'}
    )

@api_router.get("/documents", response_model=List[Document])
async def get_documents(
    project_id: Optional[str] = None,
    section_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get documents for user, optionally filtered by project/section"""
    query = {"user_id": user.user_id}
    if project_id:
        query["project_id"] = project_id
    if section_id:
        query["section_id"] = section_id
    
    documents = await db.documents.find(query, {"_id": 0}).to_list(100)
    
    for doc in documents:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    
    return documents

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, user: User = Depends(get_current_user)):
    """Delete a document"""
    doc_record = await db.documents.find_one(
        {"document_id": document_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not doc_record:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from GridFS
    gridfs_id = ObjectId(doc_record["gridfs_id"])
    await fs_bucket.delete(gridfs_id)
    
    # Delete record
    await db.documents.delete_one({"document_id": document_id})
    
    # Remove from section if applicable
    if doc_record.get("section_id"):
        await db.drhp_sections.update_one(
            {"section_id": doc_record["section_id"]},
            {"$pull": {"documents": document_id}}
        )
    
    return {"message": "Document deleted successfully"}

# ============ OCR ENDPOINT ============

@api_router.post("/documents/{document_id}/ocr")
async def process_ocr(document_id: str, ocr_request: OCRRequest, user: User = Depends(get_current_user)):
    """Process OCR on a document using OpenAI GPT-5.2 with vision"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
    
    doc_record = await db.documents.find_one(
        {"document_id": document_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not doc_record:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update status to processing
    await db.documents.update_one(
        {"document_id": document_id},
        {"$set": {"ocr_status": "processing"}}
    )
    
    try:
        # Download file from GridFS
        gridfs_id = ObjectId(doc_record["gridfs_id"])
        grid_out = await fs_bucket.open_download_stream(gridfs_id)
        content = await grid_out.read()
        
        # Save temporarily
        temp_path = f"/tmp/{doc_record['filename']}"
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Initialize LLM Chat with Gemini for file attachments
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ocr_{document_id}",
            system_message="You are an expert OCR assistant. Extract all text, tables, and structured data from documents accurately."
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Create file content
        mime_type = doc_record["content_type"]
        file_content = FileContentWithMimeType(
            file_path=temp_path,
            mime_type=mime_type
        )
        
        # Send message with file
        user_message = UserMessage(
            text=ocr_request.prompt,
            file_contents=[file_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Update document with OCR result
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {"ocr_text": response, "ocr_status": "completed"}}
        )
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {"document_id": document_id, "ocr_text": response, "status": "completed"}
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {"ocr_status": "failed"}}
        )
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

# ============ MATCH MAKER MODELS ============

# Professional Categories for IPO Match Maker
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
    locations: List[str] = []
    years_experience: int = 0
    professional_summary: Optional[str] = None
    expertise_tags: List[str] = []
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
    locations: Optional[List[str]] = None
    years_experience: Optional[int] = None
    professional_summary: Optional[str] = None
    expertise_tags: Optional[List[str]] = None
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

@api_router.get("/matchmaker/categories")
async def get_professional_categories():
    """Get all professional categories for IPO Match Maker"""
    return {"categories": PROFESSIONAL_CATEGORIES}

@api_router.get("/matchmaker/cities")
async def get_cities():
    """Get list of available cities"""
    return {"cities": INDIAN_CITIES}

@api_router.get("/matchmaker/expertise-tags")
async def get_expertise_tags():
    """Get list of expertise tags for filtering"""
    return {"tags": EXPERTISE_TAGS}

@api_router.get("/matchmaker/professionals")
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

@api_router.get("/matchmaker/professionals/{professional_id}")
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

@api_router.post("/matchmaker/professionals")
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
        "locations": prof_data.locations,
        "years_experience": prof_data.years_experience,
        "professional_summary": prof_data.professional_summary,
        "expertise_tags": prof_data.expertise_tags,
        "ipo_track_record": [],
        "certifications": [],
        "sebi_registration": prof_data.sebi_registration,
        "ca_cs_membership": prof_data.ca_cs_membership,
        "services": prof_data.services,
        "pricing_model": prof_data.pricing_model,
        "hourly_rate": prof_data.hourly_rate,
        "clients": [],
        "ratings_count": 0,
        "average_rating": 0.0,
        "reviews": [],
        "is_verified": False,
        "consent_display": prof_data.consent_display,
        "consent_marketing": prof_data.consent_marketing,
        "status": "active",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.professionals.insert_one(prof_doc)
    
    prof_doc["created_at"] = now
    prof_doc["updated_at"] = now
    if "_id" in prof_doc:
        del prof_doc["_id"]
    
    return Professional(**prof_doc)

@api_router.put("/matchmaker/professionals/{professional_id}")
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

@api_router.post("/matchmaker/professionals/{professional_id}/review")
async def add_review(
    professional_id: str,
    review_data: ReviewCreate,
    user: User = Depends(get_current_user)
):
    """Add a review for a professional"""
    professional = await db.professionals.find_one(
        {"professional_id": professional_id},
        {"_id": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
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

@api_router.post("/matchmaker/enquiry")
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

@api_router.post("/matchmaker/consultation")
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

@api_router.get("/matchmaker/my-profile")
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

@api_router.post("/matchmaker/ai-recommend")
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
            system_message="""You are an expert IPO advisor AI assistant for IntelliEngine by IPO Labs. 
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

# Pre-IPO Funding Options
PRE_IPO_FUNDING_OPTIONS = [
    {
        "id": "angel_seed",
        "name": "Angel & Seed Investment",
        "description": "Early-stage equity for scaling operations",
        "long_description": "Angel investors and seed funds provide initial capital to help MSMEs grow their business, build their team, and prepare for subsequent funding rounds. This is typically the first external funding a company receives.",
        "typical_amount": "₹25 Lakhs - ₹5 Crores",
        "timeline": "2-6 months",
        "icon": "Sparkles"
    },
    {
        "id": "venture_capital",
        "name": "Venture Capital (VC)",
        "description": "Institutional growth capital for high-potential MSMEs",
        "long_description": "VCs invest larger amounts in exchange for equity, bringing not just capital but strategic guidance, industry connections, and operational expertise to help scale rapidly.",
        "typical_amount": "₹5 Crores - ₹100 Crores",
        "timeline": "3-9 months",
        "icon": "TrendingUp"
    },
    {
        "id": "private_equity",
        "name": "Private Equity (PE)",
        "description": "Large-scale funding for restructuring or major expansion",
        "long_description": "PE firms invest in established companies looking for significant capital for expansion, acquisitions, or restructuring before going public. They often take board seats and actively participate in governance.",
        "typical_amount": "₹50 Crores - ₹500 Crores+",
        "timeline": "6-12 months",
        "icon": "Building2"
    },
    {
        "id": "bridge_financing",
        "name": "Bridge Financing",
        "description": "Short-term loans to cover expenses until IPO proceeds arrive",
        "long_description": "Bridge loans provide temporary funding to cover operational expenses, IPO-related costs, or working capital needs during the gap between IPO filing and actual fund receipt.",
        "typical_amount": "₹5 Crores - ₹50 Crores",
        "timeline": "1-3 months",
        "icon": "ArrowRightLeft"
    },
    {
        "id": "mezzanine",
        "name": "Mezzanine Funding",
        "description": "Hybrid debt-equity to strengthen balance sheet before DRHP filing",
        "long_description": "Mezzanine financing combines debt and equity features, often used to strengthen the company's financial position before filing the DRHP. It typically converts to equity or gets repaid from IPO proceeds.",
        "typical_amount": "₹10 Crores - ₹100 Crores",
        "timeline": "3-6 months",
        "icon": "Layers"
    },
    {
        "id": "pre_ipo_placement",
        "name": "Pre-IPO Placement",
        "description": "Selling shares to select investors at negotiated price before public issue",
        "long_description": "Companies can sell a portion of shares to institutional investors, HNIs, or strategic partners before the IPO at a negotiated price. This validates company valuation and creates momentum for the public offering.",
        "typical_amount": "₹25 Crores - ₹200 Crores",
        "timeline": "2-4 months",
        "icon": "Users"
    }
]

# Post-IPO Funding Options
POST_IPO_FUNDING_OPTIONS = [
    {
        "id": "fpo",
        "name": "Follow-on Public Offer (FPO)",
        "description": "Issuing additional shares to the public after initial listing",
        "long_description": "An FPO allows listed companies to raise additional capital by issuing new shares to the public. It's suitable when significant capital is needed and market conditions are favorable.",
        "typical_amount": "₹100 Crores - ₹1000 Crores+",
        "timeline": "4-8 months",
        "icon": "Repeat"
    },
    {
        "id": "rights_issue",
        "name": "Rights Issue",
        "description": "Offering existing shareholders the right to buy additional shares at a discount",
        "long_description": "Existing shareholders get the first right to purchase new shares proportionate to their holdings, typically at a discount to market price. This rewards loyal shareholders while raising capital.",
        "typical_amount": "₹50 Crores - ₹500 Crores",
        "timeline": "2-4 months",
        "icon": "Award"
    },
    {
        "id": "qip",
        "name": "Qualified Institutional Placement (QIP)",
        "description": "Raising capital quickly from institutional investors",
        "long_description": "QIP is a faster route for listed companies to raise capital from Qualified Institutional Buyers (QIBs) like mutual funds, insurance companies, and foreign institutional investors without the extensive paperwork of a public offer.",
        "typical_amount": "₹100 Crores - ₹2000 Crores",
        "timeline": "1-2 months",
        "icon": "Landmark"
    },
    {
        "id": "preferential_allotment",
        "name": "Preferential Allotment",
        "description": "Issuing shares to a specific group of investors on private placement basis",
        "long_description": "Companies can issue shares to specific investors (promoters, strategic investors, institutions) on preferential basis. Useful for bringing in strategic partners or strengthening promoter holding.",
        "typical_amount": "₹25 Crores - ₹200 Crores",
        "timeline": "1-3 months",
        "icon": "UserPlus"
    },
    {
        "id": "ncds",
        "name": "Debt via NCDs",
        "description": "Issuing Non-Convertible Debentures to raise long-term debt",
        "long_description": "NCDs are debt instruments that pay fixed interest and return principal at maturity. Listed companies can issue NCDs publicly or privately to raise debt capital without diluting equity.",
        "typical_amount": "₹50 Crores - ₹500 Crores",
        "timeline": "2-4 months",
        "icon": "FileText"
    }
]

# Funding Partners (Real Indian Partners)
FUNDING_PARTNERS = {
    "investment_banks": [
        {"name": "Kotak Mahindra Capital", "type": "Domestic", "description": "Leading investment bank for IPOs and M&A", "website": "www.investmentbank.kotak.com"},
        {"name": "ICICI Securities", "type": "Domestic", "description": "Full-service investment banking and brokerage", "website": "www.icicisecurities.com"},
        {"name": "Axis Capital", "type": "Domestic", "description": "IPO advisory and capital markets services", "website": "www.axiscapital.co.in"},
        {"name": "JM Financial", "type": "Domestic", "description": "Investment banking and wealth management", "website": "www.jmfl.com"},
        {"name": "SBI Capital Markets", "type": "Domestic", "description": "State Bank group's investment banking arm", "website": "www.sbicaps.com"},
        {"name": "Jefferies India", "type": "Global", "description": "Global investment bank with India presence", "website": "www.jefferies.com"},
        {"name": "Morgan Stanley India", "type": "Global", "description": "Leading global investment bank", "website": "www.morganstanley.com"},
        {"name": "JP Morgan India", "type": "Global", "description": "Global financial services leader", "website": "www.jpmorgan.com"},
        {"name": "Avendus Capital", "type": "Domestic", "description": "Technology-focused investment bank", "website": "www.avendus.com"},
        {"name": "Edelweiss Financial", "type": "Domestic", "description": "Diversified financial services", "website": "www.edelweiss.in"}
    ],
    "hni_networks": [
        {"name": "Indian Angel Network (IAN)", "type": "Angel Network", "description": "India's largest angel investor network with 198+ investments", "website": "www.indianangelnetwork.com"},
        {"name": "Mumbai Angels Network", "type": "Angel Network", "description": "750+ members, 200+ investments, 100+ exits", "website": "www.mumbaiangels.com"},
        {"name": "JITO Angel Network", "type": "Angel Network", "description": "450+ investors, ₹147+ crores invested", "website": "www.jitoangelnetwork.com"},
        {"name": "Hyderabad Angels", "type": "Angel Network", "description": "Early-stage funding with global investor network", "website": "www.hyderabadangels.in"},
        {"name": "Phoenix Angels", "type": "Angel Network", "description": "Not-for-profit angel network", "website": "www.phoenixangels.in"},
        {"name": "LetsVenture", "type": "Platform", "description": "India's largest angel investing platform", "website": "www.letsventure.com"},
        {"name": "Venture Catalysts", "type": "Incubator", "description": "Leading startup incubator and angel fund", "website": "www.venturecatalysts.in"},
        {"name": "ah! Ventures", "type": "Angel Fund", "description": "SEBI-registered angel fund", "website": "www.ahventures.in"}
    ],
    "sovereign_wealth_funds": [
        {"name": "Abu Dhabi Investment Authority (ADIA)", "type": "Sovereign Fund", "description": "One of the world's largest sovereign wealth funds, active in India", "website": "www.adia.ae"},
        {"name": "GIC (Singapore)", "type": "Sovereign Fund", "description": "Singapore's sovereign wealth fund with major India investments", "website": "www.gic.com.sg"},
        {"name": "Temasek Holdings", "type": "Sovereign Fund", "description": "Singapore investment company with significant India portfolio", "website": "www.temasek.com.sg"},
        {"name": "Mubadala Investment Company", "type": "Sovereign Fund", "description": "Abu Dhabi-based global investor", "website": "www.mubadala.com"},
        {"name": "Qatar Investment Authority", "type": "Sovereign Fund", "description": "Qatar's sovereign wealth fund", "website": "www.qia.qa"},
        {"name": "NIIF (National Investment & Infrastructure Fund)", "type": "Indian Sovereign", "description": "India's quasi-sovereign wealth fund for infrastructure", "website": "www.niifindia.in"},
        {"name": "Public Investment Fund (Saudi)", "type": "Sovereign Fund", "description": "Saudi Arabia's sovereign wealth fund", "website": "www.pif.gov.sa"}
    ],
    "banks": [
        {"name": "State Bank of India", "type": "Public Sector", "description": "India's largest bank with comprehensive MSME financing", "website": "www.sbi.co.in"},
        {"name": "HDFC Bank", "type": "Private Sector", "description": "Leading private bank with strong corporate banking", "website": "www.hdfcbank.com"},
        {"name": "ICICI Bank", "type": "Private Sector", "description": "Major private bank with investment banking capabilities", "website": "www.icicibank.com"},
        {"name": "Bank of Baroda", "type": "Public Sector", "description": "Large PSU bank with MSME focus", "website": "www.bankofbaroda.in"},
        {"name": "Axis Bank", "type": "Private Sector", "description": "Third-largest private sector bank", "website": "www.axisbank.com"},
        {"name": "Punjab National Bank", "type": "Public Sector", "description": "Major PSU bank with nationwide presence", "website": "www.pnbindia.in"},
        {"name": "Kotak Mahindra Bank", "type": "Private Sector", "description": "Full-service private bank", "website": "www.kotak.com"},
        {"name": "Yes Bank", "type": "Private Sector", "description": "Private bank with corporate focus", "website": "www.yesbank.in"}
    ]
}

# Quiz Questions for Eligibility
QUIZ_QUESTIONS = {
    "common": [
        {
            "id": "annual_revenue",
            "question": "What is your Annual Revenue (Current FY)?",
            "type": "single_choice",
            "options": [
                {"value": "less_5cr", "label": "< ₹5 Crores", "score": 10},
                {"value": "5_25cr", "label": "₹5 - 25 Crores", "score": 25},
                {"value": "25_100cr", "label": "₹25 - 100 Crores", "score": 40},
                {"value": "more_100cr", "label": "> ₹100 Crores", "score": 50}
            ]
        },
        {
            "id": "profitability",
            "question": "What is your Profitability Status (EBITDA)?",
            "type": "single_choice",
            "options": [
                {"value": "negative", "label": "Negative", "score": 5},
                {"value": "breakeven", "label": "Break-even", "score": 15},
                {"value": "positive_1yr", "label": "Positive for 1 year", "score": 30},
                {"value": "positive_3yr", "label": "Positive for 3+ years", "score": 50}
            ]
        },
        {
            "id": "operational_history",
            "question": "How many years has your company been operational?",
            "type": "single_choice",
            "options": [
                {"value": "less_1yr", "label": "Less than 1 year", "score": 5},
                {"value": "1_3yr", "label": "1-3 years", "score": 15},
                {"value": "3_5yr", "label": "3-5 years", "score": 30},
                {"value": "more_5yr", "label": "More than 5 years", "score": 50}
            ]
        },
        {
            "id": "existing_loans",
            "question": "Do you have any existing loans or debt?",
            "type": "single_choice",
            "options": [
                {"value": "no_debt", "label": "No debt", "score": 40},
                {"value": "low_debt", "label": "Yes, but manageable (<30% of revenue)", "score": 30},
                {"value": "moderate_debt", "label": "Yes, moderate (30-60% of revenue)", "score": 20},
                {"value": "high_debt", "label": "Yes, high (>60% of revenue)", "score": 10}
            ]
        }
    ],
    "pre_ipo": [
        {
            "id": "audit_status",
            "question": "Are your financials audited by a Peer-Reviewed Auditor?",
            "type": "single_choice",
            "options": [
                {"value": "yes", "label": "Yes", "score": 50},
                {"value": "in_progress", "label": "In Progress", "score": 25},
                {"value": "no", "label": "No", "score": 10}
            ]
        },
        {
            "id": "funding_goal",
            "question": "What is the primary purpose of funding?",
            "type": "single_choice",
            "options": [
                {"value": "working_capital", "label": "Working Capital", "score": 30},
                {"value": "debt_repayment", "label": "Debt Repayment", "score": 25},
                {"value": "capex", "label": "Capital Expenditure (CapEx)", "score": 35},
                {"value": "rd", "label": "Research & Development", "score": 40}
            ]
        }
    ],
    "post_ipo": [
        {
            "id": "current_listing",
            "question": "Where is your company currently listed?",
            "type": "single_choice",
            "options": [
                {"value": "nse_emerge", "label": "NSE Emerge", "score": 30},
                {"value": "bse_sme", "label": "BSE SME", "score": 30},
                {"value": "mainboard", "label": "NSE/BSE Mainboard", "score": 50}
            ]
        },
        {
            "id": "shareholding_pattern",
            "question": "Are the promoters' shares locked-in or pledged?",
            "type": "single_choice",
            "options": [
                {"value": "no_pledge", "label": "No, shares are free", "score": 50},
                {"value": "locked_in", "label": "Locked-in (regulatory)", "score": 35},
                {"value": "pledged", "label": "Yes, shares are pledged", "score": 15}
            ]
        }
    ]
}

# Funding Module Models
class FundingDisclaimerConsent(BaseModel):
    agreed: bool
    timestamp: str
    user_id: str

class ExpertConsultationRequest(BaseModel):
    funding_type: str  # pre_ipo/post_ipo
    funding_option_id: str
    preferred_date: str
    preferred_time: str
    company_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    notes: Optional[str] = None
    quiz_score: Optional[int] = None
    quiz_tier: Optional[str] = None

class QuizSubmission(BaseModel):
    funding_type: str  # pre_ipo/post_ipo
    answers: dict  # question_id -> answer_value

class AIFitmentRequest(BaseModel):
    funding_option_id: str
    funding_type: str
    annual_revenue: str
    current_debt: str
    funding_goal: str

# Funding Module Endpoints
@api_router.get("/funding/pre-ipo-options")
async def get_pre_ipo_options():
    """Get all Pre-IPO funding options"""
    return {"options": PRE_IPO_FUNDING_OPTIONS}

@api_router.get("/funding/post-ipo-options")
async def get_post_ipo_options():
    """Get all Post-IPO funding options"""
    return {"options": POST_IPO_FUNDING_OPTIONS}

@api_router.get("/funding/partners")
async def get_funding_partners(category: Optional[str] = None):
    """Get funding partners, optionally filtered by category"""
    if category and category in FUNDING_PARTNERS:
        return {"partners": {category: FUNDING_PARTNERS[category]}}
    return {"partners": FUNDING_PARTNERS}

@api_router.get("/funding/quiz-questions")
async def get_quiz_questions(funding_type: str = "pre_ipo"):
    """Get quiz questions based on funding type"""
    questions = QUIZ_QUESTIONS["common"].copy()
    if funding_type == "pre_ipo":
        questions.extend(QUIZ_QUESTIONS["pre_ipo"])
    else:
        questions.extend(QUIZ_QUESTIONS["post_ipo"])
    return {"questions": questions, "funding_type": funding_type}

@api_router.post("/funding/quiz-evaluate")
async def evaluate_quiz(
    submission: QuizSubmission,
    user: User = Depends(get_current_user)
):
    """Evaluate quiz answers and return eligibility score with AI analysis"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Calculate base score
    total_score = 0
    max_possible = 0
    answer_details = []
    
    # Get questions for this funding type
    questions = QUIZ_QUESTIONS["common"].copy()
    if submission.funding_type == "pre_ipo":
        questions.extend(QUIZ_QUESTIONS["pre_ipo"])
    else:
        questions.extend(QUIZ_QUESTIONS["post_ipo"])
    
    # Calculate score
    for question in questions:
        q_id = question["id"]
        if q_id in submission.answers:
            answer_value = submission.answers[q_id]
            for option in question["options"]:
                if option["value"] == answer_value:
                    total_score += option["score"]
                    answer_details.append({
                        "question": question["question"],
                        "answer": option["label"],
                        "score": option["score"]
                    })
                    break
        max_possible += max(opt["score"] for opt in question["options"])
    
    # Normalize score to 0-100
    normalized_score = int((total_score / max_possible) * 100) if max_possible > 0 else 0
    
    # Determine tier
    if normalized_score >= 80:
        tier = "high_readiness"
        tier_label = "High Readiness"
        tier_message = "You are highly eligible! We are fast-tracking you to our Senior IPO Consultant."
        tier_action = "vip_booking"
    elif normalized_score >= 50:
        tier = "potentially_ready"
        tier_label = "Potentially Ready"
        tier_message = "You have a strong foundation. A discovery call will help bridge the gaps."
        tier_action = "standard_booking"
    else:
        tier = "early_stage"
        tier_label = "Early Stage"
        tier_message = "You're on the right track! We recommend our 'IPO Preparation Toolkit' before your first consultation."
        tier_action = "toolkit_download"
    
    # Generate AI Profile Summary
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"quiz_eval_{uuid.uuid4().hex[:8]}",
            system_message="You are an IPO funding expert. Generate a brief, professional profile summary based on the quiz responses."
        ).with_model("openai", "gpt-5.2")
        
        answers_text = "\n".join([f"- {d['question']}: {d['answer']}" for d in answer_details])
        prompt = f"""Based on these quiz responses for {submission.funding_type.replace('_', '-').upper()} funding eligibility:

{answers_text}

Overall Score: {normalized_score}/100 (Tier: {tier_label})

Generate a 3-4 sentence professional summary for our IPO consultant. Include:
1. Key financial strengths
2. Potential areas to address
3. Recommended funding approach

Keep it concise and actionable."""

        ai_summary = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI summary generation failed: {e}")
        ai_summary = f"Company has scored {normalized_score}/100 in {submission.funding_type.replace('_', '-').upper()} funding eligibility assessment. Based on the responses, the company falls in the '{tier_label}' category."
    
    # Store quiz result
    quiz_result = {
        "quiz_id": f"quiz_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "funding_type": submission.funding_type,
        "answers": submission.answers,
        "score": normalized_score,
        "tier": tier,
        "ai_summary": ai_summary,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.funding_quiz_results.insert_one(quiz_result)
    
    return {
        "score": normalized_score,
        "tier": tier,
        "tier_label": tier_label,
        "tier_message": tier_message,
        "tier_action": tier_action,
        "answer_details": answer_details,
        "ai_summary": ai_summary,
        "quiz_id": quiz_result["quiz_id"]
    }

@api_router.post("/funding/ai-fitment")
async def calculate_ai_fitment(
    request: AIFitmentRequest,
    user: User = Depends(get_current_user)
):
    """AI Funding Fitment Calculator - Quick 3-question analysis"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Find the funding option details
    all_options = PRE_IPO_FUNDING_OPTIONS + POST_IPO_FUNDING_OPTIONS
    funding_option = next((opt for opt in all_options if opt["id"] == request.funding_option_id), None)
    
    if not funding_option:
        raise HTTPException(status_code=404, detail="Funding option not found")
    
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"fitment_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert IPO funding advisor. Provide quick, accurate funding fitment analysis."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze funding fitment for:

Funding Type: {funding_option['name']}
Description: {funding_option['long_description']}
Typical Amount: {funding_option['typical_amount']}

Company Details:
- Annual Revenue: {request.annual_revenue}
- Current Debt Level: {request.current_debt}
- Funding Goal: {request.funding_goal}

Provide:
1. A probability score (0-100) of successfully securing this type of funding
2. A 2-sentence explanation
3. One key recommendation

Respond in JSON format:
{{"probability_score": 75, "explanation": "...", "recommendation": "..."}}"""

        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        import re
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {
                "probability_score": 65,
                "explanation": "Based on your profile, you have moderate eligibility for this funding type.",
                "recommendation": "Consider scheduling a consultation for personalized advice."
            }
        
        # Log the fitment calculation
        await db.funding_fitment_logs.insert_one({
            "log_id": f"fit_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "funding_option_id": request.funding_option_id,
            "probability_score": result["probability_score"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "funding_option": funding_option["name"],
            "probability_score": result["probability_score"],
            "explanation": result["explanation"],
            "recommendation": result["recommendation"]
        }
        
    except Exception as e:
        logger.error(f"AI fitment calculation failed: {e}")
        return {
            "funding_option": funding_option["name"],
            "probability_score": 60,
            "explanation": "Based on the provided information, you have moderate eligibility for this funding type.",
            "recommendation": "We recommend scheduling a consultation with our expert team for a detailed assessment."
        }

@api_router.post("/funding/book-consultation")
async def book_funding_consultation(
    request: ExpertConsultationRequest,
    user: User = Depends(get_current_user)
):
    """Book a consultation with IPO funding expert"""
    consultation_id = f"fcons_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Find the funding option details
    all_options = PRE_IPO_FUNDING_OPTIONS + POST_IPO_FUNDING_OPTIONS
    funding_option = next((opt for opt in all_options if opt["id"] == request.funding_option_id), None)
    
    consultation_doc = {
        "consultation_id": consultation_id,
        "user_id": user.user_id,
        "funding_type": request.funding_type,
        "funding_option_id": request.funding_option_id,
        "funding_option_name": funding_option["name"] if funding_option else request.funding_option_id,
        "preferred_date": request.preferred_date,
        "preferred_time": request.preferred_time,
        "company_name": request.company_name,
        "contact_name": request.contact_name,
        "contact_email": request.contact_email,
        "contact_phone": request.contact_phone,
        "notes": request.notes,
        "quiz_score": request.quiz_score,
        "quiz_tier": request.quiz_tier,
        "status": "requested",  # requested/confirmed/completed/cancelled
        "created_at": now.isoformat()
    }
    
    await db.funding_consultations.insert_one(consultation_doc)
    
    # In a real system, this would trigger email/SMS notifications
    # For now, we'll simulate a confirmation
    
    return {
        "consultation_id": consultation_id,
        "message": "Consultation request submitted successfully! Our team will confirm within 24 hours.",
        "confirmation": {
            "date": request.preferred_date,
            "time": request.preferred_time,
            "funding_topic": funding_option["name"] if funding_option else request.funding_option_id,
            "status": "Pending Confirmation"
        }
    }

@api_router.post("/funding/disclaimer-consent")
async def record_disclaimer_consent(
    consent: FundingDisclaimerConsent,
    user: User = Depends(get_current_user)
):
    """Record user's consent to funding disclaimer"""
    consent_doc = {
        "consent_id": f"consent_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "agreed": consent.agreed,
        "timestamp": consent.timestamp,
        "ip_address": None,  # Would capture in production
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.funding_consents.insert_one(consent_doc)
    
    return {"message": "Consent recorded successfully", "consent_id": consent_doc["consent_id"]}

@api_router.get("/funding/available-slots")
async def get_available_slots(date: str):
    """Get available consultation slots for a given date (mocked)"""
    # Mocked available slots
    base_slots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
    ]
    
    # Check for already booked slots on this date
    booked = await db.funding_consultations.find(
        {"preferred_date": date, "status": {"$in": ["requested", "confirmed"]}},
        {"preferred_time": 1, "_id": 0}
    ).to_list(100)
    
    booked_times = [b["preferred_time"] for b in booked]
    available_slots = [slot for slot in base_slots if slot not in booked_times]
    
    return {"date": date, "available_slots": available_slots}

# ============ IPO ASSESSMENT MODULE ============

# SEBI Eligibility Criteria
SEBI_MAINBOARD_CRITERIA = {
    "net_tangible_assets_min": 3,  # Crores for each of last 3 years
    "operating_profit_avg_min": 15,  # Crores average over 3 years
    "net_worth_min": 1,  # Crores for each of last 3 years
    "min_dilution_percent": 25  # Minimum public offering
}

SEBI_SME_CRITERIA = {
    "post_issue_capital_min": 1,  # Crores
    "post_issue_capital_max": 25,  # Crores
    "positive_net_worth": True,
    "profitable_years_min": 2
}

# Assessment Models
class AssessmentCompanyInfo(BaseModel):
    company_type: str  # private_limited / public_limited
    target_board: str  # sme / mainboard
    reporting_unit: str = "crores"  # lacs / crores

class AssessmentPLData(BaseModel):
    year1_pat: float  # Net Profit After Tax
    year2_pat: float
    year3_pat: float
    year1_ebitda: float
    year2_ebitda: float
    year3_ebitda: float
    year1_revenue: float
    year2_revenue: float
    year3_revenue: float

class AssessmentBalanceSheet(BaseModel):
    total_debt: float
    total_cash: float
    net_tangible_assets_y1: float
    net_tangible_assets_y2: float
    net_tangible_assets_y3: float
    net_worth_y1: float
    net_worth_y2: float
    net_worth_y3: float
    depreciation: float
    capital_expenditure: float
    working_capital_change: float

class AssessmentProjections(BaseModel):
    growth_rate: float  # Expected 5-year growth rate (%)
    wacc: float  # Weighted Average Cost of Capital (%)
    terminal_growth: float = 3.0  # Terminal growth rate (%)

class AssessmentMarketData(BaseModel):
    industry_pe: float
    peer_pe: float

class IPOAssessmentRequest(BaseModel):
    company_info: AssessmentCompanyInfo
    pl_data: AssessmentPLData
    balance_sheet: AssessmentBalanceSheet
    projections: AssessmentProjections
    market_data: AssessmentMarketData
    issue_type: str = "fresh"  # fresh / ofs / both
    dilution_percent: float = 25.0

def convert_to_crores(value: float, unit: str) -> float:
    """Convert value to crores if in lacs"""
    if unit == "lacs":
        return value / 100
    return value

def calculate_pe_valuation(pat: float, pe_multiple: float) -> dict:
    """PE Valuation Calculator"""
    if pat <= 0:
        return {
            "valuation": 0,
            "method": "P/E Multiple",
            "warning": "Negative PAT - P/E valuation not applicable"
        }
    
    valuation = pat * pe_multiple
    return {
        "valuation": round(valuation, 2),
        "method": "P/E Multiple",
        "pe_used": pe_multiple,
        "pat_used": pat,
        "formula": f"PAT (₹{pat:.2f} Cr) × P/E ({pe_multiple:.1f}x) = ₹{valuation:.2f} Cr"
    }

def calculate_dcf_valuation(
    base_fcf: float, 
    growth_rate: float, 
    wacc: float, 
    terminal_growth: float = 3.0,
    years: int = 5
) -> dict:
    """DCF Business Valuation Calculator"""
    if wacc <= terminal_growth:
        return {
            "valuation": 0,
            "method": "DCF",
            "warning": "WACC must be greater than terminal growth rate"
        }
    
    # Project FCF for 5 years
    fcf_projections = []
    current_fcf = base_fcf
    pv_fcf_sum = 0
    
    for year in range(1, years + 1):
        current_fcf = current_fcf * (1 + growth_rate / 100)
        discount_factor = 1 / ((1 + wacc / 100) ** year)
        pv_fcf = current_fcf * discount_factor
        pv_fcf_sum += pv_fcf
        fcf_projections.append({
            "year": year,
            "fcf": round(current_fcf, 2),
            "pv_fcf": round(pv_fcf, 2)
        })
    
    # Terminal Value using Gordon Growth
    terminal_fcf = current_fcf * (1 + terminal_growth / 100)
    terminal_value = terminal_fcf / ((wacc - terminal_growth) / 100)
    pv_terminal = terminal_value / ((1 + wacc / 100) ** years)
    
    total_value = pv_fcf_sum + pv_terminal
    
    return {
        "valuation": round(total_value, 2),
        "method": "DCF (Discounted Cash Flow)",
        "pv_fcf_sum": round(pv_fcf_sum, 2),
        "terminal_value": round(terminal_value, 2),
        "pv_terminal_value": round(pv_terminal, 2),
        "fcf_projections": fcf_projections,
        "formula": f"Sum of PV(FCF) + PV(Terminal Value) = ₹{pv_fcf_sum:.2f} + ₹{pv_terminal:.2f} = ₹{total_value:.2f} Cr"
    }

def calculate_issue_size(valuation: float, dilution_percent: float, issue_type: str) -> dict:
    """Issue Size Calculator"""
    post_money_valuation = valuation
    issue_size = (post_money_valuation * dilution_percent) / 100
    
    return {
        "post_money_valuation": round(post_money_valuation, 2),
        "dilution_percent": dilution_percent,
        "issue_type": issue_type,
        "total_issue_size": round(issue_size, 2),
        "formula": f"Valuation (₹{post_money_valuation:.2f} Cr) × Dilution ({dilution_percent}%) = ₹{issue_size:.2f} Cr"
    }

def calculate_fcfe(
    net_income: float,
    depreciation: float,
    capex: float,
    working_capital_change: float,
    net_debt_change: float = 0
) -> dict:
    """Free Cash Flow to Equity Calculator"""
    fcfe = net_income + depreciation - capex - working_capital_change + net_debt_change
    
    return {
        "fcfe": round(fcfe, 2),
        "components": {
            "net_income": net_income,
            "add_depreciation": depreciation,
            "less_capex": capex,
            "less_wc_change": working_capital_change,
            "net_debt_change": net_debt_change
        },
        "formula": f"PAT + D&A - CapEx - ΔWC + Net Debt = ₹{net_income:.2f} + ₹{depreciation:.2f} - ₹{capex:.2f} - ₹{working_capital_change:.2f} = ₹{fcfe:.2f} Cr",
        "fcfe_yield": round((fcfe / net_income * 100), 2) if net_income > 0 else 0
    }

def check_sebi_eligibility(data: IPOAssessmentRequest, unit: str) -> dict:
    """Check SEBI eligibility criteria"""
    bs = data.balance_sheet
    pl = data.pl_data
    target = data.company_info.target_board
    
    # Convert to crores if needed
    def to_cr(val):
        return convert_to_crores(val, unit)
    
    if target == "mainboard":
        criteria = SEBI_MAINBOARD_CRITERIA
        
        # Check Net Tangible Assets (min 3Cr each year)
        nta_y1 = to_cr(bs.net_tangible_assets_y1)
        nta_y2 = to_cr(bs.net_tangible_assets_y2)
        nta_y3 = to_cr(bs.net_tangible_assets_y3)
        nta_check = all([nta >= criteria["net_tangible_assets_min"] for nta in [nta_y1, nta_y2, nta_y3]])
        nta_min = min(nta_y1, nta_y2, nta_y3)
        
        # Check Operating Profit (avg 15Cr over 3 years)
        op_avg = (to_cr(pl.year1_ebitda) + to_cr(pl.year2_ebitda) + to_cr(pl.year3_ebitda)) / 3
        op_check = op_avg >= criteria["operating_profit_avg_min"]
        
        # Check Net Worth (min 1Cr each year)
        nw_y1 = to_cr(bs.net_worth_y1)
        nw_y2 = to_cr(bs.net_worth_y2)
        nw_y3 = to_cr(bs.net_worth_y3)
        nw_check = all([nw >= criteria["net_worth_min"] for nw in [nw_y1, nw_y2, nw_y3]])
        nw_min = min(nw_y1, nw_y2, nw_y3)
        
        checks = [
            {
                "criterion": "Net Tangible Assets (≥₹3Cr each year)",
                "required": f"≥ ₹{criteria['net_tangible_assets_min']} Cr",
                "actual": f"Min: ₹{nta_min:.2f} Cr",
                "passed": nta_check,
                "gap": max(0, criteria["net_tangible_assets_min"] - nta_min) if not nta_check else 0
            },
            {
                "criterion": "Avg Operating Profit (≥₹15Cr over 3 years)",
                "required": f"≥ ₹{criteria['operating_profit_avg_min']} Cr",
                "actual": f"₹{op_avg:.2f} Cr",
                "passed": op_check,
                "gap": max(0, criteria["operating_profit_avg_min"] - op_avg) if not op_check else 0
            },
            {
                "criterion": "Net Worth (≥₹1Cr each year)",
                "required": f"≥ ₹{criteria['net_worth_min']} Cr",
                "actual": f"Min: ₹{nw_min:.2f} Cr",
                "passed": nw_check,
                "gap": max(0, criteria["net_worth_min"] - nw_min) if not nw_check else 0
            }
        ]
        
        passed_count = sum(1 for c in checks if c["passed"])
        
        return {
            "board": "Mainboard (NSE/BSE)",
            "checks": checks,
            "passed_count": passed_count,
            "total_checks": len(checks),
            "eligible": passed_count == len(checks)
        }
    
    else:  # SME
        criteria = SEBI_SME_CRITERIA
        
        # Positive Net Worth
        nw_positive = all([
            to_cr(bs.net_worth_y1) > 0,
            to_cr(bs.net_worth_y2) > 0,
            to_cr(bs.net_worth_y3) > 0
        ])
        
        # Profitable for at least 2 years
        profits = [to_cr(pl.year1_pat), to_cr(pl.year2_pat), to_cr(pl.year3_pat)]
        profitable_years = sum(1 for p in profits if p > 0)
        profit_check = profitable_years >= criteria["profitable_years_min"]
        
        checks = [
            {
                "criterion": "Positive Net Worth",
                "required": "Positive in all 3 years",
                "actual": "Met" if nw_positive else "Not Met",
                "passed": nw_positive,
                "gap": 0
            },
            {
                "criterion": "Profitability Track Record",
                "required": f"≥ {criteria['profitable_years_min']} years",
                "actual": f"{profitable_years} years",
                "passed": profit_check,
                "gap": max(0, criteria["profitable_years_min"] - profitable_years) if not profit_check else 0
            }
        ]
        
        passed_count = sum(1 for c in checks if c["passed"])
        
        return {
            "board": "SME Board (NSE Emerge / BSE SME)",
            "checks": checks,
            "passed_count": passed_count,
            "total_checks": len(checks),
            "eligible": passed_count == len(checks)
        }

def determine_readiness_status(eligibility: dict, pe_valuation: dict, dcf_valuation: dict, fcfe: dict) -> dict:
    """Determine overall IPO readiness status"""
    issues = []
    
    # Check eligibility
    if not eligibility["eligible"]:
        failed_checks = [c for c in eligibility["checks"] if not c["passed"]]
        for check in failed_checks:
            issues.append({
                "type": "eligibility",
                "severity": "critical",
                "description": f"{check['criterion']}: Required {check['required']}, Current {check['actual']}"
            })
    
    # Check valuation concerns
    if pe_valuation.get("warning"):
        issues.append({
            "type": "valuation",
            "severity": "warning",
            "description": pe_valuation["warning"]
        })
    
    if dcf_valuation.get("warning"):
        issues.append({
            "type": "valuation",
            "severity": "warning",
            "description": dcf_valuation["warning"]
        })
    
    # Check FCFE
    if fcfe["fcfe"] < 0:
        issues.append({
            "type": "cash_flow",
            "severity": "warning",
            "description": f"Negative FCFE (₹{fcfe['fcfe']:.2f} Cr) - May concern dividend-seeking investors"
        })
    
    # Determine status
    critical_issues = [i for i in issues if i["severity"] == "critical"]
    warning_issues = [i for i in issues if i["severity"] == "warning"]
    
    if len(critical_issues) == 0 and len(warning_issues) == 0:
        status = "ready"
        status_label = "IPO Ready"
        status_message = "Your company meets all SEBI criteria and financial benchmarks for an IPO!"
        score = 90
    elif len(critical_issues) == 0 and len(warning_issues) <= 2:
        status = "ready"
        status_label = "IPO Ready (with minor concerns)"
        status_message = "Your company is eligible for IPO with some areas to address."
        score = 75
    elif len(critical_issues) <= 1:
        status = "planning_required"
        status_label = "Requires 1-2 Years Planning"
        status_message = "You're on the path to IPO! Focus on addressing the identified gaps."
        score = 50
    else:
        status = "not_eligible"
        status_label = "Not Yet Eligible"
        status_message = "Your company needs to strengthen its financials before considering an IPO."
        score = 25
    
    return {
        "status": status,
        "status_label": status_label,
        "status_message": status_message,
        "score": score,
        "issues": issues,
        "critical_count": len(critical_issues),
        "warning_count": len(warning_issues)
    }

@api_router.post("/assessment/calculate")
async def run_ipo_assessment(
    data: IPOAssessmentRequest,
    user: User = Depends(get_current_user)
):
    """Run complete IPO Assessment with all 4 calculators"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    unit = data.company_info.reporting_unit
    
    # Convert all values to crores for calculations
    def to_cr(val):
        return convert_to_crores(val, unit)
    
    # Get latest year PAT for PE calculation
    latest_pat = to_cr(data.pl_data.year3_pat)
    avg_pe = (data.market_data.industry_pe + data.market_data.peer_pe) / 2
    
    # Calculate FCFE first (needed for DCF)
    fcfe_result = calculate_fcfe(
        net_income=latest_pat,
        depreciation=to_cr(data.balance_sheet.depreciation),
        capex=to_cr(data.balance_sheet.capital_expenditure),
        working_capital_change=to_cr(data.balance_sheet.working_capital_change)
    )
    
    # 1. PE Valuation
    pe_valuation = calculate_pe_valuation(latest_pat, avg_pe)
    
    # 2. DCF Valuation
    dcf_valuation = calculate_dcf_valuation(
        base_fcf=fcfe_result["fcfe"] if fcfe_result["fcfe"] > 0 else latest_pat * 0.6,
        growth_rate=data.projections.growth_rate,
        wacc=data.projections.wacc,
        terminal_growth=data.projections.terminal_growth
    )
    
    # 3. Issue Size Calculator
    avg_valuation = 0
    valid_valuations = []
    if pe_valuation.get("valuation", 0) > 0:
        valid_valuations.append(pe_valuation["valuation"])
    if dcf_valuation.get("valuation", 0) > 0:
        valid_valuations.append(dcf_valuation["valuation"])
    
    if valid_valuations:
        avg_valuation = sum(valid_valuations) / len(valid_valuations)
    
    issue_size = calculate_issue_size(
        valuation=avg_valuation,
        dilution_percent=data.dilution_percent,
        issue_type=data.issue_type
    )
    
    # 4. SEBI Eligibility Check
    eligibility = check_sebi_eligibility(data, unit)
    
    # 5. Determine Readiness Status
    readiness = determine_readiness_status(eligibility, pe_valuation, dcf_valuation, fcfe_result)
    
    # Calculate suggested price band (10-15% discount)
    if avg_valuation > 0:
        price_band_low = avg_valuation * 0.85
        price_band_high = avg_valuation * 0.90
    else:
        price_band_low = 0
        price_band_high = 0
    
    # Generate AI-powered gap analysis
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"assessment_{uuid.uuid4().hex[:8]}",
            system_message="""You are an expert Indian IPO advisor at IntelliEngine by IPO Labs. 
Your role is to analyze IPO readiness and provide actionable recommendations.
Only recommend services available on IntelliEngine platform:
1. DRHP Builder - For preparing Draft Red Herring Prospectus
2. IPO Match Maker - For connecting with CAs, CSs, CFOs, legal experts
3. IPO Funding Module - For Pre-IPO and Post-IPO funding options
Do not recommend external services or competitors."""
        ).with_model("openai", "gpt-5.2")
        
        # Prepare context
        issues_text = "\n".join([f"- [{i['severity'].upper()}] {i['description']}" for i in readiness["issues"]])
        if not issues_text:
            issues_text = "No major issues identified."
        
        prompt = f"""Analyze this IPO readiness assessment for an Indian company:

Company: {data.company_info.company_type.replace('_', ' ').title()} targeting {data.company_info.target_board.upper()} listing

FINANCIAL HIGHLIGHTS:
- Latest Year PAT: ₹{latest_pat:.2f} Crores
- 3-Year Avg EBITDA: ₹{(to_cr(data.pl_data.year1_ebitda) + to_cr(data.pl_data.year2_ebitda) + to_cr(data.pl_data.year3_ebitda))/3:.2f} Crores
- FCFE: ₹{fcfe_result['fcfe']:.2f} Crores
- Net Worth (Latest): ₹{to_cr(data.balance_sheet.net_worth_y3):.2f} Crores

VALUATION:
- P/E Based: ₹{pe_valuation.get('valuation', 0):.2f} Crores
- DCF Based: ₹{dcf_valuation.get('valuation', 0):.2f} Crores
- Average: ₹{avg_valuation:.2f} Crores

ELIGIBILITY: {eligibility['board']}
- Passed: {eligibility['passed_count']}/{eligibility['total_checks']} criteria
- Eligible: {'Yes' if eligibility['eligible'] else 'No'}

ISSUES IDENTIFIED:
{issues_text}

READINESS SCORE: {readiness['score']}/100 ({readiness['status_label']})

Provide a concise analysis (max 150 words) with:
1. Key strengths (2 bullet points)
2. Priority actions to improve readiness (2-3 bullet points)
3. Which IntelliEngine module to use first (DRHP Builder, Match Maker, or IPO Funding)

Use professional Indian financial terminology. Be direct and actionable."""

        ai_analysis = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI analysis generation failed: {e}")
        ai_analysis = "AI analysis unavailable. Please consult with our experts through the Match Maker module for detailed guidance."
    
    # Store assessment result
    assessment_id = f"assess_{uuid.uuid4().hex[:12]}"
    assessment_doc = {
        "assessment_id": assessment_id,
        "user_id": user.user_id,
        "company_info": data.company_info.model_dump(),
        "input_data": {
            "pl_data": data.pl_data.model_dump(),
            "balance_sheet": data.balance_sheet.model_dump(),
            "projections": data.projections.model_dump(),
            "market_data": data.market_data.model_dump()
        },
        "results": {
            "pe_valuation": pe_valuation,
            "dcf_valuation": dcf_valuation,
            "fcfe": fcfe_result,
            "issue_size": issue_size,
            "eligibility": eligibility,
            "readiness": readiness
        },
        "ai_analysis": ai_analysis,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ipo_assessments.insert_one(assessment_doc)
    
    return {
        "assessment_id": assessment_id,
        "company_info": {
            "type": data.company_info.company_type,
            "target_board": data.company_info.target_board,
            "reporting_unit": unit
        },
        "calculators": {
            "pe_valuation": pe_valuation,
            "dcf_valuation": dcf_valuation,
            "fcfe": fcfe_result,
            "issue_size": issue_size
        },
        "eligibility": eligibility,
        "readiness": readiness,
        "valuation_summary": {
            "average_valuation": round(avg_valuation, 2),
            "suggested_price_band": {
                "low": round(price_band_low, 2),
                "high": round(price_band_high, 2)
            }
        },
        "ai_analysis": ai_analysis,
        "disclaimer": "This IPO Readiness Assessment is a preliminary analysis based on the information provided and SEBI's general guidelines. It is not a substitute for professional legal, financial, or accounting advice."
    }

@api_router.get("/assessment/history")
async def get_assessment_history(user: User = Depends(get_current_user)):
    """Get user's assessment history"""
    assessments = await db.ipo_assessments.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {"assessments": assessments}

@api_router.get("/assessment/{assessment_id}")
async def get_assessment_detail(
    assessment_id: str,
    user: User = Depends(get_current_user)
):
    """Get specific assessment details"""
    assessment = await db.ipo_assessments.find_one(
        {"assessment_id": assessment_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return assessment

# ============ ADMIN CENTER MODULE ============

# Default Roles and Permissions
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
    {"id": "matchmaker", "name": "Match Maker", "description": "Professional matching service"},
    {"id": "analytics", "name": "Analytics", "description": "Market and DRHP analytics"},
    {"id": "admin_center", "name": "Admin Center", "description": "Role and user management"},
    {"id": "user_management", "name": "User Management", "description": "Manage team members"}
]

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

# Helper to check admin access
async def require_admin(user: User = Depends(get_current_user)):
    """Require admin or super_admin role"""
    if user.role not in ["admin", "super_admin", "Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_super_admin(user: User = Depends(get_current_user)):
    """Require super_admin role"""
    if user.role not in ["super_admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user

# Log audit action helper
async def log_audit_action(user_id: str, action_type: str, module: str, details: str = None, resource_id: str = None):
    """Log an audit action"""
    audit_entry = {
        "log_id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "action_type": action_type,
        "module": module,
        "details": details,
        "resource_id": resource_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip_address": None  # Would capture in production
    }
    await db.audit_logs.insert_one(audit_entry)

@api_router.get("/admin/roles")
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

@api_router.get("/admin/features")
async def get_platform_features(user: User = Depends(require_admin)):
    """Get all platform features for permission matrix"""
    return {"features": PLATFORM_FEATURES}

@api_router.get("/admin/permission-matrix")
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

@api_router.post("/admin/roles")
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

@api_router.put("/admin/roles/{role_id}")
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

@api_router.delete("/admin/roles/{role_id}")
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

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(require_admin)):
    """Get all users with their roles"""
    users = await db.users.find({}, {"_id": 0}).to_list(500)
    
    # Add role details
    for u in users:
        role_id = u.get("role", "viewer").lower().replace(" ", "_")
        if role_id in DEFAULT_ROLES:
            u["role_details"] = DEFAULT_ROLES[role_id]
        else:
            custom_role = await db.custom_roles.find_one({"role_id": role_id}, {"_id": 0})
            u["role_details"] = custom_role if custom_role else DEFAULT_ROLES["viewer"]
    
    return {"users": users}

@api_router.post("/admin/users/assign-role")
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

@api_router.get("/admin/audit-logs")
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

@api_router.post("/admin/audit-logs")
async def create_audit_log(
    entry: AuditLogEntry,
    user: User = Depends(get_current_user)
):
    """Create an audit log entry (for frontend tracking)"""
    await log_audit_action(user.user_id, entry.action_type, entry.module, entry.details, entry.resource_id)
    return {"message": "Audit log created"}

# ============ ACCOUNT DETAILS MODULE ============

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    designation: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# Subscription Plans (MOCKED - Razorpay placeholders)
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

@api_router.get("/account/profile")
async def get_user_profile(user: User = Depends(get_current_user)):
    """Get current user's profile"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get role details
    role_id = user_doc.get("role", "viewer").lower().replace(" ", "_")
    if role_id in DEFAULT_ROLES:
        user_doc["role_details"] = DEFAULT_ROLES[role_id]
    
    # Get subscription info
    subscription = await db.subscriptions.find_one({"user_id": user.user_id}, {"_id": 0})
    if subscription:
        user_doc["subscription"] = subscription
    else:
        user_doc["subscription"] = {
            "plan_id": "free",
            "status": "active",
            "started_at": user_doc.get("created_at")
        }
    
    return user_doc

@api_router.put("/account/profile")
async def update_user_profile(
    profile: ProfileUpdate,
    user: User = Depends(get_current_user)
):
    """Update user profile information"""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update_data}
    )
    
    await log_audit_action(user.user_id, "update", "account", "Updated profile information")
    
    return {"message": "Profile updated successfully"}

@api_router.post("/account/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload profile picture to GridFS"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Max file size: 5MB
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Delete existing profile picture if exists
    existing_user = await db.users.find_one({"user_id": user.user_id})
    if existing_user and existing_user.get("profile_picture_id"):
        try:
            await fs_bucket.delete(ObjectId(existing_user["profile_picture_id"]))
        except:
            pass
    
    # Upload to GridFS
    file_id = await fs_bucket.upload_from_stream(
        f"profile_{user.user_id}_{file.filename}",
        io.BytesIO(content),
        metadata={
            "user_id": user.user_id,
            "content_type": file.content_type,
            "type": "profile_picture"
        }
    )
    
    # Update user record
    picture_url = f"/api/account/profile-picture/{str(file_id)}"
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "picture": picture_url,
            "profile_picture_id": str(file_id),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit_action(user.user_id, "update", "account", "Updated profile picture")
    
    return {"message": "Profile picture uploaded", "picture_url": picture_url}

@api_router.get("/account/profile-picture/{file_id}")
async def get_profile_picture(file_id: str):
    """Get profile picture from GridFS"""
    try:
        grid_out = await fs_bucket.open_download_stream(ObjectId(file_id))
        content = await grid_out.read()
        content_type = grid_out.metadata.get("content_type", "image/jpeg") if grid_out.metadata else "image/jpeg"
        
        return Response(
            content=content,
            media_type=content_type,
            headers={"Cache-Control": "max-age=86400"}
        )
    except Exception as e:
        logger.error(f"Failed to get profile picture: {e}")
        raise HTTPException(status_code=404, detail="Profile picture not found")

@api_router.post("/account/change-password")
async def change_password(
    password_data: PasswordChange,
    user: User = Depends(get_current_user)
):
    """Change user password (for future email/password auth)"""
    # This is a placeholder for when email/password auth is implemented
    # Currently using Google OAuth, so password change is not applicable
    
    # In future implementation:
    # 1. Verify current password
    # 2. Hash new password
    # 3. Update in database
    # 4. Invalidate existing sessions
    
    await log_audit_action(user.user_id, "update", "account", "Password change attempted (OAuth user)")
    
    return {
        "message": "Password change is not available for OAuth users. Your account is secured via Google authentication.",
        "auth_type": "google_oauth"
    }

@api_router.get("/account/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    """Get current subscription details"""
    subscription = await db.subscriptions.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not subscription:
        # Return free plan by default
        subscription = {
            "plan_id": "free",
            "plan_name": "Free",
            "status": "active",
            "started_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at)
        }
    
    # Get plan details
    plan = next((p for p in SUBSCRIPTION_PLANS if p["plan_id"] == subscription["plan_id"]), SUBSCRIPTION_PLANS[0])
    subscription["plan_details"] = plan
    
    return subscription

@api_router.get("/account/subscription/plans")
async def get_available_plans():
    """Get all available subscription plans"""
    return {"plans": SUBSCRIPTION_PLANS}

@api_router.post("/account/subscription/upgrade")
async def upgrade_subscription(
    plan_id: str,
    user: User = Depends(get_current_user)
):
    """Initiate subscription upgrade (MOCKED - Razorpay placeholder)"""
    # Validate plan
    plan = next((p for p in SUBSCRIPTION_PLANS if p["plan_id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan_id == "free":
        raise HTTPException(status_code=400, detail="Cannot upgrade to free plan")
    
    # MOCKED: In real implementation, this would:
    # 1. Create Razorpay subscription
    # 2. Return payment link
    # 3. Handle webhook for payment confirmation
    
    # Placeholder response
    subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
    
    # Store pending subscription
    await db.subscriptions.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "user_id": user.user_id,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "status": "pending",  # Would be 'active' after payment
            "amount": plan["price"],
            "currency": plan["currency"],
            "billing_cycle": plan["billing_cycle"],
            "razorpay_subscription_id": subscription_id,  # Placeholder
            "started_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "create", "billing", f"Initiated upgrade to {plan['name']} plan")
    
    # MOCKED: Return placeholder payment info
    return {
        "message": "Subscription upgrade initiated",
        "subscription_id": subscription_id,
        "plan": plan,
        "payment_info": {
            "gateway": "razorpay",
            "status": "MOCKED - Payment gateway not integrated",
            "note": "In production, this would return a Razorpay payment link"
        }
    }

@api_router.post("/account/subscription/cancel")
async def cancel_subscription(user: User = Depends(get_current_user)):
    """Cancel current subscription (MOCKED)"""
    subscription = await db.subscriptions.find_one({"user_id": user.user_id})
    
    if not subscription or subscription.get("plan_id") == "free":
        raise HTTPException(status_code=400, detail="No active paid subscription to cancel")
    
    # MOCKED: In real implementation, would cancel via Razorpay API
    await db.subscriptions.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "ends_at": datetime.now(timezone.utc).isoformat()  # Would be end of billing period
        }}
    )
    
    await log_audit_action(user.user_id, "update", "billing", "Cancelled subscription")
    
    return {
        "message": "Subscription cancelled",
        "note": "MOCKED - In production, subscription would end at current billing period"
    }

@api_router.get("/account/billing/transactions")
async def get_transaction_history(
    user: User = Depends(get_current_user),
    limit: int = 20
):
    """Get billing transaction history (MOCKED)"""
    transactions = await db.transactions.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # If no transactions, return mock data for demo
    if not transactions:
        transactions = [
            {
                "transaction_id": "txn_demo_001",
                "type": "subscription",
                "description": "Free Plan - No charge",
                "amount": 0,
                "currency": "INR",
                "status": "completed",
                "created_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at)
            }
        ]
    
    return {"transactions": transactions, "note": "MOCKED - Razorpay integration placeholder"}

@api_router.get("/account/billing/invoice/{transaction_id}")
async def download_invoice(
    transaction_id: str,
    user: User = Depends(get_current_user)
):
    """Download invoice for a transaction (MOCKED)"""
    # MOCKED: In real implementation, would generate PDF invoice
    await log_audit_action(user.user_id, "download", "billing", f"Downloaded invoice: {transaction_id}")
    
    return {
        "message": "Invoice download",
        "transaction_id": transaction_id,
        "note": "MOCKED - In production, this would return a PDF invoice",
        "invoice_url": f"/api/account/billing/invoice/{transaction_id}/pdf"
    }

# ============ COMMAND CENTER DASHBOARD ============

class ScheduleMeetingRequest(BaseModel):
    topic: str
    date: str
    time: str
    attendees: List[str] = []

class AIDelayExplanationRequest(BaseModel):
    section_name: str
    delay_days: int
    status: str

# Helper function to get checklist status
async def get_checklist_status(project_id: str, checklist_type: str) -> dict:
    """Get the status of a checklist for a project"""
    checklist = await db.checklists.find_one(
        {"project_id": project_id, "type": checklist_type},
        {"_id": 0}
    )
    
    if not checklist:
        # Return default pending counts based on checklist type
        default_pending = {
            "company_data": 45,  # 5 sections with ~9 fields each
            "promoter": 30,     # 6 sections
            "kmp": 30,          # 6 sections
            "pre_ipo": 68,      # 9 sections with multiple items
            "non_drhp": 34      # 8 sections with multiple items
        }
        return {
            "total": default_pending.get(checklist_type, 30),
            "completed": 0,
            "pending": default_pending.get(checklist_type, 30)
        }
    
    return {
        "total": checklist.get("total_items", 0),
        "completed": checklist.get("completed_items", 0),
        "pending": checklist.get("total_items", 0) - checklist.get("completed_items", 0)
    }

@api_router.get("/projects/{project_id}/command-center")
async def get_command_center_data(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get all command center dashboard data for a project"""
    # Verify project exists and user has access
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get sections data
    sections = await db.drhp_sections.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    
    # Calculate KPIs
    total_sections = len(sections)
    final_sections = sum(1 for s in sections if s.get("status") == "Final")
    review_sections = sum(1 for s in sections if s.get("status") == "Review")
    draft_sections = sum(1 for s in sections if s.get("status") == "Draft")
    
    readiness_score = int((final_sections / total_sections * 100)) if total_sections > 0 else 0
    
    # Calculate delays (sections past their deadline)
    today = datetime.now(timezone.utc)
    target_date = datetime(2026, 12, 31, tzinfo=timezone.utc)
    days_to_filing = max(0, (target_date - today).days)
    
    # Get delayed sections (mock: sections in Draft for more than 30 days)
    delayed_sections = []
    for section in sections:
        if section.get("status") == "Draft":
            created = section.get("created_at")
            if created:
                try:
                    created_date = datetime.fromisoformat(created.replace('Z', '+00:00'))
                    days_old = (today - created_date).days
                    if days_old > 30:
                        delayed_sections.append({
                            "section_name": section.get("section_name"),
                            "days_delayed": days_old - 30,
                            "status": section.get("status")
                        })
                except:
                    pass
    
    # Get team members (mock data + real users from project)
    team_members = [
        {"id": "mb1", "name": "Rajesh Mehta", "role": "Merchant Banker", "status": "online", "avatar": None, "email": "rajesh@merchantbank.com"},
        {"id": "ca1", "name": "CA Priya Sharma", "role": "Chartered Accountant", "status": "online", "avatar": None, "email": "priya.ca@audit.com"},
        {"id": "cs1", "name": "CS Amit Kumar", "role": "Company Secretary", "status": "offline", "avatar": None, "email": "amit.cs@legal.com"},
        {"id": "lc1", "name": "Adv. Neha Gupta", "role": "Legal Counsel", "status": "away", "avatar": None, "email": "neha@legalfirm.com"},
        {"id": "an1", "name": "Vikram Singh", "role": "Financial Analyst", "status": "online", "avatar": None, "email": "vikram@analysis.com"},
    ]
    
    # Active intermediaries (those online)
    active_intermediaries = [m for m in team_members if m["status"] == "online"]
    
    # Get version history (from audit logs)
    version_history = await db.audit_logs.find(
        {"module": "drhp_builder", "resource_id": project_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(5).to_list(5)
    
    # If no version history, create mock data
    if not version_history:
        version_history = [
            {"log_id": "vh1", "action_type": "save", "details": "Financials_v2.1 - Saved by CA Sharma", "timestamp": (today - timedelta(hours=2)).isoformat(), "user_name": "CA Priya Sharma"},
            {"log_id": "vh2", "action_type": "save", "details": "Risk_Factors_v3.0 - Reviewed by Legal", "timestamp": (today - timedelta(hours=5)).isoformat(), "user_name": "Adv. Neha Gupta"},
            {"log_id": "vh3", "action_type": "update", "details": "Cover_Page_v1.5 - Updated company info", "timestamp": (today - timedelta(days=1)).isoformat(), "user_name": "Rajesh Mehta"},
            {"log_id": "vh4", "action_type": "save", "details": "Industry_Overview_v2.0 - Market data added", "timestamp": (today - timedelta(days=1, hours=3)).isoformat(), "user_name": "Vikram Singh"},
            {"log_id": "vh5", "action_type": "review", "details": "Capital_Structure_v1.2 - Pending review", "timestamp": (today - timedelta(days=2)).isoformat(), "user_name": "CS Amit Kumar"},
        ]
    
    # Get audit trail
    audit_trail = await db.audit_logs.find(
        {"$or": [{"resource_id": project_id}, {"module": "drhp_builder"}]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)
    
    # If no audit trail, create mock data
    if not audit_trail:
        audit_trail = [
            {"log_id": "at1", "action_type": "view", "module": "risk_factors", "details": "Merchant Banker viewed Risk Factors", "timestamp": (today - timedelta(minutes=15)).isoformat(), "user_name": "Rajesh Mehta"},
            {"log_id": "at2", "action_type": "edit", "module": "financials", "details": "Updated FY2025 revenue figures", "timestamp": (today - timedelta(hours=1)).isoformat(), "user_name": "CA Priya Sharma"},
            {"log_id": "at3", "action_type": "upload", "module": "legal", "details": "Uploaded litigation documents", "timestamp": (today - timedelta(hours=3)).isoformat(), "user_name": "Adv. Neha Gupta"},
            {"log_id": "at4", "action_type": "comment", "module": "capital_structure", "details": "Added review comment on shareholding", "timestamp": (today - timedelta(hours=5)).isoformat(), "user_name": "CS Amit Kumar"},
            {"log_id": "at5", "action_type": "approve", "module": "cover_page", "details": "Approved final version", "timestamp": (today - timedelta(days=1)).isoformat(), "user_name": "Rajesh Mehta"},
        ]
    
    # Upcoming meetings (mock data)
    upcoming_meetings = [
        {"id": "m1", "topic": "DRHP Review Call", "date": (today + timedelta(days=2)).strftime("%Y-%m-%d"), "time": "10:00 AM", "attendees": ["Rajesh Mehta", "CA Priya Sharma"]},
        {"id": "m2", "topic": "Legal Due Diligence", "date": (today + timedelta(days=5)).strftime("%Y-%m-%d"), "time": "2:30 PM", "attendees": ["Adv. Neha Gupta", "CS Amit Kumar"]},
    ]
    
    # Upcoming deadlines (mock data based on sections)
    upcoming_deadlines = [
        {"id": "d1", "task": "Financial Statements Sign-off", "due_date": (today + timedelta(days=7)).strftime("%Y-%m-%d"), "section": "Financial Information", "priority": "high"},
        {"id": "d2", "task": "Risk Factors Final Review", "due_date": (today + timedelta(days=10)).strftime("%Y-%m-%d"), "section": "Risk Factors", "priority": "medium"},
        {"id": "d3", "task": "Legal Opinion Submission", "due_date": (today + timedelta(days=14)).strftime("%Y-%m-%d"), "section": "Legal and Regulatory Matters", "priority": "high"},
    ]
    
    # Compliance status
    sebi_requirements = 13  # Total SEBI required sections
    completed_requirements = final_sections + review_sections
    gap_count = sebi_requirements - completed_requirements
    
    return {
        "project": {
            "project_id": project.get("project_id"),
            "company_name": project.get("company_name"),
            "sector": project.get("sector"),
            "target_filing_date": "2026-12-31"
        },
        "kpi_ribbon": {
            "readiness_score": readiness_score,
            "days_to_filing": days_to_filing,
            "active_intermediaries": active_intermediaries,
            "critical_delays": len(delayed_sections),
            "delayed_sections": delayed_sections,
            "upcoming_meetings": upcoming_meetings,
            "upcoming_deadlines": upcoming_deadlines
        },
        "sections": sections,
        "section_stats": {
            "total": total_sections,
            "final": final_sections,
            "review": review_sections,
            "draft": draft_sections
        },
        "compliance": {
            "overall_progress": int((completed_requirements / sebi_requirements) * 100),
            "gap_count": gap_count,
            "delayed_modules": delayed_sections
        },
        "version_history": version_history,
        "audit_trail": audit_trail,
        "team_members": team_members,
        "checklists": {
            "company_data": await get_checklist_status(project_id, "company_data"),
            "promoter": await get_checklist_status(project_id, "promoter"),
            "kmp": await get_checklist_status(project_id, "kmp"),
            "pre_ipo": await get_checklist_status(project_id, "pre_ipo"),
            "non_drhp": await get_checklist_status(project_id, "non_drhp")
        }
    }

@api_router.post("/projects/{project_id}/schedule-meeting")
async def schedule_meeting(
    project_id: str,
    meeting: ScheduleMeetingRequest,
    user: User = Depends(get_current_user)
):
    """Schedule a meeting for the project team (MOCKED)"""
    # Generate mock Google Meet link
    meet_code = uuid.uuid4().hex[:10]
    meet_link = f"https://meet.google.com/{meet_code[:3]}-{meet_code[3:7]}-{meet_code[7:]}"
    
    meeting_doc = {
        "meeting_id": f"meet_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "topic": meeting.topic,
        "date": meeting.date,
        "time": meeting.time,
        "attendees": meeting.attendees,
        "created_by": user.user_id,
        "meet_link": meet_link,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.meetings.insert_one(meeting_doc)
    
    await log_audit_action(user.user_id, "create", "meetings", f"Scheduled meeting: {meeting.topic}")
    
    return {
        "message": "Meeting scheduled successfully",
        "meeting_id": meeting_doc["meeting_id"],
        "meet_link": meet_link,
        "note": "MOCKED - Google Meet link is a placeholder"
    }

@api_router.get("/projects/{project_id}/meetings")
async def get_project_meetings(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get all meetings for a project"""
    meetings = await db.meetings.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("date", 1).to_list(50)
    
    return {"meetings": meetings}

@api_router.post("/projects/{project_id}/ai-delay-explanation")
async def get_ai_delay_explanation(
    project_id: str,
    request: AIDelayExplanationRequest,
    user: User = Depends(get_current_user)
):
    """Generate AI explanation for a section delay using GPT-5.2"""
    from emergentintegrations.llm.chat import chat, LlmModel
    
    prompt = f"""You are an IPO readiness assistant for IntelliEngine platform. Generate a brief, professional explanation for why a DRHP section might be delayed.

Section: {request.section_name}
Days Delayed: {request.delay_days} days
Current Status: {request.status}

Provide a concise 1-2 sentence explanation of likely reasons for the delay and what actions might be needed. Be specific to Indian IPO/SEBI context.
Keep the response under 100 words."""

    try:
        response = await chat(
            model=LlmModel.GPT_5_2,
            user_prompt=prompt,
            memory=[]
        )
        return {
            "explanation": response.response,
            "section": request.section_name,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"AI delay explanation error: {e}")
        # Fallback explanations
        fallback_explanations = {
            "Financial Information": "Pending peer review audit for FY 2025. The statutory auditor's sign-off is required before finalization.",
            "Risk Factors": "Legal team reviewing additional regulatory risks. Waiting for updated compliance assessment.",
            "Legal and Regulatory Matters": "Ongoing litigation status update pending from external counsel. Expected resolution in 2 weeks.",
            "Capital Structure": "Share capital reconciliation in progress. ESOP pool adjustments being finalized.",
            "Cover Page": "Lead manager details and pricing band pending final confirmation.",
            "default": f"Section requires additional review and inputs from relevant stakeholders. {request.delay_days} days overdue."
        }
        return {
            "explanation": fallback_explanations.get(request.section_name, fallback_explanations["default"]),
            "section": request.section_name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "note": "Fallback explanation used"
        }

# ============ DATA CAPTURE CHECKLISTS ============

# Company Data Checklist
COMPANY_DATA_SECTIONS = {
    "corporate_identification": {
        "name": "Corporate & Company Identification",
        "fields": [
            {"id": "legal_name", "label": "Full Legal Name of Company", "type": "text", "required": True},
            {"id": "registered_address", "label": "Registered & Corporate Office Address", "type": "textarea", "required": True},
            {"id": "cin", "label": "Corporate Identity Number (CIN)", "type": "text", "required": True},
            {"id": "website", "label": "Company Website", "type": "url", "required": False},
            {"id": "incorporation_date", "label": "Date of Incorporation", "type": "date", "required": True},
            {"id": "pan", "label": "PAN (Permanent Account Number)", "type": "text", "required": True},
            {"id": "gstin", "label": "GSTIN (if applicable)", "type": "text", "required": False},
            {"id": "contact_phone", "label": "Phone", "type": "text", "required": True},
            {"id": "contact_email", "label": "Email", "type": "email", "required": True},
            {"id": "auditor_firm", "label": "Registered Auditor Firm Name & Details", "type": "textarea", "required": True},
            {"id": "nic_code", "label": "Industry Classification / NIC Code", "type": "text", "required": True}
        ]
    },
    "company_history": {
        "name": "Company History & Evolution",
        "fields": [
            {"id": "incorporation_history", "label": "Incorporation history / business milestones", "type": "textarea", "required": True},
            {"id": "headquarters", "label": "Headquarters and major operational locations", "type": "textarea", "required": True},
            {"id": "subsidiaries", "label": "Subsidiaries / joint ventures / associate companies", "type": "table", "required": False},
            {"id": "group_structure", "label": "Group structure and related parties", "type": "textarea", "required": True}
        ]
    },
    "business_description": {
        "name": "Business Description",
        "fields": [
            {"id": "business_model", "label": "Business model description", "type": "textarea", "required": True},
            {"id": "products_services", "label": "Product and service portfolio", "type": "table", "required": True},
            {"id": "revenue_model", "label": "Revenue model and monetization strategy", "type": "textarea", "required": True},
            {"id": "key_customers", "label": "Key customers (Top 3)", "type": "table", "required": True},
            {"id": "key_suppliers", "label": "Key suppliers and vendors (Top 10)", "type": "table", "required": True},
            {"id": "geographic_presence", "label": "Geographic presence", "type": "textarea", "required": True},
            {"id": "manufacturing_facilities", "label": "Manufacturing or operational facilities", "type": "table", "required": False},
            {"id": "capacity_utilization", "label": "Installed capacity and utilization (last 3 years)", "type": "table", "required": False},
            {"id": "technology_ip", "label": "Technology platform and intellectual property", "type": "textarea", "required": False},
            {"id": "certifications", "label": "Certifications and quality standards", "type": "table", "required": False},
            {"id": "awards", "label": "Awards and recognitions", "type": "table", "required": False},
            {"id": "hr_headcount", "label": "Employee Headcount (Permanent)", "type": "number", "required": True},
            {"id": "hr_contractual", "label": "Employee Headcount (Contractual)", "type": "number", "required": False},
            {"id": "attrition_rate", "label": "Attrition Rate (%)", "type": "number", "required": False},
            {"id": "sales_distribution", "label": "Sales and distribution network", "type": "textarea", "required": True},
            {"id": "marketing_strategy", "label": "Marketing strategy and brand equity", "type": "textarea", "required": False},
            {"id": "rd_expenditure", "label": "R&D details and expenditure (last 3 years)", "type": "table", "required": False},
            {"id": "competitive_strengths", "label": "Key competitive strengths", "type": "textarea", "required": True},
            {"id": "business_strategies", "label": "Business strategies going forward", "type": "textarea", "required": True},
            {"id": "insurance_coverage", "label": "Insurance coverage details", "type": "table", "required": False},
            {"id": "esg_policies", "label": "ESG policies and CSR activities", "type": "textarea", "required": False}
        ]
    },
    "regulatory_details": {
        "name": "Regulatory Details",
        "fields": [
            {"id": "key_events", "label": "Chronology of key events since incorporation", "type": "table", "required": True},
            {"id": "corporate_structure", "label": "Corporate structure chart", "type": "textarea", "required": True},
            {"id": "acquisitions_divestments", "label": "Material acquisitions/divestments (last 5 years)", "type": "table", "required": False},
            {"id": "address_changes", "label": "Changes in registered/corporate office address", "type": "table", "required": False},
            {"id": "moa_changes", "label": "Changes in Memorandum of Association", "type": "table", "required": False}
        ]
    },
    "operational_details": {
        "name": "Operational Details – Business Processes",
        "fields": [
            {"id": "service_centers", "label": "Service Center or Offices", "type": "table", "required": False},
            {"id": "distribution_supply", "label": "Distribution and supply chain", "type": "textarea", "required": True},
            {"id": "intellectual_property", "label": "Intellectual property, patents, trademarks", "type": "table", "required": False},
            {"id": "regulatory_environment", "label": "Regulatory environment impacting business", "type": "textarea", "required": True}
        ]
    }
}

@api_router.get("/projects/{project_id}/company-data")
async def get_company_data(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get company data checklist for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get saved data
    saved_data = await db.company_data.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    # Calculate completion
    total_fields = sum(len(s["fields"]) for s in COMPANY_DATA_SECTIONS.values())
    completed_fields = 0
    
    if saved_data and saved_data.get("data"):
        for section_key, section_data in saved_data.get("data", {}).items():
            for field_key, value in section_data.items():
                if value and str(value).strip():
                    completed_fields += 1
    
    return {
        "project_id": project_id,
        "sections": COMPANY_DATA_SECTIONS,
        "data": saved_data.get("data", {}) if saved_data else {},
        "documents": saved_data.get("documents", []) if saved_data else [],
        "stats": {
            "total": total_fields,
            "completed": completed_fields,
            "pending": total_fields - completed_fields
        },
        "last_updated": saved_data.get("updated_at") if saved_data else None
    }

@api_router.post("/projects/{project_id}/company-data")
async def save_company_data(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save company data checklist"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate completion
    total_fields = sum(len(s["fields"]) for s in COMPANY_DATA_SECTIONS.values())
    completed_fields = 0
    
    for section_key, section_data in data.get("data", {}).items():
        for field_key, value in section_data.items():
            if value and str(value).strip():
                completed_fields += 1
    
    update_doc = {
        "project_id": project_id,
        "data": data.get("data", {}),
        "documents": data.get("documents", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.company_data.update_one(
        {"project_id": project_id},
        {"$set": update_doc},
        upsert=True
    )
    
    # Update checklist status
    await db.checklists.update_one(
        {"project_id": project_id, "type": "company_data"},
        {"$set": {
            "total_items": total_fields,
            "completed_items": completed_fields,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "company_data", f"Updated company data for project {project_id}")
    
    return {
        "message": "Company data saved successfully",
        "stats": {
            "total": total_fields,
            "completed": completed_fields,
            "pending": total_fields - completed_fields
        }
    }

# Promoter Checklist
PROMOTER_SECTIONS = {
    "personal_info": {
        "name": "Personal Information",
        "fields": [
            {"id": "legal_name", "label": "Full Legal Name (as per PAN)", "type": "text", "required": True},
            {"id": "former_names", "label": "Former Name(s) (if any)", "type": "text", "required": False},
            {"id": "father_spouse_name", "label": "Father's / Spouse's Name", "type": "text", "required": True},
            {"id": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"], "required": True},
            {"id": "dob", "label": "Date of Birth", "type": "date", "required": True},
            {"id": "nationality", "label": "Nationality", "type": "text", "required": True},
            {"id": "residential_status", "label": "Residential Status", "type": "select", "options": ["Resident", "Non-Resident"], "required": True},
            {"id": "pan", "label": "PAN", "type": "text", "required": True},
            {"id": "aadhaar", "label": "Aadhaar Number", "type": "text", "required": False},
            {"id": "din", "label": "DIN (for Directors)", "type": "text", "required": False},
            {"id": "passport", "label": "Passport Number", "type": "text", "required": False},
            {"id": "permanent_address", "label": "Permanent Residential Address", "type": "textarea", "required": True},
            {"id": "current_address", "label": "Current Residential Address", "type": "textarea", "required": True},
            {"id": "personal_email", "label": "Personal Email ID", "type": "email", "required": True},
            {"id": "official_email", "label": "Official Email ID", "type": "email", "required": False},
            {"id": "mobile", "label": "Mobile Number", "type": "text", "required": True}
        ]
    },
    "professional_profile": {
        "name": "Professional Profile",
        "fields": [
            {"id": "designation", "label": "Current Designation in the Company", "type": "text", "required": True},
            {"id": "appointment_date", "label": "Date of Appointment", "type": "date", "required": True},
            {"id": "appointment_term", "label": "Term of Appointment", "type": "text", "required": True},
            {"id": "employment_type", "label": "Employment Type", "type": "select", "options": ["Executive", "Non-Executive", "Independent"], "required": True},
            {"id": "education", "label": "Educational Qualifications", "type": "textarea", "required": True},
            {"id": "certifications", "label": "Professional Certifications / Memberships", "type": "textarea", "required": False},
            {"id": "career_history", "label": "Detailed Career History (last 15 years)", "type": "table", "required": True},
            {"id": "directorships", "label": "Directorships in Other Companies", "type": "table", "required": False},
            {"id": "resignation_history", "label": "Resignation history (last 5 years)", "type": "textarea", "required": False}
        ]
    },
    "shareholding": {
        "name": "Shareholding & Ownership Details",
        "fields": [
            {"id": "equity_shares", "label": "Number of Equity Shares held", "type": "number", "required": True},
            {"id": "shareholding_percent", "label": "Percentage Shareholding (Pre-IPO)", "type": "number", "required": True},
            {"id": "holding_mode", "label": "Mode of Holding", "type": "select", "options": ["Individual", "HUF", "Trust", "Corporate"], "required": True},
            {"id": "acquisition_date", "label": "Date of Acquisition of Shares", "type": "date", "required": True},
            {"id": "acquisition_price", "label": "Acquisition Price", "type": "number", "required": True},
            {"id": "pledged_shares", "label": "Details of Shares Pledged", "type": "textarea", "required": False},
            {"id": "convertible_instruments", "label": "Convertible Instruments held", "type": "textarea", "required": False},
            {"id": "subsidiary_shareholding", "label": "Shareholding in Subsidiaries", "type": "textarea", "required": False},
            {"id": "offer_for_sale", "label": "Proposed Offer for Sale", "type": "select", "options": ["Yes", "No"], "required": True},
            {"id": "lockin_confirmation", "label": "Lock-in Undertaking confirmation", "type": "select", "options": ["Yes", "No"], "required": True}
        ]
    },
    "remuneration": {
        "name": "Remuneration Details",
        "fields": [
            {"id": "annual_remuneration", "label": "Annual Remuneration (Last 3 FYs)", "type": "table", "required": True},
            {"id": "bonus_commission", "label": "Bonus / Commission (Last 3 Years)", "type": "table", "required": False},
            {"id": "esop_grants", "label": "ESOP Grants", "type": "textarea", "required": False},
            {"id": "perquisites", "label": "Perquisites", "type": "textarea", "required": False},
            {"id": "sitting_fees", "label": "Sitting Fees", "type": "number", "required": False},
            {"id": "notice_period", "label": "Notice Period", "type": "text", "required": True},
            {"id": "severance_terms", "label": "Severance Terms", "type": "textarea", "required": False}
        ]
    },
    "relationships": {
        "name": "Relationship Disclosures",
        "fields": [
            {"id": "rel_directors", "label": "Relationship with other Directors", "type": "textarea", "required": False},
            {"id": "rel_promoters", "label": "Relationship with Promoters", "type": "textarea", "required": False},
            {"id": "rel_kmp", "label": "Relationship with KMP", "type": "textarea", "required": False},
            {"id": "related_party_txns", "label": "Related Party Transactions (Last 3 Years)", "type": "table", "required": False},
            {"id": "interest_in_entities", "label": "Interest in any firm/entity transacting with Company", "type": "textarea", "required": False}
        ]
    },
    "litigation": {
        "name": "Litigation & Regulatory Disclosures",
        "fields": [
            {"id": "civil_litigation", "label": "Civil litigation pending", "type": "textarea", "required": False},
            {"id": "criminal_proceedings", "label": "Criminal proceedings pending", "type": "textarea", "required": False},
            {"id": "tax_proceedings", "label": "Tax proceedings", "type": "textarea", "required": False},
            {"id": "regulatory_actions", "label": "Regulatory actions by SEBI, RBI, MCA", "type": "textarea", "required": False},
            {"id": "economic_offences", "label": "Economic offences / fraud investigations", "type": "textarea", "required": False},
            {"id": "insolvency", "label": "Insolvency / Bankruptcy proceedings", "type": "textarea", "required": False},
            {"id": "disqualification", "label": "Disqualification under Companies Act", "type": "textarea", "required": False},
            {"id": "wilful_defaulter", "label": "Wilful defaulter declaration", "type": "textarea", "required": False},
            {"id": "settlements", "label": "Settlements with regulators", "type": "textarea", "required": False},
            {"id": "show_cause_notices", "label": "Any show-cause notices pending", "type": "textarea", "required": False}
        ]
    }
}

@api_router.get("/projects/{project_id}/promoter-checklist")
async def get_promoter_checklist(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get promoter checklist for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    promoters = await db.promoters.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(50)
    
    total_fields = sum(len(s["fields"]) for s in PROMOTER_SECTIONS.values())
    total_completed = 0
    
    for promoter in promoters:
        for section_key, section_data in promoter.get("data", {}).items():
            for field_key, value in section_data.items():
                if value and str(value).strip():
                    total_completed += 1
    
    return {
        "project_id": project_id,
        "sections": PROMOTER_SECTIONS,
        "promoters": promoters,
        "stats": {
            "total_promoters": len(promoters),
            "fields_per_promoter": total_fields,
            "total_completed": total_completed,
            "pending": (total_fields * max(1, len(promoters))) - total_completed
        }
    }

@api_router.post("/projects/{project_id}/promoter-checklist")
async def save_promoter(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save or update a promoter"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    promoter_id = data.get("promoter_id") or f"promoter_{uuid.uuid4().hex[:12]}"
    
    promoter_doc = {
        "promoter_id": promoter_id,
        "project_id": project_id,
        "data": data.get("data", {}),
        "documents": data.get("documents", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.promoters.update_one(
        {"promoter_id": promoter_id},
        {"$set": promoter_doc},
        upsert=True
    )
    
    # Update checklist status
    promoters = await db.promoters.find({"project_id": project_id}).to_list(50)
    total_fields = sum(len(s["fields"]) for s in PROMOTER_SECTIONS.values())
    total_completed = 0
    
    for p in promoters:
        for section_data in p.get("data", {}).values():
            for value in section_data.values():
                if value and str(value).strip():
                    total_completed += 1
    
    await db.checklists.update_one(
        {"project_id": project_id, "type": "promoter"},
        {"$set": {
            "total_items": total_fields * len(promoters),
            "completed_items": total_completed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "promoter_checklist", f"Updated promoter {promoter_id}")
    
    return {"message": "Promoter saved", "promoter_id": promoter_id}

@api_router.delete("/projects/{project_id}/promoter-checklist/{promoter_id}")
async def delete_promoter(
    project_id: str,
    promoter_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a promoter"""
    result = await db.promoters.delete_one({"promoter_id": promoter_id, "project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promoter not found")
    
    await log_audit_action(user.user_id, "delete", "promoter_checklist", f"Deleted promoter {promoter_id}")
    return {"message": "Promoter deleted"}

# KMP Checklist (same structure as Promoter)
KMP_SECTIONS = PROMOTER_SECTIONS.copy()  # KMP has same fields as Promoter

@api_router.get("/projects/{project_id}/kmp-checklist")
async def get_kmp_checklist(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get KMP checklist for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    kmps = await db.kmps.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(50)
    
    total_fields = sum(len(s["fields"]) for s in KMP_SECTIONS.values())
    total_completed = 0
    
    for kmp in kmps:
        for section_data in kmp.get("data", {}).values():
            for value in section_data.values():
                if value and str(value).strip():
                    total_completed += 1
    
    return {
        "project_id": project_id,
        "sections": KMP_SECTIONS,
        "kmps": kmps,
        "stats": {
            "total_kmps": len(kmps),
            "fields_per_kmp": total_fields,
            "total_completed": total_completed,
            "pending": (total_fields * max(1, len(kmps))) - total_completed
        }
    }

@api_router.post("/projects/{project_id}/kmp-checklist")
async def save_kmp(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save or update a KMP"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    kmp_id = data.get("kmp_id") or f"kmp_{uuid.uuid4().hex[:12]}"
    
    kmp_doc = {
        "kmp_id": kmp_id,
        "project_id": project_id,
        "data": data.get("data", {}),
        "documents": data.get("documents", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.kmps.update_one(
        {"kmp_id": kmp_id},
        {"$set": kmp_doc},
        upsert=True
    )
    
    # Update checklist status
    kmps = await db.kmps.find({"project_id": project_id}).to_list(50)
    total_fields = sum(len(s["fields"]) for s in KMP_SECTIONS.values())
    total_completed = 0
    
    for k in kmps:
        for section_data in k.get("data", {}).values():
            for value in section_data.values():
                if value and str(value).strip():
                    total_completed += 1
    
    await db.checklists.update_one(
        {"project_id": project_id, "type": "kmp"},
        {"$set": {
            "total_items": total_fields * len(kmps),
            "completed_items": total_completed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "kmp_checklist", f"Updated KMP {kmp_id}")
    
    return {"message": "KMP saved", "kmp_id": kmp_id}

@api_router.delete("/projects/{project_id}/kmp-checklist/{kmp_id}")
async def delete_kmp(
    project_id: str,
    kmp_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a KMP"""
    result = await db.kmps.delete_one({"kmp_id": kmp_id, "project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="KMP not found")
    
    await log_audit_action(user.user_id, "delete", "kmp_checklist", f"Deleted KMP {kmp_id}")
    return {"message": "KMP deleted"}

# Pre-IPO Tracker
PRE_IPO_SECTIONS = {
    "corporate_governance": {
        "name": "Corporate Structure & Governance",
        "items": [
            {"id": "public_ltd", "label": "Company incorporated as Public Limited Company"},
            {"id": "aoa_amended", "label": "Articles of Association amended for IPO compliance"},
            {"id": "board_constituted", "label": "Board properly constituted"},
            {"id": "independent_directors", "label": "Minimum number of Independent Directors appointed"},
            {"id": "woman_director", "label": "Woman Director appointed"},
            {"id": "audit_committee", "label": "Audit Committee constituted"},
            {"id": "nomination_committee", "label": "Nomination & Remuneration Committee constituted"},
            {"id": "stakeholders_committee", "label": "Stakeholders Relationship Committee constituted"},
            {"id": "csr_committee", "label": "CSR Committee constituted (if applicable)"},
            {"id": "insider_trading", "label": "Insider Trading Policy implemented"},
            {"id": "code_of_conduct", "label": "Code of Conduct adopted"},
            {"id": "rpt_policy", "label": "Related Party Transaction Policy adopted"}
        ]
    },
    "capital_readiness": {
        "name": "Capital Structure Readiness",
        "items": [
            {"id": "authorized_capital", "label": "Authorized capital adequate for IPO"},
            {"id": "dematerialization", "label": "Dematerialization of 100% share capital"},
            {"id": "isin", "label": "ISIN obtained"},
            {"id": "share_reconciled", "label": "Share certificates reconciled"},
            {"id": "no_pending_transfers", "label": "No pending share transfers"},
            {"id": "esop_compliant", "label": "ESOP scheme compliant"},
            {"id": "convertible_disclosures", "label": "Convertible securities disclosures prepared"},
            {"id": "promoter_shareholding", "label": "Promoter shareholding verified"},
            {"id": "promoter_lockin", "label": "Promoter lock-in calculation completed"},
            {"id": "cap_table", "label": "Cap table finalized (Pre-IPO)"}
        ]
    },
    "financial_readiness": {
        "name": "Financial Readiness",
        "items": [
            {"id": "restated_financials", "label": "Restated financial statements (3 years) completed"},
            {"id": "audit_qualifications", "label": "Audit qualifications resolved"},
            {"id": "internal_controls", "label": "Internal Financial Controls documented"},
            {"id": "rpt_reconciled", "label": "Related party transactions reconciled"},
            {"id": "loans_guarantees", "label": "Outstanding loans & guarantees disclosed"},
            {"id": "working_capital", "label": "Working capital assessment completed"},
            {"id": "debt_agreements", "label": "Debt agreements reviewed for IPO restrictions"},
            {"id": "contingent_liabilities", "label": "Contingent liabilities quantified"},
            {"id": "tax_litigations", "label": "Tax litigations reconciled"},
            {"id": "mda_draft", "label": "MD&A draft prepared"}
        ]
    },
    "legal_regulatory": {
        "name": "Legal & Regulatory",
        "items": [
            {"id": "material_contracts", "label": "All material contracts compiled"},
            {"id": "litigation_tracker", "label": "Litigation tracker prepared"},
            {"id": "regulatory_approvals", "label": "Regulatory approvals list prepared"},
            {"id": "ip_verified", "label": "Intellectual property verified"},
            {"id": "title_documents", "label": "Title documents for properties verified"},
            {"id": "environmental_compliance", "label": "Environmental compliance review done"},
            {"id": "labour_compliance", "label": "Labour law compliance verified"},
            {"id": "no_wilful_defaulter", "label": "No wilful defaulter declaration"},
            {"id": "no_sebi_debarment", "label": "No SEBI debarment confirmations"},
            {"id": "roc_filings", "label": "ROC filings up to date"}
        ]
    },
    "promoter_disclosures": {
        "name": "Promoter & Management Disclosures",
        "items": [
            {"id": "promoter_kyc", "label": "Promoter PAN & KYC collected"},
            {"id": "din_verification", "label": "DIN verification completed"},
            {"id": "director_disclosures", "label": "Director disclosures under Companies Act collected"},
            {"id": "litigation_affidavits", "label": "Litigation affidavits obtained"},
            {"id": "networth_certificates", "label": "Net worth certificates (Promoters) obtained"},
            {"id": "remuneration_disclosures", "label": "Remuneration disclosures compiled"},
            {"id": "employment_agreements", "label": "Employment agreements reviewed"},
            {"id": "directorship_crosscheck", "label": "Directorship cross-check completed"}
        ]
    },
    "business_operational": {
        "name": "Business & Operational Readiness",
        "items": [
            {"id": "industry_report", "label": "Industry report commissioned"},
            {"id": "business_model", "label": "Business model documented"},
            {"id": "top_customers_suppliers", "label": "Top 10 customers & suppliers identified"},
            {"id": "revenue_concentration", "label": "Revenue concentration analysis completed"},
            {"id": "operational_kpis", "label": "Operational KPIs defined"},
            {"id": "risk_factor_workshop", "label": "Risk factor workshop conducted"},
            {"id": "esg_disclosures", "label": "ESG & sustainability disclosures prepared"},
            {"id": "cybersecurity_audit", "label": "Data protection & cybersecurity audit completed"}
        ]
    },
    "ipo_intermediaries": {
        "name": "IPO Structure & Intermediaries",
        "items": [
            {"id": "lead_manager", "label": "Lead Manager appointed"},
            {"id": "legal_counsel", "label": "Legal Counsel appointed"},
            {"id": "registrar", "label": "Registrar to the Issue appointed"},
            {"id": "bankers", "label": "Bankers to the Issue appointed"},
            {"id": "peer_review_auditor", "label": "Peer Review Auditor appointed"},
            {"id": "objects_of_issue", "label": "Draft Objects of Issue finalized"},
            {"id": "capital_structure_approved", "label": "Draft capital structure approved by Board"},
            {"id": "listing_application", "label": "In-principle listing application prepared"}
        ]
    },
    "drhp_drafting": {
        "name": "DRHP Drafting Status",
        "items": [
            {"id": "risk_factors", "label": "Risk Factors"},
            {"id": "capital_structure", "label": "Capital Structure"},
            {"id": "business_overview", "label": "Business Overview"},
            {"id": "financial_info", "label": "Financial Information"},
            {"id": "management", "label": "Management"},
            {"id": "promoter_details", "label": "Promoter Details"},
            {"id": "litigation", "label": "Litigation"},
            {"id": "objects_of_issue_section", "label": "Objects of Issue"}
        ]
    },
    "pre_filing": {
        "name": "Final Pre-Filing Confirmation",
        "items": [
            {"id": "disclosures_verified", "label": "All disclosures verified by Promoters"},
            {"id": "legal_dd", "label": "Legal Due Diligence completed"},
            {"id": "financial_dd", "label": "Financial Due Diligence completed"},
            {"id": "board_approved", "label": "DRHP internally approved by Board"},
            {"id": "annexures", "label": "Annexures to DRHP"},
            {"id": "sebi_version", "label": "SEBI filing version finalized"},
            {"id": "stock_exchange_consultation", "label": "Stock exchange pre-consultation done"}
        ]
    }
}

@api_router.get("/projects/{project_id}/pre-ipo-tracker")
async def get_pre_ipo_tracker(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get Pre-IPO Tracker for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tracker = await db.pre_ipo_tracker.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    total_items = sum(len(s["items"]) for s in PRE_IPO_SECTIONS.values())
    completed_items = 0
    
    if tracker and tracker.get("items"):
        for item_id, item_data in tracker.get("items", {}).items():
            if item_data.get("status") == "Yes":
                completed_items += 1
    
    return {
        "project_id": project_id,
        "sections": PRE_IPO_SECTIONS,
        "items": tracker.get("items", {}) if tracker else {},
        "general_info": tracker.get("general_info", {}) if tracker else {},
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "in_progress": sum(1 for item in (tracker.get("items", {}) if tracker else {}).values() if item.get("status") == "In Progress"),
            "pending": total_items - completed_items
        },
        "last_updated": tracker.get("updated_at") if tracker else None
    }

@api_router.post("/projects/{project_id}/pre-ipo-tracker")
async def save_pre_ipo_tracker(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save Pre-IPO Tracker"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    total_items = sum(len(s["items"]) for s in PRE_IPO_SECTIONS.values())
    completed_items = 0
    
    for item_data in data.get("items", {}).values():
        if item_data.get("status") == "Yes":
            completed_items += 1
    
    tracker_doc = {
        "project_id": project_id,
        "general_info": data.get("general_info", {}),
        "items": data.get("items", {}),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.pre_ipo_tracker.update_one(
        {"project_id": project_id},
        {"$set": tracker_doc},
        upsert=True
    )
    
    # Update checklist status
    await db.checklists.update_one(
        {"project_id": project_id, "type": "pre_ipo"},
        {"$set": {
            "total_items": total_items,
            "completed_items": completed_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "pre_ipo_tracker", f"Updated Pre-IPO Tracker for {project_id}")
    
    return {
        "message": "Pre-IPO Tracker saved",
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "pending": total_items - completed_items
        }
    }

# Non-DRHP Tracker
NON_DRHP_SECTIONS = {
    "corporate_restructuring": {
        "name": "Corporate Restructuring & Housekeeping",
        "items": [
            {"id": "demat_shares", "label": "Demat of shares (converting physical share certificates to demat form for all existing shareholders)"},
            {"id": "share_capital_split", "label": "Consolidation or splitting of share capital (face value changes, e.g. splitting ₹10 FV to ₹2 FV)"},
            {"id": "convert_instruments", "label": "Conversion of any outstanding CCDs, OCDs, warrants, or other convertible instruments into equity"},
            {"id": "cancel_esops", "label": "Cancellation or buy-back of any outstanding ESOPs that are underwater or problematic"},
            {"id": "regularize_allotments", "label": "Regularizing any past allotments that were done informally or without proper board/shareholder resolutions"}
        ]
    },
    "legal_compliance": {
        "name": "Legal & Compliance Clean-up",
        "items": [
            {"id": "regulatory_approvals", "label": "Obtaining missing/lapsed regulatory approvals and licenses"},
            {"id": "resolve_litigation", "label": "Resolving pending litigation or disclosing/settling material disputes"},
            {"id": "roc_filings", "label": "Clearing any ROC filing backlogs or rectifying past non-compliances"},
            {"id": "material_contracts", "label": "Getting all material contracts formally executed and stamped"},
            {"id": "trademark_ip", "label": "Trademark and IP registrations (if not already done)"},
            {"id": "subsidiary_compliance", "label": "Ensuring all subsidiary/associate companies are properly incorporated and compliant"}
        ]
    },
    "corporate_governance": {
        "name": "Corporate Governance Upgrades",
        "items": [
            {"id": "reconstitute_board", "label": "Reconstituting the Board — inducting Independent Directors (minimum required under SEBI/Companies Act)"},
            {"id": "form_committees", "label": "Forming mandatory committees: Audit, Nomination & Remuneration, Stakeholder Relationship, Risk Management"},
            {"id": "appoint_cs", "label": "Appointing a qualified Company Secretary (CS) as KMP if not already present"},
            {"id": "appoint_cfo", "label": "Appointing a CFO as KMP (if not already formalized)"},
            {"id": "new_aoa", "label": "Adopting a new Articles of Association aligned with listed company requirements"},
            {"id": "code_of_conduct", "label": "Implementing a Code of Conduct for Directors and senior management"},
            {"id": "insider_trading_policy", "label": "Setting up insider trading prevention policies (SEBI PIT Regulations compliance)"}
        ]
    },
    "financial_accounting": {
        "name": "Financial & Accounting",
        "items": [
            {"id": "restate_financials", "label": "Restating financials if required (change in accounting policies, Ind AS adoption if not done)"},
            {"id": "audited_financials", "label": "Getting audited financials for the required period (typically 3 years) from a SEBI-empanelled auditor"},
            {"id": "rpt_cleanup", "label": "Closing out related-party transactions that won't survive public scrutiny or restructuring them at arm's length"},
            {"id": "credit_ratings", "label": "Obtaining credit ratings (if raising debt alongside equity)"},
            {"id": "internal_controls", "label": "Setting up proper internal financial controls and getting them audited"}
        ]
    },
    "employee_esop": {
        "name": "Employee & ESOP Related",
        "items": [
            {"id": "esop_approval", "label": "Formalizing and getting shareholder approval for ESOP schemes under SEBI SBEB Regulations"},
            {"id": "employment_contracts", "label": "Issuing formal appointment letters, employment contracts, and NDAs to key employees"},
            {"id": "clear_obligations", "label": "Clearing any pending salary, PF, ESIC, gratuity obligations"}
        ]
    },
    "banking_accounts": {
        "name": "Banking & Accounts",
        "items": [
            {"id": "bank_accounts", "label": "Ensuring all bank accounts are in order, dormant accounts closed"},
            {"id": "npa_resolution", "label": "Resolving any NPA classifications or overdraft issues with lenders"},
            {"id": "lender_nocs", "label": "Obtaining NOCs from lenders for change in shareholding/management if required by loan covenants"}
        ]
    },
    "investor_relations": {
        "name": "Investor & Shareholder Relations",
        "items": [
            {"id": "amend_agreements", "label": "Negotiating and amending/terminating investor rights agreements (tag-along, drag-along, anti-dilution clauses) that are incompatible with listing"},
            {"id": "shareholder_approvals", "label": "Getting DRHP-related shareholder approvals via EGM/Postal Ballot (e.g. fresh issue size, ESOP scheme, AoA amendment, conversion of instruments)"},
            {"id": "investor_consent", "label": "Obtaining consent/NOC from major investors for the offer"}
        ]
    },
    "pre_ipo_transactions": {
        "name": "Pre-IPO Transactions (if applicable)",
        "items": [
            {"id": "pre_ipo_placement", "label": "Closing any pre-IPO placement rounds"},
            {"id": "acquisitions_divestments", "label": "Completing any acquisitions or divestments the company wants done before listing"}
        ]
    }
}

@api_router.get("/projects/{project_id}/non-drhp-tracker")
async def get_non_drhp_tracker(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get Non-DRHP Tracker for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tracker = await db.non_drhp_tracker.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    total_items = sum(len(s["items"]) for s in NON_DRHP_SECTIONS.values())
    completed_items = 0
    
    if tracker and tracker.get("items"):
        for item_id, item_data in tracker.get("items", {}).items():
            if item_data.get("status") == "Yes":
                completed_items += 1
    
    return {
        "project_id": project_id,
        "sections": NON_DRHP_SECTIONS,
        "items": tracker.get("items", {}) if tracker else {},
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "in_progress": sum(1 for item in (tracker.get("items", {}) if tracker else {}).values() if item.get("status") == "In Progress"),
            "pending": total_items - completed_items
        },
        "last_updated": tracker.get("updated_at") if tracker else None
    }

@api_router.post("/projects/{project_id}/non-drhp-tracker")
async def save_non_drhp_tracker(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save Non-DRHP Tracker"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    total_items = sum(len(s["items"]) for s in NON_DRHP_SECTIONS.values())
    completed_items = 0
    
    for item_data in data.get("items", {}).values():
        if item_data.get("status") == "Yes":
            completed_items += 1
    
    tracker_doc = {
        "project_id": project_id,
        "items": data.get("items", {}),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.non_drhp_tracker.update_one(
        {"project_id": project_id},
        {"$set": tracker_doc},
        upsert=True
    )
    
    # Update checklist status
    await db.checklists.update_one(
        {"project_id": project_id, "type": "non_drhp"},
        {"$set": {
            "total_items": total_items,
            "completed_items": completed_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "non_drhp_tracker", f"Updated Non-DRHP Tracker for {project_id}")
    
    return {
        "message": "Non-DRHP Tracker saved",
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "pending": total_items - completed_items
        }
    }

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "IntelliEngine API v1.0", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
