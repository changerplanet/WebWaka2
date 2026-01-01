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

#### Partner Program - Phase 1-5 ✅
- Partner domain models in Prisma schema
- PartnerRole enum (PARTNER_OWNER, PARTNER_STAFF)
- Partner authorization library
- Attribution System: Immutable Partner-to-Tenant attribution
- Subscription Engine: Plans, subscriptions, entitlements
- Commission Engine: Flexible calculation (PERCENTAGE, FIXED, TIERED, HYBRID)
- Earnings Ledger: Immutable, append-only ledger
- Payout Readiness: Preparation without money movement

#### Partner Program - Phase 6 & 7 ✅ (2026-01-01)
**Backend APIs:**
- `GET /api/partners/{id}/dashboard` - Complete overview
- `GET /api/partners/{id}/dashboard/performance` - Metrics
- `GET /api/partners/{id}/dashboard/referrals` - Referral list
- `GET /api/partners/{id}/audit` - Audit logs

**Frontend Portal:**
- `/partner` - Dashboard with stats, charts, activity feed
- `/partner/referrals` - Referrals table with filtering/pagination
- `/partner/earnings` - Balance breakdown, performance metrics
- `/partner/audit` - Timeline and report views

**Security Boundaries:**
- Partners see ONLY their data
- NO tenant internals exposed (users/settings/domains hidden)
- Read-only visibility
- Aggregated metrics only

**Testing Status:**
- 24 backend tests passed (100%)
- Frontend tests passed (100%)

---

## Backlog / Upcoming Tasks

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
- `/app/saas-core/src/lib/partner-dashboard.ts` - Dashboard data service
- `/app/saas-core/src/lib/partner-audit.ts` - Audit logging service
- `/app/saas-core/src/app/partner/` - Partner portal frontend (4 pages)

### API Endpoints
**Partner Dashboard:**
- `GET /api/partners/{id}/dashboard` - Dashboard overview
- `GET /api/partners/{id}/dashboard/performance` - Performance metrics
- `GET /api/partners/{id}/dashboard/referrals` - Referral list
- `GET /api/partners/{id}/audit` - Audit logs
- `GET /api/partners/me` - Current user's partner info

### 3rd Party Integrations
- **Supabase (PostgreSQL)** - Database
- **Prisma ORM (v5.22.0)** - ORM
- **Resend** - Email (MOCKED - shows magic link in UI)

---

## Version History
- **v1.6.0** (2026-01-01): Partner Dashboard & Audit Integration (Phase 6 & 7) - Backend APIs + Frontend Portal
- **v1.5.0** (2025-01-01): Payout Readiness (Phase 5)
- **v1.4.0** (2025-01-01): Commission & Earnings Engine (Phase 4)
- **v1.3.0** (2025-01-01): Subscription & Entitlement System (Phase 3)
- **v1.2.0** (2025-01-01): Partner Attribution & Tenant Linking (Phase 2)
- **v1.1.1** (2025-01-01): Partner Access Control documentation
- **v1.1.0** (2025-01-01): Partner domain models
- **v1.0.0** (2024-12-31): Initial SaaS Core release

---

## Test Credentials
- **Partner User**: admin@acme.com (Magic Link - click "Sign In Now" after entering email)
- **Partner ID**: fba5c580-9118-4916-946d-83394b6f17b0
- **Partner Portal URL**: /partner
