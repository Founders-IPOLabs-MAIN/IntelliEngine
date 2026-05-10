"""
Oracle (IPO.GPT) — AI research assistant for Indian IPO / capital markets.

Architecture:
  • LLM via emergentintegrations (Gemini 3 Flash for general / Claude Sonnet 4.5 for DRHP)
  • Free web search via DuckDuckGo HTML (no API key, no quota)
  • Long-term memory persisted in MongoDB (oracle_memory) + auto-injected
  • DRHP PDF upload → parsed → chunks stored per thread
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from shared import db, logger, User, get_current_user, datetime, timezone, uuid, os
from pydantic import BaseModel
from typing import Optional, List
from datetime import timedelta
import asyncio
import json
import re
import httpx
import io

from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# ────────────────────── SOURCE GRADING ──────────────────────
SOURCE_TIERS = [
    # Tier 1 — Official regulators
    ({"sebi.gov.in", "rbi.org.in", "nseindia.com", "bseindia.com", "mca.gov.in", "ibbi.gov.in",
      "irdai.gov.in", "pfrda.org.in"},
     {"tier": 1, "label": "Official Regulator", "emoji": "🥇", "color": "amber"}),
    # Tier 2 — Stock exchanges & data
    ({"chittorgarh.com", "ipowatch.in", "cdslindia.com", "nsdl.co.in"},
     {"tier": 2, "label": "Exchanges & Data", "emoji": "🥈", "color": "slate"}),
    # Tier 3 — Financial media
    ({"moneycontrol.com", "economictimes.indiatimes.com", "livemint.com", "business-standard.com",
      "ndtv.com", "ndtvprofit.com", "cnbctv18.com", "bloomberg.com", "reuters.com", "cnn.com",
      "thehindu.com", "thehindubusinessline.com", "financialexpress.com"},
     {"tier": 3, "label": "Financial Media", "emoji": "🥉", "color": "orange"}),
    # Tier 4 — Aggregators / fintech apps
    ({"zerodha.com", "groww.in", "angelone.in", "5paisa.com", "smallcase.com", "screener.in",
      "trendlyne.com", "tickertape.in", "perplexity.ai"},
     {"tier": 4, "label": "Aggregators & Apps", "emoji": "🔵", "color": "blue"}),
    # Tier 5 — Research / academic
    ({"ssrn.com", "papers.ssrn.com", "iimb.ac.in", "iitb.ac.in", "iim.ac.in", "isb.edu",
      "rbi.org.in/scripts/researchpapers"},
     {"tier": 5, "label": "Research & Academic", "emoji": "🟣", "color": "purple"}),
]

def grade_source(url: str) -> dict:
    """Return tier metadata for a given URL based on its domain."""
    if not url:
        return {"tier": 6, "label": "Web & Community", "emoji": "⚪", "color": "gray"}
    try:
        m = re.search(r"https?://([^/]+)", url)
        host = (m.group(1) if m else url).lower()
        host = re.sub(r"^www\.", "", host)
    except Exception:
        return {"tier": 6, "label": "Web & Community", "emoji": "⚪", "color": "gray"}
    for domains, meta in SOURCE_TIERS:
        if any(host == d or host.endswith("." + d) for d in domains):
            return {**meta, "domain": host}
    return {"tier": 6, "label": "Web & Community", "emoji": "⚪", "color": "gray", "domain": host}


# ────────────────────── FREE WEB SEARCH (DuckDuckGo) ──────────────────────
async def ddg_search(query: str, source_filter: str = "all", max_results: int = 6) -> List[dict]:
    """Fetch top results from DuckDuckGo HTML — no API key required.

    source_filter: 'all' | 'official' | 'news' | 'academic'
    """
    site_map = {
        "official": "(site:sebi.gov.in OR site:rbi.org.in OR site:nseindia.com OR site:bseindia.com OR site:mca.gov.in)",
        "news": "(site:moneycontrol.com OR site:economictimes.indiatimes.com OR site:livemint.com OR site:business-standard.com OR site:ndtvprofit.com OR site:cnbctv18.com)",
        "academic": "(site:ssrn.com OR site:papers.ssrn.com OR site:rbi.org.in/scripts/researchpapers)",
    }
    if source_filter in site_map:
        query = f"{query} {site_map[source_filter]}"

    url = "https://html.duckduckgo.com/html/"
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            r = await client.post(url, data={"q": query}, headers={
                "User-Agent": "Mozilla/5.0 (compatible; SETU-Oracle/1.0)",
            })
            html = r.text
    except Exception as e:
        logger.warning(f"DDG search failed: {e}")
        return []

    # Parse result blocks (DDG html-only frontend is stable)
    results = []
    for m in re.finditer(
        r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
        html, re.DOTALL,
    ):
        link = m.group(1)
        # DDG redirects via uddg= parameter
        ud = re.search(r"uddg=([^&]+)", link)
        if ud:
            from urllib.parse import unquote
            link = unquote(ud.group(1))
        title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        snippet = re.sub(r"<[^>]+>", "", m.group(3)).strip()
        if title and link.startswith("http"):
            results.append({
                "title": title[:200],
                "url": link,
                "snippet": snippet[:400],
                "grade": grade_source(link),
            })
        if len(results) >= max_results:
            break
    return results


# ────────────────────── LONG-TERM MEMORY ──────────────────────
async def fetch_user_memory(user_id: str, limit: int = 12) -> List[str]:
    docs = await db.oracle_memory.find(
        {"user_id": user_id}, {"_id": 0, "fact": 1}
    ).sort("created_at", -1).to_list(limit)
    return [d["fact"] for d in docs if d.get("fact")]


async def append_memory(user_id: str, facts: List[str], thread_id: Optional[str] = None):
    if not facts:
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = [
        {"memory_id": f"mem_{uuid.uuid4().hex[:12]}", "user_id": user_id,
         "fact": f.strip()[:400], "source_thread_id": thread_id, "created_at": now}
        for f in facts if f and f.strip()
    ]
    if docs:
        await db.oracle_memory.insert_many(docs)


# ────────────────────── PROMPTS ──────────────────────
SYSTEM_PROMPT_GENERAL = """You are IPO Intelligence (Oracle), an expert AI research assistant for Indian capital markets, specialised in:
• Indian and global IPO markets (1990–present), SME and Mainboard
• SEBI / RBI / NSE / BSE / MCA / IBBI regulations and filings
• DRHP analysis (section-by-section), GMP, subscription, allotment, listing data
• Pre-IPO funding, valuations, comparables, anchor investors

