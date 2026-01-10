"""
MODULE 15: ECOSYSTEM & INTEGRATIONS HUB - Backend API Tests

Tests all Module 15 functionality:
- Module configuration and validation
- Provider registry (Nigeria-first providers)
- Tenant integration instances
- Webhook management
- Developer apps and API keys
- Audit logging and security

Test tenant: test-tenant-integrations
"""

import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://nextbuild-repair.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api/integrations"
TEST_TENANT_ID = "test-tenant-integrations"


class TestModuleConfiguration:
    """Module 15 configuration and validation tests"""
    
    def test_get_module_status(self):
        """GET ?action=status - Returns module status and statistics"""
        response = requests.get(f"{API_URL}?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['module']['key'] == 'integrations_hub'
        assert data['module']['name'] == 'Ecosystem & Integrations Hub'
        assert data['module']['version'] == '1.0.0'
        assert 'statistics' in data
        assert 'constitution' in data
        assert data['nigeriaFirst']['supported'] == True
        print(f"✓ Module status: initialized={data['initialized']}, providers={data['statistics']['totalProviders']}")
    
    def test_get_module_manifest(self):
        """GET ?action=manifest - Returns module manifest with ownership"""
        response = requests.get(f"{API_URL}?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['key'] == 'integrations_hub'
        assert 'integration_providers' in data['owns']
        assert 'integration_instances' in data['owns']
        assert 'developer_apps' in data['owns']
        assert 'api_keys' in data['owns']
        assert 'tenants' in data['doesNotOwn']
        assert 'payments' in data['doesNotOwn']
        assert len(data['principles']) > 0
        assert 'defaultProviders' in data
        print(f"✓ Module manifest: owns {len(data['owns'])} entities, {len(data['defaultProviders'])} default providers")
    
    def test_validate_module(self):
        """GET ?action=validate - All 8 validation checks pass"""
        response = requests.get(f"{API_URL}?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['valid'] == True, f"Module validation failed: {data}"
        assert len(data['checks']) == 8
        
        # Verify all checks pass
        for check in data['checks']:
            assert check['passed'] == True, f"Check '{check['name']}' failed: {check.get('details')}"
        
        # Verify specific checks exist
        check_names = [c['name'] for c in data['checks']]
        assert 'No Direct Database Writes' in check_names
        assert 'Tenant Approval Mandatory' in check_names
        assert 'All Actions Logged' in check_names
        assert 'Credentials Encrypted' in check_names
        assert 'Event-Driven Architecture' in check_names
        assert 'Rate Limiting Enabled' in check_names
        assert 'Nigeria-First Providers' in check_names
        assert 'Safe Module Removal' in check_names
        print(f"✓ All 8 validation checks passed")
    
    def test_initialize_module(self):
        """POST initialize - Initialize module with default providers and scopes"""
        response = requests.post(API_URL, json={"action": "initialize"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'providersCreated' in data
        assert 'scopesCreated' in data
        assert data['providersCreated'] >= 0  # May be 0 if already initialized
        assert data['scopesCreated'] >= 0
        print(f"✓ Module initialized: {data['providersCreated']} providers, {data['scopesCreated']} scopes")


class TestProviderRegistry:
    """Provider registry tests - Nigeria-first providers"""
    
    def test_list_providers(self):
        """GET ?action=providers - List all providers with pagination"""
        response = requests.get(f"{API_URL}?action=providers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'providers' in data
        assert 'pagination' in data
        assert len(data['providers']) > 0
        
        # Verify provider structure
        provider = data['providers'][0]
        assert 'id' in provider
        assert 'key' in provider
        assert 'name' in provider
        assert 'category' in provider
        assert 'supportedScopes' in provider
        assert 'requiredCredentials' in provider
        print(f"✓ Listed {len(data['providers'])} providers, page {data['pagination']['page']}/{data['pagination']['totalPages']}")
    
    def test_get_provider_paystack(self):
        """GET ?action=provider&key=paystack - Get single provider"""
        response = requests.get(f"{API_URL}?action=provider&key=paystack")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['key'] == 'paystack'
        assert data['name'] == 'Paystack'
        assert data['category'] == 'PAYMENT_GATEWAY'
        assert data['isNigeriaFirst'] == True
        assert 'payments:read' in data['supportedScopes']
        assert 'payments:write' in data['supportedScopes']
        assert 'secret_key' in data['requiredCredentials']
        assert 'public_key' in data['requiredCredentials']
        assert data['supportsWebhooks'] == True
        print(f"✓ Paystack provider: {data['name']}, Nigeria-first={data['isNigeriaFirst']}")
    
    def test_get_nigeria_first_providers(self):
        """GET ?action=nigeria-first-providers - List Nigeria-first providers only"""
        response = requests.get(f"{API_URL}?action=nigeria-first-providers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns array directly or wrapped in 'providers'
        providers = data.get('providers', data) if isinstance(data, dict) else data
        
        # All returned providers should be Nigeria-first
        for provider in providers:
            assert provider['isNigeriaFirst'] == True, f"Provider {provider['key']} is not Nigeria-first"
        
        # Verify expected Nigeria-first providers
        provider_keys = [p['key'] for p in providers]
        expected_keys = ['paystack', 'flutterwave', 'moniepoint', 'remita', 'nibss', 'gig_logistics', 'termii']
        for key in expected_keys:
            assert key in provider_keys, f"Expected Nigeria-first provider '{key}' not found"
        
        print(f"✓ {len(providers)} Nigeria-first providers: {', '.join(provider_keys)}")
    
    def test_get_categories(self):
        """GET ?action=categories - List available integration categories"""
        response = requests.get(f"{API_URL}?action=categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns array directly or wrapped in 'categories'
        categories = data.get('categories', data) if isinstance(data, dict) else data
        
        # Categories may be objects with key/name or just strings
        if len(categories) > 0 and isinstance(categories[0], dict):
            category_keys = [c['key'] for c in categories]
        else:
            category_keys = categories
        
        assert len(category_keys) > 0
        
        # Verify expected categories
        expected_categories = ['PAYMENT_GATEWAY', 'BANKING', 'LOGISTICS', 'SMS_GATEWAY']
        for cat in expected_categories:
            assert cat in category_keys, f"Expected category '{cat}' not found"
        
        print(f"✓ {len(category_keys)} categories: {', '.join(category_keys)}")
    
    def test_get_providers_by_category(self):
        """GET ?action=providers-by-category - Group providers by category"""
        response = requests.get(f"{API_URL}?action=providers-by-category")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Verify PAYMENT_GATEWAY category has providers
        assert 'PAYMENT_GATEWAY' in data
        assert len(data['PAYMENT_GATEWAY']) > 0
        
        # Verify paystack is in PAYMENT_GATEWAY
        payment_keys = [p['key'] for p in data['PAYMENT_GATEWAY']]
        assert 'paystack' in payment_keys
        assert 'flutterwave' in payment_keys
        
        print(f"✓ Providers grouped by {len(data)} categories")
    
    def test_get_provider_not_found(self):
        """GET ?action=provider&key=nonexistent - Returns 404"""
        response = requests.get(f"{API_URL}?action=provider&key=nonexistent_provider")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_get_provider_missing_key(self):
        """GET ?action=provider - Returns 400 when key missing"""
        response = requests.get(f"{API_URL}?action=provider")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestIntegrationInstances:
    """Tenant integration instance tests"""
    
    instance_id = None
    
    def test_enable_integration(self):
        """POST enable-integration - Enable integration for tenant"""
        # Use unique environment to avoid conflicts with existing instances
        import uuid
        unique_env = f"test_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "action": "enable-integration",
            "tenantId": TEST_TENANT_ID,
            "providerKey": "termii",  # Use termii to avoid conflicts
            "displayName": f"TEST_Termii Integration {unique_env}",
            "environment": unique_env,
            "enabledScopes": ["sms:send", "otp:send"],
            "activatedBy": "test-admin"
        }
        response = requests.post(API_URL, json=payload)
        
        # Handle case where integration already exists
        if response.status_code == 520 and "already enabled" in response.text:
            # Get existing instance instead
            list_response = requests.get(f"{API_URL}?action=instances&tenantId={TEST_TENANT_ID}")
            if list_response.status_code == 200:
                instances = list_response.json().get('instances', [])
                for inst in instances:
                    if inst.get('provider', {}).get('key') == 'termii' or 'termii' in str(inst):
                        TestIntegrationInstances.instance_id = inst['id']
                        print(f"✓ Using existing integration: {inst['id']}")
                        return
            pytest.skip("Integration already exists and couldn't find instance ID")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'id' in data
        assert data['tenantId'] == TEST_TENANT_ID
        assert data['status'] == 'PENDING_SETUP'
        
        TestIntegrationInstances.instance_id = data['id']
        print(f"✓ Integration enabled: {data['id']}, status={data['status']}")
    
    def test_configure_credentials(self):
        """POST configure-credentials - Configure encrypted credentials"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID from previous test")
        
        payload = {
            "action": "configure-credentials",
            "instanceId": TestIntegrationInstances.instance_id,
            "credentials": {
                "api_key": "test_api_key_xxxxxxxxxxxxx"
            },
            "configuredBy": "test-admin"
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['status'] == 'ACTIVE'
        assert data['activatedAt'] is not None
        print(f"✓ Credentials configured, instance activated")
    
    def test_list_tenant_instances(self):
        """GET ?action=instances&tenantId=X - List tenant integrations"""
        response = requests.get(f"{API_URL}?action=instances&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'instances' in data
        assert 'pagination' in data
        
        # Find our test instance
        test_instances = [i for i in data['instances'] if 'TEST_' in (i.get('displayName') or '')]
        assert len(test_instances) > 0, "Test instance not found"
        print(f"✓ Listed {len(data['instances'])} instances for tenant")
    
    def test_get_single_instance(self):
        """GET ?action=instance&instanceId=X - Get single instance"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID from previous test")
        
        response = requests.get(f"{API_URL}?action=instance&instanceId={TestIntegrationInstances.instance_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['id'] == TestIntegrationInstances.instance_id
        assert data['tenantId'] == TEST_TENANT_ID
        assert 'provider' in data
        print(f"✓ Got instance: {data['displayName']}, provider={data['provider']['key']}")
    
    def test_suspend_instance(self):
        """POST suspend-instance - Suspend integration with reason"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID from previous test")
        
        payload = {
            "action": "suspend-instance",
            "instanceId": TestIntegrationInstances.instance_id,
            "reason": "TEST_Suspended for testing",
            "suspendedBy": "test-admin"
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['status'] == 'SUSPENDED'
        assert data['suspensionReason'] == "TEST_Suspended for testing"
        print(f"✓ Instance suspended")
    
    def test_reactivate_instance(self):
        """POST reactivate-instance - Reactivate suspended integration"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID from previous test")
        
        payload = {
            "action": "reactivate-instance",
            "instanceId": TestIntegrationInstances.instance_id,
            "reactivatedBy": "test-admin"
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['status'] == 'ACTIVE'
        assert data['suspensionReason'] is None
        print(f"✓ Instance reactivated")
    
    def test_instances_missing_tenant_id(self):
        """GET ?action=instances - Returns 400 when tenantId missing"""
        response = requests.get(f"{API_URL}?action=instances")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_enable_integration_missing_fields(self):
        """POST enable-integration - Returns 400 when required fields missing"""
        payload = {
            "action": "enable-integration",
            "tenantId": TEST_TENANT_ID
            # Missing providerKey, enabledScopes, activatedBy
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestWebhooks:
    """Webhook management tests"""
    
    webhook_id = None
    
    def test_create_webhook(self):
        """POST create-webhook - Create inbound/outbound webhook"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID from previous test")
        
        payload = {
            "action": "create-webhook",
            "instanceId": TestIntegrationInstances.instance_id,
            "name": "TEST_Payment Webhook",
            "direction": "INBOUND",
            "url": "https://example.com/webhooks/paystack",
            "events": ["payment.success", "payment.failed"],
            "retryEnabled": True,
            "maxRetries": 3
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'id' in data
        assert data['name'] == "TEST_Payment Webhook"
        assert data['direction'] == "INBOUND"
        assert data['status'] == "ACTIVE"
        assert 'secretKey' in data
        
        TestWebhooks.webhook_id = data['id']
        print(f"✓ Webhook created: {data['id']}")
    
    def test_list_webhooks_for_instance(self):
        """GET ?action=webhooks&instanceId=X - List webhooks for instance"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID from previous test")
        
        response = requests.get(f"{API_URL}?action=webhooks&instanceId={TestIntegrationInstances.instance_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        
        # Find our test webhook
        test_webhooks = [w for w in data if 'TEST_' in w.get('name', '')]
        assert len(test_webhooks) > 0, "Test webhook not found"
        print(f"✓ Listed {len(data)} webhooks for instance")
    
    def test_webhooks_missing_instance_id(self):
        """GET ?action=webhooks - Returns 400 when instanceId missing"""
        response = requests.get(f"{API_URL}?action=webhooks")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_create_webhook_missing_fields(self):
        """POST create-webhook - Returns 400 when required fields missing"""
        payload = {
            "action": "create-webhook",
            "instanceId": TestIntegrationInstances.instance_id
            # Missing name, direction, url, events
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestDeveloperApps:
    """Developer apps and API keys tests"""
    
    app_id = None
    api_key = None
    api_key_id = None
    
    def test_create_developer_app(self):
        """POST create-app - Create developer app with client credentials"""
        payload = {
            "action": "create-app",
            "tenantId": TEST_TENANT_ID,
            "name": "TEST_Integration App",
            "description": "Test app for integration testing",
            "developerName": "Test Developer",
            "developerEmail": "test@example.com",
            "allowedScopes": ["orders:read", "payments:read", "products:read"]
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'id' in data
        assert data['name'] == "TEST_Integration App"
        assert 'clientId' in data
        assert 'clientSecret' in data
        assert data['isVerified'] == False
        assert data['isActive'] == True
        assert '_secretWarning' in data
        
        TestDeveloperApps.app_id = data['id']
        print(f"✓ Developer app created: {data['id']}, clientId={data['clientId'][:20]}...")
    
    def test_list_developer_apps(self):
        """GET ?action=apps - List developer apps"""
        response = requests.get(f"{API_URL}?action=apps")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'apps' in data
        assert 'pagination' in data
        
        # Find our test app
        test_apps = [a for a in data['apps'] if 'TEST_' in a.get('name', '')]
        assert len(test_apps) > 0, "Test app not found"
        print(f"✓ Listed {len(data['apps'])} developer apps")
    
    def test_generate_api_key(self):
        """POST generate-api-key - Generate API key for app"""
        if not TestDeveloperApps.app_id:
            pytest.skip("No app ID from previous test")
        
        payload = {
            "action": "generate-api-key",
            "appId": TestDeveloperApps.app_id,
            "name": "TEST_API Key",
            "tenantId": TEST_TENANT_ID,
            "scopes": ["orders:read", "products:read"]
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'id' in data
        assert 'key' in data
        assert data['key'].startswith('emw_')
        assert data['status'] == 'ACTIVE'
        assert '_keyWarning' in data
        
        TestDeveloperApps.api_key = data['key']
        TestDeveloperApps.api_key_id = data['id']
        print(f"✓ API key generated: {data['keyPrefix']}...")
    
    def test_validate_api_key_success(self):
        """POST validate-api-key - Validate API key with scope checking"""
        if not TestDeveloperApps.api_key:
            pytest.skip("No API key from previous test")
        
        payload = {
            "action": "validate-api-key",
            "key": TestDeveloperApps.api_key,
            "requiredScopes": ["orders:read"]
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['valid'] == True
        assert data['appId'] == TestDeveloperApps.app_id
        assert 'orders:read' in data['scopes']
        print(f"✓ API key validated successfully")
    
    def test_validate_api_key_missing_scope(self):
        """POST validate-api-key - Returns invalid when scope missing"""
        if not TestDeveloperApps.api_key:
            pytest.skip("No API key from previous test")
        
        payload = {
            "action": "validate-api-key",
            "key": TestDeveloperApps.api_key,
            "requiredScopes": ["payments:write"]  # Not in key's scopes
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['valid'] == False
        assert 'Missing scopes' in data.get('error', '')
        print(f"✓ API key validation correctly rejected missing scope")
    
    def test_validate_api_key_invalid(self):
        """POST validate-api-key - Returns invalid for bad key"""
        payload = {
            "action": "validate-api-key",
            "key": "emw_invalid_key_12345"
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['valid'] == False
        assert 'Invalid API key' in data.get('error', '')
        print(f"✓ Invalid API key correctly rejected")
    
    def test_revoke_api_key(self):
        """POST revoke-api-key - Revoke API key"""
        if not TestDeveloperApps.api_key_id:
            pytest.skip("No API key ID from previous test")
        
        payload = {
            "action": "revoke-api-key",
            "keyId": TestDeveloperApps.api_key_id,
            "reason": "TEST_Revoked for testing",
            "revokedBy": "test-admin"
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['status'] == 'REVOKED'
        assert data['revokedReason'] == "TEST_Revoked for testing"
        print(f"✓ API key revoked")
    
    def test_validate_revoked_key(self):
        """POST validate-api-key - Returns invalid for revoked key"""
        if not TestDeveloperApps.api_key:
            pytest.skip("No API key from previous test")
        
        payload = {
            "action": "validate-api-key",
            "key": TestDeveloperApps.api_key
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['valid'] == False
        assert 'revoked' in data.get('error', '').lower()
        print(f"✓ Revoked API key correctly rejected")
    
    def test_create_app_missing_fields(self):
        """POST create-app - Returns 400 when required fields missing"""
        payload = {
            "action": "create-app",
            "name": "Test App"
            # Missing developerName, developerEmail, allowedScopes
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestAccessScopes:
    """Access scopes tests"""
    
    def test_list_scopes(self):
        """GET ?action=scopes - List available access scopes"""
        response = requests.get(f"{API_URL}?action=scopes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify scope structure
        scope = data[0]
        assert 'key' in scope
        assert 'name' in scope
        assert 'resource' in scope
        assert 'permission' in scope
        
        # Verify expected scopes exist
        scope_keys = [s['key'] for s in data]
        expected_scopes = ['orders:read', 'orders:write', 'payments:read', 'payments:write', 'products:read']
        for key in expected_scopes:
            assert key in scope_keys, f"Expected scope '{key}' not found"
        
        print(f"✓ Listed {len(data)} access scopes")
    
    def test_list_scopes_by_resource(self):
        """GET ?action=scopes&resource=orders - Filter scopes by resource"""
        response = requests.get(f"{API_URL}?action=scopes&resource=orders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        
        # All returned scopes should be for orders resource
        for scope in data:
            assert scope['resource'] == 'orders', f"Scope {scope['key']} is not for orders resource"
        
        print(f"✓ Listed {len(data)} scopes for 'orders' resource")


class TestAuditLogging:
    """Audit logging and security tests"""
    
    def test_query_integration_logs(self):
        """GET ?action=logs - Query integration logs"""
        response = requests.get(f"{API_URL}?action=logs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'logs' in data
        assert 'pagination' in data
        print(f"✓ Queried {len(data['logs'])} integration logs")
    
    def test_query_logs_by_tenant(self):
        """GET ?action=logs&tenantId=X - Query logs for specific tenant"""
        response = requests.get(f"{API_URL}?action=logs&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'logs' in data
        
        # All returned logs should be for test tenant
        for log in data['logs']:
            assert log['tenantId'] == TEST_TENANT_ID
        
        print(f"✓ Queried {len(data['logs'])} logs for tenant")
    
    def test_query_event_logs(self):
        """GET ?action=events - Query event logs"""
        response = requests.get(f"{API_URL}?action=events")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'events' in data
        assert 'pagination' in data
        print(f"✓ Queried {len(data['events'])} event logs")
    
    def test_get_integration_statistics(self):
        """GET ?action=statistics - Get integration statistics"""
        response = requests.get(f"{API_URL}?action=statistics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'period' in data
        assert 'totalCalls' in data
        assert 'successfulCalls' in data
        assert 'failedCalls' in data
        assert 'successRate' in data
        assert 'webhooksReceived' in data
        assert 'webhooksSent' in data
        assert 'averageDurationMs' in data
        print(f"✓ Statistics: {data['totalCalls']} total calls, {data['successRate']:.1f}% success rate")
    
    def test_detect_security_anomalies(self):
        """GET ?action=security-anomalies - Detect security anomalies"""
        response = requests.get(f"{API_URL}?action=security-anomalies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'anomalies' in data
        assert isinstance(data['anomalies'], list)
        
        # Verify anomaly structure if any exist
        if len(data['anomalies']) > 0:
            anomaly = data['anomalies'][0]
            assert 'type' in anomaly
            assert 'severity' in anomaly
            assert 'description' in anomaly
            assert 'details' in anomaly
        
        print(f"✓ Detected {len(data['anomalies'])} security anomalies")


class TestEntitlements:
    """Entitlement tiers tests"""
    
    def test_get_entitlements(self):
        """GET ?action=entitlements - Get entitlement tiers"""
        response = requests.get(f"{API_URL}?action=entitlements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'entitlements' in data
        assert 'tiers' in data
        
        # Verify entitlement structure
        assert 'integrations_enabled' in data['entitlements']
        assert 'api_access_enabled' in data['entitlements']
        assert 'max_integrations' in data['entitlements']
        
        # Verify tiers
        assert 'free' in data['tiers']
        assert 'starter' in data['tiers']
        assert 'professional' in data['tiers']
        assert 'enterprise' in data['tiers']
        
        # Verify tier progression
        assert data['tiers']['free']['integrations_enabled'] == False
        assert data['tiers']['starter']['integrations_enabled'] == True
        assert data['tiers']['enterprise']['max_integrations'] == -1  # Unlimited
        
        print(f"✓ Entitlements: {len(data['tiers'])} tiers defined")


class TestCleanup:
    """Cleanup test data"""
    
    def test_revoke_test_instance(self):
        """POST revoke-instance - Permanently revoke test integration"""
        if not TestIntegrationInstances.instance_id:
            pytest.skip("No instance ID to cleanup")
        
        payload = {
            "action": "revoke-instance",
            "instanceId": TestIntegrationInstances.instance_id,
            "reason": "TEST_Cleanup after testing",
            "revokedBy": "test-admin"
        }
        response = requests.post(API_URL, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['status'] == 'REVOKED'
        print(f"✓ Test instance revoked for cleanup")


class TestErrorHandling:
    """Error handling tests"""
    
    def test_unknown_action(self):
        """GET ?action=unknown - Returns 400 for unknown action"""
        response = requests.get(f"{API_URL}?action=unknown_action")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        print(f"✓ Unknown action correctly rejected")
    
    def test_unknown_post_action(self):
        """POST unknown action - Returns 400"""
        response = requests.post(API_URL, json={"action": "unknown_action"})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        print(f"✓ Unknown POST action correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
