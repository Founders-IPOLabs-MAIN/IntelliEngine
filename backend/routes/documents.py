from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from shared import (db, fs_bucket, limiter, logger, User, get_current_user,
    Document, OCRRequest, validate_upload, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, BLOCKED_EXTENSIONS,
    datetime, timezone, uuid, io, os, ObjectId)
from typing import List, Optional

router = APIRouter()

# ============ DOCUMENT ENDPOINTS ============

@router.get("/upload-requirements")
async def get_upload_requirements():
    """Get file upload requirements and restrictions"""
    return {
        "max_file_size_mb": 5,
        "max_file_size_bytes": MAX_FILE_SIZE,
        "allowed_types": {
            context: {
                "extensions": list(config["extensions"]),
                "mime_types": list(config["mime_types"])
            }
            for context, config in ALLOWED_FILE_TYPES.items()
        },
        "blocked_extensions": list(BLOCKED_EXTENSIONS),
        "content_moderation": {
            "enabled": True,
            "scans_for": ["nudity", "explicit_content", "violence", "inappropriate_material"],
            "warning": "All uploaded images are scanned for inappropriate content. Files violating our content policy will be rejected and may result in account suspension."
        },
        "filename_policy": {
            "format": "{uploader_name}_{original_filename}_{timestamp}.{ext}",
            "sanitization": "Special characters removed, path components stripped",
            "max_length": 100
        }
    }

