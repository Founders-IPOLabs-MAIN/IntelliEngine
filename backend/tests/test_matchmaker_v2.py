"""
Match-Making Module V2 Backend Tests
Tests for: Wallet, Issuer Registration, Connections, Dashboard endpoints
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "test123"
ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASSWORD = "admin@123"

# Regex patterns from backend
CIN_REGEX = r'^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$'
GSTIN_REGEX = r'^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$'

# Valid test data
VALID_CIN = "U12345MH2020PTC123456"
VALID_GSTIN = "27AABCU9603R1ZM"


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Health endpoint working")
    
    def test_user_login(self):
        """Test regular user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        print(f"✓ User login successful: {data['user'].get('email')}")


class TestWalletEndpoints:
    """Wallet API tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_wallet(self, auth_session):
        """GET /api/matchmaker/wallet returns wallet with credits and tokens"""
        response = auth_session.get(f"{BASE_URL}/api/matchmaker/wallet")
        assert response.status_code == 200
        data = response.json()
        
        # Verify wallet structure
        assert "user_id" in data
        assert "issuer_credits" in data
        assert "expert_tokens" in data
        assert isinstance(data["issuer_credits"], int)
        assert isinstance(data["expert_tokens"], int)
        print(f"✓ Wallet retrieved: {data['issuer_credits']} credits, {data['expert_tokens']} tokens")
    
    def test_wallet_topup_credits(self, auth_session):
        """POST /api/matchmaker/wallet/topup adds credits (MOCKED)"""
        # Get initial balance
        initial = auth_session.get(f"{BASE_URL}/api/matchmaker/wallet").json()
        initial_credits = initial.get("issuer_credits", 0)
        
        # Top up 5 credits
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/wallet/topup", json={
            "type": "issuer_credits",
            "amount": 5
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "wallet" in data
        assert data["wallet"]["issuer_credits"] == initial_credits + 5
        assert "MOCKED" in data.get("message", "")
        print(f"✓ Wallet top-up successful: {initial_credits} -> {data['wallet']['issuer_credits']} credits")
    
    def test_wallet_topup_tokens(self, auth_session):
        """POST /api/matchmaker/wallet/topup adds tokens (MOCKED)"""
        initial = auth_session.get(f"{BASE_URL}/api/matchmaker/wallet").json()
        initial_tokens = initial.get("expert_tokens", 0)
        
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/wallet/topup", json={
            "type": "expert_tokens",
            "amount": 3
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["wallet"]["expert_tokens"] == initial_tokens + 3
        print(f"✓ Token top-up successful: {initial_tokens} -> {data['wallet']['expert_tokens']} tokens")
    
    def test_wallet_topup_invalid_type(self, auth_session):
        """POST /api/matchmaker/wallet/topup rejects invalid type"""
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/wallet/topup", json={
            "type": "invalid_type",
            "amount": 5
        })
        assert response.status_code == 400
        print("✓ Invalid credit type rejected")
    
    def test_wallet_topup_zero_amount(self, auth_session):
        """POST /api/matchmaker/wallet/topup rejects zero/negative amount"""
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/wallet/topup", json={
            "type": "issuer_credits",
            "amount": 0
        })
        assert response.status_code == 400
        print("✓ Zero amount rejected")


class TestIssuerRegistration:
    """Issuer registration API tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_issuer_profile(self, auth_session):
        """GET /api/matchmaker/issuer/profile returns profile or null"""
        response = auth_session.get(f"{BASE_URL}/api/matchmaker/issuer/profile")
        assert response.status_code == 200
        data = response.json()
        
        # Profile can be null for new users or contain profile data
        assert "profile" in data
        if data["profile"]:
            assert "company_name" in data["profile"]
            assert "cin" in data["profile"]
            assert "gstin" in data["profile"]
            print(f"✓ Issuer profile found: {data['profile']['company_name']}")
        else:
            print("✓ No issuer profile (new user)")
    
    def test_cin_regex_validation(self, auth_session):
        """POST /api/matchmaker/issuer/register validates CIN format"""
        # Test with invalid CIN
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/issuer/register", json={
            "company_name": "Test Corp",
            "cin": "INVALID_CIN",
            "gstin": VALID_GSTIN,
            "mobile": "+919876543210",
            "email": "test@testcorp.com",
            "listing_intent": "immediate",
            "contact_persona": "founder",
            "hiring": False
        })
        
        # Should fail with 400 or 409 (if profile exists)
        if response.status_code == 409:
            print("✓ CIN validation skipped (profile already exists)")
        else:
            assert response.status_code == 400
            assert "CIN" in response.json().get("detail", "")
            print("✓ Invalid CIN rejected")
    
    def test_gstin_regex_validation(self, auth_session):
        """POST /api/matchmaker/issuer/register validates GSTIN format"""
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/issuer/register", json={
            "company_name": "Test Corp",
            "cin": VALID_CIN,
            "gstin": "INVALID_GSTIN",
            "mobile": "+919876543210",
            "email": "test@testcorp.com",
            "listing_intent": "immediate",
            "contact_persona": "founder",
            "hiring": False
        })
        
        if response.status_code == 409:
            print("✓ GSTIN validation skipped (profile already exists)")
        else:
            assert response.status_code == 400
            assert "GSTIN" in response.json().get("detail", "")
            print("✓ Invalid GSTIN rejected")
    
    def test_listing_intent_validation(self, auth_session):
        """POST /api/matchmaker/issuer/register validates listing_intent"""
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/issuer/register", json={
            "company_name": "Test Corp",
            "cin": VALID_CIN,
            "gstin": VALID_GSTIN,
            "mobile": "+919876543210",
            "email": "test@testcorp.com",
            "listing_intent": "invalid_intent",
            "contact_persona": "founder",
            "hiring": False
        })
        
        if response.status_code == 409:
            print("✓ Listing intent validation skipped (profile already exists)")
        else:
            assert response.status_code == 400
            assert "listing intent" in response.json().get("detail", "").lower()
            print("✓ Invalid listing intent rejected")
    
    def test_contact_persona_validation(self, auth_session):
        """POST /api/matchmaker/issuer/register validates contact_persona"""
        response = auth_session.post(f"{BASE_URL}/api/matchmaker/issuer/register", json={
            "company_name": "Test Corp",
            "cin": VALID_CIN,
            "gstin": VALID_GSTIN,
            "mobile": "+919876543210",
            "email": "test@testcorp.com",
            "listing_intent": "immediate",
            "contact_persona": "invalid_persona",
            "hiring": False
        })
        
        if response.status_code == 409:
            print("✓ Contact persona validation skipped (profile already exists)")
        else:
            assert response.status_code == 400
            assert "contact persona" in response.json().get("detail", "").lower()
            print("✓ Invalid contact persona rejected")


