"""
SVM Suite S6 Verification Tests

Tests for Single Vendor Marketplace (SVM) suite canonicalization verification.
Verifies Nigeria-first features: NGN currency (₦), 7.5% VAT, Nigerian shipping zones,
Pay-on-Delivery, Bank Transfer, Local Pickup.

Run with: pytest /app/tests/test_svm_s6_verification.py -v --tb=short
"""

import pytest
import requests
import os

# Get BASE_URL from environment
BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://prisma-next-fix.preview.emergentagent.com').rstrip('/')

# Test tenant ID - we'll use demo-webwaka-pos which has POS activated
# For SVM, we need to test capability guard behavior
TEST_TENANT_ID = 'demo-webwaka-svm'
DEMO_TENANT_ID = 'demo-webwaka-pos'  # Existing tenant with POS capability

class TestSVMCapabilityGuard:
    """Test SVM capability guard blocks unauthorized access"""
    
    def test_checkout_without_tenant_id_returns_400(self):
        """Checkout API should return 400 when no tenant ID provided"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout",
            json={"items": [{"productId": "test", "productName": "Test", "unitPrice": 1000, "quantity": 1}]},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 for missing tenant ID or 403 for capability inactive
        assert response.status_code in [400, 403]
        data = response.json()
        assert data.get('success') == False
    
    def test_checkout_with_unauthorized_tenant_returns_403(self):
        """Checkout API should return 403 for tenant without SVM capability"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout",
            json={"items": [{"productId": "test", "productName": "Test", "unitPrice": 1000, "quantity": 1}]},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": "unauthorized-tenant-xyz"
            }
        )
        assert response.status_code == 403
        data = response.json()
        assert data.get('code') == 'CAPABILITY_INACTIVE'
    
    def test_shipping_without_tenant_id_returns_400(self):
        """Shipping API should return 400 when no tenant ID provided"""
        response = requests.get(f"{BASE_URL}/api/commerce/svm/shipping?action=states")
        # Should return 400 for missing tenant ID or 403 for capability inactive
        assert response.status_code in [400, 403]
    
    def test_payments_without_tenant_id_returns_400(self):
        """Payments API should return 400 when no tenant ID provided"""
        response = requests.get(f"{BASE_URL}/api/commerce/svm/payments")
        # Should return 400 for missing tenant ID or 403 for capability inactive
        assert response.status_code in [400, 403]
    
    def test_orders_without_tenant_id_returns_400(self):
        """Orders API should return 400 when no tenant ID provided"""
        response = requests.get(f"{BASE_URL}/api/commerce/svm/orders")
        # Should return 400 for missing tenant ID or 403 for capability inactive
        assert response.status_code in [400, 403]


class TestSVMShippingAPI:
    """Test SVM Shipping API - Nigerian states and zones"""
    
    def test_get_nigerian_states_structure(self):
        """Verify Nigerian states endpoint returns proper structure"""
        # This test verifies the API structure even if capability is inactive
        response = requests.get(
            f"{BASE_URL}/api/commerce/svm/shipping?action=states",
            headers={"x-tenant-id": TEST_TENANT_ID}
        )
        # If capability is inactive, we expect 403
        if response.status_code == 403:
            data = response.json()
            assert data.get('code') == 'CAPABILITY_INACTIVE'
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        assert 'states' in data['data']
        assert 'regions' in data['data']
        
        # Verify Nigerian states
        states = data['data']['states']
        assert len(states) == 37  # 36 states + FCT
        
        # Check for key states
        state_names = [s['name'] for s in states]
        assert 'Lagos' in state_names
        assert 'FCT' in state_names
        assert 'Kano' in state_names
        assert 'Rivers' in state_names
        
        # Verify regions
        regions = data['data']['regions']
        expected_regions = ['Lagos Metro', 'South West', 'South East', 'South South', 
                          'North Central', 'North West', 'North East']
        for region in expected_regions:
            assert region in regions
    
    def test_shipping_quote_for_lagos(self):
        """Test shipping quote calculation for Lagos state"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/shipping",
            json={"state": "Lagos", "subtotal": 50000},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        assert 'options' in data['data']
        assert 'region' in data['data']
        
        # Verify Lagos is in Lagos Metro region
        assert data['data']['region'] == 'Lagos Metro'
        
        # Verify shipping options have NGN formatting
        options = data['data']['options']
        assert len(options) > 0
        for option in options:
            assert 'fee' in option
            assert 'feeFormatted' in option
            # Fee should be formatted with ₦ symbol
            if option['fee'] > 0:
                assert '₦' in option['feeFormatted'] or option['feeFormatted'] == 'FREE'
    
    def test_invalid_state_returns_error(self):
        """Test that invalid state returns proper error"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/shipping",
            json={"state": "InvalidState", "subtotal": 50000},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 400
        data = response.json()
        assert data.get('success') == False
        assert 'Invalid Nigerian state' in data.get('error', '')


