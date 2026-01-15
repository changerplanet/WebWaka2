# WebWaka SaaS Platform

## Overview
WebWaka is a multi-tenant SaaS platform designed for digital transformation partners. It provides a white-label solution, allowing partners to customize, brand, and deliver various business solutions to their clients. The platform aims to be a comprehensive ecosystem for digital tools, fostering business growth and efficiency across diverse sectors. It includes robust features for payment processing, form building, visual page creation, end-user portals, and a specialized Nigeria-first modular commerce system with advanced offline capabilities and vendor management.

## User Preferences
I want iterative development and detailed explanations of changes. Please ask before making major architectural changes or introducing new external dependencies. Focus on robust, scalable solutions.

## System Architecture
WebWaka is built as a multi-tenant SaaS platform with a modular capability system, ensuring tenant isolation through domain-based resolution.

### Frontend
- **Technology**: Next.js 14.2.21 with React 18 (App Router).
- **Styling**: Tailwind CSS for utility-first styling, complemented by Radix UI components for accessibility.
- **UI/UX**: Mobile-first design, Inter font, Waka Green/Naira Gold color scheme, responsive breakpoints, and PWA support.

### Backend & Database
- **Database**: PostgreSQL, managed with Prisma ORM for type-safe access and migrations.
- **Language**: TypeScript across the entire stack.
- **API Structure**: Next.js API routes for core functionalities, with an optional Python FastAPI proxy server.

