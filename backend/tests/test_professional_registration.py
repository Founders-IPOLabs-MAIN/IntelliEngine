"""
Test Professional Registration Module - Matchmaker
Tests: POST /api/matchmaker/professionals, POST /api/matchmaker/professionals/draft, GET /api/matchmaker/professionals/all
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data for different professional categories
TEST_CATEGORIES = [
    "ipo_consultants",
    "merchant_bankers", 
    "chartered_accountants",
    "company_secretaries",
    "legal_tax"
]

# Registration number fields by category
REGISTRATION_FIELDS = {
    "ipo_consultants": {"sebi_registration": "INZ000123456", "pan_entity": "ABCDE1234F"},
    "merchant_bankers": {"sebi_registration": "INM000123456", "pan_entity": "FGHIJ5678K"},
    "chartered_accountants": {"icai_membership": "123456", "pan_entity": "KLMNO9012P"},
    "company_secretaries": {"icsi_membership": "CS12345", "pan_entity": "PQRST3456Q"},
    "legal_tax": {"bar_council_registration": "D/1234/2020", "pan_entity": "UVWXY7890R"}
}

class TestProfessionalRegistration:
    """Test professional registration endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create test user and session via MongoDB
        import subprocess
        result = subprocess.run([
            "mongosh", "--quiet", "--eval", """
            use('test_database');
            var userId = 'test-user-' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            db.users.insertOne({
              user_id: userId,
              email: 'test.user.' + Date.now() + '@example.com',
              name: 'Test User',
              picture: 'https://via.placeholder.com/150',
              role: 'Editor',
              company_id: null,
              created_at: new Date().toISOString()
            });
            db.user_sessions.insertOne({
              session_id: 'sess_' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            print('SESSION_TOKEN=' + sessionToken);
            print('USER_ID=' + userId);
            """
        ], capture_output=True, text=True)
        
        # Parse session token from output
        for line in result.stdout.split('\n'):
            if line.startswith('SESSION_TOKEN='):
                self.session_token = line.split('=')[1]
            if line.startswith('USER_ID='):
                self.user_id = line.split('=')[1]
        
        self.session.headers.update({"Authorization": f"Bearer {self.session_token}"})
        yield
        
        # Cleanup test data
        subprocess.run([
            "mongosh", "--quiet", "--eval", f"""
            use('test_database');
            db.users.deleteMany({{user_id: '{self.user_id}'}});
            db.user_sessions.deleteMany({{session_token: '{self.session_token}'}});
            db.professionals.deleteMany({{user_id: '{self.user_id}'}});
            db.professional_drafts.deleteMany({{user_id: '{self.user_id}'}});
            db.professionals_by_city.deleteMany({{name: /Test Profile/}});
            """
        ], capture_output=True, text=True)
    
    def test_auth_me_endpoint(self):
        """Test that authentication is working"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Auth failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        print(f"✓ Auth working - User: {data.get('name')}")
    
    def test_get_categories(self):
        """Test GET /api/matchmaker/categories"""
        response = self.session.get(f"{BASE_URL}/api/matchmaker/categories")
        assert response.status_code == 200, f"Failed to get categories: {response.text}"
        data = response.json()
        assert len(data) > 0, "No categories returned"
        category_ids = [c['id'] for c in data]
        for cat in TEST_CATEGORIES:
            assert cat in category_ids, f"Category {cat} not found"
        print(f"✓ Categories endpoint working - {len(data)} categories")
    
    def test_get_cities(self):
        """Test GET /api/matchmaker/cities"""
        response = self.session.get(f"{BASE_URL}/api/matchmaker/cities")
        assert response.status_code == 200, f"Failed to get cities: {response.text}"
        data = response.json()
        assert len(data) > 0, "No cities returned"
        assert "Mumbai" in data, "Mumbai not in cities list"
        print(f"✓ Cities endpoint working - {len(data)} cities")
    
    def test_get_expertise_tags(self):
        """Test GET /api/matchmaker/expertise-tags"""
        response = self.session.get(f"{BASE_URL}/api/matchmaker/expertise-tags")
        assert response.status_code == 200, f"Failed to get expertise tags: {response.text}"
        data = response.json()
        assert len(data) > 0, "No expertise tags returned"
        print(f"✓ Expertise tags endpoint working - {len(data)} tags")
    
    def test_save_draft(self):
        """Test POST /api/matchmaker/professionals/draft - Save draft"""
        draft_data = {
            "current_step": 1,
            "data": {
                "category_id": "ipo_consultants",
                "name": "Test Profile 1",
                "agency_name": "Test Agency",
                "email": "test@example.com",
                "mobile": "9876543210"
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals/draft",
            json=draft_data
        )
        assert response.status_code == 200, f"Failed to save draft: {response.text}"
        data = response.json()
        assert "draft_id" in data, "No draft_id in response"
        assert data.get("message") == "Draft created", f"Unexpected message: {data.get('message')}"
        self.draft_id = data["draft_id"]
        print(f"✓ Draft saved - ID: {self.draft_id}")
        return self.draft_id
    
    def test_update_draft(self):
        """Test POST /api/matchmaker/professionals/draft - Update existing draft"""
        # First create a draft
        draft_id = self.test_save_draft()
        
        # Update the draft
        updated_data = {
            "draft_id": draft_id,
            "current_step": 2,
            "data": {
                "category_id": "ipo_consultants",
                "name": "Test Profile 1 Updated",
                "agency_name": "Test Agency Updated",
                "email": "test@example.com",
                "mobile": "9876543210",
                "registration_numbers": {"sebi_registration": "INZ000123456"}
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals/draft",
            json=updated_data
        )
        assert response.status_code == 200, f"Failed to update draft: {response.text}"
        data = response.json()
        assert data.get("message") == "Draft updated", f"Unexpected message: {data.get('message')}"
        print(f"✓ Draft updated successfully")
    
    def test_get_user_draft(self):
        """Test GET /api/matchmaker/professionals/draft - Get user's draft"""
        # First create a draft
        self.test_save_draft()
        
        response = self.session.get(f"{BASE_URL}/api/matchmaker/professionals/draft")
        assert response.status_code == 200, f"Failed to get draft: {response.text}"
        data = response.json()
        assert "draft_id" in data, "No draft_id in response"
        assert data.get("data", {}).get("name") == "Test Profile 1", "Draft data mismatch"
        print(f"✓ Get user draft working")
    
    def test_create_professional_ipo_consultant(self):
        """Test POST /api/matchmaker/professionals - Create IPO Consultant profile"""
        prof_data = {
            "category_id": "ipo_consultants",
            "name": "Test Profile 1 - IPO Consultant",
            "agency_name": "Test Agency",
            "email": "test.ipo@example.com",
            "mobile": "9876543210",
            "locations": ["Mumbai", "Delhi"],
            "years_experience": 5,
            "professional_summary": "Experienced IPO consultant with 5 years of experience",
            "expertise_tags": ["IPO Advisory", "DRHP Preparation", "Due Diligence"],
            "top_3_expertise": ["IPO Advisory", "DRHP Preparation", "Due Diligence"],
            "registration_numbers": REGISTRATION_FIELDS["ipo_consultants"],
            "consent_display": True,
            "consent_marketing": False
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=prof_data
        )
        assert response.status_code == 200, f"Failed to create professional: {response.text}"
        data = response.json()
        assert "professional_id" in data, "No professional_id in response"
        assert data.get("name") == prof_data["name"], "Name mismatch"
        assert data.get("status") == "pending_review", "Status should be pending_review"
        print(f"✓ IPO Consultant profile created - ID: {data['professional_id']}")
        return data["professional_id"]
    
    def test_create_professional_merchant_banker(self):
        """Test POST /api/matchmaker/professionals - Create Merchant Banker profile"""
        prof_data = {
            "category_id": "merchant_bankers",
            "name": "Test Profile 1 - Merchant Banker",
            "agency_name": "Test Investment Bank",
            "email": "test.mb@example.com",
            "mobile": "9876543211",
            "locations": ["Mumbai"],
            "years_experience": 8,
            "professional_summary": "Senior merchant banker specializing in IPOs",
            "expertise_tags": ["Book Building", "Underwriting", "IPO Advisory"],
            "top_3_expertise": ["Book Building", "Underwriting", "IPO Advisory"],
            "registration_numbers": REGISTRATION_FIELDS["merchant_bankers"],
            "consent_display": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=prof_data
        )
        assert response.status_code == 200, f"Failed to create merchant banker: {response.text}"
        data = response.json()
        assert data.get("category_id") == "merchant_bankers"
        print(f"✓ Merchant Banker profile created - ID: {data['professional_id']}")
    
    def test_create_professional_chartered_accountant(self):
        """Test POST /api/matchmaker/professionals - Create CA profile"""
        prof_data = {
            "category_id": "chartered_accountants",
            "name": "Test Profile 1 - CA",
            "agency_name": "Test CA Firm",
            "email": "test.ca@example.com",
            "mobile": "9876543212",
            "locations": ["Delhi", "Bangalore"],
            "years_experience": 10,
            "professional_summary": "Chartered Accountant with IPO audit experience",
            "expertise_tags": ["Financial Audit", "Tax Advisory", "IPO Compliance"],
            "top_3_expertise": ["Financial Audit", "Tax Advisory", "IPO Compliance"],
            "registration_numbers": REGISTRATION_FIELDS["chartered_accountants"],
            "consent_display": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=prof_data
        )
        assert response.status_code == 200, f"Failed to create CA: {response.text}"
        data = response.json()
        assert data.get("category_id") == "chartered_accountants"
        print(f"✓ Chartered Accountant profile created - ID: {data['professional_id']}")
    
    def test_create_professional_company_secretary(self):
        """Test POST /api/matchmaker/professionals - Create CS profile"""
        prof_data = {
            "category_id": "company_secretaries",
            "name": "Test Profile 1 - CS",
            "agency_name": "Test CS Firm",
            "email": "test.cs@example.com",
            "mobile": "9876543213",
            "locations": ["Chennai"],
            "years_experience": 7,
            "professional_summary": "Company Secretary with corporate governance expertise",
            "expertise_tags": ["Corporate Governance", "Compliance", "Board Advisory"],
            "top_3_expertise": ["Corporate Governance", "Compliance", "Board Advisory"],
            "registration_numbers": REGISTRATION_FIELDS["company_secretaries"],
            "consent_display": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=prof_data
        )
        assert response.status_code == 200, f"Failed to create CS: {response.text}"
        data = response.json()
        assert data.get("category_id") == "company_secretaries"
        print(f"✓ Company Secretary profile created - ID: {data['professional_id']}")
    
    def test_create_professional_legal_tax(self):
        """Test POST /api/matchmaker/professionals - Create Legal/Tax profile"""
        prof_data = {
            "category_id": "legal_tax",
            "name": "Test Profile 1 - Legal",
            "agency_name": "Test Law Firm",
            "email": "test.legal@example.com",
            "mobile": "9876543214",
            "locations": ["Mumbai", "Hyderabad"],
            "years_experience": 12,
            "professional_summary": "Corporate lawyer specializing in IPO legal matters",
            "expertise_tags": ["Legal Due Diligence", "Contract Review", "Regulatory Compliance"],
            "top_3_expertise": ["Legal Due Diligence", "Contract Review", "Regulatory Compliance"],
            "registration_numbers": REGISTRATION_FIELDS["legal_tax"],
            "consent_display": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=prof_data
        )
        assert response.status_code == 200, f"Failed to create Legal/Tax: {response.text}"
        data = response.json()
        assert data.get("category_id") == "legal_tax"
        print(f"✓ Legal/Tax profile created - ID: {data['professional_id']}")
    
    def test_get_all_professionals(self):
        """Test GET /api/matchmaker/professionals/all"""
        response = self.session.get(f"{BASE_URL}/api/matchmaker/professionals/all")
        assert response.status_code == 200, f"Failed to get all professionals: {response.text}"
        data = response.json()
        assert "professionals" in data, "No professionals key in response"
        assert "total" in data, "No total key in response"
        print(f"✓ Get all professionals working - Total: {data['total']}")
    
    def test_get_all_professionals_with_category_filter(self):
        """Test GET /api/matchmaker/professionals/all with category filter"""
        response = self.session.get(
            f"{BASE_URL}/api/matchmaker/professionals/all",
            params={"category": "chartered_accountants"}
        )
        assert response.status_code == 200, f"Failed with category filter: {response.text}"
        data = response.json()
        # All returned professionals should be CAs
        for prof in data.get("professionals", []):
            assert prof.get("category_id") == "chartered_accountants", "Category filter not working"
        print(f"✓ Category filter working - Found {len(data.get('professionals', []))} CAs")
    
    def test_get_all_professionals_with_city_filter(self):
        """Test GET /api/matchmaker/professionals/all with city filter"""
        response = self.session.get(
            f"{BASE_URL}/api/matchmaker/professionals/all",
            params={"city": "Mumbai"}
        )
        assert response.status_code == 200, f"Failed with city filter: {response.text}"
        data = response.json()
        # All returned professionals should have Mumbai in locations
        for prof in data.get("professionals", []):
            assert "Mumbai" in prof.get("locations", []), "City filter not working"
        print(f"✓ City filter working - Found {len(data.get('professionals', []))} in Mumbai")
    
    def test_validation_missing_required_fields(self):
        """Test validation - missing required fields"""
        # Missing name
        prof_data = {
            "category_id": "ipo_consultants",
            "email": "test@example.com",
            "mobile": "9876543210"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=prof_data
        )
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing name, got {response.status_code}"
        print(f"✓ Validation working - Missing name rejected")
    
    def test_draft_not_found_for_new_user(self):
        """Test GET /api/matchmaker/professionals/draft returns 404 for new user"""
        # Create a new user without any draft
        import subprocess
        result = subprocess.run([
            "mongosh", "--quiet", "--eval", """
            use('test_database');
            var userId = 'test-user-nodraft-' + Date.now();
            var sessionToken = 'test_session_nodraft_' + Date.now();
            db.users.insertOne({
              user_id: userId,
              email: 'test.nodraft.' + Date.now() + '@example.com',
              name: 'Test User No Draft',
              picture: 'https://via.placeholder.com/150',
              role: 'Editor',
              company_id: null,
              created_at: new Date().toISOString()
            });
            db.user_sessions.insertOne({
              session_id: 'sess_nodraft_' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            print('SESSION_TOKEN=' + sessionToken);
            print('USER_ID=' + userId);
            """
        ], capture_output=True, text=True)
        
        new_session_token = None
        new_user_id = None
        for line in result.stdout.split('\n'):
            if line.startswith('SESSION_TOKEN='):
                new_session_token = line.split('=')[1]
            if line.startswith('USER_ID='):
                new_user_id = line.split('=')[1]
        
        # Make request with new user's token
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/draft",
            headers={"Authorization": f"Bearer {new_session_token}"}
        )
        assert response.status_code == 404, f"Expected 404 for no draft, got {response.status_code}"
        print(f"✓ No draft returns 404 correctly")
        
        # Cleanup
        subprocess.run([
            "mongosh", "--quiet", "--eval", f"""
            use('test_database');
            db.users.deleteMany({{user_id: '{new_user_id}'}});
            db.user_sessions.deleteMany({{session_token: '{new_session_token}'}});
            """
        ], capture_output=True, text=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
