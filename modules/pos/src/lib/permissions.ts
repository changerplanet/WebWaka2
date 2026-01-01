/**
 * POS Permissions & Roles
 * 
 * CONSTRAINTS:
 * ✅ Roles extend Core RBAC (additive)
 * ✅ Core RBAC remains authoritative
 * ❌ No new identity system
 * 
 * POS permissions are ADDITIVE to Core tenant roles:
 * - Core: TENANT_ADMIN, TENANT_USER (identity + base access)
 * - POS: CASHIER, SUPERVISOR, MANAGER (module-specific capabilities)
 */

// ============================================================================
// POS ROLES (Extend Core RBAC)
// ============================================================================

/**
 * POS-specific roles (stored as tenant membership metadata)
 */
export type POSRole = 
  | 'POS_CASHIER'      // Basic sales operations
  | 'POS_SUPERVISOR'   // + Voids, refunds, overrides
  | 'POS_MANAGER'      // + All POS operations, settings

/**
 * Role hierarchy (higher includes all lower permissions)
 */
export const POS_ROLE_HIERARCHY: Record<POSRole, number> = {
  'POS_CASHIER': 1,
  'POS_SUPERVISOR': 2,
  'POS_MANAGER': 3
}

// ============================================================================
// POS PERMISSIONS
// ============================================================================

/**
 * All POS permissions
 */
export type POSPermission =
  // Sale Operations
  | 'pos.sale.create'
  | 'pos.sale.add_item'
  | 'pos.sale.remove_item'
  | 'pos.sale.update_quantity'
  | 'pos.sale.suspend'
  | 'pos.sale.resume'
  | 'pos.sale.resume_others'     // Resume sales from other staff
  | 'pos.sale.complete'
  | 'pos.sale.void'
  | 'pos.sale.void_others'       // Void sales from other staff
  
  // Discounts
  | 'pos.discount.apply_preset'  // Apply configured discounts
  | 'pos.discount.apply_custom'  // Apply manual discounts
  | 'pos.discount.override_max'  // Exceed max discount limit
  | 'pos.discount.approve'       // Approve discounts requiring approval
  
  // Payments
  | 'pos.payment.cash'
  | 'pos.payment.card'
  | 'pos.payment.other'
  | 'pos.payment.split'          // Split tender
  | 'pos.payment.no_sale'        // Open drawer without sale
  
  // Refunds
  | 'pos.refund.create'
  | 'pos.refund.without_receipt'
  | 'pos.refund.approve'         // Approve refunds above threshold
  
  // Layaway
  | 'pos.layaway.create'
  | 'pos.layaway.payment'
  | 'pos.layaway.cancel'
  | 'pos.layaway.cancel_with_forfeit'
  
  // Register Operations
  | 'pos.register.open'
  | 'pos.register.close'
  | 'pos.register.close_others'  // Close registers opened by others
  | 'pos.register.view_cash'     // View cash in drawer
  | 'pos.register.adjust_cash'   // Cash adjustments (drops, pickups)
  | 'pos.register.blind_close'   // Close without counting
  
  // Shift Management
  | 'pos.shift.start'
  | 'pos.shift.end'
  | 'pos.shift.end_others'       // End other staff shifts
  | 'pos.shift.view_others'      // View other staff shifts
  
  // Reporting
  | 'pos.report.own_sales'       // View own sales
  | 'pos.report.all_sales'       // View all sales
  | 'pos.report.register'        // Register reports
  | 'pos.report.staff'           // Staff performance
  | 'pos.report.export'          // Export reports
  
  // Settings
  | 'pos.settings.view'
  | 'pos.settings.edit'
  | 'pos.settings.discounts'     // Manage discount rules
  | 'pos.settings.registers'     // Manage registers
  | 'pos.settings.receipts'      // Receipt configuration

// ============================================================================
// PERMISSION MATRIX
// ============================================================================

/**
 * Permissions by role
 */
