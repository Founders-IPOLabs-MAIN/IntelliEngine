"""
IPO Funding Module Backend Tests
Tests for Pre-IPO, Post-IPO funding options, Partners, Quiz, and Consultation booking APIs
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token created via mongosh
SESSION_TOKEN = "test_session_funding_1771398766519"

@pytest.fixture
def api_client():
    """Shared requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


class TestFundingPreIPOOptions:
    """Tests for Pre-IPO Funding Options API"""
    
    def test_get_pre_ipo_options_returns_200(self, api_client):
        """Test GET /api/funding/pre-ipo-options returns 200"""
        response = api_client.get(f"{BASE_URL}/api/funding/pre-ipo-options")
        assert response.status_code == 200
        
    def test_get_pre_ipo_options_returns_6_options(self, api_client):
        """Test GET /api/funding/pre-ipo-options returns exactly 6 options"""
        response = api_client.get(f"{BASE_URL}/api/funding/pre-ipo-options")
        data = response.json()
        assert "options" in data
        assert len(data["options"]) == 6
        
    def test_pre_ipo_options_have_required_fields(self, api_client):
        """Test each Pre-IPO option has required fields"""
        response = api_client.get(f"{BASE_URL}/api/funding/pre-ipo-options")
        data = response.json()
        required_fields = ["id", "name", "description", "long_description", "typical_amount", "timeline", "icon"]
        for option in data["options"]:
            for field in required_fields:
                assert field in option, f"Missing field: {field} in option {option.get('id')}"
                
    def test_pre_ipo_options_include_angel_seed(self, api_client):
        """Test Pre-IPO options include Angel & Seed Investment"""
        response = api_client.get(f"{BASE_URL}/api/funding/pre-ipo-options")
        data = response.json()
        option_ids = [opt["id"] for opt in data["options"]]
        assert "angel_seed" in option_ids
        
    def test_pre_ipo_options_include_venture_capital(self, api_client):
        """Test Pre-IPO options include Venture Capital"""
        response = api_client.get(f"{BASE_URL}/api/funding/pre-ipo-options")
        data = response.json()
        option_ids = [opt["id"] for opt in data["options"]]
        assert "venture_capital" in option_ids


class TestFundingPostIPOOptions:
    """Tests for Post-IPO Funding Options API"""
    
    def test_get_post_ipo_options_returns_200(self, api_client):
        """Test GET /api/funding/post-ipo-options returns 200"""
        response = api_client.get(f"{BASE_URL}/api/funding/post-ipo-options")
        assert response.status_code == 200
        
    def test_get_post_ipo_options_returns_5_options(self, api_client):
        """Test GET /api/funding/post-ipo-options returns exactly 5 options"""
        response = api_client.get(f"{BASE_URL}/api/funding/post-ipo-options")
        data = response.json()
        assert "options" in data
        assert len(data["options"]) == 5
        
    def test_post_ipo_options_have_required_fields(self, api_client):
        """Test each Post-IPO option has required fields"""
        response = api_client.get(f"{BASE_URL}/api/funding/post-ipo-options")
        data = response.json()
        required_fields = ["id", "name", "description", "long_description", "typical_amount", "timeline", "icon"]
        for option in data["options"]:
            for field in required_fields:
                assert field in option, f"Missing field: {field} in option {option.get('id')}"
                
    def test_post_ipo_options_include_fpo(self, api_client):
        """Test Post-IPO options include FPO"""
        response = api_client.get(f"{BASE_URL}/api/funding/post-ipo-options")
        data = response.json()
        option_ids = [opt["id"] for opt in data["options"]]
        assert "fpo" in option_ids
        
    def test_post_ipo_options_include_qip(self, api_client):
        """Test Post-IPO options include QIP"""
        response = api_client.get(f"{BASE_URL}/api/funding/post-ipo-options")
        data = response.json()
        option_ids = [opt["id"] for opt in data["options"]]
        assert "qip" in option_ids


class TestFundingPartners:
    """Tests for Funding Partners API"""
    
    def test_get_partners_returns_200(self, api_client):
        """Test GET /api/funding/partners returns 200"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        assert response.status_code == 200
        
    def test_get_partners_returns_4_categories(self, api_client):
        """Test GET /api/funding/partners returns all 4 partner categories"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        data = response.json()
        assert "partners" in data
        expected_categories = ["investment_banks", "hni_networks", "sovereign_wealth_funds", "banks"]
        for category in expected_categories:
            assert category in data["partners"], f"Missing category: {category}"
            
    def test_partners_include_kotak_mahindra(self, api_client):
        """Test partners include Kotak Mahindra Capital"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        data = response.json()
        investment_banks = data["partners"]["investment_banks"]
        names = [bank["name"] for bank in investment_banks]
        assert "Kotak Mahindra Capital" in names
        
    def test_partners_include_icici_securities(self, api_client):
        """Test partners include ICICI Securities"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        data = response.json()
        investment_banks = data["partners"]["investment_banks"]
        names = [bank["name"] for bank in investment_banks]
        assert "ICICI Securities" in names
        
    def test_partners_include_indian_angel_network(self, api_client):
        """Test partners include Indian Angel Network"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        data = response.json()
        hni_networks = data["partners"]["hni_networks"]
        names = [network["name"] for network in hni_networks]
        assert "Indian Angel Network (IAN)" in names
        
    def test_partners_include_sbi(self, api_client):
        """Test partners include State Bank of India"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        data = response.json()
        banks = data["partners"]["banks"]
        names = [bank["name"] for bank in banks]
        assert "State Bank of India" in names
        
    def test_partners_include_adia(self, api_client):
        """Test partners include ADIA sovereign wealth fund"""
        response = api_client.get(f"{BASE_URL}/api/funding/partners")
        data = response.json()
        swf = data["partners"]["sovereign_wealth_funds"]
        names = [fund["name"] for fund in swf]
        assert "Abu Dhabi Investment Authority (ADIA)" in names


