# Wave J.4: Tenant Context Hardening Report

## Overview

Wave J.4 implements a unified tenant resolution strategy across all public surfaces via a single authoritative `TenantContextResolver` service. This eliminates fragmented resolution logic scattered across 5+ different implementations and centralizes tenant validation, module capability checking, and demo detection into one canonical source.

## Implementation Summary

### Core Components Created

1. **TenantContext Type** (`frontend/src/lib/tenant-context/types.ts`)
   - Canonical representation of resolved tenant context
   - Server-side only - never passed directly to client components
   - Contains: tenantId, tenantSlug, tenantName, **tenantStatus**, branding, enabledModules, isDemo flag
   - **tenantStatus** preserves actual status (ACTIVE/SUSPENDED/PENDING/CANCELLED) for telemetry and downstream checks

2. **TenantContextResolver Service** (`frontend/src/lib/tenant-context/resolver.ts`)
   - Single authoritative resolver for all tenant resolution
   - Module-specific resolution methods with capability checking
   - Centralized demo detection logic
   - Unified error handling with typed result patterns

### Module-Specific Resolution Methods

| Method | Required Modules | Use Case |
|--------|------------------|----------|
| `resolveForSVM()` | svm, commerce, store | SVM storefront routes |
| `resolveForMVM()` | mvm, marketplace, commerce | MVM marketplace routes |
| `resolveForParkHub()` | parkhub, transport | ParkHub transport marketplace |
| `resolveForSitesFunnels()` | sites_funnels, sites, funnels, page_builder | Sites & Funnels pages |
| `resolveForOrders()` | **svm OR mvm only** | Canonical order/customer/proof APIs |

**Note**: `resolveForOrders()` requires SVM or MVM modules. ParkHub-only tenants do NOT have access to canonical orders/customers/proofs APIs - they have separate ticket-based APIs.

### Refactored Surfaces

#### API Routes (8 files)
- `frontend/src/app/api/orders/canonical/route.ts`
- `frontend/src/app/api/orders/canonical/[reference]/route.ts`
- `frontend/src/app/api/customers/canonical/route.ts`
- `frontend/src/app/api/customers/canonical/from-order/route.ts`
- `frontend/src/app/api/proofs/by-order/route.ts`
- `frontend/src/app/api/proofs/by-receipt/route.ts`
- `frontend/src/app/api/proofs/by-ticket/route.ts`
- `frontend/src/app/api/proofs/by-manifest/route.ts`

#### Domain Resolvers (3 files)
- `frontend/src/lib/storefront/tenant-storefront-resolver.ts` - SVM
- `frontend/src/lib/parkhub/parkhub-resolver.ts` - ParkHub
- `frontend/src/lib/sites-funnels/public-resolver.ts` - Sites & Funnels

## Demo Detection Strategy

Unified demo detection via `TenantContextResolver.isDemo()`:

```typescript
private static isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}
```

This replaces 5+ duplicate implementations scattered across resolvers.

## Module Alias System

Module capability checking supports aliases to handle naming variations:

```typescript
private static readonly moduleAliases: Record<string, string[]> = {
  'svm': ['svm', 'commerce', 'store'],
  'mvm': ['mvm', 'marketplace', 'commerce'],
  'parkhub': ['parkhub', 'transport'],
  'sites_funnels': ['sites_funnels', 'sites-funnels', 'sitesfunnels', 'sites', 'funnels', 'page_builder'],
}
```

## Security Model Consistency

### Demo Tenants
- Full access to all data
- Module capability checks bypassed
- Identified by slug starting with "demo" OR name containing "demo"

### Live Tenants
- Must be ACTIVE status
- Must have required module enabled
- Customer verification required for order/customer/proof access
- Email/phone must match stored data

## Client Exposure Patterns

### Critical Rule
**TenantContext must never be reconstructed client-side or passed verbatim to client components.**

### Recommended Pattern
Server-side resolution returns only necessary data:

```typescript
// Server component or API route
const result = await TenantContextResolver.resolveForSVM(slug)
if (!result.success) return notFound()

// Pass only what client needs
return {
  tenantId: result.context.tenantId,  // Client sees this
  isDemo: result.context.isDemo,       // For UI behavior
  // branding, etc.
}
```

### Known Client Exposure
Per Wave I documentation, tenantId is currently exposed to client bundles via SVMProvider and similar providers. This is acknowledged architectural debt requiring future isolation work (server-side API proxy layer).

## Constraints Enforced

All Wave J constraints maintained:
- ❌ No schema changes
- ❌ No migrations
- ❌ No mutations
- ❌ No business logic beyond resolution
- ❌ No background jobs
- ✅ Read-only Prisma queries only
- ✅ Tenant isolation enforced

## Gaps Documented

### GAP J4.1: No tenant context caching
- **What is missing**: Resolved tenant context is re-queried on every request
- **Why it cannot be solved in Wave J**: Caching would require new infrastructure
- **Impact**: Additional DB queries per request
- **Deferred to**: Post-Wave J performance optimization

### GAP J4.2: Module aliases not database-driven
- **What is missing**: Module name normalization is hardcoded
- **Why it cannot be solved in Wave J**: Schema changes forbidden
- **Impact**: New module names require code changes
- **Deferred to**: Post-Wave J - needs module registry

### GAP J4.3: Tenant context not cached in request scope
- **What is missing**: Same tenant resolved multiple times within single request
- **Why it cannot be solved in Wave J**: Would require request-scoped context infrastructure
- **Impact**: Redundant DB queries in complex handlers
- **Deferred to**: Post-Wave J - needs Next.js cache integration

## Files Changed

```
frontend/src/lib/tenant-context/
├── types.ts          # TenantContext type definition
├── resolver.ts       # TenantContextResolver service
└── index.ts          # Public exports

frontend/src/app/api/
├── orders/canonical/route.ts        # Refactored
├── orders/canonical/[reference]/route.ts  # Refactored
├── customers/canonical/route.ts     # Refactored
├── customers/canonical/from-order/route.ts  # Refactored
├── proofs/by-order/route.ts         # Refactored
├── proofs/by-receipt/route.ts       # Refactored
├── proofs/by-ticket/route.ts        # Refactored
└── proofs/by-manifest/route.ts      # Refactored

frontend/src/lib/storefront/
└── tenant-storefront-resolver.ts    # Refactored to use TenantContextResolver

frontend/src/lib/parkhub/
└── parkhub-resolver.ts              # Refactored to use TenantContextResolver

frontend/src/lib/sites-funnels/
└── public-resolver.ts               # Refactored to use TenantContextResolver
```

## Testing Recommendations

1. **Tenant Resolution Tests**
   - Valid active tenant with required module
   - Valid active tenant missing required module
   - Demo tenant bypassing module check
   - Suspended tenant rejection
   - Non-existent tenant 404

2. **Module Alias Tests**
   - Each alias resolves correctly
   - Case insensitivity preserved

3. **Security Tests**
   - Demo tenant full access
   - Live tenant requiring verification
   - Customer identifier validation

## Migration Notes

Existing code using domain resolvers continues to work unchanged. The refactoring is internal - all external interfaces preserved.

Example before/after (internal only):

```typescript
// Before (in tenant-storefront-resolver.ts)
const tenant = await prisma.tenant.findUnique(...)
if (!tenant) return { success: false, reason: 'not_found' }
// ... duplicate validation logic

// After
const result = await TenantContextResolver.resolveForSVM(tenantSlug)
if (!result.success) return { success: false, reason: result.reason }
```

---
**Wave J.4 Completed**: January 2026  
**Architect Review**: Approved
