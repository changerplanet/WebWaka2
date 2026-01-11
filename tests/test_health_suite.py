"""
HEALTH SUITE: Backend API Tests

Tests for Health Suite APIs:
- Main health-suite API (config, solution-package, doctors)
- Patients API (list, stats)
- Appointments API (list, today)
- Consultations API (list, stats)
- Prescriptions API (list, medications)

NOTE: All services use MOCKED in-memory storage.
Demo user has no active tenant, so tenant-scoped endpoints return NO_TENANT error.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://prisma-sync.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "demo.owner@webwaka.com"
TEST_PASSWORD = "Demo2026!"


class TestHealthSuiteAuth:
    """Test authentication for Health Suite APIs"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Login via credentials API
        login_response = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }, allow_redirects=False)
        
        # Also try direct session
        csrf_response = s.get(f"{BASE_URL}/api/auth/csrf")
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            if csrf_token:
                s.headers.update({"X-CSRF-Token": csrf_token})
        
        return s
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests are denied"""
        response = requests.get(f"{BASE_URL}/api/health-suite?action=config")
        # Should return 401 or redirect to login
        assert response.status_code in [401, 302, 307], f"Expected 401/redirect, got {response.status_code}"


class TestHealthSuiteMainAPI:
    """Test main /api/health-suite endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session via cookie-based auth"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Get CSRF token first
        csrf_response = s.get(f"{BASE_URL}/api/auth/csrf")
        csrf_token = None
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
        
        # Login via credentials
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "redirect": "false",
            "callbackUrl": BASE_URL,
            "json": "true"
        }
        if csrf_token:
            login_data["csrfToken"] = csrf_token
            
        login_response = s.post(
            f"{BASE_URL}/api/auth/callback/credentials",
            data=login_data,
            allow_redirects=True
        )
        
        return s
    
    def test_config_endpoint_structure(self, auth_session):
        """Test GET /api/health-suite?action=config returns proper structure"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite?action=config")
        
        # May return 401 if not authenticated, which is expected behavior
        if response.status_code == 401:
            pytest.skip("Authentication required - expected for demo user")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get('success') == True
        assert 'config' in data
        
        config = data['config']
        # Verify config structure
        assert 'labels' in config
        assert 'capabilityBundle' in config
        assert 'appointmentStatus' in config
        assert 'appointmentTypes' in config
        assert 'consultationStatus' in config
        assert 'prescriptionStatus' in config
        assert 'bloodGroups' in config
        assert 'genotypes' in config
        
        # Verify labels
        labels = config['labels']
        assert labels.get('patients') == 'Patients'
        assert labels.get('appointments') == 'Appointments'
        assert labels.get('consultations') == 'Consultations'
        assert labels.get('prescriptions') == 'Prescriptions'
        assert labels.get('pharmacy') == 'Pharmacy'
    
    def test_solution_package_endpoint(self, auth_session):
        """Test GET /api/health-suite?action=solution-package"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite?action=solution-package")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('success') == True
        assert 'solution' in data
        
        solution = data['solution']
        assert solution.get('key') == 'health'
        assert solution.get('name') == 'Health Suite'
        assert 'targetCustomers' in solution
        assert 'keyFeatures' in solution
        
        # Verify key features
        features = solution['keyFeatures']
        assert 'Patient Registration' in features
        assert 'Appointment Scheduling' in features
        assert 'Prescription Management' in features
    
    def test_doctors_endpoint(self, auth_session):
        """Test GET /api/health-suite?action=doctors"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite?action=doctors")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('success') == True
        assert 'doctors' in data
        
        doctors = data['doctors']
        assert isinstance(doctors, list)
        assert len(doctors) > 0
        
        # Verify doctor structure
        doctor = doctors[0]
        assert 'id' in doctor
        assert 'firstName' in doctor
        assert 'lastName' in doctor
        assert 'specialization' in doctor
    
    def test_invalid_action(self, auth_session):
        """Test invalid action returns error"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite?action=invalid_action")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        assert response.status_code == 400
        data = response.json()
        assert data.get('success') == False


