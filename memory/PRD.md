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
- **Subscription Engine**: Plans, subscriptions, billing intervals
- **Entitlement System**: Clean abstraction for module access checks
- **Lifecycle Events**: CREATED, ACTIVATED, RENEWED, CANCELLED
- **Partner Attribution**: Optional on subscriptions (partnerReferralId)
- **Event-Driven**: Events for commission calculation (Phase 4)

---

## Backlog / Upcoming Tasks

### P0 - Partner Program Phase 4 (Next)
1. **Commission & Earnings Engine** - Calculate partner commissions from events
2. **Earnings Dashboard** - Partner view of commissions
3. **Payout Processing** - Commission payment workflow

### P1 - Partner Portal
- Partner Portal UI - Frontend for partners to manage tenants/referrals

### P2 - Platform Enhancements
- Global User Management - Super Admin "All Users" section
- Production Email Sending - Resend domain verification
- Billing Integration (Stripe)
- Attribution Tracking - Link sign-ups to referring partners

---

## Technical Specifications

### Database Schema
**Tenant Domain:**
- User, Tenant, TenantMembership, TenantDomain, Session, MagicLink, AuditLog

**Partner Domain:**
- Partner, PartnerUser, PartnerAgreement, PartnerReferralCode, PartnerReferral, PartnerEarning

**New Enums (Phase 2):**
- AttributionMethod: PARTNER_CREATED, REFERRAL_LINK, MANUAL_ASSIGNMENT
- TenantStatus now includes: PENDING_ACTIVATION

### Key Files
- `/app/saas-core/prisma/schema.prisma` - All DB models
- `/app/saas-core/src/lib/tenant-isolation.ts` - Tenant data isolation
- `/app/saas-core/src/lib/partner-authorization.ts` - Partner access control
- `/app/saas-core/src/lib/partner-attribution.ts` - Attribution service
- `/app/saas-core/src/lib/partner-tenant-creation.ts` - Partner tenant creation
- `/app/saas-core/src/lib/entitlements.ts` - Module access checks (for modules)
- `/app/saas-core/src/lib/subscription.ts` - Subscription management
- `/app/saas-core/src/lib/subscription-events.ts` - Lifecycle events
- `/app/saas-core/docs/PARTNER_ACCESS_CONTROL.md` - Partner ACL docs
- `/app/saas-core/docs/PARTNER_ATTRIBUTION.md` - Attribution & linking docs
- `/app/saas-core/docs/SUBSCRIPTION_ENTITLEMENT.md` - Subscription & entitlement docs

### API Endpoints (Phase 2)
- `POST /api/attribution` - Create attribution via referral code
- `GET /api/attribution?tenantId=xxx` - Get attribution for tenant
- `POST /api/attribution/lock` - Lock attribution (internal)
- `POST /api/partners/{id}/tenants` - Create tenant in PENDING state
- `GET /api/partners/{id}/tenants` - List partner's tenants

### 3rd Party Integrations
- **Supabase (PostgreSQL)** - Database
- **Prisma ORM (v5.22.0)** - ORM
- **Resend** - Email (requires domain verification for production)

---

## Version History
- **v1.2.0** (2025-01-01): Partner Attribution & Tenant Linking (Phase 2)
- **v1.1.1** (2025-01-01): Partner Access Control documentation
- **v1.1.0** (2025-01-01): Partner domain models
- **v1.0.0** (2024-12-31): Initial SaaS Core release