class TestFundingQuiz:
    """Tests for Funding Quiz API"""
    
    def test_get_quiz_questions_pre_ipo_returns_200(self, api_client):
        """Test GET /api/funding/quiz-questions?funding_type=pre_ipo returns 200"""
        response = api_client.get(f"{BASE_URL}/api/funding/quiz-questions?funding_type=pre_ipo")
        assert response.status_code == 200
        
    def test_get_quiz_questions_post_ipo_returns_200(self, api_client):
        """Test GET /api/funding/quiz-questions?funding_type=post_ipo returns 200"""
        response = api_client.get(f"{BASE_URL}/api/funding/quiz-questions?funding_type=post_ipo")
        assert response.status_code == 200
        
    def test_quiz_questions_have_required_fields(self, api_client):
        """Test quiz questions have required fields"""
        response = api_client.get(f"{BASE_URL}/api/funding/quiz-questions?funding_type=pre_ipo")
        data = response.json()
        assert "questions" in data
        for question in data["questions"]:
            assert "id" in question
            assert "question" in question
            assert "options" in question
            
    def test_quiz_questions_options_have_score(self, api_client):
        """Test quiz question options have score field"""
        response = api_client.get(f"{BASE_URL}/api/funding/quiz-questions?funding_type=pre_ipo")
        data = response.json()
        for question in data["questions"]:
            for option in question["options"]:
                assert "value" in option
                assert "label" in option
                assert "score" in option


class TestFundingAvailableSlots:
    """Tests for Available Slots API (MOCKED)"""
    
    def test_get_available_slots_returns_200(self, api_client):
        """Test GET /api/funding/available-slots returns 200"""
        response = api_client.get(f"{BASE_URL}/api/funding/available-slots?date=2026-02-20")
        assert response.status_code == 200
        
    def test_available_slots_returns_slots_array(self, api_client):
        """Test available slots returns array of time slots"""
        response = api_client.get(f"{BASE_URL}/api/funding/available-slots?date=2026-02-20")
        data = response.json()
        assert "available_slots" in data
        assert isinstance(data["available_slots"], list)
        assert len(data["available_slots"]) > 0


class TestFundingDisclaimerConsent:
    """Tests for Disclaimer Consent API"""
    
    def test_post_disclaimer_consent_returns_200(self, api_client):
        """Test POST /api/funding/disclaimer-consent returns 200"""
        response = api_client.post(f"{BASE_URL}/api/funding/disclaimer-consent", json={
            "agreed": True,
            "timestamp": datetime.now().isoformat(),
            "user_id": "test-user-funding-1771398766519"
        })
        assert response.status_code == 200
        
    def test_disclaimer_consent_returns_consent_id(self, api_client):
        """Test disclaimer consent returns consent_id"""
        response = api_client.post(f"{BASE_URL}/api/funding/disclaimer-consent", json={
            "agreed": True,
            "timestamp": datetime.now().isoformat(),
            "user_id": "test-user-funding-1771398766519"
        })
        data = response.json()
        assert "consent_id" in data


class TestFundingAIFitment:
    """Tests for AI Fitment Calculator API"""
    
    def test_post_ai_fitment_returns_200(self, api_client):
        """Test POST /api/funding/ai-fitment returns 200"""
        response = api_client.post(f"{BASE_URL}/api/funding/ai-fitment", json={
            "funding_option_id": "angel_seed",
            "funding_type": "pre_ipo",
            "annual_revenue": "5_25cr",
            "current_debt": "low",
            "funding_goal": "working_capital"
        })
        assert response.status_code == 200
        
    def test_ai_fitment_returns_probability_score(self, api_client):
        """Test AI fitment returns probability score"""
        response = api_client.post(f"{BASE_URL}/api/funding/ai-fitment", json={
            "funding_option_id": "venture_capital",
            "funding_type": "pre_ipo",
            "annual_revenue": "25_100cr",
            "current_debt": "no_debt",
            "funding_goal": "expansion"
        })
        data = response.json()
        assert "probability_score" in data
        assert isinstance(data["probability_score"], (int, float))


class TestFundingBookConsultation:
    """Tests for Book Consultation API"""
    
    def test_post_book_consultation_returns_200(self, api_client):
        """Test POST /api/funding/book-consultation returns 200"""
        response = api_client.post(f"{BASE_URL}/api/funding/book-consultation", json={
            "funding_type": "pre_ipo",
            "funding_option_id": "angel_seed",
            "preferred_date": "2026-02-25",
            "preferred_time": "10:00 AM",
            "company_name": "Test Company Ltd",
            "contact_name": "Test User",
            "contact_email": "test@example.com",
            "contact_phone": "+91 9876543210",
            "notes": "Test consultation booking"
        })
        assert response.status_code == 200
        
    def test_book_consultation_returns_consultation_id(self, api_client):
        """Test book consultation returns consultation_id"""
        response = api_client.post(f"{BASE_URL}/api/funding/book-consultation", json={
            "funding_type": "post_ipo",
            "funding_option_id": "qip",
            "preferred_date": "2026-02-26",
            "preferred_time": "02:00 PM",
            "company_name": "Test Corp",
            "contact_name": "Test User",
            "contact_email": "test@example.com",
            "contact_phone": "+91 9876543210"
        })
        data = response.json()
        assert "consultation_id" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
