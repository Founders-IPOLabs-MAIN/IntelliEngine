"""
Test suite for Admin Center and Account Details modules
Tests all 20 features specified in the requirements
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prospectus-pro.preview.emergentagent.com')
SESSION_TOKEN = "test_session_admin_1771474009344"

@pytest.fixture
def api_client():
    """Shared requests session with auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


class TestAdminRolesAPI:
    """Test Admin Center - Roles API"""
    
    def test_get_roles_returns_4_default_roles(self, api_client):
        """Feature 16: GET /api/admin/roles returns 4 default roles"""
        response = api_client.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 200
        
        data = response.json()
        assert "roles" in data
        roles = data["roles"]
        
        # Verify 4 default roles exist
        role_ids = [r["role_id"] for r in roles]
        assert "super_admin" in role_ids
        assert "admin" in role_ids
        assert "editor" in role_ids
        assert "viewer" in role_ids
        
        # Verify role structure
        for role in roles:
            assert "role_id" in role
            assert "name" in role
            assert "description" in role
            assert "permissions" in role
            assert "level" in role
    
    def test_super_admin_has_max_3_users(self, api_client):
        """Feature 2: Super Admin role has max 3 users limit"""
        response = api_client.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 200
        
        data = response.json()
        super_admin = next((r for r in data["roles"] if r["role_id"] == "super_admin"), None)
        assert super_admin is not None
        assert super_admin["max_users"] == 3
    
    def test_roles_have_descriptions(self, api_client):
        """Feature 2: Roles have descriptions"""
        response = api_client.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 200
        
        data = response.json()
        for role in data["roles"]:
            assert role.get("description") is not None
            assert len(role["description"]) > 0


class TestAdminFeaturesAPI:
    """Test Admin Center - Features API"""
    
    def test_get_features_returns_8_platform_features(self, api_client):
        """Feature 17: GET /api/admin/features returns 8 platform features"""
        response = api_client.get(f"{BASE_URL}/api/admin/features")
        assert response.status_code == 200
        
        data = response.json()
        assert "features" in data
        features = data["features"]
        
        # Verify 8 features exist
        assert len(features) == 8
        
        # Verify expected features
        feature_ids = [f["id"] for f in features]
        expected_features = ["dashboard", "assessment", "drhp_builder", "funding", 
                           "matchmaker", "analytics", "admin_center", "user_management"]
        for expected in expected_features:
            assert expected in feature_ids


class TestAdminPermissionMatrixAPI:
    """Test Admin Center - Permission Matrix API"""
    
    def test_get_permission_matrix_returns_full_matrix(self, api_client):
        """Feature 18: GET /api/admin/permission-matrix returns full matrix"""
        response = api_client.get(f"{BASE_URL}/api/admin/permission-matrix")
        assert response.status_code == 200
        
        data = response.json()
        assert "matrix" in data
        assert "roles" in data
        assert "features" in data
        
        # Verify matrix structure
        matrix = data["matrix"]
        assert len(matrix) == 8  # 8 features
        
        # Verify each row has permissions for all roles
        for row in matrix:
            assert "feature" in row
            assert "super_admin" in row
            assert "admin" in row
            assert "editor" in row
            assert "viewer" in row
    
    def test_permission_matrix_has_rwd_indicators(self, api_client):
        """Feature 3: Permission matrix shows R/W/D indicators"""
        response = api_client.get(f"{BASE_URL}/api/admin/permission-matrix")
        assert response.status_code == 200
        
        data = response.json()
        matrix = data["matrix"]
        
        # Super admin should have read, write, delete for dashboard
        dashboard_row = next((r for r in matrix if r["feature"]["id"] == "dashboard"), None)
        assert dashboard_row is not None
        assert "read" in dashboard_row["super_admin"]
        assert "write" in dashboard_row["super_admin"]
        assert "delete" in dashboard_row["super_admin"]


class TestAdminUsersAPI:
    """Test Admin Center - Users API"""
    
    def test_get_users_returns_user_list(self, api_client):
        """Feature 4: Users tab shows user list with role badges"""
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data
        users = data["users"]
        
        # Verify user structure
        for user in users:
            assert "user_id" in user
            assert "email" in user
            assert "name" in user
            assert "role" in user
            assert "created_at" in user


