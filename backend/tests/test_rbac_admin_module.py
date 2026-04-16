"""
RBAC Admin Module Tests
Tests for:
- Admin Login gate at /admin
- Admin Login with credentials admin@ipolabs.com / admin@123
- Admin Login with wrong credentials
- GET /api/admin/users returns users with module_permissions
- PUT /api/admin/users/{user_id}/permissions updates permissions
- GET /api/auth/me returns is_admin and module_permissions fields
- Module access enforcement for regular users
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASSWORD = "admin@123"
REGULAR_USER_EMAIL = "test@example.com"
REGULAR_USER_PASSWORD = "test123"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")


class TestAdminLogin:
    """Tests for POST /api/admin/login endpoint"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials should succeed"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain 'user' field"
        assert "session_token" in data, "Response should contain 'session_token'"
        assert data.get("is_admin") == True, "is_admin should be True"
        
        # Verify user data
        user = data["user"]
        assert user.get("email") == ADMIN_EMAIL
        assert user.get("role") in ["admin", "super_admin", "master_admin", "Admin"]
        print(f"✓ Admin login successful for {ADMIN_EMAIL}")
        
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login correctly rejected wrong password")
        
    def test_admin_login_wrong_email(self):
        """Admin login with non-existent email should fail"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "nonexistent@admin.com", "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login correctly rejected non-existent email")
        
    def test_admin_login_non_admin_user(self):
        """Regular user trying admin login should fail"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": REGULAR_USER_EMAIL, "password": REGULAR_USER_PASSWORD}
        )
        # Should fail with 403 (not admin) or 401 (invalid credentials)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin login correctly rejected non-admin user")


class TestRegularUserLogin:
    """Tests for regular user login and auth/me endpoint"""
    
    @pytest.fixture
    def regular_user_session(self):
        """Login as regular user and return session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": REGULAR_USER_EMAIL, "password": REGULAR_USER_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Regular user login failed: {response.text}")
        return session
    
    def test_regular_user_login(self):
        """Regular user login should succeed"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": REGULAR_USER_EMAIL, "password": REGULAR_USER_PASSWORD}
        )
        assert response.status_code == 200, f"Regular user login failed: {response.text}"
        data = response.json()
        assert "user" in data
        print(f"✓ Regular user login successful for {REGULAR_USER_EMAIL}")
        
    def test_auth_me_returns_module_permissions(self, regular_user_session):
        """GET /api/auth/me should return module_permissions"""
        response = regular_user_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"auth/me failed: {response.text}"
        data = response.json()
        
        # Verify module_permissions field exists
        assert "module_permissions" in data, "Response should contain 'module_permissions'"
        perms = data["module_permissions"]
        
        # Verify all 5 modules are present
        expected_modules = ["assessment", "matchmaker", "drhp", "funding", "valuation"]
        for mod in expected_modules:
            assert mod in perms, f"module_permissions should contain '{mod}'"
            assert isinstance(perms[mod], bool), f"{mod} permission should be boolean"
        
        print(f"✓ auth/me returns module_permissions: {perms}")
        
    def test_auth_me_returns_is_admin(self, regular_user_session):
        """GET /api/auth/me should return is_admin field"""
        response = regular_user_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        
        assert "is_admin" in data, "Response should contain 'is_admin'"
        assert data["is_admin"] == False, "Regular user should have is_admin=False"
        print("✓ auth/me returns is_admin=False for regular user")


