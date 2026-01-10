"""
Sites & Funnels Suite S2-S5 API Tests

Tests for the new suite overview API and admin dashboard:
- GET /api/sites-funnels-suite - Suite overview, stats, capabilities
- POST /api/sites-funnels-suite - get-config, get-capabilities actions
- Existing APIs: templates, sites, funnels (auth required)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-next-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
DEMO_PARTNER_EMAIL = "demo.owner@webwaka.com"
DEMO_PARTNER_PASSWORD = "Demo2026!"


class TestSuiteOverviewAPI:
    """Tests for GET /api/sites-funnels-suite - Suite overview endpoint"""
    
    def test_get_suite_overview_returns_success(self):
        """Test that suite overview returns success without auth"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        print("✓ Suite overview returns success")
    
    def test_get_suite_overview_returns_suite_name(self):
        """Test that suite overview returns correct suite name"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert data.get("suite") == "Sites & Funnels", f"Expected 'Sites & Funnels', got: {data.get('suite')}"
        print("✓ Suite name is 'Sites & Funnels'")
    
    def test_get_suite_overview_returns_version(self):
        """Test that suite overview returns version"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert "version" in data, "Missing version field"
        assert data.get("version") == "1.0.0", f"Expected version 1.0.0, got: {data.get('version')}"
        print(f"✓ Suite version: {data.get('version')}")
    
    def test_get_suite_overview_returns_demo_status(self):
        """Test that suite overview returns DEMO status"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert data.get("status") == "DEMO", f"Expected status DEMO, got: {data.get('status')}"
        print("✓ Suite status is DEMO")
    
    def test_get_suite_overview_returns_config(self):
        """Test that suite overview returns config object"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert "config" in data, "Missing config field"
        config = data.get("config")
        assert "name" in config, "Config missing name"
        assert "capabilities" in config, "Config missing capabilities"
        assert "routes" in config, "Config missing routes"
        assert "apis" in config, "Config missing apis"
        print("✓ Suite config structure is correct")
    
    def test_get_suite_overview_returns_stats(self):
        """Test that suite overview returns stats object"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert "stats" in data, "Missing stats field"
        stats = data.get("stats")
        assert "sites" in stats, "Stats missing sites"
        assert "funnels" in stats, "Stats missing funnels"
        assert "templates" in stats, "Stats missing templates"
        assert "ai" in stats, "Stats missing ai"
        print(f"✓ Suite stats: sites={stats['sites']['total']}, funnels={stats['funnels']['total']}")
    
    def test_get_suite_overview_returns_demo_info(self):
        """Test that suite overview returns demo info"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert "demo" in data, "Missing demo field"
        demo = data.get("demo")
        assert demo.get("isDemo") == True, "Expected isDemo=true"
        assert "message" in demo, "Demo missing message"
        assert demo.get("dataSource") == "Database (Prisma)", f"Expected Prisma, got: {demo.get('dataSource')}"
        print("✓ Demo info is correct")
    
    def test_get_suite_overview_returns_quick_links(self):
        """Test that suite overview returns quick links"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert "quickLinks" in data, "Missing quickLinks field"
        links = data.get("quickLinks")
        assert "createSite" in links, "Missing createSite link"
        assert "createFunnel" in links, "Missing createFunnel link"
        assert "templates" in links, "Missing templates link"
        print("✓ Quick links are present")
    
    def test_get_suite_overview_returns_session_info(self):
        """Test that suite overview returns session info"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        assert "session" in data, "Missing session field"
        session = data.get("session")
        assert "authenticated" in session, "Session missing authenticated"
        assert "hasTenant" in session, "Session missing hasTenant"
        # Without auth, should be false
        assert session.get("authenticated") == False, "Expected authenticated=false without auth"
        print("✓ Session info is correct (unauthenticated)")
    
    def test_get_suite_overview_capabilities_structure(self):
        """Test that capabilities have correct structure"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        capabilities = data.get("config", {}).get("capabilities", {})
        
        # Check all expected capability categories
        expected_categories = ["coreSites", "funnels", "domains", "analytics", "ai", "governance"]
        for cat in expected_categories:
            assert cat in capabilities, f"Missing capability category: {cat}"
            cap = capabilities[cat]
            assert "label" in cap, f"{cat} missing label"
            assert "coverage" in cap, f"{cat} missing coverage"
            assert "features" in cap, f"{cat} missing features"
            print(f"  ✓ {cap['label']}: {cap['coverage']}")
        
        print("✓ All capability categories present with correct structure")


class TestSuitePostActions:
    """Tests for POST /api/sites-funnels-suite - requires authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": DEMO_PARTNER_EMAIL,
            "password": DEMO_PARTNER_PASSWORD
        })
        data = response.json()
        self.session_token = data.get("sessionToken")
        self.cookies = {"session_token": self.session_token}
    
    def test_post_get_config_requires_auth(self):
        """Test that POST get-config requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels-suite",
            json={"action": "get-config"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST get-config correctly requires authentication")
    
    def test_post_get_config_with_auth(self):
        """Test POST get-config with authentication"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels-suite",
            json={"action": "get-config"},
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        assert "config" in data, "Missing config in response"
        print("✓ POST get-config returns config with auth")
    
    def test_post_get_capabilities_requires_auth(self):
        """Test that POST get-capabilities requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels-suite",
            json={"action": "get-capabilities"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST get-capabilities correctly requires authentication")
    
    def test_post_get_capabilities_with_auth(self):
        """Test POST get-capabilities with authentication"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels-suite",
            json={"action": "get-capabilities"},
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        assert "capabilities" in data, "Missing capabilities in response"
        assert "overallCoverage" in data, "Missing overallCoverage"
        print(f"✓ POST get-capabilities returns data - overall coverage: {data.get('overallCoverage')}")
    
    def test_post_invalid_action_returns_400(self):
        """Test that invalid action returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels-suite",
            json={"action": "invalid-action"},
            cookies=self.cookies
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert data.get("success") == False, "Expected success=false"
        print("✓ Invalid action correctly returns 400")


class TestExistingTemplatesAPI:
    """Tests for existing templates API - should work with auth"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": DEMO_PARTNER_EMAIL,
            "password": DEMO_PARTNER_PASSWORD
        })
        data = response.json()
        self.session_token = data.get("sessionToken")
        self.cookies = {"session_token": self.session_token}
    
    def test_templates_requires_auth(self):
        """Test that templates API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/sites?action=templates")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Templates API correctly requires authentication")
    
    def test_templates_with_auth(self):
        """Test templates API with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=templates",
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true: {data}"
        assert "templates" in data, "Missing templates array"
        assert "total" in data, "Missing total count"
        print(f"✓ Templates API returns {data.get('total', 0)} templates")


