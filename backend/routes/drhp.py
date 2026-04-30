from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from shared import (db, fs_bucket, logger, User, get_current_user,
    datetime, timezone, uuid, io, os, ObjectId)
from drhp_import import DRHPDocumentParser, DRHPImageExtractor
from drhp_export import DRHPWordExporter, DRHPPDFExporter
from docx import Document as DocxDocument

router = APIRouter()

# ============ DRHP CHAPTERS AND CONTENT ENDPOINTS ============

@router.get("/projects/{project_id}/drhp-progress")
async def get_drhp_progress(project_id: str, user: User = Depends(get_current_user)):
    """Get progress for all DRHP chapters"""
    progress = {}
    
    # Get all content records for this project
    cursor = db.drhp_content.find({"project_id": project_id}, {"_id": 0})
    content_list = await cursor.to_list(length=100)
    
    # Calculate progress per section
    for content in content_list:
        section_id = content.get("section_id")
        if section_id:
            if section_id not in progress:
                progress[section_id] = {"total_fields": 0, "filled_fields": 0, "percent": 0}
            
            # Count filled fields
            for key, value in content.get("content", {}).items():
                progress[section_id]["total_fields"] += 1
                if value and str(value).strip():
                    progress[section_id]["filled_fields"] += 1
            
            # Count table rows
            for table_id, rows in content.get("tables", {}).items():
                progress[section_id]["total_fields"] += len(rows)
                filled_rows = sum(1 for row in rows if any(cell and str(cell).strip() for cell in row))
                progress[section_id]["filled_fields"] += filled_rows
    
    # Calculate percentages
    for section_id in progress:
        total = progress[section_id]["total_fields"]
        filled = progress[section_id]["filled_fields"]
        progress[section_id]["percent"] = int((filled / total * 100) if total > 0 else 0)
    
    return progress

@router.get("/projects/{project_id}/drhp-section-progress/{section_id}")
async def get_drhp_section_progress(project_id: str, section_id: str, user: User = Depends(get_current_user)):
    """Get progress for sub-modules within a DRHP section"""
    progress = {}
    
    # Get all content records for this section
    cursor = db.drhp_content.find({
        "project_id": project_id,
        "section_id": section_id
    }, {"_id": 0})
    content_list = await cursor.to_list(length=50)
    
    for content in content_list:
        sub_module_id = content.get("sub_module_id", "main")
        if sub_module_id not in progress:
            progress[sub_module_id] = {"total_fields": 0, "filled_fields": 0, "percent": 0}
        
        # Count fields
        for key, value in content.get("content", {}).items():
            progress[sub_module_id]["total_fields"] += 1
            if value and str(value).strip():
                progress[sub_module_id]["filled_fields"] += 1
        
        # Count table rows
        for table_id, rows in content.get("tables", {}).items():
            progress[sub_module_id]["total_fields"] += max(1, len(rows))
            filled_rows = sum(1 for row in rows if any(cell and str(cell).strip() for cell in row))
            progress[sub_module_id]["filled_fields"] += filled_rows
    
    # Calculate percentages
    for sub_id in progress:
        total = progress[sub_id]["total_fields"]
        filled = progress[sub_id]["filled_fields"]
        progress[sub_id]["percent"] = int((filled / total * 100) if total > 0 else 0)
    
    return progress

@router.get("/projects/{project_id}/drhp-content/{section_id}")
@router.get("/projects/{project_id}/drhp-content/{section_id}/{sub_module_id}")
async def get_drhp_content(
    project_id: str, 
    section_id: str, 
    sub_module_id: str = None,
    user: User = Depends(get_current_user)
):
    """Get DRHP content for a section or sub-module"""
    
    query = {
        "project_id": project_id,
        "section_id": section_id
    }
    if sub_module_id:
        query["sub_module_id"] = sub_module_id
    
    content = await db.drhp_content.find_one(query, {"_id": 0})
    
    if not content:
        return {
            "project_id": project_id,
            "section_id": section_id,
            "sub_module_id": sub_module_id,
            "content": {},
            "tables": {}
        }
    
    return content

