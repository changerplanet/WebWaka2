# SaaS Core Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-31

### Added

#### Core Infrastructure
- Multi-tenant database schema with Prisma ORM
- PostgreSQL integration via Supabase
- Next.js 14 App Router architecture

#### Authentication
- Magic link (passwordless) authentication
- Session management with secure cookies
- Resend email integration

#### Authorization
- Role-based access control (RBAC)
- Global roles: SUPER_ADMIN, USER
- Tenant roles: TENANT_ADMIN, TENANT_USER
- Authorization helper functions

#### Tenant Isolation
- Application-level tenant isolation enforcement
- Cross-tenant access prevention
- SUPER_ADMIN bypass mechanism
- Violation logging

#### Multi-Tenancy
- Tenant resolution via hostname/subdomain
- Custom domain support with DNS verification
- Per-tenant branding (colors, logos, app name)

#### PWA & Offline
- Service Worker with background sync
- IndexedDB for offline data storage
- Offline action queue
- Dynamic PWA manifest per tenant

#### UI Components
- Settings page with 4 tabs (General, Members, Domains, Branding)
- Member management with role change
- Domain management with verification instructions
- Branding customization with live preview
- Offline status indicator

#### Admin Features
- Super Admin dashboard
- Tenant management (create, suspend, reactivate)
- Audit log viewing
- Tenant isolation testing

### API Endpoints
- Auth: magic-link, verify, session, logout
- Tenants: CRUD, settings, members, domains
- Admin: tenants, audit-logs, test-isolation

### Frozen API Surface
The following are now frozen and will not change without a major version bump:

```typescript
// Core exports from @/core
export {
  prisma,
  validateTenantAccess,
  createTenantContext,
  withTenantFilter,
  withTenantData,
  TenantIsolationError,
  isTenantScopedModel,
  getCurrentSession,
  requireAuth,
  requireSuperAdmin,
  requireTenantAdmin,
  requireTenantMember,
  resolveTenant,
  getTenantBranding,
  SAAS_CORE_VERSION
}

// TenantContext interface
interface TenantContext {
  tenantId: string | null
  userId: string | null
  isSuperAdmin: boolean
  bypassIsolation?: boolean
}
```

### Known Limitations
- Email sending requires verified domain with Resend
- DNS verification requires actual DNS records (cannot test locally)
- Offline sync works only in supported browsers

### Security Notes
- All tenant-scoped queries MUST use validateTenantAccess()
- Session cookies are HttpOnly and Secure
- Cross-tenant access is logged and blocked
- SUPER_ADMIN bypass is explicitly logged
