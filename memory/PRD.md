# SaaS Core - Product Requirements Document

## Overview
Production-grade, reusable SaaS Core with Next.js App Router, PostgreSQL (Prisma ORM), and multi-tenant architecture.

## Current Version: saas-core-v1.12.0 + pos-v1.0.0 + svm-v1.1.0 + mvm-v1.0.0

---

## Phase C: Production Readiness (Jan 2026) ✅ COMPLETE

### Step C3: Security & Observability ✅ COMPLETE (Jan 2, 2026)

**Implemented:**
- **Rate Limiting** - Per-endpoint limits with in-memory tracking
- **Audit Logging** - Structured logging with severity levels and batching
- **Security Middleware** - Input validation, tenant access checks, security headers
- **Metrics Endpoint** - Health checks and system metrics at `/api/metrics`

**Rate Limit Configurations:**
| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| `/api/auth/*` | 1 min | 10 |
| `/api/wallets/*` | 1 min | 60 |
| `/api/svm/cart/*` | 1 min | 100 |
| `/api/svm/orders/*` | 1 min | 30 |

**Files Created:**
- `/src/lib/rate-limiter.ts`
- `/src/lib/audit-logger.ts`
- `/src/lib/security-middleware.ts`
- `/src/app/api/metrics/route.ts`

---

### Step C2: Performance & Load Testing ✅ COMPLETE (Jan 2, 2026)

**Implemented:**
- Load testing framework with autocannon
- Configurable test scenarios (health, cart, wallet, orders, high-concurrency)
- Performance analysis and recommendations

**Bottleneck Analysis:**
- Database latency (remote Supabase ~200-600ms)
- Recommendations: Connection pooling, Redis caching, read replicas

**Files Created:**
- `/load-tests/run-load-tests.js`
- `/docs/PRODUCTION_READINESS.md`

---

### Step C1: Testing ✅ COMPLETE (Jan 2, 2026)

**Scope:**
- Unit tests for core services
- Integration tests for API endpoints
- E2E flow tests
- Tenant isolation tests

**Test Coverage:**
- **Total Tests**: 77
- **Pass Rate**: 100% (77/77)
- **Unit Tests**: 20 (Commerce Wallet Service)
- **Integration Tests**: 44 (SVM Cart, Orders, Wallet APIs, Tenant Isolation)
- **E2E Tests**: 13 (Cart→Order→Wallet, Refund, Payout flows)

**Test Files Created:**
```
__tests__/
├── setup.ts                              # Jest configuration
├── unit/
│   └── commerce-wallet-service.test.ts   # 20 tests
├── integration/
│   ├── svm-cart-orders.test.ts           # 21 tests
│   └── wallet-api.test.ts                # 23 tests
└── e2e/
    └── event-flows.test.ts               # 13 tests
```

**Key Validations:**
- ✅ Tenant Isolation (cross-tenant access blocked)
- ✅ Event Flows (order lifecycle, wallet transactions)
- ✅ Idempotency (duplicate operations handled)
- ✅ Data Integrity (ledger matches wallet balance)

**Test Commands:**
```bash
yarn test          # All tests
yarn test:unit     # Unit tests
yarn test:integration  # Integration tests
yarn test:e2e      # E2E tests
yarn test:coverage # With coverage report
```

---

## Phase B: Commerce Completeness (Jan 2026)

### Step B2: Wallet System ✅ COMPLETE (Jan 2, 2026)

**Scope:**
- Customer wallets (for refunds, store credit)
- Vendor wallets (for MVM earnings)
- Platform wallet (for fees/commissions)
- Ledger-based accounting (append-only, immutable)

**Database Models Added (Prisma):**
- `CommerceWallet` - Customer, Vendor, or Platform wallets with balance tracking
- `CommerceWalletLedger` - Immutable, append-only ledger entries (source of truth)
- `CommercePayout` - Payout tracking for Step B3

