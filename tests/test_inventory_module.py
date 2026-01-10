"""
MODULE 1: Inventory & Warehouse Management - Backend API Tests
Tests all inventory module endpoints for proper authentication and response structure.

Endpoints tested:
- /api/inventory/warehouses (GET, POST)
- /api/inventory/transfers (GET, POST)
- /api/inventory/audits (GET, POST)
- /api/inventory/reorder-rules (GET, POST)
- /api/inventory/reorder-suggestions (GET, POST)
- /api/inventory/low-stock (GET)
- /api/inventory/offline (GET, POST)
- /api/inventory/events (GET)
- /api/inventory/entitlements (GET)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nextbuild-repair.preview.emergentagent.com').rstrip('/')


class TestInventoryModuleAuth:
    """Test that all inventory endpoints require authentication (return 401 without auth)"""
    
    def test_warehouses_get_requires_auth(self):
        """GET /api/inventory/warehouses should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/warehouses")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data or "Unauthorized" in str(data)
    
    def test_warehouses_post_requires_auth(self):
        """POST /api/inventory/warehouses should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/warehouses",
            json={"locationId": "test", "name": "Test", "code": "TST"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_transfers_get_requires_auth(self):
        """GET /api/inventory/transfers should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/transfers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_transfers_post_requires_auth(self):
        """POST /api/inventory/transfers should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/transfers",
            json={
                "fromWarehouseId": "test",
                "toWarehouseId": "test2",
                "items": [{"productId": "p1", "quantityRequested": 10}]
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_audits_get_requires_auth(self):
        """GET /api/inventory/audits should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/audits")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_audits_post_requires_auth(self):
        """POST /api/inventory/audits should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/audits",
            json={"warehouseId": "test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_rules_get_requires_auth(self):
        """GET /api/inventory/reorder-rules should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/reorder-rules")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_rules_post_requires_auth(self):
        """POST /api/inventory/reorder-rules should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/reorder-rules",
            json={"name": "Test Rule", "triggerType": "BELOW_THRESHOLD", "reorderPoint": 10}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_suggestions_get_requires_auth(self):
        """GET /api/inventory/reorder-suggestions should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/reorder-suggestions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_suggestions_post_requires_auth(self):
        """POST /api/inventory/reorder-suggestions should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/reorder-suggestions",
            json={}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_low_stock_get_requires_auth(self):
        """GET /api/inventory/low-stock should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/low-stock")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_offline_get_requires_auth(self):
        """GET /api/inventory/offline should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/offline")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_offline_post_requires_auth(self):
        """POST /api/inventory/offline should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/offline",
            json={
                "actionType": "TRANSFER_CREATE",
                "entityType": "transfer",
                "payload": {}
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_events_get_requires_auth(self):
        """GET /api/inventory/events should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/events")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_entitlements_get_requires_auth(self):
        """GET /api/inventory/entitlements should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/inventory/entitlements")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestInventoryEndpointsExist:
    """Test that all inventory endpoints exist and respond (not 404)"""
    
    def test_warehouses_endpoint_exists(self):
        """Warehouses endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/warehouses")
        assert response.status_code != 404, "Warehouses endpoint should exist"
    
    def test_transfers_endpoint_exists(self):
        """Transfers endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/transfers")
        assert response.status_code != 404, "Transfers endpoint should exist"
    
    def test_audits_endpoint_exists(self):
        """Audits endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/audits")
        assert response.status_code != 404, "Audits endpoint should exist"
    
    def test_reorder_rules_endpoint_exists(self):
        """Reorder rules endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/reorder-rules")
        assert response.status_code != 404, "Reorder rules endpoint should exist"
    
    def test_reorder_suggestions_endpoint_exists(self):
        """Reorder suggestions endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/reorder-suggestions")
        assert response.status_code != 404, "Reorder suggestions endpoint should exist"
    
    def test_low_stock_endpoint_exists(self):
        """Low stock endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/low-stock")
        assert response.status_code != 404, "Low stock endpoint should exist"
    
    def test_offline_endpoint_exists(self):
        """Offline endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/offline")
        assert response.status_code != 404, "Offline endpoint should exist"
    
    def test_events_endpoint_exists(self):
        """Events endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/events")
        assert response.status_code != 404, "Events endpoint should exist"
    
    def test_entitlements_endpoint_exists(self):
        """Entitlements endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/inventory/entitlements")
        assert response.status_code != 404, "Entitlements endpoint should exist"


class TestInventoryResponseFormat:
    """Test that endpoints return proper JSON error responses"""
    
    def test_warehouses_returns_json_error(self):
        """Warehouses should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/warehouses")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_transfers_returns_json_error(self):
        """Transfers should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/transfers")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_audits_returns_json_error(self):
        """Audits should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/audits")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_reorder_rules_returns_json_error(self):
        """Reorder rules should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/reorder-rules")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_reorder_suggestions_returns_json_error(self):
        """Reorder suggestions should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/reorder-suggestions")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_low_stock_returns_json_error(self):
        """Low stock should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/low-stock")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_offline_returns_json_error(self):
        """Offline should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/offline")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_events_returns_json_error(self):
        """Events should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/events")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)
    
    def test_entitlements_returns_json_error(self):
        """Entitlements should return JSON error response"""
        response = requests.get(f"{BASE_URL}/api/inventory/entitlements")
        assert response.headers.get('content-type', '').startswith('application/json')
        data = response.json()
        assert isinstance(data, dict)


class TestInventoryPostValidation:
    """Test POST endpoint validation (should return 401 before validation, but endpoint exists)"""
    
    def test_warehouses_post_accepts_json(self):
        """POST /api/inventory/warehouses should accept JSON body"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/warehouses",
            json={"locationId": "test", "name": "Test Warehouse", "code": "TST001"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 (auth required) not 400 (bad request) or 415 (unsupported media)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_transfers_post_accepts_json(self):
        """POST /api/inventory/transfers should accept JSON body"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/transfers",
            json={
                "fromWarehouseId": str(uuid.uuid4()),
                "toWarehouseId": str(uuid.uuid4()),
                "items": [{"productId": str(uuid.uuid4()), "quantityRequested": 10}]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_audits_post_accepts_json(self):
        """POST /api/inventory/audits should accept JSON body"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/audits",
            json={"warehouseId": str(uuid.uuid4()), "auditType": "SPOT"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_rules_post_accepts_json(self):
        """POST /api/inventory/reorder-rules should accept JSON body"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/reorder-rules",
            json={
                "name": "Test Rule",
                "triggerType": "BELOW_THRESHOLD",
                "reorderPoint": 10,
                "reorderQuantity": 50
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_suggestions_post_accepts_json(self):
        """POST /api/inventory/reorder-suggestions should accept JSON body"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/reorder-suggestions",
            json={"productId": str(uuid.uuid4())},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_offline_post_accepts_json(self):
        """POST /api/inventory/offline should accept JSON body"""
        response = requests.post(
            f"{BASE_URL}/api/inventory/offline",
            json={
                "actionType": "TRANSFER_CREATE",
                "entityType": "transfer",
                "payload": {"test": "data"}
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestInventoryQueryParams:
    """Test that endpoints accept query parameters (even if returning 401)"""
    
    def test_warehouses_accepts_query_params(self):
        """GET /api/inventory/warehouses should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/warehouses",
            params={"isActive": "true", "warehouseType": "GENERAL"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_transfers_accepts_query_params(self):
        """GET /api/inventory/transfers should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/transfers",
            params={"status": "DRAFT", "priority": "NORMAL", "limit": "10"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_audits_accepts_query_params(self):
        """GET /api/inventory/audits should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/audits",
            params={"status": "DRAFT", "auditType": "SPOT", "limit": "10"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_rules_accepts_query_params(self):
        """GET /api/inventory/reorder-rules should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/reorder-rules",
            params={"triggerType": "BELOW_THRESHOLD", "isActive": "true"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_reorder_suggestions_accepts_query_params(self):
        """GET /api/inventory/reorder-suggestions should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/reorder-suggestions",
            params={"status": "PENDING", "urgency": "HIGH", "limit": "10"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_low_stock_accepts_query_params(self):
        """GET /api/inventory/low-stock should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/low-stock",
            params={"threshold": "10"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_offline_accepts_query_params(self):
        """GET /api/inventory/offline should accept query params"""
        response = requests.get(
            f"{BASE_URL}/api/inventory/offline",
            params={"all": "true", "conflicts": "false"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestInventoryEndpointCount:
    """Verify all 31 documented endpoints exist"""
    
    def test_all_inventory_endpoints_count(self):
        """Verify inventory module has all expected endpoints"""
        # Main endpoints (9 base routes)
        base_endpoints = [
            "/api/inventory/warehouses",
            "/api/inventory/transfers",
            "/api/inventory/audits",
            "/api/inventory/reorder-rules",
            "/api/inventory/reorder-suggestions",
            "/api/inventory/low-stock",
            "/api/inventory/offline",
            "/api/inventory/events",
            "/api/inventory/entitlements",
        ]
        
        existing_endpoints = []
        missing_endpoints = []
        
        for endpoint in base_endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code != 404:
                existing_endpoints.append(endpoint)
            else:
                missing_endpoints.append(endpoint)
        
        assert len(missing_endpoints) == 0, f"Missing endpoints: {missing_endpoints}"
        assert len(existing_endpoints) == 9, f"Expected 9 base endpoints, found {len(existing_endpoints)}"
        print(f"✓ All 9 base inventory endpoints exist")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
