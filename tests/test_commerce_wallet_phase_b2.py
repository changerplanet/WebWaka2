"""
Commerce Wallet System Tests - Phase B Step 2
Tests for ledger-based wallet operations: Customer, Vendor, Platform wallets
with append-only ledger accounting.

Features tested:
- Create CUSTOMER, VENDOR, PLATFORM wallets
- Get wallet by ID with ledger entries
- List wallets for tenant with filters
- Credit wallet operations (CREDIT_SALE_PROCEEDS, CREDIT_PLATFORM_FEE, CREDIT_REFUND, CREDIT_ADJUSTMENT)
- Debit wallet operations (DEBIT_PAYOUT, DEBIT_PLATFORM_FEE)
- Idempotency for credit and debit operations
- Hold operations (HOLD_CREATED, HOLD_RELEASED, HOLD_CAPTURED)
- Transfer funds between wallets
- Insufficient balance errors
- Update wallet status
- Recalculate balance from ledger
- Get ledger entries with filters
"""

import pytest
import requests
import uuid
import os

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://site-funnels.preview.emergentagent.com').rstrip('/')

# Test tenant ID - unique per test run
TEST_TENANT_ID = f"test-wallet-tenant-{uuid.uuid4().hex[:8]}"


class TestWalletCreation:
    """Tests for wallet creation - CUSTOMER, VENDOR, PLATFORM types"""
    
    def test_create_customer_wallet(self):
        """Create a CUSTOMER wallet with customerId"""
        customer_id = f"cust-{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id,
            "currency": "USD",
            "metadata": {"source": "test"}
        })
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["wallet"]["type"] == "CUSTOMER"
        assert data["wallet"]["customerId"] == customer_id
        assert data["wallet"]["balance"] == 0
        assert data["wallet"]["pendingBalance"] == 0
        assert data["wallet"]["availableBalance"] == 0
        assert data["wallet"]["status"] == "ACTIVE"
        
        # Store for later tests
        self.__class__.customer_wallet_id = data["wallet"]["id"]
        self.__class__.customer_id = customer_id
        print(f"✓ Created CUSTOMER wallet: {data['wallet']['id']}")
    
    def test_create_vendor_wallet(self):
        """Create a VENDOR wallet with vendorId"""
        vendor_id = f"vendor-{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "VENDOR",
            "vendorId": vendor_id,
            "currency": "USD"
        })
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["wallet"]["type"] == "VENDOR"
        assert data["wallet"]["vendorId"] == vendor_id
        assert data["wallet"]["balance"] == 0
        
        self.__class__.vendor_wallet_id = data["wallet"]["id"]
        self.__class__.vendor_id = vendor_id
        print(f"✓ Created VENDOR wallet: {data['wallet']['id']}")
    
    def test_create_platform_wallet(self):
        """Create a PLATFORM wallet (no owner)"""
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "PLATFORM"
        })
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["wallet"]["type"] == "PLATFORM"
        assert data["wallet"]["customerId"] is None
        assert data["wallet"]["vendorId"] is None
        
        self.__class__.platform_wallet_id = data["wallet"]["id"]
        print(f"✓ Created PLATFORM wallet: {data['wallet']['id']}")
    
    def test_customer_wallet_requires_customer_id(self):
        """CUSTOMER wallet requires customerId"""
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "customerid" in data["error"].lower()  # Case-insensitive check
        print("✓ CUSTOMER wallet correctly requires customerId")
    
    def test_vendor_wallet_requires_vendor_id(self):
        """VENDOR wallet requires vendorId"""
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "VENDOR"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "vendorid" in data["error"].lower()  # Case-insensitive check
        print("✓ VENDOR wallet correctly requires vendorId")
    
    def test_platform_wallet_no_owner(self):
        """PLATFORM wallet should not have customerId or vendorId"""
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "PLATFORM",
            "customerId": "some-customer"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        print("✓ PLATFORM wallet correctly rejects customerId/vendorId")
    
    def test_get_or_create_returns_existing(self):
        """Getting same wallet params returns existing wallet (idempotent)"""
        # Create first
        customer_id = f"cust-idempotent-{uuid.uuid4().hex[:8]}"
        response1 = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        assert response1.status_code == 201
        wallet_id_1 = response1.json()["wallet"]["id"]
        
        # Create again with same params
        response2 = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        assert response2.status_code == 201
        wallet_id_2 = response2.json()["wallet"]["id"]
        
        # Should return same wallet
        assert wallet_id_1 == wallet_id_2
        print("✓ getOrCreate returns existing wallet (idempotent)")


