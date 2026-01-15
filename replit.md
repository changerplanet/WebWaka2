# WebWaka SaaS Platform

## Overview
WebWaka is a multi-tenant SaaS platform empowering digital transformation partners with a white-label solution to deliver customized business tools to their clients. It aims to be a comprehensive ecosystem for digital tools, fostering business growth and efficiency. Key capabilities include robust payment processing, form building, visual page creation, end-user portals, and a specialized Nigeria-first modular commerce system featuring advanced offline capabilities and vendor management. The platform is designed to support diverse sectors and enhance operational efficiency for businesses.

## User Preferences
I want iterative development and detailed explanations of changes. Please ask before making major architectural changes or introducing new external dependencies. Focus on robust, scalable solutions.

## System Architecture
WebWaka is a multi-tenant SaaS platform built with a modular capability system, ensuring tenant isolation through domain-based resolution.

### Frontend
- **Technology**: Next.js 14.2.21 with React 18 (App Router).
- **Styling**: Tailwind CSS and Radix UI components.
- **UI/UX**: Mobile-first, Inter font, Waka Green/Naira Gold color scheme, responsive design, and PWA support.

### Backend & Database
- **Database**: PostgreSQL with Prisma ORM.
- **Language**: TypeScript across the full stack.
- **API Structure**: Next.js API routes, with an optional Python FastAPI proxy server.

### Core Features
- **Payment Integration**: Provider-agnostic system supporting Paystack, with AES-256-GCM encryption and a three-level control model.
- **Sites & Funnels Form Builder**: Schema-driven, JSON-based form builder with 12 field types, server-side validation, and optional payment collection.
- **Partner Analytics**: Read-only analytics layer for partner overview, tenant performance, form performance, and payment visibility.
- **Visual Page Builder**: Block-based editor for Sites & Funnels with 7 block types, inline content editing, and mobile/desktop previews.
- **End-User Portals**: Mobile-first, read-only portals for Education and Health, with entity-level authorization and session-based authentication.
- **Authorization System**: Role-scoped authorization (`SUPER_ADMIN`, `PARTNER_*`, `TENANT_USER`) for data security.
- **Marketing Website**: Comprehensive marketing site with reusable components and SEO optimization.
- **Demo System**: Advanced demo data seeding supporting 11 vertical suites.
- **Nigeria-First Modular Commerce**:
    - **Product Channel Configuration**: Vendor-controlled visibility, pricing, and inventory across POS/SVM/MVM channels.
    - **POS Offline Sync**: IndexedDB-based offline queue with server-side conflict detection.
    - **MVM Vendor Registration**: Phone-first onboarding with KYC integration and approval workflow.
    - **Order Splitting**: Multi-vendor marketplace order decomposition with commission calculation.
    - **ParkHub POS**: Walk-up ticket sales with dynamic departure models.
    - **Cash Rounding**: NGN-realistic rounding with audit trail.
    - **WhatsApp Integration**: Foundational transactional messaging for commerce events.
    - **Bank Transfer & COD Deepening**: Workflows for bank transfer payments and full cash-on-delivery lifecycle.
    - **Vendor Payout Visibility**: Read-only dashboards for vendor earnings and partner payout overviews.
    - **Inventory Sync & Low Stock**: Unified inventory visibility, low-stock alerts, and stock traceability.
    - **Offline UX Clarity & Trust Signals**: Visual indicators for connection/sync status.
    - **ParkHub Walk-Up POS Interface**: Mobile-first, 5-step flow for ticket sales with offline queuing.
    - **Payout Execution Engine**: Partner-triggered payout execution for MVM vendors with batch processing and an immutable audit trail.
    - **Receipt Printing System (Wave F3)**: Nigeria-appropriate receipt generation for POS and ParkHub, with offline-first design, QR verification, and support for various payment methods.
    - **Vendor Mobile Dashboard (Wave F4)**: Mobile-first dashboard for MVM vendors providing order visibility, fulfillment queue, earnings overview, and payout status.
    - **Landmark-Based Addressing (Wave F5)**: Nigeria-first addressing system utilizing landmarks, integrated with Nigerian geographic data and phone format validation.
    - **Mobile Checkout Redesign (Wave F6)**: Mobile-first checkout experience for SVM, optimized for Nigeria with thumb-zone design, 4-step flow, and integration of landmark addressing.
    - **SMS Driver Updates (Wave F7)**: Feature-phone compatible SMS notifications for ParkHub drivers, supporting multi-language templates and Twilio integration for delivery.
    - **Manifest Generation (Wave F8)**: Legal passenger manifest system for ParkHub trips, featuring paper-first output, offline support, public QR verification, and detailed audit trails.
    - **Inventory Sync Engine (Wave F9)**: Advanced cross-channel inventory synchronization with an event-driven architecture, channel adapters, conflict classification, and manual resolution workflows.
    - **Vendor Rating System (Wave G1)**: Read-only trust layer for MVM vendors featuring customer ratings (1-5 stars with comments), weighted average calculation with recency weighting (30-day ratings weighted 1.0, decaying to 0.2 after 365 days), score band classification (EXCELLENT ≥4.5 with ≥5 ratings, GOOD ≥3.5 with ≥3, NEEDS_ATTENTION <3.0 with ≥3, NEW otherwise), trust badges for marketplace display, vendor ratings dashboard, and admin quality overview.
    - **Offline Cart Persistence (Wave G2)**: IndexedDB-backed cart storage for SVM with network resilience. Features include: cart persistence across network drops/app refresh/browser close, versioned cart schema, graceful conflict resolution (price changes, stock changes, removed items), user-triggered cart merge with server on reconnect, UX signals ("Saved offline" badge, "Price changed" notice), tenant-isolated API endpoints, and mobile-first design optimized for low-end Android. Constraints: no automation, no background sync, no auto-checkout.
    - **Social Proof System (Wave G3)**: Read-only social proof signals for SVM derived from real purchase data. Features include: purchase count signals ("X bought today"), popularity badges (Bestseller/Trending/Popular), city popularity ("Popular in Lagos"), recent purchase ticker (throttled, privacy-safe), batch API for product listings, and demo vs live labeling. Constraints: no dark patterns, no fake urgency/scarcity, no countdown timers, no manipulative nudges, no cross-tenant leakage, all data from real purchases only.
    - **Voice Search (Wave G4)**: POS voice-to-product lookup with Nigerian accent tolerance. Features include: manual mic trigger (no always-on listening), Soundex and Metaphone phonetic matching, Nigerian-specific phonetic mappings, fuzzy matching with Levenshtein distance, offline detection with graceful fallback, demo mode support. Constraints: product lookup only (no commands), no auto-add-to-cart, no payments via voice, no data sent without user action, no background listening.
    - **Multi-Park Operator View (Wave G5)**: Consolidated read-only dashboard for operators managing multiple parks. Features include: cross-park summaries (active trips, ticket sales, cash collected, agent activity), mobile-first tablet-friendly layouts, real-time refresh, park-by-park breakdown, agent performance leaderboard, payment method breakdown, demo mode support. Constraints: read-only (no modifications), no ticket sales flows, no payouts/money movement, no automation, no background jobs, no cross-tenant visibility.
