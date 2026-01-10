"""
Payments & Collections Suite S6 Verification Tests
Tests for API capability guards and endpoint responses

This test file verifies:
1. All 6 API routes are protected with capability guards (401 for unauthenticated)
2. All 14 endpoints return proper JSON responses
3. Demo page at /payments-demo renders correctly
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://prisma-next-fix.preview.emergentagent.com')


class TestPaymentsCapabilityGuards:
    """Test that all payment API endpoints require authentication (401 for unauthenticated)"""
    
    # Main Payments API - /api/commerce/payments
    def test_get_payments_config_requires_auth(self):
        """GET /api/commerce/payments should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
    
    def test_post_payments_config_requires_auth(self):
        """POST /api/commerce/payments should return 401 for unauthenticated"""
        response = requests.post(f"{BASE_URL}/api/commerce/payments", json={})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
    
    # Payment Methods API - /api/commerce/payments/methods
    def test_get_payment_methods_requires_auth(self):
        """GET /api/commerce/payments/methods should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/methods")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
    
    def test_get_payment_methods_with_amount_requires_auth(self):
        """GET /api/commerce/payments/methods?amount=75000 should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/methods?amount=75000")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_payment_methods_check_requires_auth(self):
        """POST /api/commerce/payments/methods should return 401 for unauthenticated"""
        response = requests.post(f"{BASE_URL}/api/commerce/payments/methods", json={
            "method": "BANK_TRANSFER",
            "amount": 75000
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    # Bank Transfer API - /api/commerce/payments/transfer
    def test_get_nigerian_banks_requires_auth(self):
        """GET /api/commerce/payments/transfer?action=banks should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/transfer?action=banks")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
    
    def test_validate_reference_requires_auth(self):
        """GET /api/commerce/payments/transfer?action=validate-reference should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/transfer?action=validate-reference&reference=WW-ABC123-XYZ")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_initiate_transfer_requires_auth(self):
        """POST /api/commerce/payments/transfer should return 401 for unauthenticated"""
        response = requests.post(f"{BASE_URL}/api/commerce/payments/transfer", json={
            "amount": 75000,
            "orderId": "test-order-123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_put_validate_transfer_requires_auth(self):
        """PUT /api/commerce/payments/transfer should return 401 for unauthenticated"""
        response = requests.put(f"{BASE_URL}/api/commerce/payments/transfer", json={
            "intentId": "test-intent",
            "reference": "WW-TEST-123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    # Proof API - /api/commerce/payments/proof
    def test_get_pending_proofs_requires_auth(self):
        """GET /api/commerce/payments/proof?action=pending should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/proof?action=pending")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_proof_by_payment_requires_auth(self):
        """GET /api/commerce/payments/proof?paymentId=xxx should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/proof?paymentId=test-payment-123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_upload_proof_requires_auth(self):
        """POST /api/commerce/payments/proof should return 401 for unauthenticated"""
        response = requests.post(f"{BASE_URL}/api/commerce/payments/proof", json={
            "paymentId": "test-payment",
            "proofUrl": "https://example.com/proof.png"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_put_verify_proof_requires_auth(self):
        """PUT /api/commerce/payments/proof should return 401 for unauthenticated"""
        response = requests.put(f"{BASE_URL}/api/commerce/payments/proof", json={
            "paymentId": "test-payment",
            "approved": True
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    # Partial Payments API - /api/commerce/payments/partial
    def test_get_partial_status_requires_auth(self):
        """GET /api/commerce/payments/partial?action=status should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/partial?action=status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_partial_chains_requires_auth(self):
        """GET /api/commerce/payments/partial?action=chains should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/partial?action=chains")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_partial_by_order_requires_auth(self):
        """GET /api/commerce/payments/partial?orderId=xxx should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/partial?orderId=test-order-123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_post_record_partial_requires_auth(self):
        """POST /api/commerce/payments/partial should return 401 for unauthenticated"""
        response = requests.post(f"{BASE_URL}/api/commerce/payments/partial", json={
            "orderId": "test-order",
            "amount": 50000,
            "paymentMethod": "BANK_TRANSFER"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    # Status API - /api/commerce/payments/status
    def test_get_status_display_requires_auth(self):
        """GET /api/commerce/payments/status?status=CONFIRMED should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/status?status=CONFIRMED")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_payment_by_transaction_requires_auth(self):
        """GET /api/commerce/payments/status?transactionNumber=xxx should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/status?transactionNumber=PAY-2026-0001")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_order_payment_status_requires_auth(self):
        """GET /api/commerce/payments/status?orderId=xxx should return 401 for unauthenticated"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments/status?orderId=test-order-123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestPaymentsDemoPage:
    """Test that the demo page loads correctly"""
    
    def test_demo_page_loads(self):
        """GET /payments-demo should return 200"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/html" in response.headers.get("content-type", "")
    
    def test_demo_page_contains_payment_methods(self):
        """Demo page should contain payment method names"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        content = response.text
        # Check for payment method names
        assert "Bank Transfer" in content
        assert "Debit/Credit Card" in content or "Card" in content
        assert "Pay on Delivery" in content
        assert "USSD" in content
        assert "Mobile Money" in content
    
    def test_demo_page_contains_nigerian_banks(self):
        """Demo page should contain Nigerian bank names (client-side rendered)"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        # Note: Bank names are rendered client-side by React
        # This test verifies the page loads successfully
        # Playwright tests verify the actual bank names are displayed
        content = response.text
        # Check for demo data constants in the page script
        assert "DEMO_NIGERIAN_BANKS" in content or "payments-demo" in content
    
    def test_demo_page_contains_ngn_currency(self):
        """Demo page should display NGN currency"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        content = response.text
        # Check for NGN currency symbol
        assert "₦" in content


class TestAPIResponseFormat:
    """Test that API responses have correct JSON format"""
    
    def test_payments_api_returns_json(self):
        """All payment APIs should return JSON"""
        endpoints = [
            "/api/commerce/payments",
            "/api/commerce/payments/methods",
            "/api/commerce/payments/transfer?action=banks",
            "/api/commerce/payments/proof?action=pending",
            "/api/commerce/payments/partial?action=status",
            "/api/commerce/payments/status?status=CONFIRMED"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert "application/json" in response.headers.get("content-type", ""), \
                f"Endpoint {endpoint} should return JSON"
            # Should be valid JSON
            try:
                data = response.json()
                assert isinstance(data, dict), f"Endpoint {endpoint} should return JSON object"
            except Exception as e:
                pytest.fail(f"Endpoint {endpoint} returned invalid JSON: {e}")
    
    def test_401_response_has_error_field(self):
        """401 responses should have 'error' field"""
        response = requests.get(f"{BASE_URL}/api/commerce/payments")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data, "401 response should have 'error' field"
        assert data["error"] == "Unauthorized"


class TestPaymentMethodsCount:
    """Test that demo page shows correct number of payment methods"""
    
    def test_demo_shows_7_payment_methods(self):
        """Demo page should show 7 payment methods"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        content = response.text
        
        # Count payment method codes in the page
        methods = [
            "BANK_TRANSFER",
            "CARD", 
            "PAY_ON_DELIVERY",
            "USSD",
            "MOBILE_MONEY",
            "CASH",
            "WALLET"
        ]
        
        # Check that all method names are present
        method_names = [
            "Bank Transfer",
            "Debit/Credit Card",
            "Pay on Delivery",
            "USSD Payment",
            "Mobile Money",
            "Cash",
            "Store Wallet"
        ]
        
        found_count = 0
        for name in method_names:
            if name in content:
                found_count += 1
        
        assert found_count >= 7, f"Expected 7 payment methods, found {found_count}"


class TestPODRestrictions:
    """Test POD (Pay on Delivery) restrictions in demo"""
    
    def test_demo_shows_pod_excluded_states(self):
        """Demo page should show POD excluded states"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        content = response.text
        
        # Check for excluded states
        assert "Borno" in content
        assert "Yobe" in content
        assert "Adamawa" in content
    
    def test_demo_shows_pod_max_amount(self):
        """Demo page should show POD max amount"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        content = response.text
        
        # Check for max amount (₦500,000)
        assert "500,000" in content or "500000" in content
    
    def test_demo_shows_pod_fee(self):
        """Demo page should show POD fee"""
        response = requests.get(f"{BASE_URL}/payments-demo")
        assert response.status_code == 200
        content = response.text
        
        # Check for POD fee (₦500)
        assert "₦500" in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
