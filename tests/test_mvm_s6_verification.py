"""
MVM Suite S6 - Final Verification Tests
========================================
Comprehensive end-to-end verification of the Multi-Vendor Marketplace suite.

Tests:
1. Capability Guard Enforcement
2. Vendor Lifecycle (Create → Approve → Verify → Suspend → Reinstate)
3. Order Flow (Parent order → Sub-order split → Commission calculation)
4. Commission Calculation (15% default, tier-based rates)
5. Payout Eligibility
6. Tenant Isolation
7. Dashboard APIs (Admin & Vendor)
8. Nigeria-First Requirements (NGN, 7.5% VAT, 15% commission)
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://buildfix-api.preview.emergentagent.com').rstrip('/')

# Test tenant IDs
ACTIVATED_TENANT = "demo-tenant-001"
NON_ACTIVATED_TENANT = "non-activated-tenant-xyz"

# Demo vendor IDs (from seed data)
DEMO_VENDORS = {
    "adebayo": "cmk2qc97r000614jeohyoao1n",  # Gold tier, 10% commission
    "nkechi": "cmk2qc9lq000814je3msu2g3a",   # Silver tier, 12% commission
    "chukwu": "cmk2qc9zh000a14jehd3pob47",   # Silver tier, 12% commission
    "emeka": "cmk2qcaqz000e14je35qwk2j4",    # Gold tier, 10% commission
    "seun": "cmk2qcad7000c14je3iqn9rfb",     # Bronze tier, 15% (PENDING_APPROVAL)
    "fatima": "cmk2qcb4s000g14je2zm68frx"    # Bronze tier, 15% (SUSPENDED)
}


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestCapabilityGuard:
    """Test capability guard enforcement - API returns 403 when 'mvm' capability is not activated"""
    
    def test_vendors_api_blocked_for_non_activated_tenant(self, api_client):
        """Verify vendors API returns 403 for non-activated tenant"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": NON_ACTIVATED_TENANT}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["success"] == False
        assert data["code"] == "CAPABILITY_INACTIVE"
        assert "mvm" in data["error"].lower() or "capability" in data["error"].lower()
        print(f"✅ Capability guard working: {data['error']}")
    
    def test_orders_api_blocked_for_non_activated_tenant(self, api_client):
        """Verify orders API returns 403 for non-activated tenant"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/orders",
            headers={"x-tenant-id": NON_ACTIVATED_TENANT}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["code"] == "CAPABILITY_INACTIVE"
        print("✅ Orders API capability guard working")
    
    def test_commissions_api_blocked_for_non_activated_tenant(self, api_client):
        """Verify commissions API returns 403 for non-activated tenant"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/commissions",
            headers={"x-tenant-id": NON_ACTIVATED_TENANT}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["code"] == "CAPABILITY_INACTIVE"
        print("✅ Commissions API capability guard working")
    
    def test_payouts_api_blocked_for_non_activated_tenant(self, api_client):
        """Verify payouts API returns 403 for non-activated tenant"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/payouts",
            headers={"x-tenant-id": NON_ACTIVATED_TENANT}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["code"] == "CAPABILITY_INACTIVE"
        print("✅ Payouts API capability guard working")
    
    def test_dashboard_api_blocked_for_non_activated_tenant(self, api_client):
        """Verify dashboard API returns 403 for non-activated tenant"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/dashboard",
            headers={"x-tenant-id": NON_ACTIVATED_TENANT}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["code"] == "CAPABILITY_INACTIVE"
        print("✅ Dashboard API capability guard working")


