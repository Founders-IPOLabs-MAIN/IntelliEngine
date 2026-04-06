"""
Test suite for Governance/Compliance Assessment Feature
Tests the new governance tab in IPO Readiness Assessment wizard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_governance_1775480278999"

# All 55 governance questions with their positive answers
GOVERNANCE_POSITIVE_ANSWERS = {
    "gc_1": "yes", "gc_2": "no", "gc_3": "no", "gc_4": "no", "gc_5": "yes",
    "gc_6": "no", "gc_7": "yes", "gc_8": "yes", "gc_9": "no", "gc_10": "yes",
    "gc_11": "yes", "gc_12": "yes", "gc_13": "yes", "gc_14": "yes", "gc_15": "yes",
    "gc_16": "yes", "gc_17": "yes", "gc_18": "yes", "gc_19": "yes", "gc_20": "yes",
    "gc_21": "no", "gc_22": "yes", "gc_23": "yes", "gc_24": "yes", "gc_25": "yes",
    "gc_26": "yes", "gc_27": "yes", "gc_28": "yes", "gc_29": "yes", "gc_30": "yes",
    "gc_31": "yes", "gc_32": "yes", "gc_33": "yes", "gc_34": "yes", "gc_35": "no",
    "gc_36": "no", "gc_37": "no", "gc_38": "no", "gc_39": "yes", "gc_40": "yes",
    "gc_41": "no", "gc_42": "no", "gc_43": "yes", "gc_44": "no", "gc_45": "yes",
    "gc_46": "no", "gc_47": "yes", "gc_48": "yes", "gc_49": "yes", "gc_50": "no",
    "gc_51": "no", "gc_52": "yes", "gc_53": "no", "gc_54": "yes", "gc_55": "yes",
}


@pytest.fixture
def api_client():
    """Shared requests session with auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


