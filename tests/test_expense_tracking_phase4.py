"""
Test Suite for Module 2: Accounting & Finance - Phase 4: Expense Tracking
Comprehensive tests for Nigeria-first manual expense entry with automatic journal posting.

Features tested:
- POST /api/accounting/expenses - Create new expense record
- GET /api/accounting/expenses - List expenses with filters (status, paymentMethod, periodId, date range, vendor, amount)
- GET /api/accounting/expenses/[id] - Get single expense with account and journal details
- PUT /api/accounting/expenses/[id] - Update expense (DRAFT/REJECTED only)
- DELETE /api/accounting/expenses/[id] - Delete expense (DRAFT only)
- POST /api/accounting/expenses/[id]/submit - Submit expense for approval
- POST /api/accounting/expenses/[id]/approve - Approve submitted expense
- POST /api/accounting/expenses/[id]/reject - Reject submitted expense with reason
- POST /api/accounting/expenses/[id]/post - Post expense to journal (creates journal entry)
- GET /api/accounting/expenses/categories - Get Nigeria SME expense categories
- GET /api/accounting/expenses/summary - Get expense summary by category or paymentMethod
- Workflow validation: Cannot update/delete non-DRAFT expenses
- Workflow validation: Cannot submit non-DRAFT expenses
- Workflow validation: Cannot approve/reject non-SUBMITTED expenses
- Journal posting: Posted expense should have journalEntryId populated
- Journal posting: Journal entry should balance (debit expense + VAT, credit cash/bank)
- Capability guard: All endpoints should return 401/403 without valid session
"""

import pytest
import requests
import uuid
from datetime import datetime, timedelta

# Base URL
BASE_URL = "https://prisma-enum-bridge.preview.emergentagent.com"

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
    assert response.status_code == 200, f"Magic link request failed: {response.text}"
    data = response.json()
    assert data.get("success") is True, f"Magic link not successful: {data}"
    
    magic_link = data.get("magicLink")
    assert magic_link is not None, "Magic link not returned"
    
    # Extract token
    token = magic_link.split("token=")[1]
    
    # Verify and get session
    session = requests.Session()
    verify_response = session.get(f"{BASE_URL}/api/auth/verify?token={token}", allow_redirects=True)
    
    # Session cookie should be set
    assert "session_token" in session.cookies, "Session cookie not set after verification"
    
    return session


# ============================================================================
# UNAUTHENTICATED TESTS - Capability Guard
# ============================================================================

class TestCapabilityGuard:
    """Test that all endpoints require authentication"""
    
    def test_list_expenses_unauthorized(self):
        """GET /api/accounting/expenses should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/accounting/expenses")
        assert response.status_code == 401
        assert "Unauthorized" in response.json().get("error", "")
    
    def test_create_expense_unauthorized(self):
        """POST /api/accounting/expenses should return 401 without session"""
        response = requests.post(f"{BASE_URL}/api/accounting/expenses", json={
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6100",
            "amount": 50000,
            "description": "Test expense",
            "paymentMethod": "CASH"
        })
        assert response.status_code == 401
    
    def test_get_expense_unauthorized(self):
        """GET /api/accounting/expenses/[id] should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/accounting/expenses/some-id")
        assert response.status_code == 401
    
    def test_update_expense_unauthorized(self):
        """PUT /api/accounting/expenses/[id] should return 401 without session"""
        response = requests.put(f"{BASE_URL}/api/accounting/expenses/some-id", json={
            "description": "Updated"
        })
        assert response.status_code == 401
    
    def test_delete_expense_unauthorized(self):
        """DELETE /api/accounting/expenses/[id] should return 401 without session"""
        response = requests.delete(f"{BASE_URL}/api/accounting/expenses/some-id")
        assert response.status_code == 401
    
    def test_submit_expense_unauthorized(self):
        """POST /api/accounting/expenses/[id]/submit should return 401 without session"""
        response = requests.post(f"{BASE_URL}/api/accounting/expenses/some-id/submit")
        assert response.status_code == 401
    
    def test_approve_expense_unauthorized(self):
        """POST /api/accounting/expenses/[id]/approve should return 401 without session"""
        response = requests.post(f"{BASE_URL}/api/accounting/expenses/some-id/approve")
        assert response.status_code == 401
    
    def test_reject_expense_unauthorized(self):
        """POST /api/accounting/expenses/[id]/reject should return 401 without session"""
        response = requests.post(f"{BASE_URL}/api/accounting/expenses/some-id/reject", json={
            "reason": "Test rejection"
        })
        assert response.status_code == 401
    
    def test_post_expense_unauthorized(self):
        """POST /api/accounting/expenses/[id]/post should return 401 without session"""
        response = requests.post(f"{BASE_URL}/api/accounting/expenses/some-id/post")
        assert response.status_code == 401
    
    def test_get_categories_unauthorized(self):
        """GET /api/accounting/expenses/categories should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/accounting/expenses/categories")
        assert response.status_code == 401
    
    def test_get_summary_unauthorized(self):
        """GET /api/accounting/expenses/summary should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/accounting/expenses/summary")
        assert response.status_code == 401


