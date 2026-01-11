"""
Sites & Funnels Module - Phase 5 API Tests

Tests for:
- Authentication flow
- Templates API (works without tenant)
- Sites API (requires tenant)
- Funnels API (requires tenant)
- Template seeding
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://buildfix-6.preview.emergentagent.com').rstrip('/')

# Test credentials
DEMO_PARTNER_EMAIL = "demo.owner@webwaka.com"
DEMO_PARTNER_PASSWORD = "Demo2026!"


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_with_valid_credentials(self):
        """Test login with demo partner credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": DEMO_PARTNER_EMAIL,
            "password": DEMO_PARTNER_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Login not successful: {data}"
        assert "sessionToken" in data, "No session token returned"
        assert "userId" in data, "No user ID returned"
        print(f"✓ Login successful - userId: {data.get('userId')}")
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/v2", json={
            "action": "login-password",
            "identifier": DEMO_PARTNER_EMAIL,
            "password": "WrongPassword123!"
        })
        
        # Should return 401 or success=false
        data = response.json()
        assert data.get("success") == False or response.status_code == 401, "Should reject invalid credentials"
        print("✓ Invalid credentials correctly rejected")


class TestTemplatesAPI:
    """Templates API tests - should work without tenant"""
    
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
    
    def test_seed_templates(self):
        """Test seeding templates to database"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels/seed",
            cookies=self.cookies
        )
        
        # Seeding should work (may return success even if already seeded)
        assert response.status_code in [200, 201], f"Seed failed: {response.text}"
        data = response.json()
        print(f"✓ Template seeding response: {data}")
    
    def test_list_templates_without_tenant(self):
        """Test fetching templates - should work without tenant"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=templates",
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Templates fetch failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Templates not successful: {data}"
        
        # Check response structure
        assert "templates" in data, "No templates array in response"
        assert "total" in data, "No total count in response"
        assert "page" in data, "No page number in response"
        
        print(f"✓ Templates fetched successfully - count: {data.get('total', 0)}")
        
        # If templates exist, verify structure
        if data.get("templates"):
            template = data["templates"][0]
            assert "id" in template, "Template missing id"
            assert "name" in template, "Template missing name"
            assert "slug" in template, "Template missing slug"
            print(f"  First template: {template.get('name')} ({template.get('slug')})")
    
    def test_list_templates_with_category_filter(self):
        """Test fetching templates with category filter"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=templates&category=landing-pages",
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Templates fetch failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Templates not successful: {data}"
        print(f"✓ Templates with category filter - count: {data.get('total', 0)}")
    
    def test_list_templates_with_industry_filter(self):
        """Test fetching templates with industry filter"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=templates&industry=healthcare",
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Templates fetch failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Templates not successful: {data}"
        print(f"✓ Templates with industry filter - count: {data.get('total', 0)}")


class TestSitesAPINoTenant:
    """Sites API tests - user without tenant should get proper error"""
    
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
    
    def test_list_sites_without_tenant_returns_error(self):
        """Test that listing sites without tenant returns NO_TENANT error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=list",
            cookies=self.cookies
        )
        
        # Should return 400 with NO_TENANT code
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT code, got: {data.get('code')}"
        assert "error" in data, "Should have error message"
        print(f"✓ Sites list correctly returns NO_TENANT error: {data.get('error')}")
    
    def test_get_site_without_tenant_returns_error(self):
        """Test that getting a site without tenant returns error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/sites?action=get&siteId=test-id",
            cookies=self.cookies
        )
        
        # Should return 400 with NO_TENANT code
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT code, got: {data.get('code')}"
        print("✓ Get site correctly returns NO_TENANT error")
    
    def test_create_site_without_tenant_returns_error(self):
        """Test that creating a site without tenant returns error"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels/sites",
            json={
                "action": "create-site",
                "name": "Test Site",
                "slug": "test-site"
            },
            cookies=self.cookies
        )
        
        # Should return 400 with tenant required error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        print(f"✓ Create site correctly returns error: {data.get('error')}")


class TestFunnelsAPINoTenant:
    """Funnels API tests - user without tenant should get proper error"""
    
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
    
    def test_list_funnels_without_tenant_returns_error(self):
        """Test that listing funnels without tenant returns error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/funnels?action=list",
            cookies=self.cookies
        )
        
        # Should return 400 with tenant required error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        print(f"✓ Funnels list correctly returns error: {data.get('error')}")
    
    def test_create_funnel_without_tenant_returns_error(self):
        """Test that creating a funnel without tenant returns error"""
        response = requests.post(
            f"{BASE_URL}/api/sites-funnels/funnels",
            json={
                "action": "create-funnel",
                "name": "Test Funnel",
                "slug": "test-funnel",
                "goalType": "lead"
            },
            cookies=self.cookies
        )
        
        # Should return 400 with tenant required error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        print(f"✓ Create funnel correctly returns error: {data.get('error')}")