**API Endpoints:**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/wallets` | GET, POST | List wallets, create wallet (CUSTOMER/VENDOR/PLATFORM) |
| `/api/wallets/[walletId]` | GET, PUT, POST | Get wallet details, update status, perform operations (credit/debit/hold) |
| `/api/wallets/[walletId]/ledger` | GET | Get ledger entries with filters |
| `/api/wallets/transfer` | POST | Transfer funds between wallets |

**Ledger Entry Types:**
- **Credits**: CREDIT_ORDER_PAYMENT, CREDIT_REFUND, CREDIT_SALE_PROCEEDS, CREDIT_PLATFORM_FEE, CREDIT_ADJUSTMENT, CREDIT_TRANSFER_IN
- **Debits**: DEBIT_ORDER_PAYMENT, DEBIT_VENDOR_COMMISSION, DEBIT_PLATFORM_FEE, DEBIT_PAYOUT, DEBIT_ADJUSTMENT, DEBIT_TRANSFER_OUT
- **Holds**: HOLD_CREATED, HOLD_RELEASED, HOLD_CAPTURED

**Key Features:**
- Ledger-based accounting (wallet.balance is just a cache)
- Idempotency via idempotencyKey prevents duplicate entries
- Holds reduce availableBalance without affecting total balance
- Atomic transfers between wallets
- Balance recalculation from ledger for reconciliation
- Wallet status management (ACTIVE, FROZEN, SUSPENDED, CLOSED)

**Testing:** 100% pass rate (48/48 tests) - `/app/test_reports/iteration_13.json`

**Files Created:**
- `/app/saas-core/src/lib/commerce-wallet-service.ts` - Core wallet service
- `/app/saas-core/src/app/api/wallets/route.ts` - List/create wallets
- `/app/saas-core/src/app/api/wallets/[walletId]/route.ts` - Wallet operations
- `/app/saas-core/src/app/api/wallets/[walletId]/ledger/route.ts` - Ledger API
- `/app/saas-core/src/app/api/wallets/transfer/route.ts` - Transfer API
- `/app/saas-core/prisma/schema.prisma` - Added CommerceWallet, CommerceWalletLedger, CommercePayout models

---

### Step B1: SVM Cart & Order Persistence ✅ COMPLETE (Jan 2, 2026)

**Scope:**
- Persistent carts per customer (sessionId or customerId)
- Persistent orders with full lifecycle management
- Recovery after session loss
- Uses Core Customers and Products (reference only)

**Database Models Added (Prisma):**
- `SvmCart` - Customer shopping carts with status tracking
- `SvmCartItem` - Line items in carts
- `SvmOrder` - Orders with status, payment, and fulfillment tracking
- `SvmOrderItem` - Line items in orders with fulfillment tracking

**API Endpoints:**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/svm/cart` | GET, POST, DELETE | Cart CRUD with actions (ADD_ITEM, UPDATE_QUANTITY, REMOVE_ITEM, SET_SHIPPING, SET_EMAIL, APPLY_PROMO) |
| `/api/svm/orders` | GET, POST | Create orders from cart or direct items, list with filters |
| `/api/svm/orders/[orderId]` | GET, PUT, DELETE | Order details, status updates, cancellation |

**Order Status Flow:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓           ↓           ↓
 CANCELLED  CANCELLED  CANCELLED  CANCELLED  → REFUNDED
```

**Payment Status Flow:**
```
PENDING → AUTHORIZED → CAPTURED → PARTIALLY_REFUNDED → REFUNDED
    ↓         ↓
  FAILED   CANCELLED