class TestWalletRetrieval:
    """Tests for getting wallet by ID and listing wallets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test wallets if not already created"""
        if not hasattr(TestWalletCreation, 'customer_wallet_id'):
            TestWalletCreation().test_create_customer_wallet()
        if not hasattr(TestWalletCreation, 'vendor_wallet_id'):
            TestWalletCreation().test_create_vendor_wallet()
        if not hasattr(TestWalletCreation, 'platform_wallet_id'):
            TestWalletCreation().test_create_platform_wallet()
    
    def test_get_wallet_by_id(self):
        """Get wallet by ID with ledger entries"""
        wallet_id = TestWalletCreation.customer_wallet_id
        response = requests.get(
            f"{BASE_URL}/api/wallets/{wallet_id}",
            params={"tenantId": TEST_TENANT_ID, "includeLedger": "true"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["wallet"]["id"] == wallet_id
        assert "ledgerEntries" in data["wallet"]
        print(f"✓ Got wallet by ID with ledger entries")
    
    def test_get_wallet_without_ledger(self):
        """Get wallet by ID without ledger entries"""
        wallet_id = TestWalletCreation.customer_wallet_id
        response = requests.get(
            f"{BASE_URL}/api/wallets/{wallet_id}",
            params={"tenantId": TEST_TENANT_ID, "includeLedger": "false"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "ledgerEntries" not in data["wallet"]
        print("✓ Got wallet without ledger entries")
    
    def test_get_wallet_not_found(self):
        """Get non-existent wallet returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/wallets/non-existent-wallet-id",
            params={"tenantId": TEST_TENANT_ID}
        )
        
        assert response.status_code == 404
        print("✓ Non-existent wallet returns 404")
    
    def test_get_wallet_wrong_tenant(self):
        """Get wallet with wrong tenant returns 403"""
        wallet_id = TestWalletCreation.customer_wallet_id
        response = requests.get(
            f"{BASE_URL}/api/wallets/{wallet_id}",
            params={"tenantId": "wrong-tenant-id"}
        )
        
        assert response.status_code == 403
        print("✓ Wrong tenant returns 403")
    
    def test_list_wallets_for_tenant(self):
        """List all wallets for tenant"""
        response = requests.get(
            f"{BASE_URL}/api/wallets",
            params={"tenantId": TEST_TENANT_ID}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "wallets" in data
        assert "pagination" in data
        assert len(data["wallets"]) >= 3  # At least our 3 test wallets
        print(f"✓ Listed {len(data['wallets'])} wallets for tenant")
    
    def test_list_wallets_filter_by_type(self):
        """List wallets filtered by type"""
        response = requests.get(
            f"{BASE_URL}/api/wallets",
            params={"tenantId": TEST_TENANT_ID, "type": "VENDOR"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        for wallet in data["wallets"]:
            assert wallet["type"] == "VENDOR"
        print(f"✓ Listed {len(data['wallets'])} VENDOR wallets")
    
    def test_list_wallets_filter_by_customer_id(self):
        """List wallets filtered by customerId"""
        customer_id = TestWalletCreation.customer_id
        response = requests.get(
            f"{BASE_URL}/api/wallets",
            params={"tenantId": TEST_TENANT_ID, "customerId": customer_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["wallets"]) >= 1
        assert data["wallets"][0]["customerId"] == customer_id
        print("✓ Listed wallets filtered by customerId")


class TestCreditOperations:
    """Tests for crediting wallets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure test wallets exist"""
        if not hasattr(TestWalletCreation, 'vendor_wallet_id'):
            TestWalletCreation().test_create_vendor_wallet()
        if not hasattr(TestWalletCreation, 'platform_wallet_id'):
            TestWalletCreation().test_create_platform_wallet()
        if not hasattr(TestWalletCreation, 'customer_wallet_id'):
            TestWalletCreation().test_create_customer_wallet()
    
    def test_credit_sale_proceeds(self):
        """Credit wallet with CREDIT_SALE_PROCEEDS"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        idempotency_key = f"credit-sale-{uuid.uuid4().hex}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 100.00,
            "entryType": "CREDIT_SALE_PROCEEDS",
            "idempotencyKey": idempotency_key,
            "description": "Sale proceeds from order #123",
            "referenceType": "ORDER",
            "referenceId": "order-123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["isDuplicate"] is False
        assert data["wallet"]["balance"] == 100.00
        assert data["entry"]["entryType"] == "CREDIT_SALE_PROCEEDS"
        assert data["entry"]["amount"] == 100.00
        print("✓ Credited wallet with CREDIT_SALE_PROCEEDS")
    
    def test_credit_platform_fee(self):
        """Credit wallet with CREDIT_PLATFORM_FEE"""
        wallet_id = TestWalletCreation.platform_wallet_id
        idempotency_key = f"credit-fee-{uuid.uuid4().hex}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 15.00,
            "entryType": "CREDIT_PLATFORM_FEE",
            "idempotencyKey": idempotency_key,
            "description": "Platform fee from order #123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "CREDIT_PLATFORM_FEE"
        print("✓ Credited wallet with CREDIT_PLATFORM_FEE")
    
    def test_credit_refund(self):
        """Credit wallet with CREDIT_REFUND"""
        wallet_id = TestWalletCreation.customer_wallet_id
        idempotency_key = f"credit-refund-{uuid.uuid4().hex}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": idempotency_key,
            "description": "Refund for order #456"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "CREDIT_REFUND"
        print("✓ Credited wallet with CREDIT_REFUND")
    
    def test_credit_adjustment(self):
        """Credit wallet with CREDIT_ADJUSTMENT"""
        wallet_id = TestWalletCreation.customer_wallet_id
        idempotency_key = f"credit-adj-{uuid.uuid4().hex}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 25.00,
            "entryType": "CREDIT_ADJUSTMENT",
            "idempotencyKey": idempotency_key,
            "description": "Manual adjustment - customer goodwill"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "CREDIT_ADJUSTMENT"
        print("✓ Credited wallet with CREDIT_ADJUSTMENT")
    
    def test_credit_idempotency(self):
        """Duplicate credit request returns same result (idempotent)"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        idempotency_key = f"credit-idempotent-{uuid.uuid4().hex}"
        
        # First credit
        response1 = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_SALE_PROCEEDS",
            "idempotencyKey": idempotency_key
        })
        assert response1.status_code == 200
        balance_after_first = response1.json()["wallet"]["balance"]
        entry_id_1 = response1.json()["entry"]["id"]
        is_duplicate_1 = response1.json()["isDuplicate"]
        
        # Second credit with same idempotency key
        response2 = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_SALE_PROCEEDS",
            "idempotencyKey": idempotency_key
        })
        assert response2.status_code == 200
        balance_after_second = response2.json()["wallet"]["balance"]
        entry_id_2 = response2.json()["entry"]["id"]
        is_duplicate_2 = response2.json()["isDuplicate"]
        
        # Balance should not change, same entry returned
        assert balance_after_first == balance_after_second
        assert entry_id_1 == entry_id_2
        assert is_duplicate_1 is False
        assert is_duplicate_2 is True
        print("✓ Credit idempotency works correctly")
    
    def test_credit_requires_credit_entry_type(self):
        """Credit action requires CREDIT_* entry type"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "DEBIT_PAYOUT",  # Wrong type
            "idempotencyKey": f"wrong-type-{uuid.uuid4().hex}"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "credit" in data["error"].lower() or "entryType" in data["error"]
        print("✓ Credit correctly rejects non-CREDIT entry types")
    
    def test_credit_requires_positive_amount(self):
        """Credit requires positive amount"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": -50.00,
            "entryType": "CREDIT_SALE_PROCEEDS",
            "idempotencyKey": f"negative-{uuid.uuid4().hex}"
        })
        
        assert response.status_code == 400
        print("✓ Credit correctly rejects negative amount")


class TestDebitOperations:
    """Tests for debiting wallets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure test wallets exist and have balance"""
        if not hasattr(TestWalletCreation, 'vendor_wallet_id'):
            TestWalletCreation().test_create_vendor_wallet()
        
        # Add balance to vendor wallet for debit tests
        wallet_id = TestWalletCreation.vendor_wallet_id
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 500.00,
            "entryType": "CREDIT_SALE_PROCEEDS",
            "idempotencyKey": f"setup-balance-{uuid.uuid4().hex}"
        })
        if response.status_code == 200:
            self.__class__.vendor_balance = response.json()["wallet"]["balance"]
    
    def test_debit_payout(self):
        """Debit wallet with DEBIT_PAYOUT"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        idempotency_key = f"debit-payout-{uuid.uuid4().hex}"
        
        # Get current balance
        get_response = requests.get(
            f"{BASE_URL}/api/wallets/{wallet_id}",
            params={"tenantId": TEST_TENANT_ID}
        )
        current_balance = get_response.json()["wallet"]["balance"]
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "debit",
            "amount": 50.00,
            "entryType": "DEBIT_PAYOUT",
            "idempotencyKey": idempotency_key,
            "description": "Payout to bank account"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["wallet"]["balance"] == current_balance - 50.00
        assert data["entry"]["entryType"] == "DEBIT_PAYOUT"
        assert data["entry"]["amount"] == -50.00  # Negative for debits
        print("✓ Debited wallet with DEBIT_PAYOUT")
    
    def test_debit_platform_fee(self):
        """Debit wallet with DEBIT_PLATFORM_FEE"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        idempotency_key = f"debit-fee-{uuid.uuid4().hex}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "debit",
            "amount": 10.00,
            "entryType": "DEBIT_PLATFORM_FEE",
            "idempotencyKey": idempotency_key,
            "description": "Platform fee deduction"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "DEBIT_PLATFORM_FEE"
        print("✓ Debited wallet with DEBIT_PLATFORM_FEE")
    
    def test_debit_idempotency(self):
        """Duplicate debit request returns same result (idempotent)"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        idempotency_key = f"debit-idempotent-{uuid.uuid4().hex}"
        
        # First debit
        response1 = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "debit",
            "amount": 20.00,
            "entryType": "DEBIT_PAYOUT",
            "idempotencyKey": idempotency_key
        })
        assert response1.status_code == 200
        balance_after_first = response1.json()["wallet"]["balance"]
        is_duplicate_1 = response1.json()["isDuplicate"]
        
        # Second debit with same idempotency key
        response2 = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "debit",
            "amount": 20.00,
            "entryType": "DEBIT_PAYOUT",
            "idempotencyKey": idempotency_key
        })
        assert response2.status_code == 200
        balance_after_second = response2.json()["wallet"]["balance"]
        is_duplicate_2 = response2.json()["isDuplicate"]
        
        # Balance should not change
        assert balance_after_first == balance_after_second
        assert is_duplicate_1 is False
        assert is_duplicate_2 is True
        print("✓ Debit idempotency works correctly")
    
    def test_debit_insufficient_balance(self):
        """Debit fails with insufficient balance"""
        # Create a new wallet with zero balance
        customer_id = f"cust-zero-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        wallet_id = create_response.json()["wallet"]["id"]
        
        # Try to debit more than balance
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "debit",
            "amount": 100.00,
            "entryType": "DEBIT_PAYOUT",
            "idempotencyKey": f"insufficient-{uuid.uuid4().hex}"
        })
        
        # API returns 500 or 520 for internal errors
        assert response.status_code in [500, 520], f"Expected 500/520, got {response.status_code}"
        data = response.json()
        assert data["success"] is False
        assert "insufficient" in data["error"].lower()
        print("✓ Debit correctly fails with insufficient balance")
    
    def test_debit_requires_debit_entry_type(self):
        """Debit action requires DEBIT_* entry type"""
        wallet_id = TestWalletCreation.vendor_wallet_id
        
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "debit",
            "amount": 10.00,
            "entryType": "CREDIT_REFUND",  # Wrong type
            "idempotencyKey": f"wrong-debit-type-{uuid.uuid4().hex}"
        })
        
        assert response.status_code == 400
        print("✓ Debit correctly rejects non-DEBIT entry types")


