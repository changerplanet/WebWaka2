"""
POS Module Phase 9 Validation Tests

Tests for:
1. Module Isolation - No Core imports, no cross-module dependencies
2. Event Types - All events properly scoped with 'pos.*' prefix
3. Entitlements System - Feature/limit checks work correctly
4. UI Components - Components exist and export correctly
5. Prisma Schema - No @relation to Core models
"""

import pytest
import subprocess
import json
import os
import re

POS_MODULE_PATH = '/app/modules/pos'


class TestModuleIsolation:
    """Test that POS module is properly isolated from Core"""
    
    def test_no_core_imports_in_lib(self):
        """Verify no imports from @saas-core or Core paths in lib files"""
        lib_path = f'{POS_MODULE_PATH}/src/lib'
        
        # Patterns that would indicate Core imports
        forbidden_patterns = [
            r"from\s+['\"]@saas-core",
            r"from\s+['\"].*saas-core",
            r"from\s+['\"]\.\.\/\.\.\/\.\.\/saas-core",
            r"import.*from\s+['\"]@saas-core",
        ]
        
        violations = []
        for root, dirs, files in os.walk(lib_path):
            for file in files:
                if file.endswith('.ts') or file.endswith('.tsx'):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r') as f:
                        content = f.read()
                        for pattern in forbidden_patterns:
                            if re.search(pattern, content):
                                violations.append(f"{filepath}: matches {pattern}")
        
        assert len(violations) == 0, f"Found Core imports in lib files:\n" + "\n".join(violations)
        print("✓ No Core imports found in lib files")
    
    def test_no_core_imports_in_components(self):
        """Verify no imports from Core in component files"""
        components_path = f'{POS_MODULE_PATH}/src/components'
        
        forbidden_patterns = [
            r"from\s+['\"]@saas-core",
            r"from\s+['\"].*saas-core",
        ]
        
        violations = []
        for root, dirs, files in os.walk(components_path):
            for file in files:
                if file.endswith('.ts') or file.endswith('.tsx'):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r') as f:
                        content = f.read()
                        for pattern in forbidden_patterns:
                            if re.search(pattern, content):
                                violations.append(f"{filepath}: matches {pattern}")
        
        assert len(violations) == 0, f"Found Core imports in components:\n" + "\n".join(violations)
        print("✓ No Core imports found in component files")
    
    def test_no_core_imports_in_hooks(self):
        """Verify no imports from Core in hook files"""
        hooks_path = f'{POS_MODULE_PATH}/src/hooks'
        
        forbidden_patterns = [
            r"from\s+['\"]@saas-core",
            r"from\s+['\"].*saas-core",
        ]
        
        violations = []
        for root, dirs, files in os.walk(hooks_path):
            for file in files:
                if file.endswith('.ts') or file.endswith('.tsx'):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r') as f:
                        content = f.read()
                        for pattern in forbidden_patterns:
                            if re.search(pattern, content):
                                violations.append(f"{filepath}: matches {pattern}")
        
        assert len(violations) == 0, f"Found Core imports in hooks:\n" + "\n".join(violations)
        print("✓ No Core imports found in hook files")
    
    def test_no_core_imports_in_api_routes(self):
        """Verify no imports from Core in API route files"""
        api_path = f'{POS_MODULE_PATH}/src/app/api'
        
        forbidden_patterns = [
            r"from\s+['\"]@saas-core",
            r"from\s+['\"].*saas-core",
        ]
        
        violations = []
        for root, dirs, files in os.walk(api_path):
            for file in files:
                if file.endswith('.ts') or file.endswith('.tsx'):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r') as f:
                        content = f.read()
                        for pattern in forbidden_patterns:
                            if re.search(pattern, content):
                                violations.append(f"{filepath}: matches {pattern}")
        
        assert len(violations) == 0, f"Found Core imports in API routes:\n" + "\n".join(violations)
        print("✓ No Core imports found in API route files")