```

**Fulfillment Status Flow:**
```
UNFULFILLED → PARTIALLY_FULFILLED → FULFILLED
```

**Key Features:**
- Cart merging (same product increases quantity)
- Cart expiration and abandonment tracking
- Order creation from cart (converts cart to CONVERTED status)
- Order creation with direct items
- Status transition validation with clear error messages
- Tracking info with automatic shipped timestamp
- Complete audit trail (timestamps for all state changes)

**Testing:** 100% pass rate (43/43 tests) - `/app/test_reports/iteration_12.json`

**Files Created/Modified:**
- `/app/saas-core/src/app/api/svm/cart/route.ts` - Rewritten for DB persistence
- `/app/saas-core/src/app/api/svm/orders/route.ts` - Rewritten for DB persistence
- `/app/saas-core/src/app/api/svm/orders/[orderId]/route.ts` - New: Order operations
- `/app/saas-core/prisma/schema.prisma` - Added SvmCart, SvmOrder models

---

## Phase A: Product UI Implementation (Jan 2026)

### Step A0: UI Phase Constitution ✅ COMPLETE
- Acknowledged backend freeze
- Defined UI scope for POS, SVM, MVM modules
- Established no-backend-change rule

### Step A1: POS UI Polish ✅ COMPLETE (Jan 2, 2026)
- **Fixed TypeScript build errors** in `POSProvider.tsx` and `ProductSearch.tsx`
- **Added demo locations fallback** when no database locations exist
- **Added demo products** (20 items: coffee, tea, pastries, sandwiches, snacks)
- **Implemented touch-first UI** with:
  - Location selection screen with 3 demo locations (Main Store, Downtown Branch, Warehouse)
  - Staff login with name input and PIN pad
  - Main POS screen with product grid, cart, and checkout
  - Payment screen with Cash, Card, Mobile Pay, Store Credit options
  - Cash payment with change calculation
  - Payment success screen with sale ID and New Sale button
- **Added data-testid attributes** for all interactive elements
- **Demo mode checkout** - saves sales to localStorage when using demo locations/products
- **Testing**: 100% frontend test pass rate (iteration_10.json)

**Files Modified:**
- `/app/saas-core/src/components/pos/POSProvider.tsx` - Fixed TypeScript errors, added demo locations & products, demo checkout
- `/app/saas-core/src/components/pos/ProductSearch.tsx` - Fixed useRef type
- `/app/saas-core/src/components/pos/LocationSelect.tsx` - Added data-testid attributes
- `/app/saas-core/src/components/pos/POSStatusBar.tsx` - Added data-testid
- `/app/saas-core/src/components/pos/POSCart.tsx` - Added data-testid
- `/app/saas-core/src/app/pos/page.tsx` - Added data-testid attributes

**Demo Data (MOCKED):**
- **Locations**: Main Store (RETAIL), Downtown Branch (RETAIL), Warehouse (WAREHOUSE)
- **Products**: 20 demo products including coffees, teas, pastries, sandwiches, and snacks
- **Sales**: Saved to localStorage in demo mode (key: `pos_demo_sales`)

**Known Limitation**: ~~Change amount display on success screen may show incorrect value due to cart clearing timing~~ **FIXED**

### Step A2: SVM Storefront UI ✅ COMPLETE (Jan 2, 2026)
**Customer-facing e-commerce storefront**

**Components Created:**
- `/app/saas-core/src/components/svm/SVMProvider.tsx` - State management with demo data
- `/app/saas-core/src/components/svm/ProductComponents.tsx` - ProductGrid, ProductCard, ProductDetail
- `/app/saas-core/src/components/svm/CartComponents.tsx` - CartDrawer, MiniCart
- `/app/saas-core/src/components/svm/CheckoutComponents.tsx` - Multi-step checkout
- `/app/saas-core/src/components/svm/OrderConfirmation.tsx` - Order success page
- `/app/saas-core/src/app/store/page.tsx` - Main store page at `/store`

**Features:**
- Product listing with search, filters, sorting, grid/list view
- Product detail with variant selection and quantity
- Cart drawer with promo code support
- 4-step checkout: Shipping → Delivery → Payment → Review
- Order confirmation with all details
- Free shipping on orders over $50
- Responsive design
- data-testid attributes for all interactive elements

**Demo Data (MOCKED):**
- 8 products across 4 categories
- 3 shipping options (Standard, Express, Overnight)
- Promo codes: SAVE10, DEMO
- Orders saved to localStorage

**API Usage:**
- `/api/svm/catalog` - Product listing and details
- `/api/svm/cart` - Cart operations
- `/api/svm/shipping` - Shipping calculation
- `/api/svm/promotions` - Promo validation
- `/api/svm/orders` - Order creation

**Documentation:** `/app/modules/svm/docs/SVM_UI_COMPONENT_MAPPING.md`

### Step A3: MVM Vendor Portal UI ✅ COMPLETE (Jan 2, 2026)
**Vendor dashboard for Multi-Vendor Marketplace**

**Components Created:**
- `/app/saas-core/src/components/mvm/MVMProvider.tsx` - State management with demo data
- `/app/saas-core/src/components/mvm/VendorDashboard.tsx` - Main dashboard
- `/app/saas-core/src/components/mvm/VendorOrders.tsx` - Orders view with filtering
- `/app/saas-core/src/components/mvm/VendorProducts.tsx` - Product mapping management
- `/app/saas-core/src/components/mvm/VendorEarnings.tsx` - Earnings/commission view
- `/app/saas-core/src/components/mvm/VendorProfile.tsx` - Profile management
- `/app/saas-core/src/app/vendor/page.tsx` - Main vendor portal at `/vendor`

**Features:**
- Dashboard with metrics (sales, orders, rating, pending earnings)
- Orders view with status filtering and search
- Order detail modal with commission breakdown
- Product mapping to Core catalog
- Earnings tracking (read-only)
- Profile management with edit mode
- Responsive sidebar navigation
- data-testid attributes for all interactive elements

**Demo Data (MOCKED):**
- Vendor profile (APPROVED, Verified, Gold Tier)
- 4 demo orders with various statuses
- 4 product mappings with revenue data
- 4 commission records

**API Usage:**
- `/api/mvm/vendors/:vendorId` - Vendor profile
- `/api/mvm/vendors/:vendorId/dashboard` - Dashboard data
- `/api/mvm/vendors/:vendorId/orders` - Orders list
- `/api/mvm/vendors/:vendorId/products` - Product mappings
- `/api/mvm/commissions` - Commission records

**Permissions:**
- View-only: Dashboard, Orders, Earnings
- Edit: Profile, Product Mappings
- No access: Payouts, Wallet mutations

**Documentation:** `/app/modules/mvm/docs/MVM_UI_COMPONENT_MAPPING.md`

---

## System Verification & Remediation Status ✅

| Step | Task | Status |
|------|------|--------|
| 1 | Implement Shared Business Entities | ✅ COMPLETE |
| 2 | Add MVM Event Handlers | ✅ COMPLETE |
| 3 | Add Subscription Grace Period | ✅ COMPLETE |
| 4 | Verify PWA Manifest Placement | ✅ COMPLETE |
| 5 | Add POS Table Prefixes (`pos_*`) | ✅ COMPLETE |

### Remediation Summary (Dec 2025)
- **Step 1**: Added 11 shared entities to `/app/saas-core/prisma/schema.prisma` (Product, Customer, Inventory, Wallet, etc.)
- **Step 2**: Created `/app/saas-core/src/lib/mvm-event-handlers.ts` and `/api/mvm/events` route
- **Step 3**: Enhanced subscription model with grace period and suspension logic
- **Step 4**: Verified dynamic PWA manifest and added static fallback
- **Step 5**: Added `@@map("pos_...")` directives to all 14 POS tables for consistent naming

---

## P1: Module Integration with Core Entities ✅ (Jan 2026)

### Overview
Integrated POS, SVM, and MVM modules to consume Core shared entities as the single source of truth.

### Core Services Created (`/app/saas-core/src/lib/core-services.ts`):
- `CoreInventoryService` - Product/Inventory queries
- `CoreCustomerService` - Customer lookup
- `CoreLocationService` - Location data

### API Routes Created:

**POS Module:**
- `/api/pos/products` - Product search with inventory
- `/api/pos/inventory` - Inventory snapshot and checks
- `/api/pos/customers` - Customer lookup
- `/api/pos/locations` - Location data

**SVM Module:**
- `/api/svm/catalog` - Product catalog access
- `/api/svm/inventory` - Inventory checks
- `/api/svm/customers` - Customer lookup

**MVM Module:**
- `/api/mvm/catalog` - Product catalog for vendor mapping
- `/api/mvm/inventory` - Inventory checks
- `/api/mvm/customers` - Limited customer info for vendors

### Verification:
- [x] All modules read from Core via APIs
- [x] No shadow tables exist
- [x] No direct Core mutations
- [x] Tenant isolation preserved
- [x] Vendors are NOT treated as tenants (MVM)
- [x] Single payment flow (MVM order splitting)

### Documentation:
- `/app/modules/pos/docs/POS_CORE_INTEGRATION_CHECKLIST.md`
- `/app/modules/svm/docs/SVM_CORE_INTEGRATION_CHECKLIST.md`
- `/app/modules/mvm/docs/MVM_CORE_INTEGRATION_CHECKLIST.md`

---

## P0: SVM Shipping & Promotions Database Refactor ✅ (Jan 2026)

### What was changed:
- Replaced in-memory `globalThis` storage with Prisma database persistence
- Added 4 new models to SaaS Core schema: `SvmShippingZone`, `SvmShippingRate`, `SvmPromotion`, `SvmPromotionUsage`
- Refactored `/app/saas-core/src/lib/shipping-storage.ts` to use async Prisma operations
- Refactored `/app/saas-core/src/lib/promotions-storage.ts` to use async Prisma operations
- Updated all API routes to use async storage functions

### Verification Checklist:
- [x] Shipping zones persist across server restarts
- [x] Promotions persist across server restarts
- [x] No cross-tenant data leakage (tenant isolation verified)
- [x] Zone CRUD operations work (create, read, update, delete)
- [x] Promotion CRUD operations work (create, read, update, delete)
- [x] Shipping calculation returns correct rates
- [x] Promotion validation and calculation work correctly
- [x] Automatic promotions applied correctly
- [x] Free shipping threshold logic works
- [x] Compatible with multi-instance deployment (uses database, not memory)

---

## P2: MVM Module Mounting ✅ (Jan 2026)

### Routes Mounted (13 total):
- `/api/mvm/catalog` - Product catalog (Core)
- `/api/mvm/inventory` - Inventory checks (Core)
- `/api/mvm/customers` - Customer lookup (Core)
- `/api/mvm/entitlements` - Entitlement checks
- `/api/mvm/events` - Event processing
- `/api/mvm/vendors` - Vendor CRUD
- `/api/mvm/vendors/:vendorId` - Individual vendor ops
- `/api/mvm/vendors/:vendorId/products` - Product mappings
- `/api/mvm/vendors/:vendorId/orders` - Vendor sub-orders
- `/api/mvm/vendors/:vendorId/dashboard` - Vendor dashboard
- `/api/mvm/orders` - Multi-vendor orders
- `/api/mvm/orders/:orderId` - Individual order ops
- `/api/mvm/commissions` - Commission queries

### Verification:
- [x] All MVM APIs reachable via saas-core
- [x] Tenant isolation enforced
- [x] No business logic changes
- [x] No new schemas or services
- [x] Commission = calculation only (no wallet/payout)

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

## POS Module (MODULE 1) — FROZEN ❄️

### Version: `pos-v1.0.0`

### Implementation Status: ALL PHASES COMPLETE ✅

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | POS Domain Model | ✅ COMPLETE |
| 2 | Transaction Engine | ✅ COMPLETE |
| 3 | Offline POS Behavior | ✅ COMPLETE |
| 4 | Inventory Interaction | ✅ COMPLETE |
| 5 | Staff & Permissions | ✅ COMPLETE |
| 6 | POS UI & UX (PWA) | ✅ COMPLETE |
| 7 | Events & Analytics | ✅ COMPLETE |
| 8 | Module Entitlements | ✅ COMPLETE |
| 9 | Module Freeze | ✅ FROZEN |

### Validation Results (56 tests passed)
- ✅ No Core schema modifications
- ✅ No cross-module dependencies
- ✅ No billing logic present
- ✅ Events module-scoped (`pos.*`)
- ✅ Entitlements abstracted
- ✅ Safe removal possible

### POS Module Architecture

Location: `/app/modules/pos/`

### Database Tables (14 total)
`pos_registers`, `pos_register_sessions`, `pos_shifts`, `pos_sales`, `pos_sale_line_items`, `pos_sale_discounts`, `pos_payments`, `pos_refunds`, `pos_refund_items`, `pos_layaways`, `pos_layaway_items`, `pos_layaway_payments`, `pos_settings`, `pos_discount_rules`

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
│   │   ├── entitlements.ts    # Feature/limit checks
│   │   └── event-bus.ts       # Event emission to Core
│   ├── components/pos/        # UI components
│   ├── hooks/                 # React hooks
│   └── app/api/
│       ├── sales/             # Sales CRUD (22 endpoints total)
│       ├── registers/         # Register management
│       ├── shifts/            # Shift tracking
│       ├── refunds/           # Refund processing
│       └── settings/          # POS configuration
└── docs/                      # 10 documentation files
```