class TestExistingFunnelsAPI:
    """Tests for existing funnels API - requires auth and tenant"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": DEMO_PARTNER_EMAIL,
            "password": DEMO_PARTNER_PASSWORD
        })
        data = response.json()
        self.session_token = data.get("sessionToken")
        self.cookies = {"session_token": self.session_token}
    
    def test_funnels_list_requires_auth(self):
        """Test that funnels list requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/funnels?action=list")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Funnels API correctly requires authentication")
    
    def test_funnels_list_with_auth_no_tenant(self):
        """Test funnels list with auth but no tenant/capability returns error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/funnels?action=list",
            cookies=self.cookies
        )
        
        # Should return 400 (no tenant) or 403 (capability not enabled)
        assert response.status_code in [400, 403], f"Expected 400 or 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Expected success=false"
        print(f"✓ Funnels API correctly returns error ({response.status_code}): {data.get('error')}")


class TestExistingSitesAPI:
    """Tests for existing sites API - requires auth and tenant"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": DEMO_PARTNER_EMAIL,
            "password": DEMO_PARTNER_PASSWORD
        })
        data = response.json()
        self.session_token = data.get("sessionToken")
        self.cookies = {"session_token": self.session_token}
    
    def test_sites_list_requires_auth(self):
        """Test that sites list requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/sites?action=list")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Sites API correctly requires authentication")
    
    def test_sites_list_with_auth_no_tenant(self):
        """Test sites list with auth but no tenant/capability returns error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=list",
            cookies=self.cookies
        )
        
        # Should return 400 (no tenant) or 403 (capability not enabled)
        assert response.status_code in [400, 403], f"Expected 400 or 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Expected success=false"
        # Code could be NO_TENANT or capability error
        print(f"✓ Sites API correctly returns error ({response.status_code}): {data.get('error')}")


class TestCapabilityCoverage:
    """Tests to verify capability coverage percentages match expected values"""
    
    def test_core_sites_coverage(self):
        """Test Core Sites coverage is 95%"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        coverage = data.get("config", {}).get("capabilities", {}).get("coreSites", {}).get("coverage")
        assert coverage == "95%", f"Expected Core Sites 95%, got: {coverage}"
        print("✓ Core Sites coverage: 95%")
    
    def test_funnels_coverage(self):
        """Test Funnels coverage is 75%"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        coverage = data.get("config", {}).get("capabilities", {}).get("funnels", {}).get("coverage")
        assert coverage == "75%", f"Expected Funnels 75%, got: {coverage}"
        print("✓ Funnels coverage: 75%")
    
    def test_domains_coverage(self):
        """Test Domain & Branding coverage is 98%"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        coverage = data.get("config", {}).get("capabilities", {}).get("domains", {}).get("coverage")
        assert coverage == "98%", f"Expected Domains 98%, got: {coverage}"
        print("✓ Domain & Branding coverage: 98%")
    
    def test_analytics_coverage(self):
        """Test Analytics coverage is 80%"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        coverage = data.get("config", {}).get("capabilities", {}).get("analytics", {}).get("coverage")
        assert coverage == "80%", f"Expected Analytics 80%, got: {coverage}"
        print("✓ Analytics coverage: 80%")
    
    def test_ai_layer_coverage(self):
        """Test AI Layer coverage is 70%"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        coverage = data.get("config", {}).get("capabilities", {}).get("ai", {}).get("coverage")
        assert coverage == "70%", f"Expected AI Layer 70%, got: {coverage}"
        print("✓ AI Layer coverage: 70%")
    
    def test_governance_coverage(self):
        """Test Governance coverage is 90%"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels-suite")
        data = response.json()
        
        coverage = data.get("config", {}).get("capabilities", {}).get("governance", {}).get("coverage")
        assert coverage == "90%", f"Expected Governance 90%, got: {coverage}"
        print("✓ Governance coverage: 90%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
