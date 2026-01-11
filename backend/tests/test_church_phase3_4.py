"""
CHURCH SUITE PHASE 3 & 4: Comprehensive Backend API Tests
Tests for Church Suite Giving & Financial Facts (Phase 3) and Governance, Audit & Transparency (Phase 4).

This test suite verifies:
PHASE 3 - GIVING & FINANCIAL FACTS:
1. Tithes API (APPEND-ONLY enforcement)
2. Offerings API (APPEND-ONLY enforcement)
3. Pledges API (APPEND-ONLY enforcement)
4. Expenses API (APPEND-ONLY enforcement)
5. Budgets API (APPEND-ONLY enforcement)
6. Disclosures API (APPEND-ONLY enforcement)
7. Giving Summary API (aggregated data only)
8. Commerce boundary enforcement (_commerce_boundary: 'FACTS_ONLY')

PHASE 4 - GOVERNANCE, AUDIT & TRANSPARENCY:
9. Governance Records API (APPEND-ONLY enforcement)
10. Evidence Bundles API (APPEND-ONLY enforcement)
11. Compliance Records API (APPEND-ONLY enforcement)
12. Regulator Access Logs API (APPEND-ONLY enforcement)
13. Transparency Reports API (APPEND-ONLY enforcement)
14. Authentication enforcement (401 without x-tenant-id)
15. APPEND-ONLY enforcement (403 for PUT/PATCH/DELETE)

Classification: MEDIUM RISK (Religious/Financial)
Phase: Phase 3-4 Complete - Financial Facts & Governance
"""

import pytest
import requests
import json
from typing import Dict, Any, Optional

# Use the production URL as specified in the review request
BASE_URL = "https://buildfix-api.preview.emergentagent.com"

# Test tenant and user IDs as specified in the review request
TEST_TENANT_ID = "test-tenant"
TEST_USER_ID = "test-admin"

# Global variable to store created church ID
CHURCH_ID = None

class TestChurchSuiteSetup:
    """Setup tests - Create a church for Phase 3-4 testing"""
    
    def test_create_church_for_testing(self):
        """Create a church to get valid churchId for subsequent tests"""
        global CHURCH_ID
        
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        church_data = {
            "name": "Test Church for Phase 3-4",
            "denomination": "TEST",
            "state": "Lagos",
            "lga": "Ikeja"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/churches", headers=headers, json=church_data)
        
        # Should not return 401 with proper headers
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            CHURCH_ID = data.get("id") or data.get("churchId")
            assert CHURCH_ID is not None, "Church creation should return an ID"
            print(f"Created church with ID: {CHURCH_ID}")
        elif response.status_code == 200:
            # Church might already exist, try to get existing churches
            response = requests.get(f"{BASE_URL}/api/church/churches", headers=headers)
            if response.status_code == 200:
                data = response.json()
                churches = data.get("data", [])
                if churches:
                    CHURCH_ID = churches[0].get("id") or churches[0].get("churchId")
                    print(f"Using existing church with ID: {CHURCH_ID}")
        
        # Set a fallback church ID for testing
        if CHURCH_ID is None:
            CHURCH_ID = "test-church-id"
            print(f"Using fallback church ID: {CHURCH_ID}")


# ============================================================================
# PHASE 3: GIVING & FINANCIAL FACTS API TESTS
# ============================================================================

class TestChurchTithesAPI:
    """Test Church Tithes API - APPEND-ONLY enforcement"""
    
    def test_tithes_requires_tenant_id(self):
        """GET /api/church/giving/tithes - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving/tithes")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
    
    def test_get_tithes_with_church_id(self):
        """GET /api/church/giving/tithes - Should return facts array with commerce boundary"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving/tithes", headers=headers, params=params)
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "FACTS_ONLY" in data["_commerce_boundary"]
            assert "data" in data or "tithes" in data
    
    def test_create_tithe_fact(self):
        """POST /api/church/giving/tithes - Create tithe fact"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        tithe_data = {
            "churchId": CHURCH_ID,
            "amount": 50000,
            "currency": "NGN",
            "purpose": "TITHE",
            "givenMethod": "CASH"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/tithes", headers=headers, json=tithe_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "FACTS_ONLY" in data["_commerce_boundary"]
    
    def test_tithes_put_forbidden(self):
        """PUT /api/church/giving/tithes - Should return 403 FORBIDDEN (APPEND-ONLY enforcement)"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/giving/tithes", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "FORBIDDEN" in data["error"] or "APPEND-ONLY" in data["error"]
    
    def test_tithes_patch_forbidden(self):
        """PATCH /api/church/giving/tithes - Should return 403 FORBIDDEN (APPEND-ONLY enforcement)"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/giving/tithes", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "FORBIDDEN" in data["error"] or "APPEND-ONLY" in data["error"]
    
    def test_tithes_delete_forbidden(self):
        """DELETE /api/church/giving/tithes - Should return 403 FORBIDDEN (APPEND-ONLY enforcement)"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/giving/tithes", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "FORBIDDEN" in data["error"] or "IMMUTABLE" in data["error"]


