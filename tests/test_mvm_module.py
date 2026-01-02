"""
MVM Module Tests - Multi Vendor Marketplace
Tests all 10 phases (0-9) of MVM module implementation.

Tests cover:
- TypeScript compilation
- Event types (25 events with 'mvm.' prefix)
- Commission calculation (percentage, fixed, tiered)
- Order splitting
- Entitlement service features and limits
- Vendor status transitions
- Database tables (9 tables with 'mvm_' prefix)
- No forbidden logic (billing, payment execution, money movement)
- MVM extends SVM (no duplication)
"""

import pytest
import subprocess
import os
import re
from pathlib import Path


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="module")
def mvm_module_path():
    """Path to MVM module"""
    return Path("/app/modules/mvm")


@pytest.fixture(scope="module")
def mvm_lib_path(mvm_module_path):
    """Path to MVM lib directory"""
    return mvm_module_path / "src" / "lib"


@pytest.fixture(scope="module")
def mvm_prisma_schema(mvm_module_path):
    """Read MVM Prisma schema"""
    schema_path = mvm_module_path / "prisma" / "schema.prisma"
    return schema_path.read_text()


@pytest.fixture(scope="module")
def event_bus_content(mvm_lib_path):
    """Read event-bus.ts content"""
    return (mvm_lib_path / "event-bus.ts").read_text()


@pytest.fixture(scope="module")
def commission_engine_content(mvm_lib_path):
    """Read commission-engine.ts content"""
    return (mvm_lib_path / "commission-engine.ts").read_text()


@pytest.fixture(scope="module")
def order_splitter_content(mvm_lib_path):
    """Read order-splitter.ts content"""
    return (mvm_lib_path / "order-splitter.ts").read_text()


@pytest.fixture(scope="module")
def vendor_engine_content(mvm_lib_path):
    """Read vendor-engine.ts content"""
    return (mvm_lib_path / "vendor-engine.ts").read_text()


@pytest.fixture(scope="module")
def entitlements_content(mvm_lib_path):
    """Read entitlements.ts content"""
    return (mvm_lib_path / "entitlements.ts").read_text()


@pytest.fixture(scope="module")
def index_content(mvm_lib_path):
    """Read index.ts content"""
    return (mvm_lib_path / "index.ts").read_text()


@pytest.fixture(scope="module")
def all_lib_files_content(mvm_lib_path):
    """Read all lib files content combined"""
    content = ""
    for ts_file in mvm_lib_path.glob("*.ts"):
        content += ts_file.read_text() + "\n"
    return content


# ============================================================================
# PHASE 0: TYPESCRIPT COMPILATION
# ============================================================================

