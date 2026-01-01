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

### 1. SUPER_ADMIN (Platform Level)

**Scope**: Full platform access across ALL partners

| Area | Permissions |
|------|-------------|
| Partner Management | View all, Edit all, Create, Approve, Suspend, Terminate |
| Partner Users | View all, Add, Remove, Change roles |
| Agreements | View all, Create drafts, Approve (NOT sign) |
| Referrals | View all across platform |
| Earnings | View all, Approve, Process payments |
| Reports | Full platform analytics |

**Notes**:
- Super Admins APPROVE agreements; they do not SIGN them
- Super Admins can access any partner organization
- All Super Admin actions are audit logged

---

### 2. PARTNER_OWNER
**Full control within their partner organization**

| Area | Permission | Description |
|------|------------|-------------|
| **Partner Profile** | | |
| View Partner | ✅ | View partner organization details |
| Edit Partner | ✅ | Update name, contact info, branding |
| **User Management** | | |
| View Users | ✅ | See all partner organization members |
| Add Users | ✅ | Invite new users to partner org |
| Remove Users | ✅ | Remove members from partner org |
| Change Roles | ✅ | Promote/demote between OWNER and STAFF |
| **Agreements** | | |
| View Agreement | ✅ | View current and historical agreements |
| View History | ✅ | See all agreement versions |
| Sign Agreement | ✅ | Digitally sign new agreements |
| **Referrals** | | |
| View Referrals | ✅ | See all tenant referrals |
| View All Referrals | ✅ | See referrals from all codes |
| Create Codes | ✅ | Generate new referral codes |
| Manage Codes | ✅ | Activate/deactivate codes |
| **Earnings** | | |
| View Earnings | ✅ | See commission data |
| View All Earnings | ✅ | See line-item earnings detail |
| Export Earnings | ✅ | Download earnings reports |

**Boundary Restrictions**:
- ❌ CANNOT access tenant internal data
- ❌ CANNOT access other partners' data
- ❌ CANNOT approve their own agreements (requires Super Admin)

---

### 3. PARTNER_STAFF
**Limited operational access within their partner organization**

| Area | Permission | Description |
|------|------------|-------------|
| **Partner Profile** | | |
| View Partner | ✅ | View partner organization details |
| Edit Partner | ❌ | Cannot modify partner profile |
| **User Management** | | |
| View Users | ❌ | Cannot see member list |
| Add Users | ❌ | Cannot invite members |
| Remove Users | ❌ | Cannot remove members |
| **Agreements** | | |
| View Agreement | ✅ | View current agreement only |
| View History | ❌ | Cannot see historical versions |
| Sign Agreement | ❌ | Cannot sign agreements |
| **Referrals** | | |
| View Referrals | ✅ | See referrals (limited scope) |
| View All Referrals | ❌ | Only sees referrals from own codes |
| Create Codes | ✅ | Generate new referral codes |
| Manage Codes | ❌ | Cannot deactivate codes |
| **Earnings** | | |
| View Earnings | ✅ | See summary earnings only |
| View All Earnings | ❌ | Cannot see line-item detail |
| Export Earnings | ❌ | Cannot export reports |

**Boundary Restrictions**:
- ❌ CANNOT access tenant internal data
- ❌ CANNOT access other partners' data
- ❌ CANNOT modify partner settings
- ❌ CANNOT manage team members

---

## Permission Matrix

| Permission | SUPER_ADMIN | PARTNER_OWNER | PARTNER_STAFF |
|------------|:-----------:|:-------------:|:-------------:|
| **Partner Management** | | | |
| canViewPartner | ✅ | ✅ | ✅ |
| canEditPartner | ✅ | ✅ | ❌ |
| canManagePartnerUsers | ✅ | ✅ | ❌ |
| canSignAgreement | ❌* | ✅ | ❌ |
| **Referral Management** | | | |
| canViewReferrals | ✅ | ✅ | ✅ |
| canCreateReferralCodes | ✅ | ✅ | ✅ |
| canViewAllReferrals | ✅ | ✅ | ❌ |
| **Earnings** | | | |
| canViewEarnings | ✅ | ✅ | ✅ |
| canViewAllEarnings | ✅ | ✅ | ❌ |
| canExportEarnings | ✅ | ✅ | ❌ |
| **Agreement** | | | |
| canViewAgreement | ✅ | ✅ | ✅ |
| canViewAgreementHistory | ✅ | ✅ | ❌ |

