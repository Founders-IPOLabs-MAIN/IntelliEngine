"""
IPO Assessment Module Backend Tests
Tests for POST /api/assessment/calculate, GET /api/assessment/history, GET /api/assessment/{id}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data for assessment
ASSESSMENT_PAYLOAD = {
    "company_info": {
        "company_type": "private_limited",
        "target_board": "mainboard",
        "reporting_unit": "crores"
    },
    "pl_data": {
        "year1_pat": 8,
        "year2_pat": 9,
        "year3_pat": 10,
        "year1_ebitda": 12,
        "year2_ebitda": 14,
        "year3_ebitda": 15,
        "year1_revenue": 80,
        "year2_revenue": 90,
        "year3_revenue": 100
    },
    "balance_sheet": {
        "total_debt": 5,
        "total_cash": 3,
        "net_tangible_assets_y1": 4,
        "net_tangible_assets_y2": 4.5,
        "net_tangible_assets_y3": 5,
        "net_worth_y1": 6,
        "net_worth_y2": 7,
        "net_worth_y3": 8,
        "depreciation": 2,
        "capital_expenditure": 3,
        "working_capital_change": 1
    },
    "projections": {
        "growth_rate": 15,
        "wacc": 12,
        "terminal_growth": 3
    },
    "market_data": {
        "industry_pe": 25,
        "peer_pe": 22
    },
    "issue_type": "fresh",
    "dilution_percent": 25
}


@pytest.fixture(scope="module")
def session_token():
    """Get session token from environment or create test session"""
    return os.environ.get('TEST_SESSION_TOKEN', 'test_session_assessment_1771418172180')


@pytest.fixture(scope="module")
def api_client(session_token):
    """Create API client with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_token}"
    })
    return session


class TestHealthCheck:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAssessmentCalculate:
    """Tests for POST /api/assessment/calculate"""
    
    def test_calculate_assessment_success(self, api_client):
        """Test successful assessment calculation"""
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify assessment_id is returned
        assert "assessment_id" in data
        assert data["assessment_id"].startswith("assess_")
        
        # Verify company_info
        assert "company_info" in data
        assert data["company_info"]["type"] == "private_limited"
        assert data["company_info"]["target_board"] == "mainboard"
        
        # Verify 4 calculators are present
        assert "calculators" in data
        assert "pe_valuation" in data["calculators"]
        assert "dcf_valuation" in data["calculators"]
        assert "fcfe" in data["calculators"]
        assert "issue_size" in data["calculators"]
        
        # Verify P/E Valuation
        pe = data["calculators"]["pe_valuation"]
        assert "valuation" in pe
        assert pe["valuation"] > 0
        assert "formula" in pe
        
        # Verify DCF Valuation
        dcf = data["calculators"]["dcf_valuation"]
        assert "valuation" in dcf
        assert dcf["valuation"] > 0
        assert "fcf_projections" in dcf
        
        # Verify FCFE
        fcfe = data["calculators"]["fcfe"]
        assert "fcfe" in fcfe
        assert "formula" in fcfe
        
        # Verify Issue Size
        issue = data["calculators"]["issue_size"]
        assert "total_issue_size" in issue
        assert issue["dilution_percent"] == 25
        
        # Verify eligibility
        assert "eligibility" in data
        assert data["eligibility"]["board"] == "Mainboard (NSE/BSE)"
        assert "checks" in data["eligibility"]
        assert len(data["eligibility"]["checks"]) == 3
        
        # Verify readiness
        assert "readiness" in data
        assert "status" in data["readiness"]
        assert "score" in data["readiness"]
        assert data["readiness"]["score"] >= 0 and data["readiness"]["score"] <= 100
        
        # Verify valuation_summary
        assert "valuation_summary" in data
        assert "average_valuation" in data["valuation_summary"]
        assert "suggested_price_band" in data["valuation_summary"]
        
        # Verify AI analysis
        assert "ai_analysis" in data
        assert len(data["ai_analysis"]) > 0
        
        # Verify disclaimer
        assert "disclaimer" in data
    
    def test_calculate_assessment_sme_board(self, api_client):
        """Test assessment for SME board"""
        payload = ASSESSMENT_PAYLOAD.copy()
        payload["company_info"] = {
            "company_type": "private_limited",
            "target_board": "sme",
            "reporting_unit": "crores"
        }
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["eligibility"]["board"] == "SME Board (NSE Emerge / BSE SME)"
    
    def test_calculate_assessment_lacs_unit(self, api_client):
        """Test assessment with Lakhs reporting unit"""
        payload = ASSESSMENT_PAYLOAD.copy()
        payload["company_info"] = {
            "company_type": "private_limited",
            "target_board": "mainboard",
            "reporting_unit": "lacs"
        }
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["company_info"]["reporting_unit"] == "lacs"
    
    def test_calculate_assessment_ofs_issue_type(self, api_client):
        """Test assessment with OFS issue type"""
        payload = ASSESSMENT_PAYLOAD.copy()
        payload["issue_type"] = "ofs"
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["calculators"]["issue_size"]["issue_type"] == "ofs"