### Core Features
- **Payment Integration**: A provider-agnostic system supporting Paystack, with AES-256-GCM encrypted credentials and a three-level control model (Super Admin → Partner → Tenant). It includes a platform-wide transaction processing service.
- **Sites & Funnels Form Builder**: A schema-driven form builder allowing JSON-based schemas with 12 field types, server-side validation, and optional payment collection.
- **Partner Analytics**: A read-only analytics layer providing partner overview metrics, tenant performance, form performance, and payment visibility with time filters.
- **Visual Page Builder**: A block-based editor for Sites & Funnels with 7 block types, inline content editing, and mobile/desktop preview toggles.
- **End-User Portals**: Mobile-first, read-only portals for Education (student/guardian) and Health (patient), featuring entity-level authorization and session-based authentication.
- **Authorization System**: Role-scoped authorization (`SUPER_ADMIN`, `PARTNER_*`, `TENANT_USER`) to prevent cross-tenant data leaks.
- **Marketing Website**: Comprehensive marketing site with reusable components and SEO optimization.
- **Demo System**: Advanced demo data seeding supporting 11 vertical suites for comprehensive platform demonstrations.
- **Nigeria-First Modular Commerce**:
    - **Product Channel Configuration**: Vendor-controlled visibility, pricing, and inventory across POS/SVM/MVM channels.
    - **POS Offline Sync**: IndexedDB-based offline queue with server-side conflict detection (OVERSELL, PRICE_MISMATCH, PRODUCT_UNAVAILABLE).
    - **MVM Vendor Registration**: Phone-first onboarding with KYC integration and an approval workflow.
    - **Order Splitting**: Multi-vendor marketplace order decomposition with commission calculation.
    - **ParkHub POS**: Walk-up ticket sales with dynamic departure models (SCHEDULED, WHEN_FULL, HYBRID).
    - **Cash Rounding**: NGN-realistic rounding (₦5, ₦10, ₦50) with an audit trail.
    - **WhatsApp Integration**: Foundational transactional messaging for commerce events (order confirmations, receipts, alerts) using Meta WhatsApp Cloud API.
    - **Bank Transfer & COD Deepening**: Workflows for bank transfer payments (proof upload, manual verification) and full cash-on-delivery lifecycle with collection tracking and an admin verification queue.
    - **Vendor Payout Visibility**: Read-only dashboards for vendor earnings and partner payout overviews.
    - **Inventory Sync & Low Stock**: Unified inventory visibility across channels, low-stock alerts without automation, and stock traceability.
    - **Offline UX Clarity & Trust Signals**: Visual indicators for connection status, sync status components, and trust signals with plain-language messaging for POS operators and vendors.
    - **ParkHub Walk-Up POS Interface**: Mobile-first, 5-step flow for ticket sales with offline queuing and agent-initiated sync.
    - **Payout Execution Engine**: Partner-triggered payout execution for MVM vendors with batch processing:
        - Status lifecycle: PENDING → APPROVED → PROCESSING → COMPLETED/FAILED
        - Batch grouping: Daily, weekly, or on-demand periods
        - Minimum payout threshold: ₦5,000
        - Bank transfer focus with COD settlement support
        - Immutable audit trail (mvm_payout_log)
        - Demo-safe with isDemo flag
        - NO automation, NO background jobs, partner-triggered only
    - **Receipt Printing System (Wave F3)**: Nigeria-appropriate receipt generation for POS and ParkHub:
        - Unified receipt model with unique human-readable receipt numbers (RCP-YYYYMMDD-XXXXX, PHB-YYYYMMDD-XXXXX)
        - Supports POS sales, ParkHub tickets, refunds, and voids
        - Offline-first with sync status tracking (SYNCED, PENDING_SYNC, SYNC_FAILED)
        - Trust markers: Demo/Verified badges, offline sync status indicators
        - ParkHub-specific fields: route, trip, seat numbers, departure mode, manifest linkage
        - Delivery channels: On-screen preview, thermal printer (Bluetooth/WebUSB), WhatsApp, QR verification
        - Payment method support: Cash, Card, Bank Transfer, Mobile Money, COD
        - Cash rounding display with NGN-realistic amounts
        - QR code verification for receipt authenticity
        - NO automatic printing, agent/user initiated only
        - Demo-safe behavior
    - **Vendor Mobile Dashboard (Wave F4)**: Mobile-first vendor dashboard for MVM marketplace:
        - Order visibility: List, filter, and view order details with status tracking
        - Fulfillment queue: Priority-based queue with URGENT/NORMAL indicators
        - Earnings overview: Period-based earnings with payment method breakdown
        - Payout status: Pending, eligible, and paid amounts with minimum threshold display
        - Mobile-optimized: Touch-friendly UI, minimal animations for low-end Android
        - Network-aware: Connection status banner with refresh capability
        - Session-scoped access via vendorId parameter
        - Read-only financials: NO payout execution, NO write operations
        - NO automation, NO background jobs
    - **Landmark-Based Addressing (Wave F5)**: Nigeria-first addressing system for SVM delivery:
        - Nigerian geographic data: 36 states + FCT with all Local Government Areas
        - Landmark-first approach: Uses churches, mosques, markets, bus stops, etc. as primary navigation
        - LandmarkDeliveryAddress database model with tenant isolation
        - Address validation with Nigerian phone format support (0XX, +234XX patterns)
        - Mobile-first UI: LandmarkAddressForm with collapsible optional fields
        - Address display: LandmarkAddressCard with label icons (Home/Work/Other)
        - Session-scoped access: Users can only manage their own addresses
        - REST API: /api/commerce/landmark-address with CRUD operations
        - State/LGA hierarchy helpers: getStateByName, getLGAsForState
        - Formatted address generation for delivery receipts
    - **Mobile Checkout Redesign (Wave F6)**: Mobile-first checkout experience for SVM:
        - Nigeria-optimized: NGN currency formatting, State/LGA selectors, landmark addressing integration
        - Thumb-zone optimized: Sticky bottom CTAs, large touch targets (py-3.5/py-4), single-column layout
        - 4-step flow: Address → Delivery → Payment → Confirm
        - MobileCheckoutProgress: Compact step navigation with clickable completed steps
        - MobileAddressStep: Integrates Wave F5 landmark addressing with collapsible optional fields
        - MobileDeliveryStep: Nigerian shipping options with carrier info and delivery estimates
        - MobilePaymentStep: Nigeria payment methods (Card, Bank Transfer, COD, USSD) with trust signals
        - MobileConfirmStep: Order review with collapsible items, NGN totals, and edit capability
        - Payment method explanations: COD exact change warning, Bank Transfer confirmation flow
        - Trust signals: Shield icons, secure payment messaging, clear fee disclosures
        - Mobile-first design: One-hand usage optimized for Nigeria reality
        - UI/UX only: NO payment logic changes, NO automation
        - Components location: frontend/src/components/svm/mobile-checkout/
    - **SMS Driver Updates (Wave F7)**: Feature-phone SMS notifications for ParkHub drivers:
        - Driver & Vehicle Management: park_driver and park_vehicle database models with tenant isolation
        - SMS-capable phone fields: Nigerian phone format support (0XX, +234XX patterns)
        - Driver preferences: SMS notification opt-in/out, language selection (en, yo, ig, ha)
        - SMS Message Types:
            - TRIP_ASSIGNMENT: Driver assigned to a trip
            - READY_TO_DEPART: Trip is full or threshold reached
            - DEPARTURE_REMINDER: Manual reminder before departure
            - STATUS_CHANGE: Trip status update
            - CANCELLATION: Trip cancelled
            - CUSTOM: Ad-hoc messages from admin
        - Multi-language templates: English, Yoruba, Igbo, Hausa
        - SMS character optimization: Messages kept under 160 chars for single SMS
        - Twilio integration: Production SMS delivery via Twilio API
        - Demo mode: Safe testing without actual SMS sends
        - SMS logging: park_driver_sms_log tracks all messages with delivery status
        - Integration layer: Convenience functions for common notification scenarios
        - API endpoint: /api/parkhub/driver-sms (POST send, GET history)
        - NO automation, NO background jobs, user-triggered only
        - Feature-phone compatible: No apps required, works on basic phones
        - Components location: frontend/src/lib/parkhub/sms/

## External Dependencies
- **PostgreSQL**: Primary database.
- **Prisma ORM**: Database toolkit.
- **Paystack**: Payment gateway.
- **Next.js**: Frontend framework.
- **React**: UI library.
- **Tailwind CSS**: Styling framework.
- **Radix UI**: Component library.
- **Meta WhatsApp Cloud API**: For WhatsApp messaging.
- **Twilio**: For SMS notifications to drivers (ParkHub).