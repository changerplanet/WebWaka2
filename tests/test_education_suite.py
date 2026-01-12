"""
Education Suite API Tests
Tests for the Education Suite module including:
- Main education config API
- Students API
- Academic API
- Grades API
- Attendance API
- Fees API
- Report Cards API

Note: Demo user (demo.owner@webwaka.com) has no active tenant (activeTenantId: null),
so tenant-scoped endpoints will return NO_TENANT error code - this is expected behavior.

Auth uses /api/auth/v2 with action-based routing (login-password action).
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://code-hygiene-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "demo.owner@webwaka.com"
TEST_PASSWORD = "Demo2026!"


class TestAuthentication:
    """Authentication tests using /api/auth/v2"""
    
    def test_login_valid_credentials(self):
        """Test login with valid credentials via auth v2 API"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Login not successful: {data}"
        assert "sessionToken" in data or "user" in data, f"Unexpected response: {data}"
        print(f"✓ Login successful: {data.get('user', {}).get('email', 'N/A')}")
        return data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": "invalid@example.com",
            "password": "wrongpassword"
        })
        # Should return 200 with success=false or 400/401
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == False, f"Expected success=false: {data}"
        else:
            assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestEducationMainAPI:
    """Tests for GET /api/education endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        """Get auth headers"""
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_education_config_requires_auth(self):
        """Test that education config requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education?action=config")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ Education config requires authentication")
    
    def test_education_config_returns_labels(self):
        """Test GET /api/education?action=config returns config with labels"""
        response = requests.get(
            f"{BASE_URL}/api/education?action=config",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        assert "config" in data, f"Expected config in response: {data}"
        
        config = data["config"]
        assert "labels" in config, "Expected labels in config"
        assert "gradeScales" in config, "Expected gradeScales in config"
        assert "assessmentTypes" in config, "Expected assessmentTypes in config"
        assert "termTypes" in config, "Expected termTypes in config"
        assert "attendanceStatus" in config, "Expected attendanceStatus in config"
        
        # Verify label mappings
        labels = config["labels"]
        assert labels.get("students") == "Students", f"Expected students label: {labels}"
        assert labels.get("teachers") == "Teachers", f"Expected teachers label: {labels}"
        assert labels.get("grades") == "Grades", f"Expected grades label: {labels}"
        
        print(f"✓ Education config returned with {len(config)} sections")
    
    def test_education_solution_package(self):
        """Test GET /api/education?action=solution-package returns solution details"""
        response = requests.get(
            f"{BASE_URL}/api/education?action=solution-package",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        assert "solution" in data, f"Expected solution in response: {data}"
        
        solution = data["solution"]
        assert solution.get("key") == "education", f"Expected key=education: {solution}"
        assert solution.get("name") == "Education Suite", f"Expected name: {solution}"
        assert "targetCustomers" in solution, "Expected targetCustomers"
        assert "keyFeatures" in solution, "Expected keyFeatures"
        assert "pricing" in solution, "Expected pricing"
        
        # Verify activation checklist
        assert "activationChecklist" in data, "Expected activationChecklist"
        checklist = data["activationChecklist"]
        assert len(checklist) > 0, "Expected non-empty checklist"
        
        print(f"✓ Solution package returned: {solution.get('name')} with {len(checklist)} activation steps")
    
    def test_education_invalid_action(self):
        """Test invalid action returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/education?action=invalid-action",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid action correctly rejected")


class TestStudentsAPI:
    """Tests for /api/education/students endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_students_requires_auth(self):
        """Test that students API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/students")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Students API requires authentication")
    
    def test_students_list_no_tenant(self):
        """Test students list returns NO_TENANT error (expected for demo user)"""
        response = requests.get(
            f"{BASE_URL}/api/education/students",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        # Demo user has no tenant, so expect 400 with NO_TENANT code
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("code") == "NO_TENANT" or "tenant" in data.get("error", "").lower(), \
            f"Expected NO_TENANT error: {data}"
        print("✓ Students API correctly returns NO_TENANT for demo user")


class TestAcademicAPI:
    """Tests for /api/education/academic endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_academic_requires_auth(self):
        """Test that academic API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/academic?resource=overview")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Academic API requires authentication")
    
    def test_academic_overview_no_tenant(self):
        """Test academic overview returns NO_TENANT error (expected for demo user)"""
        response = requests.get(
            f"{BASE_URL}/api/education/academic?resource=overview",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        # Demo user has no tenant
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("code") == "NO_TENANT" or "tenant" in data.get("error", "").lower(), \
            f"Expected NO_TENANT error: {data}"
        print("✓ Academic API correctly returns NO_TENANT for demo user")


class TestGradesAPI:
    """Tests for /api/education/grades endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_grades_requires_auth(self):
        """Test that grades API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/grades?action=grade-scale")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Grades API requires authentication")
    
    def test_grades_scale_no_tenant(self):
        """Test grade scale endpoint - may work without tenant for config data"""
        response = requests.get(
            f"{BASE_URL}/api/education/grades?action=grade-scale",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        # Grade scale might work without tenant (config data) or return NO_TENANT
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, f"Expected success=true: {data}"
            assert "scale" in data, f"Expected scale in response: {data}"
            print(f"✓ Grade scale returned: {data.get('scale', {}).get('name', 'N/A')}")
        elif response.status_code == 400:
            data = response.json()
            assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT: {data}"
            print("✓ Grades API correctly returns NO_TENANT for demo user")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}: {response.text}")


class TestAttendanceAPI:
    """Tests for /api/education/attendance endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_attendance_requires_auth(self):
        """Test that attendance API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/attendance?action=overview")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Attendance API requires authentication")
    
    def test_attendance_overview_no_tenant(self):
        """Test attendance overview returns NO_TENANT error (expected for demo user)"""
        response = requests.get(
            f"{BASE_URL}/api/education/attendance?action=overview",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        # Demo user has no tenant
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("code") == "NO_TENANT" or "tenant" in data.get("error", "").lower(), \
            f"Expected NO_TENANT error: {data}"
        print("✓ Attendance API correctly returns NO_TENANT for demo user")


class TestFeesAPI:
    """Tests for /api/education/fees endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_fees_requires_auth(self):
        """Test that fees API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/fees?action=structures")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Fees API requires authentication")
    
    def test_fees_structures_no_tenant(self):
        """Test fees structures returns NO_TENANT error (expected for demo user)"""
        response = requests.get(
            f"{BASE_URL}/api/education/fees?action=structures",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        # Demo user has no tenant
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("code") == "NO_TENANT" or "tenant" in data.get("error", "").lower(), \
            f"Expected NO_TENANT error: {data}"
        print("✓ Fees API correctly returns NO_TENANT for demo user")


class TestReportCardsAPI:
    """Tests for /api/education/report-cards endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.token = data.get("sessionToken")
                self.cookies = response.cookies
            else:
                pytest.skip(f"Authentication failed: {data}")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if hasattr(self, 'token') and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_report_cards_requires_auth(self):
        """Test that report cards API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/report-cards?action=remark-suggestions&averageScore=75")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Report Cards API requires authentication")
    
    def test_report_cards_remark_suggestions_no_tenant(self):
        """Test remark suggestions - may work without tenant or return NO_TENANT"""
        response = requests.get(
            f"{BASE_URL}/api/education/report-cards?action=remark-suggestions&averageScore=75",
            headers=self.get_headers(),
            cookies=self.cookies
        )
        # Remark suggestions might work without tenant (config data) or return NO_TENANT
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, f"Expected success=true: {data}"
            assert "suggestions" in data, f"Expected suggestions in response: {data}"
            print(f"✓ Remark suggestions returned: {data.get('suggestions', [])}")
        elif response.status_code == 400:
            data = response.json()
            assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT: {data}"
            print("✓ Report Cards API correctly returns NO_TENANT for demo user")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