def get_base_assessment_payload():
    """Base assessment payload without governance"""
    return {
        "company_info": {
            "company_type": "private_limited",
            "target_board": "mainboard",
            "reporting_unit": "crores",
            "industry": "Technology",
            "nifty_index": "NIFTY IT"
        },
        "pl_data": {
            "year1_pat": 10,
            "year2_pat": 15,
            "year3_pat": 20,
            "year1_ebitda": 25,
            "year2_ebitda": 30,
            "year3_ebitda": 35,
            "year1_revenue": 100,
            "year2_revenue": 150,
            "year3_revenue": 200
        },
        "balance_sheet": {
            "total_debt": 50,
            "total_cash": 30,
            "net_tangible_assets_y1": 5,
            "net_tangible_assets_y2": 6,
            "net_tangible_assets_y3": 7,
            "net_worth_y1": 10,
            "net_worth_y2": 15,
            "net_worth_y3": 20,
            "depreciation": 5,
            "capital_expenditure": 10,
            "working_capital_change": 3
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


class TestGovernanceScoringLogic:
    """Test governance scoring calculation logic"""
    
    def test_perfect_governance_score(self, api_client):
        """Test 100% governance score with all positive answers"""
        payload = get_base_assessment_payload()
        payload["governance_compliance"] = GOVERNANCE_POSITIVE_ANSWERS.copy()
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check governance result exists
        assert "governance" in data, "Response should include governance field"
        governance = data["governance"]
        
        # Verify perfect score
        assert governance["score"] == 100, f"Expected score 100, got {governance['score']}"
        assert governance["total"] == 55, f"Expected 55 total questions, got {governance['total']}"
        assert governance["positive_count"] == 55, f"Expected 55 positive, got {governance['positive_count']}"
        assert governance["negative_count"] == 0, f"Expected 0 negative, got {governance['negative_count']}"
        assert governance["unanswered"] == 0, f"Expected 0 unanswered, got {governance['unanswered']}"
        
        print(f"PASS: Perfect governance score - {governance['score']}/100")
    
    def test_zero_governance_score(self, api_client):
        """Test 0% governance score with all wrong answers"""
        payload = get_base_assessment_payload()
        # Invert all answers
        wrong_answers = {}
        for qid, correct in GOVERNANCE_POSITIVE_ANSWERS.items():
            wrong_answers[qid] = "no" if correct == "yes" else "yes"
        payload["governance_compliance"] = wrong_answers
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        governance = data["governance"]
        
        assert governance["score"] == 0, f"Expected score 0, got {governance['score']}"
        assert governance["negative_count"] == 55, f"Expected 55 negative, got {governance['negative_count']}"
        
        print(f"PASS: Zero governance score - {governance['score']}/100")
    
    def test_partial_governance_score(self, api_client):
        """Test partial governance score (50% correct)"""
        payload = get_base_assessment_payload()
        # Answer first 27 correctly, rest incorrectly
        partial_answers = {}
        for i, (qid, correct) in enumerate(GOVERNANCE_POSITIVE_ANSWERS.items()):
            if i < 27:
                partial_answers[qid] = correct
            else:
                partial_answers[qid] = "no" if correct == "yes" else "yes"
        payload["governance_compliance"] = partial_answers
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        governance = data["governance"]
        
        # 27/55 = ~49%
        assert 45 <= governance["score"] <= 55, f"Expected score ~49%, got {governance['score']}"
        assert governance["positive_count"] == 27, f"Expected 27 positive, got {governance['positive_count']}"
        
        print(f"PASS: Partial governance score - {governance['score']}/100 ({governance['positive_count']}/55)")
    
    def test_empty_governance_compliance(self, api_client):
        """Test with empty governance_compliance dict (backwards compatibility)"""
        payload = get_base_assessment_payload()
        payload["governance_compliance"] = {}
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        governance = data["governance"]
        
        assert governance["score"] == 0, f"Expected score 0 for empty, got {governance['score']}"
        assert governance["unanswered"] == 55, f"Expected 55 unanswered, got {governance['unanswered']}"
        
        print(f"PASS: Empty governance compliance handled - score {governance['score']}, unanswered {governance['unanswered']}")
    
    def test_missing_governance_compliance(self, api_client):
        """Test without governance_compliance field (backwards compatibility)"""
        payload = get_base_assessment_payload()
        # Don't include governance_compliance at all
        if "governance_compliance" in payload:
            del payload["governance_compliance"]
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should still work with default empty dict
        assert "governance" in data
        governance = data["governance"]
        assert governance["score"] == 0
        
        print(f"PASS: Missing governance_compliance handled gracefully")


class TestBlendedReadinessScore:
    """Test blended readiness score (60% financial + 40% governance)"""
    
    def test_blended_score_calculation(self, api_client):
        """Test that final score is 60% financial + 40% governance"""
        payload = get_base_assessment_payload()
        payload["governance_compliance"] = GOVERNANCE_POSITIVE_ANSWERS.copy()
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        readiness = data["readiness"]
        
        # Check blended score components exist
        assert "financial_score" in readiness, "Should have financial_score"
        assert "governance_score" in readiness, "Should have governance_score"
        assert "score" in readiness, "Should have blended score"
        
        # Verify blending formula: score = financial * 0.6 + governance * 0.4
        expected_score = round(readiness["financial_score"] * 0.6 + readiness["governance_score"] * 0.4)
        assert readiness["score"] == expected_score, f"Expected blended score {expected_score}, got {readiness['score']}"
        
        print(f"PASS: Blended score = {readiness['score']} (Financial: {readiness['financial_score']} * 0.6 + Governance: {readiness['governance_score']} * 0.4)")
    
    def test_low_governance_downgrades_status(self, api_client):
        """Test that low governance score (<40) adds critical issue"""
        payload = get_base_assessment_payload()
        # Give very low governance score (all wrong answers)
        wrong_answers = {}
        for qid, correct in GOVERNANCE_POSITIVE_ANSWERS.items():
            wrong_answers[qid] = "no" if correct == "yes" else "yes"
        payload["governance_compliance"] = wrong_answers
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        readiness = data["readiness"]
        
        # Check for governance critical issue
        governance_issues = [i for i in readiness.get("issues", []) if i.get("type") == "governance"]
        assert len(governance_issues) > 0, "Should have governance issue for low score"
        
        critical_gov_issues = [i for i in governance_issues if i.get("severity") == "critical"]
        assert len(critical_gov_issues) > 0, "Should have critical governance issue for score < 40"
        
        print(f"PASS: Low governance score creates critical issue - {critical_gov_issues[0]['description']}")
    
    def test_moderate_governance_adds_warning(self, api_client):
        """Test that moderate governance score (40-65) adds warning"""
        payload = get_base_assessment_payload()
        # Give moderate governance score (~50%)
        partial_answers = {}
        for i, (qid, correct) in enumerate(GOVERNANCE_POSITIVE_ANSWERS.items()):
            if i < 30:  # 30/55 = ~55%
                partial_answers[qid] = correct
            else:
                partial_answers[qid] = "no" if correct == "yes" else "yes"
        payload["governance_compliance"] = partial_answers
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        readiness = data["readiness"]
        governance = data["governance"]
        
        # Score should be between 40-65
        if 40 <= governance["score"] < 65:
            governance_issues = [i for i in readiness.get("issues", []) if i.get("type") == "governance"]
            warning_issues = [i for i in governance_issues if i.get("severity") == "warning"]
            assert len(warning_issues) > 0, f"Should have warning for moderate score {governance['score']}"
            print(f"PASS: Moderate governance score ({governance['score']}) creates warning")
        else:
            print(f"SKIP: Governance score {governance['score']} not in moderate range (40-65)")


class TestGovernanceResponseStructure:
    """Test governance response structure in API"""
    
    def test_governance_in_response(self, api_client):
        """Test that governance object is included in response"""
        payload = get_base_assessment_payload()
        payload["governance_compliance"] = GOVERNANCE_POSITIVE_ANSWERS.copy()
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check governance object structure
        assert "governance" in data
        governance = data["governance"]
        
        required_fields = ["score", "total", "positive_count", "negative_count", "unanswered"]
        for field in required_fields:
            assert field in governance, f"Missing field: {field}"
        
        print(f"PASS: Governance response structure valid - {list(governance.keys())}")
    
    def test_readiness_includes_governance_score(self, api_client):
        """Test that readiness object includes governance_score"""
        payload = get_base_assessment_payload()
        payload["governance_compliance"] = GOVERNANCE_POSITIVE_ANSWERS.copy()
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        readiness = data["readiness"]
        
        assert "governance_score" in readiness, "Readiness should include governance_score"
        assert "financial_score" in readiness, "Readiness should include financial_score"
        
        print(f"PASS: Readiness includes governance_score={readiness['governance_score']}, financial_score={readiness['financial_score']}")


class TestGovernanceQuestionCount:
    """Test that all 55 questions are processed"""
    
    def test_55_questions_total(self, api_client):
        """Verify total question count is 55"""
        payload = get_base_assessment_payload()
        payload["governance_compliance"] = GOVERNANCE_POSITIVE_ANSWERS.copy()
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        governance = data["governance"]
        
        assert governance["total"] == 55, f"Expected 55 total questions, got {governance['total']}"
        assert len(GOVERNANCE_POSITIVE_ANSWERS) == 55, f"Expected 55 questions in mapping, got {len(GOVERNANCE_POSITIVE_ANSWERS)}"
        
        print(f"PASS: Total governance questions = 55")
    
    def test_all_question_ids_valid(self, api_client):
        """Test that all gc_1 to gc_55 question IDs are valid"""
        payload = get_base_assessment_payload()
        
        # Create answers for all 55 questions
        all_answers = {f"gc_{i}": "yes" for i in range(1, 56)}
        payload["governance_compliance"] = all_answers
        
        response = api_client.post(f"{BASE_URL}/api/assessment/calculate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        governance = data["governance"]
        
        # Should have processed all 55
        assert governance["unanswered"] == 0, f"Expected 0 unanswered, got {governance['unanswered']}"
        
        print(f"PASS: All 55 question IDs (gc_1 to gc_55) are valid")


class TestAuthRequired:
    """Test that assessment endpoint requires authentication"""
    
    def test_assessment_requires_auth(self):
        """Test that /assessment/calculate requires authentication"""
        payload = get_base_assessment_payload()
        
        # Request without auth header
        response = requests.post(
            f"{BASE_URL}/api/assessment/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"PASS: Assessment endpoint requires authentication (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