# ============================================================================
# AUTHENTICATED TESTS - Categories
# ============================================================================

class TestExpenseCategories:
    """Test expense categories endpoint"""
    
    def test_get_expense_categories(self, session_cookie):
        """GET /api/accounting/expenses/categories returns Nigeria SME categories"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert "total" in data
        assert data["total"] > 0
        
        # Verify expected categories exist
        category_names = [c["name"] for c in data["categories"]]
        assert "Rent & Lease" in category_names
        assert "Utilities - Electricity" in category_names
        assert "Salaries & Wages" in category_names
        assert "Transport & Logistics" in category_names
        assert "Miscellaneous" in category_names
        
        # Verify category structure
        for cat in data["categories"]:
            assert "name" in cat
            assert "accountCode" in cat
            assert "icon" in cat


# ============================================================================
# AUTHENTICATED TESTS - Expense CRUD
# ============================================================================

class TestExpenseCRUD:
    """Test expense CRUD operations"""
    
    def test_create_expense_cash(self, session_cookie):
        """Create a cash expense"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6100",  # Rent & Lease
            "categoryName": "Rent & Lease",
            "amount": 150000,
            "currency": "NGN",
            "paymentMethod": "CASH",
            "paidFrom": "Petty Cash",
            "vendorName": "TEST Landlord Properties Ltd",
            "vendorPhone": "+234 801 234 5678",
            "description": "TEST Monthly office rent payment",
            "memo": "January 2026 rent",
            "receiptNumber": f"RCP-{uuid.uuid4().hex[:8].upper()}"
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 201, f"Create expense failed: {response.text}"
        data = response.json()
        
        assert data.get("id") is not None
        assert data.get("expenseNumber") is not None
        assert data.get("status") == "DRAFT"
        assert data.get("amount") == "150000"
        assert data.get("currency") == "NGN"
        assert data.get("paymentMethod") == "CASH"
        assert data.get("vendorName") == "TEST Landlord Properties Ltd"
        
        # Store for later tests
        TestExpenseCRUD.cash_expense_id = data["id"]
        TestExpenseCRUD.cash_expense_number = data["expenseNumber"]
    
    def test_create_expense_bank_transfer(self, session_cookie):
        """Create a bank transfer expense"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6210",  # Utilities - Electricity
            "categoryName": "Utilities - Electricity",
            "amount": 45000,
            "currency": "NGN",
            "paymentMethod": "BANK_TRANSFER",
            "paidFrom": "GTBank Business Account",
            "vendorName": "TEST IKEDC",
            "description": "TEST Electricity bill payment",
            "receiptNumber": f"ELEC-{uuid.uuid4().hex[:8].upper()}"
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        assert data.get("status") == "DRAFT"
        assert data.get("paymentMethod") == "BANK_TRANSFER"
        
        TestExpenseCRUD.bank_expense_id = data["id"]
    
    def test_create_expense_mobile_money(self, session_cookie):
        """Create a mobile money expense"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6700",  # Transport & Logistics
            "categoryName": "Transport & Logistics",
            "amount": 5000,
            "currency": "NGN",
            "paymentMethod": "MOBILE_MONEY",
            "paidFrom": "OPay Wallet",
            "vendorName": "TEST Bolt Driver",
            "description": "TEST Transportation to client meeting",
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        assert data.get("paymentMethod") == "MOBILE_MONEY"
        
        TestExpenseCRUD.mobile_expense_id = data["id"]
    
    def test_create_expense_with_vat(self, session_cookie):
        """Create an expense with VAT"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6600",  # Office Supplies
            "categoryName": "Office Supplies",
            "amount": 25000,
            "taxAmount": 1875,  # 7.5% VAT
            "taxCode": "VAT_7.5",
            "isVatInclusive": False,
            "currency": "NGN",
            "paymentMethod": "CARD",
            "paidFrom": "Company Debit Card",
            "vendorName": "TEST Office Mart",
            "description": "TEST Office supplies purchase",
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        assert data.get("taxAmount") == "1875"
        assert data.get("taxCode") == "VAT_7.5"
        
        TestExpenseCRUD.vat_expense_id = data["id"]
    
    def test_create_expense_credit(self, session_cookie):
        """Create a credit expense (accounts payable)"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6950",  # Miscellaneous
            "categoryName": "Miscellaneous",
            "amount": 75000,
            "currency": "NGN",
            "paymentMethod": "CREDIT",
            "vendorName": "TEST Supplier Co",
            "vendorContact": "John Doe",
            "vendorPhone": "+234 802 345 6789",
            "description": "TEST Equipment repair - to be paid later",
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        assert data.get("paymentMethod") == "CREDIT"
        
        TestExpenseCRUD.credit_expense_id = data["id"]
    
    def test_get_expense_by_id(self, session_cookie):
        """Get single expense with account details"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("id") == TestExpenseCRUD.cash_expense_id
        assert data.get("expenseNumber") == TestExpenseCRUD.cash_expense_number
        assert data.get("status") == "DRAFT"
        assert data.get("account") is not None
        assert data["account"]["code"] == "6100"
        assert data["account"]["name"] is not None
    
    def test_get_expense_not_found(self, session_cookie):
        """Get non-existent expense returns 404"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses/{uuid.uuid4()}")
        assert response.status_code == 404
    
    def test_update_expense_draft(self, session_cookie):
        """Update a DRAFT expense"""
        payload = {
            "amount": 160000,
            "description": "TEST Monthly office rent payment - UPDATED",
            "memo": "January 2026 rent - adjusted amount"
        }
        response = session_cookie.put(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("amount") == "160000"
        assert "UPDATED" in data.get("description", "")
    
    def test_list_expenses(self, session_cookie):
        """List all expenses"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses")
        assert response.status_code == 200
        data = response.json()
        
        assert "expenses" in data
        assert "total" in data
        assert data["total"] >= 5  # We created at least 5 expenses
        
        # Verify expense structure
        for expense in data["expenses"]:
            assert "id" in expense
            assert "expenseNumber" in expense
            assert "status" in expense
            assert "amount" in expense
            assert "paymentMethod" in expense
    
    def test_list_expenses_filter_by_status(self, session_cookie):
        """List expenses filtered by status"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses?status=DRAFT")
        assert response.status_code == 200
        data = response.json()
        
        for expense in data["expenses"]:
            assert expense["status"] == "DRAFT"
    
    def test_list_expenses_filter_by_payment_method(self, session_cookie):
        """List expenses filtered by payment method"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses?paymentMethod=CASH")
        assert response.status_code == 200
        data = response.json()
        
        for expense in data["expenses"]:
            assert expense["paymentMethod"] == "CASH"
    
    def test_list_expenses_filter_by_vendor(self, session_cookie):
        """List expenses filtered by vendor name"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses?vendorName=TEST")
        assert response.status_code == 200
        data = response.json()
        
        for expense in data["expenses"]:
            assert "TEST" in expense.get("vendorName", "").upper()
    
    def test_list_expenses_filter_by_amount_range(self, session_cookie):
        """List expenses filtered by amount range"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses?minAmount=10000&maxAmount=100000")
        assert response.status_code == 200
        data = response.json()
        
        for expense in data["expenses"]:
            amount = float(expense["amount"])
            assert 10000 <= amount <= 100000
    
    def test_delete_expense_draft(self, session_cookie):
        """Delete a DRAFT expense"""
        # Create a new expense to delete
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6950",
            "amount": 1000,
            "paymentMethod": "CASH",
            "description": "TEST Expense to delete"
        }
        create_response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert create_response.status_code == 201
        expense_id = create_response.json()["id"]
        
        # Delete it
        delete_response = session_cookie.delete(f"{BASE_URL}/api/accounting/expenses/{expense_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") is True
        
        # Verify it's gone
        get_response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses/{expense_id}")
        assert get_response.status_code == 404


# ============================================================================
# AUTHENTICATED TESTS - Validation
# ============================================================================

class TestExpenseValidation:
    """Test expense validation rules"""
    
    def test_create_expense_missing_required_fields(self, session_cookie):
        """Create expense without required fields fails"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            # Missing accountCode, amount, description, paymentMethod
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 400
        assert "required" in response.json().get("error", "").lower()
    
    def test_create_expense_invalid_amount(self, session_cookie):
        """Create expense with zero/negative amount fails"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6100",
            "amount": 0,
            "paymentMethod": "CASH",
            "description": "Invalid expense"
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 400
        assert "amount" in response.json().get("error", "").lower()
    
    def test_create_expense_invalid_payment_method(self, session_cookie):
        """Create expense with invalid payment method fails"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6100",
            "amount": 5000,
            "paymentMethod": "INVALID_METHOD",
            "description": "Invalid expense"
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code == 400
        assert "paymentMethod" in response.json().get("error", "")
    
    def test_create_expense_invalid_account_code(self, session_cookie):
        """Create expense with non-existent account code fails"""
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "9999",  # Non-existent
            "amount": 5000,
            "paymentMethod": "CASH",
            "description": "Invalid expense"
        }
        response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        assert response.status_code in [500, 520]  # Account not found error (520 is CDN error)
        assert "not found" in response.json().get("error", "").lower()
    
    def test_update_expense_invalid_amount(self, session_cookie):
        """Update expense with invalid amount fails"""
        response = session_cookie.put(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.bank_expense_id}",
            json={"amount": -100}
        )
        assert response.status_code == 400


