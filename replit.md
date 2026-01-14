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
- January 14, 2026: Demo Data Seeding (Phase D3-B Complete)
  - Seeded 8 vertical suites with Nigerian-context demo data
  - Commerce: 25 products, 8 categories, 25 inventory levels
  - POS: 2 shifts, 20 sales
  - MVM: 1 marketplace, 4 tiers, 6 vendors
  - Education: 1 session, 3 terms, 9 classes, 15 subjects, 15 staff, 35 students, 35 enrollments, 8 fees
  - Health: 1 config, 1 facility, 10 providers, 15 patients, 10 appointments
  - Hospitality: 1 config, 1 venue, 14 rooms, 10 guests
  - Civic: 1 config, 1 agency, 8 services, 10 citizens
  - Logistics: 1 config, 8 zones, 8 agents
  - Total: 418+ demo records across 16 demo tenants
  - 3 suites blocked (Real Estate, Church, Political) - no Prisma models exist

- January 12, 2026: Initial Replit environment setup
  - Configured Next.js for Replit proxy compatibility
  - Connected PostgreSQL database with Prisma
  - Set up development workflow on port 5000

## Demo Data Status
Platform Readiness: L1+ (Functional Demo)

### Demo Tenants (16 total)
| Tenant Slug | Business Name | Suite Status |
|-------------|---------------|--------------|
| demo-retail-store | Lagos Retail Store | ✅ Seeded |
| demo-school | Bright Future Academy | ✅ Seeded |
| demo-clinic | HealthFirst Clinic | ✅ Seeded |
| demo-hotel | PalmView Suites Lagos | ✅ Seeded |
| demo-civic | Lagos State Lands Bureau | ✅ Seeded |
| demo-logistics | Swift Logistics | ✅ Seeded |
| demo-marketplace | Naija Market Hub | ✅ Seeded |
| demo-church | GraceLife Community Church | ❌ No models |
| demo-political | Lagos Campaign HQ | ❌ No models |
| demo-real-estate | Lagos Property Managers | ❌ No models |

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

Run with: `cd frontend && npx tsx scripts/seed-{suite}-demo.ts`

## Architecture Notes
- Multi-tenant architecture with tenant resolution via domains
- Modular capability system for different business verticals
- Partner management and white-labeling support
- PWA capabilities with offline support