@router.post("/projects/{project_id}/drhp-content/{section_id}")
@router.post("/projects/{project_id}/drhp-content/{section_id}/{sub_module_id}")
async def save_drhp_content(
    project_id: str,
    section_id: str,
    sub_module_id: str = None,
    data: dict = None,
    user: User = Depends(get_current_user)
):
    """Save DRHP content for a section or sub-module"""
    
    if not data:
        data = {}
    
    content_data = data.get("content", {})
    tables_data = data.get("tables", {})
    
    query = {
        "project_id": project_id,
        "section_id": section_id
    }
    if sub_module_id:
        query["sub_module_id"] = sub_module_id
    
    now = datetime.now(timezone.utc)
    
    update_data = {
        "project_id": project_id,
        "section_id": section_id,
        "sub_module_id": sub_module_id,
        "content": content_data,
        "tables": tables_data,
        "updated_by": user.user_id,
        "updated_at": now.isoformat()
    }
    
    result = await db.drhp_content.update_one(
        query,
        {
            "$set": update_data,
            "$setOnInsert": {"created_at": now.isoformat()}
        },
        upsert=True
    )
    
    return {
        "message": "Content saved successfully",
        "project_id": project_id,
        "section_id": section_id,
        "sub_module_id": sub_module_id
    }

@router.post("/projects/{project_id}/drhp-export/{section_id}")
@router.post("/projects/{project_id}/drhp-export/{section_id}/{sub_module_id}")
async def export_drhp_section(
    project_id: str,
    section_id: str,
    sub_module_id: str = None,
    user: User = Depends(get_current_user)
):
    """Export DRHP section content as Word document (placeholder)"""
    # This is a placeholder - full implementation would use python-docx
    return {
        "message": "Export feature coming soon",
        "project_id": project_id,
        "section_id": section_id,
        "sub_module_id": sub_module_id
    }

# ============ DRHP OUTPUT (Word-like Editor) ============

