"""
Test Super Admin Governance APIs
Tests for the 5 governance features:
1. Impersonation API
2. Partners Management API
3. Platform Health API
4. Financial Dashboard API
5. Error Logs API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://typefix.preview.emergentagent.com').rstrip('/')

class TestGovernanceAPIsUnauthenticated:
    """Test that all governance APIs require authentication (return 401)"""
    
    def test_impersonation_api_requires_auth(self):
        """GET /api/admin/impersonation should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/impersonation")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == False
        print(f"✓ Impersonation API returns 401 for unauthenticated requests")
    
    def test_impersonation_status_requires_auth(self):
        """GET /api/admin/impersonation?action=status should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/impersonation?action=status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Impersonation status API returns 401")
    
    def test_impersonation_logs_requires_auth(self):
        """GET /api/admin/impersonation?action=logs should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/impersonation?action=logs")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Impersonation logs API returns 401")
    
    def test_impersonation_post_requires_auth(self):
        """POST /api/admin/impersonation should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/impersonation",
            json={"action": "start", "targetType": "PARTNER", "targetId": "test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Impersonation POST API returns 401")
    
    def test_partners_api_requires_auth(self):
        """GET /api/admin/partners should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/partners")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == False
        print(f"✓ Partners API returns 401 for unauthenticated requests")
    
    def test_partners_post_requires_auth(self):
        """POST /api/admin/partners should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/partners",
            json={"action": "approve", "partnerId": "test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Partners POST API returns 401")
    
    def test_partner_detail_requires_auth(self):
        """GET /api/admin/partners/{id} should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/partners/test-partner-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Partner detail API returns 401")
    
    def test_health_api_requires_auth(self):
        """GET /api/admin/health should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/health")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == False
        print(f"✓ Health API returns 401 for unauthenticated requests")
    
    def test_financials_api_requires_auth(self):
        """GET /api/admin/financials should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/financials")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == False
        print(f"✓ Financials API returns 401 for unauthenticated requests")
    
    def test_errors_api_requires_auth(self):
        """GET /api/admin/errors should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/errors")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == False
        print(f"✓ Errors API returns 401 for unauthenticated requests")
    
    def test_errors_api_with_filters_requires_auth(self):
        """GET /api/admin/errors with filters should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/errors?severity=HIGH&timeRange=24h")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Errors API with filters returns 401")


class TestExistingAdminAPIs:
    """Test that existing admin APIs still work (no regression)"""
    
    def test_tenants_api_requires_auth(self):
        """GET /api/admin/tenants should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/tenants")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Tenants API still requires auth (no regression)")
    
    def test_users_api_requires_auth(self):
        """GET /api/admin/users should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Users API still requires auth (no regression)")
    
    def test_audit_logs_api_requires_auth(self):
        """GET /api/admin/audit-logs should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Audit logs API still requires auth (no regression)")


class TestFrontendPagesLoad:
    """Test that frontend pages load (return 200)"""
    
    def test_homepage_loads(self):
        """Homepage should load"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Homepage loads")
    
    def test_login_page_loads(self):
        """Login page should load"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Login page loads")
    
    def test_admin_page_loads(self):
        """Admin page should load (will redirect or show auth required)"""
        response = requests.get(f"{BASE_URL}/admin", allow_redirects=False)
        # Should either load (200) or redirect to login
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"✓ Admin page loads (status: {response.status_code})")
    
    def test_impersonation_page_loads(self):
        """Impersonation page should load"""
        response = requests.get(f"{BASE_URL}/admin/impersonation", allow_redirects=False)
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"✓ Impersonation page loads (status: {response.status_code})")
    
    def test_partners_page_loads(self):
        """Partners page should load"""
        response = requests.get(f"{BASE_URL}/admin/partners", allow_redirects=False)
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"✓ Partners page loads (status: {response.status_code})")
    
    def test_health_page_loads(self):
        """Health page should load"""
        response = requests.get(f"{BASE_URL}/admin/health", allow_redirects=False)
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"✓ Health page loads (status: {response.status_code})")
    
    def test_financials_page_loads(self):
        """Financials page should load"""
        response = requests.get(f"{BASE_URL}/admin/financials", allow_redirects=False)
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"✓ Financials page loads (status: {response.status_code})")
    
    def test_errors_page_loads(self):
        """Errors page should load"""
        response = requests.get(f"{BASE_URL}/admin/errors", allow_redirects=False)
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"✓ Errors page loads (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
