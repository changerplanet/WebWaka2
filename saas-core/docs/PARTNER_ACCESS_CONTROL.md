# Partner Access Control Model

## Version
**Document Version:** 1.1.0  
**Date:** 2025-01-01  
**Status:** Defined

---

## Overview

This document defines the access control model for the Partner Program. The Partner domain is **completely isolated** from the Tenant domain. Partner users operate at the **platform level** and cannot access tenant internals.

### Key Principles

1. **Platform-Level Isolation**: Partners exist outside the tenant hierarchy
2. **Hard Boundaries**: Partner users can NEVER access tenant internal data
3. **Role-Based Permissions**: Granular permissions based on partner role
4. **Least Privilege**: Users get minimum permissions needed for their function

---

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLATFORM LEVEL                              │
│                                                                  │
│  ┌──────────────┐                                               │
│  │ SUPER_ADMIN  │ ─────── Full platform access (all partners)   │
│  └──────┬───────┘                                               │
│         │                                                        │
│         │ Can access any partner                                 │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PARTNER ORGANIZATION                        │    │
│  │                                                          │    │
│  │   ┌────────────────┐     ┌─────────────────┐            │    │
│  │   │ PARTNER_OWNER  │ ──▶ │  PARTNER_STAFF  │            │    │
│  │   └────────────────┘     └─────────────────┘            │    │
│  │         │                        │                       │    │
│  │         │ Full control           │ Limited access        │    │
│  │         │ within partner         │ within partner        │    │
│  │         ▼                        ▼                       │    │
│  │   ┌─────────────────────────────────────────────────┐   │    │
│  │   │        PARTNER DATA (isolated per partner)       │   │    │
│  │   │   • Profile        • Referrals                   │   │    │
│  │   │   • Agreements     • Earnings                    │   │    │
│  │   │   • Referral Codes                               │   │    │
│  │   └─────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ════════════════════════ HARD BOUNDARY ═════════════════════   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              TENANT DOMAIN (INACCESSIBLE)                │    │
│  │                                                          │    │
│  │   Partners can ONLY see limited tenant metadata:         │    │
│  │   • Tenant name, status, signup date                     │    │
│  │                                                          │    │
│  │   Partners CANNOT access:                                │    │
│  │   • Tenant users, settings, domains, or internal data    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Identity Model

### Partner Users ≠ Tenant Users
Partner users and tenant users are **completely separate** identity spaces:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Global Identity)                  │
│                                                                 │
│    A user can be:                                               │
│    ┌─────────────────┐         ┌─────────────────┐             │
│    │  Partner User   │   OR    │  Tenant User    │   (or both) │
│    │  (PartnerUser)  │         │ (TenantMember)  │             │
│    └────────┬────────┘         └────────┬────────┘             │
│             │                           │                       │
│             ▼                           ▼                       │
│    ┌─────────────────┐         ┌─────────────────┐             │
│    │    Partner      │         │     Tenant      │             │
│    │   (Platform)    │         │   (Workspace)   │             │
│    └─────────────────┘         └─────────────────┘             │
│                                                                 │
│    HARD BOUNDARY: Partner users CANNOT cross into Tenant space │
└─────────────────────────────────────────────────────────────────┘
```

### Access Boundary Summary
```
┌──────────────────────────────────────────────────────────────────┐
│                     PARTNER VISIBLE DATA                         │
│                                                                  │
│  ✅ Their own partner profile                                    │
│  ✅ Their referral codes                                         │
│  ✅ Their referrals (which tenants they referred)                │
│  ✅ Their earnings/commissions                                   │
│  ✅ Their agreement terms                                        │
│  ✅ Limited tenant info: name, status, signup date               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     PARTNER HIDDEN DATA                          │
│                                                                  │
│  ❌ Tenant users/members                                         │
│  ❌ Tenant settings                                              │
│  ❌ Tenant domains                                               │
│  ❌ Tenant internal data                                         │
│  ❌ Other partners' data                                         │
│  ❌ Other tenants (not referred by them)                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Role Definitions

### PARTNER_OWNER
**Full control within their partner organization**

| Permission | Allowed |
|------------|---------|
| View partner profile | ✅ |
| Edit partner profile | ✅ |
| Manage partner users | ✅ |
| Sign agreements | ✅ |
| View all referrals | ✅ |
| Create referral codes | ✅ |
| View all earnings (detail) | ✅ |
| Export earnings | ✅ |
| View agreement history | ✅ |
| **Access tenant internals** | ❌ NEVER |

### PARTNER_STAFF
**Limited access within their partner organization**

| Permission | Allowed |
|------------|---------|
| View partner profile | ✅ |
| Edit partner profile | ❌ |
| Manage partner users | ❌ |
| Sign agreements | ❌ |
| View referrals | ✅ (own only) |
| Create referral codes | ✅ |
| View earnings (summary) | ✅ |
| Export earnings | ❌ |
| View agreement history | ❌ |
| **Access tenant internals** | ❌ NEVER |

### SUPER_ADMIN (Platform)
**Platform-wide access for administration**

