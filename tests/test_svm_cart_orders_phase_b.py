"""
SVM Cart & Order Persistence Tests - Phase B Step 1
Tests for persistent carts per customer and persistent orders using Prisma/PostgreSQL.

Endpoints tested:
- POST /api/svm/cart - Cart operations (ADD_ITEM, UPDATE_QUANTITY, REMOVE_ITEM, SET_SHIPPING, SET_EMAIL, APPLY_PROMO)
- GET /api/svm/cart - Get cart by sessionId or customerId
- DELETE /api/svm/cart - Clear/delete cart
- POST /api/svm/orders - Create order from cart or direct items
- GET /api/svm/orders - List orders with filters
- GET /api/svm/orders/:orderId - Get order by ID
- PUT /api/svm/orders/:orderId - Update order status/payment/fulfillment
- DELETE /api/svm/orders/:orderId - Cancel order

Status Enums:
- SvmOrderStatus: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- SvmPaymentStatus: PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED
- SvmFulfillmentStatus: UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED, RETURNED
"""

import pytest
import requests
import uuid
from datetime import datetime

BASE_URL = "https://code-hygiene-2.preview.emergentagent.com"

# Generate unique IDs for this test run
TEST_RUN_ID = uuid.uuid4().hex[:8]
TEST_TENANT_ID = f"test-tenant-{TEST_RUN_ID}"
TEST_CUSTOMER_ID = f"test-customer-{TEST_RUN_ID}"
TEST_SESSION_ID = f"test-session-{TEST_RUN_ID}"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ============================================================================
# CART API TESTS - Phase B Step 1
# ============================================================================

class TestCartCreateWithSession:
    """Test cart creation with session ID"""

    def test_create_cart_with_session_add_item(self, api_client):
        """POST /api/svm/cart - Create cart with session and add item"""
        session_id = f"session-create-{uuid.uuid4().hex[:8]}"
        
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-001",
            "productName": "Test Product 1",
            "unitPrice": 29.99,
            "quantity": 2
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert "cart" in data
        
        cart = data["cart"]
        assert cart["id"] is not None  # Cart ID should be generated
        assert cart["tenantId"] == TEST_TENANT_ID
        assert cart["sessionId"] == session_id
        assert cart["customerId"] is None  # No customer for session cart
        assert len(cart["items"]) == 1
        assert cart["items"][0]["productId"] == "prod-001"
        assert cart["items"][0]["quantity"] == 2
        assert cart["items"][0]["unitPrice"] == 29.99
        assert cart["items"][0]["lineTotal"] == 59.98  # 29.99 * 2
        assert cart["itemCount"] == 2
        assert cart["subtotal"] == 59.98

    def test_create_cart_with_customer_id(self, api_client):
        """POST /api/svm/cart - Create cart with customer ID"""
        customer_id = f"customer-create-{uuid.uuid4().hex[:8]}"
        
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "customerId": customer_id,
            "action": "ADD_ITEM",
            "productId": "prod-002",
            "productName": "Test Product 2",
            "unitPrice": 49.99,
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["cart"]["customerId"] == customer_id
        assert data["cart"]["sessionId"] is None  # No session for customer cart


