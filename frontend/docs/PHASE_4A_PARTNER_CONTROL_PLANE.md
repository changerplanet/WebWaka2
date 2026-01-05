# Phase 4A: Partner-First Control Plane

> **Status**: COMPLETE ✅
> **Tag**: Partner-First Control Plane v1
> **Depends On**: Phase 2 (Platform Instances) ✅
> **Blocks**: Phase 3 (Commercial Isolation)

---

## Overview

Phase 4A establishes Partners as the **only operators** of end-user platforms. WebWaka provides infrastructure; Partners operate and monetize.

### Core Principle
> WebWaka never sells directly to end users. All client platforms must be created and operated by Partners.

---

## What Phase 4A Delivers

### 1. Partner-First Policy Enforcement (Guards)
- Only `PARTNER_ADMIN` can create tenants
- Public signup cannot create standalone tenants
- All tenants must have immutable `partnerId`
- Enforce via backend guards, not just UI

### 2. Partner Dashboard UX
- "Create Client Platform" flow
  - Create Tenant
  - Create default Platform Instance
  - Assign domain (optional)
  - Invite tenant admin
- Client lifecycle management
- Instance management per client

### 3. Partner-Managed Platform Instances
- Partners can create instances for their clients
- Partners can assign suites/capabilities
- Partners can apply branding
- Partners can map domains

### 4. Partner-First Signup UX
- Marketing CTAs direct to partner onboarding
- End users must come via partners
- WebWaka never appears as direct seller
- Clear "Find a Partner" guidance

### 5. WebWaka Internal Partner Account
- "WebWaka Digital Services" as a normal Partner
- Used for demos, pilots, government projects
- No special system privileges

---

## What Phase 4A Does NOT Include

❌ Wholesale billing
❌ Revenue share calculations
❌ Partner payouts
❌ Per-instance subscriptions
❌ Financial isolation
❌ Commission tracking

These belong to Phase 3 and Phase 4B.

---

## Implementation Details

### Guard Implementation

```typescript
// Partner-First Tenant Creation Guard
export function assertPartnerOnlyTenantCreation(context: {
  creatorType: 'PARTNER' | 'PUBLIC_SIGNUP' | 'SUPER_ADMIN'
  partnerId?: string
}): void {
  // SUPER_ADMIN can only create for demo purposes via WebWaka partner
  if (context.creatorType === 'PUBLIC_SIGNUP') {
    throw new Error('TENANT_CREATION_REQUIRES_PARTNER')
  }
  
  if (context.creatorType === 'PARTNER' && !context.partnerId) {
    throw new Error('PARTNER_ID_REQUIRED')
  }
}
```

### Tenant Model Extension

```prisma
model Tenant {
  // ... existing fields
  
  // PHASE 4A: Immutable partner attribution
  createdByPartnerId String   // Required - who created this tenant
  createdByPartner   Partner  @relation(fields: [createdByPartnerId], references: [id])
}
```

### Public Signup Flow Changes

1. Remove tenant creation from public signup
2. Redirect to "Find a Partner" or "Become a Partner"
3. Partners provide signup links to their clients
4. Clients complete signup within partner context

---

## Database Changes

### New Fields on Tenant
- `createdByPartnerId` (String, required) - Immutable partner who created the tenant

### New Indexes
- Index on `Tenant.createdByPartnerId` for partner queries

---

## Migration Plan

1. Ensure WebWaka Digital Services partner exists
2. Assign existing orphan tenants to WebWaka partner
3. Add required `createdByPartnerId` constraint
4. Update signup flows

---

## Validation Checklist

- [x] WebWaka internal partner exists (`webwaka-digital-services`)
- [x] Orphan tenants assigned to WebWaka partner
- [x] Partner-First policy guards implemented
- [x] Partner Dashboard - Client creation wizard
- [x] Partner Dashboard - Client management UI
- [x] API endpoints for partner operations
- [x] Marketing CTAs direct to partner flow
- [x] No module logic touched
- [x] No schema changes beyond Phase 4A scope

---

## Exit Criteria

1. **Partner-Only**: No tenant can be created without partner attribution
2. **Partner Control**: Partners fully manage client lifecycle
3. **UX Separation**: End users clearly come via partners
4. **WebWaka Neutral**: Platform never appears as direct seller

---

## Files Modified/Created

### Services
- `/src/lib/partner-first/guards.ts` - Tenant creation guards
- `/src/lib/partner-first/policy.ts` - Policy enforcement
- `/src/lib/partner-tenant-creation.ts` - Updated with guards

### API Routes
- `/api/partner/clients/route.ts` - Partner client management
- `/api/partner/clients/[id]/instances/route.ts` - Instance management

### UI Components
- `/src/components/partner/ClientCreationWizard.tsx`
- `/src/components/partner/ClientManagement.tsx`
- `/src/components/partner/InstanceManagement.tsx`

### Pages
- `/dashboard/partner/clients/page.tsx` - Partner client list
- `/dashboard/partner/clients/new/page.tsx` - Create client wizard

---

## Freeze Marker

After validation: **Freeze as "Partner-First Control Plane v1"**
