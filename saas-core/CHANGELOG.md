# SaaS Core Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-01-01

### Added

#### Partner Attribution System (Phase 2.1)
Complete Partner-to-Tenant attribution with immutability guarantees.

**New Features:**
- Attribution methods: `PARTNER_CREATED`, `REFERRAL_LINK`, `MANUAL_ASSIGNMENT`
- Attribution window support (lifetime or time-bound)
- Immutability enforcement at application layer
- Lock mechanism after first successful billing

**New Schema Fields:**
- `PartnerReferral.attributionMethod` - How attribution was created
- `PartnerReferral.attributionWindowDays` - null = lifetime
- `PartnerReferral.attributionExpiresAt` - Calculated expiry date
- `PartnerReferral.createdByUserId` - Who created the attribution
- `Tenant.status: PENDING_ACTIVATION` - New status for partner-created tenants
- `Tenant.requestedModules` - Modules requested at creation
- `Tenant.activatedModules` - Modules actually provisioned
- `Tenant.activatedAt` - When tenant was activated

**New APIs:**
- `POST /api/attribution` - Create attribution via referral code
- `GET /api/attribution?tenantId=xxx` - Get attribution for tenant
- `POST /api/attribution/lock` - Lock attribution (internal)

**New Libraries:**
- `/src/lib/partner-attribution.ts` - Attribution service with validation

#### Partner-Assisted Tenant Creation (Phase 2.2)
Partner portal for creating tenants in pending state.

**New Features:**
- Partners can create tenants in `PENDING_ACTIVATION` state
- Module selection at creation time (POS, SVM, MVM)
- Automatic attribution with `PARTNER_CREATED` method
- Invitation URL generation for tenant signup
- Tenant activation after payment

**New APIs:**
- `POST /api/partners/{id}/tenants` - Create tenant in PENDING state
- `GET /api/partners/{id}/tenants` - List partner's tenants

**New Libraries:**
- `/src/lib/partner-tenant-creation.ts` - Tenant creation service

**New Audit Actions:**
- `ATTRIBUTION_CREATED` - New attribution link created
- `ATTRIBUTION_LOCKED` - Attribution locked after billing
- `ATTRIBUTION_LOCK_ATTEMPTED` - Failed modification attempt
- `ATTRIBUTION_REASSIGN_BLOCKED` - Reassignment blocked
- `PARTNER_TENANT_CREATED` - Partner created tenant
- `PARTNER_TENANT_ACTIVATED` - Tenant activated after payment

### Documentation
- Added `/docs/PARTNER_ATTRIBUTION.md` with complete flow documentation

---

## [1.1.1] - 2025-01-01

### Added

#### Partner Access Control Model
Comprehensive access control documentation and implementation for the Partner Program.

**Documentation:**
- Added `/docs/PARTNER_ACCESS_CONTROL.md` with complete access control model
- Role hierarchy diagrams (SUPER_ADMIN → PARTNER_OWNER → PARTNER_STAFF)
- Permission matrix for all partner operations
- Authorization flow documentation
- API request flow diagrams
- Audit requirements specification

**Key Concepts Documented:**
- Partner domain is completely isolated from Tenant domain
- Partners operate at platform level, not workspace level
- Hard boundary: Partner users can NEVER access tenant internals
- Role-based permissions with granular controls
- Comparison of Partner vs Tenant authorization models

**Authorization Library:**
- `partner-authorization.ts` with typed permissions
- Functions: `requirePartnerUser()`, `requirePartnerOwner()`, `requirePartnerAccess()`
- Permission checks: `hasPartnerPermission()`, `getPartnerPermissions()`
- Partner isolation enforcement at API level

---

## [1.1.0] - 2025-01-01

### Added

#### Partner Domain Models
Platform-level reseller/affiliate system - Partners are INDEPENDENT of Tenants.

**New Entities:**
- `Partner` - Reseller organization at platform level
- `PartnerUser` - Links User to Partner with role (OWNER, ADMIN, MEMBER)
- `PartnerAgreement` - Versioned contract terms with commission structure
- `PartnerReferralCode` - Trackable codes for attribution campaigns
- `PartnerReferral` - **IMMUTABLE** attribution link between Partner and Tenant
- `PartnerEarning` - Commission tracking per billing period

