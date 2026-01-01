# POS Module Entitlements

## Version: pos-entitlements-v1.0.0
## Phase 8 Complete

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   POS MODULE    │ ──────▶ │   SaaS CORE     │
│ (checks limits) │  query  │ (owns billing)  │
└─────────────────┘         └─────────────────┘
```

**Key Principle:** POS checks entitlements; POS does NOT know plan names or billing logic.

---

## Entitlements

### Feature Entitlements

| Entitlement | Description | Default |
|-------------|-------------|---------|
| `pos.access` | Basic POS access | Required |
| `pos.offline_enabled` | Offline mode | Optional |
| `pos.multi_register` | Multiple registers | Optional |
| `pos.layaway` | Layaway feature | Optional |
| `pos.advanced_discounts` | Custom discount rules | Optional |
| `pos.custom_receipts` | Custom receipt templates | Optional |
| `pos.reports` | Access to reports | Optional |
| `pos.api_access` | External API access | Optional |

### Numeric Limits

| Limit | Description | Default |
|-------|-------------|---------|
| `maxLocations` | Max store locations | 1 |
| `maxRegisters` | Max registers per location | 1 |
| `maxStaff` | Max POS staff per tenant | 5 |
| `maxOfflineTransactions` | Offline queue limit | 50 |
| `maxProductsCache` | Cached products limit | 500 |

---

## Check Functions

### Feature Checks

```typescript
import { hasEntitlement, canUseOffline, canUseLayaway } from '@pos/lib/entitlements'

// Check specific feature
const result = hasEntitlement(context, 'pos.layaway')
if (!result.allowed) {
  showMessage(result.reason)
  // "Feature not available"
}

// Check offline capability
const offline = canUseOffline(context)
if (!offline.allowed) {
  disableOfflineMode()
}
```

### Limit Checks

```typescript
import { canAddRegister, canAddStaff, canCreateOfflineTransaction } from '@pos/lib/entitlements'

// Before adding a register
const registerCheck = canAddRegister(context, currentRegisterCount)
if (!registerCheck.allowed) {
  showError(registerCheck.reason)
  // "Maximum 1 registers reached"
  showUpgradeHint(registerCheck.upgradeHint)
  // "Enable multi-register support to add more registers"
}

// Before adding staff
const staffCheck = canAddStaff(context, currentStaffCount)

// Before creating offline transaction
const offlineCheck = canCreateOfflineTransaction(context, pendingCount)
```

---

## Loading Context from Core

```typescript
import { loadEntitlementContext, type CoreEntitlementService } from '@pos/lib/entitlements'

// Core implements this interface
const coreService: CoreEntitlementService = {
  async getEntitlements(tenantId: string) {
    // Call Core's entitlement API
    const response = await fetch(`/api/entitlements/${tenantId}/POS`)
    return response.json()
  }
}

// Load context at POS initialization
const context = await loadEntitlementContext(tenantId, coreService)

// Use context throughout session
store.set('posEntitlements', context)
```

---

## Failure Handling

### API Errors

```typescript
import { createEntitlementError, getFailureMessage } from '@pos/lib/entitlements'

// For API responses
if (!result.allowed) {
  return Response.json(
    createEntitlementError(result),
    { status: 403 }
  )
}
// Response: { code: 'ENTITLEMENT_DENIED', message: '...', upgradeHint: '...' }
```

### UI Handling

```typescript
// For user-facing messages
if (!result.allowed) {
  toast.error(getFailureMessage(result))
  
  if (result.upgradeHint) {
    toast.info(result.upgradeHint)
  }
}
```

### Graceful Degradation

```typescript
// When Core is unavailable
try {
  const context = await loadEntitlementContext(tenantId, coreService)
} catch (error) {
  // Returns minimal entitlements (fail closed for paid features)
  // - pos.access: granted
  // - paid features: denied
  // - limits: defaults
}
```

---

## Integration Points

### POS Startup

```typescript
// In POS initialization
async function initPOS(tenantId: string) {
  // 1. Load entitlements
  const context = await loadEntitlementContext(tenantId, coreService)
  
  // 2. Check base access
  if (!context.entitlements.has('pos.access')) {
    throw new Error('POS access not granted')
  }
  
  // 3. Configure features based on entitlements
  if (context.entitlements.has('pos.offline_enabled')) {
    enableOfflineMode()
  }
  
  if (!context.entitlements.has('pos.layaway')) {
    hideLayawayFeature()
  }
  
  // 4. Store context
  posStore.setEntitlements(context)
}
```

### Action Guards

```typescript
// In API routes or UI handlers
async function createRegister(data: RegisterInput) {
  const context = getPOSEntitlements()
  const currentCount = await getRegisterCount()
  
  const check = canAddRegister(context, currentCount)
  if (!check.allowed) {
    throw new EntitlementError(check)
  }
  
  // Proceed with creation...
}
```

---

## What POS Does NOT Know

| Core Concept | POS Knowledge |
|--------------|---------------|
| Plan names ("Pro", "Enterprise") | ❌ No |
| Plan prices | ❌ No |
| Billing status | ❌ No |
| Payment history | ❌ No |
| Subscription dates | Only `expiresAt` |
| Upgrade paths | ❌ No |

---

## Verification Checklist

- [x] No billing logic present
- [x] No plan names referenced
- [x] Entitlements are feature-based
- [x] Limits are numeric, not plan-specific
- [x] Failure messages are user-friendly
- [x] No upgrade prompts mention specific plans
- [x] Graceful degradation on Core unavailable

---

## Ready for Phase 9 - Module Freeze
