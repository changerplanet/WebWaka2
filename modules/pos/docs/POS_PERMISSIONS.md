# POS Staff & Permissions

## Version: pos-v1.0.0
## Phase 5 Complete

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│              PERMISSION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   SAAS CORE (Authoritative)         POS MODULE (Additive)   │
│  ┌───────────────────────┐        ┌───────────────────────┐ │
│  │     Identity          │        │    POS Permissions    │ │
│  │  ┌─────────────────┐  │        │  ┌─────────────────┐  │ │
│  │  │ TENANT_ADMIN    │──┼────────┼─►│ ALL POS ACCESS  │  │ │
│  │  │ TENANT_USER     │──┼────────┼─►│ + POS Role      │  │ │
│  │  └─────────────────┘  │        │  │  ├─ CASHIER     │  │ │
│  │                       │        │  │  ├─ SUPERVISOR  │  │ │
│  │  Tenant Membership    │        │  │  └─ MANAGER     │  │ │
│  │  metadata.posRole ────┼────────┼──┘                    │ │
│  └───────────────────────┘        └───────────────────────┘ │
│                                                              │
│  ✅ Core RBAC = Identity + Base Access                      │
│  ✅ POS Roles = Module-specific capabilities (ADDITIVE)     │
│  ❌ POS does NOT create new identity system                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## POS Roles

| Role | Level | Description |
|------|-------|-------------|
| `POS_CASHIER` | 1 | Basic sales operations |
| `POS_SUPERVISOR` | 2 | + Voids, refunds, overrides, cash management |
| `POS_MANAGER` | 3 | + Full POS control, settings, all operations |

### Role Hierarchy

```
POS_MANAGER (Level 3)
    │
    ├── All SUPERVISOR permissions
    │
    └── POS_SUPERVISOR (Level 2)
            │
            ├── All CASHIER permissions
            │
            └── POS_CASHIER (Level 1)
                    │
                    └── Basic operations only
```

---

## Permission Matrix

### Sale Operations

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.sale.create` | ✅ | ✅ | ✅ |
| `pos.sale.add_item` | ✅ | ✅ | ✅ |
| `pos.sale.remove_item` | ✅ | ✅ | ✅ |
| `pos.sale.update_quantity` | ✅ | ✅ | ✅ |
| `pos.sale.suspend` | ✅ | ✅ | ✅ |
| `pos.sale.resume` | ✅ | ✅ | ✅ |
| `pos.sale.resume_others` | ❌ | ✅ | ✅ |
| `pos.sale.complete` | ✅ | ✅ | ✅ |
| `pos.sale.void` | ❌ | ✅ | ✅ |
| `pos.sale.void_others` | ❌ | ❌ | ✅ |

### Discounts

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.discount.apply_preset` | ✅ | ✅ | ✅ |
| `pos.discount.apply_custom` | ❌ | ✅ | ✅ |
| `pos.discount.override_max` | ❌ | ❌ | ✅ |
| `pos.discount.approve` | ❌ | ✅ | ✅ |

### Payments

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.payment.cash` | ✅ | ✅ | ✅ |
| `pos.payment.card` | ✅ | ✅ | ✅ |
| `pos.payment.other` | ✅ | ✅ | ✅ |
| `pos.payment.split` | ❌ | ✅ | ✅ |
| `pos.payment.no_sale` | ❌ | ✅ | ✅ |

### Refunds

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.refund.create` | ❌ | ✅ | ✅ |
| `pos.refund.without_receipt` | ❌ | ❌ | ✅ |
| `pos.refund.approve` | ❌ | ❌ | ✅ |

### Layaway

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.layaway.create` | ✅ | ✅ | ✅ |
| `pos.layaway.payment` | ✅ | ✅ | ✅ |
| `pos.layaway.cancel` | ❌ | ✅ | ✅ |
| `pos.layaway.cancel_with_forfeit` | ❌ | ❌ | ✅ |

### Register Operations

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.register.open` | ✅ | ✅ | ✅ |
| `pos.register.close` | ✅ | ✅ | ✅ |
| `pos.register.close_others` | ❌ | ❌ | ✅ |
| `pos.register.view_cash` | ✅ | ✅ | ✅ |
| `pos.register.adjust_cash` | ❌ | ✅ | ✅ |
| `pos.register.blind_close` | ❌ | ❌ | ✅ |

### Shift Management

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.shift.start` | ✅ | ✅ | ✅ |
| `pos.shift.end` | ✅ | ✅ | ✅ |
| `pos.shift.end_others` | ❌ | ❌ | ✅ |
| `pos.shift.view_others` | ❌ | ✅ | ✅ |

### Reporting

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.report.own_sales` | ✅ | ✅ | ✅ |
| `pos.report.all_sales` | ❌ | ✅ | ✅ |
| `pos.report.register` | ❌ | ✅ | ✅ |
| `pos.report.staff` | ❌ | ❌ | ✅ |
| `pos.report.export` | ❌ | ❌ | ✅ |

### Settings

| Permission | Cashier | Supervisor | Manager |
|------------|:-------:|:----------:|:-------:|
| `pos.settings.view` | ❌ | ❌ | ✅ |
| `pos.settings.edit` | ❌ | ❌ | ✅ |
| `pos.settings.discounts` | ❌ | ❌ | ✅ |
| `pos.settings.registers` | ❌ | ❌ | ✅ |
| `pos.settings.receipts` | ❌ | ❌ | ✅ |

---

## Enforcement Points

### Where Permissions Are Checked