@router.post("/documents/upload")
@limiter.limit("20/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    section_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Upload a document to GridFS with security validation"""
    content = await file.read()
    
    # Validate and sanitize the upload
    sanitized_filename, warnings = await validate_upload(
        file=file,
        content=content,
        context="document",
        uploader_name=user.name,
        scan_content=True
    )
    
    # Store in GridFS with sanitized filename
    gridfs_id = await fs_bucket.upload_from_stream(
        sanitized_filename,
        io.BytesIO(content),
        metadata={
            "user_id": user.user_id,
            "project_id": project_id,
            "section_id": section_id,
            "content_type": file.content_type,
            "original_filename": file.filename
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
        "filename": sanitized_filename,
        "original_filename": file.filename,
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
    
    response_data = Document(**doc_record).model_dump()
    if warnings:
        response_data["warnings"] = warnings
    
    return response_data

@router.get("/documents/{document_id}/download")
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

@router.get("/documents", response_model=List[Document])
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

@router.delete("/documents/{document_id}")
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

@router.post("/documents/{document_id}/ocr")
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

# ============ CENTRALIZED CORPORATE REPOSITORY ============

# Field mapping from checklist modules to DRHP sections
FIELD_TO_DRHP_MAPPING = {
    "full_legal_name": ["Cover Page", "Introduction and Summary", "Business Overview"],
    "cin": ["Cover Page", "Introduction and Summary"],
    "pan": ["Cover Page"],
    "gstin": ["Cover Page"],
    "registered_office_address": ["Cover Page", "Other Information/Disclosures"],
    "corporate_office_address": ["Cover Page"],
    "website": ["Cover Page"],
    "email": ["Cover Page"],
    "phone": ["Cover Page"],
    "date_of_incorporation": ["Introduction and Summary", "Business Overview"],
    "business_description": ["Introduction and Summary", "Business Overview"],
    "main_objects": ["Objects of the Issue", "Business Overview"],
    "authorized_capital": ["Capital Structure"],
    "paid_up_capital": ["Capital Structure"],
    "promoter_name": ["Management & Promoter Group", "Capital Structure"],
    "promoter_din": ["Management & Promoter Group"],
    "promoter_shareholding": ["Capital Structure", "Management & Promoter Group"],
    "kmp_name": ["Management & Promoter Group"],
    "kmp_designation": ["Management & Promoter Group"],
    "kmp_din": ["Management & Promoter Group"],
    "total_revenue": ["Financial Information", "Introduction and Summary"],
    "net_profit": ["Financial Information", "Introduction and Summary"],
    "total_assets": ["Financial Information"],
    "sector": ["Industry Overview", "Introduction and Summary"],
    "industry": ["Industry Overview"],
}

@router.post("/projects/{project_id}/upload-document-ocr")
@limiter.limit("10/minute")
async def upload_and_extract_data(
    request: Request,
    project_id: str,
    file: UploadFile = File(...),
    module_name: str = "company_data",
    user: User = Depends(get_current_user)
):
    """Upload document, process OCR, extract structured data, and sync to centralized repository"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
    
    content = await file.read()
    
    # Validate and sanitize the upload
    sanitized_filename, warnings = await validate_upload(
        file=file,
        content=content,
        context="ocr_document",
        uploader_name=user.name,
        scan_content=True
    )
    
    # Store in GridFS with sanitized filename
    gridfs_id = await fs_bucket.upload_from_stream(
        sanitized_filename,
        io.BytesIO(content),
        metadata={
            "user_id": user.user_id,
            "project_id": project_id,
            "module_name": module_name,
            "content_type": file.content_type,
            "original_filename": file.filename
        }
    )
    
    # Create document record
    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    doc_record = {
        "document_id": document_id,
        "user_id": user.user_id,
        "project_id": project_id,
        "module_name": module_name,
        "filename": sanitized_filename,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "gridfs_id": str(gridfs_id),
        "ocr_text": None,
        "ocr_status": "processing",
        "extracted_data": {},
        "file_size": len(content),
        "created_at": now.isoformat()
    }
    
    await db.documents.insert_one(doc_record)
    
    extracted_data = {}
    
    try:
        # Save temporarily for OCR
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Initialize LLM Chat
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        
        # Create extraction prompt based on module
        extraction_prompts = {
            "company_data": """Extract the following corporate information from this document in JSON format:
{
    "full_legal_name": "Complete legal name of the company",
    "cin": "Corporate Identification Number",
    "pan": "PAN number",
    "gstin": "GST Identification Number",
    "registered_office_address": "Full registered office address",
    "corporate_office_address": "Corporate office address if different",
    "website": "Company website URL",
    "email": "Official email",
    "phone": "Contact phone number",
    "date_of_incorporation": "Date of incorporation",
    "business_description": "Brief description of business activities",
    "main_objects": "Main objects of the company",
    "authorized_capital": "Authorized share capital",
    "paid_up_capital": "Paid-up share capital",
    "sector": "Industry sector",
    "total_revenue": "Total revenue if mentioned",
    "net_profit": "Net profit if mentioned"
}
Only include fields that are clearly mentioned in the document. Return valid JSON only.""",
            
            "promoter_checklist": """Extract promoter information from this document in JSON format:
{
    "promoter_name": "Full name of promoter",
    "promoter_din": "Director Identification Number",
    "promoter_pan": "PAN number",
    "promoter_address": "Residential address",
    "promoter_shareholding": "Shareholding percentage",
    "promoter_experience": "Professional experience",
    "promoter_other_directorships": "Other company directorships"
}
Only include fields that are clearly mentioned. Return valid JSON only.""",
            
            "kmp_checklist": """Extract Key Managerial Personnel information from this document in JSON format:
{
    "kmp_name": "Full name",
    "kmp_designation": "Designation/Title",
    "kmp_din": "DIN if applicable",
    "kmp_pan": "PAN number",
    "kmp_qualification": "Educational qualifications",
    "kmp_experience": "Years of experience",
    "kmp_remuneration": "Remuneration details"
}
Only include fields that are clearly mentioned. Return valid JSON only.""",
            
            "pre_ipo_tracker": """Extract IPO-related information from this document in JSON format:
{
    "ipo_type": "Fresh issue / OFS / Both",
    "issue_size": "Proposed issue size",
    "price_band": "Expected price band",
    "lot_size": "Minimum lot size",
    "lead_managers": "Book Running Lead Managers",
    "registrar": "Registrar to the issue",
    "listing_exchange": "Stock exchange for listing"
}
Only include fields that are clearly mentioned. Return valid JSON only.""",
            
            "non_drhp_tracker": """Extract compliance and regulatory information from this document in JSON format:
{
    "statutory_auditor": "Name of statutory auditor",
    "legal_advisor": "Legal counsel name",
    "compliance_status": "Key compliance items",
    "pending_litigations": "Any pending litigations",
    "regulatory_approvals": "Required regulatory approvals"
}
Only include fields that are clearly mentioned. Return valid JSON only."""
        }
        
        prompt = extraction_prompts.get(module_name, extraction_prompts["company_data"])
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ocr_extract_{document_id}",
            system_message="You are an expert document analyzer. Extract structured data from documents accurately. Always return valid JSON."
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Create file content
        file_content = FileContentWithMimeType(
            file_path=temp_path,
            mime_type=file.content_type
        )
        
        # Send message with file
        user_message = UserMessage(
            text=prompt,
            file_contents=[file_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Clean response - remove markdown code blocks if present
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            
            import json
            extracted_data = json.loads(clean_response.strip())
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse OCR response as JSON: {response[:200]}")
            extracted_data = {"raw_text": response}
        
        # Update document with extracted data
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {
                "ocr_text": response,
                "ocr_status": "completed",
                "extracted_data": extracted_data
            }}
        )
        
        # Sync to centralized corporate repository
        await sync_to_corporate_repository(project_id, module_name, extracted_data, user.user_id)
        
        # Cleanup temp file
        os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {"ocr_status": "failed"}}
        )
    
    return {
        "document_id": document_id,
        "filename": file.filename,
        "extracted_data": extracted_data,
        "status": "completed" if extracted_data else "partial"
    }

async def sync_to_corporate_repository(project_id: str, module_name: str, extracted_data: dict, user_id: str):
    """Sync extracted data to centralized corporate repository and propagate to DRHP sections"""
    
    # Get or create corporate repository for this project
    repo = await db.corporate_repository.find_one({"project_id": project_id})
    
    if not repo:
        repo = {
            "project_id": project_id,
            "user_id": user_id,
            "data": {},
            "field_sources": {},  # Track which module each field came from
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.corporate_repository.insert_one(repo)
    
    # Update repository with new data
    updates = {}
    field_sources = repo.get("field_sources", {})
    
    for field, value in extracted_data.items():
        if value and str(value).strip():
            updates[f"data.{field}"] = value
            field_sources[field] = {
                "module": module_name,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
    
    if updates:
        updates["last_updated"] = datetime.now(timezone.utc).isoformat()
        updates["field_sources"] = field_sources
        
        await db.corporate_repository.update_one(
            {"project_id": project_id},
            {"$set": updates}
        )
    
    # Propagate data to relevant DRHP sections
    for field, value in extracted_data.items():
        if field in FIELD_TO_DRHP_MAPPING and value:
            target_sections = FIELD_TO_DRHP_MAPPING[field]
            
            for section_name in target_sections:
                # Find the section
                section = await db.drhp_sections.find_one({
                    "project_id": project_id,
                    "section_name": section_name
                })
                
                if section:
                    # Add to section's auto-populated data
                    await db.drhp_sections.update_one(
                        {"section_id": section["section_id"]},
                        {
                            "$set": {
                                f"auto_populated_data.{field}": value,
                                f"auto_populated_sources.{field}": module_name,
                                "last_auto_update": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )

@router.get("/projects/{project_id}/corporate-repository")
async def get_corporate_repository(project_id: str, user: User = Depends(get_current_user)):
    """Get centralized corporate repository data for a project"""
    
    repo = await db.corporate_repository.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    if not repo:
        return {
            "project_id": project_id,
            "data": {},
            "field_sources": {},
            "message": "No data uploaded yet"
        }
    
    return repo

@router.post("/projects/{project_id}/corporate-repository/sync")
async def manual_sync_repository(project_id: str, user: User = Depends(get_current_user)):
    """Manually trigger sync from corporate repository to all DRHP sections"""
    
    repo = await db.corporate_repository.find_one({"project_id": project_id})
    
    if not repo or not repo.get("data"):
        return {"message": "No data to sync", "synced_fields": 0}
    
    synced_count = 0
    data = repo.get("data", {})
    
    for field, value in data.items():
        if field in FIELD_TO_DRHP_MAPPING and value:
            target_sections = FIELD_TO_DRHP_MAPPING[field]
            
            for section_name in target_sections:
                section = await db.drhp_sections.find_one({
                    "project_id": project_id,
                    "section_name": section_name
                })
                
                if section:
                    await db.drhp_sections.update_one(
                        {"section_id": section["section_id"]},
                        {
                            "$set": {
                                f"auto_populated_data.{field}": value,
                                "last_auto_update": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    synced_count += 1
    
    return {
        "message": "Sync completed",
        "synced_fields": synced_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
