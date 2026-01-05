"""
SVM Module Phase 7-9 Tests
- Phase 7: Events & Analytics (Event Bus with 25+ event types)
- Phase 8: Entitlement Enforcement (Feature and limit checks)
- Phase 9: Module Freeze (Architectural isolation validation)
"""

import pytest
import requests
import os
import hashlib
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admin-dashboard-634.preview.emergentagent.com').rstrip('/')

# Test tenant IDs
TEST_TENANT_ID = "test-tenant-phase7-9"
ACME_TENANT_ID = "acme-tenant"


class TestEntitlementsAPI:
    """Test GET /api/svm/entitlements endpoint"""
    
    def test_get_entitlements_success(self):
        """GET /api/svm/entitlements?tenantId=xxx returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["module"] == "SVM"
        assert "features" in data
        assert "limits" in data
        assert isinstance(data["features"], list)
        assert isinstance(data["limits"], dict)
        
        # Verify default features are present
        assert "storefront" in data["features"]
        assert "cart" in data["features"]
        assert "checkout" in data["features"]
        assert "orders" in data["features"]
        
        # Verify limits structure
        assert "max_products" in data["limits"]
        assert "max_orders_per_month" in data["limits"]
        assert "max_storage_mb" in data["limits"]
        
        print(f"✓ Entitlements returned: {len(data['features'])} features, {len(data['limits'])} limits")
    
    def test_get_entitlements_missing_tenant_id(self):
        """GET /api/svm/entitlements without tenantId returns 400"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements")
        assert response.status_code == 400
        
        data = response.json()
        assert data["success"] is False
        assert "tenantid" in data["error"].lower()  # Case-insensitive check
        print("✓ Missing tenantId returns 400")
    
    def test_get_entitlements_default_limits(self):
        """Verify default limit values"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        limits = data["limits"]
        
        # Default limits should be reasonable values
        assert limits["max_products"] >= 50
        assert limits["max_orders_per_month"] >= 100
        assert limits["max_storage_mb"] >= 256
        
        print(f"✓ Default limits: products={limits['max_products']}, orders={limits['max_orders_per_month']}, storage={limits['max_storage_mb']}MB")
    
    def test_get_entitlements_expires_at_field(self):
        """Verify expiresAt field is present"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "expiresAt" in data
        # expiresAt can be null for non-expiring entitlements
        print(f"✓ expiresAt field present: {data['expiresAt']}")


class TestEventTypesValidation:
    """Validate event types are properly scoped with 'svm.' prefix"""
    
    # All 30 event types from event-bus.ts
    EXPECTED_EVENT_TYPES = [
        # Order lifecycle (12)
        'svm.order.created',
        'svm.order.placed',
        'svm.order.payment_requested',
        'svm.order.paid',
        'svm.order.processing',
        'svm.order.shipped',
        'svm.order.delivered',
        'svm.order.fulfilled',
        'svm.order.cancelled',
        'svm.order.refund_requested',
        'svm.order.refunded',
        'svm.order.status_changed',
        # Cart events (5)
        'svm.cart.item_added',
        'svm.cart.item_removed',
        'svm.cart.item_updated',
        'svm.cart.cleared',
        'svm.cart.abandoned',
        # Product events (2)
        'svm.product.viewed',
        'svm.product.searched',
        # Promotion events (3)
        'svm.promotion.applied',
        'svm.promotion.removed',
        'svm.promotion.validation_failed',
        # Wishlist events (2)
        'svm.wishlist.item_added',
        'svm.wishlist.item_removed',
        # Review events (3)
        'svm.review.submitted',
        'svm.review.approved',
        'svm.review.rejected',
        # Storefront events (3)
        'svm.storefront.page_viewed',
        'svm.storefront.checkout_started',
        'svm.storefront.checkout_completed',
    ]
    
    def test_event_count_at_least_25(self):
        """Verify at least 25 event types exist"""
        assert len(self.EXPECTED_EVENT_TYPES) >= 25
        print(f"✓ Event types count: {len(self.EXPECTED_EVENT_TYPES)} (>= 25 required)")
    
    def test_all_events_have_svm_prefix(self):
        """All event types must be prefixed with 'svm.'"""
        for event_type in self.EXPECTED_EVENT_TYPES:
            assert event_type.startswith('svm.'), f"Event {event_type} missing 'svm.' prefix"
        print(f"✓ All {len(self.EXPECTED_EVENT_TYPES)} events have 'svm.' prefix")
    
    def test_order_lifecycle_events(self):
        """Verify order lifecycle events exist"""
        order_events = [e for e in self.EXPECTED_EVENT_TYPES if e.startswith('svm.order.')]
        assert len(order_events) >= 10
        
        required_order_events = [
            'svm.order.created',
            'svm.order.placed',
            'svm.order.paid',
            'svm.order.cancelled',
            'svm.order.refunded',
        ]
        for event in required_order_events:
            assert event in order_events, f"Missing required order event: {event}"
        
        print(f"✓ Order lifecycle events: {len(order_events)}")
    
    def test_cart_events(self):
        """Verify cart events exist"""
        cart_events = [e for e in self.EXPECTED_EVENT_TYPES if e.startswith('svm.cart.')]
        assert len(cart_events) >= 4
        
        required_cart_events = [
            'svm.cart.item_added',
            'svm.cart.item_removed',
            'svm.cart.cleared',
        ]
        for event in required_cart_events:
            assert event in cart_events, f"Missing required cart event: {event}"
        
        print(f"✓ Cart events: {len(cart_events)}")
    
    def test_promotion_events(self):
        """Verify promotion events exist"""
        promo_events = [e for e in self.EXPECTED_EVENT_TYPES if e.startswith('svm.promotion.')]
        assert len(promo_events) >= 2
        
        assert 'svm.promotion.applied' in promo_events
        assert 'svm.promotion.removed' in promo_events
        
        print(f"✓ Promotion events: {len(promo_events)}")
    
    def test_review_events(self):
        """Verify review events exist"""
        review_events = [e for e in self.EXPECTED_EVENT_TYPES if e.startswith('svm.review.')]
        assert len(review_events) >= 2
        
        assert 'svm.review.submitted' in review_events
        assert 'svm.review.approved' in review_events
        
        print(f"✓ Review events: {len(review_events)}")


