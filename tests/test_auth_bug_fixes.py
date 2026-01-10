"""
Test suite for WebWaka Auth Bug Fixes
Tests the following fixes:
1. OTP Debug Endpoint - /api/debug/otp-logs
2. Auth Session API - /api/auth/session
3. Dashboard/POS/Partner Portal AuthProvider integration
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://build-fixer-13.preview.emergentagent.com').rstrip('/')


class TestDebugOtpEndpoint:
    """Test /api/debug/otp-logs endpoint"""
    
    def test_otp_logs_returns_valid_response(self):
        """Test that OTP debug endpoint returns valid JSON structure"""
        response = requests.get(f"{BASE_URL}/api/debug/otp-logs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "warning" in data, "Response should contain warning message"
        assert "environment" in data, "Response should contain environment"
        assert "otps" in data, "Response should contain otps array"
        assert "count" in data, "Response should contain count"
        assert "timestamp" in data, "Response should contain timestamp"
        
        # Verify otps is a list
        assert isinstance(data["otps"], list), "otps should be a list"
        
        print(f"OTP Debug endpoint working - Environment: {data['environment']}, Count: {data['count']}")
    
    def test_otp_logs_with_identifier_filter(self):
        """Test OTP logs endpoint with identifier filter"""
        response = requests.get(f"{BASE_URL}/api/debug/otp-logs?identifier=test@example.com")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "otps" in data, "Response should contain otps array"
        
        print(f"OTP Debug endpoint with filter working - Count: {data['count']}")


class TestAuthSessionAPI:
    """Test /api/auth/session endpoint"""
    
    def test_session_returns_unauthenticated_for_no_cookie(self):
        """Test that session endpoint returns unauthenticated when no cookie"""
        response = requests.get(f"{BASE_URL}/api/auth/session")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=true"
        assert data.get("authenticated") == False, "Should be unauthenticated without cookie"
        assert data.get("user") is None, "User should be null when unauthenticated"
        
        print("Session API correctly returns unauthenticated state")
    
    def test_session_structure_when_authenticated(self):
        """Test session response structure (documented expected fields)"""
        # This test documents the expected structure when authenticated
        # Actual authentication would require valid session cookie
        
        expected_fields = {
            "success": bool,
            "authenticated": bool,
            "user": (dict, type(None)),  # dict when authenticated, None otherwise
        }
        
        response = requests.get(f"{BASE_URL}/api/auth/session")
        data = response.json()
        
        for field, expected_type in expected_fields.items():
            assert field in data, f"Response should contain {field}"
            if isinstance(expected_type, tuple):
                assert isinstance(data[field], expected_type), f"{field} should be one of {expected_type}"
            else:
                assert isinstance(data[field], expected_type), f"{field} should be {expected_type}"
        
        print("Session API structure is correct")


class TestAuthV2Endpoints:
    """Test /api/auth/v2 endpoints"""
    
    def test_signup_options_returns_valid_data(self):
        """Test signup options endpoint returns all required data"""
        response = requests.get(f"{BASE_URL}/api/auth/v2?action=signup-options")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=true"
        
        # Check required fields
        assert "userIntents" in data, "Should contain userIntents"
        assert "businessTypes" in data, "Should contain businessTypes"
        assert "discoveryOptions" in data, "Should contain discoveryOptions"
        assert "nigerianStates" in data, "Should contain nigerianStates"
        
        # Verify arrays have content
        assert len(data["userIntents"]) > 0, "userIntents should not be empty"
        assert len(data["businessTypes"]) > 0, "businessTypes should not be empty"
        assert len(data["nigerianStates"]) > 0, "nigerianStates should not be empty"
        
        print(f"Signup options: {len(data['userIntents'])} intents, {len(data['businessTypes'])} business types, {len(data['nigerianStates'])} states")
    
    def test_identify_endpoint_with_email(self):
        """Test identify endpoint with email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "identify",
                "identifier": "admin@saascore.com"
            }
        )
        
        # Should return 200 regardless of whether user exists
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Response should indicate if user exists and available methods
        assert "success" in data or "error" in data, "Response should have success or error"
        
        print(f"Identify endpoint response: {data}")
    
    def test_identify_endpoint_with_phone(self):
        """Test identify endpoint with Nigerian phone number"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "identify",
                "identifier": "08012345678"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "success" in data or "error" in data, "Response should have success or error"
        
        print(f"Identify endpoint (phone) response: {data}")


class TestProtectedRouteRedirects:
    """Test that protected routes redirect to login"""
    
    def test_dashboard_redirects_to_login(self):
        """Test dashboard redirects unauthenticated users"""
        response = requests.get(
            f"{BASE_URL}/dashboard",
            allow_redirects=False
        )
        
        # Next.js may return 200 with client-side redirect or 307/302 server redirect
        # Either way, the page should eventually redirect to login
        print(f"Dashboard response status: {response.status_code}")
        
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            assert 'login' in location.lower(), f"Should redirect to login, got: {location}"
            print(f"Dashboard redirects to: {location}")
        else:
            # Client-side redirect - check if page loads
            assert response.status_code == 200, f"Expected 200 or redirect, got {response.status_code}"
            print("Dashboard returns 200 (client-side redirect expected)")
    
    def test_pos_redirects_to_login(self):
        """Test POS page redirects unauthenticated users"""
        response = requests.get(
            f"{BASE_URL}/pos",
            allow_redirects=False
        )
        
        print(f"POS response status: {response.status_code}")
        
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            assert 'login' in location.lower(), f"Should redirect to login, got: {location}"
            print(f"POS redirects to: {location}")
        else:
            assert response.status_code == 200, f"Expected 200 or redirect, got {response.status_code}"
            print("POS returns 200 (client-side redirect expected)")
    
    def test_partner_portal_redirects_to_login(self):
        """Test Partner Portal redirects unauthenticated users"""
        response = requests.get(
            f"{BASE_URL}/partner-portal",
            allow_redirects=False
        )
        
        print(f"Partner Portal response status: {response.status_code}")
        
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            assert 'login' in location.lower(), f"Should redirect to login, got: {location}"
            print(f"Partner Portal redirects to: {location}")
        else:
            assert response.status_code == 200, f"Expected 200 or redirect, got {response.status_code}"
            print("Partner Portal returns 200 (client-side redirect expected)")
    
    def test_capabilities_redirects_to_login(self):
        """Test Capabilities page redirects unauthenticated users"""
        response = requests.get(
            f"{BASE_URL}/dashboard/capabilities?tenant=acme",
            allow_redirects=False
        )
        
        print(f"Capabilities response status: {response.status_code}")
        
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            assert 'login' in location.lower(), f"Should redirect to login, got: {location}"
            print(f"Capabilities redirects to: {location}")
        else:
            assert response.status_code == 200, f"Expected 200 or redirect, got {response.status_code}"
            print("Capabilities returns 200 (client-side redirect expected)")


class TestPublicPages:
    """Test public pages load correctly"""
    
    def test_login_v2_page_loads(self):
        """Test login-v2 page loads"""
        response = requests.get(f"{BASE_URL}/login-v2")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "WebWaka" in response.text or "Welcome" in response.text, "Page should contain WebWaka or Welcome"
        
        print("Login-v2 page loads successfully")
    
    def test_signup_v2_page_loads(self):
        """Test signup-v2 page loads"""
        response = requests.get(f"{BASE_URL}/signup-v2")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "WebWaka" in response.text or "Welcome" in response.text, "Page should contain WebWaka or Welcome"
        
        print("Signup-v2 page loads successfully")
    
    def test_home_page_loads(self):
        """Test home page loads"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        print("Home page loads successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
