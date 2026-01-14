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
**Platform Readiness: L2 (Sales Demo Ready)**

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