class TestCartAddItems:
    """Test adding items to cart"""

    def test_add_item_to_cart(self, api_client):
        """POST /api/svm/cart - Add item to cart"""
        session_id = f"session-add-{uuid.uuid4().hex[:8]}"
        
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-add-001",
            "productName": "Add Test Product",
            "unitPrice": 19.99,
            "quantity": 3
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["cart"]["items"]) == 1
        assert data["cart"]["items"][0]["quantity"] == 3
        assert data["cart"]["itemCount"] == 3

    def test_add_item_with_variant(self, api_client):
        """POST /api/svm/cart - Add item with variant"""
        session_id = f"session-variant-{uuid.uuid4().hex[:8]}"
        
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-var-001",
            "variantId": "var-size-large",
            "productName": "T-Shirt",
            "variantName": "Large",
            "sku": "TSHIRT-L-001",
            "imageUrl": "https://example.com/tshirt.jpg",
            "unitPrice": 24.99,
            "quantity": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        item = data["cart"]["items"][0]
        assert item["productId"] == "prod-var-001"
        assert item["variantId"] == "var-size-large"
        assert item["variantName"] == "Large"
        assert item["sku"] == "TSHIRT-L-001"

    def test_add_same_item_increases_quantity(self, api_client):
        """POST /api/svm/cart - Adding same item increases quantity"""
        session_id = f"session-same-{uuid.uuid4().hex[:8]}"
        
        # Add item first time
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-same-001",
            "productName": "Same Product",
            "unitPrice": 15.00,
            "quantity": 2
        })
        
        # Add same item again
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-same-001",
            "productName": "Same Product",
            "unitPrice": 15.00,
            "quantity": 3
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["cart"]["items"]) == 1  # Still one item
        assert data["cart"]["items"][0]["quantity"] == 5  # 2 + 3
        assert data["cart"]["itemCount"] == 5

    def test_add_item_missing_required_fields(self, api_client):
        """POST /api/svm/cart - Should fail without required fields"""
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": TEST_SESSION_ID,
            "action": "ADD_ITEM",
            "productId": "prod-001"
            # Missing productName, unitPrice
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestCartUpdateQuantity:
    """Test updating item quantity in cart"""

    def test_update_item_quantity(self, api_client):
        """POST /api/svm/cart - Update item quantity"""
        session_id = f"session-update-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-update-001",
            "productName": "Update Test Product",
            "unitPrice": 25.00,
            "quantity": 2
        })
        
        # Update quantity
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "UPDATE_QUANTITY",
            "productId": "prod-update-001",
            "quantity": 5
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["cart"]["items"][0]["quantity"] == 5
        assert data["cart"]["items"][0]["lineTotal"] == 125.00  # 25 * 5

    def test_update_quantity_to_zero_removes_item(self, api_client):
        """POST /api/svm/cart - Setting quantity to 0 removes item"""
        session_id = f"session-zero-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-zero-001",
            "productName": "Zero Test Product",
            "unitPrice": 10.00,
            "quantity": 3
        })
        
        # Set quantity to 0
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "UPDATE_QUANTITY",
            "productId": "prod-zero-001",
            "quantity": 0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["cart"]["items"]) == 0
        assert data["cart"]["itemCount"] == 0

    def test_update_nonexistent_item(self, api_client):
        """POST /api/svm/cart - Update nonexistent item should fail"""
        session_id = f"session-nonexist-{uuid.uuid4().hex[:8]}"
        
        # Create empty cart first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-exist",
            "productName": "Existing Product",
            "unitPrice": 10.00,
            "quantity": 1
        })
        
        # Try to update nonexistent item
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "UPDATE_QUANTITY",
            "productId": "prod-nonexistent",
            "quantity": 5
        })
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False


class TestCartRemoveItems:
    """Test removing items from cart"""

    def test_remove_item_from_cart(self, api_client):
        """POST /api/svm/cart - Remove item from cart"""
        session_id = f"session-remove-{uuid.uuid4().hex[:8]}"
        
        # Add two items
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-remove-001",
            "productName": "Remove Test Product 1",
            "unitPrice": 20.00,
            "quantity": 2
        })
        
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-remove-002",
            "productName": "Remove Test Product 2",
            "unitPrice": 30.00,
            "quantity": 1
        })
        
        # Remove first item
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "REMOVE_ITEM",
            "productId": "prod-remove-001"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["cart"]["items"]) == 1
        assert data["cart"]["items"][0]["productId"] == "prod-remove-002"


