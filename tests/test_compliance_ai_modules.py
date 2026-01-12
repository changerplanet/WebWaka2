"""
Test Suite for Module 13 (Compliance & Tax) and Module 14 (AI & Automation)
eMarketWaka SaaS Core - Backend API Testing

Module 13: Compliance & Tax (Nigeria-First)
- Advisory VAT, regulatory reporting, audit trails
- NO enforcement, NO remittance

Module 14: AI & Automation
- Explainable insights, recommendations, rule-based automation
- Human-in-the-loop required
"""

import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://typesafe-nextjs.preview.emergentagent.com').rstrip('/')
TEST_TENANT_ID = "test-tenant-compliance-ai"


class TestComplianceModuleStatus:
    """Module 13: Compliance module status and validation tests"""
    
    def test_compliance_status(self):
        """GET /api/compliance?action=status - Module status"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=status")
        assert response.status_code == 200
        
        data = response.json()
        assert "module" in data
        assert data["module"]["key"] == "compliance_tax"
        assert data["module"]["name"] == "Compliance & Tax (Nigeria-First)"
        assert data["initialized"] == True
        assert "globalStats" in data
        assert "nigeriaFirst" in data
        # Verify Nigeria-first features
        assert data["nigeriaFirst"]["defaultVatRate"] == 7.5
        assert data["nigeriaFirst"]["informalBusinessesSupported"] == True
        assert data["nigeriaFirst"]["progressiveActivation"] == True
        assert data["nigeriaFirst"]["noForcedRequirements"] == True
        print("PASS: Compliance module status returns correct structure")
    
    def test_compliance_validate(self):
        """GET /api/compliance?action=validate - Module validation"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=validate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == True
        assert "checks" in data
        assert len(data["checks"]) >= 5
        
        # Verify critical compliance principles
        check_names = [c["name"] for c in data["checks"]]
        assert "No Tax Filing" in check_names
        assert "No Transaction Blocking" in check_names
        assert "Advisory Only" in check_names
        
        # All checks should pass
        for check in data["checks"]:
            assert check["passed"] == True, f"Check '{check['name']}' failed: {check['message']}"
        print("PASS: Compliance module validation passes all checks")
    
    def test_compliance_manifest(self):
        """GET /api/compliance?action=manifest - Module manifest"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=manifest")
        assert response.status_code == 200
        
        data = response.json()
        assert data["key"] == "compliance_tax"
        assert "owns" in data
        assert "doesNotOwn" in data
        assert "principles" in data
        
        # Verify module owns compliance-related entities
        assert "compliance_profiles" in data["owns"]
        assert "tax_configurations" in data["owns"]
        assert "tax_computation_records" in data["owns"]
        assert "regulatory_reports" in data["owns"]
        
        # Verify module does NOT own financial entities
        assert "invoices" in data["doesNotOwn"]
        assert "payments" in data["doesNotOwn"]
        assert "wallets" in data["doesNotOwn"]
        
        # Verify principles
        assert "No tax filing or remittance" in data["principles"]
        assert "No transaction blocking" in data["principles"]
        print("PASS: Compliance module manifest is correct")


class TestComplianceProfile:
    """Module 13: Compliance profile and tax configuration tests"""
    
    def test_compliance_profile_requires_tenant(self):
        """GET /api/compliance?action=profile - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=profile")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: Profile endpoint requires tenantId")
    
    def test_compliance_profile_get(self):
        """GET /api/compliance?action=profile&tenantId=test - Get compliance profile"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=profile&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "profile" in data
        profile = data["profile"]
        
        # Verify profile structure
        assert "tenantId" in profile
        assert "maturityLevel" in profile
        assert "businessRegistered" in profile
        assert "vatRegistered" in profile
        assert "taxTrackingEnabled" in profile
        assert "auditTrailEnabled" in profile
        
        # Default should be INFORMAL for new tenants
        assert profile["maturityLevel"] in ["INFORMAL", "BASIC", "STANDARD", "ADVANCED"]
        print(f"PASS: Compliance profile retrieved - maturity level: {profile['maturityLevel']}")
    
    def test_tax_config_requires_tenant(self):
        """GET /api/compliance?action=tax-config - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=tax-config")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: Tax config endpoint requires tenantId")
    
    def test_tax_config_get(self):
        """GET /api/compliance?action=tax-config&tenantId=test - Get tax configuration"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=tax-config&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "taxConfig" in data
        tax_config = data["taxConfig"]
        
        # Verify tax config structure
        assert "vatEnabled" in tax_config
        assert "vatRate" in tax_config
        assert "vatInclusive" in tax_config
        assert "isSmallBusiness" in tax_config
        
        # Default VAT rate should be 7.5% (Nigeria)
        assert float(tax_config["vatRate"]) == 7.5
        print(f"PASS: Tax configuration retrieved - VAT rate: {tax_config['vatRate']}%")


class TestComplianceTaxComputation:
    """Module 13: Tax computation tests (advisory only)"""
    
    def test_compute_tax_missing_params(self):
        """POST compute-tax - Missing required parameters"""
        response = requests.post(
            f"{BASE_URL}/api/compliance",
            json={"action": "compute-tax", "tenantId": TEST_TENANT_ID}
        )
        assert response.status_code == 400
        assert "required" in response.json().get("error", "").lower()
        print("PASS: Compute tax validates required parameters")
    
    def test_compute_tax_success(self):
        """POST compute-tax - Successful tax computation"""
        period_start = datetime.now().replace(day=1).isoformat()
        period_end = datetime.now().isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/compliance",
            json={
                "action": "compute-tax",
                "tenantId": TEST_TENANT_ID,
                "periodStart": period_start,
                "periodEnd": period_end,
                "totalSales": 1000000,
                "exemptSales": 100000,
                "totalPurchases": 500000,
                "computedBy": "test-user"
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] == True
        assert "computation" in data
        
        computation = data["computation"]
        assert "id" in computation
        assert computation["tenantId"] == TEST_TENANT_ID
        assert float(computation["totalSales"]) == 1000000
        assert "outputVat" in computation
        assert "inputVat" in computation
        assert "netVatPayable" in computation
        assert computation["status"] == "COMPUTED"
        
        # Store computation ID for later tests
        TestComplianceTaxComputation.computation_id = computation["id"]
        print(f"PASS: Tax computation created - Net VAT: {computation['netVatPayable']}")
    
    def test_list_computations_requires_tenant(self):
        """GET /api/compliance?action=computations - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=computations")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: List computations requires tenantId")
    
    def test_list_computations(self):
        """GET /api/compliance?action=computations&tenantId=test - List tax computations"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=computations&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "records" in data
        assert "pagination" in data
        assert isinstance(data["records"], list)
        print(f"PASS: Listed {len(data['records'])} tax computations")


class TestComplianceReporting:
    """Module 13: Regulatory report generation tests"""
    
    def test_generate_report_missing_params(self):
        """POST generate-report - Missing required parameters"""
        response = requests.post(
            f"{BASE_URL}/api/compliance",
            json={"action": "generate-report", "tenantId": TEST_TENANT_ID}
        )
        assert response.status_code == 400
        assert "required" in response.json().get("error", "").lower()
        print("PASS: Generate report validates required parameters")
    
    def test_generate_vat_summary_report(self):
        """POST generate-report - Generate VAT summary report"""
        period_start = datetime.now().replace(day=1).isoformat()
        period_end = datetime.now().isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/compliance",
            json={
                "action": "generate-report",
                "tenantId": TEST_TENANT_ID,
                "reportType": "VAT_SUMMARY",
                "periodStart": period_start,
                "periodEnd": period_end,
                "generatedBy": "test-user"
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] == True
        assert "report" in data
        
        report = data["report"]
        assert "id" in report
        assert report["reportType"] == "VAT_SUMMARY"
        assert report["status"] == "GENERATED"
        assert "reportData" in report
        # Verify disclaimer (NOT FILED)
        assert "NOT FILED" in report.get("disclaimer", "")
        
        # Store report ID for later tests
        TestComplianceReporting.report_id = report["id"]
        print(f"PASS: VAT summary report generated - ID: {report['id']}")
    
    def test_generate_compliance_status_report(self):
        """POST generate-report - Generate compliance status report"""
        period_start = datetime.now().replace(day=1).isoformat()
        period_end = datetime.now().isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/compliance",
            json={
                "action": "generate-report",
                "tenantId": TEST_TENANT_ID,
                "reportType": "COMPLIANCE_STATUS",
                "periodStart": period_start,
                "periodEnd": period_end,
                "generatedBy": "test-user"
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] == True
        assert "report" in data
        assert data["report"]["reportType"] == "COMPLIANCE_STATUS"
        # Verify disclaimer (NOT FILED)
        assert "NOT FILED" in data["report"].get("disclaimer", "")
        print("PASS: Compliance status report generated")
    
    def test_list_reports_requires_tenant(self):
        """GET /api/compliance?action=reports - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=reports")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: List reports requires tenantId")
    
    def test_list_reports(self):
        """GET /api/compliance?action=reports&tenantId=test - List regulatory reports"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=reports&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "reports" in data
        assert "pagination" in data
        assert isinstance(data["reports"], list)
        print(f"PASS: Listed {len(data['reports'])} regulatory reports")


class TestComplianceHealthCheck:
    """Module 13: Compliance health check tests"""
    
    def test_health_check_requires_tenant(self):
        """GET /api/compliance?action=health-check - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=health-check")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: Health check requires tenantId")
    
    def test_health_check(self):
        """GET /api/compliance?action=health-check&tenantId=test - Run compliance health check"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=health-check&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "score" in data
        assert "status" in data
        assert "checks" in data
        
        # Score should be 0-100
        assert 0 <= data["score"] <= 100
        
        # Status should be one of the valid values
        assert data["status"] in ["GOOD", "NEEDS_ATTENTION", "ACTION_REQUIRED"]
        
        # Checks should have proper structure
        for check in data["checks"]:
            assert "name" in check
            assert "passed" in check
            assert "message" in check
        
        print(f"PASS: Health check completed - Score: {data['score']}, Status: {data['status']}")


class TestAIModuleStatus:
    """Module 14: AI module status and validation tests"""
    
    def test_ai_status(self):
        """GET /api/ai?action=status - Module status"""
        response = requests.get(f"{BASE_URL}/api/ai?action=status")
        assert response.status_code == 200
        
        data = response.json()
        assert "module" in data
        assert data["module"]["key"] == "ai_automation"
        assert data["module"]["name"] == "AI & Automation"
        assert data["initialized"] == True
        assert "globalStats" in data
        assert "nigeriaFirst" in data
        
        # Verify Nigeria-first features
        assert data["nigeriaFirst"]["simpleExplanations"] == True
        assert data["nigeriaFirst"]["conservativeThresholds"] == True
        assert data["nigeriaFirst"]["humanInTheLoop"] == True
        print("PASS: AI module status returns correct structure")
    
    def test_ai_validate(self):
        """GET /api/ai?action=validate - Module validation"""
        response = requests.get(f"{BASE_URL}/api/ai?action=validate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == True
        assert "checks" in data
        assert len(data["checks"]) >= 5
        
        # Verify critical AI principles
        check_names = [c["name"] for c in data["checks"]]
        assert "No Autonomous Actions" in check_names
        assert "Explainable Actions" in check_names
        assert "Manual Acceptance" in check_names
        assert "No Money Movement" in check_names
        assert "Human-in-the-Loop" in check_names
        
        # All checks should pass
        for check in data["checks"]:
            assert check["passed"] == True, f"Check '{check['name']}' failed: {check['message']}"
        print("PASS: AI module validation passes all checks")
    
    def test_ai_manifest(self):
        """GET /api/ai?action=manifest - Module manifest"""
        response = requests.get(f"{BASE_URL}/api/ai?action=manifest")
        assert response.status_code == 200
        
        data = response.json()
        assert data["key"] == "ai_automation"
        assert "owns" in data
        assert "doesNotOwn" in data
        assert "principles" in data
        
        # Verify module owns AI-related entities
        assert "ai_insights" in data["owns"]
        assert "ai_recommendations" in data["owns"]
        assert "automation_rules" in data["owns"]
        assert "automation_runs" in data["owns"]
        
        # Verify module does NOT own business entities
        assert "orders" in data["doesNotOwn"]
        assert "payments" in data["doesNotOwn"]
        assert "wallets" in data["doesNotOwn"]
        
        # Verify principles
        assert "AI does not act autonomously by default" in data["principles"]
        assert "No money movement allowed" in data["principles"]
        assert "Human-in-the-loop always" in data["principles"]
        print("PASS: AI module manifest is correct")
    
    def test_ai_action_types(self):
        """GET /api/ai?action=action-types - Available action and trigger types"""
        response = requests.get(f"{BASE_URL}/api/ai?action=action-types")
        assert response.status_code == 200
        
        data = response.json()
        assert "actionTypes" in data
        assert "triggerTypes" in data
        
        # Verify action types are non-destructive
        action_types = data["actionTypes"]
        assert "NOTIFY" in action_types
        assert "ALERT" in action_types
        assert "LOG" in action_types
        assert "RECOMMEND" in action_types
        
        # Verify trigger types
        trigger_types = data["triggerTypes"]
        assert "THRESHOLD" in trigger_types
        assert "TIME" in trigger_types
        assert "EVENT" in trigger_types
        print("PASS: Action and trigger types returned correctly")


class TestAIInsights:
    """Module 14: AI insights tests"""
    
    def test_list_insights_requires_tenant(self):
        """GET /api/ai?action=insights - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/ai?action=insights")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: List insights requires tenantId")
    
    def test_list_insights(self):
        """GET /api/ai?action=insights&tenantId=test - List AI insights"""
        response = requests.get(f"{BASE_URL}/api/ai?action=insights&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "insights" in data
        assert "pagination" in data
        assert isinstance(data["insights"], list)
        print(f"PASS: Listed {len(data['insights'])} AI insights")
    
    def test_generate_insight_missing_explanation(self):
        """POST generate-insight - Requires explanation (mandatory)"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "generate-insight",
                "tenantId": TEST_TENANT_ID,
                "insightType": "SALES_TREND",
                "title": "Test Insight",
                "summary": "Test summary",
                "details": {},
                "explanation": "",  # Empty explanation
                "dataSourcesUsed": ["orders"],
                "confidence": 80
            }
        )
        assert response.status_code == 400
        assert "explanation" in response.json().get("error", "").lower()
        print("PASS: Generate insight requires meaningful explanation")
    
    def test_generate_insight_missing_data_sources(self):
        """POST generate-insight - Requires data sources (transparency)"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "generate-insight",
                "tenantId": TEST_TENANT_ID,
                "insightType": "SALES_TREND",
                "title": "Test Insight",
                "summary": "Test summary",
                "details": {},
                "explanation": "This is a detailed explanation of the insight",
                "dataSourcesUsed": [],  # Empty data sources
                "confidence": 80
            }
        )
        assert response.status_code == 400
        assert "data sources" in response.json().get("error", "").lower()
        print("PASS: Generate insight requires data sources for transparency")
    
    def test_generate_insight_success(self):
        """POST generate-insight - Create AI insight with explanation"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "generate-insight",
                "tenantId": TEST_TENANT_ID,
                "insightType": "SALES_TREND",
                "title": "TEST_Sales Trending Upward",
                "summary": "Your sales have increased by 15% compared to last week.",
                "details": {
                    "currentWeekSales": 1500000,
                    "previousWeekSales": 1300000,
                    "percentChange": 15.38
                },
                "explanation": "We analyzed your sales data from the past 14 days. This week shows higher transaction volume across most product categories.",
                "dataSourcesUsed": ["orders", "products", "payments"],
                "confidence": 85,
                "severity": "INFO"
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] == True
        assert "insight" in data
        
        insight = data["insight"]
        assert "id" in insight
        assert insight["tenantId"] == TEST_TENANT_ID
        assert insight["insightType"] == "SALES_TREND"
        assert insight["status"] == "ACTIVE"
        assert "explanation" in insight
        assert len(insight["explanation"]) > 10
        assert "dataSourcesUsed" in insight
        
        # Store insight ID for later tests
        TestAIInsights.insight_id = insight["id"]
        print(f"PASS: AI insight created with explanation - ID: {insight['id']}")
    
    def test_generate_sample_insights(self):
        """POST generate-sample-insights - Generate sample insights for demo"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "generate-sample-insights",
                "tenantId": TEST_TENANT_ID
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "insights" in data
        assert len(data["insights"]) == 2  # Sales trend + Inventory risk
        
        # Verify both insights have explanations
        for insight in data["insights"]:
            assert "explanation" in insight
            assert len(insight["explanation"]) > 10
        print("PASS: Sample insights generated with explanations")


