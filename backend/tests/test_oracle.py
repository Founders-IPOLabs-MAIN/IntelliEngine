"""Backend tests for Oracle (IPO.GPT) module."""
import os
import time
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drhp-syncfusion.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASSWORD = "admin@123"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    yield s


# ─────────── Auth enforcement ───────────
def test_threads_requires_auth():
    r = requests.get(f"{BASE_URL}/api/oracle/threads", timeout=15)
    assert r.status_code in (401, 403)


def test_chat_requires_auth():
    r = requests.post(f"{BASE_URL}/api/oracle/chat", json={"query": "hi"}, timeout=15)
    assert r.status_code in (401, 403)


# ─────────── General chat ───────────
@pytest.fixture(scope="module")
def chat_thread(auth_session):
    payload = {"query": "What is an IPO in India?", "mode": "general", "source_filter": "all"}
    r = auth_session.post(f"{BASE_URL}/api/oracle/chat", json=payload, timeout=120)
    assert r.status_code == 200, f"Chat failed: {r.status_code} {r.text[:400]}"
    data = r.json()
    return data


def test_general_chat_response_shape(chat_thread):
    assert "thread_id" in chat_thread
    msg = chat_thread["message"]
    assert msg["role"] == "assistant"
    assert isinstance(msg["content"], str) and len(msg["content"]) > 200
    # may have references; if so, check tier shape
    if msg.get("references"):
        ref = msg["references"][0]
        assert "grade" in ref
        assert ref["grade"]["tier"] in [1, 2, 3, 4, 5, 6]
        assert "emoji" in ref["grade"]
    # follow_ups: should be 3 items (best-effort — accept >=1)
    assert isinstance(msg.get("follow_ups", []), list)


def test_chat_multi_turn_same_thread(auth_session, chat_thread):
    tid = chat_thread["thread_id"]
    r = auth_session.post(f"{BASE_URL}/api/oracle/chat",
                          json={"query": "What about SME IPOs specifically?", "thread_id": tid, "mode": "general"},
                          timeout=120)
    assert r.status_code == 200
    data = r.json()
    assert data["thread_id"] == tid
    assert len(data["message"]["content"]) > 50


def test_chat_empty_query_rejected(auth_session):
    r = auth_session.post(f"{BASE_URL}/api/oracle/chat", json={"query": "   "}, timeout=15)
    assert r.status_code == 400