Answer rules:
1. Be precise. Use bullet points and short headers for complex answers.
2. Every factual claim MUST cite a source from the WEB_SEARCH_RESULTS supplied to you. Use inline numbered citations like [1], [2] that match the result index.
3. Prefer Tier-1 (regulators) > Tier-2 (exchanges) > Tier-3 (financial media). Avoid Tier-6 unless nothing else is available.
4. If the data is not in the search results AND not in your knowledge with high confidence, say "I don't have verified data for this — try {SEBI/NSE/BSE filing portal}" instead of guessing.
5. End every answer with exactly 3 follow-up suggestions that are short, specific, and clickable.

Output a single JSON object with this exact schema (no prose outside JSON):
{
  "answer_markdown": "<the full answer in markdown with inline [1] [2] citations>",
  "citations_used": [<list of result indexes you actually cited, e.g. [1, 3]>],
  "follow_ups": ["q1", "q2", "q3"]
}
"""

SYSTEM_PROMPT_DRHP = """You are IPO Intelligence (Oracle), specialised in analysing Draft Red Herring Prospectus (DRHP) documents filed with SEBI.

You will receive DRHP_TEXT chunks from a document the user uploaded. Use ONLY this text to answer. Do not invent facts.

Answer rules:
1. Quote the section name (e.g. "Risk Factors", "Objects of the Issue") whenever possible.
2. If a number / fact is in the DRHP text, cite the chunk index like [chunk-3].
3. Use markdown — short paragraphs, bullet lists for risks / objects.
4. If the DRHP doesn't cover the asked question, say so clearly and suggest where (other DRHP section) the user might find it.
5. End with 3 short, specific follow-up questions about THIS DRHP.