**New Enums:**
- `PartnerStatus` - PENDING, ACTIVE, SUSPENDED, TERMINATED
- `PartnerTier` - BRONZE, SILVER, GOLD, PLATINUM
- `PartnerRole` - PARTNER_OWNER, PARTNER_ADMIN, PARTNER_MEMBER
- `AgreementStatus` - DRAFT, ACTIVE, SUPERSEDED, TERMINATED
- `CommissionType` - PERCENTAGE, FIXED, TIERED
- `EarningStatus` - PENDING, APPROVED, PAID, DISPUTED, CANCELLED

**Key Design Decisions:**
- Partners exist at platform level (NOT tenants)
- PartnerReferral is immutable after creation
- Each tenant can have only ONE referral (database enforced)
- User can belong to only ONE partner organization
- Agreement versioning supports historical commission rates

**New Audit Actions:**
- PARTNER_CREATED, PARTNER_UPDATED, PARTNER_APPROVED
- PARTNER_SUSPENDED, PARTNER_TERMINATED
- PARTNER_USER_ADDED, PARTNER_USER_REMOVED
- PARTNER_AGREEMENT_CREATED, PARTNER_AGREEMENT_SIGNED, PARTNER_AGREEMENT_APPROVED
- PARTNER_REFERRAL_CREATED, PARTNER_REFERRAL_LOCKED
- PARTNER_EARNING_CREATED, PARTNER_EARNING_APPROVED, PARTNER_EARNING_PAID

#### Partner Isolation
- `validatePartnerAccess()` - Pre-query validation for partner-scoped models
- `createPartnerContext()` - Context builder with partner role info
- `withPartnerFilter()` / `withPartnerData()` - Safe query builders
- `PARTNER_SCOPED_MODELS` constant for isolation enforcement

### Documentation
- Added `/docs/PARTNER_DOMAIN_MODELS.md` with relationship diagrams

---

## [1.0.0] - 2025-12-31

### Added

#### Core Infrastructure
- Multi-tenant database schema with Prisma ORM
- PostgreSQL integration via Supabase
- Next.js 14 App Router architecture

#### Authentication
- Magic link (passwordless) authentication
- Session management with secure cookies
- Resend email integration

#### Authorization
- Role-based access control (RBAC)
- Global roles: SUPER_ADMIN, USER
- Tenant roles: TENANT_ADMIN, TENANT_USER
- Authorization helper functions

#### Tenant Isolation
- Application-level tenant isolation enforcement
- Cross-tenant access prevention
- SUPER_ADMIN bypass mechanism
- Violation logging

#### Multi-Tenancy
- Tenant resolution via hostname/subdomain
- Custom domain support with DNS verification
- Per-tenant branding (colors, logos, app name)

#### PWA & Offline
- Service Worker with background sync
- IndexedDB for offline data storage
- Offline action queue
- Dynamic PWA manifest per tenant

#### UI Components
- Settings page with 4 tabs (General, Members, Domains, Branding)
- Member management with role change
- Domain management with verification instructions
- Branding customization with live preview
- Offline status indicator

#### Admin Features
- Super Admin dashboard
- Tenant management (create, suspend, reactivate)
- Audit log viewing
- Tenant isolation testing

### API Endpoints
- Auth: magic-link, verify, session, logout
- Tenants: CRUD, settings, members, domains
- Admin: tenants, audit-logs, test-isolation

### Frozen API Surface
The following are now frozen and will not change without a major version bump:

```typescript
// Core exports from @/core
export {
  prisma,
  validateTenantAccess,
  createTenantContext,
  withTenantFilter,
  withTenantData,
  TenantIsolationError,
  isTenantScopedModel,
  getCurrentSession,
  requireAuth,
  requireSuperAdmin,
  requireTenantAdmin,
  requireTenantMember,
  resolveTenant,
  getTenantBranding,
  SAAS_CORE_VERSION
}

// TenantContext interface
interface TenantContext {
  tenantId: string | null
  userId: string | null
  isSuperAdmin: boolean
  bypassIsolation?: boolean
}
```

### Known Limitations
- Email sending requires verified domain with Resend
- DNS verification requires actual DNS records (cannot test locally)
- Offline sync works only in supported browsers

### Security Notes
- All tenant-scoped queries MUST use validateTenantAccess()
- Session cookies are HttpOnly and Secure
- Cross-tenant access is logged and blocked
- SUPER_ADMIN bypass is explicitly logged