### POS Key Features

- **Permissions**: 40+ granular permissions, 3-level role hierarchy
- **Sale Engine**: Full lifecycle (DRAFT → COMPLETED → REFUNDED)
- **Offline Support**: IndexedDB, idempotent actions, conflict resolution
- **Event-Driven**: 20 event types, all `pos.*` scoped
- **Entitlements**: Feature/limit checks without billing knowledge
- **Touch-First UI**: 7 components with offline support

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

## POS Core Integration (NEW)

### Event Handlers
| Event | Core Action |
|-------|-------------|
| `pos.sale.completed` | Audit log, (future: inventory deduction) |
| `pos.sale.cancelled` | Audit log, (future: inventory release) |
| `pos.payment.captured` | Audit log, record payment |
| `pos.refund.created` | Audit log, (future: inventory restore) |

### API Routes (Core)
| Route | Purpose |
|-------|---------|
| `POST /api/pos/events` | Receive POS events |
| `GET /api/pos/entitlements` | Return tenant entitlements |

### Files Created
- `/saas-core/src/lib/pos-event-handlers.ts` - Event handlers
- `/saas-core/src/app/api/pos/events/route.ts` - Events API
- `/saas-core/src/app/api/pos/entitlements/route.ts` - Entitlements API
- `/modules/pos/scripts/migrate-pos.sh` - DB migration script
- `/modules/pos/docs/POS_CORE_INTEGRATION.md` - Integration guide

