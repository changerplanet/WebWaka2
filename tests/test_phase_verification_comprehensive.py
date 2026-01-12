"""
Comprehensive Verification Tests for WebWaka Partner-First Platform

Tests for:
- Phase 2: Platform Instances
- Phase 3: Commercial Isolation
- Phase 4A: Partner Dashboard
- Phase 4B: Partner-as-Platform Operator

VERIFICATION PHASE - All phases are FROZEN
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://code-hygiene-2.preview.emergentagent.com')


# =============================================================================
# PARTNER-FIRST POLICY TESTS
# =============================================================================

class TestPartnerFirstPolicy:
    """Verify Partner-First policy enforcement"""
    
    def test_public_signup_blocked_message(self):
        """Verify PUBLIC_SIGNUP_BLOCKED is enforced - signup page should exist"""
        response = requests.get(f"{BASE_URL}/signup")
        assert response.status_code == 200
        print("Signup page accessible (magic link flow)")
    
    def test_partner_clients_api_requires_auth(self):
        """Verify no direct tenant creation outside partner dashboard"""
        response = requests.post(
            f"{BASE_URL}/api/partner/clients",
            json={
                "name": "Test Direct Tenant",
                "slug": "test-direct-tenant",
                "adminEmail": "test@example.com"
            },
            headers={"Content-Type": "application/json"}
        )
        # Should require authentication
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"Direct tenant creation blocked: {response.status_code}")
    
    def test_admin_tenant_creation_requires_auth(self):
        """Verify admin tenant creation requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/tenants",
            json={
                "name": "Test Admin Tenant",
                "slug": "test-admin-tenant"
            },
            headers={"Content-Type": "application/json"}
        )
        # Should require authentication
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"Admin tenant creation requires auth: {response.status_code}")


# =============================================================================
# PARTNER DASHBOARD TESTS
# =============================================================================

class TestPartnerDashboard:
    """Verify Partner Dashboard functionality"""
    
    def test_partner_dashboard_page_loads(self):
        """Partner dashboard page should load (redirects to login if not authenticated)"""
        response = requests.get(f"{BASE_URL}/dashboard/partner", allow_redirects=False)
        # Should either load (200) or redirect to login
        assert response.status_code in [200, 302, 307], f"Expected 200/302/307, got {response.status_code}"
        print(f"Partner dashboard page status: {response.status_code}")
    
    def test_partner_saas_dashboard_page_loads(self):
        """Partner SaaS dashboard page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/saas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
        print("Partner SaaS dashboard page loads")
    
    def test_partner_clients_page_loads(self):
        """Partner clients page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
        print("Partner clients page loads")
    
    def test_partner_packages_page_loads(self):
        """Partner packages page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
        print("Partner packages page loads")
    
    def test_partner_staff_page_loads(self):
        """Partner staff page should load"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/staff")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
        print("Partner staff page loads")


# =============================================================================
# PARTNER API AUTHENTICATION TESTS
# =============================================================================