class TestIssuerDashboard:
    """Issuer dashboard API tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_issuer_dashboard(self, auth_session):
        """GET /api/matchmaker/issuer/dashboard returns stats"""
        response = auth_session.get(f"{BASE_URL}/api/matchmaker/issuer/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "stats" in data
        stats = data["stats"]
        assert "available_credits" in stats
        assert "ipo_readiness_score" in stats
        assert "expert_consultations" in stats
        assert "pending_requests" in stats
        
        print(f"✓ Dashboard stats: credits={stats['available_credits']}, consultations={stats['expert_consultations']}")


class TestExpertDashboard:
    """Expert dashboard API tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_expert_dashboard(self, auth_session):
        """GET /api/matchmaker/expert/dashboard returns stats"""
        response = auth_session.get(f"{BASE_URL}/api/matchmaker/expert/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "stats" in data
        stats = data["stats"]
        assert "available_tokens" in stats
        assert "leads_unlocked" in stats
        assert "active_invitations" in stats
        
        print(f"✓ Expert dashboard: tokens={stats['available_tokens']}, leads={stats['leads_unlocked']}")


class TestConnectionEndpoints:
    """Connection/Handshake API tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_connections(self, auth_session):
        """GET /api/matchmaker/connections returns sent and received"""
        response = auth_session.get(f"{BASE_URL}/api/matchmaker/connections")
        assert response.status_code == 200
        data = response.json()
        
        assert "sent" in data
        assert "received" in data
        assert isinstance(data["sent"], list)
        assert isinstance(data["received"], list)
        
        print(f"✓ Connections: {len(data['sent'])} sent, {len(data['received'])} received")


class TestIssuerLeads:
    """Issuer leads API tests (masked contacts)"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_get_issuer_leads(self, auth_session):
        """GET /api/matchmaker/issuer/leads returns masked contacts"""
        response = auth_session.get(f"{BASE_URL}/api/matchmaker/issuer/leads")
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data
        leads = data["leads"]
        
        if len(leads) > 0:
            lead = leads[0]
            assert "company_name" in lead
            assert "listing_intent" in lead
            assert "mobile" in lead
            assert "email" in lead
            assert "unlocked" in lead
            
            # Check masking for non-unlocked leads
            if not lead.get("unlocked"):
                assert "****" in lead["mobile"] or len(lead["mobile"]) < 5
                assert "****" in lead["email"]
                print(f"✓ Lead masking verified: {lead['email']}")
            else:
                print(f"✓ Lead unlocked: {lead['email']}")
        else:
            print("✓ No leads found (empty list)")


class TestRegexPatterns:
    """Test CIN and GSTIN regex patterns"""
    
    def test_valid_cin_patterns(self):
        """Test valid CIN formats"""
        valid_cins = [
            "U12345MH2020PTC123456",
            "L67890DL2015PLC987654",
            "U00000KA2010ABC000001"
        ]
        for cin in valid_cins:
            assert re.match(CIN_REGEX, cin), f"Valid CIN {cin} should match"
        print("✓ Valid CIN patterns match")
    
    def test_invalid_cin_patterns(self):
        """Test invalid CIN formats"""
        invalid_cins = [
            "INVALID",
            "12345MH2020PTC123456",  # Missing U/L prefix
            "U1234MH2020PTC123456",   # Wrong digit count
            "u12345MH2020PTC123456"   # Lowercase
        ]
        for cin in invalid_cins:
            assert not re.match(CIN_REGEX, cin), f"Invalid CIN {cin} should not match"
        print("✓ Invalid CIN patterns rejected")
    
    def test_valid_gstin_patterns(self):
        """Test valid GSTIN formats"""
        valid_gstins = [
            "27AABCU9603R1ZM",
            "29AABCT1332L1ZL",
            "07AAACN0749P1Z5"
        ]
        for gstin in valid_gstins:
            assert re.match(GSTIN_REGEX, gstin), f"Valid GSTIN {gstin} should match"
        print("✓ Valid GSTIN patterns match")
    
    def test_invalid_gstin_patterns(self):
        """Test invalid GSTIN formats"""
        invalid_gstins = [
            "INVALID",
            "27AABCU9603R1Z",    # Too short
            "27aabcu9603r1zm",   # Lowercase
            "2AABCU9603R1ZM"     # Wrong state code
        ]
        for gstin in invalid_gstins:
            assert not re.match(GSTIN_REGEX, gstin), f"Invalid GSTIN {gstin} should not match"
        print("✓ Invalid GSTIN patterns rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
