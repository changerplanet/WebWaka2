# Platform-Level Actors
## WebWaka Platform - Persona Extraction Document 01
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Overview

This document extracts all platform-level actors that operate at the WebWaka infrastructure level, not inside client businesses.

**Sources:** `prisma/schema.prisma`, `lib/authorization.ts`, `lib/partner-authorization.ts`, Super Admin dashboard

---

## 1. SUPER ADMIN

| Attribute | Value |
|-----------|-------|
| **System Role** | `GlobalRole.SUPER_ADMIN` |
| **Model** | `User.globalRole = 'SUPER_ADMIN'` |
| **Primary Responsibilities** | Platform governance, oversight, compliance |

### Primary Responsibilities
1. Platform-wide tenant management (CRUD, suspend, search)
2. User management across all tenants
3. Partner management (approve, suspend, reinstate)
4. Capability governance (activate, suspend for tenants)
5. Financial oversight (read-only)
6. Audit log review
7. Platform health monitoring
8. Error diagnostics
9. Impersonation for support/diagnostics

### Accessible Dashboards/Pages
- `/admin` - Super Admin Dashboard (tenants list)
- `/admin/users` - All Users Management
- `/admin/partners` - Partner Management
- `/admin/capabilities` - Capability Management
- `/admin/impersonation` - Impersonation Tool
- `/admin/health` - Platform Health Dashboard
- `/admin/financials` - Financial Oversight
- `/admin/errors` - Error Log Viewer
- `/admin/audit-logs` - Audit Log Viewer
- `/admin/tenants/[id]` - Tenant Details

### Explicit Restrictions
- ❌ Cannot directly create client platforms (must use Partner)
- ❌ Cannot bypass Partner-First policy for new clients
- ❌ Cannot process payouts (read-only financial access)
- ❌ Cannot sign Partner agreements (can only approve)
- ❌ Cannot perform destructive actions while impersonating

---

## 2. PARTNER OWNER

| Attribute | Value |
|-----------|-------|
| **System Role** | `PartnerRole.PARTNER_OWNER` |
| **Model** | `PartnerUser.role = 'PARTNER_OWNER'` |
| **Primary Responsibilities** | Full control of partner organization |

### Primary Responsibilities
1. Manage partner organization profile
2. Manage partner team members
3. Sign partner agreements
4. Create and manage referral codes
5. View all partner referrals and earnings
6. Create client platforms (tenants)
7. Configure client packages and pricing
8. Export earnings data

### Accessible Dashboards/Pages
- `/dashboard/partner` - Partner Dashboard Home
- `/dashboard/partner/clients` - Client Management
- `/dashboard/partner/referrals` - Referral Management
- `/dashboard/partner/earnings` - Earnings Dashboard
- `/dashboard/partner/analytics` - Partner Analytics
- `/dashboard/partner/packages` - Package Configuration
- `/dashboard/partner/staff` - Staff Management
- `/dashboard/partner/settings` - Partner Settings
- `/dashboard/partner/saas` - SaaS Control Panel

### Explicit Restrictions
- ❌ Cannot access tenant internal operations
- ❌ Cannot modify core platform settings
- ❌ Cannot manage other partners
- ❌ Cannot bypass platform billing rules

---

## 3. PARTNER ADMIN

| Attribute | Value |
|-----------|-------|
| **System Role** | `PartnerRole.PARTNER_ADMIN` |
| **Model** | `PartnerUser.role = 'PARTNER_ADMIN'` |
| **Primary Responsibilities** | Admin-level partner operations |

### Primary Responsibilities
1. Manage clients and packages
2. View all partner data
3. Create referral codes
4. View all referrals and earnings

### Accessible Dashboards/Pages
- Same as PARTNER_OWNER except:
  - Cannot sign agreements
  - Cannot manage partner profile edits

### Explicit Restrictions
- ❌ Cannot sign or modify partner agreements
- ❌ Cannot manage partner organization settings
- ❌ Cannot access tenant internals

---

## 4. PARTNER SALES

| Attribute | Value |
|-----------|-------|
| **System Role** | `PartnerRole.PARTNER_SALES` |
| **Model** | `PartnerUser.role = 'PARTNER_SALES'` |
| **Primary Responsibilities** | Client acquisition and sales |

### Primary Responsibilities
1. Create new clients
2. View own assigned clients only
3. Create referral codes
4. Track own referrals

### Accessible Dashboards/Pages
- `/dashboard/partner` - Partner Dashboard (filtered view)
- `/dashboard/partner/clients` - Own clients only
- `/dashboard/partner/referrals` - Own referrals only