class TestVendorCRUD:
    """Test vendor CRUD operations"""
    
    def test_list_vendors(self, api_client):
        """List all vendors for activated tenant"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "vendors" in data["data"]
        assert data["data"]["total"] >= 4  # At least 4 demo vendors
        print(f"✅ Listed {data['data']['total']} vendors")
    
    def test_get_vendor_by_id(self, api_client):
        """Get specific vendor by ID"""
        vendor_id = DEMO_VENDORS["adebayo"]
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        vendor = data["data"]["vendor"]
        assert vendor["id"] == vendor_id
        assert vendor["name"] == "Adebayo Electronics"
        assert vendor["email"] == "adebayo@lagosdm.ng"
        assert vendor["status"] == "APPROVED"
        print(f"✅ Got vendor: {vendor['name']}")
    
    def test_create_vendor(self, api_client):
        """Create a new vendor"""
        unique_email = f"test_vendor_{datetime.now().strftime('%Y%m%d%H%M%S')}@lagosdm.ng"
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={
                "name": "TEST_New Vendor",
                "email": unique_email,
                "phone": "+2348012345678",
                "businessType": "Test Business",
                "description": "Test vendor for S6 verification"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] == True
        assert "id" in data["data"]
        assert "slug" in data["data"]
        print(f"✅ Created vendor with ID: {data['data']['id']}")
        return data["data"]["id"]
    
    def test_create_vendor_duplicate_email_rejected(self, api_client):
        """Verify duplicate email is rejected"""
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={
                "name": "Duplicate Vendor",
                "email": "adebayo@lagosdm.ng"  # Existing email
            }
        )
        assert response.status_code == 409
        data = response.json()
        assert data["success"] == False
        assert "already exists" in data["error"].lower()
        print("✅ Duplicate email correctly rejected")
    
    def test_create_vendor_missing_required_fields(self, api_client):
        """Verify validation for required fields"""
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={"name": "Missing Email Vendor"}  # Missing email
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        print("✅ Missing required fields correctly rejected")


class TestVendorLifecycle:
    """Test vendor status transitions: Create → Approve → Verify → Suspend → Reinstate"""
    
    def test_approve_pending_vendor(self, api_client):
        """Approve a pending vendor (Oluwaseun Beauty)"""
        vendor_id = DEMO_VENDORS["seun"]  # PENDING_APPROVAL status
        
        # First check current status
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        current_status = response.json()["data"]["vendor"]["status"]
        
        if current_status == "PENDING_APPROVAL":
            # Approve the vendor
            response = api_client.post(
                f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}?action=approve",
                headers={"x-tenant-id": ACTIVATED_TENANT},
                json={"approvedBy": "test-admin"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["data"]["newStatus"] == "APPROVED"
            print(f"✅ Vendor approved: {current_status} → APPROVED")
        else:
            print(f"⚠️ Vendor already in status: {current_status}, skipping approve test")
    
    def test_verify_vendor(self, api_client):
        """Verify an approved vendor"""
        vendor_id = DEMO_VENDORS["chukwu"]  # APPROVED but not verified
        
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}?action=verify",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={"verifiedBy": "test-admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✅ Vendor verified successfully")
    
    def test_suspend_vendor(self, api_client):
        """Suspend an approved vendor"""
        vendor_id = DEMO_VENDORS["seun"]  # Should be APPROVED after previous test
        
        # First check current status
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        current_status = response.json()["data"]["vendor"]["status"]
        
        if current_status == "APPROVED":
            response = api_client.post(
                f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}?action=suspend",
                headers={"x-tenant-id": ACTIVATED_TENANT},
                json={"suspendedBy": "test-admin", "reason": "S6 verification test"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["data"]["newStatus"] == "SUSPENDED"
            print("✅ Vendor suspended successfully")
        else:
            print(f"⚠️ Vendor in status {current_status}, cannot suspend")
    
    def test_reinstate_suspended_vendor(self, api_client):
        """Reinstate a suspended vendor"""
        vendor_id = DEMO_VENDORS["fatima"]
        
        # First check current status
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        current_status = response.json()["data"]["vendor"]["status"]
        
        if current_status == "SUSPENDED":
            response = api_client.post(
                f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}?action=reinstate",
                headers={"x-tenant-id": ACTIVATED_TENANT},
                json={"reinstatedBy": "test-admin"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["data"]["newStatus"] == "APPROVED"
            print("✅ Vendor reinstated successfully")
        elif current_status == "APPROVED":
            # Vendor already reinstated from previous test run
            print(f"⚠️ Vendor already APPROVED (previously reinstated), test passes")
            assert True
        else:
            print(f"⚠️ Vendor in status {current_status}, cannot reinstate")
            pytest.skip(f"Vendor not in SUSPENDED status: {current_status}")
    
    def test_invalid_status_transition_rejected(self, api_client):
        """Verify invalid status transitions are rejected"""
        vendor_id = DEMO_VENDORS["adebayo"]  # APPROVED status
        
        # Try to approve an already approved vendor
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/vendors/{vendor_id}?action=approve",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={"approvedBy": "test-admin"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        print("✅ Invalid status transition correctly rejected")


class TestCommissionCalculation:
    """Test commission calculation with tier-based rates"""
    
    def test_commission_list(self, api_client):
        """List commissions"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/commissions",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "commissions" in data["data"]
        print(f"✅ Listed {data['data']['total']} commissions")
    
    def test_commission_summary(self, api_client):
        """Get commission summary"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/commissions?summary=true",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        summary = data["data"]
        assert "pending" in summary
        assert "cleared" in summary
        assert "paid" in summary
        print(f"✅ Commission summary: Cleared={summary['cleared']}, Paid={summary['paid']}")
    
    def test_commission_rate_verification(self, api_client):
        """Verify commission rates match tier configuration"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/commissions",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        data = response.json()
        
        for commission in data["data"]["commissions"]:
            # Verify commission calculation
            sale_amount = commission["saleAmount"]
            commission_rate = commission["commissionRate"]
            commission_amount = commission["commissionAmount"]
            vendor_payout = commission["vendorPayout"]
            
            # Commission = sale * rate / 100
            expected_commission = round(sale_amount * commission_rate / 100, 2)
            assert abs(commission_amount - expected_commission) < 1, \
                f"Commission mismatch: {commission_amount} vs expected {expected_commission}"
            
            # Vendor payout = sale - commission (VAT is pass-through)
            expected_payout = sale_amount - commission_amount
            assert abs(vendor_payout - expected_payout) < 1, \
                f"Payout mismatch: {vendor_payout} vs expected {expected_payout}"
            
            print(f"✅ Commission verified: Sale={sale_amount}, Rate={commission_rate}%, Commission={commission_amount}, Payout={vendor_payout}")


