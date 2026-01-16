# WebWaka SaaS Platform

## Overview
WebWaka is a multi-tenant SaaS platform designed to empower digital transformation partners with a white-label solution for delivering customized business tools to their clients. It provides a comprehensive ecosystem for digital tools, aiming to foster business growth and efficiency across diverse sectors. Key capabilities include robust payment processing, a schema-driven form builder, a visual page builder, end-user portals, and a specialized Nigeria-first modular commerce system with advanced offline capabilities and vendor management.

## User Preferences
I want iterative development and detailed explanations of changes. Please ask before making major architectural changes or introducing new external dependencies. Focus on robust, scalable solutions.

## System Architecture
WebWaka is a multi-tenant SaaS platform built with a modular capability system, ensuring tenant isolation through domain-based resolution.

### Frontend
- **Technology**: Next.js 14.2.21 with React 18 (App Router).
- **Styling**: Tailwind CSS and Radix UI components.
- **UI/UX**: Mobile-first design, Inter font, Waka Green/Naira Gold color scheme, responsive, and PWA support.

### Backend & Database
- **Database**: PostgreSQL with Prisma ORM.
- **Language**: TypeScript across the full stack.
- **API Structure**: Next.js API routes, with an optional Python FastAPI proxy server.

### Core Features
- **Payment Integration**: Provider-agnostic system supporting Paystack, with AES-256-GCM encryption and a three-level control model.
- **Sites & Funnels**: Includes a schema-driven, JSON-based form builder with server-side validation and a block-based visual page builder with 7 block types.
- **Partner Analytics**: Read-only analytics layer for partner and tenant performance.
- **End-User Portals**: Mobile-first, read-only portals for specific verticals (Education, Health) with entity-level authorization.
- **Authorization System**: Role-scoped authorization (`SUPER_ADMIN`, `PARTNER_*`, `TENANT_USER`) for data security.
- **Nigeria-First Modular Commerce**:
    - **Multi-channel Commerce**: Product channel configuration for POS/SVM/MVM.
    - **Offline Capabilities**: IndexedDB-based POS offline sync, offline cart persistence, and offline-first receipt printing.
    - **Vendor Management**: MVM vendor registration with KYC, order splitting for multi-vendor orders, and vendor payout visibility.
    - **Specialized POS**: ParkHub POS for walk-up ticket sales with dynamic departure models and manifest generation.
    - **Financials**: NGN-realistic cash rounding, bank transfer, and COD workflows.
    - **Customer Experience**: Mobile checkout redesign, landmark-based addressing, and a customer order portal for tracking.
    - **Trust & Social Proof**: Vendor rating system and social proof signals based on real purchase data.
    - **Advanced Inventory**: Unified inventory visibility, low-stock alerts, and cross-channel inventory synchronization.
    - **MVM Cart & Checkout**: Production-grade multi-vendor cart and checkout system with address collection and order splitting.
    - **Commerce Hardening**: Payment webhooks, partial vendor fulfillment, and order recovery mechanisms.
    - **Security Hardening (Wave B1-Fix/B2-Fix)**: Inventory-payment timing fixes, ParkHub seat race condition protection, order access verification for live tenants (email/phone required), and identity fragmentation signaling.
- **Public Routing**: Unified routing for SVM storefronts, MVM marketplaces, ParkHub operator marketplaces, and Sites & Funnels pages.
- **Sites & Funnels Template System**: SUPER_ADMIN-managed template CRUD (SITE_TEMPLATE, FUNNEL_TEMPLATE, PAGE_TEMPLATE) with token resolution and entitlement-gated cloning.
- **Template UI (Wave E1)**: Admin template management at `/admin/templates` (CRUD, publish/deprecate) and Partner template gallery at `/partner-portal/templates` (browse, preview, clone) with server-side demo/live separation.

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