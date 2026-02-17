#!/usr/bin/env python3
"""
IntelliEngine Backend API Testing Suite
Tests all backend endpoints for the IPO-readiness platform
"""

import requests
import sys
import json
import time
from datetime import datetime, timezone, timedelta
import subprocess
import os

class IntelliEngineAPITester:
    def __init__(self, base_url="https://fullstack-docs-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.project_id = None
        self.section_id = None
        self.document_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        if self.session_token:
            default_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            default_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            default_headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=default_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def create_test_user_and_session(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Creating test user and session in MongoDB...")
        
        timestamp = int(time.time())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        mongo_script = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User {timestamp}',
  picture: 'https://via.placeholder.com/150',
  role: 'Editor',
  company_id: null,
  created_at: new Date().toISOString()
}});
db.user_sessions.insertOne({{
  session_id: 'sess_{timestamp}',
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
}});
print('Test user and session created successfully');
"""
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ MongoDB script failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to create test user: {e}")
            return False

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🏥 Testing Health Endpoints...")
        
        # Test root endpoint
        self.run_test("Root API endpoint", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health check endpoint", "GET", "health", 200)

    def test_unauthenticated_endpoints(self):
        """Test endpoints that should require authentication"""
        print("\n🔒 Testing Unauthenticated Access (should fail)...")
        
        # These should return 401
        self.run_test("Auth/me without token", "GET", "auth/me", 401)
        self.run_test("Projects without token", "GET", "projects", 401)

    def test_authenticated_endpoints(self):
        """Test authenticated endpoints"""
        print("\n🔐 Testing Authenticated Endpoints...")
        
        # Test auth/me
        success, user_data = self.run_test("Get current user", "GET", "auth/me", 200)
        if success and user_data:
            print(f"   User: {user_data.get('name')} ({user_data.get('email')})")

        # Test get projects (should be empty for new user)
        success, projects = self.run_test("Get projects (empty)", "GET", "projects", 200)
        if success:
            print(f"   Projects count: {len(projects) if isinstance(projects, list) else 'N/A'}")

    def test_project_operations(self):
        """Test project CRUD operations"""
        print("\n📁 Testing Project Operations...")
        
        # Create project
        project_data = {
            "company_name": "Test Corporation Ltd",
            "sector": "Technology"
        }
        
        success, project = self.run_test("Create project", "POST", "projects", 200, project_data)
        if success and project:
            self.project_id = project.get('project_id')
            print(f"   Created project: {self.project_id}")
            
            # Get specific project
            self.run_test("Get specific project", "GET", f"projects/{self.project_id}", 200)
            
            # Update project
            update_data = {"progress_percentage": 25}
            self.run_test("Update project", "PUT", f"projects/{self.project_id}", 200, update_data)
            
            # Get projects list (should now have 1)
            success, projects = self.run_test("Get projects (with data)", "GET", "projects", 200)
            if success and isinstance(projects, list):
                print(f"   Projects count after creation: {len(projects)}")

    def test_drhp_sections(self):
        """Test DRHP section operations"""
        if not self.project_id:
            print("\n⚠️  Skipping DRHP sections test - no project created")
            return
            
        print("\n📄 Testing DRHP Sections...")
        
        # Get sections for project
        success, sections = self.run_test("Get project sections", "GET", f"projects/{self.project_id}/sections", 200)
        if success and isinstance(sections, list):
            print(f"   Sections count: {len(sections)}")
            if len(sections) >= 13:
                print("   ✅ All 13 DRHP sections created")
                self.section_id = sections[0].get('section_id')
                
                # Get specific section
                self.run_test("Get specific section", "GET", f"projects/{self.project_id}/sections/{self.section_id}", 200)
                
                # Update section
                update_data = {
                    "content": {"text": "This is test content for the section"},
                    "status": "Review"
                }
                self.run_test("Update section", "PUT", f"projects/{self.project_id}/sections/{self.section_id}", 200, update_data)
            else:
                print(f"   ❌ Expected 13 sections, got {len(sections)}")

    def test_document_operations(self):
        """Test document upload and management"""
        if not self.project_id or not self.section_id:
            print("\n⚠️  Skipping document operations test - no project/section available")
            return
            
        print("\n📎 Testing Document Operations...")
        
        # Create a test file
        test_content = "This is a test document for IntelliEngine IPO platform testing."
        test_filename = "test_document.txt"
        
        try:
            with open(f"/tmp/{test_filename}", "w") as f:
                f.write(test_content)
            
            # Upload document
            with open(f"/tmp/{test_filename}", "rb") as f:
                files = {"file": (test_filename, f, "text/plain")}
                data = {
                    "project_id": self.project_id,
                    "section_id": self.section_id
                }
                
                success, doc_data = self.run_test(
                    "Upload document", 
                    "POST", 
                    "documents/upload", 
                    200,  # Assuming 200, might be 201
                    data=data,
                    files=files
                )
                
                if success and doc_data:
                    self.document_id = doc_data.get('document_id')
                    print(f"   Uploaded document: {self.document_id}")
                    
                    # Get documents
                    self.run_test("Get documents", "GET", f"documents?section_id={self.section_id}", 200)
                    
                    # Test OCR (might fail if EMERGENT_LLM_KEY is invalid)
                    ocr_data = {
                        "document_id": self.document_id,
                        "prompt": "Extract all text from this document"
                    }
                    success, ocr_result = self.run_test("Process OCR", "POST", f"documents/{self.document_id}/ocr", 200, ocr_data)
                    if not success:
                        print("   ⚠️  OCR failed - check EMERGENT_LLM_KEY configuration")
                    
                    # Download document
                    self.run_test("Download document", "GET", f"documents/{self.document_id}/download", 200)
                    
                    # Delete document
                    self.run_test("Delete document", "DELETE", f"documents/{self.document_id}", 200)
            
            # Cleanup
            os.remove(f"/tmp/{test_filename}")
            
        except Exception as e:
            print(f"   ❌ Document test setup failed: {e}")

    def test_auth_logout(self):
        """Test logout functionality"""
        print("\n🚪 Testing Logout...")
        self.run_test("Logout", "POST", "auth/logout", 200)

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        cleanup_script = f"""
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
if ('{self.project_id}') {{
    db.projects.deleteMany({{project_id: '{self.project_id}'}});
    db.drhp_sections.deleteMany({{project_id: '{self.project_id}'}});
}}
if ('{self.document_id}') {{
    db.documents.deleteMany({{document_id: '{self.document_id}'}});
}}
print('Test data cleaned up');
"""
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting IntelliEngine Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Test sequence
        self.test_health_endpoints()
        self.test_unauthenticated_endpoints()
        
        if self.create_test_user_and_session():
            self.test_authenticated_endpoints()
            self.test_project_operations()
            self.test_drhp_sections()
            self.test_document_operations()
            self.test_auth_logout()
            self.cleanup_test_data()
        else:
            print("❌ Cannot proceed with authenticated tests - user creation failed")
        
        # Results
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Detailed results
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = IntelliEngineAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results_file = f"/app/test_reports/backend_test_results_{int(time.time())}.json"
    os.makedirs("/app/test_reports", exist_ok=True)
    
    with open(results_file, "w") as f:
        json.dump({
            "summary": {
                "total_tests": tester.tests_run,
                "passed": tester.tests_passed,
                "failed": tester.tests_run - tester.tests_passed,
                "success_rate": tester.tests_passed/tester.tests_run*100 if tester.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())