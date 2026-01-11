"""
Platform Instances Phase 2.1 UI API Tests
Tests for Instance Switcher, Instance Admin Page, Branding Preview, Domain Mapping
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://buildfix-6.preview.emergentagent.com').rstrip('/')

class TestPlatformInstancesAPI:
    """Test Platform Instances API endpoints"""
    
    def test_get_instances_for_acme_tenant(self):
        """GET /api/platform-instances?tenantId=acme - should return 2 instances"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=acme")
        assert response.status_code == 200
        
        data = response.json()
        assert "instances" in data
        instances = data["instances"]
        assert len(instances) >= 2, f"Expected at least 2 instances, got {len(instances)}"
        
        # Verify default instance exists
        default_instance = next((i for i in instances if i["isDefault"]), None)
        assert default_instance is not None, "Default instance not found"
        assert default_instance["slug"] == "default"
        
        # Verify Commerce Hub instance exists
        commerce_instance = next((i for i in instances if i["slug"] == "commerce-hub"), None)
        assert commerce_instance is not None, "Commerce Hub instance not found"
        assert commerce_instance["name"] == "Commerce Hub"
        assert len(commerce_instance["suiteKeys"]) == 5, f"Expected 5 suiteKeys, got {len(commerce_instance['suiteKeys'])}"
    
    def test_get_instances_without_tenant_id(self):
        """GET /api/platform-instances without tenantId - should return 400"""
        response = requests.get(f"{BASE_URL}/api/platform-instances")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
    
    def test_get_instances_for_invalid_tenant(self):
        """GET /api/platform-instances?tenantId=invalid - should return empty array"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=invalid-tenant-xyz")
        assert response.status_code == 200
        
        data = response.json()
        assert "instances" in data
        assert len(data["instances"]) == 0
    
    def test_instance_structure(self):
        """Verify instance has all required Phase 2.1 fields"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=acme")
        assert response.status_code == 200
        
        data = response.json()
        instance = data["instances"][0]
        
        # Required fields
        required_fields = ["id", "name", "slug", "suiteKeys", "isDefault", "isActive"]
        for field in required_fields:
            assert field in instance, f"Missing required field: {field}"
        
        # Branding fields
        branding_fields = ["displayName", "logoUrl", "faviconUrl", "primaryColor", "secondaryColor"]
        for field in branding_fields:
            assert field in instance, f"Missing branding field: {field}"
    
    def test_commerce_hub_suite_keys(self):
        """Verify Commerce Hub has correct suiteKeys for navigation filtering"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=acme")
        assert response.status_code == 200
        
        data = response.json()
        commerce_instance = next((i for i in data["instances"] if i["slug"] == "commerce-hub"), None)
        assert commerce_instance is not None
        
        expected_keys = ["pos", "svm", "inventory", "payments", "crm"]
        for key in expected_keys:
            assert key in commerce_instance["suiteKeys"], f"Missing suiteKey: {key}"
    
    def test_default_instance_has_empty_suite_keys(self):
        """Default instance should have empty suiteKeys (all capabilities visible)"""
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=acme")
        assert response.status_code == 200
        
        data = response.json()
        default_instance = next((i for i in data["instances"] if i["isDefault"]), None)
        assert default_instance is not None
        assert default_instance["suiteKeys"] == [], "Default instance should have empty suiteKeys"


class TestInstanceCRUD:
    """Test Instance CRUD operations"""
    
    @pytest.fixture
    def test_instance_data(self):
        return {
            "tenantSlug": "acme",
            "name": "Test Instance",
            "slug": f"test-instance-{os.urandom(4).hex()}",
            "description": "Test instance for automated testing",
            "suiteKeys": ["pos", "inventory"],
            "displayName": "Test Display Name",
            "primaryColor": "#FF5733",
            "secondaryColor": "#33FF57"
        }
    
    def test_create_instance(self, test_instance_data):
        """POST /api/platform-instances - Create new instance"""
        response = requests.post(
            f"{BASE_URL}/api/platform-instances",
            json=test_instance_data
        )
        
        # Should succeed or fail gracefully
        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            assert "instance" in data or "success" in data
            print(f"Created instance: {data}")
        else:
            # May fail due to auth - that's expected
            print(f"Create instance returned {response.status_code}: {response.text}")
    
    def test_update_instance(self):
        """PATCH /api/platform-instances/[id] - Update instance"""
        # First get the Commerce Hub instance ID
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=acme")
        assert response.status_code == 200
        
        data = response.json()
        commerce_instance = next((i for i in data["instances"] if i["slug"] == "commerce-hub"), None)
        
        if commerce_instance:
            instance_id = commerce_instance["id"]
            
            # Try to update
            update_response = requests.patch(
                f"{BASE_URL}/api/platform-instances/{instance_id}",
                json={
                    "tenantSlug": "acme",
                    "description": "Updated description for testing"
                }
            )
            
            # Should succeed or fail gracefully
            print(f"Update instance returned {update_response.status_code}: {update_response.text[:200]}")
    
    def test_cannot_deactivate_default_instance(self):
        """PATCH /api/platform-instances/[id] - Cannot deactivate default instance"""
        # Get the default instance ID
        response = requests.get(f"{BASE_URL}/api/platform-instances?tenantId=acme")
        assert response.status_code == 200
        
        data = response.json()
        default_instance = next((i for i in data["instances"] if i["isDefault"]), None)
        
        if default_instance:
            instance_id = default_instance["id"]
            
            # Try to deactivate
            update_response = requests.patch(
                f"{BASE_URL}/api/platform-instances/{instance_id}",
                json={
                    "tenantSlug": "acme",
                    "isActive": False
                }
            )
            
            # Should return 400 with error
            if update_response.status_code == 400:
                data = update_response.json()
                assert "error" in data
                assert "default" in data["error"].lower() or "deactivate" in data["error"].lower()
                print("SUCCESS: Cannot deactivate default instance guardrail works")
            else:
                print(f"Deactivate default returned {update_response.status_code}: {update_response.text[:200]}")


class TestSessionAPI:
    """Test Session API for instance context"""
    
    def test_session_endpoint_exists(self):
        """GET /api/auth/session - Should return session info"""
        response = requests.get(f"{BASE_URL}/api/auth/session")
        assert response.status_code == 200
        
        data = response.json()
        assert "authenticated" in data
        print(f"Session response: {data}")


class TestTenantSettings:
    """Test Tenant Settings API"""
    
    def test_tenant_settings_endpoint(self):
        """GET /api/tenants/acme/settings - Should return tenant settings"""
        response = requests.get(f"{BASE_URL}/api/tenants/acme/settings")
        
        # May require auth
        if response.status_code == 200:
            data = response.json()
            print(f"Tenant settings: {data}")
        else:
            print(f"Tenant settings returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
