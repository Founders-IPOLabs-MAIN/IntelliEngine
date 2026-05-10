"""
Tests for ADMIN ACCESS RESTRICTION feature.
Only approved admin emails (ronraj2312@gmail.com, founders.ipolabs@gmail.com,
neeraj@emergent.sh, cajagrutisahu@gmail.com) + users with user_type='internal'
or admin roles should be allowed as admins.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drhp-syncfusion.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "ronraj2312@gmail.com"
ADMIN_PASSWORD = "Admin123"

REGULAR_EMAIL = "random_test_user_999@example.com"
REGULAR_PASSWORD = "test123456"


def _fresh():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _ensure_regular_user():
    """Make sure the non-admin regular user exists. Idempotent."""
    s = _fresh()
    s.post(f"{BASE_URL}/api/auth/register", json={
        "email": REGULAR_EMAIL,
        "password": REGULAR_PASSWORD,
        "name": "Random Test User 999"
    }, timeout=30)


@pytest.fixture(scope="module", autouse=True)
def setup_regular_user():
    _ensure_regular_user()
    yield


# ------------------- LOGIN ROLE=ADMIN -------------------
class TestAdminLogin:
    def test_admin_login_role_admin_succeeds(self):
        s = _fresh()
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "login_role": "admin"
        }, timeout=30)
        assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("user", {}).get("is_admin") is True
        assert data.get("session_token")

    def test_non_admin_login_role_admin_rejected(self):
        s = _fresh()
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_EMAIL, "password": REGULAR_PASSWORD, "login_role": "admin"
        }, timeout=30)
        # Either regular user doesn't exist (401) or is rejected for admin role (403)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code} {r.text}"
        if r.status_code == 403:
            assert "admin" in r.text.lower()

    def test_non_admin_login_existing_user_succeeds(self):
        s = _fresh()
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_EMAIL, "password": REGULAR_PASSWORD, "login_role": "existing_user"
        }, timeout=30)
        assert r.status_code == 200, f"regular login failed: {r.status_code} {r.text}"
        assert r.json().get("user", {}).get("is_admin") is False


# ------------------- /api/auth/me -------------------
def _admin_session():
    s = _fresh()
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "login_role": "admin"
    }, timeout=30)
    assert r.status_code == 200, r.text
    return s


def _regular_session():
    s = _fresh()
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": REGULAR_EMAIL, "password": REGULAR_PASSWORD, "login_role": "existing_user"
    }, timeout=30)
    assert r.status_code == 200, r.text
    return s


class TestAuthMe:
    def test_me_admin_is_admin_true(self):
        s = _admin_session()
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data.get("is_admin") is True
        assert data.get("email", "").lower() == ADMIN_EMAIL

    def test_me_regular_is_admin_false(self):
        s = _regular_session()
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data.get("is_admin") is False


# ------------------- /api/admin/users RBAC -------------------
class TestAdminUsersEndpoint:
    def test_admin_can_list_users(self):
        s = _admin_session()
        r = s.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert r.status_code == 200, f"admin should access: {r.status_code} {r.text}"
        assert "users" in r.json()

    def test_regular_cannot_list_users(self):
        s = _regular_session()
        r = s.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text}"


# ------------------- /api/account/profile -------------------
class TestAccountProfile:
    def test_admin_can_access_profile(self):
        s = _admin_session()
        r = s.get(f"{BASE_URL}/api/account/profile", timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