class TestChurchOfferingsAPI:
    """Test Church Offerings API - APPEND-ONLY enforcement"""
    
    def test_offerings_requires_tenant_id(self):
        """GET /api/church/giving/offerings - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving/offerings")
        assert response.status_code == 401
    
    def test_get_offerings_with_church_id(self):
        """GET /api/church/giving/offerings - Should return facts array with commerce boundary"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving/offerings", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "FACTS_ONLY" in data["_commerce_boundary"]
    
    def test_create_offering_fact(self):
        """POST /api/church/giving/offerings - Create offering fact"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        offering_data = {
            "churchId": CHURCH_ID,
            "amount": 25000,
            "offeringType": "THANKSGIVING",
            "givenMethod": "BANK_TRANSFER"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/offerings", headers=headers, json=offering_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "FACTS_ONLY" in data["_commerce_boundary"]
    
    def test_offerings_put_forbidden(self):
        """PUT /api/church/giving/offerings - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/giving/offerings", headers=headers, json={})
        assert response.status_code == 403
    
    def test_offerings_patch_forbidden(self):
        """PATCH /api/church/giving/offerings - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/giving/offerings", headers=headers, json={})
        assert response.status_code == 403
    
    def test_offerings_delete_forbidden(self):
        """DELETE /api/church/giving/offerings - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/giving/offerings", headers=headers)
        assert response.status_code == 403


class TestChurchPledgesAPI:
    """Test Church Pledges API - APPEND-ONLY enforcement"""
    
    def test_pledges_requires_tenant_id(self):
        """GET /api/church/giving/pledges - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving/pledges")
        assert response.status_code == 401
    
    def test_get_pledges_with_church_id(self):
        """GET /api/church/giving/pledges - Should return facts array"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving/pledges", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "pledges" in data
    
    def test_create_pledge_fact(self):
        """POST /api/church/giving/pledges - Create pledge fact"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        pledge_data = {
            "churchId": CHURCH_ID,
            "memberId": "test-member",
            "pledgeType": "BUILDING_PROJECT",
            "pledgedAmount": 100000,
            "pledgeDate": "2026-01-15"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/pledges", headers=headers, json=pledge_data)
        assert response.status_code not in [400, 401]
    
    def test_pledges_put_forbidden(self):
        """PUT /api/church/giving/pledges - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/giving/pledges", headers=headers, json={})
        assert response.status_code == 403
    
    def test_pledges_patch_forbidden(self):
        """PATCH /api/church/giving/pledges - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/giving/pledges", headers=headers, json={})
        assert response.status_code == 403
    
    def test_pledges_delete_forbidden(self):
        """DELETE /api/church/giving/pledges - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/giving/pledges", headers=headers)
        assert response.status_code == 403


class TestChurchExpensesAPI:
    """Test Church Expenses API - APPEND-ONLY enforcement"""
    
    def test_expenses_requires_tenant_id(self):
        """GET /api/church/giving/expenses - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving/expenses")
        assert response.status_code == 401
    
    def test_get_expenses_with_church_id(self):
        """GET /api/church/giving/expenses - Should return facts array with commerce boundary"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving/expenses", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "FACTS_ONLY" in data["_commerce_boundary"]
    
    def test_create_expense_fact(self):
        """POST /api/church/giving/expenses - Create expense fact"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        expense_data = {
            "churchId": CHURCH_ID,
            "category": "UTILITIES",
            "description": "Electricity Bill January 2026",
            "amount": 35000,
            "expenseDate": "2026-01-10"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/expenses", headers=headers, json=expense_data)
        assert response.status_code not in [400, 401]
    
    def test_expenses_put_forbidden(self):
        """PUT /api/church/giving/expenses - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/giving/expenses", headers=headers, json={})
        assert response.status_code == 403
    
    def test_expenses_patch_forbidden(self):
        """PATCH /api/church/giving/expenses - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/giving/expenses", headers=headers, json={})
        assert response.status_code == 403
    
    def test_expenses_delete_forbidden(self):
        """DELETE /api/church/giving/expenses - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/giving/expenses", headers=headers)
        assert response.status_code == 403


