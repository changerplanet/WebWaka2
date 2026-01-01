"""
POS Module Unit Tests

Tests for:
1. Permissions system - role hierarchy (CASHIER < SUPERVISOR < MANAGER)
2. Sale engine state machine - valid transitions
3. API route validation (mock responses)
"""

import pytest
import subprocess
import json
import os

# Get the base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestTypeScriptCompilation:
    """Test that TypeScript compilation passes for all POS module files"""
    
    def test_typescript_compilation_passes(self):
        """Verify TypeScript compiles without errors"""
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            cwd='/app/modules/pos',
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"TypeScript compilation failed:\n{result.stderr}\n{result.stdout}"
        print("✓ TypeScript compilation passed for all POS module files")


class TestPermissionsSystem:
    """Test the POS permissions system using Node.js to execute TypeScript"""
    
    def test_role_hierarchy_cashier_lowest(self):
        """Verify CASHIER has lowest hierarchy level (1)"""
        script = """
        const { POS_ROLE_HIERARCHY } = require('./src/lib/permissions.ts');
        console.log(JSON.stringify({
            cashier: POS_ROLE_HIERARCHY['POS_CASHIER'],
            supervisor: POS_ROLE_HIERARCHY['POS_SUPERVISOR'],
            manager: POS_ROLE_HIERARCHY['POS_MANAGER']
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['cashier'] == 1, "CASHIER should have hierarchy level 1"
        assert data['supervisor'] == 2, "SUPERVISOR should have hierarchy level 2"
        assert data['manager'] == 3, "MANAGER should have hierarchy level 3"
        assert data['cashier'] < data['supervisor'] < data['manager'], "Hierarchy should be CASHIER < SUPERVISOR < MANAGER"
        print("✓ Role hierarchy correctly enforces CASHIER < SUPERVISOR < MANAGER")
    
    def test_cashier_permissions_basic_sales(self):
        """Verify CASHIER has basic sale permissions"""
        script = """
        const { POS_PERMISSIONS_BY_ROLE } = require('./src/lib/permissions.ts');
        const cashierPerms = POS_PERMISSIONS_BY_ROLE['POS_CASHIER'];
        console.log(JSON.stringify({
            canCreateSale: cashierPerms.has('pos.sale.create'),
            canAddItem: cashierPerms.has('pos.sale.add_item'),
            canCompleteSale: cashierPerms.has('pos.sale.complete'),
            canVoidSale: cashierPerms.has('pos.sale.void'),
            canVoidOthers: cashierPerms.has('pos.sale.void_others')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['canCreateSale'] == True, "CASHIER should be able to create sales"
        assert data['canAddItem'] == True, "CASHIER should be able to add items"
        assert data['canCompleteSale'] == True, "CASHIER should be able to complete sales"
        assert data['canVoidSale'] == False, "CASHIER should NOT be able to void sales"
        assert data['canVoidOthers'] == False, "CASHIER should NOT be able to void others' sales"
        print("✓ CASHIER has correct basic sale permissions")
    
    def test_supervisor_additional_permissions(self):
        """Verify SUPERVISOR has additional permissions over CASHIER"""
        script = """
        const { POS_PERMISSIONS_BY_ROLE } = require('./src/lib/permissions.ts');
        const supervisorPerms = POS_PERMISSIONS_BY_ROLE['POS_SUPERVISOR'];
        console.log(JSON.stringify({
            canVoidSale: supervisorPerms.has('pos.sale.void'),
            canResumeOthers: supervisorPerms.has('pos.sale.resume_others'),
            canApplyCustomDiscount: supervisorPerms.has('pos.discount.apply_custom'),
            canCreateRefund: supervisorPerms.has('pos.refund.create'),
            canVoidOthers: supervisorPerms.has('pos.sale.void_others'),
            canEditSettings: supervisorPerms.has('pos.settings.edit')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['canVoidSale'] == True, "SUPERVISOR should be able to void sales"
        assert data['canResumeOthers'] == True, "SUPERVISOR should be able to resume others' sales"
        assert data['canApplyCustomDiscount'] == True, "SUPERVISOR should be able to apply custom discounts"
        assert data['canCreateRefund'] == True, "SUPERVISOR should be able to create refunds"
        assert data['canVoidOthers'] == False, "SUPERVISOR should NOT be able to void others' sales"
        assert data['canEditSettings'] == False, "SUPERVISOR should NOT be able to edit settings"
        print("✓ SUPERVISOR has correct additional permissions")
    
    def test_manager_full_permissions(self):
        """Verify MANAGER has full POS permissions"""
        script = """
        const { POS_PERMISSIONS_BY_ROLE } = require('./src/lib/permissions.ts');
        const managerPerms = POS_PERMISSIONS_BY_ROLE['POS_MANAGER'];
        console.log(JSON.stringify({
            canVoidOthers: managerPerms.has('pos.sale.void_others'),
            canOverrideMaxDiscount: managerPerms.has('pos.discount.override_max'),
            canRefundWithoutReceipt: managerPerms.has('pos.refund.without_receipt'),
            canApproveRefund: managerPerms.has('pos.refund.approve'),
            canEditSettings: managerPerms.has('pos.settings.edit'),
            canManageRegisters: managerPerms.has('pos.settings.registers'),
            canEndOthersShifts: managerPerms.has('pos.shift.end_others')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['canVoidOthers'] == True, "MANAGER should be able to void others' sales"
        assert data['canOverrideMaxDiscount'] == True, "MANAGER should be able to override max discount"
        assert data['canRefundWithoutReceipt'] == True, "MANAGER should be able to refund without receipt"
        assert data['canApproveRefund'] == True, "MANAGER should be able to approve refunds"
        assert data['canEditSettings'] == True, "MANAGER should be able to edit settings"
        assert data['canManageRegisters'] == True, "MANAGER should be able to manage registers"
        assert data['canEndOthersShifts'] == True, "MANAGER should be able to end others' shifts"
        print("✓ MANAGER has full POS permissions")
    
    def test_has_permission_function_cashier(self):
        """Test hasPermission function for CASHIER role"""
        script = """
        const { hasPermission } = require('./src/lib/permissions.ts');
        const staff = {
            userId: 'user1',
            tenantId: 'tenant1',
            email: 'cashier@test.com',
            coreRole: 'TENANT_USER',
            posRole: 'POS_CASHIER'
        };
        const createResult = hasPermission(staff, 'pos.sale.create');
        const voidResult = hasPermission(staff, 'pos.sale.void');
        console.log(JSON.stringify({
            createAllowed: createResult.allowed,
            voidAllowed: voidResult.allowed,
            voidReason: voidResult.reason,
            voidRequiresApproval: voidResult.requiresApproval,
            voidApproverRole: voidResult.approverRole
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['createAllowed'] == True, "CASHIER should be allowed to create sales"
        assert data['voidAllowed'] == False, "CASHIER should NOT be allowed to void sales"
        assert data['voidRequiresApproval'] == True, "Void should require approval for CASHIER"
        assert data['voidApproverRole'] == 'POS_SUPERVISOR', "Void should require SUPERVISOR approval"
        print("✓ hasPermission function works correctly for CASHIER")
    
    def test_tenant_admin_has_all_permissions(self):
        """Test that TENANT_ADMIN has all POS permissions regardless of POS role"""
        script = """
        const { hasPermission } = require('./src/lib/permissions.ts');
        const staff = {
            userId: 'admin1',
            tenantId: 'tenant1',
            email: 'admin@test.com',
            coreRole: 'TENANT_ADMIN',
            posRole: 'POS_CASHIER'  // Even with CASHIER role
        };
        const voidResult = hasPermission(staff, 'pos.sale.void_others');
        const settingsResult = hasPermission(staff, 'pos.settings.edit');
        console.log(JSON.stringify({
            voidOthersAllowed: voidResult.allowed,
            editSettingsAllowed: settingsResult.allowed
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['voidOthersAllowed'] == True, "TENANT_ADMIN should have all permissions"
        assert data['editSettingsAllowed'] == True, "TENANT_ADMIN should have all permissions"
        print("✓ TENANT_ADMIN has all POS permissions regardless of POS role")
    
    def test_can_assign_role_hierarchy(self):
        """Test canAssignRole respects hierarchy"""
        script = """
        const { canAssignRole } = require('./src/lib/permissions.ts');
        const manager = {
            userId: 'manager1',
            tenantId: 'tenant1',
            email: 'manager@test.com',
            coreRole: 'TENANT_USER',
            posRole: 'POS_MANAGER'
        };
        const supervisor = {
            userId: 'supervisor1',
            tenantId: 'tenant1',
            email: 'supervisor@test.com',
            coreRole: 'TENANT_USER',
            posRole: 'POS_SUPERVISOR'
        };
        console.log(JSON.stringify({
            managerCanAssignSupervisor: canAssignRole(manager, 'POS_SUPERVISOR'),
            managerCanAssignCashier: canAssignRole(manager, 'POS_CASHIER'),
            managerCanAssignManager: canAssignRole(manager, 'POS_MANAGER'),
            supervisorCanAssignCashier: canAssignRole(supervisor, 'POS_CASHIER'),
            supervisorCanAssignSupervisor: canAssignRole(supervisor, 'POS_SUPERVISOR')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['managerCanAssignSupervisor'] == True, "MANAGER can assign SUPERVISOR"
        assert data['managerCanAssignCashier'] == True, "MANAGER can assign CASHIER"
        assert data['managerCanAssignManager'] == False, "MANAGER cannot assign MANAGER (same level)"
        assert data['supervisorCanAssignCashier'] == True, "SUPERVISOR can assign CASHIER"
        assert data['supervisorCanAssignSupervisor'] == False, "SUPERVISOR cannot assign SUPERVISOR (same level)"
        print("✓ canAssignRole correctly respects role hierarchy")
    
    def _run_ts_script(self, script: str) -> str:
        """Helper to run TypeScript code using ts-node or tsx"""
        # Write script to temp file
        script_path = '/tmp/test_pos_script.ts'
        with open(script_path, 'w') as f:
            f.write(script)
        
        # Try using npx tsx first (faster)
        result = subprocess.run(
            ['npx', 'tsx', script_path],
            cwd='/app/modules/pos',
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Fallback to ts-node
            result = subprocess.run(
                ['npx', 'ts-node', '--esm', script_path],
                cwd='/app/modules/pos',
                capture_output=True,
                text=True
            )
        
        if result.returncode != 0:
            raise Exception(f"Script execution failed:\n{result.stderr}\n{result.stdout}")
        
        return result.stdout.strip()


class TestSaleEngineStateMachine:
    """Test the sale engine state machine transitions"""
    
    def test_valid_transitions_from_draft(self):
        """Verify valid transitions from DRAFT status"""
        script = """
        const { VALID_TRANSITIONS, canTransition } = require('./src/lib/sale-engine.ts');
        console.log(JSON.stringify({
            validFromDraft: VALID_TRANSITIONS['DRAFT'],
            canGoToSuspended: canTransition('DRAFT', 'SUSPENDED'),
            canGoToPendingPayment: canTransition('DRAFT', 'PENDING_PAYMENT'),
            canGoToVoided: canTransition('DRAFT', 'VOIDED'),
            canGoToCompleted: canTransition('DRAFT', 'COMPLETED'),
            canGoToRefunded: canTransition('DRAFT', 'REFUNDED')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert 'SUSPENDED' in data['validFromDraft'], "DRAFT can transition to SUSPENDED"
        assert 'PENDING_PAYMENT' in data['validFromDraft'], "DRAFT can transition to PENDING_PAYMENT"
        assert 'VOIDED' in data['validFromDraft'], "DRAFT can transition to VOIDED"
        assert data['canGoToSuspended'] == True
        assert data['canGoToPendingPayment'] == True
        assert data['canGoToVoided'] == True
        assert data['canGoToCompleted'] == False, "DRAFT cannot directly go to COMPLETED"
        assert data['canGoToRefunded'] == False, "DRAFT cannot go to REFUNDED"
        print("✓ DRAFT state has correct valid transitions")
    
    def test_valid_transitions_from_suspended(self):
        """Verify valid transitions from SUSPENDED status"""
        script = """
        const { VALID_TRANSITIONS, canTransition } = require('./src/lib/sale-engine.ts');
        console.log(JSON.stringify({
            validFromSuspended: VALID_TRANSITIONS['SUSPENDED'],
            canGoToDraft: canTransition('SUSPENDED', 'DRAFT'),
            canGoToVoided: canTransition('SUSPENDED', 'VOIDED'),
            canGoToCompleted: canTransition('SUSPENDED', 'COMPLETED')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert 'DRAFT' in data['validFromSuspended'], "SUSPENDED can transition to DRAFT (resume)"
        assert 'VOIDED' in data['validFromSuspended'], "SUSPENDED can transition to VOIDED"
        assert data['canGoToDraft'] == True
        assert data['canGoToVoided'] == True
        assert data['canGoToCompleted'] == False, "SUSPENDED cannot directly go to COMPLETED"
        print("✓ SUSPENDED state has correct valid transitions")
    
    def test_valid_transitions_from_pending_payment(self):
        """Verify valid transitions from PENDING_PAYMENT status"""
        script = """
        const { VALID_TRANSITIONS, canTransition } = require('./src/lib/sale-engine.ts');
        console.log(JSON.stringify({
            validFromPending: VALID_TRANSITIONS['PENDING_PAYMENT'],
            canGoToPartiallyPaid: canTransition('PENDING_PAYMENT', 'PARTIALLY_PAID'),
            canGoToCompleted: canTransition('PENDING_PAYMENT', 'COMPLETED'),
            canGoToSuspended: canTransition('PENDING_PAYMENT', 'SUSPENDED'),
            canGoToVoided: canTransition('PENDING_PAYMENT', 'VOIDED')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert 'PARTIALLY_PAID' in data['validFromPending']
        assert 'COMPLETED' in data['validFromPending']
        assert 'SUSPENDED' in data['validFromPending']
        assert 'VOIDED' in data['validFromPending']
        assert data['canGoToPartiallyPaid'] == True
        assert data['canGoToCompleted'] == True
        assert data['canGoToSuspended'] == True
        assert data['canGoToVoided'] == True
        print("✓ PENDING_PAYMENT state has correct valid transitions")
    
    def test_valid_transitions_from_completed(self):
        """Verify valid transitions from COMPLETED status"""
        script = """
        const { VALID_TRANSITIONS, canTransition } = require('./src/lib/sale-engine.ts');
        console.log(JSON.stringify({
            validFromCompleted: VALID_TRANSITIONS['COMPLETED'],
            canGoToRefunded: canTransition('COMPLETED', 'REFUNDED'),
            canGoToVoided: canTransition('COMPLETED', 'VOIDED'),
            canGoToDraft: canTransition('COMPLETED', 'DRAFT')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['validFromCompleted'] == ['REFUNDED'], "COMPLETED can only transition to REFUNDED"
        assert data['canGoToRefunded'] == True
        assert data['canGoToVoided'] == False, "COMPLETED cannot be voided"
        assert data['canGoToDraft'] == False, "COMPLETED cannot go back to DRAFT"
        print("✓ COMPLETED state has correct valid transitions (only REFUNDED)")
    
    def test_terminal_states_have_no_transitions(self):
        """Verify VOIDED and REFUNDED are terminal states"""
        script = """
        const { VALID_TRANSITIONS, getValidTransitions } = require('./src/lib/sale-engine.ts');
        console.log(JSON.stringify({
            voidedTransitions: VALID_TRANSITIONS['VOIDED'],
            refundedTransitions: VALID_TRANSITIONS['REFUNDED'],
            voidedValid: getValidTransitions('VOIDED'),
            refundedValid: getValidTransitions('REFUNDED')
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['voidedTransitions'] == [], "VOIDED is a terminal state"
        assert data['refundedTransitions'] == [], "REFUNDED is a terminal state"
        assert data['voidedValid'] == [], "VOIDED has no valid transitions"
        assert data['refundedValid'] == [], "REFUNDED has no valid transitions"
        print("✓ VOIDED and REFUNDED are terminal states with no transitions")
    
    def _run_ts_script(self, script: str) -> str:
        """Helper to run TypeScript code"""
        script_path = '/tmp/test_pos_script.ts'
        with open(script_path, 'w') as f:
            f.write(script)
        
        result = subprocess.run(
            ['npx', 'tsx', script_path],
            cwd='/app/modules/pos',
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"Script execution failed:\n{result.stderr}\n{result.stdout}")
        
        return result.stdout.strip()


class TestAPIRouteFiles:
    """Test that API route files exist and are syntactically correct"""
    
    def test_sales_route_exists(self):
        """Verify sales API route file exists"""
        assert os.path.exists('/app/modules/pos/src/app/api/sales/route.ts'), "Sales route file should exist"
        print("✓ Sales API route file exists")
    
    def test_registers_route_exists(self):
        """Verify registers API route file exists"""
        assert os.path.exists('/app/modules/pos/src/app/api/registers/route.ts'), "Registers route file should exist"
        print("✓ Registers API route file exists")
    
    def test_shifts_route_exists(self):
        """Verify shifts API route file exists"""
        assert os.path.exists('/app/modules/pos/src/app/api/shifts/route.ts'), "Shifts route file should exist"
        print("✓ Shifts API route file exists")
    
    def test_refunds_route_exists(self):
        """Verify refunds API route file exists"""
        assert os.path.exists('/app/modules/pos/src/app/api/refunds/route.ts'), "Refunds route file should exist"
        print("✓ Refunds API route file exists")
    
    def test_settings_route_exists(self):
        """Verify settings API route file exists"""
        assert os.path.exists('/app/modules/pos/src/app/api/settings/route.ts'), "Settings route file should exist"
        print("✓ Settings API route file exists")
    
    def test_all_routes_compile(self):
        """Verify all API routes compile without TypeScript errors"""
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            cwd='/app/modules/pos',
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"API routes have TypeScript errors:\n{result.stderr}"
        print("✓ All API route files compile without errors")


class TestLibraryExports:
    """Test that the library exports are correct"""
    
    def test_index_exports_permissions(self):
        """Verify permissions are exported from index"""
        script = """
        const lib = require('./src/lib/index.ts');
        console.log(JSON.stringify({
            hasPermission: typeof lib.hasPermission === 'function',
            hasAllPermissions: typeof lib.hasAllPermissions === 'function',
            hasAnyPermission: typeof lib.hasAnyPermission === 'function',
            canAssignRole: typeof lib.canAssignRole === 'function',
            POS_ROLE_HIERARCHY: typeof lib.POS_ROLE_HIERARCHY === 'object',
            POS_ROLE_PERMISSIONS: typeof lib.POS_ROLE_PERMISSIONS === 'object'
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['hasPermission'] == True, "hasPermission should be exported"
        assert data['hasAllPermissions'] == True, "hasAllPermissions should be exported"
        assert data['hasAnyPermission'] == True, "hasAnyPermission should be exported"
        assert data['canAssignRole'] == True, "canAssignRole should be exported"
        assert data['POS_ROLE_HIERARCHY'] == True, "POS_ROLE_HIERARCHY should be exported"
        assert data['POS_ROLE_PERMISSIONS'] == True, "POS_ROLE_PERMISSIONS should be exported"
        print("✓ All permission exports are available from index")
    
    def test_index_exports_sale_engine(self):
        """Verify sale engine is exported from index"""
        script = """
        const lib = require('./src/lib/index.ts');
        console.log(JSON.stringify({
            SaleEngine: typeof lib.SaleEngine === 'function',
            canTransition: typeof lib.canTransition === 'function',
            getValidTransitions: typeof lib.getValidTransitions === 'function',
            VALID_TRANSITIONS: typeof lib.VALID_TRANSITIONS === 'object',
            generateId: typeof lib.generateId === 'function'
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['SaleEngine'] == True, "SaleEngine should be exported"
        assert data['canTransition'] == True, "canTransition should be exported"
        assert data['getValidTransitions'] == True, "getValidTransitions should be exported"
        assert data['VALID_TRANSITIONS'] == True, "VALID_TRANSITIONS should be exported"
        assert data['generateId'] == True, "generateId should be exported"
        print("✓ All sale engine exports are available from index")
    
    def test_index_exports_event_bus(self):
        """Verify event bus is exported from index"""
        script = """
        const lib = require('./src/lib/index.ts');
        console.log(JSON.stringify({
            posEventBus: typeof lib.posEventBus === 'object',
            createEventEmitter: typeof lib.createEventEmitter === 'function',
            registerCoreSubscriber: typeof lib.registerCoreSubscriber === 'function'
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['posEventBus'] == True, "posEventBus should be exported"
        assert data['createEventEmitter'] == True, "createEventEmitter should be exported"
        assert data['registerCoreSubscriber'] == True, "registerCoreSubscriber should be exported"
        print("✓ All event bus exports are available from index")
    
    def test_index_exports_offline_queue(self):
        """Verify offline queue is exported from index"""
        script = """
        const lib = require('./src/lib/index.ts');
        console.log(JSON.stringify({
            OfflineQueue: typeof lib.OfflineQueue === 'function',
            OfflineSaleManager: typeof lib.OfflineSaleManager === 'function',
            OfflineSyncService: typeof lib.OfflineSyncService === 'function',
            OFFLINE_SAFE_ACTIONS: Array.isArray(lib.OFFLINE_SAFE_ACTIONS),
            ONLINE_REQUIRED_ACTIONS: Array.isArray(lib.ONLINE_REQUIRED_ACTIONS)
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['OfflineQueue'] == True, "OfflineQueue should be exported"
        assert data['OfflineSaleManager'] == True, "OfflineSaleManager should be exported"
        assert data['OfflineSyncService'] == True, "OfflineSyncService should be exported"
        assert data['OFFLINE_SAFE_ACTIONS'] == True, "OFFLINE_SAFE_ACTIONS should be exported"
        assert data['ONLINE_REQUIRED_ACTIONS'] == True, "ONLINE_REQUIRED_ACTIONS should be exported"
        print("✓ All offline queue exports are available from index")
    
    def test_index_exports_inventory_consumer(self):
        """Verify inventory consumer is exported from index"""
        script = """
        const lib = require('./src/lib/index.ts');
        console.log(JSON.stringify({
            POSInventoryService: typeof lib.POSInventoryService === 'function',
            generateEventId: typeof lib.generateEventId === 'function'
        }));
        """
        result = self._run_ts_script(script)
        data = json.loads(result)
        
        assert data['POSInventoryService'] == True, "POSInventoryService should be exported"
        assert data['generateEventId'] == True, "generateEventId should be exported"
        print("✓ All inventory consumer exports are available from index")
    
    def _run_ts_script(self, script: str) -> str:
        """Helper to run TypeScript code"""
        script_path = '/tmp/test_pos_script.ts'
        with open(script_path, 'w') as f:
            f.write(script)
        
        result = subprocess.run(
            ['npx', 'tsx', script_path],
            cwd='/app/modules/pos',
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"Script execution failed:\n{result.stderr}\n{result.stdout}")
        
        return result.stdout.strip()


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
