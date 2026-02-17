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
    {"id": "ipo_consultants", "name": "IPO Consultants & SME's", "description": "Expert guidance for IPO journey and SME listings", "icon": "Briefcase"},
    {"id": "merchant_bankers", "name": "SEBI-registered Merchant Bankers", "description": "Licensed merchant banking services for IPO management", "icon": "Building2"},
    {"id": "cfo_finance", "name": "CFO & Finance Heads", "description": "Experienced financial leadership for IPO readiness", "icon": "TrendingUp"},
    {"id": "chartered_accountants", "name": "Chartered Accountants (CA)", "description": "Audit, taxation, and financial reporting expertise", "icon": "Calculator"},
    {"id": "company_secretaries", "name": "Company Secretaries (CS)", "description": "Corporate governance and compliance specialists", "icon": "FileCheck"},
    {"id": "legal_tax", "name": "Legal & Tax Advisors", "description": "Legal structuring and tax planning for IPOs", "icon": "Scale"},
    {"id": "peer_auditors", "name": "Peer Review Auditors", "description": "Independent audit review and quality assurance", "icon": "Search"},
    {"id": "independent_directors", "name": "Independent Directors", "description": "Board-level expertise and corporate governance", "icon": "Users"},
    {"id": "valuation_experts", "name": "Registered Valuation Experts", "description": "Professional business and asset valuation services", "icon": "PieChart"},
    {"id": "rta", "name": "RTA (Registrar & Transfer Agents)", "description": "Share registry and transfer management services", "icon": "FileSpreadsheet"},
    {"id": "bankers", "name": "Bankers", "description": "Banking services and escrow account management", "icon": "Landmark"}
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