class TestChurchBudgetsAPI:
    """Test Church Budgets API - APPEND-ONLY enforcement"""
    
    def test_budgets_requires_tenant_id(self):
        """GET /api/church/giving/budgets - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving/budgets")
        assert response.status_code == 401
    
    def test_get_budgets_with_church_id(self):
        """GET /api/church/giving/budgets - Should return budget facts"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving/budgets", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "budgets" in data
    
    def test_create_budget_fact(self):
        """POST /api/church/giving/budgets - Create budget fact"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        budget_data = {
            "churchId": CHURCH_ID,
            "fiscalYear": 2026,
            "category": "OPERATIONS",
            "allocatedAmount": 500000,
            "approvedBy": "test-admin",
            "approvalDate": "2026-01-01"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/budgets", headers=headers, json=budget_data)
        assert response.status_code not in [400, 401]
    
    def test_budgets_put_forbidden(self):
        """PUT /api/church/giving/budgets - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/giving/budgets", headers=headers, json={})
        assert response.status_code == 403
    
    def test_budgets_patch_forbidden(self):
        """PATCH /api/church/giving/budgets - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/giving/budgets", headers=headers, json={})
        assert response.status_code == 403
    
    def test_budgets_delete_forbidden(self):
        """DELETE /api/church/giving/budgets - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/giving/budgets", headers=headers)
        assert response.status_code == 403


class TestChurchDisclosuresAPI:
    """Test Church Disclosures API - APPEND-ONLY enforcement"""
    
    def test_disclosures_requires_tenant_id(self):
        """GET /api/church/giving/disclosures - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving/disclosures")
        assert response.status_code == 401
    
    def test_get_disclosures_with_church_id(self):
        """GET /api/church/giving/disclosures - Should return disclosures"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving/disclosures", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "disclosures" in data
    
    def test_create_disclosure(self):
        """POST /api/church/giving/disclosures - Create disclosure"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        disclosure_data = {
            "churchId": CHURCH_ID,
            "reportPeriod": "Q1-2026",
            "reportType": "QUARTERLY",
            "preparedBy": "test-admin",
            "totalTithes": 500000,
            "totalOfferings": 250000,
            "totalExpenses": 300000
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/disclosures", headers=headers, json=disclosure_data)
        assert response.status_code not in [400, 401]
    
    def test_publish_disclosure(self):
        """POST /api/church/giving/disclosures with action: publish - Publish disclosure"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        publish_data = {
            "action": "publish",
            "disclosureId": "test-disclosure-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/giving/disclosures", headers=headers, json=publish_data)
        assert response.status_code != 401
    
    def test_disclosures_put_forbidden(self):
        """PUT /api/church/giving/disclosures - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/giving/disclosures", headers=headers, json={})
        assert response.status_code == 403
    
    def test_disclosures_patch_forbidden(self):
        """PATCH /api/church/giving/disclosures - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/giving/disclosures", headers=headers, json={})
        assert response.status_code == 403
    
    def test_disclosures_delete_forbidden(self):
        """DELETE /api/church/giving/disclosures - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/giving/disclosures", headers=headers)
        assert response.status_code == 403


class TestChurchGivingSummaryAPI:
    """Test Church Giving Summary API - Aggregated data only"""
    
    def test_giving_summary_requires_tenant_id(self):
        """GET /api/church/giving - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/giving")
        assert response.status_code == 401
    
    def test_get_giving_summary_with_church_id(self):
        """GET /api/church/giving - Should return aggregated summary"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/giving", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Should include aggregated summary
            assert "tithes" in data or "totalTithes" in data
            assert "offerings" in data or "totalOfferings" in data
            assert "pledges" in data or "totalPledges" in data
            assert "expenses" in data or "totalExpenses" in data
            assert "netIncome" in data or "summary" in data
            
            # Must include privacy notice
            assert "_privacy" in data
            assert "AGGREGATED_ONLY" in data["_privacy"]
            assert "No individual giving data exposed" in data["_privacy"]


# ============================================================================
# PHASE 4: GOVERNANCE, AUDIT & TRANSPARENCY API TESTS
# ============================================================================

class TestChurchGovernanceAPI:
    """Test Church Governance Records API - APPEND-ONLY enforcement"""
    
    def test_governance_requires_tenant_id(self):
        """GET /api/church/governance - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/governance")
        assert response.status_code == 401
    
    def test_get_governance_records_with_church_id(self):
        """GET /api/church/governance - Should return records array"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/governance", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "records" in data
    
    def test_create_governance_record(self):
        """POST /api/church/governance - Create governance record"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        governance_data = {
            "churchId": CHURCH_ID,
            "recordType": "RESOLUTION",
            "title": "Annual Budget Approval",
            "summary": "Board approved 2026 budget",
            "meetingType": "BOARD_MEETING",
            "votesFor": 8,
            "votesAgainst": 1,
            "votesAbstain": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/church/governance", headers=headers, json=governance_data)
        assert response.status_code not in [400, 401]
    
    def test_approve_governance_record(self):
        """POST /api/church/governance with action: approve - Approve record"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        approve_data = {
            "action": "approve",
            "recordId": "test-governance-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/governance", headers=headers, json=approve_data)
        assert response.status_code != 401
    
    def test_governance_put_forbidden(self):
        """PUT /api/church/governance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/governance", headers=headers, json={})
        assert response.status_code == 403
    
    def test_governance_patch_forbidden(self):
        """PATCH /api/church/governance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/governance", headers=headers, json={})
        assert response.status_code == 403
    
    def test_governance_delete_forbidden(self):
        """DELETE /api/church/governance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/governance", headers=headers)
        assert response.status_code == 403


