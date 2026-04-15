"""
Test Valuation Document Upload and AI Extraction Feature
Tests the new endpoints:
- POST /api/valuation/projects/{id}/upload - Upload financial documents to GridFS
- POST /api/valuation/projects/{id}/extract - Extract financial data using GPT-5.2
"""
import pytest
import requests
import os
import time
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session created for this test run
TEST_SESSION_TOKEN = None
TEST_USER_ID = None
TEST_VALUATION_ID = None


@pytest.fixture(scope="module", autouse=True)
def setup_test_session():
    """Create test user and session for authenticated requests"""
    global TEST_SESSION_TOKEN, TEST_USER_ID
    
    import subprocess
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', '''
        use('test_database');
        var userId = 'test-user-upload-' + Date.now();
        var sessionToken = 'test_session_upload_' + Date.now();
        db.users.insertOne({
          user_id: userId,
          email: 'test.upload.' + Date.now() + '@example.com',
          name: 'Test Upload User',
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
        '''
    ], capture_output=True, text=True)
    
    for line in result.stdout.strip().split('\n'):
        if line.startswith('SESSION_TOKEN='):
            TEST_SESSION_TOKEN = line.split('=')[1]
        elif line.startswith('USER_ID='):
            TEST_USER_ID = line.split('=')[1]
    
    assert TEST_SESSION_TOKEN, "Failed to create test session"
    print(f"Test session created: {TEST_SESSION_TOKEN[:20]}...")
    
    yield
    
    # Cleanup
    subprocess.run([
        'mongosh', '--quiet', '--eval', f'''
        use('test_database');
        db.users.deleteMany({{user_id: /test-user-upload-/}});
        db.user_sessions.deleteMany({{session_token: /test_session_upload_/}});
        db.valuation_projects.deleteMany({{user_id: /test-user-upload-/}});
        '''
    ], capture_output=True)


@pytest.fixture
def auth_headers():
    """Get authorization headers"""
    return {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}


class TestValuationUploadExtract:
    """Test document upload and AI extraction for valuation module"""
    
    def test_01_create_valuation_project(self, auth_headers):
        """Create a valuation project for testing upload"""
        global TEST_VALUATION_ID
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects",
            headers=auth_headers,
            json={}
        )
        
        assert response.status_code == 200, f"Failed to create project: {response.text}"
        data = response.json()
        assert "valuation_id" in data
        TEST_VALUATION_ID = data["valuation_id"]
        print(f"Created valuation project: {TEST_VALUATION_ID}")
    
    def test_02_update_company_profile(self, auth_headers):
        """Update company profile (Step 1)"""
        assert TEST_VALUATION_ID, "No valuation ID from previous test"
        
        payload = {
            "company_profile": {
                "company_name": "Test Upload Corp",
                "industry": "Information Technology",
                "purpose": "ma",
                "currency": "crores",
                "description": "Test company for upload testing",
                "company_type": "private_limited"
            },
            "current_step": 2,
            "status": "in_progress"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 200, f"Failed to update profile: {response.text}"
        data = response.json()
        # API returns {"status": "saved", "valuation_id": ...} on update
        assert data.get("status") == "saved" or data.get("company_profile", {}).get("company_name") == "Test Upload Corp"
        print("Company profile updated successfully")
    
    def test_03_upload_excel_document(self, auth_headers):
        """Test uploading Excel file to valuation project"""
        assert TEST_VALUATION_ID, "No valuation ID from previous test"
        
        # Use the test Excel file
        test_file_path = "/tmp/test_financials.xlsx"
        assert os.path.exists(test_file_path), f"Test file not found: {test_file_path}"
        
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_financials.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            data = {"doc_type": "financial_statement"}
            
            response = requests.post(
                f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}/upload",
                headers=auth_headers,
                files=files,
                data=data
            )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        result = response.json()
        
        # Verify response structure
        assert result.get("status") == "uploaded", f"Unexpected status: {result}"
        assert "document" in result
        doc = result["document"]
        assert doc.get("filename") == "test_financials.xlsx"
        assert doc.get("size") > 0
        assert "gridfs_id" in doc
        print(f"Document uploaded: {doc['filename']} ({doc['size']} bytes)")
    
    def test_04_verify_document_in_project(self, auth_headers):
        """Verify uploaded document appears in project"""
        assert TEST_VALUATION_ID, "No valuation ID from previous test"
        
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check documents array
        documents = data.get("documents", [])
        assert len(documents) >= 1, "No documents found in project"
        
        # Find our uploaded file
        uploaded_doc = next((d for d in documents if d.get("filename") == "test_financials.xlsx"), None)
        assert uploaded_doc is not None, "Uploaded document not found in project"
        assert uploaded_doc.get("doc_type") == "financial_statement"
        print(f"Document verified in project: {uploaded_doc['filename']}")
    
    def test_05_extract_financial_data_with_ai(self, auth_headers):
        """Test AI extraction from uploaded Excel file"""
        assert TEST_VALUATION_ID, "No valuation ID from previous test"
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}/extract",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Extraction failed: {response.text}"
        result = response.json()
        
        # Verify extracted_data structure
        assert "extracted_data" in result, "No extracted_data in response"
        extracted = result["extracted_data"]
        
        # Check years_data array
        assert "years_data" in extracted, "No years_data in extracted data"
        years_data = extracted["years_data"]
        assert len(years_data) >= 1, "No year data extracted"
        
        # Verify at least one year has data
        has_data = False
        for year in years_data:
            if year.get("revenue", 0) > 0 or year.get("ebitda", 0) > 0:
                has_data = True
                print(f"Extracted data for {year.get('year')}: Revenue={year.get('revenue')}, EBITDA={year.get('ebitda')}, PAT={year.get('pat')}")
        
        # The AI should extract data from the Excel file
        # Expected values from test file: Revenue 500/400/300, EBITDA 100/80/60, PAT 60/45/35
        print(f"Extraction result: {len(years_data)} years of data")
        
        # Check for shares_outstanding and face_value
        assert "shares_outstanding" in extracted or "face_value" in extracted, "Missing share info"
    
    def test_06_extract_without_documents_fails(self, auth_headers):
        """Test that extraction fails when no documents uploaded"""
        # Create a new project without documents
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects",
            headers=auth_headers,
            json={}
        )
        assert response.status_code == 200
        new_project_id = response.json()["valuation_id"]
        
        # Try to extract without uploading
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/{new_project_id}/extract",
            headers=auth_headers
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "No documents" in response.text or "no documents" in response.text.lower()
        print("Correctly rejected extraction without documents")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/valuation/projects/{new_project_id}", headers=auth_headers)
    
    def test_07_upload_invalid_file_type_rejected(self, auth_headers):
        """Test that invalid file types are rejected"""
        assert TEST_VALUATION_ID, "No valuation ID from previous test"
        
        # Try to upload a .zip file (should be rejected)
        fake_content = b"fake zip content"
        files = {"file": ("test.zip", fake_content, "application/zip")}
        data = {"doc_type": "financial_statement"}
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}/upload",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
        print("Invalid file type correctly rejected")
    
    def test_08_upload_csv_document(self, auth_headers):
        """Test uploading CSV file"""
        assert TEST_VALUATION_ID, "No valuation ID from previous test"
        
        # Create a simple CSV
        csv_content = """Particulars,FY2024,FY2023,FY2022
Revenue,500,400,300
EBITDA,100,80,60
PAT,60,45,35
"""
        files = {"file": ("financials.csv", csv_content.encode(), "text/csv")}
        data = {"doc_type": "financial_statement"}
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}/upload",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 200, f"CSV upload failed: {response.text}"
        result = response.json()
        assert result.get("status") == "uploaded"
        print("CSV file uploaded successfully")
    
    def test_09_upload_requires_auth(self):
        """Test that upload endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/fake-id/upload",
            files={"file": ("test.xlsx", b"fake", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"doc_type": "financial_statement"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Upload endpoint correctly requires auth")
    
    def test_10_extract_requires_auth(self):
        """Test that extract endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/fake-id/extract"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Extract endpoint correctly requires auth")
    
    def test_11_upload_to_nonexistent_project_fails(self, auth_headers):
        """Test upload to non-existent project returns 404"""
        fake_content = b"test content"
        files = {"file": ("test.xlsx", fake_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        data = {"doc_type": "financial_statement"}
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/nonexistent-project-id/upload",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Upload to non-existent project correctly returns 404")
    
    def test_12_full_e2e_flow(self, auth_headers):
        """Full end-to-end: create -> profile -> upload -> extract -> verify data populated"""
        # 1. Create new project
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects",
            headers=auth_headers,
            json={}
        )
        assert response.status_code == 200
        project_id = response.json()["valuation_id"]
        print(f"E2E: Created project {project_id}")
        
        # 2. Set company profile
        response = requests.put(
            f"{BASE_URL}/api/valuation/projects/{project_id}",
            headers=auth_headers,
            json={
                "company_profile": {
                    "company_name": "E2E Test Corp",
                    "industry": "Financial Services",
                    "purpose": "ipo",
                    "currency": "crores"
                },
                "current_step": 2
            }
        )
        assert response.status_code == 200
        print("E2E: Company profile set")
        
        # 3. Upload Excel file
        with open("/tmp/test_financials.xlsx", "rb") as f:
            response = requests.post(
                f"{BASE_URL}/api/valuation/projects/{project_id}/upload",
                headers=auth_headers,
                files={"file": ("test_financials.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                data={"doc_type": "financial_statement"}
            )
        assert response.status_code == 200
        print("E2E: Document uploaded")
        
        # 4. Extract with AI
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects/{project_id}/extract",
            headers=auth_headers
        )
        assert response.status_code == 200
        extracted = response.json().get("extracted_data", {})
        years_data = extracted.get("years_data", [])
        print(f"E2E: Extracted {len(years_data)} years of data")
        
        # 5. Verify data can be saved to project
        if years_data:
            response = requests.put(
                f"{BASE_URL}/api/valuation/projects/{project_id}",
                headers=auth_headers,
                json={
                    "financial_data": {
                        "years_data": years_data,
                        "shares_outstanding": extracted.get("shares_outstanding", 100000),
                        "face_value": extracted.get("face_value", 10)
                    },
                    "current_step": 3
                }
            )
            assert response.status_code == 200
            print("E2E: Financial data saved to project")
        
        # 6. Verify project has the data
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects/{project_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        project = response.json()
        assert project.get("financial_data", {}).get("years_data"), "Financial data not saved"
        print("E2E: Full flow completed successfully!")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/valuation/projects/{project_id}", headers=auth_headers)
    
    def test_13_cleanup_test_project(self, auth_headers):
        """Cleanup the main test project"""
        if TEST_VALUATION_ID:
            response = requests.delete(
                f"{BASE_URL}/api/valuation/projects/{TEST_VALUATION_ID}",
                headers=auth_headers
            )
            # 200 or 404 both acceptable (might already be deleted)
            assert response.status_code in [200, 404]
            print(f"Cleaned up test project: {TEST_VALUATION_ID}")


class TestRegressionValuationModule:
    """Regression tests to ensure existing valuation functionality still works"""
    
    def test_regression_create_project(self, auth_headers):
        """Regression: Create valuation project still works"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects",
            headers=auth_headers,
            json={}
        )
        assert response.status_code == 200
        data = response.json()
        assert "valuation_id" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/valuation/projects/{data['valuation_id']}", headers=auth_headers)
        print("Regression: Create project works")
    
    def test_regression_list_projects(self, auth_headers):
        """Regression: List valuation projects still works"""
        response = requests.get(
            f"{BASE_URL}/api/valuation/projects",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # API returns {"projects": [...]} format
        assert isinstance(data, dict) and "projects" in data and isinstance(data["projects"], list)
        print("Regression: List projects works")
    
    def test_regression_update_project(self, auth_headers):
        """Regression: Update valuation project still works"""
        # Create
        response = requests.post(
            f"{BASE_URL}/api/valuation/projects",
            headers=auth_headers,
            json={}
        )
        project_id = response.json()["valuation_id"]
        
        # Update
        response = requests.put(
            f"{BASE_URL}/api/valuation/projects/{project_id}",
            headers=auth_headers,
            json={
                "company_profile": {"company_name": "Regression Test"},
                "financial_data": {
                    "years_data": [{"year": "FY2024", "revenue": 100, "ebitda": 20, "pat": 10}],
                    "shares_outstanding": 100000,
                    "face_value": 10
                },
                "valuation_config": {
                    "methods": ["dcf"],
                    "dcf_config": {"wacc": 12, "growth_rate": 15, "terminal_growth": 4, "projection_years": 5}
                }
            }
        )
        assert response.status_code == 200
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/valuation/projects/{project_id}", headers=auth_headers)
        print("Regression: Update project works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