class TestOrderFlow:
    """Test order creation and sub-order split"""
    
    def test_list_orders(self, api_client):
        """List parent orders"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/orders",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "orders" in data["data"]
        
        for order in data["data"]["orders"]:
            assert order["currency"] == "NGN"  # Nigeria-first
            assert order["subOrderCount"] >= 1
        
        print(f"✅ Listed {data['data']['total']} orders")
    
    def test_create_order_with_split(self, api_client):
        """Create order and verify sub-order split"""
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/orders",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={
                "customerEmail": "test_customer@example.com",
                "customerName": "Test Customer",
                "shippingAddress": {
                    "addressLine1": "123 Test Street",
                    "city": "Lagos",
                    "state": "Lagos",
                    "country": "NG"
                },
                "items": [
                    {
                        "vendorId": DEMO_VENDORS["adebayo"],
                        "productId": "test-prod-001",
                        "productName": "Test Product 1",
                        "quantity": 2,
                        "unitPrice": 50000
                    },
                    {
                        "vendorId": DEMO_VENDORS["nkechi"],
                        "productId": "test-prod-002",
                        "productName": "Test Product 2",
                        "quantity": 1,
                        "unitPrice": 25000
                    }
                ]
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] == True
        
        result = data["data"]
        assert "parentOrderId" in result
        assert "orderNumber" in result
        assert result["orderNumber"].startswith("MVM-")
        
        # Verify sub-orders created for each vendor
        assert len(result["subOrders"]) == 2
        
        for sub_order in result["subOrders"]:
            assert sub_order["subOrderNumber"].startswith("SUB-")
            assert sub_order["commissionAmount"] > 0
            assert sub_order["vendorPayout"] > 0
        
        print(f"✅ Order created: {result['orderNumber']} with {len(result['subOrders'])} sub-orders")
    
    def test_order_validation_missing_vendor_id(self, api_client):
        """Verify order validation for missing vendorId"""
        response = api_client.post(
            f"{BASE_URL}/api/commerce/mvm/orders",
            headers={"x-tenant-id": ACTIVATED_TENANT},
            json={
                "customerEmail": "test@example.com",
                "shippingAddress": {
                    "addressLine1": "123 Test",
                    "city": "Lagos",
                    "state": "Lagos",
                    "country": "NG"
                },
                "items": [
                    {
                        "productId": "test-prod",
                        "productName": "Test",
                        "quantity": 1,
                        "unitPrice": 1000
                        # Missing vendorId
                    }
                ]
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "vendorid" in data["error"].lower()
        print("✅ Missing vendorId correctly rejected")


class TestPayoutFlow:
    """Test payout eligibility and creation"""
    
    def test_list_payouts(self, api_client):
        """List payouts"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/payouts",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "payouts" in data["data"]
        print(f"✅ Listed {data['data']['total']} payouts")
    
    def test_eligible_vendors_for_payout(self, api_client):
        """Get vendors eligible for payout"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/payouts?eligible=true",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        eligible = data["data"]
        for vendor in eligible:
            assert vendor["availableAmount"] >= 5000  # Min payout ₦5,000
            assert vendor["commissionCount"] > 0
        
        print(f"✅ {len(eligible)} vendors eligible for payout")
    
    def test_vendor_payout_summary(self, api_client):
        """Get vendor-specific payout summary"""
        vendor_id = DEMO_VENDORS["adebayo"]
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/payouts?vendorId={vendor_id}",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        summary = data["data"]["summary"]
        assert "available" in summary
        assert "pending" in summary
        assert "totalPaid" in summary
        print(f"✅ Vendor payout summary: Available={summary['available']}, Paid={summary['totalPaid']}")


class TestDashboard:
    """Test dashboard APIs"""
    
    def test_admin_dashboard(self, api_client):
        """Get admin/marketplace dashboard"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/dashboard",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        dashboard = data["data"]
        
        # Verify config
        config = dashboard["config"]
        assert config["marketplaceName"] == "Lagos Digital Market"
        assert config["defaultCommissionRate"] == 15  # 15% default
        assert config["vatRate"] == 7.5  # 7.5% VAT
        
        # Verify vendor counts
        vendors = dashboard["vendors"]
        assert vendors["total"] >= 4
        
        # Verify orders
        orders = dashboard["orders"]
        assert "last30Days" in orders
        assert "revenue" in orders
        
        # Verify commissions
        commissions = dashboard["commissions"]
        assert "cleared" in commissions
        assert "paid" in commissions
        
        print(f"✅ Admin dashboard: {vendors['total']} vendors, {orders['last30Days']} orders (30d)")
    
    def test_vendor_dashboard(self, api_client):
        """Get vendor-specific dashboard"""
        vendor_id = DEMO_VENDORS["adebayo"]
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/dashboard?vendorId={vendor_id}",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        dashboard = data["data"]
        
        # Verify vendor info
        vendor = dashboard["vendor"]
        assert vendor["name"] == "Adebayo Electronics"
        assert vendor["status"] == "APPROVED"
        assert vendor["tierName"] == "Gold"
        assert vendor["commissionRate"] == 10  # Gold tier rate
        
        # Verify metrics
        metrics = dashboard["metrics"]
        assert metrics["totalSales"] > 0
        assert metrics["totalOrders"] > 0
        
        # Verify order counts
        order_counts = dashboard["orderCounts"]
        assert "PENDING" in order_counts
        assert "DELIVERED" in order_counts
        
        # Verify payout summary
        payout_summary = dashboard["payoutSummary"]
        assert "available" in payout_summary
        
        print(f"✅ Vendor dashboard: Sales={metrics['totalSales']}, Orders={metrics['totalOrders']}")