### Database Migration
**Status**: Script ready, requires DATABASE_URL from Supabase
```bash
./modules/pos/scripts/migrate-pos.sh push
```

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

## SVM Module (MODULE 2) — FROZEN ❄️

### Version: `svm-v1.0.0`

### Implementation Status

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Module Constitution | ✅ COMPLETE |
| 1 | Domain Model | ✅ COMPLETE |
| 2 | Catalog Consumption | ✅ COMPLETE |
| 3 | Online Order Lifecycle | ✅ COMPLETE |
| 4 | Shipping Logic | ✅ COMPLETE |
| 5 | Promotions Engine | ✅ COMPLETE |
| 6 | Offline & PWA | ✅ COMPLETE |
| 7 | Events & Analytics | ✅ COMPLETE |
| 8 | Entitlement Enforcement | ✅ COMPLETE |
| 9 | Module Freeze | ✅ FROZEN |

### Post-Freeze Phases (Future)
| Phase | Feature | Status |
|-------|---------|--------|
| 10 | Reviews & Ratings | ⏳ Pending |
| 11 | SEO & Metatags | ⏳ Pending |
| 12 | Storefront UI (PWA) | ⏳ Pending |

### SVM Module Architecture

Location: `/app/modules/svm/`

**SVM OWNS:**
- OnlineOrder / OnlineOrderItem
- ShippingZone / ShippingRate
- Promotion / PromotionUsage
- Review
- StorefrontPage / StorefrontBanner / StorefrontSettings
- Cart / CartItem / Wishlist / WishlistItem

