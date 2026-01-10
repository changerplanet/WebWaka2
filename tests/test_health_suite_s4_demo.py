"""
Health Suite S4 Demo Testing
Tests for /api/health/demo endpoint and related Health APIs

Features tested:
- /api/health/demo endpoint returns 401 when unauthenticated
- All Health API endpoints return 401 when unauthenticated
- Demo page loads (status 200)

Note: UI content tests are done via Playwright browser automation
since the page is client-side rendered ('use client').
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthDemoAPI:
    """Health Demo API endpoint tests"""
    
    def test_demo_endpoint_returns_401_unauthenticated(self):
        """POST /api/health/demo should return 401 when unauthenticated"""
        response = requests.post(
            f"{BASE_URL}/api/health/demo",
            json={"action": "seed"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data or "Unauthorized" in str(data), "Expected error message"
        print(f"SUCCESS: /api/health/demo returns 401 for unauthenticated requests")
    
    def test_demo_endpoint_clear_returns_401_unauthenticated(self):
        """POST /api/health/demo with action=clear should return 401 when unauthenticated"""
        response = requests.post(
            f"{BASE_URL}/api/health/demo",
            json={"action": "clear"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/demo (clear) returns 401 for unauthenticated requests")
    
    def test_demo_endpoint_reset_returns_401_unauthenticated(self):
        """POST /api/health/demo with action=reset should return 401 when unauthenticated"""
        response = requests.post(
            f"{BASE_URL}/api/health/demo",
            json={"action": "reset"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/demo (reset) returns 401 for unauthenticated requests")


class TestHealthDemoPage:
    """Health Demo Page basic tests"""
    
    def test_health_demo_page_loads(self):
        """GET /health-demo should return 200"""
        response = requests.get(f"{BASE_URL}/health-demo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"SUCCESS: /health-demo page loads with status 200")
    
    def test_health_demo_page_contains_health_suite_script(self):
        """Page should load health-demo page.js script"""
        response = requests.get(f"{BASE_URL}/health-demo")
        assert response.status_code == 200
        assert "health-demo/page.js" in response.text, "Page should load health-demo page.js"
        print(f"SUCCESS: Page loads health-demo/page.js script")


class TestHealthAPIAuthGuards:
    """Health API authentication guard tests"""
    
    def test_health_config_returns_401_unauthenticated(self):
        """GET /api/health?action=config should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health?action=config")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health?action=config returns 401 for unauthenticated requests")
    
    def test_health_stats_returns_401_unauthenticated(self):
        """GET /api/health?action=stats should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health?action=stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health?action=stats returns 401 for unauthenticated requests")
    
    def test_health_patients_returns_401_unauthenticated(self):
        """GET /api/health/patients should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/patients")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/patients returns 401 for unauthenticated requests")
    
    def test_health_visits_returns_401_unauthenticated(self):
        """GET /api/health/visits should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/visits")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/visits returns 401 for unauthenticated requests")
    
    def test_health_encounters_returns_401_unauthenticated(self):
        """GET /api/health/encounters should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/encounters")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/encounters returns 401 for unauthenticated requests")
    
    def test_health_billing_facts_returns_401_unauthenticated(self):
        """GET /api/health/billing-facts should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/billing-facts")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/billing-facts returns 401 for unauthenticated requests")
    
    def test_health_providers_returns_401_unauthenticated(self):
        """GET /api/health/providers should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/providers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/providers returns 401 for unauthenticated requests")
    
    def test_health_facilities_returns_401_unauthenticated(self):
        """GET /api/health/facilities should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/facilities")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/facilities returns 401 for unauthenticated requests")
    
    def test_health_appointments_returns_401_unauthenticated(self):
        """GET /api/health/appointments should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/appointments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/appointments returns 401 for unauthenticated requests")
    
    def test_health_prescriptions_returns_401_unauthenticated(self):
        """GET /api/health/prescriptions should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/prescriptions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/prescriptions returns 401 for unauthenticated requests")
    
    def test_health_lab_orders_returns_401_unauthenticated(self):
        """GET /api/health/lab-orders should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/lab-orders")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/lab-orders returns 401 for unauthenticated requests")
    
    def test_health_guardians_returns_401_unauthenticated(self):
        """GET /api/health/guardians should return 401 when unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/health/guardians")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /api/health/guardians returns 401 for unauthenticated requests")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