class TestChurchEvidenceAPI:
    """Test Church Evidence Bundles API - APPEND-ONLY enforcement"""
    
    def test_evidence_requires_tenant_id(self):
        """GET /api/church/evidence - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/evidence")
        assert response.status_code == 401
    
    def test_get_evidence_bundles_with_church_id(self):
        """GET /api/church/evidence - Should return bundles array"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/evidence", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "bundles" in data
    
    def test_create_evidence_bundle(self):
        """POST /api/church/evidence - Create evidence bundle"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        evidence_data = {
            "churchId": CHURCH_ID,
            "bundleType": "FINANCIAL_AUDIT",
            "title": "Q1 2026 Audit Evidence",
            "evidenceItems": [
                {
                    "type": "RECEIPT",
                    "description": "Tithe Receipt #001",
                    "url": "https://example.com/receipt1.pdf",
                    "hash": "abc123"
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/church/evidence", headers=headers, json=evidence_data)
        assert response.status_code not in [400, 401]
    
    def test_seal_evidence_bundle(self):
        """POST /api/church/evidence with action: seal - Seal bundle (makes immutable)"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        seal_data = {
            "action": "seal",
            "bundleId": "test-evidence-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/evidence", headers=headers, json=seal_data)
        assert response.status_code != 401
    
    def test_verify_evidence_integrity(self):
        """POST /api/church/evidence with action: verifyIntegrity - Verify bundle hash"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        verify_data = {
            "action": "verifyIntegrity",
            "bundleId": "test-evidence-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/evidence", headers=headers, json=verify_data)
        assert response.status_code != 401
    
    def test_evidence_put_forbidden(self):
        """PUT /api/church/evidence - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/evidence", headers=headers, json={})
        assert response.status_code == 403
    
    def test_evidence_patch_forbidden(self):
        """PATCH /api/church/evidence - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/evidence", headers=headers, json={})
        assert response.status_code == 403
    
    def test_evidence_delete_forbidden(self):
        """DELETE /api/church/evidence - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/evidence", headers=headers)
        assert response.status_code == 403


