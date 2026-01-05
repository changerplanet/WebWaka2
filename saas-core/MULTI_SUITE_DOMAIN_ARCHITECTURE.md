# WebWaka Multi-Suite, Multi-Domain Architecture Verification

## Document Purpose
This document verifies and documents how the WebWaka platform currently handles multi-suite, multi-domain operation for a single tenant.

---

## 1️⃣ TENANT MODEL & SUITE ISOLATION

### Current Design

**One Tenant = One Logical Organization**

The platform is designed such that:
- **One tenant = one logical organization** (e.g., "Acme Corporation")
- **Multiple capabilities/suites are activated within the same tenant**
- Tenants do NOT need to be duplicated for different suites

### Schema Evidence
```prisma
model Tenant {
  id     String @id
  name   String           // "Acme Corporation"
  slug   String @unique   // "acme"
  
  // Capabilities activated for this tenant
  requestedModules String[] // ["POS", "SVM", "MVM"]
  activatedModules String[] // Actually provisioned
  
  // Single subscription per tenant
  subscription Subscription?
  entitlements Entitlement[]
}

model TenantCapabilityActivation {
  tenantId String
  capabilityKey String    // "pos", "inventory", "crm", etc.
  status CapabilityStatus // ACTIVE, INACTIVE, SUSPENDED
  
  @@unique([tenantId, capabilityKey])
}
```

### How Suite-Level Isolation Works
- **Suites are NOT separate database entities** - they are marketing/configuration concepts
- A "Commerce Suite" means activating a bundle of capabilities: `pos`, `svm`, `mvm`, `inventory`, etc.
- A "Civic Suite" means activating: civic-specific capabilities
- **Both can be activated on the same tenant simultaneously**

### Shared Data Handling
| Data Type | Scope | Notes |
|-----------|-------|-------|
| Users | Tenant-wide | Users belong to tenant via `TenantMembership` |
| Billing | Tenant-wide | One `Subscription` per tenant |
| Capabilities | Per-activation | `TenantCapabilityActivation` tracks which are active |
| Branding | Tenant-wide | Currently single branding per tenant |
| Domains | Tenant-wide | Multiple domains can map to same tenant |

### Status: ✅ Already Implemented
- One tenant can have multiple capabilities activated
- Capability isolation via `TenantCapabilityActivation` table
- Shared user identity, billing, and core data across capabilities

---

## 2️⃣ DOMAIN & ROUTING MODEL

### Current Domain Resolution

The platform supports **multiple domains per tenant** but resolves to **tenant-level only** (not suite-aware).

### Resolution Order (from `middleware.ts` and `tenant-resolver.ts`)
1. **X-Tenant-ID header** (internal tools)
2. **?tenant= query parameter** (testing/preview)
3. **Tenant cookie** (session persistence)
4. **Custom domain** (full hostname match in `TenantDomain`)
5. **Subdomain** (extract first part of hostname)

### Schema Evidence
```prisma
model TenantDomain {
  id        String @id
  tenantId  String
  domain    String @unique  // "acme" or "app.acme.com"
  type      DomainType      // SUBDOMAIN or CUSTOM
  status    DomainStatus    // PENDING, VERIFIED, FAILED
  isPrimary Boolean
}
```

### Can a Tenant Map Multiple Domains?
**✅ YES** - A tenant can have multiple `TenantDomain` records:
- `acme.webwaka.app` (subdomain)
- `shop.acmedomain.com` (custom)
- `market.acmedomain.com` (custom)

### Is Domain Resolution Suite-Aware?
**🔴 NO** - Currently:
- Domain resolves to **tenant only**
- There is no `suiteId` or `capabilityKey` on `TenantDomain`
- All domains for a tenant show the **same dashboard/capabilities**

### Example: How Routing Would Currently Work
| Domain | Resolves To | Access |
|--------|------------|--------|
| `commerce.clientdomain.com` | Tenant "ClientCorp" | All activated capabilities |
| `civic.clientdomain.com` | Tenant "ClientCorp" | All activated capabilities |
| `school.clientdomain.com` | Tenant "ClientCorp" | All activated capabilities |

**They all show the same dashboard** because domain resolution is tenant-level, not suite-level.