class TestCartSetShipping:
    """Test setting shipping info on cart"""

    def test_set_shipping_info(self, api_client):
        """POST /api/svm/cart - Set shipping info"""
        session_id = f"session-shipping-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-ship-001",
            "productName": "Shipping Test Product",
            "unitPrice": 50.00,
            "quantity": 1
        })
        
        # Set shipping
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "SET_SHIPPING",
            "shippingAddress": {
                "name": "John Doe",
                "address1": "123 Main St",
                "city": "New York",
                "state": "NY",
                "postalCode": "10001",
                "country": "US"
            },
            "shippingMethod": "standard",
            "shippingTotal": 9.99
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["cart"]["shippingMethod"] == "standard"
        assert data["cart"]["shippingTotal"] == 9.99
        assert data["cart"]["shippingAddress"]["city"] == "New York"


class TestCartSetEmail:
    """Test setting email on cart"""

    def test_set_email_on_cart(self, api_client):
        """POST /api/svm/cart - Set email on cart"""
        session_id = f"session-email-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-email-001",
            "productName": "Email Test Product",
            "unitPrice": 35.00,
            "quantity": 1
        })
        
        # Set email
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "SET_EMAIL",
            "email": "customer@example.com"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["cart"]["email"] == "customer@example.com"


class TestCartApplyPromo:
    """Test applying promotion code to cart"""

    def test_apply_invalid_promo_code(self, api_client):
        """POST /api/svm/cart - Apply invalid promo code should fail"""
        session_id = f"session-promo-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-promo-001",
            "productName": "Promo Test Product",
            "unitPrice": 100.00,
            "quantity": 1
        })
        
        # Apply invalid promo
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "APPLY_PROMO",
            "promotionCode": "INVALID_CODE_123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "invalid" in data["error"].lower() or "expired" in data["error"].lower()

    def test_apply_promo_missing_code(self, api_client):
        """POST /api/svm/cart - Apply promo without code should fail"""
        response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": TEST_SESSION_ID,
            "action": "APPLY_PROMO"
            # Missing promotionCode
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestCartClearDelete:
    """Test clearing/deleting cart"""

    def test_clear_cart(self, api_client):
        """DELETE /api/svm/cart - Clear cart"""
        session_id = f"session-clear-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-clear-001",
            "productName": "Clear Test Product",
            "unitPrice": 45.00,
            "quantity": 2
        })
        
        # Clear cart
        response = api_client.delete(f"{BASE_URL}/api/svm/cart", params={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "cleared" in data["message"].lower()

    def test_mark_cart_abandoned(self, api_client):
        """DELETE /api/svm/cart - Mark cart as abandoned"""
        session_id = f"session-abandon-{uuid.uuid4().hex[:8]}"
        
        # Add item first
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-abandon-001",
            "productName": "Abandon Test Product",
            "unitPrice": 55.00,
            "quantity": 1
        })
        
        # Mark as abandoned
        response = api_client.delete(f"{BASE_URL}/api/svm/cart", params={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "markAbandoned": "true"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "abandoned" in data["message"].lower()


class TestCartRecovery:
    """Test cart recovery after session loss"""

    def test_get_cart_by_session_id(self, api_client):
        """GET /api/svm/cart - Recover cart by sessionId"""
        session_id = f"session-recover-{uuid.uuid4().hex[:8]}"
        
        # Create cart with items
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-recover-001",
            "productName": "Recovery Test Product",
            "unitPrice": 75.00,
            "quantity": 2
        })
        
        # Recover cart by sessionId
        response = api_client.get(f"{BASE_URL}/api/svm/cart", params={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["cart"]["sessionId"] == session_id
        assert len(data["cart"]["items"]) == 1
        assert data["cart"]["items"][0]["productId"] == "prod-recover-001"

    def test_get_empty_cart_returns_empty_structure(self, api_client):
        """GET /api/svm/cart - Get nonexistent cart returns empty structure"""
        response = api_client.get(f"{BASE_URL}/api/svm/cart", params={
            "tenantId": TEST_TENANT_ID,
            "sessionId": f"nonexistent-session-{uuid.uuid4().hex[:8]}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["cart"]["id"] is None
        assert data["cart"]["items"] == []
        assert data["cart"]["itemCount"] == 0


# ============================================================================
# ORDERS API TESTS - Phase B Step 1
# ============================================================================

class TestOrderCreateFromCart:
    """Test creating order from cart"""

    def test_create_order_from_cart(self, api_client):
        """POST /api/svm/orders - Create order from cart"""
        session_id = f"session-order-{uuid.uuid4().hex[:8]}"
        
        # Create cart with items
        cart_response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-order-001",
            "productName": "Order Test Product",
            "unitPrice": 99.99,
            "quantity": 2
        })
        cart_id = cart_response.json()["cart"]["id"]
        
        # Set email on cart
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "SET_EMAIL",
            "email": "order-test@example.com"
        })
        
        # Create order from cart
        response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "cartId": cart_id,
            "shippingAddress": {
                "name": "John Doe",
                "address1": "123 Main St",
                "city": "New York",
                "state": "NY",
                "postalCode": "10001",
                "country": "US"
            },
            "shippingMethod": "standard",
            "shippingTotal": 9.99,
            "taxTotal": 16.00
        })
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        
        order = data["order"]
        assert order["status"] == "PENDING"
        assert order["paymentStatus"] == "PENDING"
        assert order["fulfillmentStatus"] == "UNFULFILLED"
        assert order["customerEmail"] == "order-test@example.com"
        assert len(order["items"]) == 1
        assert order["items"][0]["productId"] == "prod-order-001"
        assert order["items"][0]["quantity"] == 2
        assert "orderNumber" in order
        assert order["orderNumber"].startswith("ORD-")
        
        # Verify cart is marked as CONVERTED
        cart_check = api_client.get(f"{BASE_URL}/api/svm/cart", params={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id
        })
        # Cart should be empty or not found (converted)
        cart_data = cart_check.json()
        assert cart_data["cart"]["id"] is None or len(cart_data["cart"]["items"]) == 0