class TestAIRecommendations:
    """Module 14: AI recommendations tests (manual acceptance required)"""
    
    def test_list_recommendations_requires_tenant(self):
        """GET /api/ai?action=recommendations - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/ai?action=recommendations")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: List recommendations requires tenantId")
    
    def test_list_recommendations(self):
        """GET /api/ai?action=recommendations&tenantId=test - List AI recommendations"""
        response = requests.get(f"{BASE_URL}/api/ai?action=recommendations&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "recommendations" in data
        assert "pagination" in data
        assert isinstance(data["recommendations"], list)
        print(f"PASS: Listed {len(data['recommendations'])} AI recommendations")
    
    def test_create_recommendation_missing_explanation(self):
        """POST create-recommendation - Requires explanation"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "create-recommendation",
                "tenantId": TEST_TENANT_ID,
                "recommendationType": "REORDER",
                "title": "Test Recommendation",
                "summary": "Test summary",
                "details": {},
                "explanation": "",  # Empty
                "expectedOutcome": "Expected outcome description",
                "dataSourcesUsed": ["inventory"],
                "confidence": 80,
                "suggestedAction": {}
            }
        )
        assert response.status_code == 400
        assert "explanation" in response.json().get("error", "").lower()
        print("PASS: Create recommendation requires explanation")
    
    def test_create_recommendation_missing_expected_outcome(self):
        """POST create-recommendation - Requires expected outcome"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "create-recommendation",
                "tenantId": TEST_TENANT_ID,
                "recommendationType": "REORDER",
                "title": "Test Recommendation",
                "summary": "Test summary",
                "details": {},
                "explanation": "This is a detailed explanation",
                "expectedOutcome": "",  # Empty
                "dataSourcesUsed": ["inventory"],
                "confidence": 80,
                "suggestedAction": {}
            }
        )
        assert response.status_code == 400
        assert "expected outcome" in response.json().get("error", "").lower()
        print("PASS: Create recommendation requires expected outcome")
    
    def test_create_recommendation_success(self):
        """POST create-recommendation - Create recommendation with manual acceptance"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "create-recommendation",
                "tenantId": TEST_TENANT_ID,
                "recommendationType": "REORDER",
                "title": "TEST_Reorder Product X",
                "summary": "Product X stock is low. Consider placing a reorder.",
                "details": {
                    "productId": "product-x-123",
                    "productName": "Product X",
                    "currentStock": 10,
                    "suggestedQuantity": 50
                },
                "explanation": "Based on your sales velocity of 3 units per day and current stock of 10 units, Product X will likely run out in 3-4 days.",
                "expectedOutcome": "Maintaining adequate stock levels will prevent stockouts and ensure continued sales.",
                "dataSourcesUsed": ["inventory", "orders", "vendors"],
                "confidence": 82,
                "suggestedAction": {
                    "type": "CREATE_PURCHASE_ORDER",
                    "vendorId": "vendor-abc",
                    "productId": "product-x-123",
                    "quantity": 50
                }
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] == True
        assert "recommendation" in data
        
        recommendation = data["recommendation"]
        assert "id" in recommendation
        assert recommendation["status"] == "PENDING"  # Requires manual acceptance
        assert "explanation" in recommendation
        assert "expectedOutcome" in recommendation
        assert "suggestedAction" in recommendation
        
        # Store recommendation ID for later tests
        TestAIRecommendations.recommendation_id = recommendation["id"]
        print(f"PASS: Recommendation created with PENDING status - ID: {recommendation['id']}")