### Status: 🟡 Partially Supported
- ✅ Multiple domains per tenant: **Supported**
- ✅ Custom domain verification: **Supported**
- 🔴 Domain → Suite routing: **NOT supported** (future enhancement)

---

## 3️⃣ BRANDING & WHITE-LABEL BEHAVIOR

### Current Branding Scope

**Branding is TENANT-WIDE only** - no per-suite or per-domain override.

### Schema Evidence
```prisma
model Tenant {
  // Branding (embedded in Tenant model)
  appName        String @default("SaaS App")
  logoUrl        String?
  faviconUrl     String?
  primaryColor   String @default("#6366f1")
  secondaryColor String @default("#8b5cf6")
}
```

### Branding Service (`branding.ts`)
```typescript
export interface TenantBranding {
  id: string
  name: string
  slug: string
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}
```

### Can Branding Be Different Per Suite/Domain?
**🔴 NO** - Currently:
- Same logo for POS and Civic platform
- Same colors across all domains
- Same PWA manifest for all entry points

### What's Intentionally Deferred
- Per-domain branding overrides
- Per-suite visual themes
- Capability-specific white-labeling

### Status: 🔴 Not Currently Supported
- ✅ Tenant-wide branding: **Supported**
- 🔴 Per-suite branding: **NOT supported**
- 🔴 Per-domain branding: **NOT supported**

---

## 4️⃣ AUTHENTICATION & USER CONTEXT

### Current Auth Model

**User access is TENANT-WIDE** with capability-level gating.

### Schema Evidence
```prisma
model User {
  id         String @id
  memberships TenantMembership[]  // User can belong to multiple tenants
}

model TenantMembership {
  userId   String
  tenantId String
  role     TenantRole  // TENANT_ADMIN or TENANT_USER
  
  @@unique([userId, tenantId])
}

model Session {
  userId       String
  activeTenant String?  // Currently selected tenant
}
```

### Auth Flow (from `AuthProvider.tsx`)
1. User authenticates (OTP/Magic Link)
2. Session stores `activeTenant` (currently selected tenant)
3. User can `switchTenant()` if they have multiple memberships
4. All capabilities within tenant are accessible (if activated)

### Cross-Domain Login Scenario
If a user logs in on `partyname.ng`:
- **Can they access only Civic Suite?** 🔴 NO - they access all activated capabilities
- **Can they switch to Commerce Suite without re-auth?** ✅ YES (within same tenant)

### User Access Scoping
| Level | Status |
|-------|--------|
| Tenant-wide | ✅ Implemented |
| Suite-scoped | 🔴 NOT implemented |
| Domain-scoped | 🔴 NOT implemented |

### RBAC + Capabilities Interaction
- RBAC is role-based: `TENANT_ADMIN`, `TENANT_USER`
- Capability access: checked via `TenantCapabilityActivation.status === 'ACTIVE'`
- **No domain-specific permissions exist**

### Status: 🟡 Partially Supported
- ✅ Multi-tenant user access: **Supported**
- ✅ Capability-gated access: **Supported**
- 🔴 Suite-scoped user sessions: **NOT supported**
- 🔴 Domain-scoped permissions: **NOT supported**

---

## 5️⃣ SUBSCRIPTIONS, BILLING & PARTNERS

### Current Subscription Model

**One subscription per tenant** - not per-suite.

### Schema Evidence
```prisma
model Subscription {
  id       String @id
  tenantId String @unique  // ONE subscription per tenant
  planId   String
  
  // Partner attribution (OPTIONAL)
  partnerReferralId String?
}

model PartnerReferral {
  partnerId String
  tenantId  String @unique  // ONE referral per tenant (immutable)
  
  attributionMethod AttributionMethod
  attributionLocked Boolean  // Locked after first billing
}
```

### Can Subscriptions Be Suite-Specific?
**🔴 NO** - Currently:
- Tenant has ONE subscription
- Subscription includes `includedModules` (which capabilities are included)
- Adding Commerce + Civic = single subscription with more modules

### Can Different Suites Be Activated by Different Partners?
**🔴 NO** - Currently:
- ONE `PartnerReferral` per tenant (immutable)
- The partner who referred the tenant gets attribution for ALL activity
- No per-suite or per-capability partner attribution