```typescript
// API Route Level
app.post('/api/pos/sales/:id/void', 
  requirePermission('pos.sale.void'),
  voidSaleHandler
)

// Service Level
class SaleEngine {
  async void(input: VoidSaleInput): Promise<void> {
    // Check if voiding own sale or others
    const permission = input.saleStaffId === input.staffId 
      ? 'pos.sale.void' 
      : 'pos.sale.void_others'
    
    assertPermission(staff, permission)
    // ... proceed with void
  }
}

// UI Level (React)
{hasPermission(staff, 'pos.sale.void') && (
  <VoidButton onClick={handleVoid} />
)}
```

### Key Enforcement Points

| Permission | Enforcement Location |
|------------|---------------------|
| `pos.sale.void` | `SaleEngine.void()`, `POST /api/pos/sales/:id/void` |
| `pos.discount.apply_custom` | `SaleEngine.applyDiscount()` |
| `pos.refund.create` | `RefundEngine.create()`, `POST /api/pos/refunds` |
| `pos.register.adjust_cash` | `RegisterService.adjustCash()` |
| `pos.settings.edit` | `POST /api/pos/settings` |

---

## Approval Workflow

### When Approval Is Required

```
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CASHIER requests discount > max                            │
│      │                                                       │
│      ▼                                                       │
│  System: "Requires SUPERVISOR approval"                     │
│      │                                                       │
│      ▼                                                       │
│  SUPERVISOR enters credentials / scans badge                │
│      │                                                       │
│      ▼                                                       │
│  System: hasPermission(supervisor, 'pos.discount.approve')  │
│      │                                                       │
│      ├── YES ──► Apply discount, log approval               │
│      │                                                       │
│      └── NO ───► "Requires MANAGER approval"                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Approval Example

```typescript
// Cashier tries to apply large discount
const result = hasPermission(cashier, 'pos.discount.apply_custom')
// result: { 
//   allowed: false, 
//   requiresApproval: true, 
//   approverRole: 'POS_SUPERVISOR' 
// }

// Supervisor approves
if (canApproveFor(supervisor, 'pos.discount.apply_custom')) {
  await applyDiscountWithApproval(discount, supervisor.userId)
}
```

---

## Role Assignment

### Who Can Assign Roles

| Assigner | Can Assign |
|----------|------------|
| TENANT_ADMIN (Core) | Any POS role |
| POS_MANAGER | SUPERVISOR, CASHIER |
| POS_SUPERVISOR | CASHIER only |
| POS_CASHIER | None |

### Storage (In Core)

```typescript
// Stored in Core's TenantMembership metadata
{
  userId: 'user-123',
  tenantId: 'tenant-456',
  role: 'TENANT_USER',       // Core role
  metadata: {
    posRole: 'POS_SUPERVISOR' // POS-specific role
  }
}
```

---

## Integration with Core RBAC

### Authentication Flow

```
1. User logs in via Core
2. Core validates identity + tenant membership
3. Core returns session with:
   - userId
   - tenantId
   - coreRole (TENANT_ADMIN | TENANT_USER)
   - metadata.posRole (POS_CASHIER | POS_SUPERVISOR | POS_MANAGER)
4. POS module reads posRole for permission checks
```

### Core TENANT_ADMIN Override

```typescript
// TENANT_ADMIN always has full POS access
if (staff.coreRole === 'TENANT_ADMIN') {
  return { allowed: true }
}
```

---

## Usage Examples

### Check Single Permission

```typescript
import { hasPermission } from '@pos/lib/permissions'

const staff: POSStaffContext = {
  userId: 'user-123',
  tenantId: 'tenant-456',
  email: 'cashier@store.com',
  coreRole: 'TENANT_USER',
  posRole: 'POS_CASHIER'
}

const result = hasPermission(staff, 'pos.sale.void')
// { allowed: false, reason: "Requires POS_SUPERVISOR approval", requiresApproval: true }
```

### Check Multiple Permissions

```typescript
// All must pass
const result = hasAllPermissions(staff, [
  'pos.sale.create',
  'pos.payment.cash'
])

// Any must pass
const result = hasAnyPermission(staff, [
  'pos.refund.create',
  'pos.refund.approve'
])
```

### UI Permission Check

```tsx
function SaleActions({ staff, sale }) {
  return (
    <div>
      <CompleteButton />
      
      {hasPermission(staff, 'pos.sale.void').allowed && (
        <VoidButton sale={sale} />
      )}
      
      {hasPermission(staff, 'pos.refund.create').allowed && (
        <RefundButton sale={sale} />
      )}
    </div>
  )
}
```

---

## 🛑 VERIFICATION

### Permissions are additive only ✅

```
Core RBAC (Identity)     +     POS Permissions (Capabilities)
─────────────────────────────────────────────────────────────
TENANT_USER              +     POS_CASHIER     = Basic POS ops
TENANT_USER              +     POS_SUPERVISOR  = + Voids, refunds
TENANT_USER              +     POS_MANAGER     = + Full control
TENANT_ADMIN             +     (any/none)      = Full access
```

POS does NOT:
- Create new users
- Manage passwords
- Issue sessions
- Bypass Core authentication

### Core RBAC remains authoritative ✅

| Authority | System |
|-----------|--------|
| User identity | Core |
| Authentication | Core |
| Session management | Core |
| Tenant membership | Core |
| POS role storage | Core (metadata) |
| POS permission checks | POS (reads from Core) |

---

## Summary

| Requirement | Implementation |
|-------------|----------------|
| Extend Core RBAC | ✅ POS roles as metadata |
| No new identity | ✅ Uses Core auth |
| Role hierarchy | ✅ CASHIER < SUPERVISOR < MANAGER |
| Permission matrix | ✅ 40+ granular permissions |
| Enforcement points | ✅ API + Service + UI |
| Approval workflow | ✅ Higher role can approve |

---

## Ready for MODULE 1 · PHASE 6 — POS UI & UX (PWA)