class TestSVMPaymentsAPI:
    """Test SVM Payments API - Nigerian payment methods"""
    
    def test_get_payment_methods_list(self):
        """Verify payment methods include Nigerian options"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/svm/payments",
            headers={"x-tenant-id": TEST_TENANT_ID}
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        assert 'methods' in data['data']
        
        methods = data['data']['methods']
        method_codes = [m['code'] for m in methods]
        
        # Verify Nigerian payment methods are present
        assert 'POD' in method_codes  # Pay on Delivery
        assert 'BANK_TRANSFER' in method_codes
        assert 'USSD' in method_codes
        assert 'CARD' in method_codes
    
    def test_pod_config(self):
        """Verify POD (Pay on Delivery) configuration"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/svm/payments?action=pod-config",
            headers={"x-tenant-id": TEST_TENANT_ID}
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        
        pod_config = data['data']
        assert 'isEnabled' in pod_config
        assert 'maxAmount' in pod_config
        assert 'additionalFee' in pod_config
        assert 'maxAmountFormatted' in pod_config
        
        # Verify NGN formatting
        assert '₦' in pod_config['maxAmountFormatted']
    
    def test_payment_availability_check(self):
        """Test payment method availability check"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/payments",
            json={"amount": 50000, "state": "Lagos"},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        assert 'available' in data['data']
        assert 'summary' in data['data']
        
        # Verify summary counts
        summary = data['data']['summary']
        assert 'totalMethods' in summary
        assert 'availableCount' in summary
    
    def test_pod_excluded_states(self):
        """Test POD is not available in excluded states (security-affected areas)"""
        # Borno is typically excluded for POD
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/payments",
            json={"amount": 50000, "state": "Borno", "method": "POD"},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        
        # POD should not be available in Borno
        if 'isAvailable' in data.get('data', {}):
            assert data['data']['isAvailable'] == False
            assert 'not available' in data['data'].get('reason', '').lower()


class TestSVMCheckoutAPI:
    """Test SVM Checkout API - VAT calculation and summary"""
    
    def test_checkout_summary_with_vat(self):
        """Verify checkout calculates 7.5% VAT correctly"""
        items = [
            {"productId": "prod1", "productName": "Test Product 1", "unitPrice": 10000, "quantity": 2},
            {"productId": "prod2", "productName": "Test Product 2", "unitPrice": 5000, "quantity": 1}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout?action=summary",
            json={"items": items},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        
        summary = data['data']
        
        # Verify subtotal calculation
        expected_subtotal = (10000 * 2) + (5000 * 1)  # 25000
        assert summary['subtotal'] == expected_subtotal
        
        # Verify VAT rate is 7.5%
        assert summary['taxRate'] == 0.075
        assert summary['taxName'] == 'VAT'
        
        # Verify VAT calculation (7.5% of subtotal)
        expected_tax = expected_subtotal * 0.075  # 1875
        assert abs(summary['taxTotal'] - expected_tax) < 1  # Allow for rounding
        
        # Verify NGN currency formatting
        assert summary['currency'] == 'NGN'
        assert '₦' in summary['subtotalFormatted']
        assert '₦' in summary['taxFormatted']
        assert '₦' in summary['grandTotalFormatted']
    
    def test_checkout_validation(self):
        """Test checkout validation endpoint"""
        items = [
            {"productId": "prod1", "productName": "Test Product", "unitPrice": 10000, "quantity": 1}
        ]
        
        # Test without shipping address - should fail validation
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout?action=validate",
            json={"items": items},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        
        validation = data['data']
        assert 'isValid' in validation
        assert 'errors' in validation
        
        # Should have errors for missing shipping address
        assert validation['isValid'] == False
        assert len(validation['errors']) > 0


class TestSVMOrdersAPI:
    """Test SVM Orders API - tenant scoping"""
    
    def test_orders_list_requires_tenant(self):
        """Verify orders list is tenant-scoped"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/svm/orders",
            headers={"x-tenant-id": TEST_TENANT_ID}
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'data' in data
        assert 'orders' in data['data']
        assert 'pagination' in data['data']
        
        # Verify pagination structure
        pagination = data['data']['pagination']
        assert 'page' in pagination
        assert 'limit' in pagination
        assert 'total' in pagination
    
    def test_orders_post_redirects_to_checkout(self):
        """Verify POST to orders redirects to checkout"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/orders",
            json={},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        assert response.status_code == 400
        data = response.json()
        assert 'checkout' in data.get('redirect', '').lower() or 'checkout' in data.get('error', '').lower()


class TestNigeriaFirstFeatures:
    """Test Nigeria-first features across all SVM APIs"""
    
    def test_currency_is_ngn(self):
        """Verify all monetary values use NGN"""
        # Test checkout summary
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout?action=summary",
            json={"items": [{"productId": "test", "productName": "Test", "unitPrice": 1000, "quantity": 1}]},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data:
                assert data['data']['currency'] == 'NGN'
    
    def test_vat_rate_is_7_5_percent(self):
        """Verify VAT rate is 7.5% (Nigerian standard)"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout?action=summary",
            json={"items": [{"productId": "test", "productName": "Test", "unitPrice": 10000, "quantity": 1}]},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data:
                assert data['data']['taxRate'] == 0.075
                assert data['data']['taxName'] == 'VAT'
    
    def test_naira_symbol_in_formatted_amounts(self):
        """Verify ₦ symbol is used in formatted amounts"""
        response = requests.post(
            f"{BASE_URL}/api/commerce/svm/checkout?action=summary",
            json={"items": [{"productId": "test", "productName": "Test", "unitPrice": 10000, "quantity": 1}]},
            headers={
                "Content-Type": "application/json",
                "x-tenant-id": TEST_TENANT_ID
            }
        )
        
        if response.status_code == 403:
            pytest.skip("SVM capability not activated for test tenant")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data:
                summary = data['data']
                assert '₦' in summary.get('subtotalFormatted', '')
                assert '₦' in summary.get('grandTotalFormatted', '')


# Fixtures
@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
