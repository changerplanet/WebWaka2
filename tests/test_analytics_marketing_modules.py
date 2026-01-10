"""
MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE - API Tests
MODULE 8: MARKETING AUTOMATION - API Tests

Tests all Analytics and Marketing endpoints with proper authentication

Module 7 Features tested:
- Analytics Configuration (GET/POST /api/analytics)
- Status, Manifest, Validation
- Dashboards, Reports, Insights
- Metrics and Entitlements
- Nigeria-first defaults (NGN, Africa/Lagos timezone)

Module 8 Features tested:
- Marketing Configuration (GET/POST /api/marketing)
- Status, Manifest, Validation
- Workflows, Templates
- Entitlements
- Nigeria-first defaults (SMS-first, Africa/Lagos timezone)

CRITICAL: Module 7 is READ-ONLY. Module 8 delegates all messaging to Core.
"""

import pytest
import requests
import os
import uuid
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tscleanup.preview.emergentagent.com').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_ANALYTICS_MKT_"

# Store created resources for cleanup
created_resources = {
    "dashboards": [],
    "reports": [],
    "workflows": []
}


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

class TestAnalyticsUnauthenticated:
    """Test that all Analytics endpoints require authentication"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Get unauthenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_analytics_status_requires_auth(self, api_client):
        """GET /api/analytics?action=status - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/analytics?action=status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_analytics_manifest_requires_auth(self, api_client):
        """GET /api/analytics?action=manifest - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/analytics?action=manifest")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_analytics_dashboards_requires_auth(self, api_client):
        """GET /api/analytics?action=dashboards - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/analytics?action=dashboards")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_analytics_reports_requires_auth(self, api_client):
        """GET /api/analytics?action=reports - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/analytics?action=reports")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestMarketingUnauthenticated:
    """Test that all Marketing endpoints require authentication"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Get unauthenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_marketing_status_requires_auth(self, api_client):
        """GET /api/marketing?action=status - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/marketing?action=status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_marketing_manifest_requires_auth(self, api_client):
        """GET /api/marketing?action=manifest - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/marketing?action=manifest")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_marketing_workflows_requires_auth(self, api_client):
        """GET /api/marketing?action=workflows - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/marketing?action=workflows")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_marketing_templates_requires_auth(self, api_client):
        """GET /api/marketing?action=templates - Should return 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/marketing?action=templates")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


# ============================================================================
# AUTHENTICATED TESTS - MODULE 7: ANALYTICS & BI
# ============================================================================

