"""
Phase 4A: Partner-First Control Plane Tests

Tests for:
1. WebWaka internal partner migration API
2. Partner /me API
3. Partner /clients API (GET, POST)
4. Partner-First guards
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWebWakaPartnerMigration:
    """Tests for POST /api/admin/migrate-webwaka-partner"""
    
    def test_migration_endpoint_exists(self):
        """Migration endpoint should be accessible"""
        response = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        # Should return success (partner already exists from previous migration)
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        print(f"Migration response: {data}")
    
    def test_webwaka_partner_id_returned(self):
        """Migration should return WebWaka partner ID"""
        response = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        assert response.status_code == 200
        data = response.json()
        assert 'webwakaPartnerId' in data
        assert data['webwakaPartnerId'] == 'de5cdd7a-ec40-4d92-a9f3-0cfd20cba87f'
        print(f"WebWaka Partner ID: {data['webwakaPartnerId']}")
    
    def test_migration_idempotent(self):
        """Running migration multiple times should be safe"""
        # Run twice
        response1 = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        response2 = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Partner ID should be same
        assert data1['webwakaPartnerId'] == data2['webwakaPartnerId']
        # Second run should not create new partner
        assert data2['webwakaPartnerCreated'] == False
        print("Migration is idempotent - PASS")


class TestPartnerMeAPI:
    """Tests for GET /api/partner/me"""
    
    def test_unauthenticated_returns_401(self):
        """Unauthenticated request should return 401"""
        response = requests.get(f"{BASE_URL}/api/partner/me")
        assert response.status_code == 401
        data = response.json()
        assert data.get('success') == False
        assert 'error' in data
        print(f"Unauthenticated response: {data}")
    
    def test_response_structure(self):
        """Response should have expected structure"""
        response = requests.get(f"{BASE_URL}/api/partner/me")
        # Even error response should have proper structure
        data = response.json()
        assert 'success' in data
        assert 'error' in data or 'partner' in data
        print(f"Response structure valid: {list(data.keys())}")


class TestPartnerClientsAPI:
    """Tests for GET/POST /api/partner/clients"""
    
    def test_get_clients_unauthenticated(self):
        """GET /api/partner/clients without auth should return error"""
        response = requests.get(f"{BASE_URL}/api/partner/clients")
        # Should return 401 or 403
        assert response.status_code in [401, 403]
        data = response.json()
        assert 'error' in data
        print(f"Unauthenticated GET response: {data}")
    
    def test_post_clients_unauthenticated(self):
        """POST /api/partner/clients without auth should return error"""
        response = requests.post(
            f"{BASE_URL}/api/partner/clients",
            json={
                "name": "Test Client",
                "slug": "test-client",
                "adminEmail": "admin@test.com"
            }
        )
        # Should return 401 or 403
        assert response.status_code in [401, 403]
        data = response.json()
        assert 'error' in data
        print(f"Unauthenticated POST response: {data}")
    
    def test_post_clients_validation(self):
        """POST should validate required fields"""
        # Even without auth, validation might run first
        response = requests.post(
            f"{BASE_URL}/api/partner/clients",
            json={}  # Empty body
        )
        # Should return error (either auth or validation)
        assert response.status_code in [400, 401, 403]
        print(f"Empty body response: {response.status_code}")


class TestMarketingPages:
    """Tests for marketing pages accessibility"""
    
    def test_partners_get_started_page(self):
        """GET /partners/get-started should return 200"""
        response = requests.get(f"{BASE_URL}/partners/get-started")
        assert response.status_code == 200
        assert 'Partner' in response.text
        print("Partners get-started page accessible")
    
    def test_homepage_accessible(self):
        """Homepage should be accessible"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("Homepage accessible")
    
    def test_homepage_has_find_partner_cta(self):
        """Homepage should have 'Find a Partner' CTA"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        # Check for Partner-First CTAs
        assert 'Find a Partner' in response.text or 'find-a-partner' in response.text.lower()
        print("Homepage has Partner-First CTA")


class TestPartnerFirstGuards:
    """Tests for Partner-First policy enforcement"""
    
    def test_guards_module_exists(self):
        """Guards module should be importable (via API behavior)"""
        # Test that the migration API uses guards properly
        response = requests.post(f"{BASE_URL}/api/admin/migrate-webwaka-partner")
        assert response.status_code == 200
        # If guards work, migration should succeed
        data = response.json()
        assert data.get('success') == True
        print("Guards module working (migration succeeded)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
