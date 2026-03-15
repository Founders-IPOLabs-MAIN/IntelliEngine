"""
Test LinkedIn Profile Integration and Review Functionality
Tests for:
1. LinkedIn URL field in professional registration
2. Review submission with star rating (1-5 stars)
3. Review duplicate prevention (one review per user per professional)
4. Self-review prevention (cannot review own profile)
5. Review status endpoint
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session tokens - will be created in fixtures
TEST_USER_1_TOKEN = None
TEST_USER_1_ID = None
TEST_USER_2_TOKEN = None
TEST_USER_2_ID = None
TEST_PROFESSIONAL_ID = None


class TestLinkedInAndReviewFeatures:
    """Test LinkedIn URL field and Review functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_test_users(self):
        """Create test users and sessions for testing"""
        global TEST_USER_1_TOKEN, TEST_USER_1_ID, TEST_USER_2_TOKEN, TEST_USER_2_ID
        
        import subprocess
        import time
        
        timestamp = int(time.time() * 1000)
        
        # Create first test user (will create professional profile)
        result1 = subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            use('test_database');
            var userId = 'test-linkedin-user1-{timestamp}';
            var sessionToken = 'test_session_linkedin1_{timestamp}';
            db.users.insertOne({{
              user_id: userId,
              email: 'test.linkedin1.{timestamp}@example.com',
              name: 'Test LinkedIn User 1',
              picture: 'https://via.placeholder.com/150',
              role: 'Editor',
              company_id: null,
              created_at: new Date().toISOString()
            }});
            db.user_sessions.insertOne({{
              session_id: 'sess_{timestamp}_1',
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            }});
            print('TOKEN=' + sessionToken);
            print('USERID=' + userId);
            '''
        ], capture_output=True, text=True)
        
        for line in result1.stdout.strip().split('\n'):
            if line.startswith('TOKEN='):
                TEST_USER_1_TOKEN = line.split('=')[1]
            elif line.startswith('USERID='):
                TEST_USER_1_ID = line.split('=')[1]
        
        # Create second test user (will submit review)
        result2 = subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            use('test_database');
            var userId = 'test-linkedin-user2-{timestamp}';
            var sessionToken = 'test_session_linkedin2_{timestamp}';
            db.users.insertOne({{
              user_id: userId,
              email: 'test.linkedin2.{timestamp}@example.com',
              name: 'Test LinkedIn User 2',
              picture: 'https://via.placeholder.com/150',
              role: 'Editor',
              company_id: null,
              created_at: new Date().toISOString()
            }});
            db.user_sessions.insertOne({{
              session_id: 'sess_{timestamp}_2',
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            }});
            print('TOKEN=' + sessionToken);
            print('USERID=' + userId);
            '''
        ], capture_output=True, text=True)
        
        for line in result2.stdout.strip().split('\n'):
            if line.startswith('TOKEN='):
                TEST_USER_2_TOKEN = line.split('=')[1]
            elif line.startswith('USERID='):
                TEST_USER_2_ID = line.split('=')[1]
        
        yield
        
        # Cleanup test data
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            use('test_database');
            db.users.deleteMany({{email: /test\\.linkedin.*{timestamp}/}});
            db.user_sessions.deleteMany({{session_token: /test_session_linkedin.*{timestamp}/}});
            db.professionals.deleteMany({{email: /test\\.linkedin.*{timestamp}/}});
            '''
        ], capture_output=True, text=True)
    
    def test_01_auth_working(self):
        """Test authentication is working"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_USER_1_TOKEN}"}
        )
        assert response.status_code == 200, f"Auth failed: {response.text}"
        data = response.json()
        assert "user_id" in data or "email" in data
        print(f"✓ Auth working for user: {data.get('name', data.get('email'))}")
    
    def test_02_create_professional_with_linkedin_url(self):
        """Test creating professional profile with LinkedIn URL"""
        global TEST_PROFESSIONAL_ID
        
        payload = {
            "category_id": "ipo_consultants",
            "name": "Test LinkedIn Professional",
            "agency_name": "Test Agency",
            "email": f"test.linkedin.prof.{int(datetime.now().timestamp())}@example.com",
            "mobile": "+91 9876543210",
            "linkedin_url": "https://www.linkedin.com/in/test-professional",
            "locations": ["Mumbai", "Delhi"],
            "years_experience": 10,
            "professional_summary": "Expert IPO consultant with LinkedIn profile",
            "expertise_tags": ["SEBI Regulations", "Due Diligence"],
            "top_3_expertise": ["SEBI Regulations"],
            "registration_numbers": {"gstin": "22AAAAA0000A1Z5"},
            "consent_display": True,
            "consent_marketing": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_USER_1_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to create professional: {response.text}"
        data = response.json()
        
        # Verify LinkedIn URL is saved
        assert "professional_id" in data
        TEST_PROFESSIONAL_ID = data["professional_id"]
        assert data.get("linkedin_url") == "https://www.linkedin.com/in/test-professional"
        print(f"✓ Professional created with LinkedIn URL: {TEST_PROFESSIONAL_ID}")
    
    def test_03_create_professional_without_linkedin_url(self):
        """Test creating professional profile without LinkedIn URL (optional field)"""
        payload = {
            "category_id": "chartered_accountants",
            "name": "Test CA Without LinkedIn",
            "email": f"test.ca.nolinkedin.{int(datetime.now().timestamp())}@example.com",
            "mobile": "+91 9876543211",
            "locations": ["Bangalore"],
            "years_experience": 5,
            "expertise_tags": ["Taxation"],
            "registration_numbers": {"icai_membership": "123456"},
            "consent_display": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matchmaker/professionals",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_USER_2_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to create professional: {response.text}"
        data = response.json()
        
        # LinkedIn URL should be None or not present
        assert data.get("linkedin_url") is None or data.get("linkedin_url") == ""
        print(f"✓ Professional created without LinkedIn URL")
    
    def test_04_get_professional_with_linkedin_url(self):
        """Test retrieving professional profile shows LinkedIn URL"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}",
            headers={"Authorization": f"Bearer {TEST_USER_1_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to get professional: {response.text}"
        data = response.json()
        
        assert data.get("linkedin_url") == "https://www.linkedin.com/in/test-professional"
        print(f"✓ Professional profile shows LinkedIn URL correctly")
    
    def test_05_review_status_can_review(self):
        """Test review status endpoint - user can review another's profile"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review-status",
            headers={"Authorization": f"Bearer {TEST_USER_2_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to get review status: {response.text}"
        data = response.json()
        
        assert data.get("can_review") == True, "User should be able to review"
        assert data.get("has_reviewed") == False, "User should not have reviewed yet"
        assert data.get("is_own_profile") == False, "Should not be own profile"
        print(f"✓ Review status shows user can review")
    
    def test_06_review_status_own_profile(self):
        """Test review status endpoint - user cannot review own profile"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review-status",
            headers={"Authorization": f"Bearer {TEST_USER_1_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to get review status: {response.text}"
        data = response.json()
        
        assert data.get("is_own_profile") == True, "Should be own profile"
        assert data.get("can_review") == False, "User should not be able to review own profile"
        print(f"✓ Review status correctly identifies own profile")
    
    def test_07_submit_review_success(self):
        """Test submitting a review with star rating"""
        payload = {
            "professional_id": TEST_PROFESSIONAL_ID,
            "rating": 5,
            "review_text": "Excellent IPO consultant! Very knowledgeable and professional.",
            "reviewer_name": "Test Reviewer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_USER_2_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to submit review: {response.text}"
        data = response.json()
        
        assert data.get("message") == "Review added successfully"
        assert "review" in data
        assert data["review"]["rating"] == 5
        assert data["review"]["review_text"] == "Excellent IPO consultant! Very knowledgeable and professional."
        print(f"✓ Review submitted successfully with 5 stars")
    
    def test_08_review_status_after_review(self):
        """Test review status after submitting review"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review-status",
            headers={"Authorization": f"Bearer {TEST_USER_2_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to get review status: {response.text}"
        data = response.json()
        
        assert data.get("has_reviewed") == True, "User should have reviewed"
        assert data.get("can_review") == False, "User should not be able to review again"
        assert data.get("user_review") is not None, "Should return user's review"
        print(f"✓ Review status correctly shows user has reviewed")
    
    def test_09_duplicate_review_prevention(self):
        """Test that duplicate reviews are prevented"""
        payload = {
            "professional_id": TEST_PROFESSIONAL_ID,
            "rating": 4,
            "review_text": "Trying to submit another review",
            "reviewer_name": "Test Reviewer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_USER_2_TOKEN}"}
        )
        
        assert response.status_code == 400, f"Should reject duplicate review: {response.text}"
        data = response.json()
        
        assert "already reviewed" in data.get("detail", "").lower()
        print(f"✓ Duplicate review correctly rejected")
    
    def test_10_self_review_prevention(self):
        """Test that self-reviews are prevented"""
        payload = {
            "professional_id": TEST_PROFESSIONAL_ID,
            "rating": 5,
            "review_text": "Reviewing my own profile",
            "reviewer_name": "Self Reviewer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_USER_1_TOKEN}"}
        )
        
        assert response.status_code == 400, f"Should reject self-review: {response.text}"
        data = response.json()
        
        assert "cannot review your own" in data.get("detail", "").lower()
        print(f"✓ Self-review correctly rejected")
    
    def test_11_review_rating_validation(self):
        """Test that rating is clamped between 1-5"""
        # Create a third user for this test
        import subprocess
        import time
        
        timestamp = int(time.time() * 1000)
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            use('test_database');
            var userId = 'test-rating-user-{timestamp}';
            var sessionToken = 'test_session_rating_{timestamp}';
            db.users.insertOne({{
              user_id: userId,
              email: 'test.rating.{timestamp}@example.com',
              name: 'Test Rating User',
              role: 'Editor',
              created_at: new Date().toISOString()
            }});
            db.user_sessions.insertOne({{
              session_id: 'sess_rating_{timestamp}',
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            }});
            print('TOKEN=' + sessionToken);
            '''
        ], capture_output=True, text=True)
        
        token = None
        for line in result.stdout.strip().split('\n'):
            if line.startswith('TOKEN='):
                token = line.split('=')[1]
        
        if token:
            # Try to submit review with rating > 5
            payload = {
                "professional_id": TEST_PROFESSIONAL_ID,
                "rating": 10,  # Should be clamped to 5
                "review_text": "Testing rating validation",
                "reviewer_name": "Rating Tester"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}/review",
                json=payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Rating should be clamped to 5
                assert data["review"]["rating"] <= 5, "Rating should be clamped to max 5"
                print(f"✓ Rating validation working - clamped to {data['review']['rating']}")
            
            # Cleanup
            subprocess.run([
                'mongosh', '--quiet', '--eval', f'''
                use('test_database');
                db.users.deleteMany({{email: /test\\.rating\\.{timestamp}/}});
                db.user_sessions.deleteMany({{session_token: /test_session_rating_{timestamp}/}});
                '''
            ], capture_output=True, text=True)
    
    def test_12_professional_shows_reviews(self):
        """Test that professional profile shows reviews"""
        response = requests.get(
            f"{BASE_URL}/api/matchmaker/professionals/{TEST_PROFESSIONAL_ID}",
            headers={"Authorization": f"Bearer {TEST_USER_1_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Failed to get professional: {response.text}"
        data = response.json()
        
        assert "reviews" in data, "Professional should have reviews field"
        assert len(data["reviews"]) >= 1, "Should have at least 1 review"
        assert data.get("ratings_count", 0) >= 1, "Should have ratings count"
        assert data.get("average_rating", 0) > 0, "Should have average rating"
        print(f"✓ Professional profile shows {len(data['reviews'])} review(s), avg rating: {data.get('average_rating')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