class TestOrderCreateWithDirectItems:
    """Test creating order with direct items"""

    def test_create_order_with_direct_items(self, api_client):
        """POST /api/svm/orders - Create order with direct items"""
        response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerId": TEST_CUSTOMER_ID,
            "customerEmail": "direct-order@example.com",
            "customerName": "Direct Order Customer",
            "items": [
                {
                    "productId": "prod-direct-001",
                    "productName": "Direct Product 1",
                    "unitPrice": 49.99,
                    "quantity": 2
                },
                {
                    "productId": "prod-direct-002",
                    "productName": "Direct Product 2",
                    "sku": "SKU-002",
                    "unitPrice": 29.99,
                    "quantity": 1
                }
            ],
            "shippingAddress": {
                "name": "Direct Customer",
                "address1": "456 Oak Ave",
                "city": "Los Angeles",
                "state": "CA",
                "postalCode": "90001",
                "country": "US"
            },
            "shippingMethod": "express",
            "shippingTotal": 14.99,
            "taxTotal": 10.40
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        
        order = data["order"]
        assert order["status"] == "PENDING"
        assert order["customerId"] == TEST_CUSTOMER_ID
        assert order["customerEmail"] == "direct-order@example.com"
        assert len(order["items"]) == 2
        assert order["subtotal"] == 129.97  # (49.99 * 2) + 29.99
        assert order["shippingTotal"] == 14.99
        assert order["taxTotal"] == 10.40
        assert order["grandTotal"] == 155.36  # 129.97 + 14.99 + 10.40

    def test_create_order_missing_email(self, api_client):
        """POST /api/svm/orders - Should fail without customerEmail"""
        response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerId": TEST_CUSTOMER_ID,
            # Missing customerEmail
            "items": [
                {
                    "productId": "prod-001",
                    "productName": "Test Product",
                    "unitPrice": 29.99,
                    "quantity": 1
                }
            ],
            "shippingAddress": {
                "name": "Test",
                "address1": "123 Test St",
                "city": "Test City",
                "postalCode": "12345",
                "country": "US"
            }
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "email" in data["error"].lower()

    def test_create_order_missing_shipping_address(self, api_client):
        """POST /api/svm/orders - Should fail without shippingAddress"""
        response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "test@example.com",
            "items": [
                {
                    "productId": "prod-001",
                    "productName": "Test Product",
                    "unitPrice": 29.99,
                    "quantity": 1
                }
            ]
            # Missing shippingAddress
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "shippingaddress" in data["error"].lower()


