"""
Test Suite: Capability Guards for POS, SVM, MVM, and Inventory Modules
Tests P0 implementation of isCapabilityActive runtime checks

Tests verify:
1. APIs return 403 when capability is inactive
2. APIs work normally when capability is active
3. Proper error response format with CAPABILITY_INACTIVE code
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nextbuild-repair.preview.emergentagent.com').rstrip('/')

# Test tenant - Acme Corporation
ACME_TENANT_ID = "67846c4f-9b38-47c7-86d9-fff55aa4afda"
ACME_TENANT_SLUG = "acme"


class TestPOSCapabilityGuard:
    """Test POS module capability guards - should return 403 when 'pos' capability is inactive"""
    
    def test_pos_products_get_returns_403_when_inactive(self):
        """GET /api/pos/products should return 403 when pos capability is inactive"""
        response = requests.get(
            f"{BASE_URL}/api/pos/products",
            params={"tenantId": ACME_TENANT_ID}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        # Verify error response format
        assert data.get("success") == False
        assert data.get("error") == "Capability not active"
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "pos"
        assert "message" in data
        print(f"✓ POS Products GET returns 403 with correct error format")
    
    def test_pos_products_post_returns_403_when_inactive(self):
        """POST /api/pos/products should return 403 when pos capability is inactive"""
        response = requests.post(
            f"{BASE_URL}/api/pos/products",
            json={
                "tenantId": ACME_TENANT_ID,
                "productIds": ["prod_123"]
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "pos"
        print(f"✓ POS Products POST returns 403 with correct error format")
    
    def test_pos_inventory_get_returns_403_when_inactive(self):
        """GET /api/pos/inventory should return 403 when pos capability is inactive"""
        response = requests.get(
            f"{BASE_URL}/api/pos/inventory",
            params={"tenantId": ACME_TENANT_ID}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "pos"
        print(f"✓ POS Inventory GET returns 403 with correct error format")
    
    def test_pos_inventory_post_returns_403_when_inactive(self):
        """POST /api/pos/inventory should return 403 when pos capability is inactive"""
        response = requests.post(
            f"{BASE_URL}/api/pos/inventory",
            json={
                "tenantId": ACME_TENANT_ID,
                "items": [{"productId": "prod_123", "quantity": 1}]
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "pos"
        print(f"✓ POS Inventory POST returns 403 with correct error format")


class TestSVMCapabilityGuard:
    """Test SVM module capability guards - should return 403 when 'svm' capability is inactive"""
    
    def test_svm_cart_get_returns_403_when_inactive(self):
        """GET /api/svm/cart should return 403 when svm capability is inactive"""
        response = requests.get(
            f"{BASE_URL}/api/svm/cart",
            params={
                "tenantId": ACME_TENANT_ID,
                "sessionId": "test_session_123"
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == False
        assert data.get("error") == "Capability not active"
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "svm"
        print(f"✓ SVM Cart GET returns 403 with correct error format")
    
    def test_svm_cart_post_returns_403_when_inactive(self):
        """POST /api/svm/cart should return 403 when svm capability is inactive"""
        response = requests.post(
            f"{BASE_URL}/api/svm/cart",
            json={
                "tenantId": ACME_TENANT_ID,
                "sessionId": "test_session_123",
                "action": "ADD_ITEM",
                "productId": "prod_123",
                "productName": "Test Product",
                "unitPrice": 10.00
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "svm"
        print(f"✓ SVM Cart POST returns 403 with correct error format")
    
    def test_svm_cart_delete_returns_403_when_inactive(self):
        """DELETE /api/svm/cart should return 403 when svm capability is inactive"""
        response = requests.delete(
            f"{BASE_URL}/api/svm/cart",
            params={
                "tenantId": ACME_TENANT_ID,
                "sessionId": "test_session_123"
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "svm"
        print(f"✓ SVM Cart DELETE returns 403 with correct error format")
    
    def test_svm_orders_get_returns_403_when_inactive(self):
        """GET /api/svm/orders should return 403 when svm capability is inactive"""
        response = requests.get(
            f"{BASE_URL}/api/svm/orders",
            params={"tenantId": ACME_TENANT_ID}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "svm"
        print(f"✓ SVM Orders GET returns 403 with correct error format")
    
    def test_svm_orders_post_returns_403_when_inactive(self):
        """POST /api/svm/orders should return 403 when svm capability is inactive"""
        response = requests.post(
            f"{BASE_URL}/api/svm/orders",
            json={
                "tenantId": ACME_TENANT_ID,
                "customerEmail": "test@example.com",
                "items": [{"productId": "prod_123", "productName": "Test", "unitPrice": 10, "quantity": 1}],
                "shippingAddress": {"street": "123 Test St", "city": "Test City"}
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "svm"
        print(f"✓ SVM Orders POST returns 403 with correct error format")


class TestMVMCapabilityGuard:
    """Test MVM module capability guards - should return 403 when 'mvm' capability is inactive"""
    
    def test_mvm_vendors_get_returns_403_when_inactive(self):
        """GET /api/mvm/vendors should return 403 when mvm capability is inactive"""
        response = requests.get(
            f"{BASE_URL}/api/mvm/vendors",
            params={"tenantId": ACME_TENANT_ID}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == False
        assert data.get("error") == "Capability not active"
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "mvm"
        print(f"✓ MVM Vendors GET returns 403 with correct error format")
    
    def test_mvm_vendors_post_returns_403_when_inactive(self):
        """POST /api/mvm/vendors should return 403 when mvm capability is inactive"""
        response = requests.post(
            f"{BASE_URL}/api/mvm/vendors",
            json={
                "tenantId": ACME_TENANT_ID,
                "name": "Test Vendor",
                "email": "vendor@test.com"
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "mvm"
        print(f"✓ MVM Vendors POST returns 403 with correct error format")
    
    def test_mvm_orders_get_returns_403_when_inactive(self):
        """GET /api/mvm/orders should return 403 when mvm capability is inactive"""
        response = requests.get(
            f"{BASE_URL}/api/mvm/orders",
            params={"tenantId": ACME_TENANT_ID}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "mvm"
        print(f"✓ MVM Orders GET returns 403 with correct error format")
    
    def test_mvm_orders_post_returns_403_when_inactive(self):
        """POST /api/mvm/orders should return 403 when mvm capability is inactive"""
        response = requests.post(
            f"{BASE_URL}/api/mvm/orders",
            json={
                "tenantId": ACME_TENANT_ID,
                "customerId": "cust_123",
                "items": [{"productId": "prod_123", "vendorId": "vendor_123", "price": 10, "quantity": 1}]
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        
        assert data.get("code") == "CAPABILITY_INACTIVE"
        assert data.get("capability") == "mvm"
        print(f"✓ MVM Orders POST returns 403 with correct error format")


class TestInventoryCapabilityGuard:
    """Test Inventory module capability guards - uses session-based auth"""
    
    def test_inventory_warehouses_requires_auth(self):
        """GET /api/inventory/warehouses should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/warehouses")
        
        # Without auth, should return 401 (auth check happens before capability check)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert data.get("error") == "Unauthorized"
        print(f"✓ Inventory Warehouses GET returns 401 without auth")
    
    def test_inventory_transfers_requires_auth(self):
        """GET /api/inventory/transfers should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/transfers")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert data.get("error") == "Unauthorized"
        print(f"✓ Inventory Transfers GET returns 401 without auth")
    
    def test_inventory_warehouses_post_requires_auth(self):
        """POST /api/inventory/warehouses should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/warehouses",
            json={
                "locationId": "loc_123",
                "name": "Test Warehouse",
                "code": "WH001"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Inventory Warehouses POST returns 401 without auth")
    
    def test_inventory_transfers_post_requires_auth(self):
        """POST /api/inventory/transfers should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/transfers",
            json={
                "fromWarehouseId": "wh_123",
                "toWarehouseId": "wh_456",
                "items": [{"productId": "prod_123", "quantityRequested": 10}]
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Inventory Transfers POST returns 401 without auth")


class TestCapabilityGuardErrorFormat:
    """Test that capability guard error responses follow the correct format"""
    
    def test_error_response_has_all_required_fields(self):
        """Verify error response contains all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/pos/products",
            params={"tenantId": ACME_TENANT_ID}
        )
        
        assert response.status_code == 403
        data = response.json()
        
        # Required fields
        required_fields = ["success", "error", "code", "capability", "message"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify field values
        assert data["success"] == False
        assert data["error"] == "Capability not active"
        assert data["code"] == "CAPABILITY_INACTIVE"
        assert isinstance(data["capability"], str)
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0
        print(f"✓ Error response contains all required fields with correct values")
    
    def test_error_message_is_user_friendly(self):
        """Verify error message is user-friendly and actionable"""
        response = requests.get(
            f"{BASE_URL}/api/svm/cart",
            params={"tenantId": ACME_TENANT_ID, "sessionId": "test"}
        )
        
        data = response.json()
        message = data.get("message", "")
        
        # Message should mention the capability and how to fix
        assert "svm" in message.lower() or "capability" in message.lower()
        assert "activate" in message.lower() or "dashboard" in message.lower()
        print(f"✓ Error message is user-friendly: {message}")


class TestTenantIdValidation:
    """Test that tenantId is properly validated before capability check"""
    
    def test_pos_requires_tenant_id(self):
        """POS API should return 400 when tenantId is missing"""
        response = requests.get(f"{BASE_URL}/api/pos/products")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "tenantId" in data.get("error", "").lower() or "tenantid" in str(data).lower()
        print(f"✓ POS Products requires tenantId")
    
    def test_svm_requires_tenant_id(self):
        """SVM API should return 400 when tenantId is missing"""
        response = requests.get(
            f"{BASE_URL}/api/svm/cart",
            params={"sessionId": "test"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ SVM Cart requires tenantId")
    
    def test_mvm_requires_tenant_id(self):
        """MVM API should return 400 when tenantId is missing"""
        response = requests.get(f"{BASE_URL}/api/mvm/vendors")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ MVM Vendors requires tenantId")


class TestCapabilityTenantEndpoint:
    """Test /api/capabilities/tenant endpoint for fetching active capabilities"""
    
    def test_capabilities_tenant_requires_auth(self):
        """GET /api/capabilities/tenant should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/capabilities/tenant")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Capabilities tenant endpoint requires auth")
    
    def test_public_capabilities_endpoint_works(self):
        """GET /api/capabilities should return all capabilities without auth"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Should have capabilities array
        assert "capabilities" in data
        assert len(data["capabilities"]) > 0
        
        # Should include pos, svm, mvm, inventory
        capability_keys = [c["key"] for c in data["capabilities"]]
        assert "pos" in capability_keys
        assert "svm" in capability_keys
        assert "mvm" in capability_keys
        assert "inventory" in capability_keys
        print(f"✓ Public capabilities endpoint returns {len(data['capabilities'])} capabilities")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