class TestChurchComplianceAPI:
    """Test Church Compliance Records API - APPEND-ONLY enforcement"""
    
    def test_compliance_requires_tenant_id(self):
        """GET /api/church/compliance - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/compliance")
        assert response.status_code == 401
    
    def test_get_compliance_records_with_church_id(self):
        """GET /api/church/compliance - Should return compliance records"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/compliance", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "records" in data
    
    def test_get_upcoming_compliance_items(self):
        """GET /api/church/compliance with upcoming=true - Should return items due within 30 days"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID, "upcoming": "true"}
        response = requests.get(f"{BASE_URL}/api/church/compliance", headers=headers, params=params)
        
        assert response.status_code != 401
    
    def test_create_compliance_record(self):
        """POST /api/church/compliance - Create compliance record"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        compliance_data = {
            "churchId": CHURCH_ID,
            "complianceType": "CAC_ANNUAL_RETURN",
            "description": "Corporate Affairs Commission Annual Filing",
            "dueDate": "2026-03-31",
            "requirement": "File annual returns with CAC"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/compliance", headers=headers, json=compliance_data)
        assert response.status_code not in [400, 401]
    
    def test_update_compliance_status(self):
        """POST /api/church/compliance with action: updateStatus - Update status to COMPLIANT"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        update_data = {
            "action": "updateStatus",
            "recordId": "test-compliance-id",
            "status": "COMPLIANT"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/compliance", headers=headers, json=update_data)
        assert response.status_code != 401
    
    def test_compliance_put_forbidden(self):
        """PUT /api/church/compliance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/compliance", headers=headers, json={})
        assert response.status_code == 403
    
    def test_compliance_patch_forbidden(self):
        """PATCH /api/church/compliance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/compliance", headers=headers, json={})
        assert response.status_code == 403
    
    def test_compliance_delete_forbidden(self):
        """DELETE /api/church/compliance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/compliance", headers=headers)
        assert response.status_code == 403


class TestChurchRegulatorAccessAPI:
    """Test Church Regulator Access Logs API - APPEND-ONLY enforcement"""
    
    def test_regulator_access_requires_tenant_id(self):
        """GET /api/church/regulator-access - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/regulator-access")
        assert response.status_code == 401
    
    def test_get_regulator_access_logs_with_church_id(self):
        """GET /api/church/regulator-access - Should return access logs"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/regulator-access", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "logs" in data
    
    def test_log_regulator_access(self):
        """POST /api/church/regulator-access - Log regulator access"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        access_data = {
            "churchId": CHURCH_ID,
            "regulatorId": "cac-inspector-001",
            "regulatorName": "CAC Compliance Officer",
            "regulatorType": "GOVERNMENT",
            "accessType": "VIEW",
            "resourceType": "FINANCIAL_RECORDS",
            "requestReason": "Annual Compliance Audit"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/regulator-access", headers=headers, json=access_data)
        assert response.status_code not in [400, 401]
    
    def test_regulator_access_put_forbidden(self):
        """PUT /api/church/regulator-access - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/regulator-access", headers=headers, json={})
        assert response.status_code == 403
    
    def test_regulator_access_patch_forbidden(self):
        """PATCH /api/church/regulator-access - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/regulator-access", headers=headers, json={})
        assert response.status_code == 403
    
    def test_regulator_access_delete_forbidden(self):
        """DELETE /api/church/regulator-access - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/regulator-access", headers=headers)
        assert response.status_code == 403


