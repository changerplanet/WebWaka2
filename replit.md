# WebWaka SaaS Platform

## Overview
WebWaka is a multi-tenant SaaS platform infrastructure for digital transformation partners. It's a white-label platform that allows partners to configure, brand, and deliver various business solutions to their clients.

## Current State
- The application is fully functional with Next.js frontend running on port 5000
- PostgreSQL database is connected via Prisma ORM
- PWA (Progressive Web App) support enabled with service worker

## Tech Stack
- **Frontend**: Next.js 14.2.21 with React 18
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript

## Project Structure
```
/frontend         - Main Next.js application
  /src/app        - Next.js App Router pages and API routes
  /src/components - React components
  /src/lib        - Utility functions and business logic
  /prisma         - Prisma schema and migrations
/backend          - Python FastAPI proxy server (optional)
/modules          - Modular business components (SVM, POS, MVM)
/saas-core        - Alternative Next.js app (appears to be duplicate)
/memory           - Documentation and PRD
```

## Development Commands
- `cd frontend && npm run dev -- -p 5000 -H 0.0.0.0` - Start development server
- `cd frontend && npx prisma generate` - Generate Prisma client
- `cd frontend && npx prisma db push` - Push schema changes to database

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database URL for Prisma
- `SESSION_SECRET` - Session encryption key

## Recent Changes
- January 14, 2026: Phase M4 - Marketing Website Build Complete
  - **Marketing Components**: 11 reusable components in frontend/src/components/marketing/
  - **Suites Data Module**: 19 suites with metadata in frontend/src/lib/marketing/suites-data.ts
  - **Homepage**: Updated with Phase M2 content, partner-first positioning
  - **Suites Page**: All 20+ suites displayed with category filtering
  - **Sites & Funnels**: New page with "Partner Growth Engine" positioning
  - **Partners Page**: Complete partner model explanation with FAQs
  - **Demo Portal**: 10 demo tenants with filtering and guided tour CTA
  - **Navigation**: Updated across all pages with Sites & Funnels and Demo links
  - **Design System**: Mobile-first, Inter font, 16px minimum, Waka Green/Naira Gold
  - **WhatsApp CTAs**: Integrated throughout all pages
  - **Status: COMPLETE**

- January 14, 2026: Phase M3 - Design & UI Execution Complete
  - **Design Foundations**: Color palette, typography, spacing system
  - **Component Library**: 12 component categories with full specs
  - **Wireframes**: Mobile-first wireframes for all 6 page types
  - **Responsive Rules**: Breakpoints, grid transformations, component behavior
  - **High-Fidelity Designs**: Section-by-section implementation specs
  - **Location**: frontend/docs/design-system/
  - **Status: COMPLETE**

- January 14, 2026: Phase M2 - Marketing Content Drafting Complete
  - **Homepage**: Partner-focused landing page with full copy
  - **Suites Overview**: All 20+ suites documented with descriptions
  - **Sites & Funnels**: High-priority competitive positioning page
  - **Partner Program**: Complete partner model explanation
  - **Demo Portal**: Demo business guide and expectations
  - **Location**: frontend/docs/marketing-content/
  - **Status: APPROVED - Moved to Phase M3**

- January 14, 2026: Marketing Website Revamp Plan Produced (Phase M1)
  - Complete strategy document with 6 deliverables
  - Information Architecture: 30+ pages mapped
  - Suite-to-Marketing mapping: 20+ suites categorized
  - Partner-focused messaging framework
  - Mobile-first navigation strategy
  - 6-phase execution roadmap
  - **Status: APPROVED - Moved to Phase M2**

- January 14, 2026: Strong Demo Hardening Complete (Phase D7)
  - **D7.1**: Defined Strong Demo Matrix for all 11 suites
  - **D7.2**: Seeded 1,249+ demo records with Nigerian business context
  - **D7.3**: Added DemoIndicator component for demo mode visibility
  - **D7.4**: Final sales re-validation - ALL SUITES PASS
  - **Platform Readiness: L4 (All Suites Strong-Demoable)**

- January 14, 2026: Workflow Blocker Remediation Complete (Phase F)
  - Fixed SVM Products API to use Prisma queries (25 products working)
  - Fixed POS tenant ID alignment (2 shifts, 20 sales now visible)
  - Modified capability guard for uninitialized systems
  - All APIs now database-backed, no mock data

- January 14, 2026: Authorization Hardening Complete (Phase D4.1)
  - Fixed cross-tenant data leak in /api/tenants (now role-scoped)
  - Added Forbidden component for unauthorized access
  - Partner portal layout guards implemented
  - Admin API routes already protected via requireSuperAdmin
  - All authorization tests passing