export const POS_ROLE_PERMISSIONS: Record<POSRole, POSPermission[]> = {
  'POS_CASHIER': [
    // Basic sale operations
    'pos.sale.create',
    'pos.sale.add_item',
    'pos.sale.remove_item',
    'pos.sale.update_quantity',
    'pos.sale.suspend',
    'pos.sale.resume',
    'pos.sale.complete',
    
    // Basic discounts
    'pos.discount.apply_preset',
    
    // Basic payments
    'pos.payment.cash',
    'pos.payment.card',
    'pos.payment.other',
    
    // Basic layaway
    'pos.layaway.create',
    'pos.layaway.payment',
    
    // Register
    'pos.register.open',
    'pos.register.close',
    'pos.register.view_cash',
    
    // Shift
    'pos.shift.start',
    'pos.shift.end',
    
    // Reporting
    'pos.report.own_sales'
  ],
  
  'POS_SUPERVISOR': [
    // All cashier permissions
    ...POS_ROLE_PERMISSIONS['POS_CASHIER'] || [],
    
    // Enhanced sale operations
    'pos.sale.resume_others',
    'pos.sale.void',
    
    // Enhanced discounts
    'pos.discount.apply_custom',
    'pos.discount.approve',
    
    // Split payments
    'pos.payment.split',
    'pos.payment.no_sale',
    
    // Refunds
    'pos.refund.create',
    
    // Enhanced layaway
    'pos.layaway.cancel',
    
    // Enhanced register
    'pos.register.adjust_cash',
    
    // Enhanced shift
    'pos.shift.view_others',
    
    // Enhanced reporting
    'pos.report.all_sales',
    'pos.report.register'
  ],
  
  'POS_MANAGER': [
    // All supervisor permissions (handled by hierarchy)
    
    // Full sale control
    'pos.sale.void_others',
    
    // Full discount control
    'pos.discount.override_max',
    
    // Full refund control
    'pos.refund.without_receipt',
    'pos.refund.approve',
    
    // Full layaway control
    'pos.layaway.cancel_with_forfeit',
    
    // Full register control
    'pos.register.close_others',
    'pos.register.blind_close',
    
    // Full shift control
    'pos.shift.end_others',
    
    // Full reporting
    'pos.report.staff',
    'pos.report.export',
    
    // Settings
    'pos.settings.view',
    'pos.settings.edit',
    'pos.settings.discounts',
    'pos.settings.registers',
    'pos.settings.receipts'
  ]
}

// Initialize hierarchy-based permissions
function buildPermissionsByRole(): Record<POSRole, Set<POSPermission>> {
  const result: Record<POSRole, Set<POSPermission>> = {
    'POS_CASHIER': new Set(POS_ROLE_PERMISSIONS['POS_CASHIER']),
    'POS_SUPERVISOR': new Set([
      ...POS_ROLE_PERMISSIONS['POS_CASHIER'],
      ...POS_ROLE_PERMISSIONS['POS_SUPERVISOR']
    ]),
    'POS_MANAGER': new Set([
      ...POS_ROLE_PERMISSIONS['POS_CASHIER'],
      ...POS_ROLE_PERMISSIONS['POS_SUPERVISOR'],
      ...POS_ROLE_PERMISSIONS['POS_MANAGER']
    ])
  }
  return result
}

export const POS_PERMISSIONS_BY_ROLE = buildPermissionsByRole()

// ============================================================================
// PERMISSION CHECKER
// ============================================================================

export interface POSStaffContext {
  userId: string
  tenantId: string
  email: string
  name?: string
  
  // Core role (from tenant membership)
  coreRole: 'TENANT_ADMIN' | 'TENANT_USER'
  
  // POS role (from tenant membership metadata)
  posRole: POSRole
  
  // Active session
  sessionId?: string
  registerId?: string
  shiftId?: string
}

export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiresApproval?: boolean
  approverRole?: POSRole
}

/**
 * Check if staff has permission
 */
export function hasPermission(
  staff: POSStaffContext,
  permission: POSPermission
): PermissionCheckResult {
  // Core TENANT_ADMIN always has all POS permissions
  if (staff.coreRole === 'TENANT_ADMIN') {
    return { allowed: true }
  }
  
  // Check POS role permissions
  const rolePermissions = POS_PERMISSIONS_BY_ROLE[staff.posRole]
  
  if (rolePermissions.has(permission)) {
    return { allowed: true }
  }
  
  // Check if requires approval from higher role
  const approverRole = getApproverRole(permission, staff.posRole)
  if (approverRole) {
    return {
      allowed: false,
      reason: `Requires ${approverRole} approval`,
      requiresApproval: true,
      approverRole
    }
  }
  
  return {
    allowed: false,
    reason: `Permission '${permission}' not granted to ${staff.posRole}`
  }
}

/**
 * Check multiple permissions (all must pass)
 */
