# SaaS Core - Product Requirements Document

## Overview
Production-grade, reusable SaaS Core with Next.js App Router, PostgreSQL (Prisma ORM), and multi-tenant architecture.

## Current Version: saas-core-v1.7.0-partners (STABLE)

---

## Implementation Status: COMPLETE ✅

### Core Infrastructure ✅
- Multi-tenant database schema with Prisma ORM
- PostgreSQL integration via Supabase
- Next.js 14 App Router architecture
- Middleware-based tenant resolution

### Authentication ✅
- Magic link (passwordless) authentication
- Session management with secure cookies
- Resend email integration (MOCKED - dev mode)

### Tenant Features ✅
- Role-based access control (RBAC)
- Application-layer tenant isolation enforcement
- Custom domain support with DNS verification
- Per-tenant branding customization

### PWA & Offline ✅
- Service Worker implementation
- IndexedDB helpers and React hooks
- Offline status components

### Super Admin Dashboard ✅
- Tenant Management (create, suspend, reactivate)
- **All Users** (view, promote, demote)
- Audit Logs

### Partner Program (ALL PHASES COMPLETE) ✅
| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Partner Domain Models | ✅ STABLE |
| 2 | Attribution & Tenant Linking | ✅ STABLE |
| 3 | Subscription & Entitlements | ✅ STABLE |
| 4 | Commission & Earnings Engine | ✅ STABLE |
| 5 | Payout Readiness | ✅ STABLE |
| 6 | Partner Dashboard | ✅ STABLE |
| 7 | Audit Integration | ✅ STABLE |
| 8 | Architecture Validation | ✅ PASSED |
| 9 | Final Lock & Versioning | ✅ RELEASED |

---

## POS Module (MODULE 1)

### Implementation Status: BACKEND COMPLETE ✅

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | POS Domain Model | ✅ COMPLETE |
| 2 | Transaction Engine | ✅ COMPLETE |
| 3 | Offline POS Behavior | ✅ COMPLETE |
| 4 | Inventory Interaction | ✅ COMPLETE |
| 5 | Staff & Permissions | ✅ COMPLETE |
| 6 | POS UI & UX (PWA) | 🔜 NEXT |

### POS Module Architecture

Location: `/app/modules/pos/`

```
modules/pos/
├── prisma/
│   └── schema.prisma     # POS-only models (isolated)
├── src/
│   ├── lib/
│   │   ├── index.ts           # Public exports
│   │   ├── permissions.ts     # Role-based access (CASHIER/SUPERVISOR/MANAGER)
│   │   ├── sale-engine.ts     # Sales state machine
│   │   ├── offline-queue.ts   # Offline action handling
│   │   ├── inventory-consumer.ts # Read-only inventory
│   │   └── event-bus.ts       # Event emission to Core
│   └── app/api/
│       ├── sales/             # Sales CRUD (22 endpoints total)
│       ├── registers/         # Register management
│       ├── shifts/            # Shift tracking
│       ├── refunds/           # Refund processing
│       └── settings/          # POS configuration
└── docs/                      # Module documentation
```

### POS Key Features

- **Permissions**: 40+ granular permissions, 3 role hierarchy
- **Sale Engine**: Full lifecycle (DRAFT → COMPLETED → REFUNDED)
- **Offline Support**: Idempotent actions, conflict resolution
- **Event-Driven**: POS emits events, Core handles inventory

### POS API Endpoints: 22 Total

| Resource | Endpoints |
|----------|-----------|
| Sales | 5 |
| Line Items | 2 |
| Payments | 2 |
| Registers | 2 |
| Sessions | 3 |
| Shifts | 4 |
| Refunds | 2 |
| Settings | 2 |

---

## Architecture Validation Results

✅ **SaaS Core contains all Partner logic**
✅ **POS Module is architecturally isolated**
✅ **POS uses event-driven pattern (never writes to Core tables)**
✅ **Future modules can reuse Partner system** via `entitlements.ts`
✅ **Removing a module does not affect Partner logic**

See: `/docs/PARTNER_ARCHITECTURE_VALIDATION.md`

---

## Module Integration Guide

Modules should use ONLY:

