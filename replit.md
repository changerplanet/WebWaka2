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