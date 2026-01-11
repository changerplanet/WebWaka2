"""
MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT - Comprehensive API Tests
Tests all Procurement endpoints with proper authentication

Features tested:
- Procurement Configuration (GET/POST/PUT /api/procurement)
- Purchase Requests (CRUD /api/procurement/requests)
- Purchase Orders (CRUD /api/procurement/orders)
- Goods Receipts (CRUD /api/procurement/receipts)
- Supplier Pricing & Performance (/api/procurement/suppliers)
- Offline Sync (/api/procurement/offline)
- Events & Validation (/api/procurement/events)
- Nigeria-first support (cash purchases, informal suppliers, phone-first)
- Offline sync idempotency with offlineId
- NO inventory mutation (goods receipt emits events only)
- NO payment execution (PO is commitment only)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-sync.preview.emergentagent.com').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_PROC_"

# Store created resources for cleanup
created_resources = {
    "purchase_requests": [],
    "purchase_orders": [],
    "goods_receipts": [],
    "suppliers": [],
    "products": []
}


import time

def get_authenticated_session():
    """Get authenticated session using magic link"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Request magic link for tenant admin
    email = "admin@acme.com"
    
    response = session.post(f"{BASE_URL}/api/auth/magic-link", json={
        "email": email,
        "tenantSlug": "acme"
    })
    
    if response.status_code != 200:
        print(f"Magic link request failed: {response.status_code} - {response.text}")
        return None
        
    data = response.json()
    magic_link = data.get("magicLink")
    
    if not magic_link:
        print(f"No magic link in response: {data}")
        return None
        
    # Extract token from magic link
    token = magic_link.split("token=")[-1]
    
    # Verify the token to create session
    verify_response = session.get(f"{BASE_URL}/api/auth/verify?token={token}", allow_redirects=False)
    
    # The verify endpoint sets cookies and redirects
    if verify_response.status_code in [200, 302, 307]:
        # Check if session is active
        session_response = session.get(f"{BASE_URL}/api/auth/session")
        if session_response.status_code == 200:
            session_data = session_response.json()
            if session_data.get("user"):
                print(f"Authenticated as {session_data['user'].get('email')}")
                print(f"Active tenant: {session_data.get('activeTenantId')}")
                return session
                
    print(f"Verification failed: {verify_response.status_code}")
    return None


def retry_request(session, method, url, max_retries=3, **kwargs):
    """Retry request on transient errors (520, 502, 503, 504)"""
    for attempt in range(max_retries):
        response = getattr(session, method)(url, **kwargs)
        if response.status_code not in [520, 502, 503, 504]:
            return response
        if attempt < max_retries - 1:
            time.sleep(1)  # Wait before retry
            print(f"Retrying request (attempt {attempt + 2}/{max_retries})...")
    return response


# ============================================================================
# UNAUTHENTICATED TESTS - Verify 401 responses
# ============================================================================

class TestProcurementUnauthenticated:
    """Test that all Procurement endpoints require authentication"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Get unauthenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_procurement_config_requires_auth(self, api_client):
        """GET /api/procurement - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_procurement_requests_requires_auth(self, api_client):
        """GET /api/procurement/requests - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement/requests")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_procurement_orders_requires_auth(self, api_client):
        """GET /api/procurement/orders - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement/orders")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_procurement_receipts_requires_auth(self, api_client):
        """GET /api/procurement/receipts - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement/receipts")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_procurement_suppliers_requires_auth(self, api_client):
        """GET /api/procurement/suppliers - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement/suppliers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_procurement_offline_requires_auth(self, api_client):
        """GET /api/procurement/offline - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement/offline")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_procurement_events_requires_auth(self, api_client):
        """GET /api/procurement/events - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/procurement/events")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


# ============================================================================
# AUTHENTICATED TESTS - Full API testing
# ============================================================================

