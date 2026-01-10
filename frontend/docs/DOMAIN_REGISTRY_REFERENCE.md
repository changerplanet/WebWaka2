# Domain Registry Reference

**Version:** 1.0  
**Date:** January 9, 2026  
**Classification:** Configuration Reference

---

## Overview

The Domain Registry is a config-based system for managing partner domain governance. It provides:

- Domain-to-tenant mapping
- Lifecycle state management
- Multi-suite domain support
- Regulator mode flagging

**Important:** This registry is config-based. No database tables are involved.

---

## Domain Configuration Schema

```typescript
interface DomainConfig {
  // Required
  domain: string           // e.g., 'retailstore.ng'
  partner_slug: string     // e.g., 'webwaka-demo-partner'
  tenant_slug: string      // e.g., 'demo-retail-store'
  lifecycle_state: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  enabled_suites: string[] // e.g., ['commerce', 'inventory']
  primary_suite: string    // e.g., 'commerce'
  
  // Optional
  regulator_mode?: boolean // Default: false
  last_verified?: string   // ISO timestamp
  description?: string     // Human-readable description
}
```

---

## Lifecycle States

### PENDING

**Meaning:** Domain registration is complete but activation is in progress.

**Behavior:**
- All requests to this domain are redirected to `/domain-pending`
- No application routes are accessible
- Partner and tenant context is not injected

**Resolution:**
- Platform administrator changes state to `ACTIVE`
- Requires governance approval

### ACTIVE

**Meaning:** Domain is live and resolving normally.

**Behavior:**
- Requests route to application
- Governance headers are injected
- Suite access is enforced
- Tenant context is available

### SUSPENDED

**Meaning:** Domain access has been suspended pending review.

**Behavior:**
- All requests to this domain are redirected to `/domain-suspended`
- No application routes are accessible
- Suspension is a governance action

**Resolution:**
- Contact partner administrator
- Review suspension notice
- Submit resolution documentation
- Platform administrator lifts suspension

---

## Multi-Suite Domain Support

### Configuration

```typescript
{
  domain: 'multisuite.webwaka.com',
  partner_slug: 'webwaka-demo-partner',
  tenant_slug: 'demo-retail-store',
  lifecycle_state: 'ACTIVE',
  enabled_suites: ['commerce', 'inventory', 'accounting', 'crm'],
  primary_suite: 'commerce',
}
```

### Routing Rules

| Path | Resolution |
|------|------------|
| `/` | Primary suite (commerce) |
| `/pos` | Commerce suite |
| `/inventory` | Inventory suite |
| `/accounting` | Accounting suite |
| `/crm` | CRM suite |
| `/education` | **404** (not enabled) |
| `/health` | **404** (not enabled) |

### Important Notes

- Disabled suite paths return **404**, not redirects
- No suite switcher UI is required
- No cross-suite data sharing
- Each suite operates independently

---

## Suite Path Mapping

| Path Prefix | Suite |
|-------------|-------|
| `/pos` | commerce |
| `/inventory` | inventory |
| `/accounting` | accounting |
| `/crm` | crm |
| `/education`, `/school` | education |
| `/health`, `/clinic` | health |
| `/hospitality`, `/hotel` | hospitality |
| `/civic`, `/govtech` | civic |
| `/logistics` | logistics |
| `/warehouse` | warehouse |
| `/parkhub`, `/transport` | parkhub |
| `/political`, `/campaign` | political |
| `/church` | church |
| `/real-estate` | real-estate |
| `/recruitment` | recruitment |
| `/legal` | legal |
| `/project` | project |

---

## Governance Headers

When a domain is resolved, the following headers are injected:

| Header | Value | Description |
|--------|-------|-------------|
| `x-ww-suite` | Suite key | Current suite context |
| `x-ww-tenant` | Tenant slug | Tenant identifier |
| `x-ww-partner` | Partner slug | Partner identifier |
| `x-ww-domain-state` | Lifecycle state | PENDING/ACTIVE/SUSPENDED |
| `x-ww-regulator-mode` | `true` | Only if regulator mode enabled |

---

## Demo Partner Domains

The following domains are registered for the Demo Partner:

| Domain | Tenant | Suites | Notes |
|--------|--------|--------|-------|
| `demo-retail.webwaka.com` | demo-retail-store | commerce, inventory, accounting | Commerce demo |
| `demo-school.webwaka.com` | demo-school | education | Education demo |
| `demo-clinic.webwaka.com` | demo-clinic | health | Health demo |
| `demo-hotel.webwaka.com` | demo-hotel | hospitality | Hospitality demo |
| `demo-church.webwaka.com` | demo-church | church | Church demo |
| `demo-political.webwaka.com` | demo-political | political | Political demo |
| `demo-civic.webwaka.com` | demo-civic | civic | Civic demo (regulator mode) |
| `multisuite.webwaka.com` | demo-retail-store | commerce, inventory, accounting, crm | Multi-suite demo |

---

## Adding a New Domain

To add a new domain to the registry:

1. Edit `/app/frontend/src/lib/domains/registry.ts`
2. Add a new entry to `DOMAIN_REGISTRY`
3. Set `lifecycle_state` to `PENDING`
4. Deploy changes
5. Verify domain is in pending state
6. Update `lifecycle_state` to `ACTIVE` after verification

**Note:** This is a governance-controlled process. Production changes require platform approval.

---

## API Reference

### Lookup Functions

```typescript
// Get domain configuration
getDomainConfig(domain: string): DomainConfig | undefined

// Get all domains for a partner
getDomainsForPartner(partnerSlug: string): DomainConfig[]

// Get all domains for a tenant
getDomainsForTenant(tenantSlug: string): DomainConfig[]

// Check if suite is enabled
isSuiteEnabledForDomain(domain: string, suite: string): boolean

// Get primary suite
getPrimarySuiteForDomain(domain: string): string | undefined

// Check lifecycle state
isDomainActive(domain: string): boolean
isDomainPending(domain: string): boolean
isDomainSuspended(domain: string): boolean
```

### Middleware Helpers

```typescript
// Resolve domain for request
resolveDomainForRequest(hostname: string, pathname: string): DomainResolutionResult

// Create redirect responses
createPendingRedirect(request: NextRequest): NextResponse
createSuspendedRedirect(request: NextRequest): NextResponse
createSuiteDisabledResponse(): NextResponse

// Inject governance headers
injectGovernanceHeaders(response: NextResponse, result: DomainResolutionResult): NextResponse
```

---

## Governance Rules

1. **Domains are governed by FREEZE rules**
   - Lifecycle changes require platform approval
   - Suite enablement is controlled centrally
   - Regulator access follows strict protocols

2. **Partner visibility is read-only**
   - Partners can view their domains at `/partners/admin`
   - No mutations are allowed from partner UI
   - Changes require platform governance process

3. **All actions are logged**
   - Domain resolution is tracked
   - Lifecycle changes are audited
   - Regulator access is logged with full context

---

**END OF REFERENCE**
