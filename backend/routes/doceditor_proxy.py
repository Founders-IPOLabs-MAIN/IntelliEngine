"""Proxy routes for Syncfusion Document Editor .NET service running on port 8090."""
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import Response
import httpx

router = APIRouter()

DOCEDITOR_SERVICE = "http://localhost:8090"


@router.post("/doceditor/Import")
async def proxy_import(request: Request):
    """Proxy Import requests to local .NET Syncfusion service."""
    form = await request.form()
    files = {}
    for key in form:
        item = form[key]
        if hasattr(item, 'read'):
            content = await item.read()
            files[key] = (item.filename, content, item.content_type)

    async with httpx.AsyncClient(timeout=60.0) as client:
        # Build multipart form for the .NET service
        resp = await client.post(
            f"{DOCEDITOR_SERVICE}/api/documenteditor/Import",
            files=files
        )
    return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type", "application/json"))


@router.post("/doceditor/RestrictEditing")
async def proxy_restrict_editing(request: Request):
    body = await request.body()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{DOCEDITOR_SERVICE}/api/documenteditor/RestrictEditing", content=body, headers={"Content-Type": "application/json"})
    return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.post("/doceditor/SpellCheck")
async def proxy_spellcheck(request: Request):
    return {"HasSuggestions": False, "Suggestions": []}


@router.post("/doceditor/SystemClipboard")
async def proxy_clipboard(request: Request):
    body = await request.body()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{DOCEDITOR_SERVICE}/api/documenteditor/SystemClipboard", content=body, headers={"Content-Type": "application/json"})
    return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