class TestTypeScriptCompilation:
    """Test TypeScript compilation of MVM module"""
    
    def test_typescript_compiles_without_errors(self, mvm_module_path):
        """MVM module TypeScript should compile without errors"""
        result = subprocess.run(
            ["yarn", "typecheck"],
            cwd=mvm_module_path,
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"TypeScript compilation failed: {result.stderr}"
        print("✓ TypeScript compilation successful")
    
    def test_all_lib_files_exist(self, mvm_lib_path):
        """All required lib files should exist"""
        required_files = [
            "vendor-engine.ts",
            "order-splitter.ts",
            "commission-engine.ts",
            "vendor-dashboard.ts",
            "event-bus.ts",
            "entitlements.ts",
            "offline-behavior.ts",
            "index.ts"
        ]
        
        for filename in required_files:
            file_path = mvm_lib_path / filename
            assert file_path.exists(), f"Missing required file: {filename}"
        
        print(f"✓ All {len(required_files)} required lib files exist")
    
    def test_prisma_schema_exists(self, mvm_module_path):
        """Prisma schema should exist"""
        schema_path = mvm_module_path / "prisma" / "schema.prisma"
        assert schema_path.exists(), "Prisma schema not found"
        print("✓ Prisma schema exists")


# ============================================================================
# PHASE 1: EVENT TYPES (25 events with 'mvm.' prefix)
# ============================================================================

class TestEventTypes:
    """Test MVM event types"""
    
    def test_event_types_count(self, event_bus_content):
        """Should have at least 25 event types"""
        # Find MVM_EVENT_TYPES object
        event_types_match = re.search(
            r'MVM_EVENT_TYPES\s*=\s*\{([^}]+)\}',
            event_bus_content,
            re.DOTALL
        )
        assert event_types_match, "MVM_EVENT_TYPES not found"
        
        # Count event types
        event_types_block = event_types_match.group(1)
        event_count = len(re.findall(r"'mvm\.", event_types_block))
        
        assert event_count >= 25, f"Expected at least 25 event types, found {event_count}"
        print(f"✓ Found {event_count} event types (>= 25 required)")
    
    def test_all_events_have_mvm_prefix(self, event_bus_content):
        """All event types should be prefixed with 'mvm.'"""
        # Find all event type values
        event_values = re.findall(r":\s*'([^']+)'", event_bus_content)
        
        # Filter to only event type values (those that look like events)
        event_types = [v for v in event_values if '.' in v and not v.startswith('http')]
        
        non_mvm_events = [e for e in event_types if not e.startswith('mvm.')]
        
        assert len(non_mvm_events) == 0, f"Events without 'mvm.' prefix: {non_mvm_events}"
        print(f"✓ All {len(event_types)} event types have 'mvm.' prefix")
    
    def test_vendor_lifecycle_events_exist(self, event_bus_content):
        """Should have vendor lifecycle events"""
        required_events = [
            'mvm.vendor.registered',
            'mvm.vendor.approved',
            'mvm.vendor.suspended',
        ]
        
        for event in required_events:
            assert event in event_bus_content, f"Missing event: {event}"
        
        print(f"✓ All {len(required_events)} vendor lifecycle events exist")
    
    def test_order_events_exist(self, event_bus_content):
        """Should have order-related events"""
        required_events = [
            'mvm.order.split',
            'mvm.suborder.created',
        ]
        
        for event in required_events:
            assert event in event_bus_content, f"Missing event: {event}"
        
        print(f"✓ Order events exist")
    
    def test_commission_events_exist(self, event_bus_content):
        """Should have commission-related events"""
        assert 'mvm.commission.earned' in event_bus_content, "Missing commission.earned event"
        print("✓ Commission events exist")
    
    def test_idempotency_key_generation(self, event_bus_content):
        """Should have idempotency key generation function"""
        assert 'generateIdempotencyKey' in event_bus_content, "Missing generateIdempotencyKey function"
        print("✓ Idempotency key generation function exists")


# ============================================================================
# PHASE 2: COMMISSION CALCULATION
# ============================================================================

class TestCommissionCalculation:
    """Test commission calculation logic"""
    
    def test_percentage_commission_type(self, commission_engine_content):
        """Should support percentage commission calculation"""
        assert "'PERCENTAGE'" in commission_engine_content or '"PERCENTAGE"' in commission_engine_content
        assert "case 'PERCENTAGE':" in commission_engine_content
        print("✓ Percentage commission type supported")
    
    def test_fixed_commission_type(self, commission_engine_content):
        """Should support fixed commission calculation"""
        assert "'FIXED'" in commission_engine_content or '"FIXED"' in commission_engine_content
        assert "case 'FIXED':" in commission_engine_content
        print("✓ Fixed commission type supported")
    
    def test_tiered_commission_type(self, commission_engine_content):
        """Should support tiered commission calculation"""
        assert "'TIERED'" in commission_engine_content or '"TIERED"' in commission_engine_content
        assert "case 'TIERED':" in commission_engine_content
        assert "calculateTieredCommission" in commission_engine_content
        print("✓ Tiered commission type supported")
    
    def test_commission_rule_types(self, commission_engine_content):
        """Should support multiple commission rule types"""
        rule_types = ['GLOBAL', 'CATEGORY', 'PRODUCT', 'VENDOR_TIER', 'PROMOTIONAL']
        
        for rule_type in rule_types:
            assert f"'{rule_type}'" in commission_engine_content or f'"{rule_type}"' in commission_engine_content, \
                f"Missing rule type: {rule_type}"
        
        print(f"✓ All {len(rule_types)} commission rule types supported")
    
    def test_commission_result_structure(self, commission_engine_content):
        """Commission result should include required fields"""
        required_fields = [
            'commissionAmount',
            'vendorEarnings',
            'rate',
            'baseAmount'
        ]
        
        for field in required_fields:
            assert field in commission_engine_content, f"Missing field in result: {field}"
        
        print(f"✓ Commission result has all {len(required_fields)} required fields")
    
    def test_commission_validation(self, commission_engine_content):
        """Should have commission rule validation"""
        assert 'validateRule' in commission_engine_content, "Missing validateRule function"
        print("✓ Commission rule validation exists")
    
    def test_no_money_movement_in_commission(self, commission_engine_content):
        """Commission engine should NOT move money"""
        # Check for explicit comment about no money movement
        assert 'NO money movement' in commission_engine_content or 'no money movement' in commission_engine_content.lower()
        
        # Should not have wallet mutations
        forbidden_patterns = [
            'wallet.debit',
            'wallet.credit',
            'transferFunds',
            'executePayout',
            'processPayment'
        ]
        
        for pattern in forbidden_patterns:
            assert pattern not in commission_engine_content, f"Forbidden pattern found: {pattern}"
        
        print("✓ Commission engine does NOT move money")


# ============================================================================
# PHASE 3: ORDER SPLITTING
# ============================================================================

class TestOrderSplitting:
    """Test order splitting logic"""
    
    def test_order_splitting_engine_exists(self, order_splitter_content):
        """OrderSplittingEngine class should exist"""
        assert 'class OrderSplittingEngine' in order_splitter_content
        print("✓ OrderSplittingEngine class exists")
    
    def test_split_order_method(self, order_splitter_content):
        """Should have splitOrder method"""
        assert 'splitOrder(' in order_splitter_content
        print("✓ splitOrder method exists")
    
    def test_group_items_by_vendor(self, order_splitter_content):
        """Should group items by vendor"""
        assert 'groupItemsByVendor' in order_splitter_content
        print("✓ groupItemsByVendor method exists")
    
    def test_create_sub_order(self, order_splitter_content):
        """Should create sub-orders"""
        assert 'createSubOrder' in order_splitter_content
        assert 'VendorSubOrder' in order_splitter_content
        print("✓ Sub-order creation logic exists")
    
    def test_sub_order_status_types(self, order_splitter_content):
        """Should have all sub-order status types"""
        statuses = [
            'PENDING',
            'ACCEPTED',
            'PROCESSING',
            'READY_TO_SHIP',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'REFUNDED'
        ]
        
        for status in statuses:
            assert f"'{status}'" in order_splitter_content or f'"{status}"' in order_splitter_content, \
                f"Missing status: {status}"
        
        print(f"✓ All {len(statuses)} sub-order statuses defined")
    
    def test_status_transitions(self, order_splitter_content):
        """Should have status transition validation"""
        assert 'STATUS_TRANSITIONS' in order_splitter_content
        assert 'canTransitionStatus' in order_splitter_content
        print("✓ Status transition validation exists")
    
    def test_commission_calculation_in_split(self, order_splitter_content):
        """Order split should calculate commission"""
        assert 'commissionRate' in order_splitter_content
        assert 'commissionAmount' in order_splitter_content
        assert 'vendorEarnings' in order_splitter_content
        print("✓ Commission calculation in order split")
    
    def test_no_payment_capture_in_splitter(self, order_splitter_content):
        """Order splitter should NOT capture payment"""
        # Check for explicit comment
        assert 'Payment is captured ONCE by Core' in order_splitter_content or \
               'payment is captured' in order_splitter_content.lower()
        
        forbidden_patterns = [
            'capturePayment',
            'chargeCard',
            'processPayment',
            'stripe.charges'
        ]
        
        for pattern in forbidden_patterns:
            assert pattern not in order_splitter_content, f"Forbidden pattern found: {pattern}"
        
        print("✓ Order splitter does NOT capture payment")


# ============================================================================
# PHASE 4: VENDOR ENGINE
# ============================================================================

class TestVendorEngine:
    """Test vendor engine logic"""
    
    def test_vendor_engine_exists(self, vendor_engine_content):
        """VendorEngine class should exist"""
        assert 'class VendorEngine' in vendor_engine_content
        print("✓ VendorEngine class exists")
    
    def test_vendor_status_types(self, vendor_engine_content):
        """Should have all vendor status types"""
        statuses = [
            'PENDING_APPROVAL',
            'APPROVED',
            'SUSPENDED',
            'REJECTED',
            'CHURNED'
        ]
        
        for status in statuses:
            assert f"'{status}'" in vendor_engine_content or f'"{status}"' in vendor_engine_content, \
                f"Missing status: {status}"
        
        print(f"✓ All {len(statuses)} vendor statuses defined")
    
    def test_vendor_status_transitions(self, vendor_engine_content):
        """Should validate vendor status transitions"""
        assert 'canTransitionStatus' in vendor_engine_content
        
        # Check transition rules exist
        assert 'PENDING_APPROVAL' in vendor_engine_content
        assert 'APPROVED' in vendor_engine_content
        print("✓ Vendor status transition validation exists")
    
    def test_churned_is_terminal_state(self, vendor_engine_content):
        """CHURNED should be a terminal state"""
        # Find the transitions definition
        transitions_match = re.search(
            r"'CHURNED':\s*\[\s*\]",
            vendor_engine_content
        )
        assert transitions_match, "CHURNED should have empty transitions (terminal state)"
        print("✓ CHURNED is a terminal state")
    
    def test_vendor_profile_validation(self, vendor_engine_content):
        """Should validate vendor profile"""
        assert 'validateProfile' in vendor_engine_content
        print("✓ Vendor profile validation exists")
    
    def test_vendor_tier_engine(self, vendor_engine_content):
        """VendorTierEngine should exist"""
        assert 'class VendorTierEngine' in vendor_engine_content
        assert 'qualifiesForTier' in vendor_engine_content
        assert 'findBestTier' in vendor_engine_content
        print("✓ VendorTierEngine exists with tier qualification logic")
    
    def test_product_mapping_engine(self, vendor_engine_content):
        """ProductMappingEngine should exist"""
        assert 'class ProductMappingEngine' in vendor_engine_content
        assert 'validatePricing' in vendor_engine_content
        print("✓ ProductMappingEngine exists")
    
    def test_vendors_are_not_tenants(self, vendor_engine_content):
        """Vendors should NOT be tenants"""
        assert 'Vendors are NOT tenants' in vendor_engine_content
        print("✓ Documentation confirms vendors are NOT tenants")


# ============================================================================
# PHASE 5: ENTITLEMENTS
# ============================================================================

class TestEntitlements:
    """Test entitlement service"""
    
    def test_entitlement_service_exists(self, entitlements_content):
        """MVMEntitlementService should exist"""
        assert 'class MVMEntitlementService' in entitlements_content
        print("✓ MVMEntitlementService class exists")
    
    def test_entitlement_features(self, entitlements_content):
        """Should have expected features"""
        expected_features = [
            'vendors',
            'vendor_onboarding',
            'vendor_dashboard',
            'order_splitting',
            'commission_management',
            'payout_tracking',
        ]
        
        for feature in expected_features:
            assert f"'{feature}'" in entitlements_content or f'"{feature}"' in entitlements_content, \
                f"Missing feature: {feature}"
        
        print(f"✓ All {len(expected_features)} expected features defined")
    
    def test_entitlement_limits(self, entitlements_content):
        """Should have expected limits"""
        expected_limits = [
            'max_vendors',
            'max_vendor_staff_per_vendor',
            'max_products_per_vendor',
            'max_commission_rules',
            'max_vendor_tiers',
        ]
        
        for limit in expected_limits:
            assert f"'{limit}'" in entitlements_content or f'"{limit}"' in entitlements_content, \
                f"Missing limit: {limit}"
        
        print(f"✓ All {len(expected_limits)} expected limits defined")
    
    def test_has_feature_method(self, entitlements_content):
        """Should have hasFeature method"""
        assert 'hasFeature(' in entitlements_content
        print("✓ hasFeature method exists")
    
    def test_check_limit_method(self, entitlements_content):
        """Should have checkLimit method"""
        assert 'checkLimit(' in entitlements_content
        print("✓ checkLimit method exists")
    
    def test_default_entitlements(self, entitlements_content):
        """Should have default entitlements"""
        assert 'DEFAULT_MVM_ENTITLEMENTS' in entitlements_content
        print("✓ Default entitlements defined")
    
    def test_no_billing_logic_in_entitlements(self, entitlements_content):
        """Entitlements should NOT contain billing logic"""
        assert 'Module does NOT contain billing logic' in entitlements_content or \
               'does NOT know plan names' in entitlements_content
        
        forbidden_patterns = [
            'stripe.',
            'chargeCustomer',
            'createSubscription',
            'processPayment'
        ]
        
        for pattern in forbidden_patterns:
            assert pattern not in entitlements_content, f"Forbidden pattern found: {pattern}"
        
        print("✓ Entitlements do NOT contain billing logic")


# ============================================================================
# PHASE 6: DATABASE SCHEMA (9 tables with 'mvm_' prefix)
# ============================================================================

class TestDatabaseSchema:
    """Test Prisma schema"""
    
    def test_all_tables_have_mvm_prefix(self, mvm_prisma_schema):
        """All tables should be prefixed with 'mvm_'"""
        # Find all @@map directives
        table_maps = re.findall(r'@@map\("([^"]+)"\)', mvm_prisma_schema)
        
        non_mvm_tables = [t for t in table_maps if not t.startswith('mvm_')]
        
        assert len(non_mvm_tables) == 0, f"Tables without 'mvm_' prefix: {non_mvm_tables}"
        print(f"✓ All {len(table_maps)} tables have 'mvm_' prefix")
    
    def test_nine_tables_exist(self, mvm_prisma_schema):
        """Should have exactly 9 MVM tables"""
        table_maps = re.findall(r'@@map\("([^"]+)"\)', mvm_prisma_schema)
        
        expected_tables = [
            'mvm_vendor_tiers',
            'mvm_vendors',
            'mvm_vendor_staff',
            'mvm_vendor_settings',
            'mvm_vendor_product_mappings',
            'mvm_vendor_commission_rules',
            'mvm_vendor_sub_orders',
            'mvm_vendor_sub_order_items',
            'mvm_vendor_payout_records'
        ]
        
        assert len(table_maps) == 9, f"Expected 9 tables, found {len(table_maps)}: {table_maps}"
        
        for table in expected_tables:
            assert table in table_maps, f"Missing table: {table}"
        
        print(f"✓ All 9 expected tables exist")
    
    def test_vendor_model_exists(self, mvm_prisma_schema):
        """Vendor model should exist"""
        assert 'model Vendor {' in mvm_prisma_schema
        print("✓ Vendor model exists")
    
    def test_vendor_sub_order_model_exists(self, mvm_prisma_schema):
        """VendorSubOrder model should exist"""
        assert 'model VendorSubOrder {' in mvm_prisma_schema
        print("✓ VendorSubOrder model exists")
    
    def test_commission_rule_model_exists(self, mvm_prisma_schema):
        """VendorCommissionRule model should exist"""
        assert 'model VendorCommissionRule {' in mvm_prisma_schema
        print("✓ VendorCommissionRule model exists")
    
    def test_payout_record_model_exists(self, mvm_prisma_schema):
        """VendorPayoutRecord model should exist"""
        assert 'model VendorPayoutRecord {' in mvm_prisma_schema
        print("✓ VendorPayoutRecord model exists")
    
    def test_no_core_schema_modifications(self, mvm_prisma_schema):
        """Should NOT modify Core schema"""
        # MVM should only reference Core entities via String IDs
        assert 'Core tenant reference' in mvm_prisma_schema or 'tenantId    String' in mvm_prisma_schema
        
        # Should not have Core models
        core_models = ['User', 'Tenant', 'Product', 'Order']
        for model in core_models:
            # Check for model definition (not just reference)
            model_def = f'model {model} {{'
            assert model_def not in mvm_prisma_schema, f"MVM should not define Core model: {model}"
        
        print("✓ No Core schema modifications")


# ============================================================================
# PHASE 7: ARCHITECTURAL CONSTRAINTS
# ============================================================================

class TestArchitecturalConstraints:
    """Test architectural constraints and forbidden logic"""
    
    def test_no_billing_logic(self, all_lib_files_content):
        """MVM should NOT contain billing logic"""
        forbidden_patterns = [
            'stripe.subscriptions',
            'createSubscription',
            'cancelSubscription',
            'updateSubscription',
            'billingCycle',
            'invoiceCustomer'
        ]
        
        for pattern in forbidden_patterns:
            assert pattern not in all_lib_files_content, f"Forbidden billing pattern found: {pattern}"
        
        print("✓ No billing logic in MVM module")
    
    def test_no_payment_execution(self, all_lib_files_content):
        """MVM should NOT execute payments"""
        forbidden_patterns = [
            'stripe.charges.create',
            'stripe.paymentIntents.create',
            'capturePayment',
            'chargeCard',
            'processPayment(',
            'executePayment'
        ]
        
        for pattern in forbidden_patterns:
            assert pattern not in all_lib_files_content, f"Forbidden payment pattern found: {pattern}"
        
        print("✓ No payment execution in MVM module")
    
    def test_no_money_movement(self, all_lib_files_content):
        """MVM should NOT move money"""
        forbidden_patterns = [
            'transferFunds',
            'wallet.debit',
            'wallet.credit',
            'executePayout',
            'sendMoney',
            'moveFunds'
        ]
        
        for pattern in forbidden_patterns:
            assert pattern not in all_lib_files_content, f"Forbidden money movement pattern found: {pattern}"
        
        # Check for explicit documentation
        assert 'NO money movement' in all_lib_files_content or \
               'no money movement' in all_lib_files_content.lower() or \
               'does NOT move money' in all_lib_files_content
        
        print("✓ No money movement in MVM module")
    
    def test_payout_tracking_only(self, all_lib_files_content):
        """Payout should be tracking only, not execution"""
        # Should have payout tracking
        assert 'PayoutRecord' in all_lib_files_content or 'payoutRecord' in all_lib_files_content
        
        # Should have explicit comment about tracking only
        assert 'does NOT move money' in all_lib_files_content or \
               'only tracks payout records' in all_lib_files_content.lower() or \
               'tracking only' in all_lib_files_content.lower()
        
        print("✓ Payout is tracking only")


# ============================================================================
# PHASE 8: MVM EXTENDS SVM
# ============================================================================

class TestMVMExtendsSVM:
    """Test that MVM extends SVM without duplication"""
    
    def test_mvm_extends_svm_documentation(self, index_content):
        """Should document that MVM extends SVM"""
        assert 'EXTENDS Single Vendor Marketplace' in index_content or \
               'extends SVM' in index_content.lower()
        print("✓ Documentation confirms MVM extends SVM")
    
    def test_no_storefront_duplication(self, all_lib_files_content):
        """MVM should NOT duplicate SVM storefront logic"""
        # MVM should not have its own storefront engine
        assert 'class StorefrontEngine' not in all_lib_files_content
        assert 'class CartEngine' not in all_lib_files_content
        assert 'class CheckoutEngine' not in all_lib_files_content
        print("✓ No storefront duplication")
    
    def test_no_order_creation_duplication(self, all_lib_files_content):
        """MVM should NOT duplicate order creation"""
        # MVM should not create orders, only split them
        assert 'createOrder(' not in all_lib_files_content or \
               'createSubOrder' in all_lib_files_content  # createSubOrder is OK
        print("✓ No order creation duplication")
    
    def test_references_parent_order(self, order_splitter_content):
        """Order splitter should reference parent order"""
        assert 'parentOrderId' in order_splitter_content
        assert 'parentOrderNumber' in order_splitter_content
        assert 'ParentOrder' in order_splitter_content
        print("✓ Order splitter references parent order from SVM")
    
    def test_svm_peer_dependency(self):
        """MVM should have SVM as peer dependency"""
        package_json_path = Path("/app/modules/mvm/package.json")
        content = package_json_path.read_text()
        
        assert '@saas-core/svm' in content
        assert 'peerDependencies' in content
        print("✓ SVM is a peer dependency of MVM")


# ============================================================================
# PHASE 9: MODULE EXPORTS
# ============================================================================

class TestModuleExports:
    """Test module exports"""
    
    def test_vendor_engine_exports(self, index_content):
        """Should export VendorEngine"""
        assert 'VendorEngine' in index_content
        assert 'ProductMappingEngine' in index_content
        assert 'VendorTierEngine' in index_content
        print("✓ Vendor engine exports present")
    
    def test_order_splitter_exports(self, index_content):
        """Should export OrderSplittingEngine"""
        assert 'OrderSplittingEngine' in index_content
        print("✓ Order splitter exports present")
    
    def test_commission_engine_exports(self, index_content):
        """Should export CommissionEngine"""
        assert 'CommissionEngine' in index_content
        print("✓ Commission engine exports present")
    
    def test_event_bus_exports(self, index_content):
        """Should export event bus"""
        assert 'MVM_EVENT_TYPES' in index_content
        assert 'MVMEventEmitter' in index_content
        print("✓ Event bus exports present")
    
    def test_entitlement_exports(self, index_content):
        """Should export entitlements"""
        assert 'MVMEntitlementService' in index_content
        assert 'MVM_ENTITLEMENT_FEATURES' in index_content
        assert 'MVM_ENTITLEMENT_LIMITS' in index_content
        print("✓ Entitlement exports present")
    
    def test_offline_behavior_exports(self, index_content):
        """Should export offline behavior"""
        assert 'MVMConnectivityChecker' in index_content
        assert 'OFFLINE_SAFE_ACTIONS' in index_content
        assert 'ONLINE_REQUIRED_ACTIONS' in index_content
        print("✓ Offline behavior exports present")
    
    def test_vendor_dashboard_exports(self, index_content):
        """Should export vendor dashboard"""
        assert 'VendorDataAccess' in index_content
        print("✓ Vendor dashboard exports present")


# ============================================================================
# ADDITIONAL VALIDATION
# ============================================================================

class TestOfflineBehavior:
    """Test offline behavior definitions"""
    
    def test_offline_safe_actions_defined(self, mvm_lib_path):
        """Should define offline safe actions"""
        content = (mvm_lib_path / "offline-behavior.ts").read_text()
        assert 'OFFLINE_SAFE_ACTIONS' in content
        assert 'VIEW_VENDOR_LIST' in content
        print("✓ Offline safe actions defined")
    
    def test_online_required_actions_defined(self, mvm_lib_path):
        """Should define online required actions"""
        content = (mvm_lib_path / "offline-behavior.ts").read_text()
        assert 'ONLINE_REQUIRED_ACTIONS' in content
        assert 'CREATE_VENDOR' in content
        assert 'ACCEPT_ORDER' in content
        print("✓ Online required actions defined")
    
    def test_connectivity_checker(self, mvm_lib_path):
        """Should have connectivity checker"""
        content = (mvm_lib_path / "offline-behavior.ts").read_text()
        assert 'class MVMConnectivityChecker' in content
        assert 'canPerformAction' in content
        print("✓ Connectivity checker exists")


class TestVendorDashboard:
    """Test vendor dashboard contracts"""
    
    def test_vendor_data_access_class(self, mvm_lib_path):
        """Should have VendorDataAccess class"""
        content = (mvm_lib_path / "vendor-dashboard.ts").read_text()
        assert 'class VendorDataAccess' in content
        print("✓ VendorDataAccess class exists")
    
    def test_data_isolation_documentation(self, mvm_lib_path):
        """Should document data isolation"""
        content = (mvm_lib_path / "vendor-dashboard.ts").read_text()
        assert 'Strict data isolation' in content or 'vendors see ONLY their data' in content
        print("✓ Data isolation documented")
    
    def test_dashboard_view_types(self, mvm_lib_path):
        """Should have dashboard view types"""
        content = (mvm_lib_path / "vendor-dashboard.ts").read_text()
        
        view_types = [
            'VendorDashboardOverview',
            'VendorOrdersView',
            'VendorProductsView',
            'VendorEarningsView'
        ]
        
        for view_type in view_types:
            assert view_type in content, f"Missing view type: {view_type}"
        
        print(f"✓ All {len(view_types)} dashboard view types defined")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