class TestHoldOperations:
    """Tests for hold operations (HOLD_CREATED, HOLD_RELEASED, HOLD_CAPTURED)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a wallet with balance for hold tests"""
        customer_id = f"cust-hold-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        self.wallet_id = create_response.json()["wallet"]["id"]
        
        # Add balance
        requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 200.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": f"hold-setup-{uuid.uuid4().hex}"
        })
    
    def test_create_hold(self):
        """Create a hold on wallet funds"""
        hold_id = f"hold-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "hold",
            "amount": 50.00,
            "holdId": hold_id,
            "description": "Hold for pending order"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "HOLD_CREATED"
        # Balance stays same, but available balance decreases
        assert data["wallet"]["balance"] == 200.00
        assert data["wallet"]["pendingBalance"] == 50.00
        assert data["wallet"]["availableBalance"] == 150.00
        
        self.__class__.hold_id = hold_id
        print("✓ Created hold on wallet funds")
    
    def test_release_hold(self):
        """Release a hold back to available balance"""
        # First create a hold
        hold_id = f"hold-release-{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "hold",
            "amount": 30.00,
            "holdId": hold_id
        })
        
        # Get balance after hold
        get_response = requests.get(
            f"{BASE_URL}/api/wallets/{self.wallet_id}",
            params={"tenantId": TEST_TENANT_ID}
        )
        pending_after_hold = get_response.json()["wallet"]["pendingBalance"]
        
        # Release the hold
        response = requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "release",
            "amount": 30.00,
            "holdId": hold_id,
            "description": "Order cancelled, releasing hold"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "HOLD_RELEASED"
        # Pending balance should decrease
        assert data["wallet"]["pendingBalance"] == pending_after_hold - 30.00
        print("✓ Released hold back to available balance")
    
    def test_capture_hold(self):
        """Capture a hold (convert to actual debit)"""
        # First create a hold
        hold_id = f"hold-capture-{uuid.uuid4().hex[:8]}"
        hold_response = requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "hold",
            "amount": 40.00,
            "holdId": hold_id
        })
        balance_after_hold = hold_response.json()["wallet"]["balance"]
        
        # Capture the hold
        response = requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "capture",
            "amount": 40.00,
            "holdId": hold_id,
            "description": "Order completed, capturing hold"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["entry"]["entryType"] == "HOLD_CAPTURED"
        # Balance should decrease, pending should decrease
        assert data["wallet"]["balance"] == balance_after_hold - 40.00
        print("✓ Captured hold (converted to debit)")
    
    def test_hold_insufficient_available_balance(self):
        """Hold fails with insufficient available balance"""
        # Create wallet with small balance
        customer_id = f"cust-small-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        wallet_id = create_response.json()["wallet"]["id"]
        
        # Add small balance
        requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 20.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": f"small-balance-{uuid.uuid4().hex}"
        })
        
        # Try to hold more than available
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "hold",
            "amount": 100.00,
            "holdId": f"hold-fail-{uuid.uuid4().hex[:8]}"
        })
        
        # API returns 500 or 520 for internal errors
        assert response.status_code in [500, 520], f"Expected 500/520, got {response.status_code}"
        data = response.json()
        assert data["success"] is False
        assert "insufficient" in data["error"].lower()
        print("✓ Hold correctly fails with insufficient available balance")
    
    def test_hold_requires_hold_id(self):
        """Hold action requires holdId"""
        response = requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "hold",
            "amount": 10.00
            # Missing holdId
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "holdId" in data["error"]
        print("✓ Hold correctly requires holdId")


