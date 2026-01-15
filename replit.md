# WebWaka SaaS Platform

## Overview
WebWaka is a multi-tenant SaaS platform designed for digital transformation partners. It acts as a white-label solution, enabling partners to customize, brand, and deliver a variety of business solutions to their clients. The platform aims to be a comprehensive ecosystem for digital tools, fostering business growth and efficiency across diverse sectors.

## User Preferences
I want iterative development and detailed explanations of changes. Please ask before making major architectural changes or introducing new external dependencies. Focus on robust, scalable solutions.

## System Architecture
WebWaka is built as a multi-tenant SaaS platform with a modular capability system to support various business verticals. Tenant resolution is handled via domains, ensuring data isolation and customized experiences.

### Frontend
- **Technology**: Next.js 14.2.21 with React 18, utilizing the App Router.
- **Styling**: Tailwind CSS for utility-first styling combined with Radix UI components for accessibility and pre-built primitives.
- **UI/UX**: Mobile-first design approach, Inter font, Waka Green/Naira Gold color scheme, 16px minimum font size. Includes responsive rules, breakpoints, and grid transformations.
- **PWA Support**: Enabled with service worker for offline capabilities and enhanced user experience.

### Backend & Database
- **Database**: PostgreSQL, managed with Prisma ORM for type-safe database access and migrations.
- **Language**: TypeScript across the stack for improved code quality and maintainability.
- **API Structure**: Next.js API routes handle core functionalities. An optional Python FastAPI proxy server can be integrated.

### Core Features
- **Payment Integration**: Complete payment system with two layers:
  - **Provider Layer (E1.1)**: Provider-agnostic abstraction supporting Paystack (and future providers). Three-level control model (Super Admin → Partner → Tenant), AES-256-GCM encrypted credential storage, credential-deferred design.
  - **Execution Layer (E1.2)**: Platform-wide transaction processing with PaymentExecutionService, TransactionService, demo-safe execution paths. APIs for initiate, verify, list transactions. Supports all suites without suite-specific logic.
- **Sites & Funnels Form Builder (E1.3)**: Schema-driven forms with optional payment integration:
  - JSON-based form schema with 12 field types (text, email, phone, select, checkbox, etc.)
  - Server-side validation with configurable rules (required, email, phone, min/max length, pattern)
  - Optional payment collection via PaymentExecutionService integration
  - Public submission API, tenant-scoped management, demo-safe execution
- **Partner Analytics (E1.4)**: Read-only analytics layer for partner dashboards:
  - Partner overview metrics (tenants, forms, submissions, payments)
  - Tenant performance breakdown with conversion rates
  - Form performance analytics with revenue tracking
  - Payment visibility (read-only, no payouts)
  - Time filters (today, 7d, 30d, all-time) and demo/live split
  - Mobile-first dashboard UI at /partner/analytics
- **Visual Page Builder (E2.1)**: Block-based page editor for Sites & Funnels:
  - 7 block types: Hero, Features, Pricing, Testimonials, CTA, Form, Footer
  - Section reordering with move up/down controls
  - Inline content editing (text, images, CTAs)
  - Form block integrates with E1.3 forms library via dropdown selector
  - Mobile/desktop preview toggle (375px vs full-width)
  - Save/publish workflow with sortOrder normalization
  - Templates remain read-only, pages are cloned for editing
