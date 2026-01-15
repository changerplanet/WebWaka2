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

## External Dependencies
- **PostgreSQL**: Primary database.
- **Prisma ORM**: Database toolkit.
- **Paystack**: Payment gateway.
- **Next.js**: Frontend framework.
- **React**: UI library.
- **Tailwind CSS**: Styling framework.
- **Radix UI**: Component library.
- **Meta WhatsApp Cloud API**: For WhatsApp messaging.