| Permission | Allowed |
|------------|---------|
| View any partner | ✅ |
| Edit any partner | ✅ |
| Approve partners | ✅ |
| Suspend/terminate partners | ✅ |
| View all referrals | ✅ |
| View all earnings | ✅ |
| Approve earnings for payment | ✅ |
| **Sign partner agreements** | ❌ (Partners sign, Admins approve) |

---

## Authorization Rules

### Rule 1: Authentication Required
All partner endpoints require authentication.

```typescript
const session = await getCurrentSession()
if (!session) {
  return { error: 'Authentication required', status: 401 }
}
```

### Rule 2: Partner Membership Check
User must be an active member of an active partner.

```typescript
const partnerUser = await prisma.partnerUser.findUnique({
  where: { userId: session.user.id },
  include: { partner: true }
})

if (!partnerUser || !partnerUser.isActive) {
  return { error: 'Not a partner user', status: 403 }
}

if (partnerUser.partner.status !== 'ACTIVE') {
  return { error: 'Partner is not active', status: 403 }
}
```

### Rule 3: Partner Isolation
Users can only access their own partner's data.

```typescript
// User belongs to Partner A
// Trying to access Partner B's data
if (partnerUser.partnerId !== requestedPartnerId) {
  return { error: 'Access denied', status: 403 }
}
```

### Rule 4: Role-Based Permissions
Actions are gated by role.

```typescript
// Only PARTNER_OWNER can manage users
if (action === 'MANAGE_USERS' && role !== 'PARTNER_OWNER') {
  return { error: 'Partner Owner access required', status: 403 }
}
```

### Rule 5: Tenant Data Boundary (HARD RULE)
Partners can NEVER access tenant internals.

```typescript
// This function ALWAYS returns false
function canPartnerAccessTenantInternals(): boolean {
  return false // Hard boundary - never changes
}

// Partners can only see limited tenant data
interface PartnerVisibleTenantData {
  id: string
  name: string
  slug: string
  status: string
  createdAt: Date
  // NO: users, domains, settings, memberships
}
```

---

## Access Boundary Explanation

### What Partners CAN See About Referred Tenants

| Data | Visible | Notes |
|------|---------|-------|
| Tenant ID | ✅ | For reference |
| Tenant Name | ✅ | Display purposes |
| Tenant Slug | ✅ | URL identifier |
| Tenant Status | ✅ | Active/Suspended |
| Signup Date | ✅ | When referred |
| Subscription Tier | ✅ | For commission calculation |
| Monthly Revenue | ✅ | Aggregated only |

### What Partners CANNOT See

| Data | Visible | Reason |
|------|---------|--------|
| Tenant Users | ❌ | Privacy |
| Tenant Emails | ❌ | Privacy |
| Tenant Settings | ❌ | Internal |
| Tenant Domains | ❌ | Internal |
| Tenant Branding | ❌ | Internal |
| Tenant Activity | ❌ | Internal |
| Module Data | ❌ | Internal |

### Why This Boundary Exists

1. **Privacy**: Tenant users didn't consent to partner access
2. **Security**: Reduces attack surface
3. **Compliance**: GDPR/data protection requirements
4. **Trust**: Tenants trust their data is private
5. **Simplicity**: Clear boundaries prevent confusion

---

## Implementation Reference

### Authorization Functions

```typescript
// Require any partner user
const auth = await requirePartnerUser()

// Require partner owner
const auth = await requirePartnerOwner()

// Require access to specific partner
const auth = await requirePartnerAccess(partnerId)

// Require owner access to specific partner
const auth = await requirePartnerOwnerAccess(partnerId)

// Check specific permission
if (hasPartnerPermission(role, 'canManagePartnerUsers')) {
  // Allow action
}
```

### Usage Example

```typescript
// API Route: GET /api/partners/[id]/earnings
export async function GET(request: NextRequest, { params }) {
  const { id: partnerId } = await params
  
  // 1. Check authorization
  const auth = await requirePartnerAccess(partnerId)
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }
  
  // 2. Check permission
  const permissions = getPartnerPermissions(auth.role)
  if (!permissions.canViewEarnings) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    )
  }
  
  // 3. Apply data filtering based on role
  const earnings = await prisma.partnerEarning.findMany({
    where: {
      partnerId,
      // Staff sees summary only, Owner sees all
      ...(permissions.canViewAllEarnings ? {} : { status: 'PAID' })
    }
  })
  
  return NextResponse.json({ earnings })
}
```

---

## Comparison: Partner vs Tenant Authorization

| Aspect | Partner Auth | Tenant Auth |
|--------|--------------|-------------|
| Scope | Platform-level | Workspace-level |
| Isolation Key | `partnerId` | `tenantId` |
| Roles | OWNER, STAFF | ADMIN, USER |
| Cross-access | Never to tenants | Never to partners |
| Super Admin | Full access | Full access |
| Data visibility | Limited tenant view | Full workspace |

---

## Security Considerations

1. **No Implicit Trust**: Even if a partner referred a tenant, they get no special access
2. **Audit Everything**: All partner actions are logged
3. **Principle of Least Privilege**: Staff role is default, Owner is explicit
4. **Immutable Attribution**: Referral links cannot be changed
5. **Active Checks**: Both user AND partner must be active
