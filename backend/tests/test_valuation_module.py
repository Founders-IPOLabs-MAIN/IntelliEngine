"""
Test suite for Automated Business Valuation Module
Tests CRUD operations, calculation engine, and API endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_valuation_session_1776253164397"

class TestValuationEngine:
    """Direct tests for valuation calculation functions"""
    
    def test_dcf_valuation_calculation(self):
        """Test DCF valuation produces correct output"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import calculate_dcf_valuation
        
        financial_data = {
            'years_data': [
                {'year': 'FY2024', 'revenue': 150, 'ebitda': 35, 'pat': 18, 'depreciation': 8, 
                 'capex': 12, 'working_capital_change': 4, 'total_assets': 220, 'total_liabilities': 100, 
                 'net_worth': 120, 'total_debt': 40, 'cash_equivalents': 20}
            ],
            'shares_outstanding': 1000000
        }
        config = {'wacc': 12, 'growth_rate': 15, 'terminal_growth': 4, 'projection_years': 5}
        
        result = calculate_dcf_valuation(financial_data, config)
        
        assert 'error' not in result or result.get('error') is None
        assert result.get('valuation', 0) > 0, "DCF valuation should be positive"
        assert 'projections' in result, "DCF should have projections"
        assert 'sensitivity' in result, "DCF should have sensitivity analysis"
        assert result.get('method') == "Discounted Cash Flow (DCF)"
        print(f"✓ DCF Valuation: ₹{result['valuation']} Cr")
    
    def test_nav_valuation_calculation(self):
        """Test NAV valuation produces correct output"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import calculate_nav_valuation
        
        financial_data = {
            'years_data': [
                {'year': 'FY2024', 'total_assets': 220, 'total_liabilities': 100, 'net_worth': 120}
            ],
            'shares_outstanding': 1000000
        }
        config = {'illiquidity_discount': 20, 'land_building_adj': 10, 'investment_adj': 5}
        
        result = calculate_nav_valuation(financial_data, config)
        
        assert 'error' not in result or result.get('error') is None
        assert result.get('valuation', 0) > 0, "NAV valuation should be positive"
        assert result.get('method') == "Net Asset Value (NAV)"
        assert 'going_concern_nav' in result
        assert 'liquidation_nav' in result
        print(f"✓ NAV Valuation: ₹{result['valuation']} Cr")
    
    def test_comparable_valuation_calculation(self):
        """Test Comparable Company Multiples valuation"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import calculate_comparable_valuation
        
        financial_data = {
            'years_data': [
                {'year': 'FY2024', 'revenue': 150, 'ebitda': 35, 'pat': 18, 'net_worth': 120}
            ]
        }
        config = {
            'peers': [
                {'name': 'Peer A', 'pe': 25, 'ev_ebitda': 15, 'pb': 3, 'ev_sales': 4},
                {'name': 'Peer B', 'pe': 20, 'ev_ebitda': 12, 'pb': 2.5, 'ev_sales': 3}
            ]
        }
        
        result = calculate_comparable_valuation(financial_data, config)
        
        assert 'error' not in result or result.get('error') is None
        assert result.get('valuation', 0) > 0, "Comparable valuation should be positive"
        assert result.get('method') == "Comparable Company Multiples (CCM)"
        assert 'multiples_summary' in result
        print(f"✓ Comparable Valuation: ₹{result['valuation']} Cr")
    
    def test_ddm_valuation_with_dividends(self):
        """Test DDM valuation for dividend-paying company"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import calculate_ddm_valuation
        
        financial_data = {
            'years_data': [
                {'year': 'FY2024', 'dividend_per_share': 3}
            ],
            'shares_outstanding': 1000000
        }
        config = {'cost_of_equity': 14, 'dividend_growth': 5}
        
        result = calculate_ddm_valuation(financial_data, config)
        
        assert 'error' not in result or result.get('error') is None
        assert result.get('valuation', 0) > 0, "DDM valuation should be positive"
        assert result.get('method') == "Dividend Discount Model (DDM)"
        print(f"✓ DDM Valuation: ₹{result['valuation']} Cr")
    
    def test_ddm_valuation_no_dividends(self):
        """Test DDM returns warning when no dividends"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import calculate_ddm_valuation
        
        financial_data = {
            'years_data': [
                {'year': 'FY2024', 'dividend_per_share': 0}
            ],
            'shares_outstanding': 1000000
        }
        config = {'cost_of_equity': 14, 'dividend_growth': 5}
        
        result = calculate_ddm_valuation(financial_data, config)
        
        assert result.get('warning') is not None or result.get('valuation', 0) == 0
        print(f"✓ DDM correctly handles no-dividend case")
    
    def test_financial_ratios_calculation(self):
        """Test financial ratios calculation"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import calculate_financial_ratios
        
        financial_data = {
            'years_data': [
                {'year': 'FY2022', 'revenue': 100, 'ebitda': 20, 'pat': 10, 'net_worth': 70, 
                 'total_assets': 150, 'total_debt': 30, 'current_assets': 50, 'current_liabilities': 40},
                {'year': 'FY2023', 'revenue': 120, 'ebitda': 25, 'pat': 12, 'net_worth': 90, 
                 'total_assets': 180, 'total_debt': 35, 'current_assets': 60, 'current_liabilities': 45},
                {'year': 'FY2024', 'revenue': 150, 'ebitda': 35, 'pat': 18, 'net_worth': 120, 
                 'total_assets': 220, 'total_debt': 40, 'current_assets': 75, 'current_liabilities': 50}
            ]
        }
        
        ratios = calculate_financial_ratios(financial_data)
        
        assert 'ebitda_margin' in ratios
        assert 'pat_margin' in ratios
        assert 'roe' in ratios
        assert 'debt_equity' in ratios
        assert 'current_ratio' in ratios
        assert 'revenue_cagr' in ratios
        print(f"✓ Financial Ratios: {ratios}")
    
    def test_weighted_valuation_calculation(self):
        """Test weighted average valuation"""
        import sys
        sys.path.insert(0, '/app/backend')
        from valuation_engine import compute_weighted_valuation
        
        results = {
            'dcf': {'valuation': 200},
            'nav': {'valuation': 150},
            'comparable': {'valuation': 250}
        }
        weights = {'dcf': 0.5, 'nav': 0.25, 'comparable': 0.25}
        
        weighted = compute_weighted_valuation(results, weights)
        
        assert weighted.get('weighted_average', 0) > 0
        assert 'value_range_low' in weighted
        assert 'value_range_high' in weighted
        assert 'method_values' in weighted
        print(f"✓ Weighted Valuation: ₹{weighted['weighted_average']} Cr")


class TestValuationAPIEndpoints:
    """Test valuation API endpoints with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test client with auth headers"""
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SESSION_TOKEN}"
        }
        self.valuation_id = None
    
    def test_01_create_valuation_project(self):
        """Test POST /api/valuation/projects - Create new project"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects",
            headers=self.headers,
            json={"company_profile": {"company_name": "TEST_ValuationCorp"}}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "valuation_id" in data
        assert data.get("status") == "draft"
        
        # Store for subsequent tests
        TestValuationAPIEndpoints.created_valuation_id = data["valuation_id"]
        print(f"✓ Created valuation project: {data['valuation_id']}")
    
    def test_02_list_valuation_projects(self):
        """Test GET /api/valuation/projects - List user's projects"""
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "projects" in data
        assert isinstance(data["projects"], list)
        print(f"✓ Listed {len(data['projects'])} valuation projects")
    
    def test_03_get_valuation_project(self):
        """Test GET /api/valuation/projects/{id} - Get specific project"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("valuation_id") == valuation_id
        assert "company_profile" in data
        print(f"✓ Retrieved valuation project: {valuation_id}")
    
    def test_04_update_valuation_project_step1(self):
        """Test PUT /api/valuation/projects/{id} - Update company profile"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        payload = {
            "company_profile": {
                "company_name": "TEST_ValuationCorp",
                "industry": "Information Technology",
                "purpose": "ipo",
                "currency": "crores",
                "company_type": "private_limited",
                "description": "Test company for valuation"
            },
            "current_step": 2,
            "status": "in_progress"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers,
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "saved"
        print(f"✓ Updated company profile for: {valuation_id}")
    
    def test_05_update_valuation_project_step2(self):
        """Test PUT /api/valuation/projects/{id} - Update financial data"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        payload = {
            "financial_data": {
                "years_data": [
                    {"year": "FY2024", "revenue": 150, "ebitda": 35, "pat": 18, "depreciation": 8,
                     "capex": 12, "working_capital_change": 4, "total_assets": 220, "total_liabilities": 100,
                     "net_worth": 120, "total_debt": 40, "cash_equivalents": 20, "current_assets": 75,
                     "current_liabilities": 50, "dividend_per_share": 3},
                    {"year": "FY2023", "revenue": 120, "ebitda": 25, "pat": 12, "depreciation": 6,
                     "capex": 10, "working_capital_change": 3, "total_assets": 180, "total_liabilities": 90,
                     "net_worth": 90, "total_debt": 35, "cash_equivalents": 15, "current_assets": 60,
                     "current_liabilities": 45, "dividend_per_share": 2.5},
                    {"year": "FY2022", "revenue": 100, "ebitda": 20, "pat": 10, "depreciation": 5,
                     "capex": 8, "working_capital_change": 2, "total_assets": 150, "total_liabilities": 80,
                     "net_worth": 70, "total_debt": 30, "cash_equivalents": 10, "current_assets": 50,
                     "current_liabilities": 40, "dividend_per_share": 2}
                ],
                "shares_outstanding": 1000000,
                "face_value": 10
            },
            "current_step": 3
        }
        
        response = requests.put(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers,
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Updated financial data for: {valuation_id}")
    
    def test_06_update_valuation_project_step3(self):
        """Test PUT /api/valuation/projects/{id} - Update valuation config"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        payload = {
            "valuation_config": {
                "methods": ["dcf", "nav", "comparable"],
                "dcf_config": {"wacc": 12, "growth_rate": 15, "terminal_growth": 4, "projection_years": 5},
                "nav_config": {"illiquidity_discount": 20, "land_building_adj": 10, "investment_adj": 5},
                "comparable_config": {
                    "peers": [
                        {"name": "TCS", "pe": 30, "ev_ebitda": 20, "pb": 12, "ev_sales": 8},
                        {"name": "Infosys", "pe": 25, "ev_ebitda": 18, "pb": 8, "ev_sales": 6}
                    ]
                },
                "weights": {"dcf": 0.5, "nav": 0.25, "comparable": 0.25}
            },
            "current_step": 4
        }
        
        response = requests.put(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers,
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Updated valuation config for: {valuation_id}")
    
    def test_07_run_valuation_calculation(self):
        """Test POST /api/valuation/projects/{id}/calculate - Run valuation"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}/calculate",
            headers=self.headers,
            timeout=60  # AI analysis may take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify results structure
        assert "results" in data
        results = data["results"]
        
        # Check methods
        assert "methods" in results
        assert "dcf" in results["methods"]
        assert "nav" in results["methods"]
        assert "comparable" in results["methods"]
        
        # Check DCF results
        dcf = results["methods"]["dcf"]
        assert dcf.get("valuation", 0) > 0, "DCF valuation should be positive"
        assert "projections" in dcf
        assert "sensitivity" in dcf
        
        # Check NAV results
        nav = results["methods"]["nav"]
        assert nav.get("valuation", 0) > 0, "NAV valuation should be positive"
        
        # Check Comparable results
        comp = results["methods"]["comparable"]
        assert comp.get("valuation", 0) > 0, "Comparable valuation should be positive"
        
        # Check weighted valuation
        assert "weighted_valuation" in results
        assert results["weighted_valuation"].get("weighted_average", 0) > 0
        
        # Check ratios
        assert "ratios" in results
        
        # Check confidence score
        assert "confidence_score" in results
        
        # Check AI analysis
        assert "ai_analysis" in results
        
        print(f"✓ Valuation calculation completed:")
        print(f"  - DCF: ₹{dcf.get('valuation', 0):.2f} Cr")
        print(f"  - NAV: ₹{nav.get('valuation', 0):.2f} Cr")
        print(f"  - Comparable: ₹{comp.get('valuation', 0):.2f} Cr")
        print(f"  - Weighted: ₹{results['weighted_valuation'].get('weighted_average', 0):.2f} Cr")
        print(f"  - Confidence: {results.get('confidence_score', 0)}%")
    
    def test_08_verify_completed_project(self):
        """Verify project status is completed after calculation"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "completed"
        assert data.get("results") is not None
        print(f"✓ Project status verified as completed")
    
    def test_09_delete_valuation_project(self):
        """Test DELETE /api/valuation/projects/{id} - Delete project"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        response = requests.delete(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"✓ Deleted valuation project: {valuation_id}")
    
    def test_10_verify_deletion(self):
        """Verify project is deleted"""
        valuation_id = getattr(TestValuationAPIEndpoints, 'created_valuation_id', None)
        if not valuation_id:
            pytest.skip("No valuation_id from previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects/{valuation_id}",
            headers=self.headers
        )
        
        assert response.status_code == 404, "Deleted project should return 404"
        print(f"✓ Verified project deletion (404 returned)")


class TestValuationAPIAuth:
    """Test authentication requirements for valuation endpoints"""
    
    def test_endpoints_require_auth(self):
        """Test that valuation endpoints require authentication"""
        endpoints = [
            ("GET", "/api/valuation/projects"),
            ("POST", "/api/valuation/projects"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            assert response.status_code == 401, f"{method} {endpoint} should require auth, got {response.status_code}"
            print(f"✓ {method} {endpoint} requires authentication (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