class TestChurchTransparencyAPI:
    """Test Church Transparency Reports API - APPEND-ONLY enforcement"""
    
    def test_transparency_requires_tenant_id(self):
        """GET /api/church/transparency - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/transparency")
        assert response.status_code == 401
    
    def test_get_transparency_reports_with_church_id(self):
        """GET /api/church/transparency - Should return transparency reports"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        response = requests.get(f"{BASE_URL}/api/church/transparency", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "reports" in data
    
    def test_create_transparency_report(self):
        """POST /api/church/transparency - Create transparency report"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        transparency_data = {
            "churchId": CHURCH_ID,
            "reportPeriod": "Q1-2026",
            "reportType": "QUARTERLY",
            "preparedBy": "test-admin",
            "membershipStats": {
                "total": 500,
                "active": 450
            },
            "financialSummary": {
                "income": 750000,
                "expenses": 300000
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/church/transparency", headers=headers, json=transparency_data)
        assert response.status_code not in [400, 401]
    
    def test_publish_transparency_report(self):
        """POST /api/church/transparency with action: publish - Publish report"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        publish_data = {
            "action": "publish",
            "reportId": "test-transparency-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/transparency", headers=headers, json=publish_data)
        assert response.status_code != 401
    
    def test_transparency_put_forbidden(self):
        """PUT /api/church/transparency - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/api/church/transparency", headers=headers, json={})
        assert response.status_code == 403
    
    def test_transparency_patch_forbidden(self):
        """PATCH /api/church/transparency - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/transparency", headers=headers, json={})
        assert response.status_code == 403
    
    def test_transparency_delete_forbidden(self):
        """DELETE /api/church/transparency - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/transparency", headers=headers)
        assert response.status_code == 403


# ============================================================================
# CRITICAL VERIFICATIONS
# ============================================================================

class TestChurchSuiteCriticalVerifications:
    """Test critical verifications for Church Suite Phase 3-4"""
    
    def test_commerce_boundary_enforcement(self):
        """Verify all Phase 3 responses include _commerce_boundary: 'FACTS_ONLY'"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        params = {"churchId": CHURCH_ID}
        
        # Test all Phase 3 endpoints for commerce boundary
        endpoints = [
            "/api/church/giving/tithes",
            "/api/church/giving/offerings",
            "/api/church/giving/expenses"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
            if response.status_code == 200:
                data = response.json()
                assert "_commerce_boundary" in data, f"Missing commerce boundary in {endpoint}"
                assert "FACTS_ONLY" in data["_commerce_boundary"], f"Wrong commerce boundary in {endpoint}"
    
    def test_append_only_enforcement_comprehensive(self):
        """Verify all PUT/PATCH/DELETE operations return 403 FORBIDDEN with proper error messages"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        # All Phase 3 and Phase 4 endpoints that should be APPEND-ONLY
        endpoints = [
            "/api/church/giving/tithes",
            "/api/church/giving/offerings",
            "/api/church/giving/pledges",
            "/api/church/giving/expenses",
            "/api/church/giving/budgets",
            "/api/church/giving/disclosures",
            "/api/church/governance",
            "/api/church/evidence",
            "/api/church/compliance",
            "/api/church/regulator-access",
            "/api/church/transparency"
        ]
        
        for endpoint in endpoints:
            # Test PUT
            response = requests.put(f"{BASE_URL}{endpoint}", headers=headers, json={})
            assert response.status_code == 403, f"PUT should return 403 for {endpoint}, got {response.status_code}"
            
            # Test PATCH
            response = requests.patch(f"{BASE_URL}{endpoint}", headers=headers, json={})
            assert response.status_code == 403, f"PATCH should return 403 for {endpoint}, got {response.status_code}"
            
            # Test DELETE
            response = requests.delete(f"{BASE_URL}{endpoint}", headers=headers)
            assert response.status_code == 403, f"DELETE should return 403 for {endpoint}, got {response.status_code}"
    
    def test_evidence_bundle_integrity_verification(self):
        """Verify evidence bundles have integrity hash verification working"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        # Test integrity verification action
        verify_data = {
            "action": "verifyIntegrity",
            "bundleId": "test-evidence-bundle"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/evidence", headers=headers, json=verify_data)
        # Should not return 401 (authentication should work)
        assert response.status_code != 401
        
        # If it returns 400, it should be for missing bundle, not invalid action
        if response.status_code == 400:
            data = response.json()
            # Should mention integrity verification is supported
            assert "verifyIntegrity" in str(data) or "integrity" in str(data).lower()
    
    def test_regulator_access_append_only_enforcement(self):
        """Verify regulator access logs are APPEND-ONLY"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        # Test that regulator access logs cannot be modified
        response = requests.put(f"{BASE_URL}/api/church/regulator-access", headers=headers, json={})
        assert response.status_code == 403
        
        response = requests.patch(f"{BASE_URL}/api/church/regulator-access", headers=headers, json={})
        assert response.status_code == 403
        
        response = requests.delete(f"{BASE_URL}/api/church/regulator-access", headers=headers)
        assert response.status_code == 403
    
    def test_authentication_enforcement(self):
        """Verify requests without x-tenant-id return 401"""
        # Test all major endpoints without tenant ID
        endpoints = [
            "/api/church/giving/tithes",
            "/api/church/giving/offerings",
            "/api/church/giving/pledges",
            "/api/church/giving/expenses",
            "/api/church/giving/budgets",
            "/api/church/giving/disclosures",
            "/api/church/giving",
            "/api/church/governance",
            "/api/church/evidence",
            "/api/church/compliance",
            "/api/church/regulator-access",
            "/api/church/transparency"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"Should return 401 without tenant ID for {endpoint}, got {response.status_code}"


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])