import requests
import sys
import json
from datetime import datetime

class MatchMakerAPITester:
    def __init__(self, base_url="https://fullstack-docs-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = "demo_session_token_12345"  # Test session token from requirements
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth header if token exists
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        # Add any additional headers
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'categories' in response_data:
                        print(f"   Categories count: {len(response_data['categories'])}")
                    elif isinstance(response_data, dict) and 'cities' in response_data:
                        print(f"   Cities count: {len(response_data['cities'])}")
                    elif isinstance(response_data, dict) and 'professionals' in response_data:
                        print(f"   Professionals count: {len(response_data['professionals'])}")
                    elif isinstance(response_data, dict) and 'tags' in response_data:
                        print(f"   Tags count: {len(response_data['tags'])}")
                except:
                    pass
                return success, response.json() if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint,
                    "error": response.text[:200] if response.text else "No response body"
                })
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "expected": expected_status,
                "actual": "Network Error",
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_get_categories(self):
        """Test getting professional categories - should return 11 categories"""
        success, response = self.run_test("Get Professional Categories", "GET", "matchmaker/categories", 200)
        if success and 'categories' in response:
            categories = response['categories']
            if len(categories) == 11:
                print(f"   ✅ Correct number of categories: {len(categories)}")
                # Check if all required categories are present
                category_ids = [cat['id'] for cat in categories]
                expected_categories = [
                    'ipo_consultants', 'merchant_bankers', 'cfo_finance', 'chartered_accountants',
                    'company_secretaries', 'legal_tax', 'peer_auditors', 'independent_directors',
                    'valuation_experts', 'rta', 'bankers'
                ]
                missing = [cat for cat in expected_categories if cat not in category_ids]
                if not missing:
                    print(f"   ✅ All required categories present")
                else:
                    print(f"   ⚠️  Missing categories: {missing}")
            else:
                print(f"   ⚠️  Expected 11 categories, got {len(categories)}")
        return success, response

    def test_get_cities(self):
        """Test getting cities list"""
        success, response = self.run_test("Get Cities", "GET", "matchmaker/cities", 200)
        if success and 'cities' in response:
            cities = response['cities']
            # Check for major Indian cities
            major_cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']
            found_cities = [city for city in major_cities if city in cities]
            print(f"   ✅ Major cities found: {found_cities}")
        return success, response

    def test_get_expertise_tags(self):
        """Test getting expertise tags"""
        return self.run_test("Get Expertise Tags", "GET", "matchmaker/expertise-tags", 200)

    def test_get_professionals(self):
        """Test getting professionals list"""
        success, response = self.run_test("Get All Professionals", "GET", "matchmaker/professionals", 200)
        if success and 'professionals' in response:
            professionals = response['professionals']
            print(f"   ✅ Found {len(professionals)} professionals")
            if len(professionals) >= 4:  # Should have 4 demo professionals
                print(f"   ✅ Demo professionals seeded correctly")
            else:
                print(f"   ⚠️  Expected at least 4 demo professionals")
        return success, response

    def test_search_professionals_by_category(self):
        """Test searching professionals by category"""
        return self.run_test("Search by Category", "GET", "matchmaker/professionals?category_id=ipo_consultants", 200)

    def test_search_professionals_by_city(self):
        """Test searching professionals by city"""
        return self.run_test("Search by City", "GET", "matchmaker/professionals?city=Mumbai", 200)

    def test_search_professionals_with_filters(self):
        """Test searching with multiple filters"""
        return self.run_test("Search with Filters", "GET", "matchmaker/professionals?min_experience=5&verified_only=true", 200)

    def test_get_professional_profile(self):
        """Test getting a specific professional profile"""
        # First get professionals to get a valid ID
        success, response = self.run_test("Get Professionals for Profile Test", "GET", "matchmaker/professionals", 200)
        if success and 'professionals' in response and len(response['professionals']) > 0:
            prof_id = response['professionals'][0]['professional_id']
            return self.run_test("Get Professional Profile", "GET", f"matchmaker/professionals/{prof_id}", 200)
        else:
            print("   ⚠️  No professionals found to test profile endpoint")
            return False, {}

    def test_create_professional_without_auth(self):
        """Test creating professional without authentication (should fail)"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        test_data = {
            "category_id": "ipo_consultants",
            "name": "Test Professional",
            "email": "test@example.com",
            "mobile": "+91 9876543210",
            "locations": ["Mumbai"],
            "years_experience": 5,
            "consent_display": True
        }
        
        success, response = self.run_test("Create Professional (No Auth)", "POST", "matchmaker/professionals", 401, test_data)
        
        # Restore token
        self.token = original_token
        return success, response

    def test_send_enquiry_without_auth(self):
        """Test sending enquiry without authentication (should fail)"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        test_data = {
            "professional_id": "test_prof_id",
            "subject": "Test Enquiry",
            "message": "Test message",
            "contact_email": "test@example.com"
        }
        
        success, response = self.run_test("Send Enquiry (No Auth)", "POST", "matchmaker/enquiry", 401, test_data)
        
        # Restore token
        self.token = original_token
        return success, response

    def test_book_consultation_without_auth(self):
        """Test booking consultation without authentication (should fail)"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        test_data = {
            "professional_id": "test_prof_id",
            "preferred_date": "2024-12-25",
            "preferred_time": "10:00",
            "consultation_type": "video",
            "topic": "IPO Planning"
        }
        
        success, response = self.run_test("Book Consultation (No Auth)", "POST", "matchmaker/consultation", 401, test_data)
        
        # Restore token
        self.token = original_token
        return success, response

def main():
    print("🚀 Starting IPO Match Maker API Tests")
    print("=" * 50)
    
    tester = MatchMakerAPITester()
    
    # Run all tests
    test_results = []
    
    # Basic API tests
    test_results.append(tester.test_health_check())
    
    # Match Maker specific tests
    test_results.append(tester.test_get_categories())
    test_results.append(tester.test_get_cities())
    test_results.append(tester.test_get_expertise_tags())
    test_results.append(tester.test_get_professionals())
    test_results.append(tester.test_search_professionals_by_category())
    test_results.append(tester.test_search_professionals_by_city())
    test_results.append(tester.test_search_professionals_with_filters())
    test_results.append(tester.test_get_professional_profile())
    
    # Authentication tests
    test_results.append(tester.test_create_professional_without_auth())
    test_results.append(tester.test_send_enquiry_without_auth())
    test_results.append(tester.test_book_consultation_without_auth())
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results Summary")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   • {failure['test']}: Expected {failure['expected']}, got {failure['actual']}")
            print(f"     Endpoint: {failure['endpoint']}")
            print(f"     Error: {failure['error']}")
    
    # Save results to file
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": len(tester.failed_tests),
        "success_rate": (tester.tests_passed/tester.tests_run)*100,
        "failures": tester.failed_tests
    }
    
    with open(f"/app/test_reports/backend_test_results_{int(datetime.now().timestamp())}.json", "w") as f:
        json.dump(results, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())