### Billing Aggregation
- All billing is aggregated at tenant level
- One invoice covers all activated capabilities
- Partner commission is calculated on tenant subscription total

### Status: 🟡 Partially Supported
- ✅ Tenant-wide subscription: **Supported**
- ✅ Partner attribution: **Supported**
- 🔴 Suite-specific subscriptions: **NOT supported**
- 🔴 Per-suite partner attribution: **NOT supported**

---

## 6️⃣ SUMMARY: CURRENT STATUS VS FUTURE DESIGN

| Feature | Status | Notes |
|---------|--------|-------|
| One tenant = multiple suites | ✅ Implemented | Via capability activation |
| Multiple domains per tenant | ✅ Implemented | `TenantDomain` table |
| Domain → Tenant resolution | ✅ Implemented | Works correctly |
| Domain → Suite resolution | 🔴 Not supported | All domains show same dashboard |
| Tenant-wide branding | ✅ Implemented | Logo, colors, PWA |
| Per-suite branding | 🔴 Not supported | Future enhancement |
| Per-domain branding | 🔴 Not supported | Future enhancement |
| Tenant-wide user access | ✅ Implemented | `TenantMembership` |
| Suite-scoped user sessions | 🔴 Not supported | Future enhancement |
| Single subscription per tenant | ✅ Implemented | Covers all suites |
| Suite-specific subscriptions | 🔴 Not supported | Future enhancement |
| Partner attribution (tenant) | ✅ Implemented | `PartnerReferral` |
| Partner attribution (per-suite) | 🔴 Not supported | Future enhancement |
| Capability isolation | ✅ Implemented | `TenantCapabilityActivation` |
| No cross-tenant data leakage | ✅ Implemented | Tenant ID on all queries |

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEBWAKA PLATFORM                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN RESOLUTION                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ shop.acme   │  │ civic.acme  │  │ school.acme │              │
│  │   .com      │  │   .com      │  │   .com      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│              ┌───────────────────┐                               │
│              │  TENANT: "Acme"   │  ◄── All domains resolve here │
│              └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TENANT CONTEXT                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    CAPABILITIES                           │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │   │
│  │  │ POS │ │ SVM │ │ MVM │ │ CRM │ │Civic│ │ HR  │  ...   │   │
│  │  │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │        │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │   BRANDING     │  │    USERS       │  │  SUBSCRIPTION  │     │
│  │  (Tenant-wide) │  │ (Tenant-wide)  │  │  (Tenant-wide) │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              PARTNER ATTRIBUTION                        │     │
│  │              (ONE partner per tenant)                   │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## GAP LIST (Without Proposed Solutions)

### Critical Gaps for Multi-Suite Multi-Domain

1. **Domain → Suite Routing**
   - Current: Domain → Tenant (all capabilities visible)
   - Gap: Cannot route `shop.domain.com` to POS only, `civic.domain.com` to Civic only

2. **Per-Domain Branding**
   - Current: Single branding for entire tenant
   - Gap: Cannot have different logos/colors for POS vs Civic platform

3. **Suite-Scoped User Sessions**
   - Current: User logs in, sees all tenant capabilities
   - Gap: Cannot restrict user to Civic-only access on `civic.domain.com`

4. **Per-Suite Partner Attribution**
   - Current: One partner gets credit for entire tenant
   - Gap: Cannot attribute Commerce to Partner A, Civic to Partner B

5. **Suite-Specific Subscriptions**
   - Current: One subscription covers all capabilities
   - Gap: Cannot bill Commerce Suite and Civic Suite separately

---

## CONCLUSION

**The platform CAN safely operate multiple suites within one tenant**, but with limitations:

✅ **What Works Today:**
- One tenant activates multiple capabilities (e.g., Commerce + Civic)
- Multiple domains can point to the same tenant
- Single user identity across all capabilities
- Single billing relationship
- Single partner attribution

🔴 **What Doesn't Work Today:**
- Different domains showing different suite "views"
- Per-domain branding customization
- Suite-scoped user sessions
- Per-suite partner attribution
- Suite-specific billing

**Data Safety Confirmed:**
- No cross-tenant data leakage (tenant ID on all queries)
- Capabilities are properly isolated via activation status
- Partner attribution is immutable once locked

---

*Document generated: January 4, 2026*
*Based on codebase analysis, not assumptions*