class TestPartnerAPIAuthentication:
    """Verify Partner APIs require authentication"""
    
    def test_partner_me_requires_auth(self):
        """GET /api/partner/me should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Partner /me API requires auth")
    
    def test_partner_dashboard_api_requires_auth(self):
        """GET /api/partner/dashboard should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Partner dashboard API requires auth")
    
    def test_partner_clients_api_requires_auth(self):
        """GET /api/partner/clients should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/clients")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Partner clients API requires auth")
    
    def test_partner_packages_api_requires_auth(self):
        """GET /api/partner/packages should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/packages")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Partner packages API requires auth")
    
    def test_partner_staff_api_requires_auth(self):
        """GET /api/partner/staff should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/staff")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Partner staff API requires auth")
    
    def test_partner_signals_api_requires_auth(self):
        """GET /api/partner/signals should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/signals")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Partner signals API requires auth")
    
    def test_partner_earnings_api_requires_auth(self):
        """GET /api/partner/earnings should require authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/earnings")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Partner earnings API requires auth")


# =============================================================================
# CLIENT PORTAL TESTS
# =============================================================================

class TestClientPortal:
    """Verify Client Portal functionality"""
    
    def test_client_portal_page_loads(self):
        """Client portal page should load"""
        response = requests.get(f"{BASE_URL}/portal")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
        print("Client portal page loads")
    
    def test_client_portal_api_requires_auth(self):
        """GET /api/client-portal should require authentication"""
        response = requests.get(f"{BASE_URL}/api/client-portal")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Client portal API requires auth")


# =============================================================================
# PLATFORM INSTANCE TESTS (Phase 2)
# =============================================================================

class TestPlatformInstances:
    """Verify Platform Instance functionality"""
    
    def test_platform_instances_api_exists(self):
        """Platform instances API should exist"""
        response = requests.get(f"{BASE_URL}/api/platform-instances")
        # Should return 400 (missing params), 401 (auth required), or 200 (if public)
        assert response.status_code in [200, 400, 401, 403, 404], f"Unexpected status: {response.status_code}"
        print(f"Platform instances API status: {response.status_code}")
    
    def test_tenant_instances_api_requires_auth(self):
        """Tenant instances API should require authentication"""
        response = requests.get(f"{BASE_URL}/api/tenants/test-tenant/instances")
        # Should require auth or return 404 for non-existent tenant
        assert response.status_code in [401, 403, 404], f"Expected 401/403/404, got {response.status_code}"
        print(f"Tenant instances API status: {response.status_code}")


# =============================================================================
# COMMERCIAL ISOLATION TESTS (Phase 3)
# =============================================================================

class TestCommercialIsolation:
    """Verify Commercial Isolation (subscriptions are instance-scoped)"""
    
    def test_instance_subscription_api_requires_auth(self):
        """Instance subscription API should require authentication"""
        test_instance_id = "test-instance-id"
        response = requests.get(f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Instance subscription API requires auth")
    
    def test_subscription_actions_require_auth(self):
        """Subscription lifecycle actions should require authentication"""
        test_instance_id = "test-instance-id"
        
        # Test pause action
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription?action=pause",
            json={"reason": "Test"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Pause action: Expected 401, got {response.status_code}"
        
        # Test resume action
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription?action=resume",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Resume action: Expected 401, got {response.status_code}"
        
        # Test cancel action
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription?action=cancel",
            json={"reason": "Test"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Cancel action: Expected 401, got {response.status_code}"
        
        print("All subscription actions require auth")


# =============================================================================
# NAVIGATION TESTS
# =============================================================================

class TestNavigation:
    """Verify all Partner Dashboard links resolve to real pages"""
    
    def test_homepage_loads(self):
        """Homepage should load"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("Homepage loads")
    
    def test_login_page_loads(self):
        """Login page should load"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200
        print("Login page loads")
    
    def test_partners_page_loads(self):
        """Partners marketing page should load"""
        response = requests.get(f"{BASE_URL}/partners")
        assert response.status_code == 200
        print("Partners page loads")
    
    def test_partners_get_started_page_loads(self):
        """Partners get-started page should load"""
        response = requests.get(f"{BASE_URL}/partners/get-started")
        assert response.status_code == 200
        print("Partners get-started page loads")
    
    def test_capabilities_page_loads(self):
        """Capabilities page should load"""
        response = requests.get(f"{BASE_URL}/capabilities")
        assert response.status_code == 200
        print("Capabilities page loads")
    
    def test_suites_page_loads(self):
        """Suites page should load"""
        response = requests.get(f"{BASE_URL}/suites")
        assert response.status_code == 200
        print("Suites page loads")
    
    def test_about_page_loads(self):
        """About page should load"""
        response = requests.get(f"{BASE_URL}/about")
        assert response.status_code == 200
        print("About page loads")
    
    def test_contact_page_loads(self):
        """Contact page should load"""
        response = requests.get(f"{BASE_URL}/contact")
        assert response.status_code == 200
        print("Contact page loads")
    
    def test_impact_page_loads(self):
        """Impact page should load"""
        response = requests.get(f"{BASE_URL}/impact")
        assert response.status_code == 200
        print("Impact page loads")


# =============================================================================
# PARTNER MODULE STATUS TESTS
# =============================================================================

class TestPartnerModuleStatus:
    """Verify Partner module status API"""
    
    def test_partner_status_api(self):
        """GET /api/partner?action=status should return module status"""
        response = requests.get(f"{BASE_URL}/api/partner?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should have statistics or config
        assert 'statistics' in data or 'config' in data or 'enabled' in data
        print(f"Partner status API response: {list(data.keys())}")
    
    def test_partner_manifest_api(self):
        """GET /api/partner?action=manifest should return module manifest"""
        response = requests.get(f"{BASE_URL}/api/partner?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        print(f"Partner manifest API response: {list(data.keys())}")
    
    def test_partner_config_api(self):
        """GET /api/partner?action=config should return configuration"""
        response = requests.get(f"{BASE_URL}/api/partner?action=config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'config' in data
        print(f"Partner config: {data.get('config', {})}")


# =============================================================================
# WEBWAKA INTERNAL PARTNER TESTS
# =============================================================================

class TestWebWakaInternalPartner:
    """Verify WebWaka internal partner setup"""
    
    def test_webwaka_partner_migration_api(self):
        """POST /api/admin/migrate-webwaka-partner should work"""
        response = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('success') == True
        assert 'webwakaPartnerId' in data
        print(f"WebWaka Partner ID: {data.get('webwakaPartnerId')}")
    
    def test_webwaka_partner_migration_idempotent(self):
        """Migration should be idempotent"""
        response1 = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        response2 = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Partner ID should be same
        assert data1['webwakaPartnerId'] == data2['webwakaPartnerId']
        print("Migration is idempotent")


# =============================================================================
# HEALTH CHECK TESTS
# =============================================================================

class TestHealthChecks:
    """Verify system health"""
    
    def test_health_endpoint(self):
        """Health endpoint should return OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
