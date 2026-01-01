# SaaS Core - Product Requirements Document

## Overview
Production-grade, reusable SaaS Core with Next.js App Router, PostgreSQL (Prisma ORM), and multi-tenant architecture.

## Core Requirements

### Architecture
- True multi-tenancy with strict data isolation
- Middleware-based tenant resolution (subdomains/custom domains)
- Application-layer data isolation engine

### Roles
- **SUPER_ADMIN**: Platform-wide access to all tenants and partners
- **TENANT_ADMIN**: Full control within a tenant workspace
- **TENANT_USER**: Regular member with limited permissions
- **PARTNER_OWNER**: Full control within partner organization
- **PARTNER_STAFF**: Limited operational access within partner organization

### Branding
- Full white-label branding per tenant (app name, logo, colors)
- Dynamic PWA manifest per tenant

### Offline & PWA
- Progressive Web App with offline-first behavior
- Service Worker with background sync
- IndexedDB for offline data storage

### Partner Program
- Platform-level reseller/affiliate system
- Completely isolated from tenant and module structure
- Partner-specific domain models, roles, access control
- Attribution system with immutability guarantees
- Partner-assisted tenant creation

---

## Implementation Status

### Completed Features

#### Core Infrastructure ✅
- Multi-tenant database schema with Prisma ORM
- PostgreSQL integration via Supabase
- Next.js 14 App Router architecture
- Middleware-based tenant resolution

#### Authentication ✅
- Magic link (passwordless) authentication
- Session management with secure cookies
- Resend email integration (dev-mode UI display)

#### Tenant Features ✅
- Role-based access control (RBAC)
- Application-layer tenant isolation enforcement
- Custom domain support with DNS verification
- Per-tenant branding customization
- Settings page with member/domain/branding management

#### PWA & Offline ✅
- Service Worker implementation
- IndexedDB helpers and React hooks
- Offline status components
- Dynamic PWA manifest

#### Super Admin Dashboard ✅
- Tenant management (create, suspend, reactivate)
- Audit log viewing
- Tenant isolation testing

#### Partner Program - Phase 1 ✅
- Partner domain models in Prisma schema
- PartnerRole enum (PARTNER_OWNER, PARTNER_STAFF)
- Partner authorization library
- Partner Access Control Documentation

#### Partner Program - Phase 2 ✅ (2025-01-01)
- **Attribution System**: Immutable Partner-to-Tenant attribution
- **Attribution Methods**: PARTNER_CREATED, REFERRAL_LINK, MANUAL_ASSIGNMENT
- **Attribution Windows**: Lifetime or time-bound
- **Partner Tenant Creation**: Partners create tenants in PENDING state
- **Module Selection**: POS, SVM, MVM
- **Tenant Activation**: System activates after payment

#### Partner Program - Phase 3 ✅ (2025-01-01)
- **Subscription Plans**: Plan definitions with module bundles and pricing
- **Subscriptions**: Tenant subscriptions with optional partner attribution
- **Entitlements**: Module access grants (interface for modules)
- **Subscription Events**: Immutable lifecycle event log

#### Partner Program - Phase 4 ✅ (2025-01-01)
- **Commission Engine**: Flexible commission calculation (PERCENTAGE, FIXED, TIERED, HYBRID)
- **Earnings Ledger**: Immutable, append-only ledger
- **Commission Triggers**: ON_PAYMENT, ON_ACTIVATION, ON_RENEWAL, ON_SIGNUP

#### Partner Program - Phase 5 ✅ (2025-01-01)
- **Payout Readiness**: Preparation without money movement
- **Payable Balances**: Per-partner tracking (pending/cleared/approved)
- **Thresholds**: Configurable minimum payout amounts
- **Tax Withholding**: Rate configuration and document tracking
- **Payout Holds**: Apply/release with audit trail
- **Readiness Checks**: 6-point verification system
- **Reporting**: Partner and platform-wide views
- **NO execution**: EXECUTION_ENABLED = false