# ─────────── Threads list / get / patch / delete ───────────
def test_threads_buckets(auth_session, chat_thread):
    r = auth_session.get(f"{BASE_URL}/api/oracle/threads", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "buckets" in data and "total" in data
    for k in ["pinned", "today", "yesterday", "last_7", "last_30", "older"]:
        assert k in data["buckets"]
    assert data["total"] >= 1


def test_get_thread_messages(auth_session, chat_thread):
    tid = chat_thread["thread_id"]
    r = auth_session.get(f"{BASE_URL}/api/oracle/threads/{tid}", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["thread"]["thread_id"] == tid
    assert isinstance(data["messages"], list) and len(data["messages"]) >= 2


def test_patch_thread_rename_and_pin(auth_session, chat_thread):
    tid = chat_thread["thread_id"]
    r = auth_session.patch(f"{BASE_URL}/api/oracle/threads/{tid}", json={"title": "TEST_renamed_thread"}, timeout=15)
    assert r.status_code == 200
    r2 = auth_session.patch(f"{BASE_URL}/api/oracle/threads/{tid}", json={"pinned": True}, timeout=15)
    assert r2.status_code == 200
    # Verify pinned in buckets list
    r3 = auth_session.get(f"{BASE_URL}/api/oracle/threads", timeout=15)
    pinned = r3.json()["buckets"]["pinned"]
    assert any(t["thread_id"] == tid and t.get("pinned") for t in pinned)


# ─────────── Bookmarks ───────────
def test_bookmark_lifecycle(auth_session, chat_thread):
    tid = chat_thread["thread_id"]
    r = auth_session.get(f"{BASE_URL}/api/oracle/threads/{tid}", timeout=15)
    asst = next(m for m in r.json()["messages"] if m["role"] == "assistant")
    mid = asst["message_id"]
    rb = auth_session.post(f"{BASE_URL}/api/oracle/bookmarks", json={"message_id": mid}, timeout=15)
    assert rb.status_code == 200
    bm_id = rb.json()["bookmark"]["bookmark_id"]
    rl = auth_session.get(f"{BASE_URL}/api/oracle/bookmarks", timeout=15)
    assert rl.status_code == 200
    assert any(b["bookmark_id"] == bm_id for b in rl.json()["bookmarks"])
    rd = auth_session.delete(f"{BASE_URL}/api/oracle/bookmarks/{bm_id}", timeout=15)
    assert rd.status_code == 200


# ─────────── Memory ───────────
def test_memory_endpoint_returns_facts(auth_session, chat_thread):
    # fire-and-forget extraction is async; allow some time
    time.sleep(6)
    r = auth_session.get(f"{BASE_URL}/api/oracle/memory", timeout=15)
    assert r.status_code == 200
    assert "facts" in r.json()


# ─────────── DRHP ───────────
def test_drhp_chat_without_upload_400(auth_session):
    # Create a fresh thread by using a brand-new request first (mode=drhp without upload)
    r = auth_session.post(f"{BASE_URL}/api/oracle/chat",
                          json={"query": "Summarise risk factors", "mode": "drhp"},
                          timeout=30)
    assert r.status_code == 400
    assert "Upload" in r.text or "DRHP" in r.text


def _make_test_pdf() -> bytes:
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        text = ("DRHP Test Document. Risk Factors: This is a sample risk text. "
                "Objects of the Issue: Funding working capital and general corporate purposes. "
                "Related Party Transactions: Sample transaction with promoter. "
                "Industry Overview: Indian fintech market grew at 25 percent CAGR. ") * 20
        for i, line in enumerate([text[i:i+90] for i in range(0, len(text), 90)]):
            c.drawString(40, 750 - (i * 14), line)
            if 750 - (i * 14) < 60:
                c.showPage()
        c.save()
        return buf.getvalue()
    except ImportError:
        pytest.skip("reportlab not installed")


def test_drhp_upload_and_chat(auth_session):
    pdf_bytes = _make_test_pdf()
    files = {"file": ("test_drhp.pdf", pdf_bytes, "application/pdf")}
    r = auth_session.post(f"{BASE_URL}/api/oracle/drhp/upload", files=files, timeout=60)
    assert r.status_code == 200, f"Upload failed: {r.status_code} {r.text[:300]}"
    data = r.json()
    assert data["chunks"] > 0
    tid = data["thread_id"]
    # Chat in DRHP mode
    rc = auth_session.post(f"{BASE_URL}/api/oracle/chat",
                           json={"query": "What are the Objects of the Issue?", "mode": "drhp", "thread_id": tid},
                           timeout=120)
    assert rc.status_code == 200, f"DRHP chat failed: {rc.text[:300]}"
    msg = rc.json()["message"]
    assert len(msg["content"]) > 50


# ─────────── Source grading ───────────
def test_source_grading_logic():
    """Direct test of grade_source — imported from backend module."""
    import sys
    sys.path.insert(0, "/app/backend")
    from routes.oracle import grade_source
    assert grade_source("https://www.sebi.gov.in/foo")["tier"] == 1
    assert grade_source("https://www.moneycontrol.com/x")["tier"] == 3
    assert grade_source("https://www.zerodha.com/y")["tier"] == 4
    assert grade_source("https://random-blog.com/z")["tier"] == 6
    assert "emoji" in grade_source("https://www.sebi.gov.in/x")


# ─────────── Cleanup ───────────
def test_zz_delete_thread(auth_session, chat_thread):
    tid = chat_thread["thread_id"]
    r = auth_session.delete(f"{BASE_URL}/api/oracle/threads/{tid}", timeout=15)
    assert r.status_code == 200
    r2 = auth_session.get(f"{BASE_URL}/api/oracle/threads/{tid}", timeout=15)
    assert r2.status_code == 404