- **SVM Public Storefront Routing (Wave I.1)**: Public-facing storefront access via tenant slug URL patterns (/[tenantSlug]/store and /[tenantSlug]/product/[productSlug]). Features include: server-side tenant resolution by slug, SEO metadata generation (title, meta, canonical), fail-safe store availability gating (only ACTIVE tenants with svm/commerce/store modules), 404 fallback for invalid/suspended tenants, integration of existing SVM components (ProductGrid, ProductDetail, CartDrawer, OfflineCartIndicator, RecentPurchasesTicker). Constraints: NO new business logic (reuses existing SVM infrastructure), NO authentication required for browsing. Known architectural debt: tenantId is exposed to client bundles via SVMProvider - future isolation work would require server-side API proxy layer.
- **Sites & Funnels Template System (Phase H1)**:
    - **Super Admin Template Management**: SUPER_ADMIN-only template CRUD with lifecycle management (DRAFT → PUBLISHED → DEPRECATED).
    - **Template Types**: SITE_TEMPLATE (multi-page sites), FUNNEL_TEMPLATE (multi-step funnels), PAGE_TEMPLATE (single pages).
    - **Multi-Page Templates**: sf_template_pages model for storing multiple pages per template with sort order.
    - **Partner Template Browsing**: Read-only catalog access for Partners to browse published, partner-visible templates.
    - **Token Resolution**: Automatic replacement of {{tenant.name}}, {{brand.primaryColor}}, {{contact.email}}, etc. during cloning.
    - **Entitlement-Gated Cloning**: Site/Funnel creation via template clone respects existing quotas and feature flags.
    - **Template Validation**: Schema validation before publish ensuring all required fields and blocks present.
    - Constraints: NO partner template uploads, NO marketplace, NO payments, NO automation, SUPER_ADMIN only for mutations.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Prisma ORM**: Database toolkit.
- **Paystack**: Payment gateway.
- **Next.js**: Frontend framework.
- **React**: UI library.
- **Tailwind CSS**: Styling framework.
- **Radix UI**: Component library.
- **Meta WhatsApp Cloud API**: For WhatsApp messaging.
- **Twilio**: For SMS notifications.