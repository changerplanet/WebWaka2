# SaaS Core - Product Requirements Document

## Overview
Production-grade, reusable SaaS Core with Next.js App Router, PostgreSQL (Prisma ORM), and multi-tenant architecture.

## Core Requirements

### Architecture
- True multi-tenancy with strict data isolation
- Middleware-based tenant resolution (subdomains/custom domains)
- Application-layer data isolation engine

### Roles
- **SUPER_ADMIN**: Platform-wide access to all tenants, users, and partners
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

#### PWA & Offline ✅
- Service Worker implementation
- IndexedDB helpers and React hooks
- Offline status components

#### Super Admin Dashboard ✅
- **Tenant Management**: Create, suspend, reactivate tenants
- **All Users (NEW)**: View all platform users, change roles
- **Audit Logs**: View audit log entries

#### Partner Program - Complete ✅
- Phase 1-5: Attribution, Subscriptions, Commissions, Earnings, Payouts
- Phase 6-7: Partner Dashboard + Audit Integration (Backend + Frontend)

#### Global User Management ✅ (2026-01-01)
**Backend APIs:**
- `GET /api/admin/users` - List all users with filtering/pagination
- `GET /api/admin/users/[userId]` - User details with sessions/memberships
- `PATCH /api/admin/users/[userId]` - Change user role (promote/demote)

**Frontend:**
- `/admin/users` - Users table with stats, search, filtering
- User detail modal with memberships and role management
- Promote (USER → SUPER_ADMIN) and Demote (SUPER_ADMIN → USER)

**Security:**
- Only SUPER_ADMIN can access
- Cannot demote yourself
- Audit logging for role changes

---

## Backlog / Upcoming Tasks

### P2 - Platform Enhancements
- Production Email Sending - Resend domain verification
- Payout Execution - Integrate payment gateway for actual payouts

---

## Technical Specifications

### Key Files
- `/app/saas-core/prisma/schema.prisma` - All DB models
- `/app/saas-core/src/lib/tenant-isolation.ts` - Tenant data isolation
- `/app/saas-core/src/app/admin/` - Super Admin dashboard
- `/app/saas-core/src/app/partner/` - Partner portal (4 pages)

### API Endpoints
**Admin:**
- `GET /api/admin/users` - List all users
- `GET/PATCH /api/admin/users/[userId]` - User details/update
- `GET/POST/PATCH /api/admin/tenants` - Tenant management

**Partner Dashboard:**
- `GET /api/partners/{id}/dashboard` - Dashboard overview
- `GET /api/partners/{id}/dashboard/performance` - Metrics
- `GET /api/partners/{id}/dashboard/referrals` - Referrals
- `GET /api/partners/{id}/audit` - Audit logs

### 3rd Party Integrations
- **Supabase (PostgreSQL)** - Database
- **Prisma ORM (v5.22.0)** - ORM
- **Resend** - Email (MOCKED - shows magic link in UI)

---

## Version History
- **v1.7.0** (2026-01-01): Global User Management - Super Admin "All Users" section
- **v1.6.0** (2026-01-01): Partner Dashboard & Audit Integration (Phase 6 & 7)
- **v1.5.0** (2025-01-01): Payout Readiness (Phase 5)
- **v1.4.0** (2025-01-01): Commission & Earnings Engine (Phase 4)
- **v1.3.0** (2025-01-01): Subscription & Entitlement System (Phase 3)
- **v1.2.0** (2025-01-01): Partner Attribution & Tenant Linking (Phase 2)
- **v1.1.0** (2025-01-01): Partner domain models
- **v1.0.0** (2024-12-31): Initial SaaS Core release

---

## Test Credentials
- **Super Admin**: superadmin@saascore.com (Magic Link)
- **Partner User**: admin@acme.com (Magic Link)
- **Admin Portal**: /admin, /admin/users
- **Partner Portal**: /partner