# ============================================================================
# AUTHENTICATED TESTS - Workflow
# ============================================================================

class TestExpenseWorkflow:
    """Test expense workflow: DRAFT → SUBMITTED → APPROVED → POSTED"""
    
    def test_submit_expense(self, session_cookie):
        """Submit a DRAFT expense for approval"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}/submit"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data.get("message") == "Expense submitted for approval"
        assert data["expense"]["status"] == "SUBMITTED"
        assert data["expense"]["submittedAt"] is not None
    
    def test_cannot_update_submitted_expense(self, session_cookie):
        """Cannot update a SUBMITTED expense"""
        response = session_cookie.put(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}",
            json={"amount": 200000}
        )
        assert response.status_code in [500, 520]  # Service throws error
        assert "SUBMITTED" in response.json().get("error", "")
    
    def test_cannot_delete_submitted_expense(self, session_cookie):
        """Cannot delete a SUBMITTED expense"""
        response = session_cookie.delete(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}"
        )
        assert response.status_code in [500, 520]
        assert "DRAFT" in response.json().get("error", "")
    
    def test_cannot_submit_already_submitted(self, session_cookie):
        """Cannot submit an already SUBMITTED expense"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}/submit"
        )
        assert response.status_code in [500, 520]
        assert "SUBMITTED" in response.json().get("error", "")
    
    def test_approve_expense(self, session_cookie):
        """Approve a SUBMITTED expense"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}/approve"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data.get("message") == "Expense approved"
        assert data["expense"]["status"] == "APPROVED"
        assert data["expense"]["approvedAt"] is not None
    
    def test_cannot_approve_non_submitted(self, session_cookie):
        """Cannot approve a non-SUBMITTED expense"""
        # bank_expense_id is still DRAFT
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.bank_expense_id}/approve"
        )
        assert response.status_code in [500, 520]
        assert "DRAFT" in response.json().get("error", "")
    
    def test_post_expense_creates_journal(self, session_cookie):
        """Post an APPROVED expense creates journal entry"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.cash_expense_id}/post"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data.get("message") == "Expense posted to journal"
        assert data["expense"]["status"] == "POSTED"
        assert data["expense"]["journalEntryId"] is not None
        assert data["expense"]["postedAt"] is not None
        
        TestExpenseWorkflow.posted_expense_id = TestExpenseCRUD.cash_expense_id
        TestExpenseWorkflow.journal_entry_id = data["expense"]["journalEntryId"]
    
    def test_posted_expense_has_journal_details(self, session_cookie):
        """Posted expense includes journal entry details"""
        response = session_cookie.get(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseWorkflow.posted_expense_id}"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("status") == "POSTED"
        assert data.get("journal") is not None
        assert data["journal"]["id"] == TestExpenseWorkflow.journal_entry_id
        assert data["journal"]["status"] == "POSTED"
        
        # Verify journal balances
        total_debit = float(data["journal"]["totalDebit"])
        total_credit = float(data["journal"]["totalCredit"])
        assert total_debit == total_credit, "Journal entry must balance"
    
    def test_cannot_update_posted_expense(self, session_cookie):
        """Cannot update a POSTED expense"""
        response = session_cookie.put(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseWorkflow.posted_expense_id}",
            json={"amount": 200000}
        )
        assert response.status_code in [500, 520]
        assert "POSTED" in response.json().get("error", "")
    
    def test_cannot_delete_posted_expense(self, session_cookie):
        """Cannot delete a POSTED expense"""
        response = session_cookie.delete(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseWorkflow.posted_expense_id}"
        )
        assert response.status_code in [500, 520]


