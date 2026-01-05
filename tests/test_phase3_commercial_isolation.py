"""
Phase 3: Commercial Isolation (Partner-First) Tests

Tests for:
- InstanceSubscription model and APIs
- InstanceFinancialSummary model and APIs
- PartnerInstanceEarning model and APIs
- Instance suspension isolation
- Partner earnings tracking
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test instance ID from the request
TEST_INSTANCE_ID = "aa9caad2-5e59-4e8a-a7fe-e9721457f81c"
NON_EXISTENT_INSTANCE_ID = "non-existent-instance-id-12345"


class TestInstanceFinancialsAPI:
    """Tests for GET /api/instances/[id]/financials"""
    
    def test_get_financials_for_existing_instance(self):
        """GET /api/instances/{id}/financials returns financial summary with zeros initially"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/financials")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify success response
        assert data.get('success') == True
        assert 'financials' in data
        
        financials = data['financials']
        
        # Verify required fields exist
        assert 'instanceId' in financials
        assert 'instanceName' in financials
        assert 'partnerId' in financials
        assert 'partnerName' in financials
        
        # Verify revenue fields
        assert 'totalRevenue' in financials
        assert 'currentMonthRevenue' in financials
        assert 'lastMonthRevenue' in financials
        
        # Verify wholesale cost fields
        assert 'totalWholesaleCost' in financials
        assert 'currentMonthWholesaleCost' in financials
        
        # Verify profit fields
        assert 'totalProfit' in financials
        assert 'currentMonthProfit' in financials
        assert 'outstandingBalance' in financials
        
        # Verify commission fields
        assert 'totalCommissionEarned' in financials
        assert 'pendingCommission' in financials
        assert 'paidCommission' in financials
        
        # Verify timestamp
        assert 'lastCalculatedAt' in financials
        
        # Verify instance ID matches
        assert financials['instanceId'] == TEST_INSTANCE_ID
        
        # Verify initial values are zeros (no financial data yet)
        assert financials['totalRevenue'] == 0
        assert financials['currentMonthRevenue'] == 0
        assert financials['totalWholesaleCost'] == 0
        assert financials['totalProfit'] == 0
        assert financials['totalCommissionEarned'] == 0
        
        print(f"✓ Financials API returns correct structure with zeros for instance: {financials['instanceName']}")
    
    def test_get_financials_for_non_existent_instance(self):
        """GET /api/instances/{id}/financials returns 404 for non-existent instance"""
        response = requests.get(f"{BASE_URL}/api/instances/{NON_EXISTENT_INSTANCE_ID}/financials")
        
        assert response.status_code == 404
        data = response.json()
        assert 'error' in data
        assert 'not found' in data['error'].lower() or 'Instance not found' in data['error']
        
        print("✓ Financials API returns 404 for non-existent instance")


