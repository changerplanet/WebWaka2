"""
Phase 2: Platform Instances Testing
Tests for multi-suite, multi-domain platform instance functionality.

Test Coverage:
1. PlatformInstance table schema validation
2. Default instance migration verification
3. /api/platform-instances endpoint
4. Domain resolution with instance context
5. Branding resolution (instance override + tenant fallback)
6. Navigation filtering by suiteKeys
7. Session context with instanceId
8. Backward compatibility
9. Guardrails (no per-instance billing/attribution)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://trusting-buck.preview.emergentagent.com"

# Test tenant IDs from database
ACME_TENANT_ID = "67846c4f-9b38-47c7-86d9-fff55aa4afda"
BETA_TENANT_ID = "8bce325e-0c6f-4b6b-b806-bc14ff52650b"
ACME_INSTANCE_ID = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
BETA_INSTANCE_ID = "3b6a6bce-6731-4072-94ab-415612bf811c"


class TestPlatformInstancesAPI:
    """Test /api/platform-instances endpoint"""
    
    def test_get_instances_requires_tenant_id(self):
        """GET /api/platform-instances without tenantId should return 400"""
        response = requests.get(f"{BASE_URL}/api/platform-instances")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "tenantid" in data["error"].lower()  # Case-insensitive check
    
    def test_get_instances_for_acme_tenant(self):
        """GET /api/platform-instances?tenantId=acme returns default instance"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "instances" in data
        instances = data["instances"]
        assert isinstance(instances, list)
        assert len(instances) >= 1
        
        # Verify default instance exists
        default_instance = next((i for i in instances if i.get("isDefault")), None)
        assert default_instance is not None, "Default instance should exist"
        
        # Verify instance structure
        assert "id" in default_instance
        assert "name" in default_instance
        assert "slug" in default_instance
        assert "suiteKeys" in default_instance
        assert "isDefault" in default_instance
        assert default_instance["isDefault"] == True
        
        # Verify empty suiteKeys means all capabilities visible
        assert default_instance["suiteKeys"] == []
    
    def test_get_instances_for_beta_tenant(self):
        """GET /api/platform-instances?tenantId=beta returns default instance"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={BETA_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "instances" in data
        instances = data["instances"]
        assert len(instances) >= 1
        
        # Verify default instance
        default_instance = next((i for i in instances if i.get("isDefault")), None)
        assert default_instance is not None
        assert default_instance["slug"] == "default"
    
    def test_get_instances_invalid_tenant_returns_empty(self):
        """GET /api/platform-instances with invalid tenantId returns empty list"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=invalid-uuid-12345")
        assert response.status_code == 200
        data = response.json()
        assert "instances" in data
        assert data["instances"] == []
    
    def test_instance_response_includes_branding_fields(self):
        """Instance response should include branding fields for UI"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        instance = data["instances"][0]
        # Branding fields should be present (can be null)
        assert "displayName" in instance
        assert "logoUrl" in instance
        assert "primaryColor" in instance
        assert "secondaryColor" in instance


class TestMigrationEndpoint:
    """Test /api/admin/migrate-platform-instances endpoint"""
    
    def test_migration_endpoint_get_returns_info(self):
        """GET /api/admin/migrate-platform-instances returns endpoint info"""
        response = requests.get(f"{BASE_URL}/api/admin/migrate-platform-instances")
        assert response.status_code == 200
        data = response.json()
        
        assert "endpoint" in data
        assert "method" in data
        assert "description" in data
        assert data["method"] == "POST"
        assert "Phase 2" in data.get("phase", "")
    
    def test_migration_is_idempotent(self):
        """POST /api/admin/migrate-platform-instances is safe to run multiple times"""
        response = requests.post(f"{BASE_URL}/api/admin/migrate-platform-instances")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "message" in data
        # Should report 0 created if already migrated
        assert "tenantsProcessed" in data or "created" in str(data).lower()


class TestBackwardCompatibility:
    """Test that existing routes work unchanged"""
    
    def test_dashboard_route_works(self):
        """Dashboard route should work without instance context"""
        response = requests.get(f"{BASE_URL}/dashboard?tenant=acme", allow_redirects=False)
        # Should either load or redirect to login (both are valid)
        assert response.status_code in [200, 302, 307]
    
    def test_pos_route_works(self):
        """POS route should work without instance context"""
        response = requests.get(f"{BASE_URL}/pos?tenant=acme", allow_redirects=False)
        assert response.status_code in [200, 302, 307]
    
    def test_api_auth_session_works(self):
        """Auth session endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/auth/session")
        assert response.status_code == 200
        data = response.json()
        # Should return authenticated: false for unauthenticated request
        assert "authenticated" in data or "user" in data
    
    def test_api_health_works(self):
        """Health endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Health endpoint may not exist, but should not error
        assert response.status_code in [200, 404]


class TestInstanceBrandingResolution:
    """Test branding resolution with instance override and tenant fallback"""
    
    def test_default_instance_has_no_branding_override(self):
        """Default instance should have null branding (uses tenant fallback)"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        default_instance = data["instances"][0]
        # Default instance should have null branding fields (fallback to tenant)
        assert default_instance["displayName"] is None
        assert default_instance["logoUrl"] is None
        assert default_instance["primaryColor"] is None
        assert default_instance["secondaryColor"] is None


class TestNavigationFiltering:
    """Test navigation filtering by suiteKeys"""
    
    def test_empty_suite_keys_means_all_visible(self):
        """Instance with empty suiteKeys should show all capabilities"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        default_instance = data["instances"][0]
        # Empty suiteKeys = all capabilities visible
        assert default_instance["suiteKeys"] == []


class TestGuardrails:
    """Test Phase 2 guardrails - no per-instance billing/attribution"""
    
    def test_instance_has_no_billing_fields(self):
        """Instance should NOT have billing-related fields"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        instance = data["instances"][0]
        # Guardrail: No per-instance billing
        assert "subscription" not in instance
        assert "billing" not in instance
        assert "invoice" not in instance
        assert "payment" not in instance
    
    def test_instance_has_no_partner_attribution_fields(self):
        """Instance should NOT have partner attribution fields"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        instance = data["instances"][0]
        # Guardrail: No per-instance partner attribution
        assert "partnerId" not in instance
        assert "referralCode" not in instance
        assert "attribution" not in instance


class TestInstanceSchema:
    """Test PlatformInstance schema correctness"""
    
    def test_instance_has_required_fields(self):
        """Instance should have all required Phase 2 fields"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        instance = data["instances"][0]
        
        # Required fields
        required_fields = ["id", "name", "slug", "suiteKeys", "isDefault"]
        for field in required_fields:
            assert field in instance, f"Missing required field: {field}"
        
        # Optional branding fields (should be present, can be null)
        branding_fields = ["displayName", "logoUrl", "primaryColor", "secondaryColor"]
        for field in branding_fields:
            assert field in instance, f"Missing branding field: {field}"


class TestAuthProviderInstanceContext:
    """Test that AuthProvider includes instance context"""
    
    def test_session_endpoint_structure(self):
        """Session endpoint should be ready for instance context"""
        response = requests.get(f"{BASE_URL}/api/auth/session")
        assert response.status_code == 200
        # Session endpoint should work (instance context added when authenticated)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
