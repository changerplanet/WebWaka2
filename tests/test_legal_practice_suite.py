"""
Legal Practice Suite API Tests
Phase 7B.1 - Nigerian Law Firm Practice Management
Tests: Matters, Deadlines, Time Entries, Retainers, Documents, Filings, Parties, Dashboard
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://prisma-enum-bridge.preview.emergentagent.com')
TENANT_ID = "demo-legal-practice-tenant"

class TestTenantScoping:
    """Test tenant isolation - requests without x-tenant-id should return 401"""
    
    def test_matters_without_tenant_returns_401(self):
        """GET /api/legal-practice/matters without tenant header should return 401"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/matters")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant" in data["error"] or "Unauthorized" in data["error"]
    
    def test_deadlines_without_tenant_returns_401(self):
        """GET /api/legal-practice/deadlines without tenant header should return 401"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/deadlines")
        assert response.status_code == 401
    
    def test_dashboard_without_tenant_returns_401(self):
        """GET /api/legal-practice/dashboard without tenant header should return 401"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/dashboard")
        assert response.status_code == 401


class TestMattersAPI:
    """Test /api/legal-practice/matters endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_matters_list(self, headers):
        """GET /api/legal-practice/matters returns list of matters"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/matters", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "matters" in data
        assert "total" in data
        assert isinstance(data["matters"], list)
        assert data["total"] >= 10  # Demo data has 10 matters
    
    def test_matters_have_required_fields(self, headers):
        """Matters should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/matters", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["matters"]:
            matter = data["matters"][0]
            required_fields = ["id", "tenantId", "matterNumber", "title", "matterType", "status", "clientId", "clientName"]
            for field in required_fields:
                assert field in matter, f"Missing field: {field}"
    
    def test_matters_tenant_scoped(self, headers):
        """All matters should belong to the same tenant"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/matters", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        for matter in data["matters"]:
            assert matter["tenantId"] == TENANT_ID
    
    def test_create_matter(self, headers):
        """POST /api/legal-practice/matters creates a new matter"""
        payload = {
            "title": "TEST_API Matter - Contract Review",
            "matterType": "CIVIL",
            "clientId": "client-1",
            "clientName": "Chief Emeka Okafor",
            "practiceArea": "Contract Law",
            "billingType": "HOURLY"
        }
        response = requests.post(f"{BASE_URL}/api/legal-practice/matters", headers=headers, json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["matterType"] == payload["matterType"]
        assert data["clientId"] == payload["clientId"]
        assert "matterNumber" in data
        assert data["matterNumber"].startswith("MAT-")
    
    def test_create_matter_missing_fields_returns_400(self, headers):
        """POST /api/legal-practice/matters with missing fields returns 400"""
        payload = {"title": "Incomplete Matter"}  # Missing required fields
        response = requests.post(f"{BASE_URL}/api/legal-practice/matters", headers=headers, json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "error" in data


class TestDeadlinesAPI:
    """Test /api/legal-practice/deadlines endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_deadlines_list(self, headers):
        """GET /api/legal-practice/deadlines returns list of deadlines"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/deadlines", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "deadlines" in data
        assert "total" in data
        assert isinstance(data["deadlines"], list)
        assert data["total"] >= 10  # Demo data has 10 deadlines
    
    def test_deadlines_have_required_fields(self, headers):
        """Deadlines should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/deadlines", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["deadlines"]:
            deadline = data["deadlines"][0]
            required_fields = ["id", "tenantId", "matterId", "deadlineType", "title", "dueDate", "status"]
            for field in required_fields:
                assert field in deadline, f"Missing field: {field}"
    
    def test_create_deadline(self, headers):
        """POST /api/legal-practice/deadlines creates a new deadline"""
        payload = {
            "matterId": "matter-1",
            "deadlineType": "INTERNAL",
            "title": "TEST_API Deadline - Review Documents",
            "dueDate": "2026-01-25T00:00:00.000Z",
            "priority": 2
        }
        response = requests.post(f"{BASE_URL}/api/legal-practice/deadlines", headers=headers, json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["deadlineType"] == payload["deadlineType"]
        assert data["matterId"] == payload["matterId"]


class TestTimeEntriesAPI:
    """Test /api/legal-practice/time-entries endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_time_entries_list(self, headers):
        """GET /api/legal-practice/time-entries returns list of time entries"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/time-entries", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "total" in data
        assert isinstance(data["entries"], list)
        assert data["total"] >= 30  # Demo data has 30 time entries
    
    def test_time_entries_have_ngn_amounts(self, headers):
        """Time entries should have amounts in NGN"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/time-entries", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["entries"]:
            entry = data["entries"][0]
            assert "amount" in entry
            assert "rate" in entry
            assert isinstance(entry["amount"], (int, float))
    
    def test_create_time_entry(self, headers):
        """POST /api/legal-practice/time-entries creates a new time entry"""
        payload = {
            "matterId": "matter-1",
            "date": "2026-01-07T00:00:00.000Z",
            "hours": 2.0,
            "activityType": "RESEARCH",
            "description": "TEST_API Time Entry - Legal research",
            "staffId": "lawyer-1",
            "staffName": "Barr. Adaeze Nwosu",
            "billable": True,
            "rate": 50000
        }
        response = requests.post(f"{BASE_URL}/api/legal-practice/time-entries", headers=headers, json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["hours"] == payload["hours"]
        assert data["activityType"] == payload["activityType"]
        assert data["amount"] == payload["hours"] * payload["rate"]


class TestRetainersAPI:
    """Test /api/legal-practice/retainers endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_retainers_list(self, headers):
        """GET /api/legal-practice/retainers returns list of retainers"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/retainers", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "retainers" in data
        assert "total" in data
        assert isinstance(data["retainers"], list)
        assert data["total"] >= 5  # Demo data has 5 retainers
    
    def test_retainers_have_ngn_currency(self, headers):
        """Retainers should have NGN currency"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/retainers", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["retainers"]:
            retainer = data["retainers"][0]
            assert retainer["currency"] == "NGN"
            assert "initialAmount" in retainer
            assert "currentBalance" in retainer


class TestDocumentsAPI:
    """Test /api/legal-practice/documents endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_documents_list(self, headers):
        """GET /api/legal-practice/documents returns list of documents"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/documents", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert "total" in data
        assert isinstance(data["documents"], list)
        assert data["total"] >= 15  # Demo data has 15 documents
    
    def test_documents_have_required_fields(self, headers):
        """Documents should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/documents", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["documents"]:
            doc = data["documents"][0]
            required_fields = ["id", "tenantId", "matterId", "title", "category", "status"]
            for field in required_fields:
                assert field in doc, f"Missing field: {field}"


class TestFilingsAPI:
    """Test /api/legal-practice/filings endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_filings_list(self, headers):
        """GET /api/legal-practice/filings returns list of filings"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/filings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "filings" in data
        assert "total" in data
        assert isinstance(data["filings"], list)
        assert data["total"] >= 10  # Demo data has 10 filings
    
    def test_filings_have_court_info(self, headers):
        """Filings should have court information"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/filings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["filings"]:
            filing = data["filings"][0]
            assert "court" in filing
            assert "filingType" in filing
            assert "filedDate" in filing


class TestPartiesAPI:
    """Test /api/legal-practice/parties endpoints"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_parties_list(self, headers):
        """GET /api/legal-practice/parties returns list of parties"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/parties", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "parties" in data
        assert "total" in data
        assert isinstance(data["parties"], list)
        assert data["total"] >= 20  # Demo data has 20 parties
    
    def test_parties_have_required_fields(self, headers):
        """Parties should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/parties", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["parties"]:
            party = data["parties"][0]
            required_fields = ["id", "tenantId", "matterId", "partyRole", "name"]
            for field in required_fields:
                assert field in party, f"Missing field: {field}"


class TestDashboardAPI:
    """Test /api/legal-practice/dashboard endpoint"""
    
    @pytest.fixture
    def headers(self):
        return {"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    
    def test_get_dashboard_stats(self, headers):
        """GET /api/legal-practice/dashboard returns aggregated stats"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check all stat sections exist
        assert "matters" in data
        assert "time" in data
        assert "deadlines" in data
        assert "retainers" in data
        assert "upcomingDeadlines" in data
    
    def test_dashboard_matters_stats(self, headers):
        """Dashboard should have matter statistics"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        matters = data["matters"]
        assert "totalMatters" in matters
        assert "activeMatters" in matters
        assert "closedMatters" in matters
        assert matters["totalMatters"] >= 10
    
    def test_dashboard_time_stats(self, headers):
        """Dashboard should have time/billing statistics"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        time = data["time"]
        assert "totalHours" in time
        assert "billableHours" in time
        assert "unbilledAmount" in time
    
    def test_dashboard_retainer_stats(self, headers):
        """Dashboard should have retainer statistics"""
        response = requests.get(f"{BASE_URL}/api/legal-practice/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        retainers = data["retainers"]
        assert "activeRetainers" in retainers
        assert "totalBalance" in retainers
        assert "lowBalanceRetainers" in retainers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
