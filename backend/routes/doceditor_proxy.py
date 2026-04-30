"""Document editor routes - pure Python implementation (no .NET dependency)."""  
import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response

from routes.docx_to_sfdt import docx_to_sfdt, txt_to_sfdt

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/doceditor/Import")
async def import_document(request: Request):
    """Convert uploaded Word/text file to SFDT using pure Python."""
    try:
        form = await request.form()
        file_obj = None
        filename = "document.docx"
        for key in form:
            item = form[key]
            if hasattr(item, "read"):
                file_obj = item
                filename = item.filename or filename
                break
        if file_obj is None:
            return JSONResponse({"error": "No file uploaded"}, status_code=400)

        content = await file_obj.read()
        if len(content) > 10 * 1024 * 1024:
            return JSONResponse({"error": "File size exceeds 10MB limit"}, status_code=400)

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "docx"

        if ext == "txt":
            sfdt = txt_to_sfdt(content.decode("utf-8", errors="replace"))
        else:
            # .docx, .doc (if readable), .rtf treated as docx attempt
            sfdt = docx_to_sfdt(content)

        return Response(content=sfdt, media_type="application/json")

    except Exception as exc:
        logger.exception("Import failed")  
        return JSONResponse({"error": f"Import failed: {exc}"}, status_code=500)


@router.post("/doceditor/RestrictEditing")
async def restrict_editing(request: Request):
    return JSONResponse({"isAuthenticated": True})


@router.post("/doceditor/SpellCheck")
async def spellcheck(request: Request):
    return JSONResponse({"HasSuggestions": False, "Suggestions": []})


@router.post("/doceditor/SystemClipboard")
async def system_clipboard(request: Request):
    return JSONResponse({})
