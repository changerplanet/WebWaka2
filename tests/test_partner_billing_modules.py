"""
Module 11 (Partner & Reseller Platform) and Module 12 (Subscription & Billing Extensions) API Tests

Tests all GET and POST endpoints for both modules:
- Partner API: status, validate, config, partners, referral-links, commission-rules
- Billing API: status, validate, bundles, addons, discount-rules, grace-policies, usage-metrics
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://buildfix-6.preview.emergentagent.com').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"


class TestModule11PartnerAPI:
    """Module 11: Partner & Reseller Platform API Tests"""
    
    # =========================================================================
    # GET ENDPOINTS
    # =========================================================================
    
    def test_partner_status(self):
        """GET /api/partner?action=status - Returns module status"""
        response = requests.get(f"{BASE_URL}/api/partner?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'module' in data, "Response should contain 'module'"
        assert 'initialized' in data, "Response should contain 'initialized'"
        assert data['module']['key'] == 'partner_reseller', "Module key should be 'partner_reseller'"
        assert data['module']['name'] == 'Partner & Reseller Platform', "Module name mismatch"
        print(f"✓ Partner status: initialized={data['initialized']}")
    
    def test_partner_validate(self):
        """GET /api/partner?action=validate - Returns validation results"""
        response = requests.get(f"{BASE_URL}/api/partner?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'valid' in data, "Response should contain 'valid'"
        assert 'checks' in data, "Response should contain 'checks'"
        
        # All checks should pass
        for check in data['checks']:
            assert check['passed'] == True, f"Check '{check['name']}' failed: {check.get('message', 'No message')}"
        
        print(f"✓ Partner validation: valid={data['valid']}, checks passed={len(data['checks'])}")
    
    def test_partner_config(self):
        """GET /api/partner?action=config - Returns configuration"""
        response = requests.get(f"{BASE_URL}/api/partner?action=config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'config' in data, "Response should contain 'config'"
        
        config = data['config']
        assert 'programEnabled' in config, "Config should have 'programEnabled'"
        assert 'defaultCommission' in config, "Config should have 'defaultCommission'"
        assert 'minPayoutThreshold' in config, "Config should have 'minPayoutThreshold'"
        
        print(f"✓ Partner config: programEnabled={config['programEnabled']}, defaultCommission={config['defaultCommission']}%")
    
    def test_partner_list_partners(self):
        """GET /api/partner?action=partners - Lists all partners"""
        response = requests.get(f"{BASE_URL}/api/partner?action=partners")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'partners' in data, "Response should contain 'partners'"
        assert 'pagination' in data, "Response should contain 'pagination'"
        assert isinstance(data['partners'], list), "'partners' should be a list"
        
        total = data['pagination']['total']
        print(f"✓ Partners list: total={total}, returned={len(data['partners'])}")
    
    def test_partner_manifest(self):
        """GET /api/partner?action=manifest - Returns module manifest"""
        response = requests.get(f"{BASE_URL}/api/partner?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'key' in data, "Manifest should contain 'key'"
        assert 'name' in data, "Manifest should contain 'name'"
        assert 'owns' in data, "Manifest should contain 'owns'"
        assert 'doesNotOwn' in data, "Manifest should contain 'doesNotOwn'"
        assert 'principles' in data, "Manifest should contain 'principles'"
        
        print(f"✓ Partner manifest: key={data['key']}, owns={len(data['owns'])} tables")
    
    def test_partner_commission_rules(self):
        """GET /api/partner?action=commission-rules - Lists commission rules"""
        response = requests.get(f"{BASE_URL}/api/partner?action=commission-rules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'rules' in data, "Response should contain 'rules'"
        assert isinstance(data['rules'], list), "'rules' should be a list"
        
        print(f"✓ Commission rules: count={len(data['rules'])}")
    
    # =========================================================================
    # POST ENDPOINTS
    # =========================================================================
    
    def test_create_partner(self):
        """POST /api/partner - Creates a new partner"""
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "action": "create-partner",
            "email": f"{TEST_PREFIX}partner_{unique_id}@test.com",
            "phone": f"+234801{unique_id[:7]}",
            "name": f"{TEST_PREFIX}Test Partner {unique_id}",
            "partnerType": "INDIVIDUAL"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/partner",
            json=partner_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Partner creation failed: {data.get('error', 'Unknown error')}"
        assert 'partner' in data, "Response should contain 'partner'"
        
        partner = data['partner']
        assert partner['email'] == partner_data['email'], "Email mismatch"
        assert partner['name'] == partner_data['name'], "Name mismatch"
        assert 'id' in partner, "Partner should have an ID"
        
        # Store partner ID for subsequent tests
        self.__class__.created_partner_id = partner['id']
        
        print(f"✓ Created partner: id={partner['id']}, email={partner['email']}")
        
        # Verify partner was persisted by fetching it
        verify_response = requests.get(f"{BASE_URL}/api/partner?action=partner&partnerId={partner['id']}")
        assert verify_response.status_code == 200, f"Failed to verify partner: {verify_response.text}"
        
        verify_data = verify_response.json()
        assert verify_data['partner']['id'] == partner['id'], "Partner ID mismatch on verification"
        print(f"✓ Verified partner persistence")
    
    def test_create_referral_link_for_active_partner(self):
        """POST /api/partner - Creates referral link for active partner"""
        # First, get an active partner
        partners_response = requests.get(f"{BASE_URL}/api/partner?action=partners&status=ACTIVE")
        partners_data = partners_response.json()
        
        if partners_data['pagination']['total'] == 0:
            pytest.skip("No active partners available for referral link test")
        
        active_partner = partners_data['partners'][0]
        partner_id = active_partner['id']
        
        unique_id = str(uuid.uuid4())[:8]
        referral_data = {
            "action": "create-referral-link",
            "partnerId": partner_id,
            "name": f"{TEST_PREFIX}Referral Link {unique_id}",
            "campaign": f"test_campaign_{unique_id}",
            "source": "test",
            "medium": "api_test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/partner",
            json=referral_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Referral link creation failed: {data.get('error', 'Unknown error')}"
        assert 'referralLink' in data, "Response should contain 'referralLink'"
        
        link = data['referralLink']
        assert 'code' in link, "Referral link should have a code"
        assert 'id' in link, "Referral link should have an id"
        assert 'url' in link, "Referral link should have a url"
        
        print(f"✓ Created referral link: code={link['code']}, partnerId={partner_id}")
        
        # Verify by listing referral links
        verify_response = requests.get(f"{BASE_URL}/api/partner?action=referral-links&partnerId={partner_id}")
        assert verify_response.status_code == 200, f"Failed to list referral links: {verify_response.text}"
        
        verify_data = verify_response.json()
        assert 'referralLinks' in verify_data, "Response should contain 'referralLinks'"
        print(f"✓ Verified referral links for partner: count={len(verify_data['referralLinks'])}")
    
    def test_create_commission_rule(self):
        """POST /api/partner - Creates a commission rule"""
        unique_id = str(uuid.uuid4())[:8]
        rule_data = {
            "action": "create-commission-rule",
            "name": f"{TEST_PREFIX}Commission Rule {unique_id}",
            "commissionType": "PERCENTAGE",
            "value": 15,
            "eventType": "SUBSCRIPTION_CREATED",
            "isActive": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/partner",
            json=rule_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Commission rule creation failed: {data.get('error', 'Unknown error')}"
        assert 'rule' in data, "Response should contain 'rule'"
        
        rule = data['rule']
        assert rule['name'] == rule_data['name'], "Rule name mismatch"
        assert float(rule['value']) == rule_data['value'], "Rule value mismatch"
        
        print(f"✓ Created commission rule: id={rule['id']}, name={rule['name']}, value={rule['value']}%")
    
    def test_list_referral_links_requires_partner_id(self):
        """GET /api/partner?action=referral-links - Requires partnerId"""
        response = requests.get(f"{BASE_URL}/api/partner?action=referral-links")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data, "Response should contain 'error'"
        assert 'partnerid' in data['error'].lower(), "Error should mention partnerId"
        
        print(f"✓ Referral links correctly requires partnerId")


class TestModule12BillingAPI:
    """Module 12: Subscription & Billing Extensions API Tests"""
    
    # =========================================================================
    # GET ENDPOINTS
    # =========================================================================
    
    def test_billing_status(self):
        """GET /api/billing?action=status - Returns module status"""
        response = requests.get(f"{BASE_URL}/api/billing?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'module' in data, "Response should contain 'module'"
        assert 'initialized' in data, "Response should contain 'initialized'"
        # Module key is 'subscriptions_billing' as per implementation
        assert data['module']['key'] == 'subscriptions_billing', "Module key should be 'subscriptions_billing'"
        assert data['module']['name'] == 'Subscription & Billing Extensions', "Module name mismatch"
        
        print(f"✓ Billing status: initialized={data['initialized']}")
    
    def test_billing_validate(self):
        """GET /api/billing?action=validate - Returns validation results"""
        response = requests.get(f"{BASE_URL}/api/billing?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'valid' in data, "Response should contain 'valid'"
        assert 'checks' in data, "Response should contain 'checks'"
        
        # All checks should pass
        for check in data['checks']:
            assert check['passed'] == True, f"Check '{check['name']}' failed: {check.get('message', 'No message')}"
        
        print(f"✓ Billing validation: valid={data['valid']}, checks passed={len(data['checks'])}")
    
    def test_billing_manifest(self):
        """GET /api/billing?action=manifest - Returns module manifest"""
        response = requests.get(f"{BASE_URL}/api/billing?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'key' in data, "Manifest should contain 'key'"
        assert 'name' in data, "Manifest should contain 'name'"
        assert 'owns' in data, "Manifest should contain 'owns'"
        assert 'doesNotOwn' in data, "Manifest should contain 'doesNotOwn'"
        
        print(f"✓ Billing manifest: key={data['key']}, owns={len(data['owns'])} tables")
    
    def test_billing_list_bundles(self):
        """GET /api/billing?action=bundles - Lists subscription bundles"""
        response = requests.get(f"{BASE_URL}/api/billing?action=bundles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'bundles' in data, "Response should contain 'bundles'"
        assert isinstance(data['bundles'], list), "'bundles' should be a list"
        
        print(f"✓ Bundles list: count={len(data['bundles'])}")
    
    def test_billing_list_addons(self):
        """GET /api/billing?action=addons - Lists add-ons"""
        response = requests.get(f"{BASE_URL}/api/billing?action=addons")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'addOns' in data, "Response should contain 'addOns'"
        assert isinstance(data['addOns'], list), "'addOns' should be a list"
        
        print(f"✓ Add-ons list: count={len(data['addOns'])}")
    
    def test_billing_list_discount_rules(self):
        """GET /api/billing?action=discount-rules - Lists discount rules"""
        response = requests.get(f"{BASE_URL}/api/billing?action=discount-rules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'rules' in data, "Response should contain 'rules'"
        assert isinstance(data['rules'], list), "'rules' should be a list"
        
        print(f"✓ Discount rules list: count={len(data['rules'])}")
    
    def test_billing_list_grace_policies(self):
        """GET /api/billing?action=grace-policies - Lists grace policies"""
        response = requests.get(f"{BASE_URL}/api/billing?action=grace-policies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'policies' in data, "Response should contain 'policies'"
        assert isinstance(data['policies'], list), "'policies' should be a list"
        
        print(f"✓ Grace policies list: count={len(data['policies'])}")
    
    def test_billing_list_usage_metrics(self):
        """GET /api/billing?action=usage-metrics - Lists usage metrics"""
        response = requests.get(f"{BASE_URL}/api/billing?action=usage-metrics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'metrics' in data, "Response should contain 'metrics'"
        assert isinstance(data['metrics'], list), "'metrics' should be a list"
        
        print(f"✓ Usage metrics list: count={len(data['metrics'])}")
    
    # =========================================================================
    # POST ENDPOINTS
    # =========================================================================
    
    def test_create_bundle(self):
        """POST /api/billing - Creates a subscription bundle"""
        unique_id = str(uuid.uuid4())[:8]
        bundle_data = {
            "action": "create-bundle",
            "name": f"{TEST_PREFIX}Starter Bundle {unique_id}",
            "slug": f"test-starter-bundle-{unique_id}",
            "description": "Test bundle for API testing",
            "price": 50000,
            "currency": "NGN",
            "savingsPercent": 20,
            "items": [
                {
                    "moduleKey": "inventory",
                    "moduleName": "Inventory Management",
                    "displayOrder": 1
                },
                {
                    "moduleKey": "pos",
                    "moduleName": "Point of Sale",
                    "displayOrder": 2
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=bundle_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Bundle creation failed: {data.get('error', 'Unknown error')}"
        assert 'bundle' in data, "Response should contain 'bundle'"
        
        bundle = data['bundle']
        assert bundle['name'] == bundle_data['name'], "Bundle name mismatch"
        assert float(bundle['price']) == bundle_data['price'], "Bundle price mismatch"
        assert 'id' in bundle, "Bundle should have an ID"
        
        # Store bundle ID for subsequent tests
        self.__class__.created_bundle_id = bundle['id']
        
        print(f"✓ Created bundle: id={bundle['id']}, name={bundle['name']}, price={bundle['price']} NGN")
        
        # Verify bundle was persisted
        verify_response = requests.get(f"{BASE_URL}/api/billing?action=bundle&bundleId={bundle['id']}")
        assert verify_response.status_code == 200, f"Failed to verify bundle: {verify_response.text}"
        
        verify_data = verify_response.json()
        assert verify_data['bundle']['id'] == bundle['id'], "Bundle ID mismatch on verification"
        print(f"✓ Verified bundle persistence")
    
    def test_create_addon(self):
        """POST /api/billing - Creates an add-on"""
        unique_id = str(uuid.uuid4())[:8]
        addon_data = {
            "action": "create-addon",
            "name": f"{TEST_PREFIX}Extra Storage {unique_id}",
            "slug": f"test-extra-storage-{unique_id}",
            "description": "Additional storage capacity",
            "addOnType": "FEATURE",
            "price": 5000,
            "currency": "NGN",
            "billingInterval": "MONTHLY",
            "isQuantityBased": True,
            "unitName": "GB",
            "minQuantity": 1,
            "maxQuantity": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=addon_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Add-on creation failed: {data.get('error', 'Unknown error')}"
        assert 'addOn' in data, "Response should contain 'addOn'"
        
        addon = data['addOn']
        assert addon['name'] == addon_data['name'], "Add-on name mismatch"
        assert float(addon['price']) == addon_data['price'], "Add-on price mismatch"
        assert addon['addOnType'] == addon_data['addOnType'], "Add-on type mismatch"
        
        print(f"✓ Created add-on: id={addon['id']}, name={addon['name']}, price={addon['price']} NGN")
    
    def test_create_discount_rule(self):
        """POST /api/billing - Creates a discount rule"""
        unique_id = str(uuid.uuid4())[:8]
        discount_data = {
            "action": "create-discount-rule",
            "name": f"{TEST_PREFIX}Welcome Discount {unique_id}",
            "code": f"WELCOME{unique_id.upper()}",
            "description": "Welcome discount for new customers",
            "discountType": "PERCENTAGE",
            "value": 10,
            "maxUses": 100,
            "firstTimeOnly": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=discount_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Discount rule creation failed: {data.get('error', 'Unknown error')}"
        assert 'rule' in data, "Response should contain 'rule'"
        
        rule = data['rule']
        assert rule['name'] == discount_data['name'], "Rule name mismatch"
        assert rule['code'] == discount_data['code'], "Rule code mismatch"
        assert float(rule['value']) == discount_data['value'], "Rule value mismatch"
        
        # Store code for calculate discount test
        self.__class__.created_discount_code = rule['code']
        
        print(f"✓ Created discount rule: id={rule['id']}, code={rule['code']}, value={rule['value']}%")
    
    def test_calculate_discount(self):
        """GET /api/billing?action=calculate-discount - Calculates discount"""
        # Use a known discount code or the one we just created
        code = getattr(self.__class__, 'created_discount_code', None)
        
        if not code:
            # Try to get an existing discount rule
            rules_response = requests.get(f"{BASE_URL}/api/billing?action=discount-rules")
            rules_data = rules_response.json()
            
            if len(rules_data['rules']) == 0:
                pytest.skip("No discount rules available for calculation test")
            
            code = rules_data['rules'][0].get('code')
            if not code:
                pytest.skip("No discount code available for calculation test")
        
        amount = 100000  # 100,000 NGN
        response = requests.get(f"{BASE_URL}/api/billing?action=calculate-discount&code={code}&amount={amount}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'valid' in data, "Response should contain 'valid'"
        assert 'originalAmount' in data, "Response should contain 'originalAmount'"
        assert 'discountAmount' in data, "Response should contain 'discountAmount'"
        assert 'finalAmount' in data, "Response should contain 'finalAmount'"
        
        if data['valid']:
            assert data['originalAmount'] == amount, "Original amount mismatch"
            assert data['discountAmount'] > 0, "Discount amount should be positive"
            assert data['finalAmount'] < amount, "Final amount should be less than original"
            print(f"✓ Calculated discount: original={data['originalAmount']}, discount={data['discountAmount']}, final={data['finalAmount']}")
        else:
            print(f"✓ Discount calculation returned valid=false: {data.get('error', 'No error message')}")
    
    def test_create_grace_policy(self):
        """POST /api/billing - Creates a grace policy"""
        unique_id = str(uuid.uuid4())[:8]
        policy_data = {
            "action": "create-grace-policy",
            "name": f"{TEST_PREFIX}Standard Grace {unique_id}",
            "description": "Standard grace period policy",
            "graceDays": 7,
            "limitFeatures": True,
            "sendReminders": True,
            "reminderDays": [1, 3, 7],
            "suspendAfterGrace": True,
            "dataRetentionDays": 90,
            "manualOverrideAllowed": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=policy_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Grace policy creation failed: {data.get('error', 'Unknown error')}"
        assert 'policy' in data, "Response should contain 'policy'"
        
        policy = data['policy']
        assert policy['name'] == policy_data['name'], "Policy name mismatch"
        assert policy['graceDays'] == policy_data['graceDays'], "Grace days mismatch"
        
        print(f"✓ Created grace policy: id={policy['id']}, name={policy['name']}, graceDays={policy['graceDays']}")
    
    def test_create_usage_metric(self):
        """POST /api/billing - Creates a usage metric"""
        unique_id = str(uuid.uuid4())[:8]
        metric_data = {
            "action": "create-usage-metric",
            "key": f"test_api_calls_{unique_id}",
            "name": f"{TEST_PREFIX}API Calls {unique_id}",
            "description": "Number of API calls made",
            "unit": "calls",
            "aggregationType": "SUM",
            "includedUnits": 10000,
            "overageRate": 0.01,
            "billingPeriod": "MONTHLY"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=metric_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == True, f"Usage metric creation failed: {data.get('error', 'Unknown error')}"
        assert 'metric' in data, "Response should contain 'metric'"
        
        metric = data['metric']
        assert metric['key'] == metric_data['key'], "Metric key mismatch"
        assert metric['name'] == metric_data['name'], "Metric name mismatch"
        assert metric['unit'] == metric_data['unit'], "Metric unit mismatch"
        
        print(f"✓ Created usage metric: id={metric['id']}, key={metric['key']}, unit={metric['unit']}")


class TestModule11PartnerEdgeCases:
    """Edge case tests for Partner API"""
    
    def test_get_nonexistent_partner(self):
        """GET /api/partner?action=partner - Returns 404 for non-existent partner"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/partner?action=partner&partnerId={fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data, "Response should contain 'error'"
        print(f"✓ Non-existent partner returns 404")
    
    def test_create_partner_duplicate_email(self):
        """POST /api/partner - Rejects duplicate email"""
        # First, get an existing partner
        partners_response = requests.get(f"{BASE_URL}/api/partner?action=partners")
        partners_data = partners_response.json()
        
        if partners_data['pagination']['total'] == 0:
            pytest.skip("No existing partners to test duplicate email")
        
        existing_email = partners_data['partners'][0]['email']
        
        partner_data = {
            "action": "create-partner",
            "email": existing_email,
            "phone": "+2348012345678",
            "name": "Duplicate Test Partner",
            "partnerType": "INDIVIDUAL"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/partner",
            json=partner_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == False, "Should fail for duplicate email"
        assert 'error' in data, "Response should contain 'error'"
        
        print(f"✓ Duplicate email correctly rejected")
    
    def test_unknown_action(self):
        """GET /api/partner?action=unknown - Returns 400 for unknown action"""
        response = requests.get(f"{BASE_URL}/api/partner?action=unknown_action_xyz")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data, "Response should contain 'error'"
        print(f"✓ Unknown action returns 400")


class TestModule12BillingEdgeCases:
    """Edge case tests for Billing API"""
    
    def test_get_nonexistent_bundle(self):
        """GET /api/billing?action=bundle - Returns 404 for non-existent bundle"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/billing?action=bundle&bundleId={fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data, "Response should contain 'error'"
        print(f"✓ Non-existent bundle returns 404")
    
    def test_create_bundle_duplicate_slug(self):
        """POST /api/billing - Rejects duplicate slug"""
        # First, get an existing bundle
        bundles_response = requests.get(f"{BASE_URL}/api/billing?action=bundles")
        bundles_data = bundles_response.json()
        
        if len(bundles_data['bundles']) == 0:
            pytest.skip("No existing bundles to test duplicate slug")
        
        existing_slug = bundles_data['bundles'][0]['slug']
        
        bundle_data = {
            "action": "create-bundle",
            "name": "Duplicate Test Bundle",
            "slug": existing_slug,
            "price": 10000,
            "items": [{"moduleKey": "test", "moduleName": "Test", "displayOrder": 1}]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=bundle_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['success'] == False, "Should fail for duplicate slug"
        assert 'error' in data, "Response should contain 'error'"
        
        print(f"✓ Duplicate slug correctly rejected")
    
    def test_calculate_discount_invalid_code(self):
        """GET /api/billing?action=calculate-discount - Handles invalid code"""
        response = requests.get(f"{BASE_URL}/api/billing?action=calculate-discount&code=INVALID_CODE_XYZ&amount=10000")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['valid'] == False, "Should return valid=false for invalid code"
        assert 'error' in data, "Response should contain 'error'"
        
        print(f"✓ Invalid discount code handled correctly")
    
    def test_calculate_discount_missing_params(self):
        """GET /api/billing?action=calculate-discount - Requires code and amount"""
        response = requests.get(f"{BASE_URL}/api/billing?action=calculate-discount")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data, "Response should contain 'error'"
        
        print(f"✓ Missing params correctly rejected")
    
    def test_unknown_action(self):
        """GET /api/billing?action=unknown - Returns 400 for unknown action"""
        response = requests.get(f"{BASE_URL}/api/billing?action=unknown_action_xyz")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data, "Response should contain 'error'"
        print(f"✓ Unknown action returns 400")


class TestNigeriaFirstFeatures:
    """Tests for Nigeria-first features in both modules"""
    
    def test_partner_ngn_currency(self):
        """Partner module uses NGN as default currency"""
        response = requests.get(f"{BASE_URL}/api/partner?action=config")
        data = response.json()
        
        # Check min payout threshold is in NGN (should be a reasonable NGN amount)
        config = data['config']
        # Convert to int/float if it's a string (Decimal from DB)
        min_payout = float(config['minPayoutThreshold']) if isinstance(config['minPayoutThreshold'], str) else config['minPayoutThreshold']
        assert min_payout >= 1000, "Min payout should be in NGN (>= 1000)"
        
        print(f"✓ Partner module uses NGN: minPayoutThreshold={min_payout}")
    
    def test_billing_ngn_currency(self):
        """Billing module uses NGN as default currency"""
        # Create a bundle and verify NGN currency
        unique_id = str(uuid.uuid4())[:8]
        bundle_data = {
            "action": "create-bundle",
            "name": f"{TEST_PREFIX}NGN Test Bundle {unique_id}",
            "slug": f"test-ngn-bundle-{unique_id}",
            "price": 25000,
            "items": [{"moduleKey": "test", "moduleName": "Test", "displayOrder": 1}]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/billing",
            json=bundle_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        data = response.json()
        bundle = data['bundle']
        assert bundle['currency'] == 'NGN', f"Expected NGN currency, got {bundle['currency']}"
        
        print(f"✓ Billing module uses NGN: currency={bundle['currency']}")
    
    def test_partner_manual_verification(self):
        """Partner module has manual verification enabled (Nigeria-first)"""
        response = requests.get(f"{BASE_URL}/api/partner?action=config")
        data = response.json()
        
        config = data['config']
        assert config['verificationRequired'] == True, "Verification should be required"
        
        print(f"✓ Partner module has manual verification: verificationRequired={config['verificationRequired']}")
    
    def test_grace_policy_nigeria_first(self):
        """Grace policies support manual overrides (Nigeria-first)"""
        response = requests.get(f"{BASE_URL}/api/billing?action=grace-policies")
        data = response.json()
        
        if len(data['policies']) > 0:
            # Check if manual override is allowed
            policy = data['policies'][0]
            assert 'manualOverrideAllowed' in policy, "Policy should have manualOverrideAllowed field"
            print(f"✓ Grace policy supports manual override: manualOverrideAllowed={policy['manualOverrideAllowed']}")
        else:
            print(f"✓ No grace policies to check, but endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