class TestInstanceSubscriptionAPI:
    """Tests for /api/instances/[id]/subscription endpoints"""
    
    def test_get_subscription_returns_404_when_none_exists(self):
        """GET /api/instances/{id}/subscription returns 404 when no subscription exists"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription")
        
        assert response.status_code == 404
        data = response.json()
        assert data.get('success') == False
        assert 'error' in data
        assert 'no subscription' in data['error'].lower() or 'not found' in data['error'].lower()
        
        print("✓ Subscription GET returns 404 when no subscription exists")
    
    def test_create_subscription_requires_auth(self):
        """POST /api/instances/{id}/subscription requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription",
            json={
                "amount": 50000,
                "wholesaleCost": 30000,
                "billingInterval": "monthly"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert 'error' in data
        assert 'unauthorized' in data['error'].lower()
        
        print("✓ Subscription CREATE requires authentication (401)")
    
    def test_update_subscription_requires_auth(self):
        """PATCH /api/instances/{id}/subscription requires authentication"""
        response = requests.patch(
            f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription",
            json={
                "amount": 60000
            }
        )
        
        # Should return 401 (unauthorized) or 404 (no subscription)
        assert response.status_code in [401, 404]
        data = response.json()
        assert 'error' in data
        
        print(f"✓ Subscription UPDATE requires authentication (status: {response.status_code})")


class TestSubscriptionSuspendAPI:
    """Tests for POST /api/instances/[id]/subscription/suspend"""
    
    def test_suspend_requires_auth(self):
        """POST /api/instances/{id}/subscription/suspend requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription/suspend",
            json={"reason": "Test suspension"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert 'error' in data
        assert 'unauthorized' in data['error'].lower()
        
        print("✓ Subscription SUSPEND requires authentication (401)")


class TestSubscriptionResumeAPI:
    """Tests for POST /api/instances/[id]/subscription/resume"""
    
    def test_resume_requires_auth(self):
        """POST /api/instances/{id}/subscription/resume requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription/resume",
            json={}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert 'error' in data
        assert 'unauthorized' in data['error'].lower()
        
        print("✓ Subscription RESUME requires authentication (401)")


class TestPartnerEarningsAPI:
    """Tests for GET /api/partner/earnings"""
    
    def test_earnings_requires_auth(self):
        """GET /api/partner/earnings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/partner/earnings")
        
        assert response.status_code == 401
        data = response.json()
        assert 'error' in data
        assert 'unauthorized' in data['error'].lower()
        
        print("✓ Partner earnings API requires authentication (401)")
    
    def test_earnings_with_instance_filter_requires_auth(self):
        """GET /api/partner/earnings?instanceId=xxx requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/partner/earnings",
            params={"instanceId": TEST_INSTANCE_ID}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert 'error' in data
        
        print("✓ Partner earnings with instance filter requires authentication (401)")


class TestAPIErrorHandling:
    """Tests for API error handling and edge cases"""
    
    def test_financials_api_handles_invalid_uuid(self):
        """Financials API handles invalid UUID gracefully"""
        response = requests.get(f"{BASE_URL}/api/instances/invalid-uuid/financials")
        
        # Should return 404 or 400, not 500
        assert response.status_code in [400, 404]
        data = response.json()
        assert 'error' in data
        
        print(f"✓ Financials API handles invalid UUID (status: {response.status_code})")
    
    def test_subscription_api_handles_invalid_uuid(self):
        """Subscription API handles invalid UUID gracefully"""
        response = requests.get(f"{BASE_URL}/api/instances/invalid-uuid/subscription")
        
        # Should return 404 or 400, not 500
        assert response.status_code in [400, 404]
        data = response.json()
        assert 'error' in data or 'success' in data
        
        print(f"✓ Subscription API handles invalid UUID (status: {response.status_code})")
    
    def test_suspend_api_handles_no_subscription(self):
        """Suspend API handles case when no subscription exists"""
        response = requests.post(
            f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription/suspend",
            json={"reason": "Test"}
        )
        
        # Should return 401 (auth required) - not 500
        assert response.status_code == 401
        
        print("✓ Suspend API handles no subscription case correctly")
    
    def test_resume_api_handles_no_subscription(self):
        """Resume API handles case when no subscription exists"""
        response = requests.post(
            f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/subscription/resume",
            json={}
        )
        
        # Should return 401 (auth required) - not 500
        assert response.status_code == 401
        
        print("✓ Resume API handles no subscription case correctly")


class TestFinancialsDataStructure:
    """Tests for financial data structure and types"""
    
    def test_financials_numeric_fields_are_numbers(self):
        """All numeric fields in financials response are actual numbers"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/financials")
        
        assert response.status_code == 200
        data = response.json()
        financials = data['financials']
        
        # Verify numeric fields are numbers (int or float)
        numeric_fields = [
            'totalRevenue', 'currentMonthRevenue', 'lastMonthRevenue',
            'totalWholesaleCost', 'currentMonthWholesaleCost',
            'totalProfit', 'currentMonthProfit', 'outstandingBalance',
            'totalCommissionEarned', 'pendingCommission', 'paidCommission'
        ]
        
        for field in numeric_fields:
            assert isinstance(financials[field], (int, float)), f"{field} should be a number"
        
        print("✓ All numeric fields in financials are proper numbers")
    
    def test_financials_string_fields_are_strings(self):
        """String fields in financials response are actual strings"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/financials")
        
        assert response.status_code == 200
        data = response.json()
        financials = data['financials']
        
        # Verify string fields
        assert isinstance(financials['instanceId'], str)
        assert isinstance(financials['instanceName'], str)
        assert isinstance(financials['partnerId'], str)
        assert isinstance(financials['partnerName'], str)
        
        print("✓ All string fields in financials are proper strings")


class TestPhase3SchemaFields:
    """Tests to verify Phase 3 schema fields are accessible via API"""
    
    def test_financials_includes_partner_tracking(self):
        """Financials API includes partnerId for partner attribution"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/financials")
        
        assert response.status_code == 200
        data = response.json()
        financials = data['financials']
        
        # partnerId should exist (may be empty string if no partner assigned)
        assert 'partnerId' in financials
        assert 'partnerName' in financials
        
        print("✓ Financials includes partner tracking fields")
    
    def test_financials_includes_commission_tracking(self):
        """Financials API includes commission tracking fields"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/financials")
        
        assert response.status_code == 200
        data = response.json()
        financials = data['financials']
        
        # Commission fields should exist
        assert 'totalCommissionEarned' in financials
        assert 'pendingCommission' in financials
        assert 'paidCommission' in financials
        
        print("✓ Financials includes commission tracking fields")
    
    def test_financials_includes_wholesale_tracking(self):
        """Financials API includes wholesale cost tracking for WebWaka"""
        response = requests.get(f"{BASE_URL}/api/instances/{TEST_INSTANCE_ID}/financials")
        
        assert response.status_code == 200
        data = response.json()
        financials = data['financials']
        
        # Wholesale cost fields should exist
        assert 'totalWholesaleCost' in financials
        assert 'currentMonthWholesaleCost' in financials
        
        print("✓ Financials includes wholesale cost tracking fields")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