class TestTransferOperations:
    """Tests for transferring funds between wallets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create two wallets for transfer tests"""
        # Source wallet with balance
        customer_id_1 = f"cust-src-{uuid.uuid4().hex[:8]}"
        create_response_1 = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id_1
        })
        self.source_wallet_id = create_response_1.json()["wallet"]["id"]
        
        # Add balance to source
        requests.post(f"{BASE_URL}/api/wallets/{self.source_wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 300.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": f"transfer-setup-{uuid.uuid4().hex}"
        })
        
        # Destination wallet
        customer_id_2 = f"cust-dst-{uuid.uuid4().hex[:8]}"
        create_response_2 = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id_2
        })
        self.dest_wallet_id = create_response_2.json()["wallet"]["id"]
    
    def test_transfer_funds(self):
        """Transfer funds between wallets"""
        idempotency_key = f"transfer-{uuid.uuid4().hex}"
        
        response = requests.post(f"{BASE_URL}/api/wallets/transfer", json={
            "tenantId": TEST_TENANT_ID,
            "fromWalletId": self.source_wallet_id,
            "toWalletId": self.dest_wallet_id,
            "amount": 100.00,
            "idempotencyKey": idempotency_key,
            "description": "Transfer between customers"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["isDuplicate"] is False
        assert data["fromWallet"]["balance"] == 200.00  # 300 - 100
        assert data["toWallet"]["balance"] == 100.00
        print("✓ Transferred funds between wallets")
    
    def test_transfer_idempotency(self):
        """Duplicate transfer returns same result"""
        idempotency_key = f"transfer-idem-{uuid.uuid4().hex}"
        
        # First transfer
        response1 = requests.post(f"{BASE_URL}/api/wallets/transfer", json={
            "tenantId": TEST_TENANT_ID,
            "fromWalletId": self.source_wallet_id,
            "toWalletId": self.dest_wallet_id,
            "amount": 25.00,
            "idempotencyKey": idempotency_key
        })
        assert response1.status_code == 200
        from_balance_1 = response1.json()["fromWallet"]["balance"]
        
        # Second transfer with same key
        response2 = requests.post(f"{BASE_URL}/api/wallets/transfer", json={
            "tenantId": TEST_TENANT_ID,
            "fromWalletId": self.source_wallet_id,
            "toWalletId": self.dest_wallet_id,
            "amount": 25.00,
            "idempotencyKey": idempotency_key
        })
        assert response2.status_code == 200
        from_balance_2 = response2.json()["fromWallet"]["balance"]
        is_duplicate = response2.json()["isDuplicate"]
        
        assert from_balance_1 == from_balance_2
        assert is_duplicate is True
        print("✓ Transfer idempotency works correctly")
    
    def test_transfer_insufficient_balance(self):
        """Transfer fails with insufficient balance"""
        # Create wallet with no balance
        customer_id = f"cust-empty-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        empty_wallet_id = create_response.json()["wallet"]["id"]
        
        response = requests.post(f"{BASE_URL}/api/wallets/transfer", json={
            "tenantId": TEST_TENANT_ID,
            "fromWalletId": empty_wallet_id,
            "toWalletId": self.dest_wallet_id,
            "amount": 100.00,
            "idempotencyKey": f"transfer-fail-{uuid.uuid4().hex}"
        })
        
        # API returns 500 or 520 for internal errors
        assert response.status_code in [500, 520], f"Expected 500/520, got {response.status_code}"
        data = response.json()
        assert data["success"] is False
        assert "insufficient" in data["error"].lower()
        print("✓ Transfer correctly fails with insufficient balance")
    
    def test_transfer_same_wallet_fails(self):
        """Cannot transfer to same wallet"""
        response = requests.post(f"{BASE_URL}/api/wallets/transfer", json={
            "tenantId": TEST_TENANT_ID,
            "fromWalletId": self.source_wallet_id,
            "toWalletId": self.source_wallet_id,
            "amount": 10.00,
            "idempotencyKey": f"transfer-same-{uuid.uuid4().hex}"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        print("✓ Transfer to same wallet correctly fails")


class TestWalletStatusUpdate:
    """Tests for updating wallet status"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a wallet for status tests"""
        customer_id = f"cust-status-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        self.wallet_id = create_response.json()["wallet"]["id"]
    
    def test_update_status_to_frozen(self):
        """Update wallet status to FROZEN"""
        response = requests.put(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "FROZEN"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["wallet"]["status"] == "FROZEN"
        print("✓ Updated wallet status to FROZEN")
    
    def test_update_status_back_to_active(self):
        """Update wallet status back to ACTIVE"""
        # First freeze
        requests.put(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "FROZEN"
        })
        
        # Then activate
        response = requests.put(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "ACTIVE"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["wallet"]["status"] == "ACTIVE"
        print("✓ Updated wallet status back to ACTIVE")
    
    def test_frozen_wallet_cannot_credit(self):
        """Frozen wallet cannot be credited"""
        # Freeze wallet
        requests.put(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "FROZEN"
        })
        
        # Try to credit
        response = requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": f"frozen-credit-{uuid.uuid4().hex}"
        })
        
        # API returns 500 or 520 for internal errors
        assert response.status_code in [500, 520], f"Expected 500/520, got {response.status_code}"
        data = response.json()
        assert data["success"] is False
        assert "not active" in data["error"].lower()
        print("✓ Frozen wallet correctly rejects credit operations")
    
    def test_invalid_status_rejected(self):
        """Invalid status is rejected"""
        response = requests.put(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "status": "INVALID_STATUS"
        })
        
        assert response.status_code == 400
        print("✓ Invalid status correctly rejected")


class TestRecalculateBalance:
    """Tests for recalculating balance from ledger"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a wallet with transactions"""
        customer_id = f"cust-recalc-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        self.wallet_id = create_response.json()["wallet"]["id"]
        
        # Add some transactions
        requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 100.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": f"recalc-1-{uuid.uuid4().hex}"
        })
        requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_ADJUSTMENT",
            "idempotencyKey": f"recalc-2-{uuid.uuid4().hex}"
        })
    
    def test_recalculate_balance(self):
        """Recalculate balance from ledger entries"""
        response = requests.put(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "recalculate": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert "reconciliation" in data
        assert data["reconciliation"]["calculatedBalance"] == 150.00
        assert data["reconciliation"]["entryCount"] >= 2
        print("✓ Recalculated balance from ledger")


class TestLedgerEntries:
    """Tests for getting ledger entries with filters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a wallet with various transactions"""
        customer_id = f"cust-ledger-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "CUSTOMER",
            "customerId": customer_id
        })
        self.wallet_id = create_response.json()["wallet"]["id"]
        
        # Add various transactions
        requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 100.00,
            "entryType": "CREDIT_REFUND",
            "idempotencyKey": f"ledger-1-{uuid.uuid4().hex}",
            "referenceType": "ORDER",
            "referenceId": "order-001"
        })
        requests.post(f"{BASE_URL}/api/wallets/{self.wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_ADJUSTMENT",
            "idempotencyKey": f"ledger-2-{uuid.uuid4().hex}",
            "referenceType": "ADJUSTMENT",
            "referenceId": "adj-001"
        })
    
    def test_get_ledger_entries(self):
        """Get all ledger entries for wallet"""
        response = requests.get(
            f"{BASE_URL}/api/wallets/{self.wallet_id}/ledger",
            params={"tenantId": TEST_TENANT_ID}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert "entries" in data
        assert len(data["entries"]) >= 2
        assert "pagination" in data
        print(f"✓ Got {len(data['entries'])} ledger entries")
    
    def test_filter_by_entry_type(self):
        """Filter ledger entries by entryType"""
        response = requests.get(
            f"{BASE_URL}/api/wallets/{self.wallet_id}/ledger",
            params={"tenantId": TEST_TENANT_ID, "entryType": "CREDIT_REFUND"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        for entry in data["entries"]:
            assert entry["entryType"] == "CREDIT_REFUND"
        print("✓ Filtered ledger entries by entryType")
    
    def test_filter_by_reference_type(self):
        """Filter ledger entries by referenceType"""
        response = requests.get(
            f"{BASE_URL}/api/wallets/{self.wallet_id}/ledger",
            params={"tenantId": TEST_TENANT_ID, "referenceType": "ORDER"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        for entry in data["entries"]:
            assert entry["referenceType"] == "ORDER"
        print("✓ Filtered ledger entries by referenceType")
    
    def test_ledger_pagination(self):
        """Test ledger entries pagination"""
        response = requests.get(
            f"{BASE_URL}/api/wallets/{self.wallet_id}/ledger",
            params={"tenantId": TEST_TENANT_ID, "limit": 1, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["entries"]) <= 1
        assert data["pagination"]["limit"] == 1
        print("✓ Ledger pagination works correctly")


class TestValidationAndEdgeCases:
    """Tests for validation and edge cases"""
    
    def test_missing_tenant_id(self):
        """All endpoints require tenantId"""
        # List wallets
        response = requests.get(f"{BASE_URL}/api/wallets")
        assert response.status_code == 400
        
        # Create wallet
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "type": "CUSTOMER",
            "customerId": "test"
        })
        assert response.status_code == 400
        print("✓ Missing tenantId correctly rejected")
    
    def test_invalid_wallet_type(self):
        """Invalid wallet type is rejected"""
        response = requests.post(f"{BASE_URL}/api/wallets", json={
            "tenantId": TEST_TENANT_ID,
            "type": "INVALID_TYPE"
        })
        
        assert response.status_code == 400
        print("✓ Invalid wallet type correctly rejected")
    
    def test_missing_action(self):
        """Wallet operation requires action"""
        if not hasattr(TestWalletCreation, 'customer_wallet_id'):
            TestWalletCreation().test_create_customer_wallet()
        
        wallet_id = TestWalletCreation.customer_wallet_id
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "amount": 50.00
            # Missing action
        })
        
        assert response.status_code == 400
        print("✓ Missing action correctly rejected")
    
    def test_missing_idempotency_key(self):
        """Credit/debit requires idempotencyKey"""
        if not hasattr(TestWalletCreation, 'customer_wallet_id'):
            TestWalletCreation().test_create_customer_wallet()
        
        wallet_id = TestWalletCreation.customer_wallet_id
        response = requests.post(f"{BASE_URL}/api/wallets/{wallet_id}", json={
            "tenantId": TEST_TENANT_ID,
            "action": "credit",
            "amount": 50.00,
            "entryType": "CREDIT_REFUND"
            # Missing idempotencyKey
        })
        
        assert response.status_code == 400
        print("✓ Missing idempotencyKey correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