class TestAssessmentHistory:
    """Tests for GET /api/assessment/history"""
    
    def test_get_assessment_history(self, api_client):
        """Test getting assessment history"""
        response = api_client.get(f"{BASE_URL}/api/assessment/history")
        assert response.status_code == 200
        
        data = response.json()
        assert "assessments" in data
        assert isinstance(data["assessments"], list)
        
        # Verify assessment structure if any exist
        if len(data["assessments"]) > 0:
            assessment = data["assessments"][0]
            assert "assessment_id" in assessment
            assert "company_info" in assessment
            assert "results" in assessment
            assert "created_at" in assessment


class TestAssessmentDetail:
    """Tests for GET /api/assessment/{id}"""
    
    def test_get_assessment_detail(self, api_client):
        """Test getting specific assessment details"""
        # First create an assessment
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        assessment_id = response.json()["assessment_id"]
        
        # Then fetch it
        response = api_client.get(f"{BASE_URL}/api/assessment/{assessment_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["assessment_id"] == assessment_id
        assert "company_info" in data
        assert "results" in data
        assert "ai_analysis" in data
    
    def test_get_nonexistent_assessment(self, api_client):
        """Test getting non-existent assessment returns 404"""
        response = api_client.get(f"{BASE_URL}/api/assessment/assess_nonexistent123")
        assert response.status_code == 404


class TestCalculatorFormulas:
    """Tests to verify calculator formulas are correct"""
    
    def test_pe_valuation_formula(self, api_client):
        """Test P/E Valuation: PAT × P/E Multiple"""
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        
        data = response.json()
        pe = data["calculators"]["pe_valuation"]
        
        # P/E = (Industry P/E + Peer P/E) / 2 = (25 + 22) / 2 = 23.5
        # Valuation = PAT × P/E = 10 × 23.5 = 235
        assert pe["pe_used"] == 23.5
        assert pe["pat_used"] == 10.0
        assert pe["valuation"] == 235.0
    
    def test_fcfe_formula(self, api_client):
        """Test FCFE: PAT + D&A - CapEx - ΔWC"""
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        
        data = response.json()
        fcfe = data["calculators"]["fcfe"]
        
        # FCFE = PAT + Depreciation - CapEx - WC Change
        # FCFE = 10 + 2 - 3 - 1 = 8
        assert fcfe["fcfe"] == 8.0
        assert fcfe["components"]["net_income"] == 10.0
        assert fcfe["components"]["add_depreciation"] == 2.0
        assert fcfe["components"]["less_capex"] == 3.0
        assert fcfe["components"]["less_wc_change"] == 1.0
    
    def test_issue_size_formula(self, api_client):
        """Test Issue Size: Valuation × Dilution %"""
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        
        data = response.json()
        issue = data["calculators"]["issue_size"]
        
        # Issue Size = Post-money Valuation × Dilution %
        assert issue["dilution_percent"] == 25.0
        assert issue["total_issue_size"] > 0


class TestSEBIEligibility:
    """Tests for SEBI eligibility criteria"""
    
    def test_mainboard_eligibility_criteria(self, api_client):
        """Test Mainboard eligibility checks"""
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        
        data = response.json()
        eligibility = data["eligibility"]
        
        assert eligibility["board"] == "Mainboard (NSE/BSE)"
        assert eligibility["total_checks"] == 3
        
        # Verify criteria names
        criteria_names = [check["criterion"] for check in eligibility["checks"]]
        assert any("Net Tangible Assets" in c for c in criteria_names)
        assert any("Operating Profit" in c for c in criteria_names)
        assert any("Net Worth" in c for c in criteria_names)
    
    def test_sme_eligibility_criteria(self, api_client):
        """Test SME board eligibility checks"""
        payload = ASSESSMENT_PAYLOAD.copy()
        payload["company_info"]["target_board"] = "sme"
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        eligibility = data["eligibility"]
        
        assert eligibility["board"] == "SME Board (NSE Emerge / BSE SME)"


class TestReadinessScore:
    """Tests for readiness score calculation"""
    
    def test_readiness_score_range(self, api_client):
        """Test readiness score is within valid range"""
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=ASSESSMENT_PAYLOAD)
        assert response.status_code == 200
        
        data = response.json()
        readiness = data["readiness"]
        
        assert readiness["score"] >= 0
        assert readiness["score"] <= 100
        assert readiness["status"] in ["ready", "planning_required", "not_eligible"]
        assert "status_label" in readiness
        assert "status_message" in readiness


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