class TestAIAutomationRules:
    """Module 14: Automation rules tests (human-in-the-loop)"""
    
    def test_list_rules_requires_tenant(self):
        """GET /api/ai?action=rules - Requires tenantId"""
        response = requests.get(f"{BASE_URL}/api/ai?action=rules")
        assert response.status_code == 400
        assert "tenantId required" in response.json().get("error", "")
        print("PASS: List rules requires tenantId")
    
    def test_list_rules(self):
        """GET /api/ai?action=rules&tenantId=test - List automation rules"""
        response = requests.get(f"{BASE_URL}/api/ai?action=rules&tenantId={TEST_TENANT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "rules" in data
        assert isinstance(data["rules"], list)
        print(f"PASS: Listed {len(data['rules'])} automation rules")
    
    def test_create_rule_invalid_action_type(self):
        """POST create-rule - Only non-destructive action types allowed"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "create-rule",
                "tenantId": TEST_TENANT_ID,
                "name": "Test Rule",
                "triggerType": "THRESHOLD",
                "triggerConfig": {"metric": "inventory", "threshold": 10},
                "actionType": "DELETE_ORDER",  # Invalid - destructive
                "actionConfig": {}
            }
        )
        assert response.status_code == 400
        assert "invalid action type" in response.json().get("error", "").lower()
        print("PASS: Create rule rejects destructive action types")
    
    def test_create_rule_success(self):
        """POST create-rule - Create automation rule with approval workflow"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "create-rule",
                "tenantId": TEST_TENANT_ID,
                "name": "TEST_Low Stock Alert",
                "description": "Send notification when stock is low",
                "triggerType": "THRESHOLD",
                "triggerConfig": {
                    "metric": "inventory_level",
                    "operator": "less_than",
                    "threshold": 10
                },
                "actionType": "NOTIFY",  # Non-destructive
                "actionConfig": {
                    "type": "push",
                    "message": "Stock is running low"
                },
                "requiresApproval": True,  # Human-in-the-loop
                "maxTriggersPerDay": 5,
                "cooldownMinutes": 60
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] == True
        assert "rule" in data
        
        rule = data["rule"]
        assert "id" in rule
        assert rule["isActive"] == True
        assert rule["requiresApproval"] == True
        assert rule["actionType"] == "NOTIFY"
        
        # Store rule ID for later tests
        TestAIAutomationRules.rule_id = rule["id"]
        print(f"PASS: Automation rule created with approval workflow - ID: {rule['id']}")
    
    def test_trigger_rule(self):
        """POST trigger-rule - Trigger automation rule"""
        if not hasattr(TestAIAutomationRules, 'rule_id'):
            pytest.skip("No rule ID available")
        
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={
                "action": "trigger-rule",
                "ruleId": TestAIAutomationRules.rule_id,
                "triggerData": {
                    "productId": "product-123",
                    "currentStock": 5
                }
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "run" in data
        
        run = data["run"]
        assert "id" in run
        # Since requiresApproval=True, status should be PENDING_APPROVAL
        assert run["status"] == "PENDING_APPROVAL"
        
        # Store run ID for later tests
        TestAIAutomationRules.run_id = run["id"]
        print(f"PASS: Rule triggered - Run status: {run['status']}")


class TestComplianceEdgeCases:
    """Module 13: Edge cases and error handling"""
    
    def test_unknown_action(self):
        """GET /api/compliance?action=unknown - Unknown action"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=unknown-action")
        assert response.status_code == 400
        assert "unknown action" in response.json().get("error", "").lower()
        print("PASS: Unknown action returns 400")
    
    def test_post_unknown_action(self):
        """POST unknown action - Unknown action"""
        response = requests.post(
            f"{BASE_URL}/api/compliance",
            json={"action": "unknown-action"}
        )
        assert response.status_code == 400
        assert "unknown action" in response.json().get("error", "").lower()
        print("PASS: POST unknown action returns 400")


class TestAIEdgeCases:
    """Module 14: Edge cases and error handling"""
    
    def test_unknown_action(self):
        """GET /api/ai?action=unknown - Unknown action"""
        response = requests.get(f"{BASE_URL}/api/ai?action=unknown-action")
        assert response.status_code == 400
        assert "unknown action" in response.json().get("error", "").lower()
        print("PASS: Unknown action returns 400")
    
    def test_post_unknown_action(self):
        """POST unknown action - Unknown action"""
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json={"action": "unknown-action"}
        )
        assert response.status_code == 400
        assert "unknown action" in response.json().get("error", "").lower()
        print("PASS: POST unknown action returns 400")


class TestNigeriaFirstFeatures:
    """Cross-module: Nigeria-first feature validation"""
    
    def test_compliance_nigeria_vat_rate(self):
        """Compliance uses Nigeria VAT rate (7.5%)"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=status")
        data = response.json()
        assert data["nigeriaFirst"]["defaultVatRate"] == 7.5
        print("PASS: Compliance uses Nigeria VAT rate (7.5%)")
    
    def test_compliance_informal_business_support(self):
        """Compliance supports informal businesses"""
        response = requests.get(f"{BASE_URL}/api/compliance?action=status")
        data = response.json()
        assert data["nigeriaFirst"]["informalBusinessesSupported"] == True
        print("PASS: Compliance supports informal businesses")
    
    def test_ai_human_in_the_loop(self):
        """AI requires human-in-the-loop"""
        response = requests.get(f"{BASE_URL}/api/ai?action=status")
        data = response.json()
        assert data["nigeriaFirst"]["humanInTheLoop"] == True
        print("PASS: AI requires human-in-the-loop")
    
    def test_ai_simple_explanations(self):
        """AI provides simple explanations"""
        response = requests.get(f"{BASE_URL}/api/ai?action=status")
        data = response.json()
        assert data["nigeriaFirst"]["simpleExplanations"] == True
        print("PASS: AI provides simple explanations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