export function hasAllPermissions(
  staff: POSStaffContext,
  permissions: POSPermission[]
): PermissionCheckResult {
  for (const permission of permissions) {
    const result = hasPermission(staff, permission)
    if (!result.allowed) {
      return result
    }
  }
  return { allowed: true }
}

/**
 * Check any permission (at least one must pass)
 */
export function hasAnyPermission(
  staff: POSStaffContext,
  permissions: POSPermission[]
): PermissionCheckResult {
  for (const permission of permissions) {
    const result = hasPermission(staff, permission)
    if (result.allowed) {
      return result
    }
  }
  return {
    allowed: false,
    reason: `None of the required permissions granted`
  }
}

/**
 * Get role that can approve a permission
 */
function getApproverRole(permission: POSPermission, currentRole: POSRole): POSRole | null {
  const currentLevel = POS_ROLE_HIERARCHY[currentRole]
  
  // Find the lowest role that has this permission
  for (const [role, level] of Object.entries(POS_ROLE_HIERARCHY)) {
    if (level > currentLevel && POS_PERMISSIONS_BY_ROLE[role as POSRole].has(permission)) {
      return role as POSRole
    }
  }
  
  return null
}

/**
 * Check if staff can approve for another staff
 */
export function canApproveFor(
  approver: POSStaffContext,
  permission: POSPermission
): boolean {
  // Must have the permission themselves
  const result = hasPermission(approver, permission)
  return result.allowed
}

// ============================================================================
// ROLE ASSIGNMENT VALIDATION
// ============================================================================

/**
 * Validate role assignment
 * Core TENANT_ADMIN can assign any role
 * POS_MANAGER can assign SUPERVISOR or CASHIER
 * POS_SUPERVISOR can assign CASHIER only
 */
export function canAssignRole(
  assigner: POSStaffContext,
  targetRole: POSRole
): boolean {
  // Core admin can do anything
  if (assigner.coreRole === 'TENANT_ADMIN') {
    return true
  }
  
  const assignerLevel = POS_ROLE_HIERARCHY[assigner.posRole]
  const targetLevel = POS_ROLE_HIERARCHY[targetRole]
  
  // Can only assign roles lower than own
  return assignerLevel > targetLevel
}

// ============================================================================
// ENFORCEMENT DECORATORS
// ============================================================================

/**
 * Permission enforcement points
 * Use these to document where permissions are checked
 */
export const ENFORCEMENT_POINTS = {
  // Sale operations
  'pos.sale.create': ['SaleEngine.create', 'POST /api/pos/sales'],
  'pos.sale.void': ['SaleEngine.void', 'POST /api/pos/sales/:id/void'],
  'pos.sale.void_others': ['SaleEngine.void (when sale.staffId !== current)'],
  
  // Discounts
  'pos.discount.apply_custom': ['SaleEngine.applyDiscount (type: CUSTOM)'],
  'pos.discount.override_max': ['SaleEngine.applyDiscount (when exceeds max)'],
  'pos.discount.approve': ['ApprovalService.approve (discount)'],
  
  // Payments
  'pos.payment.no_sale': ['RegisterService.openDrawer'],
  'pos.payment.split': ['SaleEngine.addPayment (multiple methods)'],
  
  // Refunds
  'pos.refund.create': ['RefundEngine.create', 'POST /api/pos/refunds'],
  'pos.refund.without_receipt': ['RefundEngine.create (no originalSaleId)'],
  'pos.refund.approve': ['ApprovalService.approve (refund above threshold)'],
  
  // Register
  'pos.register.close_others': ['RegisterService.close (when openedBy !== current)'],
  'pos.register.adjust_cash': ['RegisterService.adjustCash'],
  
  // Settings
  'pos.settings.edit': ['POST /api/pos/settings', 'PUT /api/pos/settings'],
} as const

// ============================================================================
// PERMISSION CHECK MIDDLEWARE (For API routes)
// ============================================================================

export type PermissionMiddleware = (
  permission: POSPermission | POSPermission[],
  options?: { requireAll?: boolean }
) => (staff: POSStaffContext) => PermissionCheckResult

export const checkPermission: PermissionMiddleware = (permission, options) => {
  return (staff: POSStaffContext): PermissionCheckResult => {
    if (Array.isArray(permission)) {
      return options?.requireAll
        ? hasAllPermissions(staff, permission)
        : hasAnyPermission(staff, permission)
    }
    return hasPermission(staff, permission)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getApproverRole
}