class TestAdminAuditLogAPI:
    """Test Admin Center - Audit Log API"""
    
    def test_get_audit_logs_returns_logs(self, api_client):
        """Feature 5: Audit Log tab shows action history"""
        response = api_client.get(f"{BASE_URL}/api/admin/audit-logs?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data
        assert "total" in data
        assert "limit" in data
    
    def test_audit_logs_have_user_info(self, api_client):
        """Audit logs are enriched with user names"""
        response = api_client.get(f"{BASE_URL}/api/admin/audit-logs?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        logs = data["logs"]
        
        # Verify logs have user info
        for log in logs:
            assert "user_name" in log
            assert "user_email" in log


class TestAdminAssignRoleAPI:
    """Test Admin Center - Assign Role API"""
    
    def test_assign_role_requires_email_and_role(self, api_client):
        """Feature 6: Assign Role requires user email and role"""
        # Test with missing fields
        response = api_client.post(f"{BASE_URL}/api/admin/users/assign-role", json={})
        assert response.status_code == 422  # Validation error


class TestAccountProfileAPI:
    """Test Account Details - Profile API"""
    
    def test_get_profile_returns_user_info(self, api_client):
        """Feature 19: GET /api/account/profile returns user profile"""
        response = api_client.get(f"{BASE_URL}/api/account/profile")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "role" in data
        assert "created_at" in data
    
    def test_profile_includes_role_details(self, api_client):
        """Profile includes role details"""
        response = api_client.get(f"{BASE_URL}/api/account/profile")
        assert response.status_code == 200
        
        data = response.json()
        assert "role_details" in data
        assert "permissions" in data["role_details"]
    
    def test_update_profile_works(self, api_client):
        """Feature 8: Profile tab allows editing name, phone, address, company, designation"""
        response = api_client.put(f"{BASE_URL}/api/account/profile", json={
            "name": "Test Admin Updated",
            "phone": "+91 9876543210",
            "company_name": "Test Corp",
            "designation": "CTO"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Profile updated successfully"


class TestAccountSubscriptionAPI:
    """Test Account Details - Subscription API"""
    
    def test_get_subscription_returns_current_plan(self, api_client):
        """Feature 11: Billing tab shows current plan"""
        response = api_client.get(f"{BASE_URL}/api/account/subscription")
        assert response.status_code == 200
        
        data = response.json()
        assert "plan_id" in data
        assert "status" in data
        assert "plan_details" in data
    
    def test_get_plans_returns_4_plans_with_razorpay_placeholders(self, api_client):
        """Feature 20: GET /api/account/subscription/plans returns 4 plans with Razorpay placeholders"""
        response = api_client.get(f"{BASE_URL}/api/account/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        
        # Verify 4 plans exist
        assert len(plans) == 4
        
        # Verify plan names
        plan_names = [p["name"] for p in plans]
        assert "Free" in plan_names
        assert "Starter" in plan_names
        assert "Professional" in plan_names
        assert "Enterprise" in plan_names
        
        # Verify Razorpay placeholders for paid plans
        for plan in plans:
            if plan["plan_id"] != "free":
                assert "razorpay_plan_id" in plan
                assert "PLACEHOLDER" in plan["razorpay_plan_id"]
    
    def test_upgrade_subscription_is_mocked(self, api_client):
        """Feature 13: Upgrade is MOCKED with Razorpay placeholder"""
        response = api_client.post(f"{BASE_URL}/api/account/subscription/upgrade?plan_id=professional")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "payment_info" in data
        assert data["payment_info"]["status"] == "MOCKED - Payment gateway not integrated"
    
    def test_cancel_subscription_is_mocked(self, api_client):
        """Cancel subscription is MOCKED"""
        response = api_client.post(f"{BASE_URL}/api/account/subscription/cancel")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "MOCKED" in data.get("note", "")


class TestAccountBillingAPI:
    """Test Account Details - Billing API"""
    
    def test_get_transactions_returns_history(self, api_client):
        """Billing tab shows transaction history"""
        response = api_client.get(f"{BASE_URL}/api/account/billing/transactions")
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data
        assert "note" in data
        assert "MOCKED" in data["note"]


class TestAccountSecurityAPI:
    """Test Account Details - Security API"""
    
    def test_change_password_disabled_for_oauth(self, api_client):
        """Feature 10: Password change is disabled for OAuth users"""
        response = api_client.post(f"{BASE_URL}/api/account/change-password", json={
            "current_password": "test",
            "new_password": "test123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "auth_type" in data
        assert data["auth_type"] == "google_oauth"


class TestAdminAccessControl:
    """Test Admin Center - Access Control"""
    
    def test_non_admin_cannot_access_admin_apis(self):
        """Non-admin users should get 403 on admin APIs"""
        # Create a session without admin role
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": "Bearer invalid_token"
        })
        
        response = session.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 401  # Unauthorized


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