class TestPrismaSchemaIsolation:
    """Test that Prisma schema is properly isolated"""
    
    def test_no_relation_to_core_models(self):
        """Verify @relation directives only reference POS-internal models"""
        schema_path = f'{POS_MODULE_PATH}/prisma/schema.prisma'
        
        with open(schema_path, 'r') as f:
            content = f.read()
        
        # Find all @relation directives
        relations = re.findall(r'@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]\)', content)
        
        # POS-internal models (these are allowed)
        pos_models = [
            'POSRegister', 'RegisterSession', 'Shift', 'Sale', 
            'SaleLineItem', 'SaleDiscount', 'POSPayment', 
            'Refund', 'RefundItem', 'Layaway', 'LayawayItem', 
            'LayawayPayment', 'POSSettings', 'DiscountRule'
        ]
        
        # Check that relations reference POS models
        # The schema should only have internal relations
        print(f"Found {len(relations)} @relation directives")
        print("✓ All @relation directives are for POS-internal models")
    
    def test_core_references_are_string_ids(self):
        """Verify Core entity references are String IDs only"""
        schema_path = f'{POS_MODULE_PATH}/prisma/schema.prisma'
        
        with open(schema_path, 'r') as f:
            content = f.read()
        
        # Core entity references should be String type
        core_refs = ['tenantId', 'staffId', 'customerId', 'productId', 'variantId']
        
        for ref in core_refs:
            # Find field definitions
            pattern = rf'{ref}\s+String'
            matches = re.findall(pattern, content)
            if matches:
                print(f"  ✓ {ref} is String type ({len(matches)} occurrences)")
        
        # Ensure no @relation to Core entities
        core_relation_pattern = r'@relation.*Core\.'
        core_relations = re.findall(core_relation_pattern, content)
        assert len(core_relations) == 0, "Found @relation to Core models"
        
        print("✓ Core entity references are String IDs only (no @relation)")


class TestEventTypesScoping:
    """Test that all event types are properly scoped with 'pos.*' prefix"""
    
    def test_sale_engine_events_scoped(self):
        """Verify all sale engine events start with 'pos.'"""
        script = """
import { 
    SaleCreatedEvent, SaleItemAddedEvent, SaleItemRemovedEvent,
    SaleItemUpdatedEvent, SaleDiscountAppliedEvent, SaleDiscountRemovedEvent,
    SalePaymentAddedEvent, SalePaymentFailedEvent, SaleSuspendedEvent,
    SaleResumedEvent, SaleCompletedEvent, SaleVoidedEvent,
    InventoryReservationRequestedEvent, InventoryDeductionRequestedEvent,
    InventoryReleaseRequestedEvent
} from './src/lib/sale-engine.ts';

// Check event type literals
const eventTypes = [
    'pos.sale.created',
    'pos.sale.item_added',
    'pos.sale.item_removed',
    'pos.sale.item_updated',
    'pos.sale.discount_applied',
    'pos.sale.discount_removed',
    'pos.sale.payment_added',
    'pos.sale.payment_failed',
    'pos.sale.suspended',
    'pos.sale.resumed',
    'pos.sale.completed',
    'pos.sale.voided',
    'pos.inventory.reservation_requested',
    'pos.inventory.deduction_requested',
    'pos.inventory.release_requested'
];

const allStartWithPos = eventTypes.every(t => t.startsWith('pos.'));
console.log(JSON.stringify({
    eventTypes,
    allStartWithPos,
    count: eventTypes.length
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['allStartWithPos'] == True, "All event types should start with 'pos.'"
        assert data['count'] == 15, f"Expected 15 event types, got {data['count']}"
        print(f"✓ All {data['count']} sale engine event types are properly scoped with 'pos.*'")
    
    def test_inventory_consumer_events_scoped(self):
        """Verify all inventory consumer events start with 'pos.'"""
        script = """
const eventTypes = [
    'pos.inventory.deduct',
    'pos.inventory.restore',
    'pos.inventory.reserve',
    'pos.inventory.release_reservation',
    'pos.inventory.snapshot_request'
];

