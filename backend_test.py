#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AIMatchMakerTester:
    def __init__(self, base_url="https://intelliengine-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "demo_session_token_12345"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add session token for authentication
        test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_size": len(response.text) if response.text else 0
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        response_data = response.json()
                        if isinstance(response_data, dict):
                            print(f"   Response keys: {list(response_data.keys())}")
                        result["response_data"] = response_data
                    except:
                        print(f"   Response length: {len(response.text)} chars")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Error: {response.text[:200]}...")
                result["error"] = response.text[:500] if response.text else "No response"

            self.test_results.append(result)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_matchmaker_categories(self):
        """Test matchmaker categories endpoint"""
        return self.run_test("Get Categories", "GET", "matchmaker/categories", 200)

    def test_matchmaker_cities(self):
        """Test matchmaker cities endpoint"""
        return self.run_test("Get Cities", "GET", "matchmaker/cities", 200)

    def test_matchmaker_expertise_tags(self):
        """Test expertise tags endpoint"""
        return self.run_test("Get Expertise Tags", "GET", "matchmaker/expertise-tags", 200)

    def test_search_professionals(self):
        """Test professional search endpoint"""
        return self.run_test("Search Professionals", "GET", "matchmaker/professionals", 200)

    def test_ai_recommendations(self):
        """Test AI-powered recommendations endpoint"""
        ai_request_data = {
            "company_name": "TechCorp Solutions",
            "sector": "Technology",
            "current_stage": "Assessment",
            "target_exchange": "SME",
            "estimated_issue_size": "₹50-100 Crores",
            "specific_needs": ["IPO Readiness Assessment", "DRHP Drafting"],
            "preferred_cities": ["Mumbai", "Bangalore"],
            "budget_range": "₹10-20 Lakhs",
            "timeline": "6-12 months",
            "additional_context": "First-time IPO for a tech startup"
        }
        
        success, response = self.run_test(
            "AI Recommendations", 
            "POST", 
            "matchmaker/ai-recommend", 
            200, 
            ai_request_data
        )
        
        if success and response:
            # Validate AI response structure
            required_fields = ["match_summary", "recommendations", "ai_powered"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"⚠️  Missing required fields in AI response: {missing_fields}")
                return False, response
            
            recommendations = response.get("recommendations", [])
            print(f"   AI returned {len(recommendations)} recommendations")
            
            if recommendations:
                # Check first recommendation structure
                first_rec = recommendations[0]
                rec_fields = ["professional_id", "match_score", "match_reason", "professional"]
                missing_rec_fields = [field for field in rec_fields if field not in first_rec]
                
                if missing_rec_fields:
                    print(f"⚠️  Missing fields in recommendation: {missing_rec_fields}")
                else:
                    print(f"   First match score: {first_rec.get('match_score', 'N/A')}")
                    print(f"   Professional name: {first_rec.get('professional', {}).get('name', 'N/A')}")
            
            return True, response
        
        return success, response

    def test_professional_profile(self):
        """Test getting a professional profile"""
        # First get professionals to find a valid ID
        success, professionals_data = self.test_search_professionals()
        
        if success and professionals_data.get("professionals"):
            prof_id = professionals_data["professionals"][0]["professional_id"]
            return self.run_test(
                "Get Professional Profile", 
                "GET", 
                f"matchmaker/professionals/{prof_id}", 
                200
            )
        else:
            print("⚠️  Skipping professional profile test - no professionals found")
            return False, {}

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AI-Powered Match Maker Backend Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   Session Token: {self.session_token}")
        print("=" * 60)

        # Test basic endpoints
        self.test_health_check()
        self.test_matchmaker_categories()
        self.test_matchmaker_cities()
        self.test_matchmaker_expertise_tags()
        self.test_search_professionals()
        
        # Test AI functionality
        print("\n🧠 Testing AI-Powered Features:")
        self.test_ai_recommendations()
        
        # Test professional profile
        self.test_professional_profile()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Save detailed results
        timestamp = int(datetime.now().timestamp())
        results_file = f"/app/test_reports/backend_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "base_url": self.base_url,
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
                "test_results": self.test_results
            }, f, indent=2)
        
        print(f"   Detailed results saved to: {results_file}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AIMatchMakerTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())