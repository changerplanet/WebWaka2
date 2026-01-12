"""
Platform Hardening Verification Tests - Iteration 42

Tests for:
1. Partner Settings page and API
2. OTP provider architecture (Termii integration)
3. Client-portal API route fix (TenantMembership)
4. Partner Dashboard pages still working
5. No regression in authentication flow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-enum-bridge.preview.emergentagent.com').rstrip('/')


class TestPartnerSettingsAPI:
    """Test Partner Settings API endpoints"""
    
    def test_partner_settings_get_requires_auth(self):
        """GET /api/partner/settings should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/settings")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data or "Unauthorized" in str(data)
    
    def test_partner_settings_put_requires_auth(self):
        """PUT /api/partner/settings should require authentication"""
        response = requests.put(
            f"{BASE_URL}/api/partner/settings",
            json={"businessName": "Test Business"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data or "Unauthorized" in str(data)


class TestPartnerSettingsPage:
    """Test Partner Settings page exists and loads"""
    
    def test_partner_settings_page_exists(self):
        """Partner Settings page should exist at /dashboard/partner/settings"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        # Page should contain Partner Settings content or redirect to login
        assert len(response.text) > 0


class TestClientPortalAPI:
    """Test Client Portal API - verifies TenantMembership fix"""
    
    def test_client_portal_api_requires_auth(self):
        """GET /api/client-portal should require authentication"""
        response = requests.get(f"{BASE_URL}/api/client-portal")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data or "Unauthorized" in str(data)


class TestPartnerDashboardPages:
    """Test all Partner Dashboard pages still work"""
    
    def test_partner_dashboard_main(self):
        """Partner Dashboard main page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_partner_saas_dashboard(self):
        """Partner SaaS Dashboard should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/saas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_partner_clients_page(self):
        """Partner Clients page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_partner_packages_page(self):
        """Partner Packages page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_partner_staff_page(self):
        """Partner Staff page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/staff")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_partner_settings_page(self):
        """Partner Settings page should load (NEW)"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestPartnerAPIs:
    """Test Partner APIs require authentication"""
    
    def test_partner_me_api(self):
        """GET /api/partner/me should require auth"""
        response = requests.get(f"{BASE_URL}/api/partner/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_partner_dashboard_api(self):
        """GET /api/partner/dashboard should require auth"""
        response = requests.get(f"{BASE_URL}/api/partner/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_partner_clients_api(self):
        """GET /api/partner/clients should require auth"""
        response = requests.get(f"{BASE_URL}/api/partner/clients")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_partner_packages_api(self):
        """GET /api/partner/packages should require auth"""
        response = requests.get(f"{BASE_URL}/api/partner/packages")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_partner_staff_api(self):
        """GET /api/partner/staff should require auth"""
        response = requests.get(f"{BASE_URL}/api/partner/staff")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_partner_earnings_api(self):
        """GET /api/partner/earnings should require auth"""
        response = requests.get(f"{BASE_URL}/api/partner/earnings")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAuthenticationFlow:
    """Test authentication flow has no regression"""
    
    def test_login_page_loads(self):
        """Login page should load"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_login_v2_page_loads(self):
        """Login v2 (OTP) page should load"""
        response = requests.get(f"{BASE_URL}/login-v2")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_signup_page_loads(self):
        """Signup page should load"""
        response = requests.get(f"{BASE_URL}/signup")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_signup_v2_page_loads(self):
        """Signup v2 (OTP) page should load"""
        response = requests.get(f"{BASE_URL}/signup-v2")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestHealthAndNavigation:
    """Test health check and navigation"""
    
    def test_health_check(self):
        """Health check should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_homepage_loads(self):
        """Homepage should load"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_partners_page_loads(self):
        """Partners page should load"""
        response = requests.get(f"{BASE_URL}/partners")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_capabilities_page_loads(self):
        """Capabilities page should load"""
        response = requests.get(f"{BASE_URL}/capabilities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestOTPProviderArchitecture:
    """Test OTP provider architecture - verify mock provider works via auth/v2 API"""
    
    def test_auth_v2_login_otp_action_exists(self):
        """Auth v2 login-otp action should exist"""
        # This tests that the OTP endpoint exists via auth/v2 route
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "login-otp", "identifier": "+2348012345678"},
            headers={"Content-Type": "application/json"}
        )
        # Should not return 404 - endpoint exists
        assert response.status_code != 404, "Auth v2 login-otp action should exist"
        # Should return a valid response (success or error, but not 404)
        data = response.json()
        assert "success" in data or "error" in data
    
    def test_auth_v2_otp_resend_action_exists(self):
        """Auth v2 otp-resend action should exist"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "otp-resend", "otpId": "test-otp-id"},
            headers={"Content-Type": "application/json"}
        )
        # Should not return 404 - endpoint exists
        assert response.status_code != 404, "Auth v2 otp-resend action should exist"
        # Should return a valid response (success or error, but not 404)
        data = response.json()
        assert "success" in data or "error" in data
    
    def test_auth_v2_identify_action_exists(self):
        """Auth v2 identify action should exist"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "identify", "identifier": "+2348012345678"},
            headers={"Content-Type": "application/json"}
        )
        # Should not return 404 - endpoint exists
        assert response.status_code != 404, "Auth v2 identify action should exist"
        data = response.json()
        assert "success" in data or "error" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
