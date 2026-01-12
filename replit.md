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
- January 12, 2026: Initial Replit environment setup
  - Configured Next.js for Replit proxy compatibility
  - Connected PostgreSQL database with Prisma
  - Set up development workflow on port 5000

## Architecture Notes
- Multi-tenant architecture with tenant resolution via domains
- Modular capability system for different business verticals
- Partner management and white-labeling support
- PWA capabilities with offline support