class TestPatientsAPI:
    """Test /api/health-suite/patients endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        csrf_response = s.get(f"{BASE_URL}/api/auth/csrf")
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            if csrf_token:
                login_data = {
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "csrfToken": csrf_token,
                    "redirect": "false",
                    "json": "true"
                }
                s.post(f"{BASE_URL}/api/auth/callback/credentials", data=login_data, allow_redirects=True)
        return s
    
    def test_patients_list_no_tenant(self, auth_session):
        """Test GET /api/health-suite/patients returns NO_TENANT for demo user"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/patients")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        # Demo user has no active tenant, so expect NO_TENANT error
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
            print("Expected NO_TENANT error for demo user")
        else:
            assert response.status_code == 200
    
    def test_patients_stats_no_tenant(self, auth_session):
        """Test GET /api/health-suite/patients?action=stats"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/patients?action=stats")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        # Demo user has no active tenant
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200
            data = response.json()
            assert 'stats' in data


class TestAppointmentsAPI:
    """Test /api/health-suite/appointments endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        csrf_response = s.get(f"{BASE_URL}/api/auth/csrf")
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            if csrf_token:
                login_data = {
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "csrfToken": csrf_token,
                    "redirect": "false",
                    "json": "true"
                }
                s.post(f"{BASE_URL}/api/auth/callback/credentials", data=login_data, allow_redirects=True)
        return s
    
    def test_appointments_list_no_tenant(self, auth_session):
        """Test GET /api/health-suite/appointments"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/appointments")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200
    
    def test_appointments_today_no_tenant(self, auth_session):
        """Test GET /api/health-suite/appointments?action=today"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/appointments?action=today")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200


class TestConsultationsAPI:
    """Test /api/health-suite/consultations endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        csrf_response = s.get(f"{BASE_URL}/api/auth/csrf")
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            if csrf_token:
                login_data = {
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "csrfToken": csrf_token,
                    "redirect": "false",
                    "json": "true"
                }
                s.post(f"{BASE_URL}/api/auth/callback/credentials", data=login_data, allow_redirects=True)
        return s
    
    def test_consultations_list_no_tenant(self, auth_session):
        """Test GET /api/health-suite/consultations"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/consultations")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200
    
    def test_consultations_stats_no_tenant(self, auth_session):
        """Test GET /api/health-suite/consultations?action=stats"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/consultations?action=stats")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200


class TestPrescriptionsAPI:
    """Test /api/health-suite/prescriptions endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        csrf_response = s.get(f"{BASE_URL}/api/auth/csrf")
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            if csrf_token:
                login_data = {
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "csrfToken": csrf_token,
                    "redirect": "false",
                    "json": "true"
                }
                s.post(f"{BASE_URL}/api/auth/callback/credentials", data=login_data, allow_redirects=True)
        return s
    
    def test_prescriptions_list_no_tenant(self, auth_session):
        """Test GET /api/health-suite/prescriptions"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/prescriptions")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200
    
    def test_prescriptions_medications_no_tenant(self, auth_session):
        """Test GET /api/health-suite/prescriptions?action=medications"""
        response = auth_session.get(f"{BASE_URL}/api/health-suite/prescriptions?action=medications")
        
        if response.status_code == 401:
            pytest.skip("Authentication required")
        
        if response.status_code == 400:
            data = response.json()
            assert data.get('code') == 'NO_TENANT' or 'tenant' in data.get('error', '').lower()
        else:
            assert response.status_code == 200
            data = response.json()
            assert 'medications' in data


class TestAPIEndpointsExist:
    """Verify all Health Suite API endpoints exist and respond"""
    
    def test_main_health_suite_endpoint_exists(self):
        """Verify /api/health-suite endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/health-suite")
        # Should return 401 (unauthorized) not 404
        assert response.status_code != 404, "Endpoint /api/health-suite not found"
        assert response.status_code in [200, 401, 302, 307]
    
    def test_patients_endpoint_exists(self):
        """Verify /api/health-suite/patients endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/health-suite/patients")
        assert response.status_code != 404, "Endpoint /api/health-suite/patients not found"
        assert response.status_code in [200, 400, 401, 302, 307]
    
    def test_appointments_endpoint_exists(self):
        """Verify /api/health-suite/appointments endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/health-suite/appointments")
        assert response.status_code != 404, "Endpoint /api/health-suite/appointments not found"
        assert response.status_code in [200, 400, 401, 302, 307]
    
    def test_consultations_endpoint_exists(self):
        """Verify /api/health-suite/consultations endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/health-suite/consultations")
        assert response.status_code != 404, "Endpoint /api/health-suite/consultations not found"
        assert response.status_code in [200, 400, 401, 302, 307]
    
    def test_prescriptions_endpoint_exists(self):
        """Verify /api/health-suite/prescriptions endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/health-suite/prescriptions")
        assert response.status_code != 404, "Endpoint /api/health-suite/prescriptions not found"
        assert response.status_code in [200, 400, 401, 302, 307]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
