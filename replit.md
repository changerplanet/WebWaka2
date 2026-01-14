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
- **Authorization System**: Robust, role-scoped authorization (`SUPER_ADMIN`, `PARTNER_*`, `TENANT_USER`) across API routes and UI components to prevent cross-tenant data leaks and ensure secure access control.
- **Marketing Website**: Comprehensive marketing site with reusable components, suite data modules, and SEO optimization (metadata, OpenGraph, performance hardening).
- **Demo System**: Advanced demo data seeding and a "Strong Demo Matrix" across 11 vertical suites, enabling comprehensive demonstrations for potential partners and clients.

### Project Structure
- `/frontend`: Main Next.js application.
- `/modules`: Contains modular business components for specific verticals (e.g., SVM, POS, MVM).

## External Dependencies
- **PostgreSQL**: Primary database for data storage.
- **Prisma ORM**: Used for database interactions and schema management.
- **Paystack**: Integrated as a payment gateway via the platform's payment abstraction layer.
- **Next.js**: Frontend framework.
- **React**: UI library.
- **Tailwind CSS**: Styling framework.
- **Radix UI**: Component library.