class TestAnalyticsAuthenticated:
    """Test Analytics endpoints with authentication"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Get authenticated session"""
        session = get_authenticated_session()
        if not session:
            pytest.skip("Could not authenticate - skipping authenticated tests")
        return session
    
    # -------------------------------------------------------------------------
    # STATUS & MANIFEST
    # -------------------------------------------------------------------------
    
    def test_analytics_status(self, authenticated_session):
        """GET /api/analytics?action=status - Should return analytics status"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Status should have initialized and enabled fields
        assert "initialized" in data, "Response should have 'initialized' field"
        assert "enabled" in data, "Response should have 'enabled' field"
        print(f"Analytics status: initialized={data.get('initialized')}, enabled={data.get('enabled')}")
    
    def test_analytics_manifest(self, authenticated_session):
        """GET /api/analytics?action=manifest - Should return module manifest"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Manifest should have module info
        assert "moduleId" in data or "name" in data or "version" in data, "Response should have module info"
        print(f"Analytics manifest: {data}")
    
    # -------------------------------------------------------------------------
    # INITIALIZATION
    # -------------------------------------------------------------------------
    
    def test_analytics_initialize(self, authenticated_session):
        """POST /api/analytics {action: 'initialize'} - Should initialize analytics"""
        response = retry_request(authenticated_session, 'post', f"{BASE_URL}/api/analytics", json={
            "action": "initialize",
            "config": {
                "analyticsEnabled": True,
                "dashboardsEnabled": True,
                "reportsEnabled": True,
                "defaultCurrency": "NGN",
                "timezone": "Africa/Lagos"
            }
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Initialize should return success=true"
        
        # Verify config
        config = data.get("config", {})
        if config:
            assert config.get("defaultCurrency") == "NGN", "Default currency should be NGN"
            assert config.get("timezone") == "Africa/Lagos", "Timezone should be Africa/Lagos"
        print(f"Analytics initialized: {data}")
    
    # -------------------------------------------------------------------------
    # OVERVIEW & METRICS
    # -------------------------------------------------------------------------
    
    def test_analytics_overview(self, authenticated_session):
        """GET /api/analytics?action=overview&days=30 - Should return business overview"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=overview&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Overview should have metrics or summary data
        print(f"Analytics overview: {data}")
    
    def test_analytics_metrics(self, authenticated_session):
        """GET /api/analytics?action=metrics&days=30 - Should return live metrics"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=metrics&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "metrics" in data, "Response should have 'metrics' field"
        print(f"Analytics metrics count: {len(data.get('metrics', []))}")
    
    # -------------------------------------------------------------------------
    # DASHBOARDS
    # -------------------------------------------------------------------------
    
    def test_analytics_dashboards_list(self, authenticated_session):
        """GET /api/analytics?action=dashboards - Should return dashboard list"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=dashboards")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "dashboards" in data, "Response should have 'dashboards' field"
        dashboards = data.get("dashboards", [])
        print(f"Found {len(dashboards)} dashboards")
        
        # Check for default dashboards
        dashboard_keys = [d.get("key") for d in dashboards]
        if "business_overview" in dashboard_keys:
            print("Default 'business_overview' dashboard exists")
    
    def test_analytics_dashboard_detail(self, authenticated_session):
        """GET /api/analytics?action=dashboard&key=business_overview - Should return dashboard with data"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=dashboard&key=business_overview&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        dashboard = data.get("dashboard", {})
        print(f"Dashboard detail: {dashboard.get('name', 'N/A')}")
    
    # -------------------------------------------------------------------------
    # REPORTS
    # -------------------------------------------------------------------------
    
    def test_analytics_reports_list(self, authenticated_session):
        """GET /api/analytics?action=reports - Should return reports list"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=reports")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "reports" in data, "Response should have 'reports' field"
        print(f"Found {len(data.get('reports', []))} reports")
    
    def test_analytics_sales_report(self, authenticated_session):
        """GET /api/analytics?action=sales-report&days=30 - Should return sales report"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=sales-report&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "report" in data, "Response should have 'report' field"
        print(f"Sales report: {data.get('report', {})}")
    
    def test_analytics_inventory_report(self, authenticated_session):
        """GET /api/analytics?action=inventory-report - Should return inventory report"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=inventory-report")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "report" in data, "Response should have 'report' field"
        print(f"Inventory report: {data.get('report', {})}")
    
    # -------------------------------------------------------------------------
    # INSIGHTS
    # -------------------------------------------------------------------------
    
    def test_analytics_insights(self, authenticated_session):
        """GET /api/analytics?action=insights - Should return insights"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=insights")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "insights" in data, "Response should have 'insights' field"
        print(f"Found {len(data.get('insights', []))} insights")
    
    def test_analytics_generate_insights(self, authenticated_session):
        """GET /api/analytics?action=generate-insights - Should generate insights"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=generate-insights")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "insights" in data, "Response should have 'insights' field"
        print(f"Generated {len(data.get('insights', []))} insights")
    
    # -------------------------------------------------------------------------
    # ENTITLEMENTS & VALIDATION
    # -------------------------------------------------------------------------
    
    def test_analytics_entitlements(self, authenticated_session):
        """GET /api/analytics?action=entitlements - Should return entitlements"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=entitlements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Entitlements should have plan info
        print(f"Analytics entitlements: {data}")
    
    def test_analytics_validate(self, authenticated_session):
        """GET /api/analytics?action=validate - Should pass module validation"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Validation should pass
        assert data.get("valid") == True or data.get("passed") == True or data.get("success") == True, \
            f"Module validation should pass: {data}"
        print(f"Analytics validation: {data}")
    
    # -------------------------------------------------------------------------
    # ADDITIONAL METRICS
    # -------------------------------------------------------------------------
    
    def test_analytics_metric_definitions(self, authenticated_session):
        """GET /api/analytics?action=metric-definitions - Should return metric definitions"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=metric-definitions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "definitions" in data, "Response should have 'definitions' field"
        print(f"Found {len(data.get('definitions', []))} metric definitions")
    
    def test_analytics_top_products(self, authenticated_session):
        """GET /api/analytics?action=top-products&days=30 - Should return top products"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=top-products&days=30&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should have 'products' field"
        print(f"Found {len(data.get('products', []))} top products")
    
    def test_analytics_sales_by_channel(self, authenticated_session):
        """GET /api/analytics?action=sales-by-channel&days=30 - Should return sales by channel"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=sales-by-channel&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "salesByChannel" in data, "Response should have 'salesByChannel' field"
        print(f"Sales by channel: {data.get('salesByChannel', {})}")


# ============================================================================
# AUTHENTICATED TESTS - MODULE 8: MARKETING AUTOMATION
# ============================================================================

class TestMarketingAuthenticated:
    """Test Marketing endpoints with authentication"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Get authenticated session"""
        session = get_authenticated_session()
        if not session:
            pytest.skip("Could not authenticate - skipping authenticated tests")
        return session
    
    # -------------------------------------------------------------------------
    # STATUS & MANIFEST
    # -------------------------------------------------------------------------
    
    def test_marketing_status(self, authenticated_session):
        """GET /api/marketing?action=status - Should return marketing status"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Status should have initialized and enabled fields
        assert "initialized" in data, "Response should have 'initialized' field"
        assert "enabled" in data, "Response should have 'enabled' field"
        print(f"Marketing status: initialized={data.get('initialized')}, enabled={data.get('enabled')}")
    
    def test_marketing_manifest(self, authenticated_session):
        """GET /api/marketing?action=manifest - Should return module manifest"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=manifest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Manifest should have module info
        assert "moduleId" in data or "name" in data or "version" in data, "Response should have module info"
        print(f"Marketing manifest: {data}")
    
    # -------------------------------------------------------------------------
    # INITIALIZATION
    # -------------------------------------------------------------------------
    
    def test_marketing_initialize(self, authenticated_session):
        """POST /api/marketing {action: 'initialize'} - Should initialize marketing"""
        response = retry_request(authenticated_session, 'post', f"{BASE_URL}/api/marketing", json={
            "action": "initialize",
            "config": {
                "automationEnabled": True,
                "smsAutomation": True,
                "emailAutomation": True,
                "smsFirst": True,
                "defaultChannel": "SMS",
                "timezone": "Africa/Lagos"
            }
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Initialize should return success=true"
        
        # Verify config
        config = data.get("config", {})
        if config:
            assert config.get("smsFirst") == True, "SMS-first should be enabled"
            assert config.get("timezone") == "Africa/Lagos", "Timezone should be Africa/Lagos"
        print(f"Marketing initialized: {data}")
    
    # -------------------------------------------------------------------------
    # WORKFLOWS
    # -------------------------------------------------------------------------
    
    def test_marketing_workflows_list(self, authenticated_session):
        """GET /api/marketing?action=workflows - Should return workflows list"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=workflows")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "workflows" in data, "Response should have 'workflows' field"
        print(f"Found {len(data.get('workflows', []))} workflows")
    
    def test_marketing_templates(self, authenticated_session):
        """GET /api/marketing?action=templates - Should return automation templates"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Response should have 'templates' field"
        templates = data.get("templates", [])
        print(f"Found {len(templates)} templates")
        
        # Check for default templates
        template_keys = [t.get("templateKey") for t in templates]
        expected_templates = ["welcome_message", "first_purchase_thanks", "reengagement", "birthday"]
        for key in expected_templates:
            if key in template_keys:
                print(f"Default template '{key}' exists")
    
    # -------------------------------------------------------------------------
    # CREATE WORKFLOW
    # -------------------------------------------------------------------------
    
    def test_marketing_create_workflow(self, authenticated_session):
        """POST /api/marketing {action: 'create-workflow'} - Should create workflow"""
        workflow_name = f"{TEST_PREFIX}Test_Workflow_{uuid.uuid4().hex[:8]}"
        
        response = retry_request(authenticated_session, 'post', f"{BASE_URL}/api/marketing", json={
            "action": "create-workflow",
            "workflow": {
                "name": workflow_name,
                "description": "Test workflow for automated testing",
                "triggers": [
                    {
                        "type": "EVENT",
                        "eventName": "ORDER_COMPLETED"
                    }
                ],
                "actions": [
                    {
                        "type": "SEND_MESSAGE",
                        "config": {
                            "template": "order_confirmation",
                            "channel": "SMS"
                        }
                    }
                ]
            }
        })
        
        # Could be 200 or 403 if entitlement limit reached
        if response.status_code == 403:
            print(f"Workflow creation limited by entitlement: {response.text}")
            pytest.skip("Workflow creation limited by entitlement")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Create workflow should return success=true"
        
        workflow = data.get("workflow", {})
        if workflow:
            created_resources["workflows"].append(workflow.get("id"))
            print(f"Created workflow: {workflow.get('name')} (ID: {workflow.get('id')})")
    
    # -------------------------------------------------------------------------
    # WORKFLOW STATISTICS
    # -------------------------------------------------------------------------
    
    def test_marketing_workflow_statistics(self, authenticated_session):
        """GET /api/marketing?action=workflow-statistics - Should return workflow statistics"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=workflow-statistics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "statistics" in data, "Response should have 'statistics' field"
        print(f"Workflow statistics: {data.get('statistics', {})}")
    
    def test_marketing_run_statistics(self, authenticated_session):
        """GET /api/marketing?action=run-statistics&days=30 - Should return run statistics"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=run-statistics&days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "statistics" in data, "Response should have 'statistics' field"
        print(f"Run statistics: {data.get('statistics', {})}")
    
    # -------------------------------------------------------------------------
    # ENTITLEMENTS & VALIDATION
    # -------------------------------------------------------------------------
    
    def test_marketing_entitlements(self, authenticated_session):
        """GET /api/marketing?action=entitlements - Should return entitlements"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=entitlements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Entitlements should have plan info
        print(f"Marketing entitlements: {data}")
    
    def test_marketing_validate(self, authenticated_session):
        """GET /api/marketing?action=validate - Should pass module validation"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=validate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Validation should pass
        assert data.get("valid") == True or data.get("passed") == True or data.get("success") == True, \
            f"Module validation should pass: {data}"
        print(f"Marketing validation: {data}")


# ============================================================================
# NIGERIA-FIRST FEATURE TESTS
# ============================================================================

class TestNigeriaFirstFeatures:
    """Test Nigeria-first features in both modules"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Get authenticated session"""
        session = get_authenticated_session()
        if not session:
            pytest.skip("Could not authenticate - skipping authenticated tests")
        return session
    
    def test_analytics_ngn_default(self, authenticated_session):
        """Verify Analytics uses NGN as default currency"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=status")
        assert response.status_code == 200
        
        data = response.json()
        config = data.get("config", {})
        if config:
            assert config.get("defaultCurrency") == "NGN", "Default currency should be NGN"
            print("Analytics: NGN default currency confirmed")
    
    def test_analytics_lagos_timezone(self, authenticated_session):
        """Verify Analytics uses Africa/Lagos timezone"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=status")
        assert response.status_code == 200
        
        data = response.json()
        config = data.get("config", {})
        if config:
            assert config.get("timezone") == "Africa/Lagos", "Timezone should be Africa/Lagos"
            print("Analytics: Africa/Lagos timezone confirmed")
    
    def test_marketing_sms_first(self, authenticated_session):
        """Verify Marketing uses SMS-first approach"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=status")
        assert response.status_code == 200
        
        data = response.json()
        config = data.get("config", {})
        if config:
            assert config.get("smsFirst") == True, "SMS-first should be enabled"
            assert config.get("defaultChannel") == "SMS", "Default channel should be SMS"
            print("Marketing: SMS-first approach confirmed")
    
    def test_marketing_lagos_timezone(self, authenticated_session):
        """Verify Marketing uses Africa/Lagos timezone"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=status")
        assert response.status_code == 200
        
        data = response.json()
        config = data.get("config", {})
        if config:
            assert config.get("timezone") == "Africa/Lagos", "Timezone should be Africa/Lagos"
            print("Marketing: Africa/Lagos timezone confirmed")


# ============================================================================
# MODULE CONSTRAINT TESTS
# ============================================================================

class TestModuleConstraints:
    """Test module constraints and isolation"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Get authenticated session"""
        session = get_authenticated_session()
        if not session:
            pytest.skip("Could not authenticate - skipping authenticated tests")
        return session
    
    def test_analytics_read_only_validation(self, authenticated_session):
        """Verify Analytics module is read-only (no data mutation)"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/analytics?action=validate")
        assert response.status_code == 200
        
        data = response.json()
        # Check validation results for read-only constraint
        checks = data.get("checks", [])
        for check in checks:
            if "read" in check.get("name", "").lower() or "mutation" in check.get("name", "").lower():
                assert check.get("passed") == True, f"Read-only check should pass: {check}"
        print("Analytics: Read-only constraint validated")
    
    def test_marketing_no_direct_messaging(self, authenticated_session):
        """Verify Marketing module delegates messaging to Core"""
        response = retry_request(authenticated_session, 'get', f"{BASE_URL}/api/marketing?action=validate")
        assert response.status_code == 200
        
        data = response.json()
        # Check validation results for messaging delegation
        checks = data.get("checks", [])
        for check in checks:
            if "message" in check.get("name", "").lower() or "delegation" in check.get("name", "").lower():
                assert check.get("passed") == True, f"Messaging delegation check should pass: {check}"
        print("Marketing: Messaging delegation validated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