class TestOrderGetById:
    """Test getting order by ID"""

    def test_get_order_by_id(self, api_client):
        """GET /api/svm/orders/:orderId - Get order by ID"""
        # Create order first
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "get-order@example.com",
            "items": [
                {
                    "productId": "prod-get-001",
                    "productName": "Get Order Product",
                    "unitPrice": 39.99,
                    "quantity": 1
                }
            ],
            "shippingAddress": {
                "name": "Get Order Customer",
                "address1": "789 Pine St",
                "city": "Chicago",
                "state": "IL",
                "postalCode": "60601",
                "country": "US"
            }
        })
        order_id = create_response.json()["order"]["id"]
        
        # Get order by ID
        response = api_client.get(f"{BASE_URL}/api/svm/orders/{order_id}", params={
            "tenantId": TEST_TENANT_ID
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["id"] == order_id
        assert data["order"]["customerEmail"] == "get-order@example.com"

    def test_get_order_not_found(self, api_client):
        """GET /api/svm/orders/:orderId - Order not found"""
        response = api_client.get(f"{BASE_URL}/api/svm/orders/nonexistent-order-id", params={
            "tenantId": TEST_TENANT_ID
        })
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False

    def test_get_order_wrong_tenant(self, api_client):
        """GET /api/svm/orders/:orderId - Wrong tenant should fail"""
        # Create order first
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "tenant-test@example.com",
            "items": [
                {
                    "productId": "prod-tenant-001",
                    "productName": "Tenant Test Product",
                    "unitPrice": 29.99,
                    "quantity": 1
                }
            ],
            "shippingAddress": {
                "name": "Tenant Test",
                "address1": "123 Test St",
                "city": "Test City",
                "postalCode": "12345",
                "country": "US"
            }
        })
        order_id = create_response.json()["order"]["id"]
        
        # Try to get with wrong tenant
        response = api_client.get(f"{BASE_URL}/api/svm/orders/{order_id}", params={
            "tenantId": "wrong-tenant-id"
        })
        
        assert response.status_code == 403
        data = response.json()
        assert data["success"] is False