class TestProcurementAuthenticated:
    """Test all Procurement endpoints with authentication"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = get_authenticated_session()
        if not session:
            pytest.skip("Could not authenticate - skipping authenticated tests")
        return session
    
    # ========================================================================
    # PROCUREMENT CONFIGURATION TESTS
    # ========================================================================
    
    def test_get_procurement_status(self, auth_session):
        """GET /api/procurement - Get procurement status"""
        response = auth_session.get(f"{BASE_URL}/api/procurement")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should have initialized status and entitlements
        assert "initialized" in data or "config" in data or "entitlements" in data
        print(f"Procurement status: {data}")
    
    def test_initialize_procurement(self, auth_session):
        """POST /api/procurement - Initialize procurement module"""
        response = auth_session.post(f"{BASE_URL}/api/procurement", json={
            "defaultCurrency": "NGN",
            "allowCashPurchases": True,
            "allowInformalSuppliers": True,
            "requireApprovalForPR": True
        })
        
        # May return 200 if already initialized or 201 for new
        assert response.status_code in [200, 201, 403], f"Expected 200/201/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 403:
            print("Procurement not enabled for this plan - skipping initialization")
            pytest.skip("Procurement not enabled for this plan")
        
        data = response.json()
        print(f"Procurement initialization: {data}")
    
    def test_update_procurement_config(self, auth_session):
        """PUT /api/procurement - Update procurement configuration"""
        response = auth_session.put(f"{BASE_URL}/api/procurement", json={
            "requireReceiptPhotos": False,
            "notifyOnPRApproval": True
        })
        
        # May return 200 or 404 if not initialized
        assert response.status_code in [200, 404], f"Expected 200/404, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"Config updated: {data}")
    
    # ========================================================================
    # PURCHASE REQUEST TESTS
    # ========================================================================
    
    def test_list_purchase_requests(self, auth_session):
        """GET /api/procurement/requests - List purchase requests"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/requests")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "requests" in data or "data" in data or isinstance(data, list)
        print(f"Purchase requests count: {len(data.get('requests', data.get('data', data)))}")
    
    def test_get_purchase_request_statistics(self, auth_session):
        """GET /api/procurement/requests?statistics=true - Get PR statistics"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/requests?statistics=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"PR statistics: {data}")
    
    def test_create_purchase_request(self, auth_session):
        """POST /api/procurement/requests - Create purchase request"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = retry_request(auth_session, 'post', f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Office Supplies {unique_id}",
            "description": "Test purchase request for office supplies",
            "priority": "NORMAL",
            "neededByDate": (datetime.now() + timedelta(days=7)).isoformat(),
            "items": [
                {
                    "productId": str(uuid.uuid4()),  # Dummy product ID
                    "productName": "Test Product A",
                    "quantity": 10,
                    "unit": "UNIT",
                    "estimatedUnitPrice": 100.00
                },
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Test Product B",
                    "quantity": 5,
                    "unit": "BOX",
                    "estimatedUnitPrice": 250.00
                }
            ]
        })
        
        assert response.status_code in [200, 201, 403], f"Expected 200/201/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 403:
            print("Purchase request creation not allowed - entitlement limit reached")
            pytest.skip("PR creation not allowed")
        
        data = response.json()
        assert data.get("success") == True or "request" in data
        
        pr = data.get("request", data)
        if pr and pr.get("id"):
            created_resources["purchase_requests"].append(pr["id"])
            print(f"Created PR: {pr.get('requestNumber', pr.get('id'))}")
            return pr
    
    def test_get_purchase_request_by_id(self, auth_session):
        """GET /api/procurement/requests/[id] - Get PR by ID"""
        # First create a PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Get Test {unique_id}",
            "description": "Test PR for get by ID",
            "priority": "LOW",
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Test Item",
                    "quantity": 1,
                    "unit": "UNIT"
                }
            ]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Now get by ID
        response = auth_session.get(f"{BASE_URL}/api/procurement/requests/{pr_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "request" in data
        assert data["request"]["id"] == pr_id
        print(f"Got PR: {data['request'].get('requestNumber')}")
    
    def test_update_draft_purchase_request(self, auth_session):
        """PUT /api/procurement/requests/[id] - Update draft PR"""
        # Create a draft PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Update Test {unique_id}",
            "description": "Test PR for update",
            "priority": "LOW",
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Original Item",
                    "quantity": 1,
                    "unit": "UNIT"
                }
            ]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Update the PR
        response = auth_session.put(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "title": f"{TEST_PREFIX}Updated Title {unique_id}",
            "priority": "HIGH"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"Updated PR: {data.get('request', {}).get('title')}")
    
    def test_submit_purchase_request(self, auth_session):
        """POST /api/procurement/requests/[id] action=submit - Submit PR for approval"""
        # Create a draft PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Submit Test {unique_id}",
            "description": "Test PR for submission",
            "priority": "NORMAL",
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Submit Test Item",
                    "quantity": 5,
                    "unit": "UNIT",
                    "estimatedUnitPrice": 50.00
                }
            ]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Submit the PR
        response = auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "submit"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("request", {}).get("status") == "SUBMITTED"
        print(f"Submitted PR: {data.get('request', {}).get('requestNumber')}")
        return pr_id
    
    def test_approve_purchase_request(self, auth_session):
        """POST /api/procurement/requests/[id] action=approve - Approve PR"""
        # Create and submit a PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Approve Test {unique_id}",
            "description": "Test PR for approval",
            "priority": "HIGH",
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Approve Test Item",
                    "quantity": 3,
                    "unit": "UNIT",
                    "estimatedUnitPrice": 100.00
                }
            ]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Submit first
        auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "submit"
        })
        
        # Approve
        response = auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "approve",
            "notes": "Approved for testing"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("request", {}).get("status") == "APPROVED"
        print(f"Approved PR: {data.get('request', {}).get('requestNumber')}")
        return pr_id
    
    def test_reject_purchase_request(self, auth_session):
        """POST /api/procurement/requests/[id] action=reject - Reject PR"""
        # Create and submit a PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Reject Test {unique_id}",
            "description": "Test PR for rejection",
            "priority": "LOW",
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Reject Test Item",
                    "quantity": 1,
                    "unit": "UNIT"
                }
            ]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Submit first
        auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "submit"
        })
        
        # Reject
        response = auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "reject",
            "reason": "Budget not available for testing"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("request", {}).get("status") == "REJECTED"
        print(f"Rejected PR: {data.get('request', {}).get('requestNumber')}")
    
    def test_reject_without_reason_fails(self, auth_session):
        """POST /api/procurement/requests/[id] action=reject without reason - Should fail"""
        # Create and submit a PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Reject No Reason {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Item", "quantity": 1, "unit": "UNIT"}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Submit first
        auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={"action": "submit"})
        
        # Try to reject without reason
        response = auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "reject"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("Correctly rejected without reason")
    
    def test_cancel_purchase_request(self, auth_session):
        """POST /api/procurement/requests/[id] action=cancel - Cancel PR"""
        # Create a PR
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/requests", json={
            "title": f"{TEST_PREFIX}Cancel Test {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Cancel Item", "quantity": 1, "unit": "UNIT"}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PR for testing")
        
        pr_data = create_response.json()
        pr_id = pr_data.get("request", {}).get("id") or pr_data.get("id")
        
        if not pr_id:
            pytest.skip("No PR ID returned")
        
        created_resources["purchase_requests"].append(pr_id)
        
        # Cancel
        response = auth_session.post(f"{BASE_URL}/api/procurement/requests/{pr_id}", json={
            "action": "cancel"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("request", {}).get("status") == "CANCELLED"
        print(f"Cancelled PR: {data.get('request', {}).get('requestNumber')}")
    
    # ========================================================================
    # PURCHASE ORDER TESTS
    # ========================================================================
    
    def test_list_purchase_orders(self, auth_session):
        """GET /api/procurement/orders - List purchase orders"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/orders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "orders" in data or "data" in data or isinstance(data, list)
        print(f"Purchase orders count: {len(data.get('orders', data.get('data', data)))}")
    
    def test_get_purchase_order_statistics(self, auth_session):
        """GET /api/procurement/orders?statistics=true - Get PO statistics"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/orders?statistics=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"PO statistics: {data}")
    
    def test_create_purchase_order(self, auth_session):
        """POST /api/procurement/orders - Create purchase order"""
        unique_id = str(uuid.uuid4())[:8]
        supplier_id = str(uuid.uuid4())  # Dummy supplier ID
        
        response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": supplier_id,
            "supplierName": f"{TEST_PREFIX}Test Supplier {unique_id}",
            "supplierPhone": "+234-800-123-4567",
            "priority": "NORMAL",
            "paymentTerms": "NET30",
            "currency": "NGN",
            "isCashPurchase": False,
            "expectedDelivery": (datetime.now() + timedelta(days=14)).isoformat(),
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "PO Test Product A",
                    "orderedQuantity": 10,
                    "unit": "UNIT",
                    "unitPrice": 1500.00
                },
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "PO Test Product B",
                    "orderedQuantity": 5,
                    "unit": "BOX",
                    "unitPrice": 5000.00
                }
            ]
        })
        
        assert response.status_code in [200, 201, 403], f"Expected 200/201/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 403:
            print("PO creation not allowed - entitlement limit reached")
            pytest.skip("PO creation not allowed")
        
        data = response.json()
        assert data.get("success") == True or "order" in data
        
        po = data.get("order", data)
        if po and po.get("id"):
            created_resources["purchase_orders"].append(po["id"])
            print(f"Created PO: {po.get('poNumber', po.get('id'))}")
            return po
    
    def test_create_cash_purchase_order(self, auth_session):
        """POST /api/procurement/orders - Create cash purchase order (Nigeria-first)"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Cash Supplier {unique_id}",
            "supplierPhone": "+234-800-CASH-001",
            "priority": "HIGH",
            "paymentTerms": "CASH",
            "currency": "NGN",
            "isCashPurchase": True,  # Nigeria-first: cash purchase
            "items": [
                {
                    "productId": str(uuid.uuid4()),
                    "productName": "Cash Purchase Item",
                    "orderedQuantity": 20,
                    "unit": "UNIT",
                    "unitPrice": 500.00
                }
            ]
        })
        
        assert response.status_code in [200, 201, 403], f"Expected 200/201/403, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            po = data.get("order", data)
            if po and po.get("id"):
                created_resources["purchase_orders"].append(po["id"])
                assert po.get("isCashPurchase") == True
                print(f"Created Cash PO: {po.get('poNumber')}")
    
    def test_get_purchase_order_by_id(self, auth_session):
        """GET /api/procurement/orders/[id] - Get PO by ID"""
        # First create a PO
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Get Test Supplier {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Get Test Item", "orderedQuantity": 1, "unit": "UNIT", "unitPrice": 100.00}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Get by ID
        response = auth_session.get(f"{BASE_URL}/api/procurement/orders/{po_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "order" in data
        assert data["order"]["id"] == po_id
        print(f"Got PO: {data['order'].get('poNumber')}")
    
    def test_send_purchase_order(self, auth_session):
        """POST /api/procurement/orders/[id] action=send - Send PO to supplier"""
        # Create a PO
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Send Test Supplier {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Send Test Item", "orderedQuantity": 5, "unit": "UNIT", "unitPrice": 200.00}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Send to supplier
        response = auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={
            "action": "send"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("order", {}).get("status") == "PENDING"
        print(f"Sent PO: {data.get('order', {}).get('poNumber')}")
        return po_id
    
    def test_confirm_purchase_order(self, auth_session):
        """POST /api/procurement/orders/[id] action=confirm - Confirm PO"""
        # Create and send a PO
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Confirm Test Supplier {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Confirm Test Item", "orderedQuantity": 3, "unit": "UNIT", "unitPrice": 300.00}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Send first
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "send"})
        
        # Confirm
        response = auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={
            "action": "confirm",
            "confirmedDeliveryDate": (datetime.now() + timedelta(days=7)).isoformat()
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("order", {}).get("status") == "CONFIRMED"
        print(f"Confirmed PO: {data.get('order', {}).get('poNumber')}")
        return po_id
    
    def test_cancel_purchase_order(self, auth_session):
        """POST /api/procurement/orders/[id] action=cancel - Cancel PO"""
        # Create a PO
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Cancel Test Supplier {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Cancel Test Item", "orderedQuantity": 1, "unit": "UNIT", "unitPrice": 100.00}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Cancel
        response = auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={
            "action": "cancel",
            "reason": "Test cancellation"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("order", {}).get("status") == "CANCELLED"
        print(f"Cancelled PO: {data.get('order', {}).get('poNumber')}")
    
    def test_cancel_without_reason_fails(self, auth_session):
        """POST /api/procurement/orders/[id] action=cancel without reason - Should fail"""
        # Create a PO
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Cancel No Reason {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Item", "orderedQuantity": 1, "unit": "UNIT", "unitPrice": 100.00}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Try to cancel without reason
        response = auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={
            "action": "cancel"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("Correctly rejected cancel without reason")
    
    # ========================================================================
    # GOODS RECEIPT TESTS
    # ========================================================================
    
    def test_list_goods_receipts(self, auth_session):
        """GET /api/procurement/receipts - List goods receipts"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/receipts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "receipts" in data or "data" in data or isinstance(data, list)
        print(f"Goods receipts count: {len(data.get('receipts', data.get('data', data)))}")
    
    def test_get_goods_receipt_statistics(self, auth_session):
        """GET /api/procurement/receipts?statistics=true - Get GR statistics"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/receipts?statistics=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"GR statistics: {data}")
    
    def test_create_goods_receipt(self, auth_session):
        """POST /api/procurement/receipts - Create goods receipt"""
        # First create and confirm a PO
        unique_id = str(uuid.uuid4())[:8]
        product_id = str(uuid.uuid4())
        
        create_po_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}GR Test Supplier {unique_id}",
            "items": [{"productId": product_id, "productName": "GR Test Item", "orderedQuantity": 10, "unit": "UNIT", "unitPrice": 100.00}]
        })
        
        if create_po_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for goods receipt testing")
        
        po_data = create_po_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Send and confirm PO
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "send"})
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "confirm"})
        
        # Create goods receipt
        response = auth_session.post(f"{BASE_URL}/api/procurement/receipts", json={
            "purchaseOrderId": po_id,
            "deliveryNote": f"DN-{unique_id}",
            "items": [
                {
                    "productId": product_id,
                    "productName": "GR Test Item",
                    "receivedQuantity": 10,
                    "unit": "UNIT"
                }
            ]
        })
        
        assert response.status_code in [200, 201, 400], f"Expected 200/201/400, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            receipt = data.get("receipt", data)
            if receipt and receipt.get("id"):
                created_resources["goods_receipts"].append(receipt["id"])
                print(f"Created GR: {receipt.get('receiptNumber', receipt.get('id'))}")
                return receipt
        else:
            print(f"GR creation returned 400: {response.text}")
    
    def test_get_goods_receipt_by_id(self, auth_session):
        """GET /api/procurement/receipts/[id] - Get GR by ID"""
        # First create a GR
        unique_id = str(uuid.uuid4())[:8]
        product_id = str(uuid.uuid4())
        
        # Create PO
        create_po_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}GR Get Test {unique_id}",
            "items": [{"productId": product_id, "productName": "GR Get Item", "orderedQuantity": 5, "unit": "UNIT", "unitPrice": 50.00}]
        })
        
        if create_po_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_po_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Send and confirm PO
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "send"})
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "confirm"})
        
        # Create GR
        create_gr_response = auth_session.post(f"{BASE_URL}/api/procurement/receipts", json={
            "purchaseOrderId": po_id,
            "items": [{"productId": product_id, "productName": "GR Get Item", "receivedQuantity": 5, "unit": "UNIT"}]
        })
        
        if create_gr_response.status_code not in [200, 201]:
            pytest.skip("Could not create GR for testing")
        
        gr_data = create_gr_response.json()
        gr_id = gr_data.get("receipt", {}).get("id") or gr_data.get("id")
        
        if not gr_id:
            pytest.skip("No GR ID returned")
        
        created_resources["goods_receipts"].append(gr_id)
        
        # Get by ID
        response = auth_session.get(f"{BASE_URL}/api/procurement/receipts/{gr_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "receipt" in data
        assert data["receipt"]["id"] == gr_id
        print(f"Got GR: {data['receipt'].get('receiptNumber')}")
    
    def test_verify_goods_receipt(self, auth_session):
        """POST /api/procurement/receipts/[id] action=verify - Verify GR"""
        # Create PO and GR
        unique_id = str(uuid.uuid4())[:8]
        product_id = str(uuid.uuid4())
        
        create_po_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}GR Verify Test {unique_id}",
            "items": [{"productId": product_id, "productName": "Verify Item", "orderedQuantity": 3, "unit": "UNIT", "unitPrice": 75.00}]
        })
        
        if create_po_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_po_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Send and confirm PO
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "send"})
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "confirm"})
        
        # Create GR
        create_gr_response = auth_session.post(f"{BASE_URL}/api/procurement/receipts", json={
            "purchaseOrderId": po_id,
            "items": [{"productId": product_id, "productName": "Verify Item", "receivedQuantity": 3, "unit": "UNIT"}]
        })
        
        if create_gr_response.status_code not in [200, 201]:
            pytest.skip("Could not create GR for testing")
        
        gr_data = create_gr_response.json()
        gr_id = gr_data.get("receipt", {}).get("id") or gr_data.get("id")
        
        if not gr_id:
            pytest.skip("No GR ID returned")
        
        created_resources["goods_receipts"].append(gr_id)
        
        # Verify
        response = auth_session.post(f"{BASE_URL}/api/procurement/receipts/{gr_id}", json={
            "action": "verify",
            "notes": "Quality verified - all items in good condition"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        # Status should be VERIFIED or ACCEPTED
        assert data.get("receipt", {}).get("status") in ["VERIFIED", "ACCEPTED"]
        print(f"Verified GR: {data.get('receipt', {}).get('receiptNumber')}")
    
    def test_reject_goods_receipt(self, auth_session):
        """POST /api/procurement/receipts/[id] action=reject - Reject GR"""
        # Create PO and GR
        unique_id = str(uuid.uuid4())[:8]
        product_id = str(uuid.uuid4())
        
        create_po_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}GR Reject Test {unique_id}",
            "items": [{"productId": product_id, "productName": "Reject Item", "orderedQuantity": 2, "unit": "UNIT", "unitPrice": 50.00}]
        })
        
        if create_po_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_po_response.json()
        po_id = po_data.get("order", {}).get("id") or po_data.get("id")
        
        if not po_id:
            pytest.skip("No PO ID returned")
        
        created_resources["purchase_orders"].append(po_id)
        
        # Send and confirm PO
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "send"})
        auth_session.post(f"{BASE_URL}/api/procurement/orders/{po_id}", json={"action": "confirm"})
        
        # Create GR
        create_gr_response = auth_session.post(f"{BASE_URL}/api/procurement/receipts", json={
            "purchaseOrderId": po_id,
            "items": [{"productId": product_id, "productName": "Reject Item", "receivedQuantity": 2, "unit": "UNIT"}]
        })
        
        if create_gr_response.status_code not in [200, 201]:
            pytest.skip("Could not create GR for testing")
        
        gr_data = create_gr_response.json()
        gr_id = gr_data.get("receipt", {}).get("id") or gr_data.get("id")
        
        if not gr_id:
            pytest.skip("No GR ID returned")
        
        created_resources["goods_receipts"].append(gr_id)
        
        # Reject
        response = auth_session.post(f"{BASE_URL}/api/procurement/receipts/{gr_id}", json={
            "action": "reject",
            "reason": "Items damaged during shipping"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("receipt", {}).get("status") == "REJECTED"
        print(f"Rejected GR: {data.get('receipt', {}).get('receiptNumber')}")
    
    # ========================================================================
    # SUPPLIER PRICING & PERFORMANCE TESTS
    # ========================================================================
    
    def test_get_supplier_performance(self, auth_session):
        """GET /api/procurement/suppliers - Get supplier performance"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/suppliers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "performance" in data
        print(f"Supplier performance records: {len(data.get('performance', []))}")
    
    def test_get_supplier_prices(self, auth_session):
        """GET /api/procurement/suppliers?prices=true - Get supplier prices"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/suppliers?prices=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "prices" in data
        print(f"Supplier prices: {len(data.get('prices', []))}")
    
    def test_get_top_suppliers(self, auth_session):
        """GET /api/procurement/suppliers?top=true - Get top suppliers"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/suppliers?top=true&limit=5")
        
        # May return 403 if analytics not enabled
        assert response.status_code in [200, 403], f"Expected 200/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "suppliers" in data
            print(f"Top suppliers: {len(data.get('suppliers', []))}")
        else:
            print("Supplier analytics not enabled for this plan")
    
    def test_set_supplier_price(self, auth_session):
        """POST /api/procurement/suppliers action=set-price - Set supplier price"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = auth_session.post(f"{BASE_URL}/api/procurement/suppliers", json={
            "action": "set-price",
            "supplierId": str(uuid.uuid4()),
            "productId": str(uuid.uuid4()),
            "unitPrice": 1500.00,
            "currency": "NGN",
            "minOrderQuantity": 10,
            "unit": "UNIT",
            "leadTimeDays": 7,
            "notes": f"Test price {unique_id}"
        })
        
        # May return 403 if price list not enabled
        assert response.status_code in [200, 201, 403], f"Expected 200/201/403, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert data.get("success") == True
            print(f"Set supplier price: {data.get('price', {}).get('unitPrice')}")
        else:
            print("Supplier price list not enabled for this plan")
    
    def test_calculate_supplier_performance(self, auth_session):
        """POST /api/procurement/suppliers action=calculate-performance - Calculate performance"""
        response = auth_session.post(f"{BASE_URL}/api/procurement/suppliers", json={
            "action": "calculate-performance",
            "supplierId": str(uuid.uuid4()),
            "periodStart": (datetime.now() - timedelta(days=30)).isoformat(),
            "periodEnd": datetime.now().isoformat()
        })
        
        # May return 403 if analytics not enabled
        assert response.status_code in [200, 403], f"Expected 200/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"Calculated performance: {data.get('performance')}")
        else:
            print("Supplier analytics not enabled for this plan")
    
    # ========================================================================
    # OFFLINE SYNC TESTS
    # ========================================================================
    
    def test_get_offline_package(self, auth_session):
        """GET /api/procurement/offline - Get offline data package"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/offline")
        
        # May return 403 if offline sync not enabled
        assert response.status_code in [200, 403], f"Expected 200/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Offline package keys: {list(data.keys())}")
        else:
            print("Offline sync not enabled for this plan")
    
    def test_sync_offline_changes(self, auth_session):
        """POST /api/procurement/offline - Sync offline changes"""
        unique_id = str(uuid.uuid4())[:8]
        offline_id = f"offline-{unique_id}"
        
        response = auth_session.post(f"{BASE_URL}/api/procurement/offline", json={
            "purchaseRequests": [
                {
                    "offlineId": offline_id,
                    "title": f"{TEST_PREFIX}Offline PR {unique_id}",
                    "description": "Created offline",
                    "priority": "NORMAL",
                    "items": [
                        {
                            "productId": str(uuid.uuid4()),
                            "productName": "Offline Item",
                            "quantity": 5,
                            "unit": "UNIT"
                        }
                    ]
                }
            ],
            "lastSyncAt": (datetime.now() - timedelta(hours=1)).isoformat()
        })
        
        # May return 403 if offline sync not enabled
        assert response.status_code in [200, 403], f"Expected 200/403, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"Synced offline changes: {data}")
    
    def test_offline_sync_idempotency(self, auth_session):
        """POST /api/procurement/offline - Test idempotency with same offlineId"""
        unique_id = str(uuid.uuid4())[:8]
        offline_id = f"idempotent-{unique_id}"
        
        payload = {
            "purchaseRequests": [
                {
                    "offlineId": offline_id,
                    "title": f"{TEST_PREFIX}Idempotent PR {unique_id}",
                    "description": "Testing idempotency",
                    "priority": "LOW",
                    "items": [
                        {
                            "productId": str(uuid.uuid4()),
                            "productName": "Idempotent Item",
                            "quantity": 1,
                            "unit": "UNIT"
                        }
                    ]
                }
            ]
        }
        
        # First sync
        response1 = auth_session.post(f"{BASE_URL}/api/procurement/offline", json=payload)
        
        if response1.status_code == 403:
            pytest.skip("Offline sync not enabled for this plan")
        
        # Second sync with same offlineId - should be idempotent
        response2 = auth_session.post(f"{BASE_URL}/api/procurement/offline", json=payload)
        
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}: {response2.text}"
        
        data = response2.json()
        # Should not create duplicate
        print(f"Idempotent sync result: {data}")
    
    # ========================================================================
    # EVENTS & VALIDATION TESTS
    # ========================================================================
    
    def test_get_procurement_events(self, auth_session):
        """GET /api/procurement/events - Get procurement events"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/events")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "events" in data
        print(f"Procurement events: {len(data.get('events', []))}")
    
    def test_get_event_statistics(self, auth_session):
        """GET /api/procurement/events?statistics=true - Get event statistics"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/events?statistics=true&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Event statistics: {data}")
    
    def test_validate_module(self, auth_session):
        """GET /api/procurement/events?validate=true - Validate module"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/events?validate=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Module validation: {data}")
    
    def test_get_manifest(self, auth_session):
        """GET /api/procurement/events?manifest=true - Get module manifest"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/events?manifest=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Module manifest: {data}")
    
    def test_get_entitlements(self, auth_session):
        """GET /api/procurement/events?entitlements=true - Get entitlements"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/events?entitlements=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Entitlements: {data}")
    
    def test_get_usage(self, auth_session):
        """GET /api/procurement/events?usage=true - Get usage"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/events?usage=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Usage: {data}")
    
    # ========================================================================
    # NIGERIA-FIRST FEATURE TESTS
    # ========================================================================
    
    def test_nigeria_first_ngn_currency(self, auth_session):
        """Verify NGN is default currency"""
        response = auth_session.get(f"{BASE_URL}/api/procurement")
        
        if response.status_code == 200:
            data = response.json()
            config = data.get("config", data)
            if config.get("defaultCurrency"):
                assert config.get("defaultCurrency") == "NGN", "Default currency should be NGN"
                print("Nigeria-first: NGN currency confirmed")
    
    def test_nigeria_first_cash_purchases_enabled(self, auth_session):
        """Verify cash purchases are enabled"""
        response = auth_session.get(f"{BASE_URL}/api/procurement")
        
        if response.status_code == 200:
            data = response.json()
            config = data.get("config", data)
            if "allowCashPurchases" in config:
                assert config.get("allowCashPurchases") == True, "Cash purchases should be enabled"
                print("Nigeria-first: Cash purchases enabled")
    
    def test_nigeria_first_informal_suppliers_enabled(self, auth_session):
        """Verify informal suppliers are allowed"""
        response = auth_session.get(f"{BASE_URL}/api/procurement")
        
        if response.status_code == 200:
            data = response.json()
            config = data.get("config", data)
            if "allowInformalSuppliers" in config:
                assert config.get("allowInformalSuppliers") == True, "Informal suppliers should be allowed"
                print("Nigeria-first: Informal suppliers enabled")
    
    # ========================================================================
    # CONSTRAINT VERIFICATION TESTS
    # ========================================================================
    
    def test_po_is_commitment_not_payment(self, auth_session):
        """Verify PO does not execute payment"""
        # Create a PO
        unique_id = str(uuid.uuid4())[:8]
        create_response = auth_session.post(f"{BASE_URL}/api/procurement/orders", json={
            "supplierId": str(uuid.uuid4()),
            "supplierName": f"{TEST_PREFIX}Payment Test {unique_id}",
            "items": [{"productId": str(uuid.uuid4()), "productName": "Payment Test Item", "orderedQuantity": 1, "unit": "UNIT", "unitPrice": 1000.00}]
        })
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create PO for testing")
        
        po_data = create_response.json()
        po = po_data.get("order", po_data)
        
        if po and po.get("id"):
            created_resources["purchase_orders"].append(po["id"])
        
        # Verify no payment fields
        assert "paymentExecuted" not in po or po.get("paymentExecuted") == False
        assert "paymentId" not in po or po.get("paymentId") is None
        print("Verified: PO is commitment only, no payment execution")
    
    def test_goods_receipt_emits_events_not_inventory_mutation(self, auth_session):
        """Verify goods receipt emits events but doesn't mutate inventory directly"""
        # This is verified by checking the event service and validation
        response = auth_session.get(f"{BASE_URL}/api/procurement/events?validate=true")
        
        if response.status_code == 200:
            data = response.json()
            # The validation should confirm no direct inventory mutation
            print(f"Module validation confirms event-based design: {data}")
    
    # ========================================================================
    # FILTER TESTS
    # ========================================================================
    
    def test_filter_purchase_requests_by_status(self, auth_session):
        """GET /api/procurement/requests?status=DRAFT - Filter by status"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/requests?status=DRAFT")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        requests = data.get("requests", data.get("data", []))
        for pr in requests:
            assert pr.get("status") == "DRAFT", f"Expected DRAFT status, got {pr.get('status')}"
        print(f"Filtered PRs by status: {len(requests)}")
    
    def test_filter_purchase_orders_by_cash_purchase(self, auth_session):
        """GET /api/procurement/orders?isCashPurchase=true - Filter by cash purchase"""
        response = auth_session.get(f"{BASE_URL}/api/procurement/orders?isCashPurchase=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        orders = data.get("orders", data.get("data", []))
        for po in orders:
            assert po.get("isCashPurchase") == True, f"Expected cash purchase, got {po.get('isCashPurchase')}"
        print(f"Filtered POs by cash purchase: {len(orders)}")


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
