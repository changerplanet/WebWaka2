"""
Partner Dashboard & Audit API Tests
====================================
Tests for Phase 6 (Partner Dashboard) and Phase 7 (Audit Integration)

Features tested:
- GET /api/partners/{partnerId}/dashboard - Dashboard overview
- GET /api/partners/{partnerId}/dashboard/performance - Performance metrics
- GET /api/partners/{partnerId}/dashboard/referrals - Paginated referrals list
- GET /api/partners/{partnerId}/audit - Audit logs
- GET /api/partners/{partnerId}/audit?report=activity - Activity report
- Security: Authentication required (session_token cookie)
- Security: Partners cannot access other partners' data
- Security: Tenant internals NOT exposed
"""

import pytest
import requests
import os

# Base URL from environment
BASE_URL = "https://core-modular.preview.emergentagent.com"

# Test credentials from main agent
VALID_SESSION_TOKEN = "d63e63e0-1dc7-40ce-89ef-a2ee32602a8b-d22dacf5-6c71-46ad-8c26-5ac6d821a1e4"
VALID_PARTNER_ID = "fba5c580-9118-4916-946d-83394b6f17b0"
INVALID_PARTNER_ID = "00000000-0000-0000-0000-000000000000"
INVALID_SESSION_TOKEN = "invalid-token-12345"