**SVM DOES NOT OWN (Core references only):**
- Products, Inventory, Customers, Payments, Wallets

### Database Tables (15 total)
`svm_online_orders`, `svm_online_order_items`, `svm_order_status_history`, `svm_shipping_zones`, `svm_shipping_rates`, `svm_promotions`, `svm_promotion_usages`, `svm_reviews`, `svm_storefront_pages`, `svm_storefront_banners`, `svm_storefront_settings`, `svm_carts`, `svm_cart_items`, `svm_wishlists`, `svm_wishlist_items`

### SVM API Endpoints (Phase 5 Complete)

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| Orders | `/api/svm/orders` | POST | Create order |
| Orders | `/api/svm/orders` | GET | List orders |
| Orders | `/api/svm/orders/:orderId` | GET | Get order |
| Orders | `/api/svm/orders/:orderId` | PUT | Update order status |
| Orders | `/api/svm/orders/:orderId` | DELETE | Cancel order |
| Cart | `/api/svm/cart` | GET | Get cart |
| Cart | `/api/svm/cart` | POST | Cart actions |
| Cart | `/api/svm/cart` | DELETE | Clear cart |
| Products | `/api/svm/products` | GET | List products |
| Products | `/api/svm/products/:productId` | GET | Get product |
| Shipping | `/api/svm/shipping` | POST | Calculate shipping options |
| Shipping | `/api/svm/shipping` | GET | List shipping zones |
| Shipping | `/api/svm/shipping/zones` | POST | Create zone |
| Shipping | `/api/svm/shipping/zones/:zoneId` | GET | Get zone details |
| Shipping | `/api/svm/shipping/zones/:zoneId` | PUT | Update zone/rates |
| Shipping | `/api/svm/shipping/zones/:zoneId` | DELETE | Delete zone |
| **Promotions** | `/api/svm/promotions` | GET | **List promotions** |
| **Promotions** | `/api/svm/promotions` | POST | **Create, validate, calculate** |
| **Promotions** | `/api/svm/promotions/:id` | GET | **Get promotion** |
| **Promotions** | `/api/svm/promotions/:id` | PUT | **Update promotion** |
| **Promotions** | `/api/svm/promotions/:id` | DELETE | **Delete promotion** |
| Entitlements | `/api/svm/entitlements` | GET | Get module entitlements |
| Events | `/api/svm/events` | POST | Process SVM events |

### Order State Machine
```
DRAFT → PLACED → PAID → PROCESSING → SHIPPED → DELIVERED → FULFILLED
   ↓       ↓       ↓         ↓           ↓          ↓
CANCELLED  CANCELLED CANCELLED/REFUNDED  REFUNDED   REFUNDED
```

### Event Types
- `svm.order.created`, `svm.order.placed`, `svm.order.payment_requested`
- `svm.order.paid`, `svm.order.processing`, `svm.order.shipped`
- `svm.order.delivered`, `svm.order.fulfilled`, `svm.order.cancelled`
- `svm.order.refund_requested`, `svm.order.refunded`, `svm.order.status_changed`

### Testing Results (Phase 3)
- **54 backend tests passed** (100% pass rate)
- Order creation, status transitions, cart operations all working
- Event processing with idempotency checks working
- Entitlements API returning proper features/limits

### Testing Results (Phase 4 - Shipping)
- Zone-based shipping calculation working
- Free shipping thresholds ($50 US, $75 CA, $100 Express)
- Zone CRUD operations (create, read, update, delete)
- Rate management (add, update, delete rates per zone)
- Cheapest/fastest option identification
- Weight-based calculations

### Testing Results (Phase 5 - Promotions)
- Percentage discounts with max cap
- Fixed amount discounts, per-item discounts
- Free shipping promotions
- Buy X Get Y (BOGO) deals
- Automatic promotions applied when conditions met
- Coupon code validation with detailed error messages
- First order only restriction
- Minimum order total/quantity validation
- Stackable and non-stackable promotions
- CRUD operations (create, read, update, delete)

### Promotions Capabilities (Phase 5)
- **Discount types**: PERCENTAGE, FIXED_AMOUNT, FIXED_PER_ITEM, FREE_SHIPPING, BUY_X_GET_Y
- **Promotion types**: COUPON, AUTOMATIC, FLASH_SALE
- **Conditions**: Min order total, min quantity, product/category restrictions
- **Limits**: Usage limit, per-customer limit, date range
- **Stacking**: Priority-based, stackable flag