- **End-User Portals (E2.2)**: Mobile-first read-only portals for end users:
  - **Education Portal**: Student/guardian access to profiles, attendance, results, and fee summaries
    - Routes: /portal/education, /api/portal/education/*
    - Services: EducationPortalService with tenant-scoped data access
    - Mobile-first UI with 5 tabs (Overview, Classes, Attendance, Results, Fees)
  - **Health Portal**: Patient access to profiles, appointments, prescriptions, and visit history
    - Routes: /portal/health, /api/portal/health/*
    - Services: HealthPortalService with tenant-scoped data access
    - Mobile-first UI with 5 tabs (Overview, Appointments, Prescriptions, Visits, Billing)
  - **Entity-Level Authorization**: Guardian-to-student and patient-to-user linking via userId fields
    - edu_guardian.userId links guardian records to user accounts
    - health_patient.userId links patient records to user accounts
    - Authorization helpers verify user is linked to requested entity
  - Read-only access only (no messaging, payments, notifications, or admin features)
  - Session-based authentication with entity-level access control
- **Authorization System**: Robust, role-scoped authorization (`SUPER_ADMIN`, `PARTNER_*`, `TENANT_USER`) across API routes and UI components to prevent cross-tenant data leaks and ensure secure access control.
- **Marketing Website**: Comprehensive marketing site with reusable components, suite data modules, and SEO optimization (metadata, OpenGraph, performance hardening).
- **Demo System**: Advanced demo data seeding and a "Strong Demo Matrix" across 11 vertical suites, enabling comprehensive demonstrations for potential partners and clients.
- **Nigeria-First Modular Commerce (Wave 1)**: Foundational architecture for multi-channel commerce:
  - **Product Channel Configuration**: Vendor-controlled visibility, pricing, and inventory modes across POS/SVM/MVM channels
    - Services: ChannelConfigService with channel-specific pricing and inventory allocation
    - APIs: /api/commerce/channel-config for enable/pause/disable/bulk operations
  - **POS Offline Sync**: IndexedDB-based offline queue with server-side conflict detection
    - Services: PosOfflineService (server), posOfflineClient (browser)
    - Conflict types: OVERSELL, PRICE_MISMATCH, PRODUCT_UNAVAILABLE
    - APIs: /api/commerce/pos-offline for queue/sync/resolve operations
  - **MVM Vendor Registration**: Phone-first onboarding with optional KYC (BVN/CAC)
    - Services: VendorRegistrationService with approval workflow
    - States: PENDING_APPROVAL → APPROVED/REJECTED → SUSPENDED
    - APIs: /api/commerce/mvm-vendor for registration lifecycle
  - **Order Splitting**: Multi-vendor marketplace order decomposition
    - Services: OrderSplittingService with parent/sub-order creation
    - Commission calculation per vendor with payout tracking
    - APIs: /api/commerce/order-splitting for create/status updates
  - **ParkHub POS**: Walk-up ticket sales with dynamic departure model
    - Services: ParkHubService for trip management and ticket sales
    - Departure modes: SCHEDULED, WHEN_FULL, HYBRID ("leaves when full")
    - APIs: /api/commerce/parkhub for trip/ticket lifecycle
  - **Cash Rounding**: NGN-realistic rounding (₦5, ₦10, ₦50) with audit trail
    - Services: CashRoundingService with receipt formatting
    - APIs: /api/commerce/cash-rounding for calculate/apply/report
- **Nigeria-First Modular Commerce (Wave 2.1)**: WhatsApp Integration (Foundational):
  - **WhatsApp Notifications**: Transactional messaging for commerce events
    - Provider-agnostic: Meta WhatsApp Cloud API (primary), Twilio (alternative)
    - Demo-safe: Log-only fallback when not configured
    - Message types: Order confirmations, POS receipts, vendor alerts, ParkHub tickets
    - Services: WhatsAppService with commerce integration helpers
    - APIs: /api/notifications/whatsapp for send, /api/notifications/whatsapp/click-to-chat for links
  - **Click-to-WhatsApp**: User-initiated support links (no automation)
    - Support inquiry, order inquiry, delivery help, refund request
    - Vendor contact, ParkHub support
  - **Audit Trail**: All messages logged to whatsapp_message_log (including demo mode)
  - **Constraints**: Transactional only, no automations, no AI, no marketing
- **Nigeria-First Modular Commerce (Wave 2.2)**: Bank Transfer & COD Deepening:
  - **Bank Transfer Payments**: Proof upload, reference validation, manual verification
    - States: PENDING_PROOF → PROOF_SUBMITTED → VERIFIED/REJECTED/EXPIRED
    - Services: BankTransferService, PaymentExpiryService
    - APIs: /api/commerce/bank-transfer for create, submit_proof, verify, cancel
  - **COD Lifecycle**: Full cash-on-delivery workflow with collection tracking
    - States: PENDING_DELIVERY → OUT_FOR_DELIVERY → COLLECTED/FAILED → RECONCILED
    - Services: CodService
    - APIs: /api/commerce/cod for create, assign_agent, collect, reconcile
  - **Verification Queue**: Admin/Partner review workflow
    - Services: VerificationQueueService
    - APIs: /api/commerce/verification-queue for assign, mark_urgent, escalate
  - **Constraints**: No payout execution, no automation, manual verification required
- **Nigeria-First Modular Commerce (Wave 2.3)**: Vendor Payout Visibility:
  - **Vendor Earnings Dashboard**: Read-only visibility into vendor earnings
    - Summary: orders, gross sales, commissions, net earnings
    - Order-level breakdown with payment method and status
    - Collection status for COD/Bank Transfer
  - **Partner Payout Overview**: Aggregate metrics for partners
    - Tenant-wide gross sales, commissions, vendor earnings
    - Payment method volume breakdown
    - Top vendors by earnings
  - **APIs**: /api/commerce/payout-visibility/vendor, /api/commerce/payout-visibility/partner
  - **Constraints**: Read-only only, no payouts, no automation, no bank transfers

### Project Structure
- `/frontend`: Main Next.js application.
  - `/src/lib/portals`: End-user portal services (Education, Health)
  - `/src/lib/commerce`: Nigeria-First Commerce services
    - `/channel-config`: Product channel visibility and pricing
    - `/pos-offline`: Offline queue (server + client)
    - `/mvm-vendor`: Vendor registration and onboarding
    - `/order-splitting`: Multi-vendor order decomposition
    - `/parkhub`: Trip and ticket management
    - `/cash-rounding`: NGN rounding with audit
  - `/src/app/portal`: Portal UI pages (mobile-first design)
  - `/src/app/api/portal`: Portal API routes
  - `/src/app/api/commerce`: Commerce API routes (Wave 1)
  - `/src/lib/notifications/whatsapp`: WhatsApp notification services (Wave 2.1)
  - `/src/app/api/notifications/whatsapp`: WhatsApp API routes (Wave 2.1)
  - `/src/lib/commerce/payment-verification`: Bank Transfer & COD services (Wave 2.2)
  - `/src/app/api/commerce/bank-transfer`: Bank Transfer API (Wave 2.2)
  - `/src/app/api/commerce/cod`: COD API (Wave 2.2)
  - `/src/app/api/commerce/verification-queue`: Verification Queue API (Wave 2.2)
  - `/src/lib/commerce/payout-visibility`: Payout visibility services (Wave 2.3)
  - `/src/app/api/commerce/payout-visibility`: Payout visibility APIs (Wave 2.3)
- `/modules`: Contains modular business components for specific verticals (e.g., SVM, POS, MVM).

## External Dependencies
- **PostgreSQL**: Primary database for data storage.
- **Prisma ORM**: Used for database interactions and schema management.
- **Paystack**: Integrated as a payment gateway via the platform's payment abstraction layer.
- **Next.js**: Frontend framework.
- **React**: UI library.
- **Tailwind CSS**: Styling framework.
- **Radix UI**: Component library.