Output JSON only:
{
  "answer_markdown": "<answer with [chunk-N] citations>",
  "citations_used": [<list of chunk indexes used>],
  "follow_ups": ["q1", "q2", "q3"]
}
"""


# ────────────────────── HELPERS ──────────────────────
def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


async def _ensure_thread(user_id: str, thread_id: Optional[str], mode: str, first_query: str) -> dict:
    if thread_id:
        t = await db.oracle_threads.find_one({"thread_id": thread_id, "user_id": user_id}, {"_id": 0})
        if t:
            return t
    title = (first_query or "New chat").strip()
    title = (title[:60] + "…") if len(title) > 60 else title
    t = {
        "thread_id": _new_id("orc"),
        "user_id": user_id,
        "title": title,
        "mode": mode,
        "pinned": False,
        "drhp_filename": None,
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }
    await db.oracle_threads.insert_one(t)
    return t


async def _save_message(thread_id: str, user_id: str, role: str, content: str,
                        citations: list = None, references: list = None,
                        follow_ups: list = None) -> dict:
    msg = {
        "message_id": _new_id("orcm"),
        "thread_id": thread_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "citations": citations or [],
        "references": references or [],
        "follow_ups": follow_ups or [],
        "created_at": _utcnow(),
    }
    await db.oracle_messages.insert_one(msg)
    msg.pop("_id", None)
    await db.oracle_threads.update_one(
        {"thread_id": thread_id}, {"$set": {"updated_at": msg["created_at"]}}
    )
    return msg


async def _thread_history(thread_id: str, limit: int = 20) -> List[dict]:
    msgs = await db.oracle_messages.find(
        {"thread_id": thread_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(limit)
    return msgs


def _chunk_text(text: str, size: int = 2000) -> List[str]:
    words = text.split()
    chunks, cur = [], []
    cur_len = 0
    for w in words:
        cur.append(w)
        cur_len += len(w) + 1
        if cur_len >= size:
            chunks.append(" ".join(cur))
            cur, cur_len = [], 0
    if cur:
        chunks.append(" ".join(cur))
    return chunks


# ────────────────────── LLM CALLS ──────────────────────
def _safe_json(text: str) -> dict:
    """Extract a JSON object from LLM output (fences, prose, etc.)."""
    if not text:
        return {}
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    else:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            text = m.group(0)
    try:
        return json.loads(text)
    except Exception:
        return {"answer_markdown": text.strip(), "citations_used": [], "follow_ups": []}


async def call_general_llm(query: str, history: List[dict], memory: List[str],
                           web_results: List[dict]) -> dict:
    """Gemini 3 Flash for general queries — synthesises web search results into a cited answer."""
    sys = SYSTEM_PROMPT_GENERAL
    if memory:
        sys += "\n\nUSER LONG-TERM MEMORY (facts to remember about this user):\n- " + "\n- ".join(memory[:8])

    results_block = "\n".join(
        f"[{i+1}] {r['grade']['emoji']} {r['grade']['label']} — {r['title']}\n     URL: {r['url']}\n     {r['snippet']}"
        for i, r in enumerate(web_results)
    ) or "(no live web results — answer from your training knowledge but be conservative)"

    convo_block = "\n".join(
        f"{m['role'].upper()}: {m['content'][:600]}" for m in history[-6:]
    )

    user_prompt = f"""WEB_SEARCH_RESULTS:
{results_block}

PREVIOUS TURNS (this thread):
{convo_block or "(none)"}

USER QUESTION: {query}
"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"oracle_general_{uuid.uuid4().hex[:8]}",
        system_message=sys,
    ).with_model("gemini", "gemini-3-flash-preview")
    try:
        raw = await chat.send_message(UserMessage(text=user_prompt))
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        # graceful fallback to claude
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"oracle_general_fb_{uuid.uuid4().hex[:8]}",
            system_message=sys,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        raw = await chat.send_message(UserMessage(text=user_prompt))
    return _safe_json(raw)


