# Partner-Level Personas
## WebWaka Platform - Persona Extraction Document 02
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Overview

This document extracts all partner-level personas - people operating Partner businesses on WebWaka.

**Sources:** `prisma/schema.prisma` (PartnerRole enum), `lib/partner-authorization.ts`

---

## Existing Partner Roles

The platform defines the following **differentiated** Partner roles in `PartnerRole` enum:

```prisma
enum PartnerRole {
  PARTNER_OWNER   // Full control: manage agreement, users, view all data
  PARTNER_ADMIN   // Admin: manage clients, packages, view all data
  PARTNER_SALES   // Sales: create clients, view own clients
  PARTNER_SUPPORT // Support: view assigned clients, read-only
  PARTNER_STAFF   // Limited: view referrals/earnings, create referral codes
}
```

---

## 1. PARTNER OWNER

### Description
The primary owner/administrator of a partner organization. Has full control over all partner operations and team management.

### Actions They Can Perform
| Action | Allowed |
|--------|---------|
| View partner profile | ✅ |
| Edit partner profile | ✅ |
| Manage partner users (add/remove/change roles) | ✅ |
| Sign partner agreements | ✅ |
| View all referrals | ✅ |
| Create referral codes | ✅ |
| View all earnings (line items) | ✅ |
| Export earnings data | ✅ |
| View agreement history | ✅ |
| Create client platforms | ✅ |
| Configure client packages | ✅ |
| Assign staff to clients | ✅ |

### Dashboards They Access
- `/dashboard/partner` - Main Partner Dashboard
- `/dashboard/partner/clients` - Full client list
- `/dashboard/partner/referrals` - All referrals
- `/dashboard/partner/earnings` - Full earnings with line items
- `/dashboard/partner/analytics` - Partner analytics
- `/dashboard/partner/packages` - Package configuration
- `/dashboard/partner/staff` - Staff management
- `/dashboard/partner/settings` - Partner settings
- `/dashboard/partner/saas` - SaaS control panel

### What They Explicitly Cannot Access
- ❌ Tenant internal operations (dashboards, POS, inventory, etc.)
- ❌ Other partners' data
- ❌ Super Admin features
- ❌ Platform configuration

---

## 2. PARTNER ADMIN

### Description
Administrative role with most owner permissions except agreement signing and profile editing.

### Actions They Can Perform
| Action | Allowed |
|--------|---------|
| View partner profile | ✅ |
| Edit partner profile | ❌ |
| Manage partner users | ❌ |
| Sign partner agreements | ❌ |
| View all referrals | ✅ |
| Create referral codes | ✅ |
| View all earnings (line items) | ✅ |
| Export earnings data | ✅ |
| View agreement history | ❌ |
| Create client platforms | ✅ |
| Configure client packages | ✅ |
| Assign staff to clients | ❌ |

### Dashboards They Access
- `/dashboard/partner` - Main Partner Dashboard
- `/dashboard/partner/clients` - Full client list
- `/dashboard/partner/referrals` - All referrals
- `/dashboard/partner/earnings` - Full earnings
- `/dashboard/partner/analytics` - Partner analytics
- `/dashboard/partner/packages` - Package configuration

### What They Explicitly Cannot Access
- ❌ Staff management
- ❌ Partner settings
- ❌ Agreement signing/history
- ❌ Tenant internal operations
- ❌ Other partners' data

---

## 3. PARTNER SALES

### Description
Sales-focused role for client acquisition. Can only see clients they are assigned to or have created.

### Actions They Can Perform
| Action | Allowed |
|--------|---------|
| View partner profile | ✅ |
| Edit partner profile | ❌ |
| Manage partner users | ❌ |
| Sign partner agreements | ❌ |
| View all referrals | ❌ (Own only) |
| Create referral codes | ✅ |
| View all earnings | ❌ (Own only) |
| Export earnings data | ❌ |
| View agreement | ✅ |
| Create client platforms | ✅ |
| Configure client packages | ❌ |

### Dashboards They Access
- `/dashboard/partner` - Filtered view (own clients only)
- `/dashboard/partner/clients` - Own/assigned clients only
- `/dashboard/partner/referrals` - Own referrals only

