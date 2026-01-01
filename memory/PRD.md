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
- Future: commissions, billing, attribution tracking

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

#### Partner Program Foundation ✅
- Partner domain models in Prisma schema
- PartnerRole enum (PARTNER_OWNER, PARTNER_STAFF)
- Partner authorization library (`partner-authorization.ts`)
- **Partner Access Control Documentation** ✅ (2025-01-01)

---

## Backlog / Upcoming Tasks

### P0 - Partner Program (Sequential)
1. ~~Define Partner access control model~~ ✅ DONE
2. Partner Capabilities API - APIs for partners to manage profiles, view referrals, track earnings
3. Partner Portal UI - Frontend portal for partners

### P1 - Partner Program (Continued)
4. Commission Model - Logic for calculating partner commissions
5. Billing Integration - Subscriptions and commission payouts
6. Attribution Tracking - Link sign-ups to referring partners

### P2 - Platform Enhancements
- Global User Management - Super Admin "All Users" section
- Production Email Sending - Resend domain verification

---

## Technical Specifications

### Database Schema
**Tenant Domain:**
- User, Tenant, TenantMembership, TenantDomain, Session, MagicLink, AuditLog

**Partner Domain:**
- Partner, PartnerUser, PartnerAgreement, PartnerReferralCode, PartnerReferral, PartnerEarning

### Key Files
- `/app/saas-core/prisma/schema.prisma` - All DB models
- `/app/saas-core/src/lib/tenant-isolation.ts` - Tenant data isolation
- `/app/saas-core/src/lib/partner-authorization.ts` - Partner access control
- `/app/saas-core/docs/PARTNER_ACCESS_CONTROL.md` - Partner ACL documentation
- `/app/saas-core/docs/PARTNER_DOMAIN_MODELS.md` - Partner schema docs

### 3rd Party Integrations
- **Supabase (PostgreSQL)** - Database
- **Prisma ORM (v5.22.0)** - ORM
- **Resend** - Email (requires domain verification for production)

---

## Version History
- **v1.1.1** (2025-01-01): Partner Access Control documentation complete
- **v1.1.0** (2025-01-01): Partner domain models implemented
- **v1.0.0** (2024-12-31): Initial SaaS Core release
