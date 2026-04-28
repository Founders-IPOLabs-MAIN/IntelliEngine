"""
Refactoring Regression Tests - verifies that splitting server.py into 16 route modules
preserved behavior. Tests all 28 endpoints called out in the refactor review request.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ipo-readiness-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

REGULAR_EMAIL = "test@example.com"
REGULAR_PASS = "test123"
ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASS = "admin@123"


# ------------ fixtures ------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(s, email, pwd):
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pwd}, timeout=30)
    if r.status_code != 200:
        return None
    data = r.json()
    return data.get("session_token") or data.get("token") or data.get("access_token")


@pytest.fixture(scope="session")
def user_token(session):
    tok = _login(session, REGULAR_EMAIL, REGULAR_PASS)
    if not tok:
        pytest.skip("Regular user login failed")
    return tok


@pytest.fixture(scope="session")
def admin_token(session):
    tok = _login(session, ADMIN_EMAIL, ADMIN_PASS)
    if not tok:
        pytest.skip("Admin login failed")
    return tok


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


def _fresh():
    """Fresh session to avoid cookie-based session carry-over."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ------------ health ------------
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ------------ auth ------------
class TestAuth:
    def test_login_returns_session_token(self, session):
        r = session.post(f"{API}/auth/login", json={"email": REGULAR_EMAIL, "password": REGULAR_PASS}, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "session_token" in body or "token" in body or "access_token" in body
        assert "user" in body or "email" in body

    def test_me_returns_user(self, session, user_token):
        r = session.get(f"{API}/auth/me", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("email") == REGULAR_EMAIL or data.get("user", {}).get("email") == REGULAR_EMAIL

    def test_me_unauthenticated(self, session):
        r = _fresh().get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)


# ------------ projects ------------
class TestProjects:
    def test_list_projects(self, session, user_token):
        r = session.get(f"{API}/projects", headers=_auth(user_token), timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))

    def test_projects_requires_auth(self, session):
        r = _fresh().get(f"{API}/projects", timeout=15)
        assert r.status_code in (401, 403)


# ------------ matchmaker ------------
class TestMatchmaker:
    def test_categories_returns_15(self, session):
        r = session.get(f"{API}/matchmaker/categories", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("categories", [])
        assert len(items) == 15, f"expected 15 got {len(items)}"

    def test_cities(self, session):
        r = session.get(f"{API}/matchmaker/cities", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("cities", [])
        assert len(items) > 0

    def test_professionals_public_search(self, session):
        r = session.get(f"{API}/matchmaker/professionals", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))

    def test_statistics_authenticated(self, session, user_token):
        r = session.get(f"{API}/matchmaker/statistics", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200


# ------------ funding ------------
class TestFunding:
    def test_pre_ipo_options_returns_6(self, session):
        r = session.get(f"{API}/funding/pre-ipo-options", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("options", data.get("data", []))
        assert len(items) == 6, f"expected 6 pre-ipo options, got {len(items)}"

    def test_post_ipo_options(self, session):
        r = session.get(f"{API}/funding/post-ipo-options", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("options", data.get("data", []))
        assert len(items) > 0

    def test_partners(self, session):
        r = session.get(f"{API}/funding/partners", timeout=15)
        assert r.status_code == 200

    def test_quiz_questions(self, session):
        r = session.get(f"{API}/funding/quiz-questions", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("questions", data.get("data", []))
        assert len(items) > 0


# ------------ assessment ------------
class TestAssessment:
    def test_history_authenticated(self, session, user_token):
        r = session.get(f"{API}/assessment/history", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))


# ------------ admin ------------
class TestAdmin:
    def test_roles(self, session, admin_token):
        r = session.get(f"{API}/admin/roles", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200

    def test_users(self, session, admin_token):
        r = session.get(f"{API}/admin/users", headers=_auth(admin_token), timeout=20)
        assert r.status_code == 200

    def test_pending_registrations(self, session, admin_token):
        r = session.get(f"{API}/admin/pending-registrations", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200

    def test_registration_stats(self, session, admin_token):
        r = session.get(f"{API}/admin/registration-stats", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200

    def test_audit_logs(self, session, admin_token):
        r = session.get(f"{API}/admin/audit-logs", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200

    def test_admin_rejects_regular_user(self, session, user_token):
        fs = _fresh()
        r = fs.get(f"{API}/admin/users", headers=_auth(user_token), timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_rejects_unauthenticated(self, session):
        r = _fresh().get(f"{API}/admin/users", timeout=15)
        assert r.status_code in (401, 403)


# ------------ account ------------
class TestAccount:
    def test_profile(self, session, user_token):
        r = session.get(f"{API}/account/profile", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "email" in data or "user" in data or "name" in data

    def test_subscription(self, session, user_token):
        r = session.get(f"{API}/account/subscription", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200

    def test_subscription_plans_returns_4(self, session, user_token):
        # attempt with auth then without
        r = session.get(f"{API}/account/subscription/plans", headers=_auth(user_token), timeout=15)
        if r.status_code in (401, 403):
            r = session.get(f"{API}/account/subscription/plans", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("plans", data.get("data", []))
        assert len(items) == 4, f"expected 4 plans got {len(items)}"


# ------------ market ------------
class TestMarket:
    def test_indices_returns_18(self, session):
        r = session.get(f"{API}/market/indices", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("indices", data.get("data", []))
        assert len(items) == 18, f"expected 18 indices got {len(items)}"

    def test_industries(self, session):
        r = session.get(f"{API}/market/industries", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("industries", data.get("data", []))
        assert len(items) > 0


# ------------ valuation ------------
class TestValuation:
    def test_projects_authenticated(self, session, user_token):
        r = session.get(f"{API}/valuation/projects", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200

    def test_projects_requires_auth(self, session):
        r = _fresh().get(f"{API}/valuation/projects", timeout=15)
        assert r.status_code in (401, 403)


# ------------ careers ------------
class TestCareers:
    def test_positions(self, session):
        r = session.get(f"{API}/careers/positions", timeout=15)
        assert r.status_code == 200


# ------------ contact ------------
class TestContact:
    def test_leads_admin_only(self, session, admin_token):
        r = session.get(f"{API}/contact/leads", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200

    def test_leads_regular_user_rejected(self, session, user_token):
        fs = _fresh()
        r = fs.get(f"{API}/contact/leads", headers=_auth(user_token), timeout=15)
        assert r.status_code in (401, 403)

    def test_create_lead_no_auth(self, session):
        payload = {
            "full_name": "TEST_Refactor Lead",
            "name": "TEST_Refactor Lead",
            "email": "TEST_refactor_lead@example.com",
            "company": "TEST Co",
            "company_name": "TEST Co",
            "phone": "9999999999",
            "mobile": "9999999999",
            "message": "Refactor regression test",
        }
        r = _fresh().post(f"{API}/contact/lead", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text


# ------------ misc ------------
class TestMisc:
    def test_upload_requirements(self, session, user_token):
        # Try unauthenticated first
        r = session.get(f"{API}/upload-requirements", timeout=15)
        if r.status_code in (401, 403):
            r = session.get(f"{API}/upload-requirements", headers=_auth(user_token), timeout=15)
        assert r.status_code == 200