*\* Super Admin approves agreements but does not sign them*

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

## Authorization Flow

### API Request Flow

```
1. Request arrives at Partner API
         │
         ▼
2. Authenticate user (session token)
         │
         ▼
3. Check if user is active
         │
         ▼
4. Check if user is a Partner user
         │
         ▼
5. Check if Partner is ACTIVE status
         │
         ▼
6. Check if user belongs to requested Partner
         │
         ▼
7. Check role-specific permission
         │
         ▼
8. Execute request & return data
```

### Authorization Functions

| Function | Use Case |
|----------|----------|
| `requirePartnerUser()` | Any endpoint requiring partner membership |
| `requirePartnerOwner()` | Endpoints requiring OWNER role |
| `requirePartnerAccess(partnerId)` | Access to specific partner by ID |
| `requirePartnerOwnerAccess(partnerId)` | OWNER access to specific partner |
| `requirePartnerAccessBySlug(slug)` | Access to partner by URL slug |
| `getPartnerPermissions(role)` | Get permission set for role |
| `hasPartnerPermission(role, permission)` | Check specific permission |

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

---

## Audit Requirements

All partner actions MUST be logged:

| Action | When Logged |
|--------|-------------|
| `PARTNER_CREATED` | New partner registered |
| `PARTNER_UPDATED` | Partner profile changed |
| `PARTNER_APPROVED` | Super Admin approves partner |
| `PARTNER_SUSPENDED` | Partner suspended |
| `PARTNER_TERMINATED` | Partner terminated |
| `PARTNER_USER_ADDED` | User added to partner |
| `PARTNER_USER_REMOVED` | User removed from partner |
| `PARTNER_AGREEMENT_CREATED` | New agreement drafted |
| `PARTNER_AGREEMENT_SIGNED` | Owner signs agreement |
| `PARTNER_AGREEMENT_APPROVED` | Super Admin approves |
| `PARTNER_REFERRAL_CREATED` | New referral tracked |
| `PARTNER_REFERRAL_LOCKED` | Attribution locked |
| `PARTNER_EARNING_CREATED` | Commission calculated |
| `PARTNER_EARNING_APPROVED` | Earning approved |
| `PARTNER_EARNING_PAID` | Payment processed |

---

## Implementation Reference

### Library Location
```
/app/saas-core/src/lib/partner-authorization.ts
```

### Key Types

```typescript
// Authorization result
type PartnerAuthorizationResult = 
  | { authorized: true; user: User; partner: Partner; role: PartnerRole }
  | { authorized: false; error: string; status: number }

// Access levels
type PartnerAccessLevel = 'NONE' | 'STAFF' | 'OWNER' | 'SUPER_ADMIN'

// Permission set
interface PartnerPermissions {
  canViewPartner: boolean
  canEditPartner: boolean
  canManagePartnerUsers: boolean
  canSignAgreement: boolean
  canViewReferrals: boolean
  canCreateReferralCodes: boolean
  canViewAllReferrals: boolean
  canViewEarnings: boolean
  canViewAllEarnings: boolean
  canExportEarnings: boolean
  canViewAgreement: boolean
  canViewAgreementHistory: boolean
}
```

### Usage Example

```typescript
import { 
  requirePartnerOwnerAccess, 
  hasPartnerPermission 
} from '@/lib/partner-authorization'

export async function PUT(request: Request, { params }) {
  // 1. Verify OWNER access to this partner
  const auth = await requirePartnerOwnerAccess(params.partnerId)
  if (!auth.authorized) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  // 2. Check specific permission
  if (!hasPartnerPermission(auth.role, 'canEditPartner')) {
    return Response.json({ error: 'Permission denied' }, { status: 403 })
  }

  // 3. Proceed with update
  // ...
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

## Related Documents

- [Partner Domain Models](./PARTNER_DOMAIN_MODELS.md) - Database schema documentation
- [Tenant Isolation](../src/lib/tenant-isolation.ts) - Tenant data isolation (separate domain)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-31 | Initial draft |
| 1.1.0 | 2025-01-01 | Added permission matrix, authorization flow, audit requirements |
