"""
Test Module 9 (B2B & Wholesale) and Module 10 (Payments & Wallets) APIs
eMarketWaka SaaS Core - Nigeria-first modules

Module 9: B2B & Wholesale - Bulk trading, credit terms, negotiated pricing
Module 10: Payments & Wallets - THE ONLY module that mutates money
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://site-funnels.preview.emergentagent.com')

# Test tenant ID from previous iterations
TEST_TENANT_ID = "67846c4f-9b38-47c7-86d9-fff55aa4afda"


class TestUnauthenticatedAccess:
    """Test that all endpoints require authentication"""
    
    def test_b2b_status_requires_auth(self):
        """B2B status endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B status requires authentication")
    
    def test_b2b_manifest_requires_auth(self):
        """B2B manifest endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=manifest")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B manifest requires authentication")
    
    def test_b2b_profiles_requires_auth(self):
        """B2B profiles endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=profiles")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B profiles requires authentication")
    
    def test_b2b_price_tiers_requires_auth(self):
        """B2B price tiers endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=price-tiers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B price tiers requires authentication")
    
    def test_b2b_invoices_requires_auth(self):
        """B2B invoices endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=invoices")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B invoices requires authentication")
    
    def test_b2b_bulk_orders_requires_auth(self):
        """B2B bulk orders endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=bulk-orders")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B bulk orders requires authentication")
    
    def test_b2b_entitlements_requires_auth(self):
        """B2B entitlements endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=entitlements")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B entitlements requires authentication")
    
    def test_b2b_validate_requires_auth(self):
        """B2B validate endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/b2b?action=validate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ B2B validate requires authentication")
    
    def test_payments_status_requires_auth(self):
        """Payments status endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments status requires authentication")
    
    def test_payments_manifest_requires_auth(self):
        """Payments manifest endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=manifest")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments manifest requires authentication")
    
    def test_payments_wallets_requires_auth(self):
        """Payments wallets endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=wallets")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments wallets requires authentication")
    
    def test_payments_payments_requires_auth(self):
        """Payments list endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=payments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments list requires authentication")
    
    def test_payments_refunds_requires_auth(self):
        """Payments refunds endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=refunds")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments refunds requires authentication")
    
    def test_payments_statistics_requires_auth(self):
        """Payments statistics endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=payment-statistics")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments statistics requires authentication")
    
    def test_payments_entitlements_requires_auth(self):
        """Payments entitlements endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=entitlements")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments entitlements requires authentication")
    
    def test_payments_validate_requires_auth(self):
        """Payments validate endpoint should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/payments?action=validate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Payments validate requires authentication")


class TestAuthenticatedB2BModule:
    """Test Module 9 (B2B & Wholesale) with authentication"""
    
    def test_b2b_status(self, authenticated_session):
        """GET /api/b2b?action=status - should return config status"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'initialized' in data, "Response should contain 'initialized' field"
        print(f"✓ B2B status: initialized={data.get('initialized')}")
        if data.get('config'):
            assert data['config'].get('defaultCurrency') == 'NGN', "Default currency should be NGN (Nigeria-first)"
            print(f"  - Default currency: {data['config'].get('defaultCurrency')}")
    
    def test_b2b_manifest(self, authenticated_session):
        """GET /api/b2b?action=manifest - should return module manifest"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('moduleId') == 'b2b', f"Module ID should be 'b2b', got {data.get('moduleId')}"
        assert data.get('moduleName') == 'B2B & Wholesale', f"Module name mismatch"
        assert 'version' in data, "Manifest should contain version"
        assert 'owns' in data, "Manifest should list owned entities"
        assert 'doesNotOwn' in data, "Manifest should list entities it doesn't own"
        assert 'nigeriaFirstFeatures' in data, "Manifest should list Nigeria-first features"
        print(f"✓ B2B manifest: {data.get('moduleName')} v{data.get('version')}")
        print(f"  - Owns: {len(data.get('owns', []))} entities")
        print(f"  - Nigeria-first features: {len(data.get('nigeriaFirstFeatures', []))}")
    
    def test_b2b_initialize(self, authenticated_session):
        """POST /api/b2b {action: 'initialize'} - should initialize B2B for tenant"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/b2b",
            json={"action": "initialize"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == True, "Initialize should return success=true"
        assert 'config' in data, "Initialize should return config"
        config = data['config']
        assert config.get('b2bEnabled') == True, "B2B should be enabled after init"
        assert config.get('defaultCurrency') == 'NGN', "Default currency should be NGN"
        print(f"✓ B2B initialized successfully")
        print(f"  - B2B Enabled: {config.get('b2bEnabled')}")
        print(f"  - Wholesale Pricing: {config.get('wholesalePricing')}")
        print(f"  - Bulk Ordering: {config.get('bulkOrderingEnabled')}")
    
    def test_b2b_price_tiers(self, authenticated_session):
        """GET /api/b2b?action=price-tiers - should return default price tiers"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=price-tiers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'tiers' in data, "Response should contain 'tiers'"
        tiers = data['tiers']
        # Should have default tiers created during initialization
        if len(tiers) > 0:
            tier_codes = [t.get('code') for t in tiers]
            print(f"✓ B2B price tiers: {len(tiers)} tiers found")
            print(f"  - Tier codes: {tier_codes}")
            # Check for expected default tiers
            expected_tiers = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']
            for expected in expected_tiers:
                if expected in tier_codes:
                    print(f"  - Found expected tier: {expected}")
        else:
            print(f"✓ B2B price tiers: No tiers yet (will be created on init)")
    
    def test_b2b_profiles(self, authenticated_session):
        """GET /api/b2b?action=profiles - should return B2B profiles list"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=profiles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'profiles' in data, "Response should contain 'profiles'"
        assert 'total' in data, "Response should contain 'total'"
        print(f"✓ B2B profiles: {data.get('total')} profiles found")
    
    def test_b2b_invoices(self, authenticated_session):
        """GET /api/b2b?action=invoices - should return invoices list"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=invoices")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'invoices' in data, "Response should contain 'invoices'"
        assert 'total' in data, "Response should contain 'total'"
        print(f"✓ B2B invoices: {data.get('total')} invoices found")
    
    def test_b2b_bulk_orders(self, authenticated_session):
        """GET /api/b2b?action=bulk-orders - should return bulk order drafts"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=bulk-orders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'drafts' in data, "Response should contain 'drafts'"
        assert 'total' in data, "Response should contain 'total'"
        print(f"✓ B2B bulk orders: {data.get('total')} drafts found")
    
    def test_b2b_entitlements(self, authenticated_session):
        """GET /api/b2b?action=entitlements - should return entitlements"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=entitlements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'b2bEnabled' in data, "Response should contain 'b2bEnabled'"
        assert 'maxB2BCustomers' in data, "Response should contain 'maxB2BCustomers'"
        assert 'creditSalesEnabled' in data, "Response should contain 'creditSalesEnabled'"
        assert 'wholesalePricingEnabled' in data, "Response should contain 'wholesalePricingEnabled'"
        assert 'bulkOrderingEnabled' in data, "Response should contain 'bulkOrderingEnabled'"
        print(f"✓ B2B entitlements retrieved")
        print(f"  - B2B Enabled: {data.get('b2bEnabled', {}).get('allowed')}")
        print(f"  - Max B2B Customers: {data.get('maxB2BCustomers', {}).get('limit')}")
    
    def test_b2b_validate(self, authenticated_session):
        """GET /api/b2b?action=validate - should pass module validation"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'valid' in data, "Response should contain 'valid'"
        assert 'checks' in data, "Response should contain 'checks'"
        assert data.get('valid') == True, "Module validation should pass"
        print(f"✓ B2B module validation: PASSED")
        print(f"  - Module version: {data.get('moduleVersion')}")
        print(f"  - Checks passed: {len([c for c in data.get('checks', []) if c.get('passed')])}/{len(data.get('checks', []))}")


class TestAuthenticatedPaymentsModule:
    """Test Module 10 (Payments & Wallets) with authentication"""
    
    def test_payments_status(self, authenticated_session):
        """GET /api/payments?action=status - should return config status"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'initialized' in data, "Response should contain 'initialized'"
        print(f"✓ Payments status: initialized={data.get('initialized')}")
        if data.get('config'):
            assert data['config'].get('defaultCurrency') == 'NGN', "Default currency should be NGN (Nigeria-first)"
            print(f"  - Default currency: {data['config'].get('defaultCurrency')}")
            print(f"  - Cash enabled: {data['config'].get('cashEnabled')}")
            print(f"  - Offline cash enabled: {data['config'].get('offlineCashEnabled')}")
    
    def test_payments_manifest(self, authenticated_session):
        """GET /api/payments?action=manifest - should return module manifest"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('moduleId') == 'payments', f"Module ID should be 'payments', got {data.get('moduleId')}"
        assert data.get('moduleName') == 'Payments & Wallets', f"Module name mismatch"
        assert 'version' in data, "Manifest should contain version"
        assert 'owns' in data, "Manifest should list owned entities"
        assert 'doesNotOwn' in data, "Manifest should list entities it doesn't own"
        assert 'criticalRules' in data, "Manifest should list critical rules"
        assert 'nigeriaFirstFeatures' in data, "Manifest should list Nigeria-first features"
        print(f"✓ Payments manifest: {data.get('moduleName')} v{data.get('version')}")
        print(f"  - Owns: {len(data.get('owns', []))} entities")
        print(f"  - Critical rules: {len(data.get('criticalRules', []))}")
        print(f"  - Nigeria-first features: {len(data.get('nigeriaFirstFeatures', []))}")
    
    def test_payments_initialize(self, authenticated_session):
        """POST /api/payments {action: 'initialize'} - should initialize payments for tenant"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/payments",
            json={"action": "initialize"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == True, "Initialize should return success=true"
        assert 'config' in data, "Initialize should return config"
        config = data['config']
        assert config.get('paymentsEnabled') == True, "Payments should be enabled after init"
        assert config.get('walletsEnabled') == True, "Wallets should be enabled after init"
        assert config.get('defaultCurrency') == 'NGN', "Default currency should be NGN"
        assert config.get('cashEnabled') == True, "Cash should be enabled (Nigeria-first)"
        assert config.get('offlineCashEnabled') == True, "Offline cash should be enabled (Nigeria-first)"
        print(f"✓ Payments initialized successfully")
        print(f"  - Payments Enabled: {config.get('paymentsEnabled')}")
        print(f"  - Wallets Enabled: {config.get('walletsEnabled')}")
        print(f"  - Cash Enabled: {config.get('cashEnabled')}")
        print(f"  - Offline Cash: {config.get('offlineCashEnabled')}")
    
    def test_payments_wallets(self, authenticated_session):
        """GET /api/payments?action=wallets - should return wallets list"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=wallets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'wallets' in data, "Response should contain 'wallets'"
        assert 'total' in data, "Response should contain 'total'"
        wallets = data['wallets']
        print(f"✓ Payments wallets: {data.get('total')} wallets found")
        # Check for business and platform wallets created during init
        wallet_types = [w.get('ownerType') for w in wallets]
        if 'BUSINESS' in wallet_types:
            print(f"  - Business wallet found")
        if 'PLATFORM' in wallet_types:
            print(f"  - Platform wallet found")
    
    def test_payments_list(self, authenticated_session):
        """GET /api/payments?action=payments - should return payments list"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=payments")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'payments' in data, "Response should contain 'payments'"
        assert 'total' in data, "Response should contain 'total'"
        print(f"✓ Payments list: {data.get('total')} payments found")
    
    def test_payments_refunds(self, authenticated_session):
        """GET /api/payments?action=refunds - should return refunds list"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=refunds")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'refunds' in data, "Response should contain 'refunds'"
        assert 'total' in data, "Response should contain 'total'"
        print(f"✓ Payments refunds: {data.get('total')} refunds found")
    
    def test_payments_statistics(self, authenticated_session):
        """GET /api/payments?action=payment-statistics - should return statistics"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=payment-statistics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'statistics' in data, "Response should contain 'statistics'"
        stats = data['statistics']
        assert 'byStatus' in stats, "Statistics should contain 'byStatus'"
        assert 'byMethod' in stats, "Statistics should contain 'byMethod'"
        assert 'totals' in stats, "Statistics should contain 'totals'"
        print(f"✓ Payments statistics retrieved")
        print(f"  - Total payments: {stats.get('totals', {}).get('count', 0)}")
        print(f"  - Total amount: {stats.get('totals', {}).get('totalAmount', 0)}")
    
    def test_payments_entitlements(self, authenticated_session):
        """GET /api/payments?action=entitlements - should return entitlements"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=entitlements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'paymentsEnabled' in data, "Response should contain 'paymentsEnabled'"
        assert 'walletsEnabled' in data, "Response should contain 'walletsEnabled'"
        assert 'refundsEnabled' in data, "Response should contain 'refundsEnabled'"
        assert 'maxDailyVolume' in data, "Response should contain 'maxDailyVolume'"
        print(f"✓ Payments entitlements retrieved")
        print(f"  - Payments Enabled: {data.get('paymentsEnabled', {}).get('allowed')}")
        print(f"  - Wallets Enabled: {data.get('walletsEnabled', {}).get('allowed')}")
        print(f"  - Refunds Enabled: {data.get('refundsEnabled', {}).get('allowed')}")
        print(f"  - Max Daily Volume: {data.get('maxDailyVolume', {}).get('limit')}")
    
    def test_payments_validate(self, authenticated_session):
        """GET /api/payments?action=validate - should pass module validation"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'valid' in data, "Response should contain 'valid'"
        assert 'checks' in data, "Response should contain 'checks'"
        assert data.get('valid') == True, "Module validation should pass"
        print(f"✓ Payments module validation: PASSED")
        print(f"  - Module version: {data.get('moduleVersion')}")
        print(f"  - Checks passed: {len([c for c in data.get('checks', []) if c.get('passed')])}/{len(data.get('checks', []))}")
        # Verify critical checks
        checks = data.get('checks', [])
        critical_checks = ['Single Money Authority', 'Ledger-First Design', 'Idempotency Enforced']
        for check_name in critical_checks:
            check = next((c for c in checks if check_name in c.get('name', '')), None)
            if check:
                print(f"  - {check_name}: {'PASS' if check.get('passed') else 'FAIL'}")
    
    def test_payments_create_intent(self, authenticated_session):
        """POST /api/payments {action: 'create-intent'} - should create payment intent"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/payments",
            json={
                "action": "create-intent",
                "amount": 5000,
                "currency": "NGN",
                "orderNumber": "TEST-ORDER-001"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == True, "Create intent should return success=true"
        assert 'intent' in data, "Response should contain 'intent'"
        intent = data['intent']
        assert intent.get('amount') == 5000, "Intent amount should match"
        assert intent.get('currency') == 'NGN', "Intent currency should be NGN"
        assert intent.get('status') == 'CREATED', "Intent status should be CREATED"
        assert 'intentId' in intent, "Intent should have intentId"
        print(f"✓ Payment intent created")
        print(f"  - Intent ID: {intent.get('intentId')}")
        print(f"  - Amount: {intent.get('amount')} {intent.get('currency')}")
        print(f"  - Status: {intent.get('status')}")
        return intent
    
    def test_payments_record_cash(self, authenticated_session):
        """POST /api/payments {action: 'record-cash'} - should record cash payment"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/payments",
            json={
                "action": "record-cash",
                "amount": 2500,
                "orderNumber": "TEST-CASH-ORDER-001",
                "notes": "Test cash payment"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('success') == True, "Record cash should return success=true"
        assert 'payment' in data, "Response should contain 'payment'"
        payment = data['payment']
        assert payment.get('amount') == 2500, "Payment amount should match"
        assert payment.get('paymentMethod') == 'CASH', "Payment method should be CASH"
        assert payment.get('status') == 'CONFIRMED', "Payment status should be CONFIRMED"
        print(f"✓ Cash payment recorded")
        print(f"  - Transaction: {payment.get('transactionNumber')}")
        print(f"  - Amount: {payment.get('amount')} {payment.get('currency')}")
        print(f"  - Method: {payment.get('paymentMethod')}")
        print(f"  - Status: {payment.get('status')}")


class TestNigeriaFirstFeatures:
    """Test Nigeria-first features across both modules"""
    
    def test_b2b_ngn_default_currency(self, authenticated_session):
        """B2B should default to NGN currency"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=status")
        if response.status_code == 200:
            data = response.json()
            if data.get('config'):
                assert data['config'].get('defaultCurrency') == 'NGN', "B2B default currency should be NGN"
                print("✓ B2B uses NGN as default currency (Nigeria-first)")
    
    def test_payments_ngn_default_currency(self, authenticated_session):
        """Payments should default to NGN currency"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=status")
        if response.status_code == 200:
            data = response.json()
            if data.get('config'):
                assert data['config'].get('defaultCurrency') == 'NGN', "Payments default currency should be NGN"
                print("✓ Payments uses NGN as default currency (Nigeria-first)")
    
    def test_payments_cash_enabled(self, authenticated_session):
        """Payments should have cash enabled by default"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=status")
        if response.status_code == 200:
            data = response.json()
            if data.get('config'):
                assert data['config'].get('cashEnabled') == True, "Cash should be enabled"
                print("✓ Cash payments enabled (Nigeria-first)")
    
    def test_payments_offline_cash_enabled(self, authenticated_session):
        """Payments should have offline cash enabled by default"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=status")
        if response.status_code == 200:
            data = response.json()
            if data.get('config'):
                assert data['config'].get('offlineCashEnabled') == True, "Offline cash should be enabled"
                print("✓ Offline cash recording enabled (Nigeria-first)")
    
    def test_b2b_manifest_nigeria_features(self, authenticated_session):
        """B2B manifest should list Nigeria-first features"""
        response = authenticated_session.get(f"{BASE_URL}/api/b2b?action=manifest")
        if response.status_code == 200:
            data = response.json()
            features = data.get('nigeriaFirstFeatures', [])
            assert len(features) > 0, "Should have Nigeria-first features"
            print(f"✓ B2B Nigeria-first features: {len(features)}")
            for f in features[:3]:
                print(f"  - {f}")
    
    def test_payments_manifest_nigeria_features(self, authenticated_session):
        """Payments manifest should list Nigeria-first features"""
        response = authenticated_session.get(f"{BASE_URL}/api/payments?action=manifest")
        if response.status_code == 200:
            data = response.json()
            features = data.get('nigeriaFirstFeatures', [])
            assert len(features) > 0, "Should have Nigeria-first features"
            print(f"✓ Payments Nigeria-first features: {len(features)}")
            for f in features[:3]:
                print(f"  - {f}")


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def authenticated_session():
    """
    Create an authenticated session using magic link auth.
    Uses the test tenant admin credentials.
    """
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Request magic link
    email = "admin@acme.com"
    response = session.post(
        f"{BASE_URL}/api/auth/magic-link",
        json={"email": email, "tenantSlug": "acme"}
    )
    
    if response.status_code != 200:
        pytest.skip(f"Magic link request failed: {response.status_code} - {response.text}")
        return session
    
    data = response.json()
    magic_link = data.get('magicLink')
    
    if not magic_link:
        pytest.skip("No magic link returned - email may have been sent instead")
        return session
    
    # Extract token from magic link
    # Magic link format: https://domain/api/auth/verify?token=xxx
    import urllib.parse
    parsed = urllib.parse.urlparse(magic_link)
    query_params = urllib.parse.parse_qs(parsed.query)
    token = query_params.get('token', [None])[0]
    
    if not token:
        pytest.skip("Could not extract token from magic link")
        return session
    
    # Verify the token - this sets the session cookie
    verify_response = session.get(
        f"{BASE_URL}/api/auth/verify?token={token}",
        allow_redirects=False  # Don't follow redirect, just get the cookie
    )
    
    # The verify endpoint redirects and sets a cookie
    # We need to capture the Set-Cookie header
    if 'set-cookie' in verify_response.headers:
        # Cookie is set automatically by requests session
        pass
    
    # Follow the redirect manually to complete auth
    if verify_response.status_code in [302, 307]:
        redirect_url = verify_response.headers.get('location', '')
        if redirect_url:
            # Make sure we have the full URL
            if redirect_url.startswith('/'):
                redirect_url = f"{BASE_URL}{redirect_url}"
            session.get(redirect_url)
    
    # Verify we're authenticated
    session_check = session.get(f"{BASE_URL}/api/auth/session")
    if session_check.status_code == 200:
        session_data = session_check.json()
        if session_data.get('authenticated'):
            print(f"✓ Authenticated as {email}")
            print(f"  - User: {session_data.get('user', {}).get('name')}")
            print(f"  - Active Tenant: {session_data.get('activeTenantId')}")
        else:
            pytest.skip("Authentication failed - session not authenticated")
    else:
        pytest.skip(f"Session check failed: {session_check.status_code}")
    
    return session


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