### What They Explicitly Cannot Access
- ❌ Other sales reps' clients
- ❌ All referrals view
- ❌ All earnings view
- ❌ Partner settings
- ❌ Staff management
- ❌ Package configuration
- ❌ Tenant internal operations

### Scoping Mechanism
Uses `PartnerUser.assignedTenantIds` array for client visibility scoping.

---

## 4. PARTNER SUPPORT

### Description
Support role with read-only access to assigned clients for troubleshooting context.

### Actions They Can Perform
| Action | Allowed |
|--------|---------|
| View partner profile | ✅ |
| Edit partner profile | ❌ |
| Manage partner users | ❌ |
| Sign partner agreements | ❌ |
| View referrals | ❌ |
| Create referral codes | ❌ |
| View earnings | ❌ |
| Export earnings data | ❌ |
| View agreement | ✅ |
| Create client platforms | ❌ |
| View assigned clients | ✅ (Read-only) |

### Dashboards They Access
- `/dashboard/partner` - Read-only view
- `/dashboard/partner/clients` - Assigned clients only (read-only)

### What They Explicitly Cannot Access
- ❌ Any write operations
- ❌ Referrals
- ❌ Earnings
- ❌ Client creation
- ❌ Unassigned clients
- ❌ Tenant internal operations

---

## 5. PARTNER STAFF

### Description
Limited role for basic partner participation - primarily for creating referral codes and viewing own results.

### Actions They Can Perform
| Action | Allowed |
|--------|---------|
| View partner profile | ✅ |
| Edit partner profile | ❌ |
| Manage partner users | ❌ |
| Sign partner agreements | ❌ |
| View all referrals | ❌ (Own only) |
| Create referral codes | ✅ |
| View all earnings | ❌ (Summary only) |
| Export earnings data | ❌ |
| View agreement | ✅ |
| View agreement history | ❌ |
| Create client platforms | ❌ |

### Dashboards They Access
- `/dashboard/partner` - Limited view
- `/dashboard/partner/referrals` - Own referrals only

### What They Explicitly Cannot Access
- ❌ Client management
- ❌ Full referral list
- ❌ Earnings line items
- ❌ Earnings export
- ❌ Agreement history
- ❌ Staff management
- ❌ Package configuration
- ❌ Tenant internal operations

---

## Partner Finance Role

**Note:** There is no explicit `PARTNER_FINANCE` role in the schema. Financial viewing is handled through the existing role hierarchy:
- PARTNER_OWNER: Full financial access
- PARTNER_ADMIN: Full financial access
- PARTNER_SALES/SUPPORT/STAFF: Limited or no financial access

---

## Role Assignment

Partner users are assigned roles via the `PartnerUser` model:

```prisma
model PartnerUser {
  id        String      @id @default(uuid())
  partnerId String
  userId    String
  role      PartnerRole @default(PARTNER_STAFF)
  isActive  Boolean     @default(true)
  
  // Client visibility scoping
  assignedTenantIds String[] @default([])
  
  // Additional metadata
  displayName  String?
  department   String?
}
```

---

## Summary Table

| Persona | Description | Client Access | Earnings View | Can Create |
|---------|-------------|---------------|---------------|------------|
| PARTNER_OWNER | Full control | All | Full + Export | Yes |
| PARTNER_ADMIN | Admin without ownership | All | Full + Export | Yes |
| PARTNER_SALES | Sales rep | Own/Assigned | Own only | Yes |
| PARTNER_SUPPORT | Support agent | Assigned (read-only) | None | No |
| PARTNER_STAFF | Limited participant | None | Summary only | No |

---

## Source Files

- `/app/frontend/prisma/schema.prisma` - PartnerRole enum, PartnerUser model
- `/app/frontend/src/lib/partner-authorization.ts` - Permission definitions
- `/app/frontend/src/app/dashboard/partner/` - Partner dashboard pages

---

**Document Status:** EXTRACTION COMPLETE  
**Verification:** All roles documented exist in `PartnerRole` enum. No roles were invented.