class TestOrderListWithFilters:
    """Test listing orders with filters"""

    def test_list_orders_by_tenant(self, api_client):
        """GET /api/svm/orders - List orders by tenant"""
        response = api_client.get(f"{BASE_URL}/api/svm/orders", params={
            "tenantId": TEST_TENANT_ID
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "orders" in data
        assert isinstance(data["orders"], list)
        assert "pagination" in data

    def test_list_orders_with_status_filter(self, api_client):
        """GET /api/svm/orders - List orders with status filter"""
        response = api_client.get(f"{BASE_URL}/api/svm/orders", params={
            "tenantId": TEST_TENANT_ID,
            "status": "PENDING"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # All returned orders should have PENDING status
        for order in data["orders"]:
            assert order["status"] == "PENDING"

    def test_list_orders_with_pagination(self, api_client):
        """GET /api/svm/orders - List orders with pagination"""
        response = api_client.get(f"{BASE_URL}/api/svm/orders", params={
            "tenantId": TEST_TENANT_ID,
            "limit": 5,
            "offset": 0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["pagination"]["limit"] == 5
        assert data["pagination"]["offset"] == 0


class TestOrderStatusTransitions:
    """Test order status transitions"""

    def test_order_status_pending_to_confirmed(self, api_client):
        """PUT /api/svm/orders/:orderId - PENDING -> CONFIRMED"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "status-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 10, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Update status to CONFIRMED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "CONFIRMED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["status"] == "CONFIRMED"

    def test_order_status_confirmed_to_processing(self, api_client):
        """PUT /api/svm/orders/:orderId - CONFIRMED -> PROCESSING"""
        # Create and confirm order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "processing-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 10, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "CONFIRMED"
        })
        
        # Update to PROCESSING
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "PROCESSING"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["status"] == "PROCESSING"

    def test_order_status_processing_to_shipped(self, api_client):
        """PUT /api/svm/orders/:orderId - PROCESSING -> SHIPPED"""
        # Create order and move through statuses
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "shipped-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 10, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "CONFIRMED"})
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "PROCESSING"})
        
        # Update to SHIPPED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "SHIPPED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["status"] == "SHIPPED"

    def test_order_status_shipped_to_delivered(self, api_client):
        """PUT /api/svm/orders/:orderId - SHIPPED -> DELIVERED"""
        # Create order and move through statuses
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "delivered-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 10, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "CONFIRMED"})
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "PROCESSING"})
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "SHIPPED"})
        
        # Update to DELIVERED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "DELIVERED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["status"] == "DELIVERED"
        assert data["order"]["deliveredAt"] is not None

    def test_invalid_status_transition(self, api_client):
        """PUT /api/svm/orders/:orderId - Invalid status transition should fail"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "invalid-transition@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 10, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Try to skip from PENDING to SHIPPED (invalid)
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "SHIPPED"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "invalid" in data["error"].lower() or "transition" in data["error"].lower()


class TestOrderPaymentStatus:
    """Test order payment status transitions"""

    def test_payment_status_pending_to_captured(self, api_client):
        """PUT /api/svm/orders/:orderId - Payment PENDING -> CAPTURED"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "payment-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 50, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Update payment status to CAPTURED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "paymentStatus": "CAPTURED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["paymentStatus"] == "CAPTURED"
        assert data["order"]["paidAt"] is not None

    def test_payment_status_pending_to_authorized(self, api_client):
        """PUT /api/svm/orders/:orderId - Payment PENDING -> AUTHORIZED"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "auth-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 50, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Update payment status to AUTHORIZED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "paymentStatus": "AUTHORIZED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["paymentStatus"] == "AUTHORIZED"


class TestOrderFulfillmentStatus:
    """Test order fulfillment status transitions"""

    def test_fulfillment_status_unfulfilled_to_fulfilled(self, api_client):
        """PUT /api/svm/orders/:orderId - Fulfillment UNFULFILLED -> FULFILLED"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "fulfillment-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 30, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Update fulfillment status to FULFILLED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "fulfillmentStatus": "FULFILLED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["fulfillmentStatus"] == "FULFILLED"

    def test_fulfillment_status_partially_fulfilled(self, api_client):
        """PUT /api/svm/orders/:orderId - Fulfillment UNFULFILLED -> PARTIALLY_FULFILLED"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "partial-fulfillment@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 30, "quantity": 2}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Update fulfillment status to PARTIALLY_FULFILLED
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "fulfillmentStatus": "PARTIALLY_FULFILLED"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["fulfillmentStatus"] == "PARTIALLY_FULFILLED"


class TestOrderTrackingInfo:
    """Test adding tracking info to orders"""

    def test_add_tracking_info(self, api_client):
        """PUT /api/svm/orders/:orderId - Add tracking info"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "tracking-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 40, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Add tracking info
        response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "trackingNumber": "1Z999AA10123456784",
            "trackingUrl": "https://ups.com/track/1Z999AA10123456784",
            "shippingCarrier": "UPS"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["trackingNumber"] == "1Z999AA10123456784"
        assert data["order"]["trackingUrl"] == "https://ups.com/track/1Z999AA10123456784"
        assert data["order"]["shippingCarrier"] == "UPS"
        assert data["order"]["shippedAt"] is not None  # Should be set when tracking added


class TestOrderCancel:
    """Test cancelling orders"""

    def test_cancel_pending_order(self, api_client):
        """DELETE /api/svm/orders/:orderId - Cancel pending order"""
        # Create order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "cancel-test@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 25, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        # Cancel order
        response = api_client.delete(f"{BASE_URL}/api/svm/orders/{order_id}", params={
            "tenantId": TEST_TENANT_ID
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["status"] == "CANCELLED"
        assert data["order"]["cancelledAt"] is not None

    def test_cancel_confirmed_order(self, api_client):
        """DELETE /api/svm/orders/:orderId - Cancel confirmed order"""
        # Create and confirm order
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "cancel-confirmed@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 25, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "CONFIRMED"
        })
        
        # Cancel order
        response = api_client.delete(f"{BASE_URL}/api/svm/orders/{order_id}", params={
            "tenantId": TEST_TENANT_ID
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["order"]["status"] == "CANCELLED"

    def test_cannot_cancel_delivered_order(self, api_client):
        """DELETE /api/svm/orders/:orderId - Cannot cancel delivered order"""
        # Create order and move to DELIVERED
        create_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "customerEmail": "no-cancel@example.com",
            "items": [{"productId": "prod-001", "productName": "Test", "unitPrice": 25, "quantity": 1}],
            "shippingAddress": {"name": "Test", "address1": "123 St", "city": "City", "postalCode": "12345", "country": "US"}
        })
        order_id = create_response.json()["order"]["id"]
        
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "CONFIRMED"})
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "PROCESSING"})
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "SHIPPED"})
        api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={"tenantId": TEST_TENANT_ID, "status": "DELIVERED"})
        
        # Try to cancel
        response = api_client.delete(f"{BASE_URL}/api/svm/orders/{order_id}", params={
            "tenantId": TEST_TENANT_ID
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestCartConvertedOnOrderCreate:
    """Test that cart is marked as CONVERTED when order is created"""

    def test_cart_marked_converted_after_order(self, api_client):
        """Verify cart status changes to CONVERTED after order creation"""
        session_id = f"session-convert-{uuid.uuid4().hex[:8]}"
        
        # Create cart with items
        cart_response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-convert-001",
            "productName": "Convert Test Product",
            "unitPrice": 79.99,
            "quantity": 1
        })
        cart_id = cart_response.json()["cart"]["id"]
        
        # Set email
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "SET_EMAIL",
            "email": "convert-test@example.com"
        })
        
        # Create order from cart
        order_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "cartId": cart_id,
            "shippingAddress": {
                "name": "Convert Test",
                "address1": "123 Convert St",
                "city": "Convert City",
                "postalCode": "12345",
                "country": "US"
            }
        })
        
        assert order_response.status_code == 201
        
        # Try to get cart - should be empty/not found (converted)
        cart_check = api_client.get(f"{BASE_URL}/api/svm/cart", params={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id
        })
        
        cart_data = cart_check.json()
        # Cart should either be null or have no items (converted carts are not returned as ACTIVE)
        assert cart_data["cart"]["id"] is None or cart_data["cart"]["items"] == []


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestFullOrderLifecycle:
    """Integration test for complete order lifecycle"""

    def test_complete_order_flow(self, api_client):
        """Test complete flow: Cart -> Order -> Status Updates -> Delivery"""
        session_id = f"session-lifecycle-{uuid.uuid4().hex[:8]}"
        
        # Step 1: Create cart and add items
        cart_response = api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-lifecycle-001",
            "productName": "Lifecycle Product 1",
            "unitPrice": 49.99,
            "quantity": 2
        })
        assert cart_response.status_code == 200
        cart_id = cart_response.json()["cart"]["id"]
        
        # Step 2: Add another item
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "ADD_ITEM",
            "productId": "prod-lifecycle-002",
            "productName": "Lifecycle Product 2",
            "unitPrice": 29.99,
            "quantity": 1
        })
        
        # Step 3: Set shipping
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "SET_SHIPPING",
            "shippingAddress": {
                "name": "Lifecycle Customer",
                "address1": "123 Lifecycle St",
                "city": "Lifecycle City",
                "state": "LC",
                "postalCode": "12345",
                "country": "US"
            },
            "shippingMethod": "express",
            "shippingTotal": 14.99
        })
        
        # Step 4: Set email
        api_client.post(f"{BASE_URL}/api/svm/cart", json={
            "tenantId": TEST_TENANT_ID,
            "sessionId": session_id,
            "action": "SET_EMAIL",
            "email": "lifecycle@example.com"
        })
        
        # Step 5: Create order from cart
        order_response = api_client.post(f"{BASE_URL}/api/svm/orders", json={
            "tenantId": TEST_TENANT_ID,
            "cartId": cart_id,
            "shippingAddress": {
                "name": "Lifecycle Customer",
                "address1": "123 Lifecycle St",
                "city": "Lifecycle City",
                "state": "LC",
                "postalCode": "12345",
                "country": "US"
            },
            "shippingMethod": "express",
            "shippingTotal": 14.99,
            "taxTotal": 10.40
        })
        assert order_response.status_code == 201
        order_id = order_response.json()["order"]["id"]
        assert order_response.json()["order"]["status"] == "PENDING"
        
        # Step 6: Confirm order
        confirm_response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "CONFIRMED"
        })
        assert confirm_response.status_code == 200
        assert confirm_response.json()["order"]["status"] == "CONFIRMED"
        
        # Step 7: Capture payment
        payment_response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "paymentStatus": "CAPTURED"
        })
        assert payment_response.status_code == 200
        assert payment_response.json()["order"]["paymentStatus"] == "CAPTURED"
        
        # Step 8: Start processing
        processing_response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "PROCESSING"
        })
        assert processing_response.status_code == 200
        assert processing_response.json()["order"]["status"] == "PROCESSING"
        
        # Step 9: Ship order with tracking
        ship_response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "SHIPPED",
            "trackingNumber": "1Z999AA10123456784",
            "trackingUrl": "https://ups.com/track/1Z999AA10123456784",
            "shippingCarrier": "UPS"
        })
        assert ship_response.status_code == 200
        assert ship_response.json()["order"]["status"] == "SHIPPED"
        assert ship_response.json()["order"]["trackingNumber"] == "1Z999AA10123456784"
        
        # Step 10: Mark as delivered
        deliver_response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "DELIVERED"
        })
        assert deliver_response.status_code == 200
        assert deliver_response.json()["order"]["status"] == "DELIVERED"
        
        # Step 11: Mark as fulfilled
        fulfill_response = api_client.put(f"{BASE_URL}/api/svm/orders/{order_id}", json={
            "tenantId": TEST_TENANT_ID,
            "fulfillmentStatus": "FULFILLED"
        })
        assert fulfill_response.status_code == 200
        assert fulfill_response.json()["order"]["fulfillmentStatus"] == "FULFILLED"
        
        # Verify final order state
        final_order = api_client.get(f"{BASE_URL}/api/svm/orders/{order_id}", params={
            "tenantId": TEST_TENANT_ID
        })
        assert final_order.status_code == 200
        final_data = final_order.json()["order"]
        assert final_data["status"] == "DELIVERED"
        assert final_data["paymentStatus"] == "CAPTURED"
        assert final_data["fulfillmentStatus"] == "FULFILLED"
        assert final_data["paidAt"] is not None
        assert final_data["shippedAt"] is not None
        assert final_data["deliveredAt"] is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