### Offline & PWA Capabilities (Phase 6)
- **Offline-safe actions**: Browse products, manage cart, view wishlist, search cached
- **Online-required actions**: Place order, checkout, payment, validate coupon
- **Local storage**: Cart, wishlist, cached products persisted offline
- **Service worker**: Caching strategies for different resources
- **UI components**: OfflineBanner, ConnectionIndicator, OfflineBlocker, SyncStatus
- **Queue system**: Queueable actions (reviews, profile updates) for later sync

### Shipping Capabilities (Phase 4)
- **Zone-based shipping**: Country, state, city, postal code matching
- **Rate types**: Flat, weight-based, price-based, item-based
- **Free shipping rules**: Per-rate thresholds with amount-to-free display
- **Product restrictions**: Include/exclude by product ID or category
- **Default zones**: US Domestic, Canada, International auto-created

### Files Created (Phase 3)
**SaaS Core:**
- `/saas-core/src/lib/svm-event-handlers.ts`
- `/saas-core/src/app/api/svm/orders/route.ts`
- `/saas-core/src/app/api/svm/orders/[orderId]/route.ts`
- `/saas-core/src/app/api/svm/cart/route.ts`
- `/saas-core/src/app/api/svm/products/route.ts`
- `/saas-core/src/app/api/svm/products/[productId]/route.ts`
- `/saas-core/src/app/api/svm/entitlements/route.ts`
- `/saas-core/src/app/api/svm/events/route.ts`

**SVM Module:**
- `/modules/svm/src/lib/order-engine.ts`
- `/modules/svm/src/app/api/orders/route.ts`
- `/modules/svm/src/app/api/orders/[orderId]/route.ts`
- `/modules/svm/src/app/api/products/route.ts`
- `/modules/svm/src/app/api/products/[productId]/route.ts`
- `/modules/svm/src/app/api/cart/route.ts`
- `/modules/svm/docs/SVM_API_REFERENCE.md`

### Files Created (Phase 4 - Shipping)
**SaaS Core:**
- `/saas-core/src/lib/shipping-storage.ts` - Shared globalThis storage
- `/saas-core/src/app/api/svm/shipping/route.ts` - Calculate & list zones
- `/saas-core/src/app/api/svm/shipping/zones/route.ts` - Create zone
- `/saas-core/src/app/api/svm/shipping/zones/[zoneId]/route.ts` - Zone CRUD

**SVM Module:**
- `/modules/svm/src/lib/shipping-engine.ts` - Business logic classes
- `/modules/svm/docs/SVM_SHIPPING.md` - Documentation

### Files Created (Phase 5 - Promotions)
**SaaS Core:**
- `/saas-core/src/lib/promotions-storage.ts` - Shared globalThis storage
- `/saas-core/src/app/api/svm/promotions/route.ts` - List, create, validate, calculate
- `/saas-core/src/app/api/svm/promotions/[promotionId]/route.ts` - Get, update, delete

**SVM Module:**
- `/modules/svm/src/lib/promotions-engine.ts` - Business logic classes
- `/modules/svm/docs/SVM_PROMOTIONS.md` - Documentation

### Files Created (Phase 6 - Offline & PWA)
**SVM Module:**
- `/modules/svm/src/lib/offline-behavior.ts` - Offline behavior rules and utilities
- `/modules/svm/src/components/offline-ui.tsx` - React components for offline UI
- `/modules/svm/public/sw.js` - Service worker for caching
- `/modules/svm/public/manifest.json` - PWA manifest
- `/modules/svm/docs/SVM_OFFLINE.md` - Documentation

### Files Created (Phase 7 - Events & Analytics)
**SVM Module:**
- `/modules/svm/src/lib/event-bus.ts` - Event emitter and payload schemas
- `/modules/svm/docs/SVM_EVENTS.md` - Event documentation

### Files Created (Phase 8 - Entitlements)
**SVM Module:**
- `/modules/svm/src/lib/entitlements.ts` - Entitlement service and checks
- `/modules/svm/docs/SVM_ENTITLEMENTS.md` - Entitlement documentation

### Files Created (Phase 9 - Module Freeze)
**SVM Module:**
- `/modules/svm/docs/SVM_VALIDATION_CHECKLIST.md` - Architecture validation

### Current Mocked Components
| Component | Status | Notes |
|-----------|--------|-------|
| Product Catalog | MOCKED | Returns empty (Core not integrated) |
| Cart Storage | MOCKED | In-memory Map (globalThis) |
| Order Storage | MOCKED | Not persisted to DB |
| ~~Shipping Zones~~ | **PERSISTED** | **Now uses database (SvmShippingZone)** |
| ~~Promotions~~ | **PERSISTED** | **Now uses database (SvmPromotion)** |
| Inventory Reservation | MOCKED | TODO in event handlers |
| Payment Processing | MOCKED | TODO in event handlers |
| Email Notifications | MOCKED | TODO in event handlers |

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

