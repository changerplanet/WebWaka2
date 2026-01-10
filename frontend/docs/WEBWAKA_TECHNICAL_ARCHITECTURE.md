# WebWaka Platform - Full Technical & Architectural Analysis

**Version:** 1.0  
**Date:** January 9, 2026  
**Classification:** Canonical Internal Architecture Guide  
**Purpose:** Replatforming Reference for Convex/Vercel/Fly.io/Clerk Stack

---

## Table of Contents

1. [Platform Reality Check](#1-platform-reality-check)
2. [Current Architecture](#2-current-architecture)
3. [Multi-Tenancy Model](#3-multi-tenancy-model)
4. [Governance as Architecture](#4-governance-as-architecture)
5. [Tech Stack Mapping](#5-tech-stack-mapping)
6. [Convex-First Data Architecture](#6-convex-first-data-architecture)
7. [Auth and Identity with Clerk](#7-auth-and-identity-with-clerk)
8. [Deployment Architecture](#8-deployment-architecture)
9. [AI Integration](#9-ai-integration)
10. [Demo Architecture](#10-demo-architecture)
11. [What WebWaka Is NOT](#11-what-webwaka-is-not)

---

## 1. Platform Reality Check

### 1.1 What WebWaka Is Today

WebWaka is a governance-first, multi-tenant platform for Nigerian SMEs and institutions. It provides vertical-specific operational software with built-in auditability, regulatory compliance, and partner distribution.

**Core Identity:**
- Multi-tenant SaaS platform
- Partner-distributed (not direct sales)
- Governance-first (audit, compliance, transparency)
- Nigeria-first (VAT, FIRS, INEC, NDPR considerations)
- v2-FROZEN discipline (locked behavior, no silent changes)

### 1.2 The 14 v2-FROZEN External Verticals

These are production-ready, locked implementations:

| # | Vertical | Domain | Classification | Status |
|---|----------|--------|----------------|--------|
| 1 | Commerce | COMMERCE | Standard | v2-FROZEN |
| 2 | Education | EDUCATION | Standard | v2-FROZEN |
| 3 | Health | HEALTHCARE | High-Risk | v2-FROZEN |
| 4 | Hospitality | HOSPITALITY | Standard | v2-FROZEN |
| 5 | Civic / GovTech | CIVIC | High-Risk | v2-FROZEN |
| 6 | Logistics | LOGISTICS | Standard | v2-FROZEN |
| 7 | Real Estate | REAL_ESTATE | Standard | v2-FROZEN |
| 8 | Recruitment | HR | Standard | v2-FROZEN |
| 9 | Project Management | GENERAL | Standard | v2-FROZEN |
| 10 | Legal Practice | LEGAL | High-Risk | v2-FROZEN |
| 11 | Warehouse | LOGISTICS | Standard | v2-FROZEN |
| 12 | ParkHub (Transport) | LOGISTICS | Standard | v2-FROZEN |
| 13 | Political | POLITICAL | High-Risk | v2-FROZEN |
| 14 | Church | CHURCH | High-Risk | v2-FROZEN |

**High-Risk Verticals** require additional safeguards:
- Health: Patient privacy (NDPR)
- Civic: FOI readiness, regulator access
- Legal: Client confidentiality
- Political: Electoral Act compliance, INEC safety
- Church: Faith, money, minors, pastoral confidentiality

### 1.3 Internal Platform Modules (Non-Vertical)

These are infrastructure modules, not customer-facing verticals:

| Module | Purpose | Notes |
|--------|---------|-------|
| Tenant Management | Multi-tenant infrastructure | Core, cannot disable |
| User Management | Auth, roles, sessions | Core, cannot disable |
| Capabilities | Feature activation system | Per-tenant activation |
| Entitlements | Subscription access control | Billing integration |
| Partner System | Partner onboarding, attribution | Distribution layer |
| Platform Instance | White-label configuration | Branding, domains |
| Audit Logger | Append-only audit trail | All changes logged |
| Demo Mode | Partner demo system | URL-driven state |

### 1.4 What Is Implemented vs Demo-Only

**Fully Implemented (Backend + Frontend):**
- Commerce Suite (POS, Inventory, Accounting, SVM, MVM)
- Education Suite (Students, Grades, Attendance, Fees)
- Health Suite (Patients, Appointments, Encounters, Prescriptions)
- Hospitality Suite (Guests, Rooms, Reservations, Folio)
- Civic Suite (Citizens, Cases, Inspections, Billing Facts)
- Logistics Suite (Agents, Assignments, Tracking)
- Church Suite (Registry, Membership, Ministries, Giving, Governance)
- Political Suite (Parties, Campaigns, Donations, Primaries, Petitions)

**Demo-Ready (Full Services, Seeded Data):**
- All 14 verticals have demo tenants
- Demo Partner Account with 14 demo tenants
- Pre-seeded realistic Nigerian data
- Role-based Quick Start selectors

**Governed but Limited Implementation:**
- AI features (advisory only, human approval required)
- Payment execution (Commerce Boundary: facts only)
- External integrations (connector stubs, no live connections)

### 1.5 Commerce Boundary

This is a fundamental architectural constraint:

```
+----------------------------------+
|  FACTS ONLY BOUNDARY             |
+----------------------------------+
| Verticals record FACTS:          |
| - Donation facts                 |
| - Giving facts                   |
| - Fee assessment facts           |
| - Expense facts                  |
| - Billing facts                  |
+----------------------------------+
           |
           | Emit facts
           v
+----------------------------------+
| COMMERCE MODULE                  |
+----------------------------------+
| Commerce EXECUTES:               |
| - Payment processing             |
| - Wallet management              |
| - Invoice generation             |
| - VAT calculation                |
| - Settlement                     |
+----------------------------------+
```

**Rules:**
- Verticals NEVER process payments directly
- Verticals emit billing/payment facts
- Commerce module handles all money movement
- Clean separation for audit and compliance

### 1.6 Append-Only Discipline

Critical data is append-only (no UPDATE, no DELETE):

| Table Type | Examples | Mutation Rules |
|------------|----------|----------------|
| Audit Logs | All audit_log tables | Append only |
| Financial Facts | Donations, giving, expenses | Append only |
| Evidence Bundles | Legal, political evidence | Append only, hash-verified |
| Inspection Records | Civic inspections | Append only |
| Compliance Records | Regulatory submissions | Append only |

---

## 2. Current Architecture

### 2.1 High-Level System Architecture

```
+------------------------------------------------------------------+
|                         CLIENT LAYER                              |
+------------------------------------------------------------------+
|                                                                   |
|   +-------------------+    +-------------------+                  |
|   | Next.js App       |    | PWA / Mobile      |                  |
|   | (App Router)      |    | (Same codebase)   |                  |
|   +-------------------+    +-------------------+                  |
|              |                      |                             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      MIDDLEWARE LAYER                             |
+------------------------------------------------------------------+
|                                                                   |
|   +-------------------+    +-------------------+                  |
|   | Tenant Resolver   |    | Auth Middleware   |                  |
|   | (Domain/Query/    |    | (Session check)   |                  |
|   |  Cookie/Header)   |    |                   |                  |
|   +-------------------+    +-------------------+                  |
|              |                      |                             |
|              v                      v                             |
|   +-------------------+    +-------------------+                  |
|   | Capability Guard  |    | Demo Mode Gate    |                  |
|   | (Feature access)  |    | (URL-driven)      |                  |
|   +-------------------+    +-------------------+                  |
|                                                                   |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                       SERVICE LAYER                               |
+------------------------------------------------------------------+
|                                                                   |
|   +---------------+  +---------------+  +---------------+         |
|   | Commerce      |  | Education     |  | Health        |         |
|   | Services      |  | Services      |  | Services      |         |
|   +---------------+  +---------------+  +---------------+         |
|                                                                   |
|   +---------------+  +---------------+  +---------------+         |
|   | Civic         |  | Political     |  | Church        |         |
|   | Services      |  | Services      |  | Services      |         |
|   +---------------+  +---------------+  +---------------+         |
|                                                                   |
|   +---------------+  +---------------+  +---------------+         |
|   | Partner       |  | Audit         |  | Platform      |         |
|   | Services      |  | Services      |  | Services      |         |
|   +---------------+  +---------------+  +---------------+         |
|                                                                   |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        DATA LAYER                                 |
+------------------------------------------------------------------+
|                                                                   |
|   +-------------------+    +-------------------+                  |
|   | PostgreSQL        |    | Prisma ORM        |                  |
|   | (Supabase)        |    | (Type-safe)       |                  |
|   +-------------------+    +-------------------+                  |
|                                                                   |
|   +-------------------+    +-------------------+                  |
|   | Audit Logs        |    | Blob Storage      |                  |
|   | (Append-only)     |    | (Documents)       |                  |
|   +-------------------+    +-------------------+                  |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.2 Frontend Layer Structure

```
/app/frontend/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   ├── (marketing)/              # Public marketing pages
│   ├── demo/                     # Demo infrastructure
│   │   ├── credentials/          # Demo credentials portal
│   │   ├── playbooks/            # Sales demo playbooks
│   │   └── guided/               # Guided demo mode
│   ├── [vertical]-demo/          # 14 vertical demo pages
│   ├── dashboard/                # Main dashboard
│   ├── pos/                      # POS interface
│   ├── partner/                  # Partner pages
│   └── api/                      # API routes
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── demo/                     # Demo mode components
│   ├── partner/                  # Partner-specific components
│   └── [vertical]/               # Vertical-specific components
│
├── lib/
│   ├── capabilities/             # Capability registry & guards
│   ├── demo/                     # Demo mode context & data
│   ├── [vertical]/               # Vertical service layers
│   ├── partner/                  # Partner services
│   ├── auth/                     # Authentication helpers
│   └── tenant-isolation.ts       # Tenant isolation enforcement
│
├── config/
│   └── suites.ts                 # Suite & solution registry
│
└── middleware.ts                 # Tenant resolution middleware
```

### 2.3 Backend Layer Structure

```
/app/backend/
├── server.py                     # FastAPI entry point
└── tests/                        # Backend tests

/app/frontend/prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Migration history
```

### 2.4 Governance Enforcement Points

```
Request Flow:

1. MIDDLEWARE (tenant-resolver.ts)
   ├── Resolve tenant from domain/query/cookie/header
   ├── Set x-tenant-id header
   └── Gate demo mode access

2. CAPABILITY GUARD (runtime-guard.ts)
   ├── Check capability activation
   ├── Check entitlement validity
   └── Block if not authorized

3. SERVICE LAYER (lib/[vertical]/)
   ├── Enforce business rules
   ├── Apply Commerce Boundary
   └── Log audit events

4. DATA LAYER (tenant-isolation.ts)
   ├── Validate tenant context
   ├── Apply tenant filter to queries
   └── Prevent cross-tenant access

5. AUDIT LAYER (audit-logger.ts)
   ├── Log all changes
   ├── Record actor, action, timestamp
   └── Append-only storage
```

---

## 3. Multi-Tenancy Model

### 3.1 Tenant Hierarchy

```
+------------------------------------------------------------------+
|                       WEBWAKA PLATFORM                            |
|                     (Single Codebase)                             |
+------------------------------------------------------------------+
                              |
           +------------------+------------------+
           |                                     |
           v                                     v
+----------------------+              +----------------------+
|      PARTNER A       |              |      PARTNER B       |
|   (Integrator)       |              |   (Reseller)         |
+----------------------+              +----------------------+
           |                                     |
    +------+------+                       +------+
    |             |                       |
    v             v                       v
+-------+    +-------+               +-------+
|Tenant1|    |Tenant2|               |Tenant3|
|(Client)|   |(Client)|              |(Direct)|
+-------+    +-------+               +-------+
```

### 3.2 Data Model

```
Partner (Platform Level)
├── id
├── name
├── status (PENDING, ACTIVE, SUSPENDED)
├── type (INTEGRATOR, RESELLER, ENTERPRISE)
├── verificationStatus
└── referralCode

PlatformInstance (Partner's White-Label)
├── id
├── partnerId
├── name
├── subdomain
├── customDomain
├── branding (logo, colors)
└── settings

Tenant (End Customer)
├── id
├── partnerId
├── platformInstanceId
├── name
├── slug
├── status (ACTIVE, SUSPENDED, CHURNED)
├── type (RETAIL, MARKETPLACE, SCHOOL, etc.)
└── settings

TenantMembership
├── tenantId
├── userId
├── role (OWNER, ADMIN, MANAGER, STAFF, VIEWER)
└── permissions

User (Global)
├── id
├── email
├── globalRole (USER, PARTNER_USER, SUPER_ADMIN)
└── memberships[]
```

### 3.3 Demo Partner Account

```
Demo Partner Structure:
├── Partner: "WebWaka Demo Partner"
│   ├── Status: ACTIVE
│   ├── Type: INTEGRATOR
│   └── Purpose: Sales demos, evaluation
│
├── Demo Tenants (14 total):
│   ├── demo-retail-store (Commerce)
│   ├── demo-marketplace (Commerce/MVM)
│   ├── demo-school (Education)
│   ├── demo-clinic (Health)
│   ├── demo-hotel (Hospitality)
│   ├── demo-civic (Civic/GovTech)
│   ├── demo-logistics (Logistics)
│   ├── demo-real-estate (Real Estate)
│   ├── demo-recruitment (HR/Recruitment)
│   ├── demo-project (Project Management)
│   ├── demo-legal (Legal Practice)
│   ├── demo-warehouse (Warehouse)
│   ├── demo-parkhub (Transport)
│   ├── demo-political (Political)
│   └── demo-church (Church)
│
└── Demo Users (per tenant):
    ├── Owner/Admin
    ├── Manager
    ├── Staff roles (varies)
    └── Auditor (read-only)
```

### 3.4 Tenant Isolation Strategy

**Application Level:**
```typescript
// Every request carries tenant context
const tenantId = request.headers.get('x-tenant-id')

// All queries are tenant-scoped
const data = await prisma.transactions.findMany({
  where: { tenantId }
})
```

**Data Level:**
```typescript
// Enforced via tenant-isolation.ts
export function withTenantFilter<T>(where: T, tenantId: string) {
  return { ...where, tenantId }
}

// Violation detection
if (queryTenantId !== context.tenantId) {
  throw new TenantIsolationError('Cross-tenant access attempt')
}
```

**Domain Level:**
```typescript
// Middleware resolves tenant from:
// 1. x-tenant-id header (internal tools)
// 2. ?tenant= query param (testing)
// 3. tenant_slug cookie (session)
// 4. Custom domain lookup
// 5. Subdomain extraction
```

---

## 4. Governance as Architecture

### 4.1 What FREEZE Means

v2-FROZEN is a discipline, not a feature:

```
v2-FROZEN = Version 2, Behavior Locked

Rules:
- Business logic is immutable
- No silent schema changes
- No runtime feature toggles that change behavior
- No partner-requested customizations
- Evolution requires formal versioning (v3)

Enforcement:
- CI gates reject changes to FROZEN files
- Code review requires FREEZE acknowledgment
- Audit logging detects unexpected behavior
```

### 4.2 Why Governance Pages Exist

```
Website Structure:
├── /governance          # How WebWaka is governed
├── /trust               # Trust and verification
├── /for-regulators      # Regulator-specific information
├── /for-enterprise      # Enterprise compliance
└── /partners/*          # Partner governance expectations

Purpose:
- Set expectations before signup
- Filter unfit partners/customers
- Demonstrate compliance posture
- Support regulator due diligence
```

### 4.3 What Cannot Be Built

The architecture explicitly prevents:

| Prohibited | Why | Enforcement |
|------------|-----|-------------|
| Custom business logic | Breaks FREEZE | Code review gates |
| Tenant-specific pricing rules | Unfair, unauditable | Capability registry |
| Silent data modification | Audit integrity | Append-only tables |
| Cross-tenant data access | Privacy, security | Tenant isolation |
| Unlogged admin actions | Accountability | Mandatory audit logging |
| Auto-executing AI | Safety | Human approval gates |

### 4.4 Commerce Isolation

```typescript
// Political Suite Example
const POLITICAL_SUITE_INFO = {
  commerceBoundary: {
    recordsFactsOnly: true,
    noPaymentProcessing: true,
    noWalletManagement: true,
    noInvoiceGeneration: true,
  }
}

// Donation Service (Political)
async function recordDonation(data) {
  // Records donation FACT, does NOT process payment
  return await createDonationFact({
    ...data,
    _commerce_boundary: 'FACTS_ONLY',
    _payment_status: 'RECORDED_NOT_PROCESSED'
  })
}
```

---

## 5. Tech Stack Mapping

### 5.1 Next.js (App Router)

**Responsibility:**
- Routing and navigation
- Layout composition
- Server components
- API routes (edge)
- Middleware (tenant resolution, auth gates)
- Demo mode gating

**Why It Fits:**
- App Router aligns with WebWaka's hierarchical structure
- Middleware enables tenant resolution at edge
- Server components for data fetching
- API routes for lightweight endpoints

**What It Replaces:**
- Current: Already using Next.js
- No change, continue with App Router patterns

**Integration:**
```
Next.js App Router
├── (auth)/ group          → Clerk protected routes
├── (marketing)/ group     → Public pages
├── demo/ routes           → Demo mode pages
├── api/ routes            → Edge functions → Convex
└── middleware.ts          → Tenant resolution
```

### 5.2 Convex

**Responsibility:**
- All persistent data
- Real-time subscriptions
- Server-side mutations
- Queries with auth context
- Append-only patterns
- Scheduled jobs

**Why It Fits:**
- TypeScript-first (matches existing codebase)
- Built-in real-time (dashboards, POS)
- Function-based architecture (maps to services)
- Strong consistency (critical for financial data)
- Scheduled functions (background processing)

**What It Replaces:**
- Current: Prisma + PostgreSQL (Supabase)
- Migration: Schema definitions → Convex schema

**Integration:**
```
Convex Functions
├── queries/              → Read operations
├── mutations/            → Write operations (audited)
├── actions/              → External API calls
├── scheduled/            → Background jobs
└── schema.ts             → Data model
```

### 5.3 Vercel

**Responsibility:**
- Frontend hosting
- Edge routing
- Preview deployments
- Multi-domain support
- CDN distribution

**Why It Fits:**
- Native Next.js support
- Global edge network (important for Africa)
- Preview environments (demo, staging)
- Vercel for SaaS (custom domains)

**What It Replaces:**
- Current: Emergent hosting
- Migration: Deploy to Vercel

**Integration:**
```
Vercel Configuration
├── vercel.json           → Routing rules
├── Environment vars      → Convex URL, Clerk keys
├── Custom domains        → White-label support
└── Preview deployments   → PR-based testing
```

### 5.4 Fly.io

**Responsibility:**
- Long-running processes
- Background workers
- Region-specific compute
- Jobs that exceed edge limits

**Why It Fits:**
- African region presence (Lagos, Johannesburg)
- Persistent processes
- Database proximity
- Cost-effective compute

**What It Replaces:**
- Current: Backend server (FastAPI)
- Migration: Heavy compute → Fly.io workers

**Integration:**
```
Fly.io Services
├── worker/               → Background job processor
├── scheduler/            → Cron-like tasks
├── report-generator/     → PDF/Excel exports
└── integration-runner/   → External API calls
```

### 5.5 Clerk

**Responsibility:**
- Authentication
- Session management
- Organization (tenant) mapping
- Role-based access control
- SSO/OAuth (enterprise)

**Why It Fits:**
- Multi-tenant by design (Organizations)
- Role and permission system
- Nigerian phone auth (future)
- Enterprise SSO ready

**What It Replaces:**
- Current: Custom auth (bcryptjs, magic links)
- Migration: Auth flow → Clerk

**Integration:**
```
Clerk Configuration
├── Organizations         → Map to Tenants
├── Organization Roles    → Map to TenantRoles
├── Users                 → Global users
├── Invitations          → Tenant onboarding
└── Webhooks             → Sync to Convex
```

### 5.6 Vercel AI Gateway

**Responsibility:**
- AI request routing
- Usage tracking and limits
- Model selection
- Audit trail for AI calls

**Why It Fits:**
- Centralized AI access
- Usage governance
- Cost control
- Audit requirements

**What It Replaces:**
- Current: Direct API calls (if any)
- Migration: AI calls → Gateway

**Integration:**
```
AI Gateway Usage
├── Text generation       → Advisory insights
├── Embeddings           → Search, similarity
├── Audit logging        → All AI calls logged
└── Rate limiting        → Per-tenant limits
```

### 5.7 shadcn/ui + Tailwind

**Responsibility:**
- Design system
- UI components
- Consistent styling
- Governance UI patterns

**Why It Fits:**
- Already in use
- Copy-paste components
- Tailwind flexibility
- Accessible by default

**What It Replaces:**
- Current: Already using shadcn/ui
- No change, continue current approach

### 5.8 GitHub

**Responsibility:**
- Source of truth
- CI/CD pipelines
- Code review gates
- FREEZE protection

**Why It Fits:**
- Industry standard
- Actions for automation
- Branch protection rules
- Audit trail

**Integration:**
```
GitHub Configuration
├── Branch protection     → main requires review
├── CODEOWNERS           → FREEZE file owners
├── Actions              → CI/CD pipeline
└── Dependabot          → Security updates
```

### 5.9 Replit

**Responsibility:**
- Primary development environment
- Rapid iteration
- Collaboration
- Preview deployments

**Why It Fits:**
- Cloud-based development
- Team collaboration
- Integrated terminals
- Quick testing

**Integration:**
```
Replit Development
├── .replit              → Configuration
├── replit.nix           → Dependencies
├── Environment          → Dev credentials
└── Git sync             → Push to GitHub
```

---

## 6. Convex-First Data Architecture

### 6.1 Schema Design

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===== PLATFORM LEVEL =====
  
  partners: defineTable({
    name: v.string(),
    slug: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("ACTIVE"), v.literal("SUSPENDED")),
    type: v.union(v.literal("INTEGRATOR"), v.literal("RESELLER"), v.literal("ENTERPRISE")),
    verificationStatus: v.string(),
    referralCode: v.string(),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  // ===== TENANT LEVEL =====
  
  tenants: defineTable({
    partnerId: v.id("partners"),
    name: v.string(),
    slug: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("SUSPENDED"), v.literal("CHURNED")),
    type: v.string(), // RETAIL, SCHOOL, CLINIC, etc.
    isDemo: v.boolean(),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_partner", ["partnerId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_demo", ["isDemo"]),

  // ===== USER LEVEL =====
  
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    globalRole: v.union(v.literal("USER"), v.literal("PARTNER_USER"), v.literal("SUPER_ADMIN")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  tenantMemberships: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    role: v.union(
      v.literal("OWNER"),
      v.literal("ADMIN"),
      v.literal("MANAGER"),
      v.literal("STAFF"),
      v.literal("VIEWER"),
      v.literal("AUDITOR")
    ),
    permissions: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"])
    .index("by_tenant_user", ["tenantId", "userId"]),

  // ===== CAPABILITIES =====
  
  tenantCapabilities: defineTable({
    tenantId: v.id("tenants"),
    capabilityKey: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("SUSPENDED")),
    activatedAt: v.number(),
    suspendedAt: v.optional(v.number()),
    suspensionReason: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_capability", ["tenantId", "capabilityKey"]),

  // ===== AUDIT LOGS (APPEND-ONLY) =====
  
  auditLogs: defineTable({
    tenantId: v.optional(v.id("tenants")),
    actorId: v.string(),
    actorEmail: v.string(),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_actor", ["actorId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // ===== DEMO DATA =====
  
  demoCredentials: defineTable({
    tenantId: v.id("tenants"),
    role: v.string(),
    email: v.string(),
    description: v.string(),
  })
    .index("by_tenant", ["tenantId"]),
});
```

### 6.2 Append-Only Pattern

```typescript
// convex/auditLogs.ts

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// APPEND-ONLY: No update or delete mutations exist
export const create = mutation({
  args: {
    tenantId: v.optional(v.id("tenants")),
    actorId: v.string(),
    actorEmail: v.string(),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Read operations only
export const listByTenant = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

// NO update mutation
// NO delete mutation
```

### 6.3 Read vs Write Separation

```typescript
// convex/transactions.ts

// QUERIES: Read-only, tenant-scoped
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // Always tenant-scoped
    return await ctx.db
      .query("transactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

// MUTATIONS: Write operations with audit
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    // ... other args
  },
  handler: async (ctx, args) => {
    // 1. Create transaction
    const id = await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });

    // 2. Log audit event (always)
    await ctx.db.insert("auditLogs", {
      tenantId: args.tenantId,
      actorId: ctx.auth?.userId ?? "system",
      action: "transaction.create",
      targetType: "transaction",
      targetId: id,
      timestamp: Date.now(),
    });

    return id;
  },
});
```

### 6.4 Demo Data Protection

```typescript
// convex/helpers/demoGuard.ts

export function isDemoTenant(tenant: Doc<"tenants">) {
  return tenant.isDemo === true;
}

export function assertNotDemo(tenant: Doc<"tenants">, action: string) {
  if (isDemoTenant(tenant)) {
    throw new Error(`Cannot ${action} on demo tenant`);
  }
}

// Usage in mutations
export const deleteTransaction = mutation({
  args: { tenantId: v.id("tenants"), transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    assertNotDemo(tenant!, "delete transactions");
    
    // Proceed with delete (soft delete, audit logged)
  },
});
```

---

## 7. Auth and Identity with Clerk

### 7.1 Organization Model

```
Clerk Structure → WebWaka Mapping
─────────────────────────────────
Organization     → Tenant
Org Membership   → TenantMembership
Org Role         → TenantRole
User             → User (global)
```

### 7.2 Role Mapping

```typescript
// Clerk Organization Roles
const CLERK_ROLES = {
  "org:owner": "OWNER",
  "org:admin": "ADMIN",
  "org:manager": "MANAGER",
  "org:staff": "STAFF",
  "org:viewer": "VIEWER",
  "org:auditor": "AUDITOR",
};

// WebWaka Permission Mapping
const ROLE_PERMISSIONS = {
  OWNER: ["*"],
  ADMIN: ["manage:users", "manage:settings", "read:*", "write:*"],
  MANAGER: ["read:*", "write:transactions", "write:inventory"],
  STAFF: ["read:own", "write:transactions"],
  VIEWER: ["read:*"],
  AUDITOR: ["read:*", "read:audit"],
};
```

### 7.3 Demo Credentials Handling

```typescript
// Demo users are real Clerk users with special metadata
const demoUserMetadata = {
  isDemo: true,
  demoTenantSlug: "demo-retail-store",
  demoRole: "STAFF",
};

// Login flow for demo
async function handleDemoLogin(email: string, password: string) {
  // 1. Validate against known demo credentials
  const demoUser = DEMO_CREDENTIALS.find((c) => c.email === email);
  if (!demoUser || password !== "Demo2026!") {
    throw new Error("Invalid demo credentials");
  }

  // 2. Create or get Clerk user
  // 3. Set active organization to demo tenant
  // 4. Return session
}
```

### 7.4 Integration with Convex

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};

// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) return existing._id;

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      globalRole: "USER",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

---

## 8. Deployment Architecture

### 8.1 What Runs Where

```
+------------------------------------------------------------------+
|                      VERCEL (Frontend)                            |
+------------------------------------------------------------------+
| - Next.js application                                             |
| - Edge middleware (tenant resolution)                             |
| - API routes (lightweight)                                        |
| - Static assets (CDN)                                             |
| - Preview deployments                                             |
| - Custom domains (white-label)                                    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        CONVEX (Data)                              |
+------------------------------------------------------------------+
| - All database operations                                         |
| - Real-time subscriptions                                         |
| - Scheduled functions                                             |
| - File storage                                                    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      FLY.IO (Workers)                             |
+------------------------------------------------------------------+
| - Long-running background jobs                                    |
| - Report generation (PDF, Excel)                                  |
| - External API integrations                                       |
| - Heavy compute tasks                                             |
| - Region-specific processing                                      |
+------------------------------------------------------------------+
```

### 8.2 Multi-Domain Architecture

```
Domain Resolution Flow:

1. Custom Domain (partner.customdomain.com)
   └── Cloudflare DNS → Vercel
       └── Middleware: lookup tenant by domain
           └── Set x-tenant-id, apply branding

2. Subdomain (tenant.webwaka.com)
   └── Wildcard DNS → Vercel
       └── Middleware: extract subdomain
           └── Set x-tenant-id, apply branding

3. Demo Mode (app.webwaka.com?demo=true&tenant=demo-retail-store)
   └── Query parameter resolution
       └── Demo mode context enabled
```

### 8.3 Preview Environment Safety

```
Preview Deployment Rules:

1. NEVER connect to production Convex
   └── Use preview/staging Convex instance

2. Demo tenants only
   └── No real customer data in previews

3. Clearly labeled
   └── Preview banner on all pages

4. Auto-expire
   └── Preview deployments expire after X days
```

### 8.4 Governance Protection

```
Deployment Pipeline:

1. PR Created
   └── CI runs tests
   └── CODEOWNERS review required for FROZEN files

2. Preview Deployed
   └── Staging Convex instance
   └── Demo data only

3. PR Approved
   └── Human review required
   └── FREEZE check passed

4. Merge to main
   └── Auto-deploy to production
   └── Convex migrations applied

5. Rollback ready
   └── Instant rollback via Vercel
   └── Convex schema backward compatible
```

---

## 9. AI Integration

### 9.1 Centralized AI Access

```
All AI requests flow through Vercel AI Gateway:

Application
    │
    ▼
┌─────────────────────┐
│  Vercel AI Gateway  │
│  - Rate limiting    │
│  - Usage tracking   │
│  - Model routing    │
│  - Audit logging    │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│    AI Providers     │
│  - OpenAI           │
│  - Anthropic        │
│  - Google           │
└─────────────────────┘
```

### 9.2 AI Governance Rules

```typescript
const AI_GOVERNANCE = {
  // What AI CAN do
  allowed: [
    "Generate advisory insights",
    "Suggest actions (with human approval)",
    "Draft content (requires review)",
    "Analyze patterns (read-only)",
    "Answer questions about data",
  ],

  // What AI CANNOT do
  forbidden: [
    "Execute financial transactions",
    "Modify data without human approval",
    "Make binding decisions",
    "Access raw PII without logging",
    "Bypass audit trail",
  ],

  // Audit requirements
  auditRequirements: {
    logAllRequests: true,
    logAllResponses: true,
    includePrompts: false, // Privacy
    includeTenantId: true,
    includeActorId: true,
  },
};
```

### 9.3 High-Risk Vertical AI Rules

```typescript
// Political Suite AI Rules
const POLITICAL_AI_RULES = {
  forbidden: [
    "Generate campaign messaging",
    "Analyze voter data",
    "Predict election outcomes",
    "Generate donation solicitations",
  ],
  allowed: [
    "Summarize public disclosures",
    "Format compliance reports",
    "Extract dates/facts from documents",
  ],
};

// Church Suite AI Rules
const CHURCH_AI_RULES = {
  forbidden: [
    "Generate sermons or doctrine",
    "Provide pastoral counseling",
    "Access confidential pastoral notes",
  ],
  allowed: [
    "Summarize meeting minutes",
    "Format financial reports",
    "Generate event announcements",
  ],
};

// Health Suite AI Rules
const HEALTH_AI_RULES = {
  forbidden: [
    "Provide medical diagnoses",
    "Recommend treatments",
    "Access patient data without explicit consent",
  ],
  allowed: [
    "Summarize appointment notes (with consent)",
    "Format billing reports",
    "Generate appointment reminders",
  ],
};
```

---

## 10. Demo Architecture

### 10.1 Complete Demo Infrastructure

```
Demo System Components:

1. Demo Partner Account
   └── Partner: "WebWaka Demo Partner"
   └── 14 demo tenants (one per vertical)
   └── Pre-seeded Nigerian data

2. Demo Credentials System
   └── Master password: Demo2026!
   └── Role-specific emails per tenant
   └── Structured credential data

3. Demo UI Components
   ├── Demo Credentials Panel (login page)
   ├── Demo Credentials Portal (/demo/credentials)
   ├── Sales Demo Playbooks (/demo/playbooks)
   └── Guided Demo Mode (/demo/guided)

4. Demo Mode Context
   └── URL-driven state (?demo=true)
   └── React context provider
   └── Demo-only features gated
```

### 10.2 Demo Mode Flow

```
User Enters Demo:

1. Access /login?demo=true
   └── Demo Credentials Panel visible

2. Select vertical and role
   └── Credentials displayed

3. Login with demo credentials
   └── Session created
   └── Demo context activated

4. Navigate demo tenant
   └── Demo data displayed
   └── "DEMO MODE" indicator visible

5. Optional: Guided Demo Mode
   └── ?guidedDemo=true
   └── UI hints displayed
   └── Dismissible guidance
```

### 10.3 Demo vs Production Separation

```
Separation Rules:

1. Database Level
   └── Demo tenants: isDemo = true
   └── Demo data: clearly marked
   └── No production data mixing

2. Feature Level
   └── Demo tenants: can be reset
   └── Production tenants: no reset
   └── Demo: some features simulated

3. Access Level
   └── Demo credentials: public
   └── Production: private onboarding

4. Visual Level
   └── Demo: "DEMO MODE" badge
   └── Demo: yellow accent styling
   └── Production: no indicators
```

### 10.4 What Demo Is NOT

```
Demo Integrity Rules:

1. NOT fake/simulated backend
   └── Real services, real database
   └── Same code as production

2. NOT deceptive
   └── Clearly labeled as demo
   └── Fictional data acknowledged

3. NOT editable by visitors
   └── Demo data protected
   └── Resets to clean state

4. NOT production preview
   └── Different tenant
   └── Different credentials
```

---

## 11. What WebWaka Is NOT

This section is mandatory and critical for understanding boundaries.

### 11.1 NOT a Generic SaaS Builder

WebWaka is not:
- A no-code/low-code platform
- A customizable SaaS framework
- A white-label anything-builder

WebWaka IS:
- A fixed set of governed verticals
- Locked behavior (v2-FROZEN)
- Partner-distributed, not self-serve customized

### 11.2 NOT a Marketplace

WebWaka is not:
- A marketplace platform (though it has MVM capability)
- An app store
- A plugin ecosystem

WebWaka IS:
- The marketplace operator tool (for partners who run marketplaces)
- A closed system with defined capabilities

### 11.3 NOT a Low-Code Tool

WebWaka is not:
- A workflow builder
- A form builder
- A dashboard designer

WebWaka IS:
- Pre-built workflows (FROZEN)
- Pre-built forms (FROZEN)
- Pre-built dashboards (FROZEN)

### 11.4 NOT a Payments Processor

WebWaka is not:
- A payment gateway
- A money transmitter
- A financial institution

WebWaka IS:
- A facts-recording system
- An integration layer to payment providers
- A compliance/audit platform for financial facts

### 11.5 NOT an Election System

WebWaka Political Suite is not:
- An official election management system
- A voter registration system
- Affiliated with INEC
- A replacement for government systems

WebWaka Political Suite IS:
- Internal party operations tool
- Campaign management platform
- Fundraising facts recorder
- Internal primary coordinator
- INEC-compliant disclosure generator

### 11.6 NOT a Church Doctrine System

WebWaka Church Suite is not:
- A sermon generator
- A theological tool
- A pastoral counselor
- A religious authority

WebWaka Church Suite IS:
- Administrative infrastructure
- Membership management
- Financial facts recorder
- Event scheduler
- Governance tool

### 11.7 NOT a Monolith

WebWaka is not:
- A single deployable unit
- A tightly coupled system
- Impossible to scale components independently

WebWaka IS:
- Multi-layer architecture (frontend, data, workers)
- Independently scalable components
- Microservice-ready (but not micro for complexity's sake)

---

## Appendix A: File Reference

### Key Configuration Files

| File | Purpose |
|------|---------|
| `/frontend/src/config/suites.ts` | Suite and solution registry |
| `/frontend/src/lib/capabilities/registry.ts` | Capability definitions |
| `/frontend/src/lib/demo/credentials.ts` | Demo credential data |
| `/frontend/src/lib/demo/types.ts` | Demo mode types |
| `/frontend/src/middleware.ts` | Tenant resolution |
| `/frontend/src/lib/tenant-isolation.ts` | Tenant isolation enforcement |

### Key Service Directories

| Directory | Domain |
|-----------|--------|
| `/frontend/src/lib/pos/` | Point of Sale |
| `/frontend/src/lib/inventory/` | Inventory Management |
| `/frontend/src/lib/accounting/` | Accounting |
| `/frontend/src/lib/education/` | Education Suite |
| `/frontend/src/lib/health/` | Health Suite |
| `/frontend/src/lib/hospitality/` | Hospitality Suite |
| `/frontend/src/lib/civic/` | Civic Suite |
| `/frontend/src/lib/political/` | Political Suite |
| `/frontend/src/lib/church/` | Church Suite |

### Documentation

| Document | Purpose |
|----------|---------|
| `/frontend/docs/DEMO_CREDENTIALS_MASTER_INDEX.md` | All demo credentials |
| `/frontend/docs/PARTNER_DOMAIN_MODELS.md` | Partner data models |
| `/frontend/docs/PAYOUT_READINESS.md` | Financial payout logic |
| `/frontend/docs/[suite]-suite-s6-freeze.md` | Freeze documentation per suite |

---

## Appendix B: Migration Checklist

### Phase 1: Foundation

- [ ] Set up Convex project
- [ ] Set up Clerk project with organizations
- [ ] Configure Vercel project
- [ ] Set up Fly.io worker
- [ ] Define Convex schema
- [ ] Implement Clerk webhook → Convex sync

### Phase 2: Core Migration

- [ ] Migrate tenant management to Convex
- [ ] Migrate user management to Clerk/Convex
- [ ] Migrate capability system
- [ ] Implement tenant isolation in Convex
- [ ] Set up audit logging

### Phase 3: Vertical Migration (per vertical)

- [ ] Migrate data schema
- [ ] Migrate queries
- [ ] Migrate mutations
- [ ] Verify append-only constraints
- [ ] Test demo mode

### Phase 4: Demo System

- [ ] Seed demo data in Convex
- [ ] Verify demo credentials
- [ ] Test guided demo mode
- [ ] Validate demo protection

### Phase 5: Production Readiness

- [ ] Performance testing
- [ ] Security audit
- [ ] Compliance verification
- [ ] Documentation update

---

**END OF DOCUMENT**

This document is the canonical architectural reference for WebWaka platform development. It should be consulted for all architectural decisions and used as the primary reference when continuing development on Replit or any other environment.