#### Partner Program - Phase 6 & 7 ✅ (2026-01-01)
- **Partner Dashboard APIs**: Complete dashboard data services
  - `/api/partners/{id}/dashboard` - Overview
  - `/api/partners/{id}/dashboard/performance` - Metrics
  - `/api/partners/{id}/dashboard/referrals` - Referral list
  - `/api/partners/{id}/audit` - Audit logs
- **Audit Integration**: Comprehensive audit logging and compliance reporting
- **Security Boundaries**: Partner-only data, no tenant internals exposed

---

## Backlog / Upcoming Tasks

### P0 - Partner Dashboard Frontend (Next)
1. **Partner Portal UI** - Frontend for partners to view dashboard, referrals, earnings

### P2 - Platform Enhancements
- Global User Management - Super Admin "All Users" section
- Production Email Sending - Resend domain verification
- Payout Execution - Integrate payment gateway for actual payouts

---

## Technical Specifications

### Database Schema
**Tenant Domain:**
- User, Tenant, TenantMembership, TenantDomain, Session, MagicLink, AuditLog

**Partner Domain:**
- Partner, PartnerUser, PartnerAgreement, PartnerReferralCode, PartnerReferral, PartnerEarning
- PartnerPayoutSettings, PayoutBatch

**Subscription Domain:**
- SubscriptionPlan, Subscription, Entitlement, SubscriptionEvent, Invoice

### Key Files
- `/app/saas-core/prisma/schema.prisma` - All DB models
- `/app/saas-core/src/lib/tenant-isolation.ts` - Tenant data isolation
- `/app/saas-core/src/lib/partner-authorization.ts` - Partner access control
- `/app/saas-core/src/lib/partner-attribution.ts` - Attribution service
- `/app/saas-core/src/lib/partner-tenant-creation.ts` - Partner tenant creation
- `/app/saas-core/src/lib/entitlements.ts` - Module access checks
- `/app/saas-core/src/lib/subscription.ts` - Subscription management
- `/app/saas-core/src/lib/subscription-events.ts` - Lifecycle events
- `/app/saas-core/src/lib/commission-engine.ts` - Commission calculation
- `/app/saas-core/src/lib/earnings-ledger.ts` - Append-only earnings ledger
- `/app/saas-core/src/lib/payout-readiness.ts` - Payout preparation
- `/app/saas-core/src/lib/partner-dashboard.ts` - Dashboard data service
- `/app/saas-core/src/lib/partner-audit.ts` - Audit logging service

### API Endpoints
**Attribution:**
- `POST /api/attribution` - Create attribution via referral code
- `GET /api/attribution?tenantId=xxx` - Get attribution for tenant

**Partner Tenants:**
- `POST /api/partners/{id}/tenants` - Create tenant in PENDING state
- `GET /api/partners/{id}/tenants` - List partner's tenants

**Partner Dashboard:**
- `GET /api/partners/{id}/dashboard` - Dashboard overview
- `GET /api/partners/{id}/dashboard/performance` - Performance metrics
- `GET /api/partners/{id}/dashboard/referrals` - Referral list
- `GET /api/partners/{id}/audit` - Audit logs

### 3rd Party Integrations
- **Supabase (PostgreSQL)** - Database
- **Prisma ORM (v5.22.0)** - ORM
- **Resend** - Email (requires domain verification for production)

---

## Version History
- **v1.6.0** (2026-01-01): Partner Dashboard & Audit Integration (Phase 6 & 7)
- **v1.5.0** (2025-01-01): Payout Readiness (Phase 5) - No money movement
- **v1.4.0** (2025-01-01): Commission & Earnings Engine (Phase 4)
- **v1.3.0** (2025-01-01): Subscription & Entitlement System (Phase 3)
- **v1.2.0** (2025-01-01): Partner Attribution & Tenant Linking (Phase 2)
- **v1.1.1** (2025-01-01): Partner Access Control documentation
- **v1.1.0** (2025-01-01): Partner domain models
- **v1.0.0** (2024-12-31): Initial SaaS Core release