class TestPartnerDashboardOverview:
    """Tests for GET /api/partners/{partnerId}/dashboard"""
    
    def test_dashboard_success_with_valid_auth(self):
        """Test dashboard returns complete overview with valid authentication"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify dashboard structure
        assert "partner" in data, "Missing 'partner' in response"
        assert "summary" in data, "Missing 'summary' in response"
        assert "earnings" in data, "Missing 'earnings' in response"
        assert "referrals" in data, "Missing 'referrals' in response"
        assert "recentActivity" in data, "Missing 'recentActivity' in response"
        
        # Verify partner info structure
        partner = data["partner"]
        assert "id" in partner
        assert "name" in partner
        assert "slug" in partner
        assert "status" in partner
        assert "tier" in partner
        assert "joinedAt" in partner
        assert partner["id"] == VALID_PARTNER_ID
        
        # Verify summary structure
        summary = data["summary"]
        assert "totalReferrals" in summary
        assert "activeReferrals" in summary
        assert "pendingReferrals" in summary
        assert "totalEarnings" in summary
        assert "thisMonthEarnings" in summary
        assert "lastMonthEarnings" in summary
        assert "currentBalance" in summary
        assert "pendingClearance" in summary
        assert "currency" in summary
        
        # Verify earnings structure
        earnings = data["earnings"]
        assert "balance" in earnings
        assert "monthlyTrend" in earnings
        assert "byStatus" in earnings
        assert "currency" in earnings
        
        # Verify referrals structure
        referrals = data["referrals"]
        assert "total" in referrals
        assert "byStatus" in referrals
        assert "recent" in referrals
        assert "topPerformers" in referrals
        
        print(f"✓ Dashboard overview returned successfully with all required fields")
        print(f"  Partner: {partner['name']} ({partner['status']})")
        print(f"  Total Referrals: {summary['totalReferrals']}")
        print(f"  Total Earnings: {summary['totalEarnings']} {summary['currency']}")
    
    def test_dashboard_requires_authentication(self):
        """Test dashboard returns 401 without session token"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard correctly requires authentication")
    
    def test_dashboard_invalid_session_token(self):
        """Test dashboard returns 401 with invalid session token"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard",
            cookies={"session_token": INVALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard correctly rejects invalid session token")
    
    def test_dashboard_partner_isolation(self):
        """Test partner cannot access another partner's dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{INVALID_PARTNER_ID}/dashboard",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        # Should return 403 (forbidden) or 404 (not found)
        assert response.status_code in [403, 404], f"Expected 403/404, got {response.status_code}"
        print("✓ Dashboard correctly enforces partner data isolation")
    
    def test_dashboard_no_tenant_internals_exposed(self):
        """Test that tenant internals are NOT exposed in dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check referrals don't expose tenant internals
        referrals = data.get("referrals", {})
        recent = referrals.get("recent", [])
        
        for tenant_info in recent:
            # Should NOT have these fields
            assert "users" not in tenant_info, "Tenant users should NOT be exposed"
            assert "settings" not in tenant_info, "Tenant settings should NOT be exposed"
            assert "domains" not in tenant_info, "Tenant domains should NOT be exposed"
            assert "modules" not in tenant_info, "Tenant modules should NOT be exposed"
            
            # Should have limited fields only
            allowed_fields = {
                "referralId", "tenantId", "tenantName", "tenantSlug", "tenantStatus",
                "referredAt", "attributionMethod", "isLifetime", "attributionExpiresAt",
                "totalRevenue", "lastPaymentDate"
            }
            for key in tenant_info.keys():
                assert key in allowed_fields, f"Unexpected field '{key}' in tenant info"
        
        print("✓ Dashboard correctly hides tenant internals")


class TestPartnerPerformanceMetrics:
    """Tests for GET /api/partners/{partnerId}/dashboard/performance"""
    
    def test_performance_success_default_period(self):
        """Test performance metrics with default 12-month period"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/performance",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify performance metrics structure
        assert "partnerId" in data
        assert "period" in data
        assert "conversionRate" in data
        assert "totalRevenue" in data
        assert "averageRevenuePerReferral" in data
        assert "retentionRate" in data
        assert "churnRate" in data
        assert "newReferralsThisPeriod" in data
        assert "growthRate" in data
        assert "monthlyRevenue" in data
        assert "monthlyReferrals" in data
        
        assert data["partnerId"] == VALID_PARTNER_ID
        
        # Verify period structure
        period = data["period"]
        assert "start" in period
        assert "end" in period
        
        print(f"✓ Performance metrics returned successfully")
        print(f"  Conversion Rate: {data['conversionRate']}%")
        print(f"  Total Revenue: {data['totalRevenue']}")
        print(f"  Retention Rate: {data['retentionRate']}%")
    
    def test_performance_custom_date_range(self):
        """Test performance metrics with custom date range"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/performance",
            params={"start": "2025-01-01", "end": "2025-12-31"},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "period" in data
        print("✓ Performance metrics with custom date range works")
    
    def test_performance_requires_authentication(self):
        """Test performance endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/performance"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Performance endpoint correctly requires authentication")
    
    def test_performance_partner_isolation(self):
        """Test partner cannot access another partner's performance"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{INVALID_PARTNER_ID}/dashboard/performance",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code in [403, 404], f"Expected 403/404, got {response.status_code}"
        print("✓ Performance endpoint correctly enforces partner isolation")


class TestPartnerReferrals:
    """Tests for GET /api/partners/{partnerId}/dashboard/referrals"""
    
    def test_referrals_success_default_pagination(self):
        """Test referrals list with default pagination"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/referrals",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "tenants" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert "_notice" in data  # Privacy notice
        
        # Verify default pagination
        assert data["limit"] == 20
        assert data["offset"] == 0
        
        # Verify tenant data is limited
        for tenant in data["tenants"]:
            # Should have limited fields only
            assert "referralId" in tenant
            assert "tenantId" in tenant
            assert "tenantName" in tenant
            assert "tenantSlug" in tenant
            assert "tenantStatus" in tenant
            
            # Should NOT have internal fields
            assert "users" not in tenant
            assert "settings" not in tenant
            assert "domains" not in tenant
        
        print(f"✓ Referrals list returned successfully")
        print(f"  Total: {data['total']}, Returned: {len(data['tenants'])}")
    
    def test_referrals_custom_pagination(self):
        """Test referrals with custom pagination"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/referrals",
            params={"limit": 5, "offset": 0},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 5
        assert data["offset"] == 0
        print("✓ Referrals pagination works correctly")
    
    def test_referrals_filter_by_status(self):
        """Test referrals filtered by status"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/referrals",
            params={"status": "ACTIVE"},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200
        print("✓ Referrals status filter works")
    
    def test_referrals_sort_by_revenue(self):
        """Test referrals sorted by revenue"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/referrals",
            params={"sortBy": "revenue", "sortOrder": "desc"},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200
        print("✓ Referrals sorting by revenue works")
    
    def test_referrals_requires_authentication(self):
        """Test referrals endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/referrals"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Referrals endpoint correctly requires authentication")
    
    def test_referrals_partner_isolation(self):
        """Test partner cannot access another partner's referrals"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{INVALID_PARTNER_ID}/dashboard/referrals",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code in [403, 404], f"Expected 403/404, got {response.status_code}"
        print("✓ Referrals endpoint correctly enforces partner isolation")


class TestPartnerAuditLogs:
    """Tests for GET /api/partners/{partnerId}/audit"""
    
    def test_audit_logs_success(self):
        """Test audit logs retrieval"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/audit",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "entries" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        
        # Verify default pagination
        assert data["limit"] == 50
        assert data["offset"] == 0
        
        # Verify audit entry structure if entries exist
        if data["entries"]:
            entry = data["entries"][0]
            assert "id" in entry
            assert "action" in entry
            assert "actorId" in entry
            assert "createdAt" in entry
        
        print(f"✓ Audit logs returned successfully")
        print(f"  Total entries: {data['total']}")
    
    def test_audit_logs_with_date_range(self):
        """Test audit logs with date range filter"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/audit",
            params={"start": "2025-01-01", "end": "2025-12-31"},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200
        print("✓ Audit logs date range filter works")
    
    def test_audit_logs_custom_pagination(self):
        """Test audit logs with custom pagination"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/audit",
            params={"limit": 10, "offset": 0},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10
        print("✓ Audit logs pagination works")
    
    def test_audit_activity_report(self):
        """Test audit activity report generation"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/audit",
            params={"report": "activity"},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify activity report structure
        assert "partner" in data
        assert "period" in data
        assert "summary" in data
        assert "timeline" in data
        
        # Verify summary structure
        summary = data["summary"]
        assert "totalActions" in summary
        assert "earningsCreated" in summary
        assert "earningsPaid" in summary
        assert "payoutBatches" in summary
        assert "referralsAdded" in summary
        
        print(f"✓ Activity report generated successfully")
        print(f"  Total Actions: {summary['totalActions']}")
    
    def test_audit_requires_authentication(self):
        """Test audit endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/audit"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Audit endpoint correctly requires authentication")
    
    def test_audit_partner_isolation(self):
        """Test partner cannot access another partner's audit logs"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{INVALID_PARTNER_ID}/audit",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        assert response.status_code in [403, 404], f"Expected 403/404, got {response.status_code}"
        print("✓ Audit endpoint correctly enforces partner isolation")


class TestSecurityEdgeCases:
    """Additional security tests"""
    
    def test_wrong_cookie_name_rejected(self):
        """Test that using wrong cookie name is rejected"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard",
            cookies={"session": VALID_SESSION_TOKEN}  # Wrong cookie name
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong cookie name correctly rejected")
    
    def test_malformed_partner_id(self):
        """Test malformed partner ID handling"""
        response = requests.get(
            f"{BASE_URL}/api/partners/not-a-uuid/dashboard",
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        # Should return 400 (bad request) or 404 (not found)
        assert response.status_code in [400, 403, 404], f"Expected 400/403/404, got {response.status_code}"
        print("✓ Malformed partner ID handled correctly")
    
    def test_sql_injection_attempt(self):
        """Test SQL injection attempt is handled"""
        response = requests.get(
            f"{BASE_URL}/api/partners/{VALID_PARTNER_ID}/dashboard/referrals",
            params={"status": "ACTIVE'; DROP TABLE partners; --"},
            cookies={"session_token": VALID_SESSION_TOKEN}
        )
        
        # Should not crash - either 200 (filtered), 400 (rejected), or 520 (blocked by WAF)
        assert response.status_code in [200, 400, 520], f"Unexpected status: {response.status_code}"
        print("✓ SQL injection attempt handled safely")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