- January 14, 2026: Demo Data Seeding Complete (Phases D2.5, D3-B, D3-C)
  - **Phase D2.5**: Added 13 new Prisma models (6 Real Estate, 7 Political)
  - **Phase D3-B**: Seeded 8 vertical suites (312 records)
  - **Phase D3-C**: Seeded final 3 suites (96 records)
  - **Total Demo Records: 408** across 11 vertical suites
  
  Suite Summary:
  - Commerce: 58 records (25 products, 8 categories, 25 inventory)
  - POS: 22 records (2 shifts, 20 sales)
  - MVM: 11 records (1 config, 4 tiers, 6 vendors)
  - Education: 121 records
  - Health: 37 records
  - Hospitality: 26 records
  - Civic: 20 records
  - Logistics: 17 records
  - Real Estate: 34 records (NEW)
  - Church: 36 records (NEW)
  - Political: 26 records (NEW)

- January 12, 2026: Initial Replit environment setup
  - Configured Next.js for Replit proxy compatibility
  - Connected PostgreSQL database with Prisma
  - Set up development workflow on port 5000

## Demo Data Status
**Platform Readiness: L4 (All Suites Strong-Demoable)**

### Demo Tenants (16 total - 11 Seeded)
| Tenant Slug | Business Name | Suite Status |
|-------------|---------------|--------------|
| demo-retail-store | Lagos Retail Store | ✅ Seeded (58) |
| demo-school | Bright Future Academy | ✅ Seeded (121) |
| demo-clinic | HealthFirst Clinic | ✅ Seeded (37) |
| demo-hotel | PalmView Suites Lagos | ✅ Seeded (26) |
| demo-civic | Lagos State Lands Bureau | ✅ Seeded (20) |
| demo-logistics | Swift Logistics | ✅ Seeded (17) |
| demo-marketplace | Naija Market Hub | ✅ Seeded (33) |
| demo-church | GraceLife Community Church | ✅ Seeded (36) |
| demo-political | Lagos Campaign HQ | ✅ Seeded (26) |
| demo-real-estate | Lagos Property Managers | ✅ Seeded (34) |

### Demo Seed Scripts
Located in `frontend/scripts/`:
- seed-products-demo.ts
- seed-education-demo.ts
- seed-health-demo.ts
- seed-hospitality-demo.ts
- seed-civic-demo.ts
- seed-logistics-demo.ts
- seed-pos-demo.ts
- seed-svm-demo.ts
- seed-mvm-demo.ts
- seed-real-estate-demo.ts (NEW)
- seed-church-demo.ts (NEW)
- seed-political-demo.ts (NEW)

Run with: `cd frontend && npx tsx scripts/seed-{suite}-demo.ts`

## Architecture Notes
- Multi-tenant architecture with tenant resolution via domains
- Modular capability system for different business verticals
- Partner management and white-labeling support
- PWA capabilities with offline support

## Authorization System (Phase D4.1)
**Status: Hardened and Verified**

### Authorization Files
- `frontend/src/lib/authorization.ts` - API-level authorization helpers (requireAuth, requireSuperAdmin, requireTenantAdmin, etc.)
- `frontend/src/lib/auth/authorization.ts` - Client-side authorization utilities (role checks, layout guards)
- `frontend/src/middleware.ts` - Session validation middleware
- `frontend/src/components/Forbidden.tsx` - Access denied component

### Authorization Matrix
| Resource | SUPER_ADMIN | PARTNER_* | TENANT_USER |
|----------|-------------|-----------|-------------|
| /admin/** | ✅ 200 | ❌ 403 | ❌ 403 |
| /partner-portal/** | ✅ 200 | ✅ 200 | ❌ Forbidden |
| /api/admin/** | ✅ 200 | ❌ 403 | ❌ 403 |
| /api/partner/me | ✅ 200 | ✅ 200 | ❌ 403 |
| /api/tenants | All | Partner's referred | User's tenants |
| Unauthenticated | ❌ 401/307 | ❌ 401/307 | ❌ 401/307 |

### Partner Roles
- PARTNER_OWNER - Full partner portal access
- PARTNER_ADMIN - Partner admin features
- PARTNER_STAFF - Limited partner access
- PARTNER_SALES - Sales features
- PARTNER_SUPPORT - Support features

### Demo Credentials (Phase D4 Testing)
- demo.owner@webwaka.com - Partner Owner (16 tenants via referrals)
- demo.admin@webwaka.com - Partner Admin
- demo.staff@webwaka.com - Partner Staff
- demo.sales@webwaka.com - Partner Sales
- demo.support@webwaka.com - Partner Support
- patient@demo-clinic.demo - Tenant User (1 tenant: demo-clinic)