# ============================================================================
# AUTHENTICATED TESTS - Rejection Workflow
# ============================================================================

class TestExpenseRejection:
    """Test expense rejection workflow"""
    
    def test_reject_expense_requires_reason(self, session_cookie):
        """Reject expense without reason fails"""
        # First submit the bank expense
        session_cookie.post(f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.bank_expense_id}/submit")
        
        # Try to reject without reason
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.bank_expense_id}/reject",
            json={}
        )
        assert response.status_code == 400
        assert "reason" in response.json().get("error", "").lower()
    
    def test_reject_expense(self, session_cookie):
        """Reject a SUBMITTED expense with reason"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.bank_expense_id}/reject",
            json={"reason": "Missing receipt documentation"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data.get("message") == "Expense rejected"
        assert data["expense"]["status"] == "REJECTED"
        assert data["expense"]["rejectedAt"] is not None
        assert data["expense"]["rejectionReason"] == "Missing receipt documentation"
    
    def test_can_update_rejected_expense(self, session_cookie):
        """Can update a REJECTED expense (resets to DRAFT)"""
        response = session_cookie.put(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.bank_expense_id}",
            json={
                "description": "TEST Electricity bill payment - with receipt",
                "receiptNumber": "ELEC-RECEIPT-001"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Status should reset to DRAFT
        assert data.get("status") == "DRAFT"
        assert "with receipt" in data.get("description", "")
    
    def test_cannot_reject_non_submitted(self, session_cookie):
        """Cannot reject a non-SUBMITTED expense"""
        # mobile_expense_id is still DRAFT
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.mobile_expense_id}/reject",
            json={"reason": "Test rejection"}
        )
        assert response.status_code in [500, 520]
        assert "DRAFT" in response.json().get("error", "")


# ============================================================================
# AUTHENTICATED TESTS - Direct Post (Skip Approval)
# ============================================================================

class TestDirectPost:
    """Test direct posting from DRAFT (skip approval workflow)"""
    
    def test_post_draft_expense_directly(self, session_cookie):
        """Post a DRAFT expense directly (skip approval)"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.mobile_expense_id}/post"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data["expense"]["status"] == "POSTED"
        assert data["expense"]["journalEntryId"] is not None