@router.get("/projects/{project_id}/drhp-output")
async def get_drhp_output(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get DRHP Output content for both SME and Mainboard"""
    content = await db.drhp_output.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    if not content:
        return None
    
    return content

@router.post("/projects/{project_id}/drhp-output")
async def save_drhp_output(
    project_id: str,
    data: dict = None,
    user: User = Depends(get_current_user)
):
    """Save DRHP Output content for SME and/or Mainboard"""
    
    if not data:
        data = {}
    
    now = datetime.now(timezone.utc)
    
    update_data = {
        "project_id": project_id,
        "updated_by": user.user_id,
        "updated_at": now.isoformat()
    }
    
    if "sme_content" in data:
        update_data["sme_content"] = data["sme_content"]
    
    if "mainboard_content" in data:
        update_data["mainboard_content"] = data["mainboard_content"]
    
    result = await db.drhp_output.update_one(
        {"project_id": project_id},
        {
            "$set": update_data,
            "$setOnInsert": {"created_at": now.isoformat()}
        },
        upsert=True
    )
    
    return {
        "message": "DRHP Output saved successfully",
        "project_id": project_id,
        "updated_at": now.isoformat()
    }

@router.post("/projects/{project_id}/drhp-output/export")
async def export_drhp_output(
    project_id: str,
    data: dict = None,
    user: User = Depends(get_current_user)
):
    """
    Export DRHP Output as Word (.docx) or PDF document.
    Preserves SEBI-specific formatting including:
    - Paragraph styles and hierarchies
    - Numbered clause structures
    - Custom indentation and text alignment
    - Tables and lists
    - Hyperlinks
    """
    
    if not data:
        raise HTTPException(status_code=400, detail="Export data required")
    
    export_format = data.get("format", "docx").lower()
    board_type = data.get("board_type", "sme")
    content = data.get("content", "")
    
    if export_format not in ["docx", "pdf"]:
        raise HTTPException(status_code=400, detail="Invalid export format. Use 'docx' or 'pdf'.")
    
    # Get project details
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    company_name = project.get("company_name", "Company") if project else "Company"
    
    # If no content provided, try to get from database
    if not content:
        saved_output = await db.drhp_output.find_one({"project_id": project_id}, {"_id": 0})
        if saved_output:
            content_field = "sme_content" if board_type == "sme" else "mainboard_content"
            content = saved_output.get(content_field, "")
    
    if not content:
        raise HTTPException(status_code=400, detail="No content to export. Please provide content or save the document first.")
    
    try:
        if export_format == "docx":
            # Export to Word
            exporter = DRHPWordExporter(content, company_name, board_type)
            file_bytes = exporter.export()
            
            filename = f"DRHP_{board_type.upper()}_{company_name.replace(' ', '_')}.docx"
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            
        else:  # PDF
            # Export to PDF
            exporter = DRHPPDFExporter(content, company_name, board_type)
            file_bytes = exporter.export()
            
            filename = f"DRHP_{board_type.upper()}_{company_name.replace(' ', '_')}.pdf"
            media_type = "application/pdf"
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(file_bytes))
            }
        )
        
    except Exception as e:
        logger.error(f"Error exporting DRHP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export DRHP document: {str(e)}"
        )

@router.post("/projects/{project_id}/drhp-output/import")
async def import_drhp_word(
    project_id: str,
    board_type: str = "sme",
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Import a Word document (.docx) into the DRHP Output editor.
    Uses python-docx for full SEBI-specific formatting preservation:
    - Paragraph styles and hierarchies
    - Numbered clause structures (SEBI format)
    - Custom indentation and text alignment
    - Hyperlinks and bookmarks
    - Images stored as separate files (not inline base64)
    
    Supports multi-page documents up to 50MB.
    """
    
    # Validate file type - ONLY .docx allowed
    if not file.filename.lower().endswith('.docx'):
        raise HTTPException(
            status_code=400, 
            detail="Only .docx files are supported. Please upload a Word document."
        )
    
    # Validate content type
    allowed_types = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream'  # Some browsers send this
    ]
    if file.content_type not in allowed_types:
        logger.warning(f"Unexpected content type: {file.content_type}, allowing anyway for .docx")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file size (max 50MB for multi-page documents)
        max_size = 50 * 1024 * 1024  # 50MB
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is 50MB. Your file is {len(file_content) / (1024*1024):.1f}MB"
            )
        
        # Parse the document using our SEBI-specific parser
        import asyncio, functools
        loop = asyncio.get_event_loop()
        parser = DRHPDocumentParser(file_content, project_id, board_type)
        html_content, parsed_images, warnings = await loop.run_in_executor(None, parser.parse)
        
        # Extract and store images as separate files
        docx_buffer = io.BytesIO(file_content)
        doc = DocxDocument(docx_buffer)
        image_extractor = DRHPImageExtractor(doc, project_id, board_type, db, fs_bucket)
        stored_images = await image_extractor.extract_and_store_images()
        
        # Replace any image placeholders in HTML with actual URLs
        for img in stored_images:
            # Replace image references with URLs
            # The parser includes images with rel_id references
            html_content = html_content.replace(
                f'src="embedded:{img["rel_id"]}"',
                f'src="{img["url"]}"'
            )
        
        # Save the imported content and image references to the database
        now = datetime.now(timezone.utc)
        content_field = "sme_content" if board_type == "sme" else "mainboard_content"
        images_field = f"{board_type}_images"
        docx_field = f"{board_type}_docx_gridfs_id"

        # Also store the raw .docx in GridFS for Syncfusion editor
        old_doc = await db.drhp_output.find_one({"project_id": project_id}, {"_id": 0})
        if old_doc and old_doc.get(docx_field):
            try:
                await fs_bucket.delete(ObjectId(old_doc[docx_field]))
            except Exception:
                pass

        docx_grid_id = await fs_bucket.upload_from_stream(
            f"drhp_{project_id}_{board_type}.docx",
            io.BytesIO(file_content),
            metadata={
                "project_id": project_id,
                "board_type": board_type,
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "uploaded_by": user.user_id,
            }
        )

        # Convert .docx to SFDT using pure Python (no .NET dependency)
        sfdt_grid_id = None
        sfdt_field = f"{board_type}_sfdt_gridfs_id"
        try:
            from routes.docx_to_sfdt import docx_to_sfdt
            sfdt_raw = await loop.run_in_executor(None, functools.partial(docx_to_sfdt, file_content))
            sfdt_data = sfdt_raw.encode("utf-8")
            # Delete old SFDT if exists
            if old_doc and old_doc.get(sfdt_field):
                try:
                    await fs_bucket.delete(ObjectId(old_doc[sfdt_field]))
                except Exception:
                    pass
            sfdt_grid_id_obj = await fs_bucket.upload_from_stream(
                f"drhp_{project_id}_{board_type}.sfdt",
                io.BytesIO(sfdt_data),
                metadata={"project_id": project_id, "board_type": board_type, "content_type": "application/json"}
            )
            sfdt_grid_id = str(sfdt_grid_id_obj)
            logger.info(f"SFDT pre-conversion stored: {len(sfdt_data)} bytes")
        except Exception as e:
            logger.warning(f"SFDT conversion skipped: {e}")

        update_set = {
            content_field: html_content,
            images_field: stored_images,
            docx_field: str(docx_grid_id),
            f"{board_type}_docx_filename": file.filename,
            "updated_by": user.user_id,
            "updated_at": now.isoformat(),
            f"{board_type}_import_info": {
                "filename": file.filename,
                "imported_at": now.isoformat(),
                "file_size": len(file_content),
                "warnings_count": len(warnings),
                "images_count": len(stored_images),
                "parser": "python-docx-sebi"
            }
        }
        if sfdt_grid_id:
            update_set[sfdt_field] = sfdt_grid_id

        await db.drhp_output.update_one(
            {"project_id": project_id},
            {
                "$set": update_set,
                "$setOnInsert": {"created_at": now.isoformat()}
            },
            upsert=True
        )
        
        return {
            "success": True,
            "message": "DRHP document imported with full SEBI formatting preserved",
            "html_content": html_content,
            "board_type": board_type,
            "filename": file.filename,
            "file_size": len(file_content),
            "images": stored_images,
            "images_count": len(stored_images),
            "warnings": warnings,
            "warnings_count": len(warnings)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing DRHP document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to import DRHP document: {str(e)}"
        )