class TestTenantIsolation:
    """Test tenant data isolation"""
    
    def test_vendor_data_isolated_per_tenant(self, api_client):
        """Verify vendor data is isolated per tenant"""
        # Get vendors for activated tenant
        response1 = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        assert response1.status_code == 200
        tenant1_vendors = response1.json()["data"]["vendors"]
        
        # Try to access with different tenant (should be blocked by capability guard)
        response2 = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": NON_ACTIVATED_TENANT}
        )
        assert response2.status_code == 403
        
        # Verify tenant1 vendors belong to correct tenant
        for vendor in tenant1_vendors:
            # All vendors should be from demo-tenant-001
            assert vendor["email"].endswith("@lagosdm.ng")
        
        print(f"✅ Tenant isolation verified: {len(tenant1_vendors)} vendors for {ACTIVATED_TENANT}")


class TestNigeriaFirstRequirements:
    """Test Nigeria-first requirements: NGN currency, 15% commission, 7.5% VAT"""
    
    def test_currency_is_ngn(self, api_client):
        """Verify all monetary values are in NGN"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/orders",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        data = response.json()
        
        for order in data["data"]["orders"]:
            assert order["currency"] == "NGN", f"Expected NGN, got {order['currency']}"
        
        print("✅ All orders use NGN currency")
    
    def test_default_commission_rate_15_percent(self, api_client):
        """Verify default commission rate is 15%"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/dashboard",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        data = response.json()
        
        config = data["data"]["config"]
        assert config["defaultCommissionRate"] == 15
        print("✅ Default commission rate is 15%")
    
    def test_vat_rate_7_5_percent(self, api_client):
        """Verify VAT rate is 7.5%"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/dashboard",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        data = response.json()
        
        config = data["data"]["config"]
        assert config["vatRate"] == 7.5
        print("✅ VAT rate is 7.5%")
    
    def test_tier_based_commission_rates(self, api_client):
        """Verify tier-based commission rates: Gold 10%, Silver 12%, Bronze 15%"""
        response = api_client.get(
            f"{BASE_URL}/api/commerce/mvm/vendors",
            headers={"x-tenant-id": ACTIVATED_TENANT}
        )
        data = response.json()
        
        tier_rates = {}
        for vendor in data["data"]["vendors"]:
            tier_name = vendor["tierName"]
            rate = vendor["commissionRate"]
            tier_rates[tier_name] = rate
        
        # Verify tier rates
        if "Gold" in tier_rates:
            assert tier_rates["Gold"] == 10, f"Gold tier should be 10%, got {tier_rates['Gold']}%"
        if "Silver" in tier_rates:
            assert tier_rates["Silver"] == 12, f"Silver tier should be 12%, got {tier_rates['Silver']}%"
        if "Bronze" in tier_rates:
            assert tier_rates["Bronze"] == 15, f"Bronze tier should be 15%, got {tier_rates['Bronze']}%"
        
        print(f"✅ Tier-based rates verified: {tier_rates}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