### Explicit Restrictions
- ❌ Cannot view other sales reps' clients
- ❌ Cannot view all earnings (only own)
- ❌ Cannot manage partner users
- ❌ Cannot sign agreements
- ❌ Cannot access tenant internals

---

## 5. PARTNER SUPPORT

| Attribute | Value |
|-----------|-------|
| **System Role** | `PartnerRole.PARTNER_SUPPORT` |
| **Model** | `PartnerUser.role = 'PARTNER_SUPPORT'` |
| **Primary Responsibilities** | Client support (read-only) |

### Primary Responsibilities
1. View assigned clients
2. View client status and subscription details
3. Support ticket context (if implemented)

### Accessible Dashboards/Pages
- `/dashboard/partner` - Partner Dashboard (read-only)
- `/dashboard/partner/clients` - Assigned clients only (read-only)

### Explicit Restrictions
- ❌ Read-only access only
- ❌ Cannot create clients or referrals
- ❌ Cannot view earnings
- ❌ Cannot manage anything
- ❌ Cannot access tenant internals

---

## 6. PARTNER STAFF

| Attribute | Value |
|-----------|-------|
| **System Role** | `PartnerRole.PARTNER_STAFF` |
| **Model** | `PartnerUser.role = 'PARTNER_STAFF'` |
| **Primary Responsibilities** | Limited partner access |

### Primary Responsibilities
1. View partner profile
2. Create own referral codes
3. View own referrals
4. View earnings summary (not line items)

### Accessible Dashboards/Pages
- `/dashboard/partner` - Partner Dashboard (limited)
- `/dashboard/partner/referrals` - Own referrals only

### Explicit Restrictions
- ❌ Cannot view all referrals (only own)
- ❌ Cannot view all earnings (only summary)
- ❌ Cannot export earnings
- ❌ Cannot view agreement history
- ❌ Cannot manage users
- ❌ Cannot create clients
- ❌ Cannot access tenant internals

---

## 7. INTERNAL WEBWAKA PARTNER

| Attribute | Value |
|-----------|-------|
| **System Role** | `Partner` with special `slug: 'webwaka-digital-services'` |
| **Model** | `Partner` record with internal flag |
| **Primary Responsibilities** | WebWaka's own client-facing operations |

### Primary Responsibilities
1. Direct client acquisition for flagship/government accounts
2. Demonstration and pilot deployments
3. Reference implementations
4. Same capabilities as external partners

### Accessible Dashboards/Pages
- All Partner dashboards (as PARTNER_OWNER role)

### Explicit Restrictions
- ❌ Same restrictions as external partners
- ❌ Subject to Partner-First policy like any partner

---

## 8. SYSTEM / AUTOMATED ACTORS

These are not user roles but system processes that perform automated operations:

### 8.1 Billing System
- Processes subscription renewals
- Creates invoices
- Calculates partner commissions
- Creates `SubscriptionEvent` records

### 8.2 Sync Engine
- Offline data synchronization
- Conflict resolution
- Background job processing

### 8.3 Audit Logger
- Records all `AuditLog` entries
- Tracks user actions and system events
- Cannot be bypassed

### 8.4 Session Manager
- Manages user sessions
- Enforces session expiration
- Handles authentication tokens

---

## Permission Matrix (Platform Actors)

| Permission | SUPER_ADMIN | PARTNER_OWNER | PARTNER_ADMIN | PARTNER_SALES | PARTNER_SUPPORT | PARTNER_STAFF |
|------------|-------------|---------------|---------------|---------------|-----------------|---------------|
| View Partner | ✅ All | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| Edit Partner | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sign Agreement | ❌ (Approves) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Referrals | ✅ | ✅ | ✅ | ❌ Own only | ❌ | ❌ Own only |
| Create Referral Codes | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| View All Earnings | ✅ | ✅ | ✅ | ❌ Own only | ❌ | ❌ Summary |
| Export Earnings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Agreement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Agreement History | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Clients | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Access Tenant Internals | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Source Files

- `/app/frontend/prisma/schema.prisma` - GlobalRole, PartnerRole enums
- `/app/frontend/src/lib/authorization.ts` - requireSuperAdmin()
- `/app/frontend/src/lib/partner-authorization.ts` - PartnerPermissions, role definitions
- `/app/frontend/src/app/admin/` - Super Admin dashboard pages
- `/app/frontend/src/app/dashboard/partner/` - Partner dashboard pages

---

**Document Status:** EXTRACTION COMPLETE  
**Verification:** This document contains ONLY roles and permissions that exist in the codebase.
