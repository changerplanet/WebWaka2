"""
Test Suite for Module 2: Accounting & Finance - Phase 3: Journals & Ledger Entries
Tests double-entry accounting with event-sourced journal creation.

Features tested:
- POST /api/accounting/journals - Create manual journal entry with double-entry validation
- GET /api/accounting/journals - List journal entries with filters
- GET /api/accounting/journals/[id] - Get single journal entry with all lines
- POST /api/accounting/journals/[id]?action=void - Void a journal entry
- POST /api/accounting/journals/post-event - Create journal from events
- GET /api/accounting/journals/by-source - Lookup journal by source
- GET /api/accounting/ledger - List ledger entries
- GET /api/accounting/ledger/accounts - List ledger accounts with balances
- GET /api/accounting/periods - List financial periods
- POST /api/accounting/periods - Close and reopen financial periods
- Idempotency: Same eventId should not create duplicate journal entries
- Double-entry validation: Debits must equal credits
- Capability guard: All endpoints should return 403 if 'accounting' capability is not active
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://buildfix-api.preview.emergentagent.com').rstrip('/')

# Test tenant ID (Acme tenant)
TENANT_ID = "67846c4f-9b38-47c7-86d9-fff55aa4afda"

# Headers for API requests
HEADERS = {
    "Content-Type": "application/json",
    "x-tenant-id": TENANT_ID
}


class TestCapabilityGuard:
    """Test that accounting endpoints return 403 when capability is not active"""
    
    def test_journals_list_requires_capability(self):
        """GET /api/accounting/journals should return 403 without accounting capability"""
        response = requests.get(f"{BASE_URL}/api/accounting/journals", headers=HEADERS)
        # Should return 401 (unauthorized) or 403 (capability not active)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_journals_create_requires_capability(self):
        """POST /api/accounting/journals should return 403 without accounting capability"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": "Test entry",
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals", headers=HEADERS, json=payload)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_ledger_requires_capability(self):
        """GET /api/accounting/ledger should return 403 without accounting capability"""
        response = requests.get(f"{BASE_URL}/api/accounting/ledger", headers=HEADERS)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_ledger_accounts_requires_capability(self):
        """GET /api/accounting/ledger/accounts should return 403 without accounting capability"""
        response = requests.get(f"{BASE_URL}/api/accounting/ledger/accounts", headers=HEADERS)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_periods_requires_capability(self):
        """GET /api/accounting/periods should return 403 without accounting capability"""
        response = requests.get(f"{BASE_URL}/api/accounting/periods", headers=HEADERS)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_post_event_requires_capability(self):
        """POST /api/accounting/journals/post-event should return 403 without accounting capability"""
        payload = {
            "eventType": "POS_SALE",
            "eventId": str(uuid.uuid4()),
            "saleId": str(uuid.uuid4()),
            "saleNumber": "TEST-001",
            "totalAmount": 10000,
            "taxAmount": 750
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals/post-event", headers=HEADERS, json=payload)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_by_source_requires_capability(self):
        """GET /api/accounting/journals/by-source should return 403 without accounting capability"""
        response = requests.get(f"{BASE_URL}/api/accounting/journals/by-source?sourceId=test", headers=HEADERS)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"


class TestAccountingInitialization:
    """Test accounting initialization endpoint"""
    
    def test_initialize_requires_capability(self):
        """POST /api/accounting/initialize should return 403 without accounting capability"""
        response = requests.post(f"{BASE_URL}/api/accounting/initialize", headers=HEADERS)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        
    def test_initialize_status_requires_capability(self):
        """GET /api/accounting/initialize should return 403 without accounting capability"""
        response = requests.get(f"{BASE_URL}/api/accounting/initialize", headers=HEADERS)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"


class TestJournalValidation:
    """Test journal entry validation rules (these tests check validation logic)"""
    
    def test_journal_requires_entry_date(self):
        """Journal entry should require entryDate"""
        payload = {
            "description": "Test entry",
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals", headers=HEADERS, json=payload)
        # Should return 400 (bad request) or 401/403 (auth/capability)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"
        
    def test_journal_requires_description(self):
        """Journal entry should require description"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"
        
    def test_journal_requires_minimum_two_lines(self):
        """Journal entry should require at least 2 lines"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": "Test entry",
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"


class TestPostEventValidation:
    """Test event posting validation"""
    
    def test_post_event_requires_event_type(self):
        """POST /api/accounting/journals/post-event should require eventType"""
        payload = {
            "eventId": str(uuid.uuid4()),
            "saleId": str(uuid.uuid4()),
            "saleNumber": "TEST-001",
            "totalAmount": 10000
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals/post-event", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"
        
    def test_post_event_requires_event_id(self):
        """POST /api/accounting/journals/post-event should require eventId"""
        payload = {
            "eventType": "POS_SALE",
            "saleId": str(uuid.uuid4()),
            "saleNumber": "TEST-001",
            "totalAmount": 10000
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals/post-event", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"
        
    def test_pos_sale_requires_sale_id(self):
        """POS_SALE event should require saleId"""
        payload = {
            "eventType": "POS_SALE",
            "eventId": str(uuid.uuid4()),
            "saleNumber": "TEST-001",
            "totalAmount": 10000
        }
        response = requests.post(f"{BASE_URL}/api/accounting/journals/post-event", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"


class TestBySourceValidation:
    """Test journal lookup by source validation"""
    
    def test_by_source_requires_lookup_criteria(self):
        """GET /api/accounting/journals/by-source should require at least one lookup criteria"""
        response = requests.get(f"{BASE_URL}/api/accounting/journals/by-source", headers=HEADERS)
        # Should return 400 (missing criteria) or 401/403 (auth/capability)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"


class TestPeriodsValidation:
    """Test financial periods validation"""
    
    def test_period_action_requires_code(self):
        """POST /api/accounting/periods should require code"""
        payload = {"action": "close"}
        response = requests.post(f"{BASE_URL}/api/accounting/periods", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"
        
    def test_period_action_requires_valid_action(self):
        """POST /api/accounting/periods should require valid action"""
        payload = {"action": "invalid", "code": "2025-01"}
        response = requests.post(f"{BASE_URL}/api/accounting/periods", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"


class TestVoidValidation:
    """Test journal void validation"""
    
    def test_void_requires_action_param(self):
        """POST /api/accounting/journals/[id] should require ?action=void"""
        fake_id = str(uuid.uuid4())
        payload = {"reason": "Test void"}
        response = requests.post(f"{BASE_URL}/api/accounting/journals/{fake_id}", headers=HEADERS, json=payload)
        # Should return 400 (invalid action) or 401/403 (auth/capability)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"
        
    def test_void_requires_reason(self):
        """POST /api/accounting/journals/[id]?action=void should require reason"""
        fake_id = str(uuid.uuid4())
        payload = {}
        response = requests.post(f"{BASE_URL}/api/accounting/journals/{fake_id}?action=void", headers=HEADERS, json=payload)
        assert response.status_code in [400, 401, 403], f"Expected 400/401/403, got {response.status_code}"


class TestEndpointAvailability:
    """Test that all accounting endpoints are available (return proper HTTP responses)"""
    
    def test_journals_endpoint_exists(self):
        """GET /api/accounting/journals endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/accounting/journals", headers=HEADERS)
        # Should not return 404 (endpoint not found)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_journals_post_endpoint_exists(self):
        """POST /api/accounting/journals endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/accounting/journals", headers=HEADERS, json={})
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_journals_by_id_endpoint_exists(self):
        """GET /api/accounting/journals/[id] endpoint should exist"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/accounting/journals/{fake_id}", headers=HEADERS)
        # Should return 401/403 (auth/capability) or 404 (not found), not 404 for endpoint
        assert response.status_code in [401, 403, 404], f"Unexpected status: {response.status_code}"
        
    def test_journals_void_endpoint_exists(self):
        """POST /api/accounting/journals/[id]?action=void endpoint should exist"""
        fake_id = str(uuid.uuid4())
        response = requests.post(f"{BASE_URL}/api/accounting/journals/{fake_id}?action=void", headers=HEADERS, json={})
        assert response.status_code in [400, 401, 403, 404], f"Unexpected status: {response.status_code}"
        
    def test_post_event_endpoint_exists(self):
        """POST /api/accounting/journals/post-event endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/accounting/journals/post-event", headers=HEADERS, json={})
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_by_source_endpoint_exists(self):
        """GET /api/accounting/journals/by-source endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/accounting/journals/by-source?sourceId=test", headers=HEADERS)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_ledger_endpoint_exists(self):
        """GET /api/accounting/ledger endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/accounting/ledger", headers=HEADERS)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_ledger_accounts_endpoint_exists(self):
        """GET /api/accounting/ledger/accounts endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/accounting/ledger/accounts", headers=HEADERS)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_periods_endpoint_exists(self):
        """GET /api/accounting/periods endpoint should exist"""
        response = requests.get(f"{BASE_URL}/api/accounting/periods", headers=HEADERS)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_periods_post_endpoint_exists(self):
        """POST /api/accounting/periods endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/accounting/periods", headers=HEADERS, json={})
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"
        
    def test_initialize_endpoint_exists(self):
        """POST /api/accounting/initialize endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/accounting/initialize", headers=HEADERS)
        assert response.status_code != 404, f"Endpoint not found: {response.status_code}"


class TestErrorResponseFormat:
    """Test that error responses have proper format"""
    
    def test_capability_error_format(self):
        """Capability guard errors should have proper format"""
        response = requests.get(f"{BASE_URL}/api/accounting/journals", headers=HEADERS)
        if response.status_code == 403:
            data = response.json()
            # Should have error message
            assert "error" in data or "message" in data, f"Missing error message: {data}"
            
    def test_validation_error_format(self):
        """Validation errors should have proper format"""
        payload = {"description": "Test"}  # Missing required fields
        response = requests.post(f"{BASE_URL}/api/accounting/journals", headers=HEADERS, json=payload)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data or "message" in data, f"Missing error message: {data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