```typescript
import { hasModuleAccess } from '@/lib/entitlements'

const access = await hasModuleAccess(tenantId, 'POS')
```

**DO NOT import from:**
- `partner-*.ts`
- `commission-engine.ts`
- `earnings-ledger.ts`
- `subscription.ts`

---

## API Reference

- Partner APIs: `/docs/PARTNER_API_REFERENCE.md`
- POS APIs: `/modules/pos/docs/POS_API_REFERENCE.md`

All Partner APIs are marked **STABLE** and follow semantic versioning.

---

## Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Email Sending | MOCKED | Magic link shown in UI |
| Payout Execution | DISABLED | Preparation only |
| Payment Gateway | NOT INTEGRATED | Future work |
| POS Database | MOCKED | API returns mock data |
| POS UI | NOT BUILT | Phase 6 pending |

---

## Backlog / Future Work

### P0 - POS Module Completion
- **Phase 6**: POS UI & UX (PWA) - Frontend for Point of Sale

### P2 - Production Readiness
- Production Email Sending - Resend domain verification
- Payment Gateway Integration - Stripe/PayPal
- POS Database Integration - Connect to Supabase

### P3 - Additional Modules
- SVM (Service-based Vertical Module)
- MVM (Multi-sided Vertical Marketplace)

---

## Documentation

| Document | Location |
|----------|----------|
| Partner Access Control | `/docs/PARTNER_ACCESS_CONTROL.md` |
| Partner Attribution | `/docs/PARTNER_ATTRIBUTION.md` |
| Subscription & Entitlements | `/docs/SUBSCRIPTION_ENTITLEMENT.md` |
| Commission & Earnings | `/docs/COMMISSION_EARNINGS.md` |
| Payout Readiness | `/docs/PAYOUT_READINESS.md` |
| Partner Dashboard | `/docs/PARTNER_DASHBOARD.md` |
| Architecture Validation | `/docs/PARTNER_ARCHITECTURE_VALIDATION.md` |
| API Reference | `/docs/PARTNER_API_REFERENCE.md` |
| Release Notes | `/RELEASE_NOTES_v1.7.0-partners.md` |
| **POS Domain Model** | `/modules/pos/docs/POS_DOMAIN_MODEL.md` |
| **POS Transaction Engine** | `/modules/pos/docs/POS_TRANSACTION_ENGINE.md` |
| **POS Offline Behavior** | `/modules/pos/docs/POS_OFFLINE_BEHAVIOR.md` |
| **POS Inventory Interaction** | `/modules/pos/docs/POS_INVENTORY_INTERACTION.md` |
| **POS Permissions** | `/modules/pos/docs/POS_PERMISSIONS.md` |
| **POS API Reference** | `/modules/pos/docs/POS_API_REFERENCE.md` |

---

## Test Credentials

| User | Email | Role |
|------|-------|------|
| Super Admin | superadmin@saascore.com | SUPER_ADMIN |
| Partner User | admin@acme.com | USER + PARTNER_OWNER |
| Tenant Admin | admin@beta.com | USER + TENANT_ADMIN |

**Auth Method:** Magic Link (click "Sign In Now" after entering email)

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| **1.8.0-pos-backend** | 2026-01-01 | POS Module backend complete (Phases 1-5) |
| **1.7.0-partners** | 2026-01-01 | **STABLE RELEASE** - Partner system complete |
| 1.6.0 | 2026-01-01 | Partner Dashboard & Audit (Phase 6 & 7) |
| 1.5.0 | 2025-01-01 | Payout Readiness (Phase 5) |
| 1.4.0 | 2025-01-01 | Commission & Earnings (Phase 4) |
| 1.3.0 | 2025-01-01 | Subscription & Entitlements (Phase 3) |
| 1.2.0 | 2025-01-01 | Attribution & Tenant Linking (Phase 2) |
| 1.1.0 | 2025-01-01 | Partner Domain Models (Phase 1) |
| 1.0.0 | 2024-12-31 | Initial SaaS Core release |

---

## Release Tag

**saas-core-v1.8.0-pos-backend**

POS Module backend complete. Ready for Phase 6 (UI/UX).
