"""
Phase 4B: Partner-as-SaaS Operator Experience Tests

Tests for:
- Partner SaaS Dashboard API (GET /api/partner/dashboard)
- Partner Packages API (GET/POST /api/partner/packages)
- Partner Staff API (GET /api/partner/staff)
- Partner Signals API (GET /api/partner/signals)
- Client Subscription API (GET /api/partner/clients/[id]/subscription)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://typefix.preview.emergentagent.com')


class TestPartnerDashboardAPI:
    """Tests for Partner SaaS Dashboard API"""
    
    def test_dashboard_unauthenticated_returns_401(self):
        """GET /api/partner/dashboard without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/partner/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'error' in data or 'message' in data
    
    def test_dashboard_endpoint_exists(self):
        """Verify dashboard endpoint exists and responds"""
        response = requests.get(f"{BASE_URL}/api/partner/dashboard")
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestPartnerPackagesAPI:
    """Tests for Partner Packages API"""
    
    def test_packages_list_unauthenticated_returns_401(self):
        """GET /api/partner/packages without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/partner/packages")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'error' in data
    
    def test_packages_create_unauthenticated_returns_401(self):
        """POST /api/partner/packages without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/partner/packages",
            json={
                "name": "Test Package",
                "priceMonthly": 50000
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_packages_endpoint_exists(self):
        """Verify packages endpoint exists and responds"""
        response = requests.get(f"{BASE_URL}/api/partner/packages")
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestPartnerStaffAPI:
    """Tests for Partner Staff API"""
    
    def test_staff_list_unauthenticated_returns_401(self):
        """GET /api/partner/staff without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/partner/staff")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'error' in data
    
    def test_staff_add_unauthenticated_returns_401(self):
        """POST /api/partner/staff without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/partner/staff",
            json={
                "userId": "test-user-id",
                "role": "PARTNER_STAFF"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_staff_endpoint_exists(self):
        """Verify staff endpoint exists and responds"""
        response = requests.get(f"{BASE_URL}/api/partner/staff")
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestPartnerSignalsAPI:
    """Tests for Partner Expansion Signals API"""
    
    def test_signals_unauthenticated_returns_401(self):
        """GET /api/partner/signals without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/partner/signals")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'error' in data
    
    def test_signals_endpoint_exists(self):
        """Verify signals endpoint exists and responds"""
        response = requests.get(f"{BASE_URL}/api/partner/signals")
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestClientSubscriptionAPI:
    """Tests for Client Subscription Lifecycle API"""
    
    def test_subscription_get_unauthenticated_returns_401(self):
        """GET /api/partner/clients/[id]/subscription without auth should return 401"""
        test_instance_id = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"  # Known test instance
        response = requests.get(f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_subscription_start_unauthenticated_returns_401(self):
        """POST /api/partner/clients/[id]/subscription without auth should return 401"""
        test_instance_id = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription",
            json={
                "customPricing": {
                    "amount": 50000,
                    "billingInterval": "monthly"
                }
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_subscription_pause_unauthenticated_returns_401(self):
        """POST /api/partner/clients/[id]/subscription?action=pause without auth should return 401"""
        test_instance_id = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription?action=pause",
            json={"reason": "Test pause"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_subscription_resume_unauthenticated_returns_401(self):
        """POST /api/partner/clients/[id]/subscription?action=resume without auth should return 401"""
        test_instance_id = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription?action=resume",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_subscription_cancel_unauthenticated_returns_401(self):
        """POST /api/partner/clients/[id]/subscription?action=cancel without auth should return 401"""
        test_instance_id = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
        response = requests.post(
            f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription?action=cancel",
            json={"reason": "Test cancel"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
    
    def test_subscription_endpoint_exists(self):
        """Verify subscription endpoint exists and responds"""
        test_instance_id = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
        response = requests.get(f"{BASE_URL}/api/partner/clients/{test_instance_id}/subscription")
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestAPIErrorHandling:
    """Tests for API error handling"""
    
    def test_packages_invalid_json_returns_error(self):
        """POST /api/partner/packages with invalid JSON should handle gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/partner/packages",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 (auth check first) or 400 (bad request)
        assert response.status_code in [400, 401], f"Expected 400/401, got {response.status_code}"
    
    def test_staff_invalid_json_returns_error(self):
        """POST /api/partner/staff with invalid JSON should handle gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/partner/staff",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 (auth check first) or 400 (bad request)
        assert response.status_code in [400, 401], f"Expected 400/401, got {response.status_code}"


class TestUIPageRoutes:
    """Tests for UI page routes"""
    
    def test_saas_dashboard_page_loads(self):
        """GET /dashboard/partner/saas should return 200"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/saas")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
    
    def test_packages_page_loads(self):
        """GET /dashboard/partner/packages should return 200"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')
    
    def test_staff_page_loads(self):
        """GET /dashboard/partner/staff should return 200"""
        response = requests.get(f"{BASE_URL}/dashboard/partner/staff")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/html' in response.headers.get('content-type', '')


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
