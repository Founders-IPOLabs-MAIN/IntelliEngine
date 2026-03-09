"""
Test suite for Professional Registration and Browse All Professionals features
Tests the following:
1. Browse All Professionals API endpoint
2. Professional Registration form validation
3. Master Admin approval workflow
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session tokens (created via mongosh)
TEST_SESSION = "test_session_1773056919532"
MASTER_SESSION = "master_session_1773057181212"


class TestMatchmakerCategories:
    """Test matchmaker category and metadata endpoints"""
    
    def test_get_categories(self):
        """Test GET /api/matchmaker/categories returns all professional categories"""
        response = requests.get(f"{BASE_URL}/api/matchmaker/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 10  # Should have at least 10 categories
        
        # Check for RTA category specifically
        rta_category = next((c for c in data["categories"] if c["id"] == "rta"), None)
        assert rta_category is not None
        assert rta_category["name"] == "RTA (Registrar & Transfer Agents)"
    
    def test_get_cities(self):
        """Test GET /api/matchmaker/cities returns Indian cities"""
        response = requests.get(f"{BASE_URL}/api/matchmaker/cities")
        assert response.status_code == 200
        
        data = response.json()
        assert "cities" in data
        assert "Mumbai" in data["cities"]
        assert "Delhi" in data["cities"]
        assert "Bangalore" in data["cities"]
    
    def test_get_expertise_tags(self):
        """Test GET /api/matchmaker/expertise-tags returns expertise tags"""
        response = requests.get(f"{BASE_URL}/api/matchmaker/expertise-tags")
        assert response.status_code == 200
        
        data = response.json()
        assert "tags" in data
        assert "SME IPO" in data["tags"]
        assert "Mainboard IPO" in data["tags"]
        assert "SEBI Regulations" in data["tags"]


class TestBrowseAllProfessionals:
    """Test Browse All Professionals endpoint - Bug fix verification"""
    
    def test_browse_all_professionals_returns_list(self):
        """Test GET /api/matchmaker/professionals/all returns professionals list"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/all?page=1&limit=10",
            headers={"Authorization": f"Bearer {TEST_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "professionals" in data
        assert "total" in data
        assert "page" in data
        assert "total_pages" in data
        assert isinstance(data["professionals"], list)
    
    def test_browse_all_with_category_filter(self):
        """Test filtering by category"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/all?category=ipo_consultants",
            headers={"Authorization": f"Bearer {TEST_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # All returned professionals should be IPO consultants
        for prof in data["professionals"]:
            assert prof["category_id"] == "ipo_consultants"
    
    def test_browse_all_with_city_filter(self):
        """Test filtering by city"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/all?city=Mumbai",
            headers={"Authorization": f"Bearer {TEST_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # All returned professionals should have Mumbai in locations
        for prof in data["professionals"]:
            assert "Mumbai" in prof.get("locations", [])
    
    def test_browse_all_pagination(self):
        """Test pagination works correctly"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/all?page=1&limit=2",
            headers={"Authorization": f"Bearer {TEST_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 1
        assert data["limit"] == 2
        assert len(data["professionals"]) <= 2


class TestMatchmakerStatistics:
    """Test matchmaker statistics endpoint"""
    
    def test_get_statistics(self):
        """Test GET /api/matchmaker/statistics returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/statistics",
            headers={"Authorization": f"Bearer {TEST_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "total_professionals" in data
        assert "categories" in data
        assert "unique_cities" in data
        assert data["total_professionals"] >= 0


class TestMasterAdminApproval:
    """Test Master Admin approval workflow"""
    
    def test_get_master_profile(self):
        """Test GET /api/admin/master-profile returns master admin info"""
        response = requests.get(
            f"{BASE_URL}/api/admin/master-profile",
            headers={"Authorization": f"Bearer {MASTER_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "master_admin" in data
        assert data["master_admin"]["email"] == "ronraj2312@gmail.com"
        assert data["is_current_user_master"] == True
    
    def test_get_registration_stats(self):
        """Test GET /api/admin/registration-stats returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/registration-stats",
            headers={"Authorization": f"Bearer {MASTER_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "pending" in data
        assert "approved" in data
        assert "rejected" in data
        assert "needs_resubmission" in data
        assert "total" in data
    
    def test_get_pending_registrations(self):
        """Test GET /api/admin/pending-registrations returns pending list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-registrations?limit=10",
            headers={"Authorization": f"Bearer {MASTER_SESSION}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "registrations" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["registrations"], list)
    
    def test_non_admin_cannot_access_pending_registrations(self):
        """Test that non-admin users cannot access pending registrations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-registrations",
            headers={"Authorization": f"Bearer {TEST_SESSION}"}
        )
        # Should return 403 Forbidden for non-admin users
        assert response.status_code == 403


class TestProfessionalSearch:
    """Test professional search endpoint"""
    
    def test_search_professionals(self):
        """Test GET /api/matchmaker/professionals returns search results"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals?page=1&limit=10"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "professionals" in data
        assert "total" in data
    
    def test_search_with_experience_filter(self):
        """Test filtering by experience"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals?min_experience=10"
        )
        assert response.status_code == 200
        
        data = response.json()
        for prof in data["professionals"]:
            assert prof["years_experience"] >= 10
    
    def test_search_verified_only(self):
        """Test filtering for verified professionals only"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals?verified_only=true"
        )
        assert response.status_code == 200
        
        data = response.json()
        for prof in data["professionals"]:
            assert prof["is_verified"] == True


# Fixtures
@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