async def call_drhp_llm(query: str, chunks: List[dict], history: List[dict]) -> dict:
    """Claude Sonnet for DRHP deep-research — long-context reasoning over uploaded PDF text."""
    chunk_block = "\n\n".join(
        f"[chunk-{c['chunk_idx']}]\n{c['text'][:1500]}" for c in chunks[:15]
    )
    convo_block = "\n".join(
        f"{m['role'].upper()}: {m['content'][:600]}" for m in history[-4:]
    )
    user_prompt = f"""DRHP_TEXT (extracts from the uploaded prospectus):
{chunk_block}

PREVIOUS TURNS:
{convo_block or "(none)"}

USER QUESTION: {query}
"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"oracle_drhp_{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_PROMPT_DRHP,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    raw = await chat.send_message(UserMessage(text=user_prompt))
    return _safe_json(raw)


async def extract_memory_facts(user_id: str, query: str, answer: str):
    """Best-effort: extract durable user facts from a turn using the LLM, then persist."""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"oracle_mem_{uuid.uuid4().hex[:8]}",
            system_message=(
                "Extract 0-3 durable facts about the USER (their portfolio, sector interest, role, "
                "company name, listing intent, watchlist) from this Q&A. Return JSON: {\"facts\": [\"...\"]}. "
                "Only include facts that are clearly stated. Skip generic Q&A topics."
            ),
        ).with_model("gemini", "gemini-3-flash-preview")
        raw = await chat.send_message(UserMessage(text=f"Q: {query}\nA: {answer[:1200]}"))
        data = _safe_json(raw)
        await append_memory(user_id, data.get("facts", []) or [])
    except Exception as e:
        logger.debug(f"memory extraction skipped: {e}")


# ════════════════════════ ENDPOINTS ════════════════════════

class ChatRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None
    mode: str = "general"          # "general" | "drhp" | "application"
    source_filter: str = "all"     # "all" | "official" | "news" | "academic"


@router.post("/oracle/chat")
async def oracle_chat(data: ChatRequest, user: User = Depends(get_current_user)):
    if not data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="LLM key not configured")

    thread = await _ensure_thread(user.user_id, data.thread_id, data.mode, data.query)
    history = await _thread_history(thread["thread_id"])
    memory = await fetch_user_memory(user.user_id)

    # Persist the user message immediately
    await _save_message(thread["thread_id"], user.user_id, "user", data.query)

    references = []
    if data.mode == "drhp":
        chunks = await db.oracle_drhp_chunks.find(
            {"thread_id": thread["thread_id"]}, {"_id": 0}
        ).sort("chunk_idx", 1).to_list(50)
        if not chunks:
            raise HTTPException(status_code=400, detail="Upload a DRHP PDF in this thread before asking DRHP questions")
        result = await call_drhp_llm(data.query, chunks, history)
        # references = the chunk citations found
        used = result.get("citations_used", []) or []
        references = [
            {"label": f"DRHP — chunk {idx}", "url": None,
             "grade": {"tier": 1, "label": "Uploaded DRHP", "emoji": "📄", "color": "amber"}}
            for idx in used
        ]
    else:
        # General / application mode → DDG search → Gemini synthesis
        web_results = await ddg_search(data.query, data.source_filter)
        result = await call_general_llm(data.query, history, memory, web_results)
        used = result.get("citations_used", []) or []
        for idx in used:
            if 0 < idx <= len(web_results):
                r = web_results[idx - 1]
                references.append({
                    "label": r["title"], "url": r["url"], "snippet": r["snippet"],
                    "grade": r["grade"],
                })

    answer_md = result.get("answer_markdown", "").strip() or "I couldn't generate a response. Please try rephrasing."
    follow_ups = result.get("follow_ups", []) or []

    msg = await _save_message(
        thread["thread_id"], user.user_id, "assistant",
        answer_md, citations=result.get("citations_used", []),
        references=references, follow_ups=follow_ups,
    )

    # Fire-and-forget memory extraction (don't block the user)
    asyncio.create_task(extract_memory_facts(user.user_id, data.query, answer_md))

    return {
        "thread_id": thread["thread_id"],
        "thread_title": thread["title"],
        "message": msg,
    }


@router.get("/oracle/threads")
async def list_threads(user: User = Depends(get_current_user)):
    """Returns threads grouped by date band (today / yesterday / last_7 / last_30 / older)."""
    threads = await db.oracle_threads.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort([("pinned", -1), ("updated_at", -1)]).to_list(500)

    now = datetime.now(timezone.utc)
    today = now.date()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    buckets = {"pinned": [], "today": [], "yesterday": [], "last_7": [], "last_30": [], "older": []}
    for t in threads:
        if t.get("pinned"):
            buckets["pinned"].append(t)
            continue
        try:
            d = datetime.fromisoformat(t["updated_at"]).date()
        except Exception:
            d = today
        if d == today:
            buckets["today"].append(t)
        elif d == yesterday:
            buckets["yesterday"].append(t)
        elif d >= week_ago:
            buckets["last_7"].append(t)
        elif d >= month_ago:
            buckets["last_30"].append(t)
        else:
            buckets["older"].append(t)
    return {"buckets": buckets, "total": len(threads)}


@router.get("/oracle/threads/{thread_id}")
async def get_thread(thread_id: str, user: User = Depends(get_current_user)):
    t = await db.oracle_threads.find_one({"thread_id": thread_id, "user_id": user.user_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Thread not found")
    msgs = await _thread_history(thread_id, limit=200)
    return {"thread": t, "messages": msgs}


class ThreadPatch(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None


@router.patch("/oracle/threads/{thread_id}")
async def update_thread(thread_id: str, data: ThreadPatch, user: User = Depends(get_current_user)):
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updated_at"] = _utcnow()
    res = await db.oracle_threads.update_one(
        {"thread_id": thread_id, "user_id": user.user_id}, {"$set": update}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"message": "Updated"}


@router.delete("/oracle/threads/{thread_id}")
async def delete_thread(thread_id: str, user: User = Depends(get_current_user)):
    res = await db.oracle_threads.delete_one({"thread_id": thread_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Thread not found")
    await db.oracle_messages.delete_many({"thread_id": thread_id, "user_id": user.user_id})
    await db.oracle_drhp_chunks.delete_many({"thread_id": thread_id})
    return {"message": "Deleted"}


# ────────────────────── BOOKMARKS ──────────────────────
class BookmarkRequest(BaseModel):
    message_id: str


@router.post("/oracle/bookmarks")
async def add_bookmark(data: BookmarkRequest, user: User = Depends(get_current_user)):
    msg = await db.oracle_messages.find_one({"message_id": data.message_id, "user_id": user.user_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    bm = {
        "bookmark_id": _new_id("bkm"),
        "user_id": user.user_id,
        "message_id": data.message_id,
        "thread_id": msg["thread_id"],
        "preview": msg["content"][:200],
        "created_at": _utcnow(),
    }
    await db.oracle_bookmarks.insert_one(bm)
    bm.pop("_id", None)
    return {"bookmark": bm}


@router.get("/oracle/bookmarks")
async def list_bookmarks(user: User = Depends(get_current_user)):
    bms = await db.oracle_bookmarks.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"bookmarks": bms}


@router.delete("/oracle/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str, user: User = Depends(get_current_user)):
    res = await db.oracle_bookmarks.delete_one({"bookmark_id": bookmark_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Deleted"}


# ────────────────────── DRHP UPLOAD ──────────────────────
@router.post("/oracle/drhp/upload")
async def upload_drhp(
    file: UploadFile = File(...),
    thread_id: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    content = await file.read()
    if len(content) > 30 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="DRHP must be 30 MB or smaller")

    # Parse PDF text
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text = "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as e:
        logger.error(f"PDF parse failed: {e}")
        raise HTTPException(status_code=400, detail="Could not parse this PDF")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) < 200:
        raise HTTPException(status_code=400, detail="PDF appears empty or image-only — try a text-based PDF")

    # Ensure / create thread
    thread = await _ensure_thread(user.user_id, thread_id, "drhp", f"DRHP — {file.filename}")
    await db.oracle_threads.update_one(
        {"thread_id": thread["thread_id"]},
        {"$set": {"drhp_filename": file.filename, "mode": "drhp", "updated_at": _utcnow()}}
    )
    # Replace prior chunks for this thread
    await db.oracle_drhp_chunks.delete_many({"thread_id": thread["thread_id"]})
    chunks = _chunk_text(text, size=2000)
    docs = [
        {"thread_id": thread["thread_id"], "user_id": user.user_id,
         "chunk_idx": i, "text": c}
        for i, c in enumerate(chunks[:60])  # cap to 60 chunks (~120k chars)
    ]
    if docs:
        await db.oracle_drhp_chunks.insert_many(docs)

    return {
        "thread_id": thread["thread_id"],
        "filename": file.filename,
        "chunks": len(docs),
        "preview": text[:500],
    }


# ────────────────────── MEMORY (read-only for users) ──────────────────────
@router.get("/oracle/memory")
async def list_memory(user: User = Depends(get_current_user)):
    facts = await db.oracle_memory.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"facts": facts}


@router.delete("/oracle/memory/{memory_id}")
async def delete_memory(memory_id: str, user: User = Depends(get_current_user)):
    res = await db.oracle_memory.delete_one({"memory_id": memory_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Deleted"}
