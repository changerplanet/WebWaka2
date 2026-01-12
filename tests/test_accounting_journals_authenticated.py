"""
Test Suite for Module 2: Accounting & Finance - Phase 3: Journals & Ledger Entries
Comprehensive tests with authentication for double-entry accounting.

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
"""

import pytest
import requests
import uuid
from datetime import datetime

# Base URL
BASE_URL = "https://trusting-buck.preview.emergentagent.com"

# Test tenant
TENANT_SLUG = "acme"
TENANT_ID = "67846c4f-9b38-47c7-86d9-fff55aa4afda"


@pytest.fixture(scope="module")
def session_cookie():
    """Get authenticated session cookie via magic link"""
    # Request magic link
    response = requests.post(
        f"{BASE_URL}/api/auth/magic-link",
        json={"email": "admin@acme.com", "tenantSlug": TENANT_SLUG}
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    
    magic_link = data.get("magicLink")
    assert magic_link is not None
    
    # Extract token
    token = magic_link.split("token=")[1]
    
    # Verify and get session
    session = requests.Session()
    verify_response = session.get(f"{BASE_URL}/api/auth/verify?token={token}", allow_redirects=True)
    
    # Session cookie should be set
    assert "session_token" in session.cookies
    
    return session


class TestAccountingInitialization:
    """Test accounting initialization status"""
    
    def test_accounting_is_initialized(self, session_cookie):
        """Verify accounting is initialized with COA"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/initialize")
        assert response.status_code == 200
        data = response.json()
        assert data.get("initialized") is True
        assert data.get("accountCount") > 0
        assert data.get("currentPeriod") is not None


class TestJournalCRUD:
    """Test journal entry CRUD operations"""
    
    def test_create_manual_journal_entry(self, session_cookie):
        """Create a balanced manual journal entry"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": f"TEST Manual entry {uuid.uuid4()}",
            "sourceType": "MANUAL",
            "lines": [
                {"accountCode": "1110", "debitAmount": 5000, "description": "Cash received"},
                {"accountCode": "4110", "creditAmount": 5000, "description": "Sales revenue"}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert data.get("journalEntry") is not None
        assert data["journalEntry"]["status"] == "POSTED"
        assert data["journalEntry"]["totalDebit"] == "5000"
        assert data["journalEntry"]["totalCredit"] == "5000"
        
        # Store for later tests
        TestJournalCRUD.created_journal_id = data["journalEntry"]["id"]
    
    def test_get_journal_by_id(self, session_cookie):
        """Get a single journal entry with all lines"""
        journal_id = getattr(TestJournalCRUD, "created_journal_id", None)
        if not journal_id:
            pytest.skip("No journal created in previous test")
        
        response = session_cookie.get(f"{BASE_URL}/api/accounting/journals/{journal_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == journal_id
        assert len(data.get("lines", [])) == 2
        assert data.get("status") == "POSTED"
    
    def test_list_journals(self, session_cookie):
        """List journal entries"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/journals")
        assert response.status_code == 200
        data = response.json()
        assert "journals" in data
        assert "total" in data
        assert isinstance(data["journals"], list)
    
    def test_list_journals_with_filters(self, session_cookie):
        """List journal entries with status filter"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/journals?status=POSTED")
        assert response.status_code == 200
        data = response.json()
        for journal in data.get("journals", []):
            assert journal["status"] == "POSTED"


class TestDoubleEntryValidation:
    """Test double-entry accounting validation"""
    
    def test_unbalanced_entry_fails(self, session_cookie):
        """Unbalanced journal entry should fail"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": "TEST Unbalanced entry",
            "sourceType": "MANUAL",
            "lines": [
                {"accountCode": "1110", "debitAmount": 10000},
                {"accountCode": "4110", "creditAmount": 5000}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "balance" in data.get("error", "").lower() or "debit" in data.get("error", "").lower()
    
    def test_line_with_both_debit_and_credit_fails(self, session_cookie):
        """Line with both debit and credit should fail"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": "TEST Invalid line",
            "sourceType": "MANUAL",
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000, "creditAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 400
    
    def test_minimum_two_lines_required(self, session_cookie):
        """Journal entry must have at least 2 lines"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": "TEST Single line",
            "sourceType": "MANUAL",
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 400


class TestEventPosting:
    """Test event-based journal posting"""
    
    def test_post_pos_sale_event(self, session_cookie):
        """Post a POS_SALE event"""
        event_id = str(uuid.uuid4())
        sale_id = str(uuid.uuid4())
        payload = {
            "eventType": "POS_SALE",
            "eventId": event_id,
            "saleId": sale_id,
            "saleNumber": f"TEST-POS-{uuid.uuid4().hex[:6]}",
            "totalAmount": 10750,
            "taxAmount": 750,
            "paymentMethod": "CASH",
            "saleDate": datetime.now().isoformat()
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert data.get("eventType") == "POS_SALE"
        assert data.get("journalEntry") is not None
        
        # Store for idempotency test
        TestEventPosting.pos_sale_id = sale_id
        TestEventPosting.pos_journal_id = data["journalEntry"]["id"]
    
    def test_idempotency_same_sale_returns_existing(self, session_cookie):
        """Same sale ID should return existing journal (idempotency)"""
        sale_id = getattr(TestEventPosting, "pos_sale_id", None)
        expected_journal_id = getattr(TestEventPosting, "pos_journal_id", None)
        if not sale_id:
            pytest.skip("No POS sale created in previous test")
        
        payload = {
            "eventType": "POS_SALE",
            "eventId": str(uuid.uuid4()),  # Different event ID
            "saleId": sale_id,  # Same sale ID
            "saleNumber": "TEST-POS-DUPLICATE",
            "totalAmount": 10750,
            "taxAmount": 750,
            "paymentMethod": "CASH",
            "saleDate": datetime.now().isoformat()
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 201
        data = response.json()
        # Should return the same journal entry
        assert data["journalEntry"]["id"] == expected_journal_id
    
    def test_post_svm_order_event(self, session_cookie):
        """Post an SVM_ORDER event"""
        payload = {
            "eventType": "SVM_ORDER",
            "eventId": str(uuid.uuid4()),
            "orderId": str(uuid.uuid4()),
            "orderNumber": f"TEST-SVM-{uuid.uuid4().hex[:6]}",
            "totalAmount": 21500,
            "taxAmount": 1500,
            "paymentMethod": "CARD",
            "orderDate": datetime.now().isoformat()
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert data.get("eventType") == "SVM_ORDER"
    
    def test_post_refund_event(self, session_cookie):
        """Post a REFUND event"""
        payload = {
            "eventType": "REFUND",
            "eventId": str(uuid.uuid4()),
            "refundId": str(uuid.uuid4()),
            "refundNumber": f"TEST-REF-{uuid.uuid4().hex[:6]}",
            "originalSaleId": str(uuid.uuid4()),
            "totalAmount": 5375,
            "taxAmount": 375,
            "refundMethod": "CASH",
            "refundDate": datetime.now().isoformat()
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert data.get("eventType") == "REFUND"
    
    def test_post_inventory_adjustment_event(self, session_cookie):
        """Post an INVENTORY_ADJUSTMENT event"""
        payload = {
            "eventType": "INVENTORY_ADJUSTMENT",
            "eventId": str(uuid.uuid4()),
            "adjustmentId": str(uuid.uuid4()),
            "adjustmentNumber": f"TEST-ADJ-{uuid.uuid4().hex[:6]}",
            "adjustmentType": "DECREASE",
            "totalValue": 2500,
            "reason": "Damaged goods write-off",
            "adjustmentDate": datetime.now().isoformat()
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") is True
        assert data.get("eventType") == "INVENTORY_ADJUSTMENT"


class TestJournalLookup:
    """Test journal lookup by source"""
    
    def test_lookup_by_source_id(self, session_cookie):
        """Lookup journal by sourceId"""
        sale_id = getattr(TestEventPosting, "pos_sale_id", None)
        if not sale_id:
            pytest.skip("No POS sale created")
        
        response = session_cookie.get(f"{BASE_URL}/api/accounting/journals/by-source?sourceId={sale_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") is True
        assert data.get("count") >= 1
    
    def test_lookup_requires_criteria(self, session_cookie):
        """Lookup without criteria should fail"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/journals/by-source")
        assert response.status_code == 400


class TestJournalVoid:
    """Test journal voiding"""
    
    def test_void_journal_entry(self, session_cookie):
        """Void a journal entry creates reversal"""
        # First create a journal to void
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": f"TEST Entry to void {uuid.uuid4()}",
            "sourceType": "MANUAL",
            "lines": [
                {"accountCode": "1110", "debitAmount": 3000},
                {"accountCode": "4110", "creditAmount": 3000}
            ]
        }
        create_response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert create_response.status_code == 201
        journal_id = create_response.json()["journalEntry"]["id"]
        
        # Void the journal
        void_response = session_cookie.post(
            f"{BASE_URL}/api/accounting/journals/{journal_id}?action=void",
            json={"reason": "TEST - Voiding for testing"}
        )
        assert void_response.status_code == 200
        data = void_response.json()
        assert data.get("success") is True
        assert data.get("reversalEntry") is not None
        
        # Verify original is voided
        get_response = session_cookie.get(f"{BASE_URL}/api/accounting/journals/{journal_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "VOIDED"
    
    def test_void_requires_reason(self, session_cookie):
        """Void without reason should fail"""
        fake_id = str(uuid.uuid4())
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/journals/{fake_id}?action=void",
            json={}
        )
        assert response.status_code == 400
    
    def test_void_requires_action_param(self, session_cookie):
        """POST without action=void should fail"""
        fake_id = str(uuid.uuid4())
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/journals/{fake_id}",
            json={"reason": "test"}
        )
        assert response.status_code == 400