### Production Enhancements (P1)
- **Redis Integration** — Replace in-memory rate limiter with Redis for distributed deployments
- **Auth Provider** — Integrate NextAuth or similar for JWT validation
- **APM Integration** — Add DataDog, New Relic for production monitoring
- **Log Aggregation** — Ship audit logs to CloudWatch, ELK

### Phase B - Remaining (P2)
- **Step B3: Vendor Payouts** — Admin-triggered payout logic for MVM

### P1 - Core Entities
- ~~Add `Product`, `Customer`, `InventoryLevel` models to SaaS Core schema~~ ✅ DONE (Step 1 Remediation)
- Implement Core catalog service for SVM to consume

### P2 - Production Readiness
- Production Email Sending - Resend domain verification
- Payment Gateway Integration - Stripe/PayPal
- POS/SVM Database Integration - Connect to Supabase
- Order persistence to database
- Shipping zones persistence to database
- Promotions persistence to database

### P3 - Additional Modules
- ~~MVM (Multi-sided Vertical Marketplace)~~ ✅ IMPLEMENTED

---

## MVM Module (MODULE 3) — FROZEN ❄️

### Version: `mvm-v1.0.0`

### Implementation Status

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Module Constitution | ✅ COMPLETE |
| 1 | Vendor Domain Model | ✅ COMPLETE |
| 2 | Product & Inventory Mapping | ✅ COMPLETE |
| 3 | Order Splitting Engine | ✅ COMPLETE |
| 4 | Commissions & Payout Logic | ✅ COMPLETE |
| 5 | Vendor Dashboards | ✅ COMPLETE |
| 6 | Events & Analytics | ✅ COMPLETE |
| 7 | Entitlements & Limits | ✅ COMPLETE |
| 8 | Offline & Degraded Mode | ✅ COMPLETE |
| 9 | Module Freeze | ✅ FROZEN |

### MVM Module Architecture

Location: `/app/modules/mvm/`

**MVM OWNS:**
- Vendor / VendorStaff / VendorSettings / VendorTier
- VendorProductMapping
- VendorCommissionRule
- VendorSubOrder / VendorSubOrderItem
- VendorPayoutRecord

**MVM EXTENDS (from SVM):**
- Order flows (splits into vendor sub-orders)
- Storefront (adds vendor attribution)

**MVM DOES NOT OWN:**
- Storefront UI (SVM)
- Order creation (SVM)
- Products, Inventory, Customers (Core)
- Payments, Wallets (Core)
- Billing, Subscriptions (Core)

### Database Tables (9 total)
`mvm_vendors`, `mvm_vendor_staff`, `mvm_vendor_settings`, `mvm_vendor_tiers`, `mvm_vendor_product_mappings`, `mvm_vendor_commission_rules`, `mvm_vendor_sub_orders`, `mvm_vendor_sub_order_items`, `mvm_vendor_payout_records`

### MVM Events (25 total)
- Vendor lifecycle: `mvm.vendor.*` (9 events)
- Order splitting: `mvm.order.*`, `mvm.suborder.*` (8 events)
- Commission: `mvm.commission.*` (3 events)
- Payout: `mvm.payout.*` (5 events)

### MVM Entitlement Limits (Default)
- `max_vendors`: 10
- `max_vendor_staff_per_vendor`: 3
- `max_products_per_vendor`: 50
- `max_commission_rules`: 5
- `commission_rate_min`: 5%
- `commission_rate_max`: 30%

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
| **SVM Domain Model** | `/modules/svm/docs/SVM_DOMAIN_MODEL.md` |
| **SVM Catalog Consumption** | `/modules/svm/docs/SVM_CATALOG_CONSUMPTION.md` |
| **SVM Order Lifecycle** | `/modules/svm/docs/SVM_ORDER_LIFECYCLE.md` |
| **SVM API Reference** | `/modules/svm/docs/SVM_API_REFERENCE.md` |
| **SVM Shipping** | `/modules/svm/docs/SVM_SHIPPING.md` |
| **SVM Promotions** | `/modules/svm/docs/SVM_PROMOTIONS.md` |
| **SVM Offline/PWA** | `/modules/svm/docs/SVM_OFFLINE.md` |
| **SVM Events** | `/modules/svm/docs/SVM_EVENTS.md` |
| **SVM Entitlements** | `/modules/svm/docs/SVM_ENTITLEMENTS.md` |
| **SVM Validation Checklist** | `/modules/svm/docs/SVM_VALIDATION_CHECKLIST.md` |
|| **MVM Constitution** | `/modules/mvm/docs/MVM_CONSTITUTION.md` |
|| **MVM Validation Checklist** | `/modules/mvm/docs/MVM_VALIDATION_CHECKLIST.md` |

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