# ============================================================================
# AUTHENTICATED TESTS - VAT Expense Posting
# ============================================================================

class TestVATExpensePosting:
    """Test expense posting with VAT creates correct journal entries"""
    
    def test_post_expense_with_vat(self, session_cookie):
        """Post expense with VAT creates journal with VAT line"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.vat_expense_id}/post"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data["expense"]["status"] == "POSTED"
        
        # Get the expense to verify journal
        expense_response = session_cookie.get(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.vat_expense_id}"
        )
        expense_data = expense_response.json()
        
        # Journal should balance: 25000 (expense) + 1875 (VAT) = 26875 (credit)
        total_debit = float(expense_data["journal"]["totalDebit"])
        total_credit = float(expense_data["journal"]["totalCredit"])
        assert total_debit == total_credit
        assert total_debit == 26875  # 25000 + 1875


# ============================================================================
# AUTHENTICATED TESTS - Credit Expense Posting
# ============================================================================

class TestCreditExpensePosting:
    """Test credit expense posting creates accounts payable entry"""
    
    def test_post_credit_expense(self, session_cookie):
        """Post credit expense credits Accounts Payable"""
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.credit_expense_id}/post"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert data["expense"]["status"] == "POSTED"
        
        # Verify journal entry
        expense_response = session_cookie.get(
            f"{BASE_URL}/api/accounting/expenses/{TestExpenseCRUD.credit_expense_id}"
        )
        expense_data = expense_response.json()
        
        # Journal should balance
        total_debit = float(expense_data["journal"]["totalDebit"])
        total_credit = float(expense_data["journal"]["totalCredit"])
        assert total_debit == total_credit
        assert total_debit == 75000


# ============================================================================
# AUTHENTICATED TESTS - Summary
# ============================================================================

class TestExpenseSummary:
    """Test expense summary endpoints"""
    
    def test_get_summary_by_category(self, session_cookie):
        """Get expense summary grouped by category"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses/summary?groupBy=category")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("groupBy") == "category"
        assert "categories" in data
        assert "grandTotal" in data
        assert "expenseCount" in data
        
        # Verify category structure
        for cat in data["categories"]:
            assert "category" in cat
            assert "accountCode" in cat
            assert "count" in cat
            assert "total" in cat
    
    def test_get_summary_by_payment_method(self, session_cookie):
        """Get expense summary grouped by payment method"""
        response = session_cookie.get(f"{BASE_URL}/api/accounting/expenses/summary?groupBy=paymentMethod")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("groupBy") == "paymentMethod"
        assert "summary" in data
        
        # Verify summary structure
        for item in data["summary"]:
            assert "paymentMethod" in item
            assert "count" in item
            assert "total" in item
    
    def test_get_summary_with_date_range(self, session_cookie):
        """Get expense summary with date range filter"""
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        
        response = session_cookie.get(
            f"{BASE_URL}/api/accounting/expenses/summary?startDate={start_date}&endDate={end_date}"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data or "summary" in data


# ============================================================================
# AUTHENTICATED TESTS - Invalid Actions
# ============================================================================

class TestInvalidActions:
    """Test invalid action handling"""
    
    def test_invalid_action(self, session_cookie):
        """Invalid action returns 400"""
        # Create a new expense for this test
        payload = {
            "expenseDate": datetime.now().isoformat(),
            "accountCode": "6950",
            "amount": 1000,
            "paymentMethod": "CASH",
            "description": "TEST Expense for invalid action test"
        }
        create_response = session_cookie.post(f"{BASE_URL}/api/accounting/expenses", json=payload)
        expense_id = create_response.json()["id"]
        
        response = session_cookie.post(
            f"{BASE_URL}/api/accounting/expenses/{expense_id}/invalid_action"
        )
        assert response.status_code == 400
        assert "Invalid action" in response.json().get("error", "")


# ============================================================================
# AUTHENTICATED TESTS - Verify Journal Entry Balance
# ============================================================================

class TestJournalEntryBalance:
    """Test that journal entries created from expenses are balanced"""
    
    def test_verify_journal_entry_via_journals_api(self, session_cookie):
        """Verify journal entry via journals API"""
        if not hasattr(TestExpenseWorkflow, 'journal_entry_id'):
            pytest.skip("No journal entry created in previous tests")
        
        response = session_cookie.get(
            f"{BASE_URL}/api/accounting/journals/{TestExpenseWorkflow.journal_entry_id}"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("status") == "POSTED"
        assert data.get("sourceType") == "EXPENSE"
        
        # Verify lines
        lines = data.get("lines", [])
        assert len(lines) >= 2  # At least debit and credit
        
        total_debit = sum(float(line.get("debitAmount", 0)) for line in lines)
        total_credit = sum(float(line.get("creditAmount", 0)) for line in lines)
        
        assert total_debit == total_credit, "Journal entry must balance"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
