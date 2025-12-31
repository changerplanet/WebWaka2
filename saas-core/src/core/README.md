# SaaS Core Module

A reusable, production-grade multi-tenant SaaS foundation built with Next.js, Prisma, and PostgreSQL.

## Version

**Current Version:** 1.0.0  
**Release Date:** 2025-12-31

## Features

- ✅ **Multi-Tenancy** - True multi-tenant architecture with strict data isolation
- ✅ **Authentication** - Magic link (passwordless) authentication
- ✅ **Authorization** - Role-based access control (RBAC)
- ✅ **White-Label Branding** - Per-tenant customization (colors, logos, app name)
- ✅ **PWA Support** - Progressive Web App with offline capabilities
- ✅ **Domain Management** - Subdomain and custom domain support with DNS verification
- ✅ **Audit Logging** - Comprehensive action logging
- ✅ **Tenant Isolation** - Database-level enforcement with violation logging

## Installation

```bash
# Copy the core module to your project
cp -r /path/to/saas-core/src/core ./src/
cp -r /path/to/saas-core/src/lib ./src/
cp -r /path/to/saas-core/prisma ./

# Install dependencies
yarn add @prisma/client bcryptjs uuid resend
yarn add -D prisma @types/bcryptjs @types/uuid

# Setup database
npx prisma generate
npx prisma db push
```

## Usage

### Import Core Module

```typescript
import {
  prisma,
  validateTenantAccess,
  createTenantContext,
  requireTenantAdmin,
  getCurrentSession,
  SAAS_CORE_VERSION
} from '@/core'
```

### Tenant Isolation

```typescript
// Always validate before tenant-scoped queries
const context = createTenantContext(tenantId, userId, isSuperAdmin)
validateTenantAccess('TenantMembership', 'findMany', context, queryTenantId)

// Use helper functions for safe queries
await prisma.tenantMembership.findMany({
  where: withTenantFilter({ isActive: true }, tenantId)
})
```

### Authentication

```typescript
// Create magic link
const result = await createMagicLink(email)

// Verify magic link
const session = await verifyMagicLink(token)

// Get current session
const session = await getCurrentSession()
```

### Authorization

```typescript
// Require authentication
const auth = await requireAuth()
if (!auth.authorized) {
  return { error: auth.error }
}

// Require tenant admin
const auth = await requireTenantAdmin(tenantId)
if (!auth.authorized) {
  return { error: auth.error }
}
```

## Tenant-Scoped Models

The following models require tenant isolation:

- `TenantMembership`
- `TenantDomain`
- `AuditLog`

Add your own models to the `TENANT_SCOPED_MODELS` array in `lib/tenant-isolation.ts`.

## API Endpoints

### Authentication
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/verify?token=xxx` - Verify magic link
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout

### Tenants
- `GET /api/tenants` - List tenants (Super Admin)
- `POST /api/tenants` - Create tenant (Super Admin)
- `GET /api/tenants/[slug]` - Get tenant details
- `PATCH /api/tenants/[slug]` - Update tenant (Admin)

### Tenant Settings
- `GET /api/tenants/[slug]/settings` - Get settings (Admin)
- `PATCH /api/tenants/[slug]/settings` - Update settings (Admin)

### Members
- `GET /api/tenants/[slug]/members` - List members
- `POST /api/tenants/[slug]/members` - Add member (Admin)
- `PATCH /api/tenants/[slug]/members/[id]` - Update member (Admin)
- `DELETE /api/tenants/[slug]/members/[id]` - Remove member (Admin)

### Domains
- `GET /api/tenants/[slug]/domains` - List domains (Admin)
- `POST /api/tenants/[slug]/domains` - Add domain (Admin)
- `POST /api/tenants/[slug]/domains/[id]` - Verify domain (Admin)
- `DELETE /api/tenants/[slug]/domains/[id]` - Remove domain (Admin)

### Admin
- `GET /api/admin/tenants` - List all tenants
- `PUT /api/admin/tenants/[id]/status` - Suspend/activate tenant
- `GET /api/admin/audit-logs` - View audit logs
- `POST /api/admin/test-isolation` - Run isolation tests

## Roles

### Global Roles
- `SUPER_ADMIN` - Platform-wide admin access
- `USER` - Regular user (default)

### Tenant Roles
- `TENANT_ADMIN` - Tenant-level admin access
- `TENANT_USER` - Regular tenant member

## Breaking Changes Policy

Starting with version 1.0.0, the following are frozen:

- Database schema structure
- Core API endpoint paths
- TenantContext interface
- Export signatures from `@/core`

Any changes to these will require a major version bump.
