# SaaS Core Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2025-01-01

### Added

#### Payout Readiness System (Phase 5)
Complete payout preparation WITHOUT actual money movement.

**New Schema Models:**
- `PartnerPayoutSettings` - Partner-specific payout configuration
  - Minimum payout thresholds
  - Tax withholding settings
  - Payment method tracking
  - Payout hold status

**Enhanced PayoutBatch:**
- Added `grossAmount`, `taxWithholding`, `netAmount` breakdown
- Added `readinessChecks` and `readinessStatus`
- Added cancellation tracking
- Status: DRAFT → PENDING_APPROVAL → APPROVED → READY

**New Services:**
- `/src/lib/payout-readiness.ts` - Complete payout readiness service

**Features:**
- **Payable Balance Tracking**: Per-partner breakdown (pending, cleared, approved, inBatch)
- **Payout Thresholds**: Configurable minimums per partner (default $100)
- **Tax Withholding Hooks**: Rate configuration, document status tracking
- **Payout Holds**: Apply/release holds with reasons
- **Readiness Checks**: 6-point verification (status, threshold, hold, tax, payment, agreement)
- **Reporting Views**: Partner reports, platform summary

**Key Verification:**
- ✅ No actual payout execution (`EXECUTION_ENABLED: false`)
- ✅ No payment gateway integration
- ✅ Only readiness and reporting

### Documentation
- Added `/docs/PAYOUT_READINESS.md` with complete system documentation

---

## [1.4.0] - 2025-01-01

### Added

#### Commission & Earnings Engine (Phase 4)
Flexible commission calculation and immutable earnings ledger.

**Commission Model Engine:**
- Supported models: PERCENTAGE, FIXED, TIERED, HYBRID
- Commission triggers: ON_PAYMENT, ON_ACTIVATION, ON_RENEWAL, ON_SIGNUP
- One-time setup fees in addition to recurring commissions
- Volume-based tier support
- Min/max commission caps
- Hybrid models with conditional rules
- Full calculation breakdown for audit

**Earnings Ledger:**
- Immutable, append-only ledger
- Entry types: CREDIT (earnings), DEBIT (reversals)
- Status machine: PENDING → CLEARED → APPROVED → PAID
- Reversal via DEBIT entries (no direct edits)
- Idempotency keys prevent duplicate processing
- Full audit trail on all state changes

**Schema Enhancements:**
- `PartnerAgreement`: Added `commissionTrigger`, `fixedAmount`, `setupFee`, `commissionRules`, `minCommission`, `maxCommission`, `clearanceDays`
- `PartnerEarning`: Added `entryType`, `idempotencyKey`, `subscriptionEventId`, `calculationDetails`, state timestamps, reversal linking
- New enums: `CommissionTrigger`, `EarningEntryType`
- Enhanced `EarningStatus`: PENDING, CLEARED, APPROVED, PAID, DISPUTED, REVERSED, VOIDED
- New model: `PayoutBatch` for Phase 5

**New Services:**
- `/src/lib/commission-engine.ts` - Declarative commission calculation
- `/src/lib/earnings-ledger.ts` - Append-only earnings ledger

**Key Verification:**
- ✅ No assumptions about pricing - rules are declarative
- ✅ No hardcoded logic - all from agreement configuration
- ✅ Earnings are append-only - no direct edits
- ✅ Reversals create DEBIT entries

### Documentation
- Added `/docs/COMMISSION_EARNINGS.md` with examples and state machine

---

## [1.3.0] - 2025-01-01

### Added

#### Subscription & Entitlement System (Phase 3)
Complete subscription engine with entitlements and lifecycle events.

**New Schema Models:**
- `SubscriptionPlan` - Plan definitions with module bundles and pricing
- `Subscription` - Tenant subscriptions with optional partner attribution
- `Entitlement` - Module access grants (the only interface for modules)
- `SubscriptionEvent` - Immutable event log for commission calculation
- `Invoice` - Billing records

**New Enums:**
- `SubscriptionStatus` - PENDING, TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED, PAUSED
- `BillingInterval` - MONTHLY, QUARTERLY, YEARLY
- `EntitlementStatus` - ACTIVE, SUSPENDED, EXPIRED
- `SubscriptionEventType` - All lifecycle events

**New Services:**
- `/src/lib/entitlements.ts` - Module access checks (USE THIS IN MODULES)
- `/src/lib/subscription.ts` - Subscription management
- `/src/lib/subscription-events.ts` - Event emission and listening

**Key Features:**
- Subscriptions have OPTIONAL partner attribution (partnerReferralId can be null)
- Modules only check entitlements, NOT subscriptions or payments
- Partner/commission logic isolated from modules
- Events are module-agnostic

**Subscription Events:**
- `SUBSCRIPTION_CREATED` - New subscription created
- `SUBSCRIPTION_ACTIVATED` - After first successful payment
- `SUBSCRIPTION_RENEWED` - After renewal payment
- `SUBSCRIPTION_CANCELLED` - After cancellation

**Event Schema Includes:**
- `tenantId` (required)
- `partnerId` (OPTIONAL - null if no partner)
- `modules[]` (module-agnostic list)
- `billingAmount`, `billingCurrency`, `billingInterval`
- `periodStart`, `periodEnd`

### Documentation
- Added `/docs/SUBSCRIPTION_ENTITLEMENT.md` with complete system documentation

---

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
