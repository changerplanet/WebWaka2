# Phase 2: Platform Instances Architecture

**Version:** 1.0  
**Status:** IMPLEMENTED  
**Date:** January 4, 2026

---

## Overview

Phase 2 introduces **Platform Instances** - a concept that enables one tenant to operate multiple suites as distinct platforms, each with its own domain, branding, and navigation context.

## Core Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                         TENANT                                   │
│  (Single organization: "Acme Corporation")                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │  PLATFORM INSTANCE  │  │  PLATFORM INSTANCE  │               │
│  │  "Commerce Hub"     │  │  "Civic Platform"   │               │
│  │                     │  │                     │               │
│  │  Domain:            │  │  Domain:            │               │
│  │  shop.acme.com      │  │  civic.acme.com     │               │
│  │                     │  │                     │               │
│  │  Branding:          │  │  Branding:          │               │
│  │  Green theme, Logo1 │  │  Blue theme, Logo2  │               │
│  │                     │  │                     │               │
│  │  Visible Suites:    │  │  Visible Suites:    │               │
│  │  POS, Inventory,    │  │  Civic capabilities │               │
│  │  CRM, Accounting    │  │  only               │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SHARED (Tenant-Wide)                         │   │
│  │  - User identity & authentication                         │   │
│  │  - Billing & subscriptions                                │   │
│  │  - Partner attribution                                    │   │
│  │  - RBAC permissions                                       │   │
│  │  - Data (customers, products, orders)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### PlatformInstance

```prisma
model PlatformInstance {
  id       String @id @default(uuid())
  tenantId String

  // Identity
  name        String   // "Acme Commerce Hub"
  slug        String   // "commerce"
  description String?

  // Suite configuration
  suiteKeys String[]   // ["pos", "svm", "inventory", "crm"]

  // Branding (overrides tenant when set)
  displayName    String?
  logoUrl        String?
  faviconUrl     String?
  primaryColor   String?
  secondaryColor String?

  // Navigation config
  navigationConfig Json?

  // State
  isDefault Boolean @default(false)
  isActive  Boolean @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  tenant  Tenant         @relation(...)
  domains TenantDomain[]

  @@unique([tenantId, slug])
}
```

### TenantDomain (Updated)

```prisma
model TenantDomain {
  // ... existing fields ...
  
  // Phase 2: Instance mapping
  platformInstanceId String?
  platformInstance   PlatformInstance? @relation(...)
}
```

## Resolution Flow

### Domain → Tenant → Instance

```
Request: shop.acme.com
    │
    ▼
┌─────────────────────────┐
│  Domain Resolution      │
│  TenantDomain lookup    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Tenant: "Acme Corp"    │
│  TenantId: abc-123      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Instance Resolution    │
│  1. Domain mapping?     │◄── shop.acme.com → Instance "commerce"
│  2. Default instance    │◄── Fallback if no mapping
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Context Set:           │
│  - tenantId: abc-123    │
│  - instanceId: xyz-789  │
└─────────────────────────┘
```

## Branding Resolution

```
Instance Branding (if set)
    │
    ├── displayName ──► Use instance value
    ├── logoUrl     ──► Use instance value
    ├── primaryColor ──► Use instance value
    │
    ▼ (if not set)
Tenant Branding (fallback)
    │
    ├── appName     ──► Use tenant value
    ├── logoUrl     ──► Use tenant value
    ├── primaryColor ──► Use tenant value
    │
    ▼ (if not set)
Default WebWaka Branding
```

## Navigation Filtering

```typescript
// Instance has suiteKeys: ["pos", "inventory", "crm"]
// Tenant has active capabilities: ["pos", "inventory", "crm", "accounting", "logistics"]

// Visible in this instance:
// ✅ POS (in suiteKeys AND active)
// ✅ Inventory (in suiteKeys AND active)
// ✅ CRM (in suiteKeys AND active)
// ❌ Accounting (NOT in suiteKeys)
// ❌ Logistics (NOT in suiteKeys)
```

## Session Context

```typescript
interface SessionContext {
  userId: string
  
  // Tenant (existing)
  tenantId: string
  
  // Instance (Phase 2)
  platformInstanceId?: string  // Optional, derived from entry domain
}
```

**Key Points:**
- One login session only
- Instance context derived from entry domain
- Users can switch instances within same tenant
- No re-authentication required

## Default Behavior (Small Tenants)

For tenants that don't need multi-instance complexity:

1. **New Tenant Creation:**
   - Auto-creates ONE default instance
   - Default instance has empty `suiteKeys` (= all capabilities visible)
   - Uses tenant branding (no overrides)
   - Phase 1 experience unchanged

2. **Existing Tenant Migration:**
   - Migration script creates default instances
   - Safe, idempotent operation
   - No data changes, only adds instance records

## Phase 2 Boundaries

### ✅ IMPLEMENTED

| Feature | Description |
|---------|-------------|
| PlatformInstance model | Core data model for instances |
| Domain → Instance routing | Domain resolves to specific instance |
| Instance branding | Per-instance branding with fallback |
| Navigation filtering | Instance-scoped capability visibility |
| Session context | Instance ID in session (not separation) |
| Default instance | Auto-created for simple tenants |
| Migration endpoint | Safe migration for existing tenants |

### ❌ NOT IMPLEMENTED (Phase 3)

| Feature | Reason |
|---------|--------|
| Per-instance billing | Financial complexity |
| Per-instance subscriptions | Accounting challenges |
| Per-instance partner attribution | Commission disputes |
| Per-instance RBAC | Permission duplication |
| Per-instance data isolation | Data integrity |
| Separate auth per instance | UX complexity |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/platform-instances` | GET | List instances for tenant |
| `/api/admin/migrate-platform-instances` | POST | Migrate existing tenants |

## Files Changed

### New Files
- `src/lib/platform-instance/instance-service.ts`
- `src/lib/platform-instance/navigation-service.ts`
- `src/lib/platform-instance/default-instance.ts`
- `src/lib/platform-instance/guardrails.ts`
- `src/lib/platform-instance/index.ts`
- `src/app/api/platform-instances/route.ts`
- `src/app/api/admin/migrate-platform-instances/route.ts`

### Modified Files
- `prisma/schema.prisma` - Added PlatformInstance model, updated TenantDomain
- `src/lib/tenant-resolver.ts` - Added instance resolution
- `src/lib/branding.ts` - Added instance branding support
- `src/components/AuthProvider.tsx` - Added instance context

## Validation Checklist

- [x] All suites treated equally (no primary/secondary)
- [x] No module rewrites
- [x] No schema breakage (additive only)
- [x] Offline sync unaffected
- [x] Tenant isolation preserved
- [x] Existing tenants work unchanged
- [x] No per-instance billing
- [x] No per-instance partner attribution
- [x] Single auth system preserved

## Usage Example

```typescript
// Get instance-filtered navigation
import { filterNavigationByInstance, getDashboardNavigation } from '@/lib/platform-instance'

const allNavItems = getDashboardNavigation(tenant.slug)
const visibleNavItems = filterNavigationByInstance(
  allNavItems,
  activeInstance,
  activeCapabilities
)

// Check capability visibility
import { isCapabilityVisibleInInstance } from '@/lib/platform-instance'

if (isCapabilityVisibleInInstance('pos', activeInstance)) {
  // Show POS module
}
```

---

**Phase 2 Status: IMPLEMENTED**  
**Tag: Platform Instances v1**