class TestAIContentAPINoTenant:
    """AI Content API tests - user without tenant should get proper error"""
    
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
    
    def test_ai_content_history_without_tenant_returns_error(self):
        """Test that AI content history without tenant returns NO_TENANT error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/ai-content?action=history",
            cookies=self.cookies
        )
        
        # Should return 400 with NO_TENANT code
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT code, got: {data.get('code')}"
        print(f"✓ AI Content history correctly returns NO_TENANT error: {data.get('error')}")


class TestDomainsAPINoTenant:
    """Domains API tests - user without tenant should get proper error"""
    
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
    
    def test_domains_list_without_tenant_returns_error(self):
        """Test that domains list without tenant returns NO_TENANT error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/domains?action=list&siteId=test",
            cookies=self.cookies
        )
        
        # Should return 400 with NO_TENANT code
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT code, got: {data.get('code')}"
        print(f"✓ Domains list correctly returns NO_TENANT error: {data.get('error')}")


class TestAnalyticsAPINoTenant:
    """Analytics API tests - user without tenant should get proper error"""
    
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
    
    def test_analytics_site_without_tenant_returns_error(self):
        """Test that analytics without tenant returns NO_TENANT error"""
        response = requests.get(
            f"{BASE_URL}/api/sites-funnels/analytics?action=site&siteId=test",
            cookies=self.cookies
        )
        
        # Should return 400 with NO_TENANT code
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        assert data.get("code") == "NO_TENANT", f"Expected NO_TENANT code, got: {data.get('code')}"
        print(f"✓ Analytics correctly returns NO_TENANT error: {data.get('error')}")


class TestUnauthorizedAccess:
    """Test unauthorized access to APIs"""
    
    def test_templates_without_auth_returns_401(self):
        """Test that templates API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/sites?action=templates")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert data.get("success") == False, "Should not be successful"
        print("✓ Templates API correctly requires authentication")
    
    def test_sites_without_auth_returns_401(self):
        """Test that sites API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/sites?action=list")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Sites API correctly requires authentication")
    
    def test_funnels_without_auth_returns_401(self):
        """Test that funnels API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/funnels?action=list")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Funnels API correctly requires authentication")
    
    def test_ai_content_without_auth_returns_401(self):
        """Test that AI content API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/ai-content?action=history")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ AI Content API correctly requires authentication")
    
    def test_domains_without_auth_returns_401(self):
        """Test that domains API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/domains?action=list&siteId=test")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Domains API correctly requires authentication")
    
    def test_analytics_without_auth_returns_401(self):
        """Test that analytics API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sites-funnels/analytics?action=site&siteId=test")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Analytics API correctly requires authentication")
    
    def test_seed_without_auth_returns_401(self):
        """Test that seed API requires authentication (or is public)"""
        response = requests.post(f"{BASE_URL}/api/sites-funnels/seed")
        
        # Seed might be public or require auth - just check it doesn't crash
        assert response.status_code in [200, 401, 403], f"Unexpected status: {response.status_code}"
        print(f"✓ Seed API returns status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