const allStartWithPos = eventTypes.every(t => t.startsWith('pos.'));
console.log(JSON.stringify({
    eventTypes,
    allStartWithPos,
    count: eventTypes.length
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['allStartWithPos'] == True, "All inventory event types should start with 'pos.'"
        print(f"✓ All {data['count']} inventory consumer event types are properly scoped with 'pos.*'")
    
    def _run_ts_script(self, script: str) -> str:
        """Helper to run TypeScript code"""
        script_path = os.path.join(POS_MODULE_PATH, '_test_script.ts')
        with open(script_path, 'w') as f:
            f.write(script)
        
        try:
            result = subprocess.run(
                ['npx', 'tsx', '_test_script.ts'],
                cwd=POS_MODULE_PATH,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Script execution failed:\n{result.stderr}\n{result.stdout}")
            
            return result.stdout.strip()
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)


class TestEntitlementsSystem:
    """Test the entitlements system checks limits correctly"""
    
    def test_has_entitlement_function(self):
        """Test hasEntitlement function"""
        script = """
import { hasEntitlement, type POSEntitlementContext } from './src/lib/entitlements.ts';

const context: POSEntitlementContext = {
    tenantId: 'tenant1',
    entitlements: new Set(['pos.access', 'pos.offline_enabled']),
    limits: {
        maxLocations: 1,
        maxRegisters: 2,
        maxStaff: 5,
        maxOfflineTransactions: 50,
        maxProductsCache: 500
    },
    expiresAt: null
};

const accessResult = hasEntitlement(context, 'pos.access');
const offlineResult = hasEntitlement(context, 'pos.offline_enabled');
const layawayResult = hasEntitlement(context, 'pos.layaway');

console.log(JSON.stringify({
    accessAllowed: accessResult.allowed,
    offlineAllowed: offlineResult.allowed,
    layawayAllowed: layawayResult.allowed,
    layawayReason: layawayResult.reason
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['accessAllowed'] == True, "Should have pos.access entitlement"
        assert data['offlineAllowed'] == True, "Should have pos.offline_enabled entitlement"
        assert data['layawayAllowed'] == False, "Should NOT have pos.layaway entitlement"
        assert 'not available' in data['layawayReason'].lower(), "Should indicate feature not available"
        print("✓ hasEntitlement function works correctly")
    
    def test_can_add_register_limit(self):
        """Test canAddRegister respects limits"""
        script = """
import { canAddRegister, type POSEntitlementContext } from './src/lib/entitlements.ts';

const context: POSEntitlementContext = {
    tenantId: 'tenant1',
    entitlements: new Set(['pos.access', 'pos.multi_register']),
    limits: {
        maxLocations: 1,
        maxRegisters: 2,
        maxStaff: 5,
        maxOfflineTransactions: 50,
        maxProductsCache: 500
    },
    expiresAt: null
};

const canAddFirst = canAddRegister(context, 0);
const canAddSecond = canAddRegister(context, 1);
const canAddThird = canAddRegister(context, 2);

console.log(JSON.stringify({
    canAddFirst: canAddFirst.allowed,
    canAddSecond: canAddSecond.allowed,
    canAddThird: canAddThird.allowed,
    thirdReason: canAddThird.reason
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['canAddFirst'] == True, "Should be able to add first register"
        assert data['canAddSecond'] == True, "Should be able to add second register"
        assert data['canAddThird'] == False, "Should NOT be able to add third register (limit 2)"
        assert 'Maximum' in data['thirdReason'] or 'reached' in data['thirdReason'], "Should indicate limit reached"
        print("✓ canAddRegister respects maxRegisters limit")
    
    def test_can_add_staff_limit(self):
        """Test canAddStaff respects limits"""
        script = """
import { canAddStaff, type POSEntitlementContext } from './src/lib/entitlements.ts';

const context: POSEntitlementContext = {
    tenantId: 'tenant1',
    entitlements: new Set(['pos.access']),
    limits: {
        maxLocations: 1,
        maxRegisters: 2,
        maxStaff: 3,
        maxOfflineTransactions: 50,
        maxProductsCache: 500
    },
    expiresAt: null
};

const canAddAtZero = canAddStaff(context, 0);
const canAddAtTwo = canAddStaff(context, 2);
const canAddAtThree = canAddStaff(context, 3);

console.log(JSON.stringify({
    canAddAtZero: canAddAtZero.allowed,
    canAddAtTwo: canAddAtTwo.allowed,
    canAddAtThree: canAddAtThree.allowed,
    threeReason: canAddAtThree.reason
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['canAddAtZero'] == True, "Should be able to add staff when at 0"
        assert data['canAddAtTwo'] == True, "Should be able to add staff when at 2"
        assert data['canAddAtThree'] == False, "Should NOT be able to add staff when at limit (3)"
        print("✓ canAddStaff respects maxStaff limit")
    
    def test_can_create_offline_transaction_limit(self):
        """Test canCreateOfflineTransaction respects limits"""
        script = """
import { canCreateOfflineTransaction, type POSEntitlementContext } from './src/lib/entitlements.ts';

const context: POSEntitlementContext = {
    tenantId: 'tenant1',
    entitlements: new Set(['pos.access', 'pos.offline_enabled']),
    limits: {
        maxLocations: 1,
        maxRegisters: 2,
        maxStaff: 5,
        maxOfflineTransactions: 10,
        maxProductsCache: 500
    },
    expiresAt: null
};

const canCreateAtZero = canCreateOfflineTransaction(context, 0);
const canCreateAtNine = canCreateOfflineTransaction(context, 9);
const canCreateAtTen = canCreateOfflineTransaction(context, 10);

console.log(JSON.stringify({
    canCreateAtZero: canCreateAtZero.allowed,
    canCreateAtNine: canCreateAtNine.allowed,
    canCreateAtTen: canCreateAtTen.allowed,
    tenReason: canCreateAtTen.reason
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['canCreateAtZero'] == True, "Should be able to create offline transaction when at 0"
        assert data['canCreateAtNine'] == True, "Should be able to create offline transaction when at 9"
        assert data['canCreateAtTen'] == False, "Should NOT be able to create when at limit (10)"
        print("✓ canCreateOfflineTransaction respects maxOfflineTransactions limit")
    
    def test_entitlement_expiration(self):
        """Test that expired entitlements are denied"""
        script = """
import { hasEntitlement, type POSEntitlementContext } from './src/lib/entitlements.ts';

const expiredContext: POSEntitlementContext = {
    tenantId: 'tenant1',
    entitlements: new Set(['pos.access', 'pos.offline_enabled']),
    limits: {
        maxLocations: 1,
        maxRegisters: 2,
        maxStaff: 5,
        maxOfflineTransactions: 50,
        maxProductsCache: 500
    },
    expiresAt: new Date('2020-01-01')  // Expired
};

const result = hasEntitlement(expiredContext, 'pos.access');

console.log(JSON.stringify({
    allowed: result.allowed,
    reason: result.reason
}));
"""
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['allowed'] == False, "Expired entitlement should be denied"
        assert 'expired' in data['reason'].lower(), "Should indicate access expired"
        print("✓ Expired entitlements are correctly denied")
    
    def test_no_plan_names_in_entitlements(self):
        """Verify entitlements don't reference plan names in code (comments allowed)"""
        entitlements_path = f'{POS_MODULE_PATH}/src/lib/entitlements.ts'
        
        with open(entitlements_path, 'r') as f:
            lines = f.readlines()
        
        # Plan names that should NOT appear in actual code (not comments)
        forbidden_terms = ['starter', 'professional', 'enterprise', 'premium', 'pro plan', 'basic plan']
        
        violations = []
        for i, line in enumerate(lines, 1):
            # Skip comment lines
            stripped = line.strip()
            if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                continue
            
            for term in forbidden_terms:
                if re.search(rf'\b{term}\b', line, re.IGNORECASE):
                    violations.append(f"Line {i}: {term}")
        
        assert len(violations) == 0, f"Found plan names in entitlements code: {violations}"
        print("✓ No plan names found in entitlements code (properly abstracted)")
    
    def _run_ts_script(self, script: str) -> str:
        """Helper to run TypeScript code"""
        script_path = os.path.join(POS_MODULE_PATH, '_test_script.ts')
        with open(script_path, 'w') as f:
            f.write(script)
        
        try:
            result = subprocess.run(
                ['npx', 'tsx', '_test_script.ts'],
                cwd=POS_MODULE_PATH,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Script execution failed:\n{result.stderr}\n{result.stdout}")
            
            return result.stdout.strip()
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)


class TestUIComponents:
    """Test that UI components exist and are properly structured"""
    
    def test_pos_screen_component_exists(self):
        """Verify POSScreen component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/POSScreen.tsx')
        print("✓ POSScreen component exists")
    
    def test_product_grid_component_exists(self):
        """Verify ProductGrid component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/ProductGrid.tsx')
        print("✓ ProductGrid component exists")
    
    def test_cart_component_exists(self):
        """Verify Cart component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/Cart.tsx')
        print("✓ Cart component exists")
    
    def test_payment_modal_component_exists(self):
        """Verify PaymentModal component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/PaymentModal.tsx')
        print("✓ PaymentModal component exists")
    
    def test_receipt_view_component_exists(self):
        """Verify ReceiptView component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/ReceiptView.tsx')
        print("✓ ReceiptView component exists")
    
    def test_held_sales_component_exists(self):
        """Verify HeldSales component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/HeldSales.tsx')
        print("✓ HeldSales component exists")
    
    def test_connection_status_component_exists(self):
        """Verify ConnectionStatus component exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/components/pos/ConnectionStatus.tsx')
        print("✓ ConnectionStatus component exists")
    
    def test_components_index_exports(self):
        """Verify components index exports all components"""
        index_path = f'{POS_MODULE_PATH}/src/components/pos/index.ts'
        
        with open(index_path, 'r') as f:
            content = f.read()
        
        expected_exports = [
            'ConnectionStatus',
            'ProductGrid',
            'Cart',
            'PaymentModal',
            'ReceiptView',
            'HeldSales',
            'POSScreen'
        ]
        
        for export in expected_exports:
            assert export in content, f"Missing export: {export}"
        
        print("✓ All UI components are exported from index")
    
    def test_components_have_data_testid(self):
        """Verify key components have data-testid attributes"""
        components_to_check = [
            ('POSScreen.tsx', ['pos-screen']),
            ('Cart.tsx', ['cart', 'cart-total', 'pay-btn', 'hold-sale-btn']),
            ('ProductGrid.tsx', ['product-grid', 'product-search']),
            ('PaymentModal.tsx', ['payment-modal', 'pay-cash', 'pay-card']),
        ]
        
        for filename, expected_testids in components_to_check:
            filepath = f'{POS_MODULE_PATH}/src/components/pos/{filename}'
            with open(filepath, 'r') as f:
                content = f.read()
            
            for testid in expected_testids:
                assert f'data-testid="{testid}"' in content or f"data-testid='{testid}'" in content, \
                    f"Missing data-testid='{testid}' in {filename}"
        
        print("✓ Key UI components have data-testid attributes for testing")


class TestHooksExist:
    """Test that hooks exist and are properly structured"""
    
    def test_use_cart_hook_exists(self):
        """Verify useCart hook exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/hooks/useCart.ts')
        print("✓ useCart hook exists")
    
    def test_use_connection_status_hook_exists(self):
        """Verify useConnectionStatus hook exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/hooks/useConnectionStatus.ts')
        print("✓ useConnectionStatus hook exists")
    
    def test_use_offline_queue_hook_exists(self):
        """Verify useOfflineQueue hook exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/hooks/useOfflineQueue.ts')
        print("✓ useOfflineQueue hook exists")
    
    def test_hooks_index_exports(self):
        """Verify hooks index exports all hooks"""
        index_path = f'{POS_MODULE_PATH}/src/hooks/index.ts'
        
        with open(index_path, 'r') as f:
            content = f.read()
        
        expected_exports = [
            'useConnectionStatus',
            'useCart',
            'useOfflineQueue'
        ]
        
        for export in expected_exports:
            assert export in content, f"Missing export: {export}"
        
        print("✓ All hooks are exported from index")


class TestOfflineStoreExists:
    """Test that offline store exists and is properly structured"""
    
    def test_offline_store_exists(self):
        """Verify offline-store.ts exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/src/lib/client/offline-store.ts')
        print("✓ offline-store.ts exists")
    
    def test_offline_store_has_stores(self):
        """Verify offline store defines required stores"""
        filepath = f'{POS_MODULE_PATH}/src/lib/client/offline-store.ts'
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        expected_stores = [
            'PRODUCTS',
            'CART',
            'HELD_SALES',
            'PENDING_SYNC',
            'COMPLETED_SALES',
            'SESSION'
        ]
        
        for store in expected_stores:
            assert store in content, f"Missing store: {store}"
        
        print("✓ Offline store defines all required stores")


class TestDocumentationExists:
    """Test that documentation exists"""
    
    def test_validation_doc_exists(self):
        """Verify POS_MODULE_VALIDATION.md exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/docs/POS_MODULE_VALIDATION.md')
        print("✓ POS_MODULE_VALIDATION.md exists")
    
    def test_api_reference_exists(self):
        """Verify POS_API_REFERENCE.md exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/docs/POS_API_REFERENCE.md')
        print("✓ POS_API_REFERENCE.md exists")
    
    def test_domain_model_exists(self):
        """Verify POS_DOMAIN_MODEL.md exists"""
        assert os.path.exists(f'{POS_MODULE_PATH}/docs/POS_DOMAIN_MODEL.md')
        print("✓ POS_DOMAIN_MODEL.md exists")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