class TestLedger:
    """Test ledger entries and accounts"""
    
    def test_list_ledger_entries(self, session_cookie):
        """List ledger entries"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/ledger")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "total" in data
    
    def test_list_ledger_entries_by_account(self, session_cookie):
        """List ledger entries filtered by account code"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/ledger?accountCode=1110")
        assert response.status_code == 200
        data = response.json()
        for entry in data.get("entries", []):
            assert entry["account"]["code"] == "1110"
    
    def test_list_ledger_accounts(self, session_cookie):
        """List ledger accounts with balances"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/ledger/accounts")
        assert response.status_code == 200
        data = response.json()
        assert "accounts" in data
        assert "summary" in data
    
    def test_list_ledger_accounts_with_activity(self, session_cookie):
        """List ledger accounts that have activity"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/ledger/accounts?hasActivity=true")
        assert response.status_code == 200
        data = response.json()
        # All returned accounts should have non-zero balance or activity
        for account in data.get("accounts", []):
            has_activity = (
                float(account["currentBalance"]) != 0 or
                float(account["periodDebit"]) != 0 or
                float(account["periodCredit"]) != 0
            )
            assert has_activity


class TestFinancialPeriods:
    """Test financial periods"""
    
    def test_list_periods(self, session_cookie):
        """List financial periods"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/periods")
        assert response.status_code == 200
        data = response.json()
        assert "periods" in data
        assert "currentPeriod" in data
    
    def test_close_and_reopen_period(self, session_cookie):
        """Close and reopen a financial period"""
        # Get current period
        list_response = session_cookie.get(f"{BASE_URL}/api/accounting/periods")
        current_period = list_response.json().get("currentPeriod")
        if not current_period:
            pytest.skip("No current period found")
        
        period_code = current_period["code"]
        
        # Close the period
        close_response = session_cookie.post(
            f"{BASE_URL}/api/accounting/periods",
            json={"action": "close", "code": period_code}
        )
        assert close_response.status_code == 200
        assert close_response.json()["period"]["status"] == "CLOSED"
        
        # Verify posting to closed period fails
        post_response = session_cookie.post(
            f"{BASE_URL}/api/accounting/journals",
            json={
                "entryDate": datetime.now().isoformat(),
                "description": "TEST Entry to closed period",
                "sourceType": "MANUAL",
                "lines": [
                    {"accountCode": "1110", "debitAmount": 1000},
                    {"accountCode": "4110", "creditAmount": 1000}
                ]
            }
        )
        assert post_response.status_code == 400
        assert "CLOSED" in post_response.json().get("error", "")
        
        # Reopen the period
        reopen_response = session_cookie.post(
            f"{BASE_URL}/api/accounting/periods",
            json={"action": "reopen", "code": period_code}
        )
        assert reopen_response.status_code == 200
        assert reopen_response.json()["period"]["status"] == "OPEN"


class TestValidation:
    """Test input validation"""
    
    def test_journal_requires_entry_date(self, session_cookie):
        """Journal entry requires entryDate"""
        payload = {
            "description": "TEST Missing date",
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 400
    
    def test_journal_requires_description(self, session_cookie):
        """Journal entry requires description"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "lines": [
                {"accountCode": "1110", "debitAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 400
    
    def test_invalid_account_code_fails(self, session_cookie):
        """Invalid account code should fail"""
        payload = {
            "entryDate": datetime.now().isoformat(),
            "description": "TEST Invalid account",
            "sourceType": "MANUAL",
            "lines": [
                {"accountCode": "9999", "debitAmount": 1000},
                {"accountCode": "4110", "creditAmount": 1000}
            ]
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals", json=payload)
        assert response.status_code == 400
        assert "not found" in response.json().get("error", "").lower()
    
    def test_event_requires_event_type(self, session_cookie):
        """Event posting requires eventType"""
        payload = {
            "eventId": str(uuid.uuid4()),
            "saleId": str(uuid.uuid4()),
            "totalAmount": 1000
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 400
    
    def test_event_requires_event_id(self, session_cookie):
        """Event posting requires eventId"""
        payload = {
            "eventType": "POS_SALE",
            "saleId": str(uuid.uuid4()),
            "totalAmount": 1000
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/journals/post-event", json=payload)
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