@router.get("/projects/{project_id}/drhp-images/{image_id}")
async def get_drhp_image(
    project_id: str,
    image_id: str,
    user: User = Depends(get_current_user)
):
    """
    Retrieve a DRHP document image stored in GridFS.
    """
    try:
        file_id = ObjectId(image_id)
        
        # Get file info
        grid_out = await fs_bucket.open_download_stream(file_id)
        
        # Verify the image belongs to this project
        if grid_out.metadata.get("project_id") != project_id:
            raise HTTPException(status_code=403, detail="Image not found for this project")
        
        # Read the image data
        image_data = await grid_out.read()
        content_type = grid_out.metadata.get("content_type", "image/png")
        
        return Response(
            content=image_data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000",
                "Content-Disposition": f"inline; filename={grid_out.filename}"
            }
        )
    
    except Exception as e:
        logger.error(f"Error retrieving DRHP image: {str(e)}")
        raise HTTPException(status_code=404, detail="Image not found")


# ============ SYNCFUSION SFDT ENDPOINTS (pre-converted) ============

@router.get("/projects/{project_id}/drhp-sfdt")
async def get_drhp_sfdt(
    project_id: str,
    board_type: str = "sme",
    user: User = Depends(get_current_user)
):
    """Serve pre-converted SFDT for instant loading in Syncfusion editor."""
    doc = await db.drhp_output.find_one({"project_id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No DRHP output found")

    sfdt_field = f"{board_type}_sfdt_gridfs_id"
    gridfs_id = doc.get(sfdt_field)
    if not gridfs_id:
        raise HTTPException(status_code=404, detail="No SFDT data. Import a document first.")

    try:
        grid_out = await fs_bucket.open_download_stream(ObjectId(gridfs_id))
        data = await grid_out.read()
        return Response(content=data, media_type="application/json")
    except Exception as e:
        logger.error(f"Error fetching SFDT: {e}")
        raise HTTPException(status_code=404, detail="Failed to retrieve SFDT")


@router.post("/projects/{project_id}/drhp-sfdt")
async def save_drhp_sfdt(
    project_id: str,
    board_type: str = "sme",
    user: User = Depends(get_current_user)
):
    """Store SFDT JSON from Syncfusion editor save."""
    from starlette.requests import Request as StarletteRequest
    # This endpoint accepts raw SFDT JSON body
    pass


# ============ SYNCFUSION DOCX ENDPOINTS ============

@router.get("/projects/{project_id}/drhp-docx")
async def get_drhp_docx(
    project_id: str,
    board_type: str = "sme",
    user: User = Depends(get_current_user)
):
    """Serve the raw .docx file from GridFS for the Syncfusion Document Editor."""
    doc = await db.drhp_output.find_one({"project_id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No DRHP output found for this project")

    docx_field = f"{board_type}_docx_gridfs_id"
    gridfs_id = doc.get(docx_field)
    if not gridfs_id:
        raise HTTPException(status_code=404, detail="No .docx file stored for this board type. Import a Word document first.")

    try:
        grid_out = await fs_bucket.open_download_stream(ObjectId(gridfs_id))
        data = await grid_out.read()
        filename = doc.get(f"{board_type}_docx_filename", "drhp_output.docx")
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        logger.error(f"Error fetching DRHP docx: {e}")
        raise HTTPException(status_code=404, detail="Failed to retrieve .docx file")


@router.post("/projects/{project_id}/drhp-docx")
async def save_drhp_docx(
    project_id: str,
    board_type: str = "sme",
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Save an edited .docx file back to GridFS from the Syncfusion Document Editor."""
    if not file.filename.lower().endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files accepted")

    file_content = await file.read()
    if len(file_content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    docx_field = f"{board_type}_docx_gridfs_id"
    now = datetime.now(timezone.utc)

    # Delete old GridFS file if exists
    doc = await db.drhp_output.find_one({"project_id": project_id}, {"_id": 0})
    if doc and doc.get(docx_field):
        try:
            await fs_bucket.delete(ObjectId(doc[docx_field]))
        except Exception:
            pass

    # Upload new file to GridFS
    grid_id = await fs_bucket.upload_from_stream(
        f"drhp_{project_id}_{board_type}.docx",
        io.BytesIO(file_content),
        metadata={
            "project_id": project_id,
            "board_type": board_type,
            "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "uploaded_by": user.user_id,
        }
    )

    await db.drhp_output.update_one(
        {"project_id": project_id},
        {
            "$set": {
                docx_field: str(grid_id),
                f"{board_type}_docx_filename": file.filename,
                f"{board_type}_docx_updated_at": now.isoformat(),
                "updated_by": user.user_id,
                "updated_at": now.isoformat(),
            },
            "$setOnInsert": {"created_at": now.isoformat()}
        },
        upsert=True
    )

    return {"success": True, "message": "Document saved", "gridfs_id": str(grid_id)}