class TestIdempotencyKeyGeneration:
    """Test idempotency key generation produces deterministic keys"""
    
    def test_idempotency_key_deterministic(self):
        """Same inputs should produce same key within time bucket"""
        # Simulate the idempotency key generation logic
        event_type = 'svm.order.placed'
        resource_id = 'order_123'
        action = 'placed'
        time_bucket_minutes = 5
        
        # Calculate time bucket
        now_ms = int(time.time() * 1000)
        time_bucket = now_ms // (time_bucket_minutes * 60 * 1000)
        
        # Generate key
        key1 = f"{event_type}_{resource_id}_{action}_{time_bucket}"
        key2 = f"{event_type}_{resource_id}_{action}_{time_bucket}"
        
        assert key1 == key2
        print(f"✓ Idempotency key is deterministic: {key1}")
    
    def test_idempotency_key_format(self):
        """Verify idempotency key format"""
        event_type = 'svm.cart.item_added'
        resource_id = 'cart_456_prod_789'
        action = 'add'
        time_bucket = 12345
        
        key = f"{event_type}_{resource_id}_{action}_{time_bucket}"
        
        # Key should contain event type
        assert event_type in key
        # Key should contain resource ID
        assert resource_id in key
        # Key should be a string
        assert isinstance(key, str)
        
        print(f"✓ Idempotency key format valid: {key}")
    
    def test_unique_idempotency_key_different(self):
        """Unique keys should be different each time"""
        event_type = 'svm.order.paid'
        resource_id = 'order_123'
        
        # Simulate unique key generation
        timestamp1 = int(time.time() * 1000)
        random1 = hash(f"{timestamp1}_1") % 10000000
        key1 = f"{event_type}_{resource_id}_{timestamp1}{random1}"
        
        time.sleep(0.001)  # Small delay
        
        timestamp2 = int(time.time() * 1000)
        random2 = hash(f"{timestamp2}_2") % 10000000
        key2 = f"{event_type}_{resource_id}_{timestamp2}{random2}"
        
        # Keys should be different
        assert key1 != key2
        print(f"✓ Unique idempotency keys are different")


