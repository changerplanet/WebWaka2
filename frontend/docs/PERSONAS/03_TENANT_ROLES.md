# Tenant-Level Roles
## WebWaka Platform - Persona Extraction Document 03
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Overview

This document extracts all tenant-level roles - roles inside a client organization (tenant), regardless of suite.

**Sources:** `prisma/schema.prisma` (TenantRole enum), `lib/authorization.ts`, TenantMembership model

---

## Existing Tenant Roles

The platform defines the following tenant roles in `TenantRole` enum:

```prisma
enum TenantRole {
  TENANT_ADMIN // Full control of tenant (users, settings, billing)
  TENANT_USER  // Regular member with limited permissions
}
```

**Note:** The platform currently has a **simplified two-tier** tenant role system, not a granular multi-role system.

---

## 1. TENANT ADMIN

| Attribute | Value |
|-----------|-------|
| **System Role** | `TenantRole.TENANT_ADMIN` |
| **Model** | `TenantMembership.role = 'TENANT_ADMIN'` |
| **Scope** | Tenant-wide (all modules) |

### Description
The primary administrator of a tenant organization. Has full control over all tenant operations, settings, and member management.

### Capabilities Granted
| Capability | Access |
|------------|--------|
| Tenant settings | Full (Read/Write) |
| User management (add/remove members) | Full |
| Billing & subscription | Full |
| All activated modules | Full |
| Capability activation | Full |
| Platform instance management | Full |
| Domain management | Full |
| Audit log access | Read |

### Typical Use Cases
1. Initial tenant setup after Partner creates the client
2. Inviting team members to the organization
3. Configuring business settings
4. Activating/managing capabilities
5. Managing subscriptions and billing
6. Viewing audit logs for compliance

### Accessible Dashboards
- `/dashboard` - Main tenant dashboard
- `/dashboard/settings` - Tenant settings
- `/dashboard/capabilities` - Capability management
- `/dashboard/billing` - Billing management
- All module dashboards based on activated capabilities

---

## 2. TENANT USER

| Attribute | Value |
|-----------|-------|
| **System Role** | `TenantRole.TENANT_USER` |
| **Model** | `TenantMembership.role = 'TENANT_USER'` |
| **Scope** | Tenant-wide (limited) |

### Description
Regular member of a tenant organization with limited permissions. Cannot manage tenant settings or users.

### Capabilities Granted
| Capability | Access |
|------------|--------|
| Tenant settings | None |
| User management | None |
| Billing & subscription | None |
| Activated modules | Varies by module |
| Capability activation | None |
| Platform instance management | None |
| Domain management | None |

### Typical Use Cases
1. Daily operational work (POS, inventory, etc.)
2. Using activated modules within their scope
3. Viewing (not managing) business data
4. Customer service operations
5. Data entry and processing

### Accessible Dashboards
- `/dashboard` - Main dashboard (limited view)
- Module dashboards based on capability and role

---

## Module-Specific Roles (NOT IMPLEMENTED)

**Important Note:** The platform does **NOT** currently implement module-specific roles such as:
- ❌ Manager / Supervisor roles
- ❌ Read-only / Viewer roles
- ❌ Module-scoped permissions

The current system uses the binary TENANT_ADMIN / TENANT_USER distinction. Module-level access control would require additional implementation.

---

## Tenant Membership Model

```prisma
model TenantMembership {
  id       String @id @default(uuid())
  tenantId String
  userId   String
  role     TenantRole @default(TENANT_USER)
  isActive Boolean    @default(true)
  
  // Audit fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  tenant Tenant @relation(...)
  user   User   @relation(...)
}
```

---

## Super Admin Override

Per `lib/authorization.ts`, Super Admins can access any tenant as TENANT_ADMIN:

```typescript
// Super admins can access any tenant as admin
if (authResult.user.globalRole === 'SUPER_ADMIN') {
  return {
    ...authResult,
    role: 'TENANT_ADMIN',
    tenantId
  }
}
```

---

## External Portal Users

The platform includes a **Client Portal** (`/portal`) for tenant admins to view their platform status. This is a tenant-facing view, not a public portal.

```typescript
// /app/portal/page.tsx
// CLIENT CANNOT:
// - Change pricing
// - See WebWaka branding
// - Activate capabilities
// - Bypass partner
```

---

## Summary

| Role | Scope | User Management | Settings | Billing | Modules |
|------|-------|-----------------|----------|---------|---------|
| TENANT_ADMIN | Tenant-wide | Full | Full | Full | Full |
| TENANT_USER | Tenant-wide | None | None | None | Limited |

---

## Known Limitations

1. **No granular module roles** - A user is either ADMIN or USER for the entire tenant
2. **No read-only roles** - No explicit viewer role exists
3. **No department-based access** - All users see the same modules
4. **No workflow-based permissions** - Approval chains are not role-scoped

---

## Source Files

- `/app/frontend/prisma/schema.prisma` - TenantRole enum, TenantMembership model
- `/app/frontend/src/lib/authorization.ts` - requireTenantAdmin(), requireTenantMember()
- `/app/frontend/src/app/dashboard/` - Tenant dashboard pages
- `/app/frontend/src/app/portal/` - Client portal

---

**Document Status:** EXTRACTION COMPLETE  
**Verification:** Only TENANT_ADMIN and TENANT_USER roles exist in the schema.