class TestAdminUserManagement:
    """Tests for admin user management endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return session
    
    def test_get_admin_users_list(self, admin_session):
        """GET /api/admin/users should return users with module_permissions"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Get users failed: {response.text}"
        data = response.json()
        
        assert "users" in data, "Response should contain 'users'"
        users = data["users"]
        assert len(users) > 0, "Should have at least one user"
        
        # Check that users have module_permissions
        for user in users:
            assert "user_id" in user, "User should have user_id"
            assert "email" in user, "User should have email"
            assert "module_permissions" in user, f"User {user.get('email')} should have module_permissions"
            
        print(f"✓ GET /api/admin/users returned {len(users)} users with module_permissions")
        
    def test_get_user_permissions(self, admin_session):
        """GET /api/admin/users/{user_id}/permissions should return permissions"""
        # First get users list to find a user_id
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert users_response.status_code == 200
        users = users_response.json()["users"]
        
        # Find the test user
        test_user = next((u for u in users if u["email"] == REGULAR_USER_EMAIL), None)
        if not test_user:
            pytest.skip("Test user not found")
            
        user_id = test_user["user_id"]
        
        response = admin_session.get(f"{BASE_URL}/api/admin/users/{user_id}/permissions")
        assert response.status_code == 200, f"Get permissions failed: {response.text}"
        data = response.json()
        
        assert "permissions" in data, "Response should contain 'permissions'"
        perms = data["permissions"]
        
        expected_modules = ["assessment", "matchmaker", "drhp", "funding", "valuation"]
        for mod in expected_modules:
            assert mod in perms, f"Permissions should contain '{mod}'"
            
        print(f"✓ GET /api/admin/users/{user_id}/permissions returned: {perms}")
        
    def test_update_user_permissions(self, admin_session):
        """PUT /api/admin/users/{user_id}/permissions should update permissions"""
        # First get users list to find a user_id
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert users_response.status_code == 200
        users = users_response.json()["users"]
        
        # Find the test user
        test_user = next((u for u in users if u["email"] == REGULAR_USER_EMAIL), None)
        if not test_user:
            pytest.skip("Test user not found")
            
        user_id = test_user["user_id"]
        
        # Get current permissions
        current_response = admin_session.get(f"{BASE_URL}/api/admin/users/{user_id}/permissions")
        current_perms = current_response.json()["permissions"]
        
        # Toggle drhp permission
        new_drhp_value = not current_perms.get("drhp", False)
        new_perms = {
            "assessment": True,
            "matchmaker": True,
            "drhp": new_drhp_value,
            "funding": False,
            "valuation": False
        }
        
        response = admin_session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/permissions",
            json={"permissions": new_perms}
        )
        assert response.status_code == 200, f"Update permissions failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "updated", "Status should be 'updated'"
        assert "permissions" in data, "Response should contain 'permissions'"
        assert data["permissions"]["drhp"] == new_drhp_value, "DRHP permission should be updated"
        
        print(f"✓ PUT /api/admin/users/{user_id}/permissions updated drhp to {new_drhp_value}")
        
        # Restore original permissions
        admin_session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/permissions",
            json={"permissions": current_perms}
        )
        print("✓ Restored original permissions")


class TestModuleAccessEnforcement:
    """Tests for module access enforcement based on permissions"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return session
    
    @pytest.fixture
    def regular_user_session(self):
        """Login as regular user and return session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": REGULAR_USER_EMAIL, "password": REGULAR_USER_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Regular user login failed: {response.text}")
        return session
    
    def test_regular_user_default_permissions(self, regular_user_session):
        """Regular user should have default permissions (assessment=true, matchmaker=true, others=false)"""
        response = regular_user_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        
        perms = data.get("module_permissions", {})
        
        # Default permissions: assessment=true, matchmaker=true, drhp=false, funding=false, valuation=false
        assert perms.get("assessment") == True, "assessment should be True by default"
        assert perms.get("matchmaker") == True, "matchmaker should be True by default"
        # Note: drhp, funding, valuation may be false by default unless admin changed them
        
        print(f"✓ Regular user permissions: {perms}")
        
    def test_admin_user_has_all_permissions(self, admin_session):
        """Admin user should have all module permissions"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("is_admin") == True, "Admin should have is_admin=True"
        
        perms = data.get("module_permissions", {})
        # Admin should have all permissions
        assert perms.get("assessment") == True, "Admin should have assessment=True"
        assert perms.get("matchmaker") == True, "Admin should have matchmaker=True"
        assert perms.get("drhp") == True, "Admin should have drhp=True"
        assert perms.get("funding") == True, "Admin should have funding=True"
        assert perms.get("valuation") == True, "Admin should have valuation=True"
        
        print(f"✓ Admin user has all permissions: {perms}")


class TestAdminEndpointSecurity:
    """Tests for admin endpoint security"""
    
    @pytest.fixture
    def regular_user_session(self):
        """Login as regular user and return session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": REGULAR_USER_EMAIL, "password": REGULAR_USER_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Regular user login failed: {response.text}")
        return session
    
    def test_regular_user_cannot_access_admin_users(self, regular_user_session):
        """Regular user should not be able to access GET /api/admin/users"""
        response = regular_user_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Regular user correctly denied access to /api/admin/users")
        
    def test_regular_user_cannot_update_permissions(self, regular_user_session):
        """Regular user should not be able to update permissions"""
        response = regular_user_session.put(
            f"{BASE_URL}/api/admin/users/some_user_id/permissions",
            json={"permissions": {"drhp": True}}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Regular user correctly denied access to update permissions")
        
    def test_unauthenticated_cannot_access_admin_endpoints(self):
        """Unauthenticated requests should be denied"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthenticated request correctly denied")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