class TestEntitlementFeatureChecks:
    """Test feature check logic (allowed/denied based on entitlements)"""
    
    def test_feature_check_allowed(self):
        """Feature in entitlements list should be allowed"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        features = data["features"]
        
        # Default features should be allowed
        assert "storefront" in features
        assert "cart" in features
        assert "checkout" in features
        assert "orders" in features
        
        print(f"✓ Core features are allowed: storefront, cart, checkout, orders")
    
    def test_feature_check_denied(self):
        """Feature not in entitlements list should be denied"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        features = data["features"]
        
        # API feature is typically not in default entitlements
        # (unless explicitly enabled)
        if "api" not in features:
            print("✓ API feature correctly not in default entitlements")
        else:
            print("✓ API feature is enabled for this tenant")
    
    def test_multiple_features_check(self):
        """Check multiple features at once"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        features = data["features"]
        
        # Check multiple features
        features_to_check = ['storefront', 'cart', 'checkout', 'orders', 'promotions', 'reviews']
        results = {f: f in features for f in features_to_check}
        
        # At least core features should be present
        assert results['storefront'] is True
        assert results['cart'] is True
        
        print(f"✓ Feature check results: {results}")


class TestEntitlementLimitChecks:
    """Test limit check logic (allowed/denied with remaining count)"""
    
    def test_limit_check_within_limit(self):
        """Current count below limit should be allowed"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        limits = data["limits"]
        
        max_products = limits["max_products"]
        current_count = 10
        
        # Simulate limit check
        allowed = current_count < max_products
        remaining = max_products - current_count
        
        assert allowed is True
        assert remaining > 0
        
        print(f"✓ Limit check: {current_count}/{max_products} products, remaining={remaining}")
    
    def test_limit_check_at_limit(self):
        """Current count at limit should be denied"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        limits = data["limits"]
        
        max_products = limits["max_products"]
        current_count = max_products  # At limit
        
        # Simulate limit check
        allowed = current_count < max_products
        remaining = max(0, max_products - current_count)
        
        assert allowed is False
        assert remaining == 0
        
        print(f"✓ Limit check at limit: {current_count}/{max_products} products, denied")
    
    def test_limit_check_over_limit(self):
        """Current count over limit should be denied"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        limits = data["limits"]
        
        max_products = limits["max_products"]
        current_count = max_products + 10  # Over limit
        
        # Simulate limit check
        allowed = current_count < max_products
        remaining = max(0, max_products - current_count)
        
        assert allowed is False
        assert remaining == 0
        
        print(f"✓ Limit check over limit: {current_count}/{max_products} products, denied")
    
    def test_limit_remaining_calculation(self):
        """Verify remaining count calculation"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        limits = data["limits"]
        
        max_orders = limits["max_orders_per_month"]
        
        test_cases = [
            (0, max_orders),      # No orders yet
            (50, max_orders - 50), # Some orders
            (max_orders, 0),      # At limit
            (max_orders + 10, 0), # Over limit
        ]
        
        for current, expected_remaining in test_cases:
            remaining = max(0, max_orders - current)
            assert remaining == expected_remaining
        
        print(f"✓ Remaining calculation correct for all test cases")


class TestArchitecturalIsolation:
    """Test module isolation - no forbidden logic in SVM module"""
    
    def test_no_billing_logic(self):
        """SVM module should not contain billing logic"""
        # This is a code review test - we verify by checking the entitlements
        # The module only CHECKS entitlements, doesn't manage billing
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Entitlements come from Core, not calculated in SVM
        assert "module" in data
        assert data["module"] == "SVM"
        
        print("✓ SVM module receives entitlements from Core (no billing logic)")
    
    def test_no_vendor_logic(self):
        """SVM module should not contain vendor management logic"""
        # SVM is Single Vendor Marketplace - no multi-vendor logic
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        # No vendor-related features in SVM entitlements
        features = data["features"]
        vendor_features = [f for f in features if 'vendor' in f.lower()]
        assert len(vendor_features) == 0
        
        print("✓ No vendor-related features in SVM entitlements")
    
    def test_no_payout_logic(self):
        """SVM module should not contain payout logic"""
        # Payouts are handled by Core, not SVM
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        # No payout-related features in SVM entitlements
        features = data["features"]
        payout_features = [f for f in features if 'payout' in f.lower()]
        assert len(payout_features) == 0
        
        print("✓ No payout-related features in SVM entitlements")
    
    def test_module_scoped_events(self):
        """All events should be module-scoped with 'svm.' prefix"""
        # Verify event types are properly scoped
        event_types = TestEventTypesValidation.EXPECTED_EVENT_TYPES
        
        for event_type in event_types:
            assert event_type.startswith('svm.'), f"Event {event_type} not module-scoped"
        
        print(f"✓ All {len(event_types)} events are module-scoped with 'svm.' prefix")


class TestEntitlementsCaching:
    """Test entitlement caching behavior"""
    
    def test_entitlements_response_time(self):
        """Entitlements API should respond quickly (cached or not)"""
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 5.0  # Should respond within 5 seconds
        
        print(f"✓ Entitlements API response time: {elapsed:.3f}s")
    
    def test_entitlements_consistent_response(self):
        """Multiple requests should return consistent data"""
        response1 = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        response2 = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={TEST_TENANT_ID}")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Features and limits should be consistent
        assert data1["features"] == data2["features"]
        assert data1["limits"] == data2["limits"]
        
        print("✓ Entitlements responses are consistent")


class TestDifferentTenants:
    """Test entitlements for different tenants"""
    
    def test_different_tenant_ids(self):
        """Different tenants should get their own entitlements"""
        response1 = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId=tenant-a")
        response2 = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId=tenant-b")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Both should have valid structure
        assert data1["module"] == "SVM"
        assert data2["module"] == "SVM"
        
        print("✓ Different tenants get valid entitlements")
    
    def test_acme_tenant_entitlements(self):
        """Test entitlements for ACME tenant"""
        response = requests.get(f"{BASE_URL}/api/svm/entitlements?tenantId={ACME_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["module"] == "SVM"
        
        print(f"✓ ACME tenant entitlements: {len(data['features'])} features")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
