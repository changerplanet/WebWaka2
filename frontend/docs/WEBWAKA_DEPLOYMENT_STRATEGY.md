# WebWaka Platform — External Deployment & Multi-Tenant Hosting Strategy

**Version:** 1.0  
**Date:** January 8, 2026  
**Classification:** Strategic Architecture Document  
**Status:** RECOMMENDATION ONLY — No Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Recommended Primary Deployment Architecture](#2-recommended-primary-deployment-architecture)
3. [Alternative Architectures](#3-alternative-architectures)
4. [Multi-Tenancy & White-Label Design](#4-multi-tenancy--white-label-design)
5. [Partner Enablement Model](#5-partner-enablement-model)
6. [Deployment Pipeline & Environments](#6-deployment-pipeline--environments)
7. [Security, Compliance & Trust](#7-security-compliance--trust)
8. [Risks & Mitigations](#8-risks--mitigations)
9. [Clear Recommendation & Rationale](#9-clear-recommendation--rationale)
10. [Open Questions / Decisions Required](#10-open-questions--decisions-required)

---

## 1. Executive Summary

### The Challenge

WebWaka is a governance-first, multi-tenant platform serving 14 frozen verticals across African markets. Its deployment strategy must support:

- **Scale**: Hundreds of partners, thousands of tenants, millions of end-users
- **Trust**: Enterprise, regulator, and government confidence
- **Governance**: Immutable FREEZE discipline preserved across all deployments
- **Flexibility**: White-label, multi-domain, partner-managed deployments

### The Recommendation

**Primary Architecture: Hybrid Cloud with Managed Kubernetes**

| Component | Recommendation | Rationale |
|-----------|----------------|-----------|
| Frontend | Vercel (Edge) | Global CDN, instant deploys, preview environments |
| Backend | AWS EKS / GCP GKE | Control, compliance, data residency |
| Database | Managed PostgreSQL (Supabase/RDS) | Reliability, backups, compliance |
| Domain Routing | Cloudflare | DNS, SSL, WAF, DDoS protection |

### Why This Matters

This architecture:
- ✅ Preserves FREEZE governance at all layers
- ✅ Enables partner self-service without core access
- ✅ Supports African data residency requirements
- ✅ Scales predictably without vendor lock-in
- ✅ Maintains audit integrity for regulators

---

## 2. Recommended Primary Deployment Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE (Edge Layer)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ DNS Routing │  │ SSL/TLS     │  │ WAF/DDoS    │  │ Rate Limit  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  Domain Resolution:                                                          │
│  *.webwaka.com  ──► Vercel (Frontend)                                       │
│  api.webwaka.com ──► AWS/GCP (Backend)                                      │
│  partner.customdomain.com ──► Tenant-Resolved Routing                       │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                    │
                          ▼                    ▼
┌──────────────────────────────┐    ┌──────────────────────────────────────────┐
│       VERCEL (Frontend)       │    │         AWS/GCP (Backend)                │
│                               │    │                                          │
│  ┌─────────────────────────┐ │    │  ┌──────────────────────────────────────┐│
│  │   Next.js Application    │ │    │  │         KUBERNETES CLUSTER          ││
│  │   (Edge Functions)       │ │    │  │                                      ││
│  │                          │ │    │  │  ┌────────────┐  ┌────────────┐     ││
│  │  • Static Assets (CDN)   │ │    │  │  │ API Pods   │  │ Worker Pods│     ││
│  │  • SSR Pages             │ │    │  │  │ (FastAPI)  │  │ (Celery)   │     ││
│  │  • API Route Proxying    │ │    │  │  └────────────┘  └────────────┘     ││
│  │  • Tenant Theme Resolver │ │    │  │                                      ││
│  └─────────────────────────┘ │    │  │  ┌────────────┐  ┌────────────┐     ││
│                               │    │  │  │ Auth Svc   │  │ Audit Svc  │     ││
│  Preview Deployments:         │    │  │  │            │  │ (Append)   │     ││
│  • PR previews                │    │  │  └────────────┘  └────────────┘     ││
│  • Branch deploys             │    │  └──────────────────────────────────────┘│
│  • Demo environments          │    │                                          │
└──────────────────────────────┘    │  ┌──────────────────────────────────────┐│
                                     │  │         DATA LAYER                   ││
                                     │  │                                      ││
                                     │  │  ┌────────────┐  ┌────────────┐     ││
                                     │  │  │ PostgreSQL │  │ Redis      │     ││
                                     │  │  │ (Supabase) │  │ (Cache)    │     ││
                                     │  │  └────────────┘  └────────────┘     ││
                                     │  │                                      ││
                                     │  │  ┌────────────┐  ┌────────────┐     ││
                                     │  │  │ S3/GCS     │  │ Audit Logs │     ││
                                     │  │  │ (Files)    │  │ (Immutable)│     ││
                                     │  │  └────────────┘  └────────────┘     ││
                                     │  └──────────────────────────────────────┘│
                                     └──────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **Edge Layer** | Cloudflare | DNS, SSL, WAF, rate limiting, geo-routing |
| **Frontend** | Vercel + Next.js | UI rendering, static assets, edge functions, tenant theming |
| **API Gateway** | Kong / AWS API Gateway | Request routing, authentication, rate limiting |
| **Backend Services** | FastAPI on Kubernetes | Business logic, FREEZE enforcement, audit logging |
| **Database** | Supabase PostgreSQL | Multi-tenant data, row-level security |
| **Cache** | Redis Cluster | Session management, rate limiting, hot data |
| **Object Storage** | S3 / GCS | Document storage, exports, backups |
| **Audit Storage** | Immutable S3 + CloudTrail | Append-only audit logs, compliance evidence |

### 2.3 Request Flow

```
User Request
     │
     ▼
┌─────────────────┐
│   Cloudflare    │ ─── Domain resolution
│   (Edge)        │ ─── SSL termination
└────────┬────────┘ ─── Bot protection
         │
         ▼
┌─────────────────┐
│    Vercel       │ ─── Tenant identification (from domain/subdomain)
│   (Frontend)    │ ─── Theme/branding resolution
└────────┬────────┘ ─── Static content serving
         │
         ▼ (API calls)
┌─────────────────┐
│  API Gateway    │ ─── Authentication validation
│                 │ ─── Tenant header injection
└────────┬────────┘ ─── Rate limiting
         │
         ▼
┌─────────────────┐
│   Backend       │ ─── FREEZE rule enforcement
│  (Kubernetes)   │ ─── Business logic
└────────┬────────┘ ─── Audit logging
         │
         ▼
┌─────────────────┐
│   Database      │ ─── Row-level security
│  (PostgreSQL)   │ ─── Tenant data isolation
└─────────────────┘
```

---

## 3. Alternative Architectures

### 3.1 Option A: Vercel-Centric (Frontend + Edge + API Routes)

```
┌─────────────────────────────────────────────┐
│              VERCEL (Everything)             │
│                                              │
│  Frontend ─────────► Edge Functions          │
│                            │                 │
│                            ▼                 │
│                      API Routes              │
│                            │                 │
│                            ▼                 │
│                   External Database          │
│                   (Supabase/PlanetScale)     │
└─────────────────────────────────────────────┘
```

| Dimension | Assessment |
|-----------|------------|
| **Scalability** | ⚠️ Limited — Edge functions have execution time limits (10-30s), cold starts |
| **Multi-tenancy** | ✅ Good — Domain-based routing works well |
| **White-labeling** | ✅ Excellent — Native custom domain support |
| **Cost model** | ⚠️ Variable — Can spike with traffic, function invocations |
| **Operational risk** | ⚠️ Vendor lock-in, limited backend control |
| **Governance fit** | ❌ Poor — Cannot enforce FREEZE at infrastructure level |

**Verdict:** Suitable for MVP or small-scale, but **NOT recommended** for governance-critical, African-scale deployment.

---

### 3.2 Option B: Hybrid (Recommended)

```
┌───────────────────┐    ┌───────────────────────────┐
│  Vercel           │    │   AWS/GCP                  │
│  (Frontend)       │◄──►│   (Backend + Data)         │
│                   │    │                            │
│  - UI/UX          │    │  - Business Logic          │
│  - Edge Caching   │    │  - FREEZE Enforcement      │
│  - Theme Resolver │    │  - Audit System            │
│  - Domain Routing │    │  - Data Residency          │
└───────────────────┘    └───────────────────────────┘
```

| Dimension | Assessment |
|-----------|------------|
| **Scalability** | ✅ Excellent — Independent scaling of frontend/backend |
| **Multi-tenancy** | ✅ Excellent — Full control over tenant isolation |
| **White-labeling** | ✅ Excellent — Vercel domains + custom routing |
| **Cost model** | ✅ Predictable — Reserved instances, committed use |
| **Operational risk** | ✅ Low — No single vendor dependency |
| **Governance fit** | ✅ Excellent — Full infrastructure control |

**Verdict:** **RECOMMENDED** — Best balance of control, compliance, and developer experience.

---

### 3.3 Option C: Full Cloud (AWS / GCP / Azure)

```
┌─────────────────────────────────────────────────────┐
│                    AWS / GCP / Azure                 │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ CloudFront/ │  │ EKS/GKE     │  │ RDS/Cloud   │ │
│  │ Cloud CDN   │  │ (All Apps)  │  │ SQL         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ S3/GCS     │  │ Secrets     │  │ CloudWatch  │ │
│  │            │  │ Manager     │  │ /Monitoring │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

| Dimension | Assessment |
|-----------|------------|
| **Scalability** | ✅ Excellent — Unlimited with proper architecture |
| **Multi-tenancy** | ✅ Excellent — Full control |
| **White-labeling** | ⚠️ Complex — Requires more custom setup |
| **Cost model** | ⚠️ Complex — Many services to manage |
| **Operational risk** | ⚠️ Higher ops burden, more moving parts |
| **Governance fit** | ✅ Excellent — Full control |

**Verdict:** Viable for enterprises with dedicated DevOps, but higher operational overhead than hybrid.

---

### 3.4 Comparison Matrix

| Criteria | Vercel-Centric | Hybrid (Rec.) | Full Cloud |
|----------|----------------|---------------|------------|
| Time to Production | 🟢 Fast | 🟡 Medium | 🔴 Slow |
| Operational Complexity | 🟢 Low | 🟡 Medium | 🔴 High |
| Governance Control | 🔴 Limited | 🟢 Full | 🟢 Full |
| Data Residency | 🔴 Limited | 🟢 Full | 🟢 Full |
| Cost Predictability | 🔴 Variable | 🟢 Predictable | 🟡 Complex |
| Vendor Lock-in | 🔴 High | 🟡 Moderate | 🟡 Moderate |
| African Market Fit | 🔴 Poor | 🟢 Excellent | 🟢 Good |

---

## 4. Multi-Tenancy & White-Label Design

### 4.1 Multi-Tenancy Architecture

#### 4.1.1 Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEBWAKA PLATFORM                          │
│                       (Single Codebase)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │ Partner A │   │ Partner B │   │ Partner C │
        │ (Integrator│   │(Reseller) │   │(Enterprise│
        └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
              │               │               │
     ┌────────┼────────┐      │        ┌──────┴──────┐
     ▼        ▼        ▼      ▼        ▼             ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Tenant 1││Tenant 2││Tenant 3││Tenant 4││Tenant 5││Tenant 6│
│(Client)││(Client)││(Client)││(Direct)││(Dept 1)││(Dept 2)│
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
```

#### 4.1.2 Tenant Isolation Strategy

| Layer | Isolation Method | Implementation |
|-------|------------------|----------------|
| **Application** | Tenant Context | `x-tenant-id` header, middleware enforcement |
| **Data** | Row-Level Security | PostgreSQL RLS policies |
| **Domain** | DNS-based Resolution | Subdomain/custom domain → tenant mapping |
| **Compute** | Shared Infrastructure | Kubernetes namespaces (optional per-tenant) |
| **Storage** | Prefixed Objects | `s3://bucket/{tenant_id}/...` |

#### 4.1.3 Data Layer Isolation

```sql
-- PostgreSQL Row-Level Security Example

-- Enable RLS on all tenant tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON transactions
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Audit logs: Append-only, no delete
CREATE POLICY audit_append_only ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Prevent all updates/deletes on audit
CREATE POLICY audit_no_modify ON audit_logs
    FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON audit_logs
    FOR DELETE USING (false);
```

#### 4.1.4 Demo vs Production Tenant Separation

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT CLASSIFICATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRODUCTION TENANTS              DEMO TENANTS                │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │ • Real data      │           │ • Seeded data    │        │
│  │ • Real users     │           │ • Demo users     │        │
│  │ • Audit enforced │           │ • Audit enabled  │        │
│  │ • No reset       │           │ • Reset allowed  │        │
│  │ • Billing active │           │ • No billing     │        │
│  └──────────────────┘           └──────────────────┘        │
│                                                              │
│  Database: production_db         Database: demo_db           │
│  Flag: is_demo = false           Flag: is_demo = true        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Rules:**
- Demo tenants CANNOT be promoted to production
- Production tenants CANNOT be demoted to demo
- Demo data is clearly marked and segregated
- Audit logs are preserved even for demo (for debugging)

### 4.2 White-Label Strategy

#### 4.2.1 Domain Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WEBWAKA-OWNED DOMAINS                                          │
│  ├── webwaka.com               (Marketing site)                 │
│  ├── app.webwaka.com           (Main application)               │
│  ├── api.webwaka.com           (API endpoint)                   │
│  ├── demo.webwaka.com          (Demo environment)               │
│  └── {tenant}.webwaka.com      (Tenant subdomains)              │
│                                                                  │
│  PARTNER-OWNED DOMAINS                                          │
│  ├── app.partner-erp.ng        (Partner's branded app)          │
│  ├── {client}.partner-erp.ng   (Partner's client subdomains)    │
│  └── custom-client.com         (Client's own domain)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 DNS Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNS CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OPTION 1: CNAME to WebWaka                                     │
│  ─────────────────────────────                                   │
│  app.partner.com  CNAME  custom.webwaka.com                     │
│                                                                  │
│  OPTION 2: A Record to Load Balancer                            │
│  ─────────────────────────────────────                           │
│  app.partner.com  A      203.0.113.50 (WebWaka LB IP)           │
│                                                                  │
│  OPTION 3: Cloudflare for SaaS (Recommended)                    │
│  ────────────────────────────────────────────                    │
│  Partner adds CNAME → WebWaka's Cloudflare zone                 │
│  SSL automatically provisioned                                   │
│  DDoS protection included                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 SSL/TLS Handling

| Scenario | SSL Solution |
|----------|--------------|
| `*.webwaka.com` | Wildcard certificate (managed) |
| `partner.customdomain.com` | Cloudflare for SaaS (auto-provision) |
| `client.customdomain.com` | Let's Encrypt via Cloudflare |
| Enterprise (own certs) | Customer-provided, uploaded to Cloudflare |

#### 4.2.4 Tenant Resolution Flow

```
Incoming Request: https://app.partner-erp.ng/dashboard
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Receive request                                          ││
│  │ 2. SSL termination                                          ││
│  │ 3. Forward to Vercel with original Host header              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  VERCEL (Middleware)                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ // middleware.ts                                            ││
│  │                                                              ││
│  │ const hostname = request.headers.get('host')                ││
│  │                                                              ││
│  │ // Lookup tenant by domain                                  ││
│  │ const tenant = await getTenantByDomain(hostname)            ││
│  │                                                              ││
│  │ if (!tenant) return new Response('Not Found', { status: 404 })││
│  │                                                              ││
│  │ // Inject tenant context                                    ││
│  │ request.headers.set('x-tenant-id', tenant.id)               ││
│  │ request.headers.set('x-tenant-theme', tenant.theme)         ││
│  │                                                              ││
│  │ return NextResponse.next()                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATION                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Load tenant-specific theme/branding                       ││
│  │ • Apply tenant-specific feature flags                       ││
│  │ • Route API calls with x-tenant-id header                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.5 Branding & Theming Boundaries

| Customizable (Partner CAN) | Locked (Partner CANNOT) |
|---------------------------|-------------------------|
| Logo | Core UI components |
| Primary/secondary colors | Navigation structure |
| Favicon | Business logic |
| Email templates (content) | FREEZE rules |
| Welcome messages | Audit mechanisms |
| Support contact info | Security policies |
| Custom domain | Data access patterns |

**Theme Configuration Schema:**

```typescript
interface TenantTheme {
  // Allowed customizations
  logo: {
    primary: string;      // URL to logo
    favicon: string;      // URL to favicon
    emailHeader: string;  // URL to email logo
  };
  colors: {
    primary: string;      // Hex color
    secondary: string;    // Hex color
    accent: string;       // Hex color
  };
  branding: {
    companyName: string;
    supportEmail: string;
    supportPhone: string;
    privacyUrl: string;
    termsUrl: string;
  };
  
  // NOT customizable (enforced by platform)
  // - Component styles
  // - Typography
  // - Icons
  // - Layout structure
}
```

---

## 5. Partner Enablement Model

### 5.1 Partner Capabilities Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARTNER CONTROL MATRIX                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ PARTNERS CAN:                    ❌ PARTNERS CANNOT:         │
│  ──────────────────                  ────────────────────        │
│  • Create tenants for clients        • Modify FREEZE rules      │
│  • Manage tenant users               • Access other partners    │
│  • Configure tenant branding         • Bypass audit logging     │
│  • Set up custom domains             • Delete audit records     │
│  • Access tenant analytics           • Modify core business     │
│  • Run demos for prospects             logic                    │
│  • Generate compliance reports       • Access raw database      │
│  • Export tenant data (audited)      • Disable security         │
│  • Manage billing relationships      • Create admin accounts    │
│  • Set feature flags (allowed list)  • Override commerce        │
│                                        boundary                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Partner Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARTNER ONBOARDING                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ 1. APPLICATION  │  Partner applies via /partners/apply
│    REVIEW       │  WebWaka reviews: business model, compliance
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. AGREEMENT    │  Partner signs partnership agreement
│    SIGNING      │  Includes: FREEZE compliance, data handling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. ACCOUNT      │  Partner account created
│    PROVISIONING │  Partner admin credentials issued
└────────┬────────┘  Partner dashboard access granted
         │
         ▼
┌─────────────────┐
│ 4. DEMO         │  Partner demo environment provisioned
│    ENVIRONMENT  │  Pre-seeded with demo data
└────────┬────────┘  Partner can demo to prospects
         │
         ▼
┌─────────────────┐
│ 5. PRODUCTION   │  Partner creates first production tenant
│    ACTIVATION   │  Billing activated
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. ONGOING      │  Partner support channel
│    SUPPORT      │  Partner training materials
└─────────────────┘  Partner certification program
```

### 5.3 Partner Dashboard Capabilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARTNER DASHBOARD                             │
│                    partner.webwaka.com                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  TENANT MANAGEMENT                                          ││
│  │  ├── Create New Tenant                                      ││
│  │  ├── View All Tenants                                       ││
│  │  ├── Tenant Health Dashboard                                ││
│  │  └── Tenant Settings                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  DOMAIN MANAGEMENT                                          ││
│  │  ├── Add Custom Domain                                      ││
│  │  ├── Verify Domain Ownership                                ││
│  │  ├── SSL Certificate Status                                 ││
│  │  └── DNS Configuration Guide                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  DEMO MANAGEMENT                                            ││
│  │  ├── Create Demo Environment                                ││
│  │  ├── Reset Demo Data                                        ││
│  │  ├── Demo Credentials                                       ││
│  │  └── Demo Playbooks                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  BILLING & ANALYTICS                                        ││
│  │  ├── Revenue Dashboard                                      ││
│  │  ├── Tenant Usage Reports                                   ││
│  │  ├── Invoice History                                        ││
│  │  └── Commission Statements                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  COMPLIANCE                                                 ││
│  │  ├── Tenant Audit Logs (Read-Only)                         ││
│  │  ├── Compliance Reports                                     ││
│  │  ├── Data Export Requests                                   ││
│  │  └── Regulator Access Grants                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 FREEZE Protection Enforcement

```
┌─────────────────────────────────────────────────────────────────┐
│           HOW FREEZE PROTECTS THE PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WHAT FREEZE MEANS:                                             │
│  ─────────────────                                               │
│  • 14 verticals are v2-FROZEN                                   │
│  • Business logic is immutable                                  │
│  • No partner can request changes                               │
│  • No client can modify behavior                                │
│  • Platform evolution requires formal versioning                │
│                                                                  │
│  HOW FREEZE IS ENFORCED:                                        │
│  ──────────────────────                                          │
│  1. Code Level                                                  │
│     • FREEZE decorators on business logic                       │
│     • Compilation-time checks                                   │
│     • PR gates that reject FREEZE modifications                 │
│                                                                  │
│  2. API Level                                                   │
│     • Versioned endpoints (v2 = frozen)                         │
│     • Schema validation prevents extension                      │
│     • Audit logging of all attempts                             │
│                                                                  │
│  3. Database Level                                              │
│     • Migrations require formal approval                        │
│     • Schema changes logged and reversible                      │
│     • No DDL from application code                              │
│                                                                  │
│  4. Partner Level                                               │
│     • Partners cannot submit code                               │
│     • Partners cannot request schema changes                    │
│     • Partners can only configure allowed parameters            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Deployment Pipeline & Environments

### 6.1 Environment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT TOPOLOGY                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LOCAL / DEVELOPMENT                                             │
│  ─────────────────────                                           │
│  • Developer machines                                            │
│  • Docker Compose                                                │
│  • Local PostgreSQL                                              │
│  • Seeded test data                                              │
│  • Hot reload enabled                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PREVIEW / PR                                                    │
│  ────────────────                                                │
│  • Vercel Preview Deployments                                    │
│  • Per-PR environments                                           │
│  • Shared staging database (isolated schema)                     │
│  • Automated E2E tests                                           │
│  • Ephemeral (auto-cleanup)                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGING                                                         │
│  ─────────                                                       │
│  • Production-like infrastructure                                │
│  • staging.webwaka.com                                           │
│  • Full Kubernetes deployment                                    │
│  • Staging database (production schema)                          │
│  • Performance testing                                           │
│  • Security scanning                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  DEMO                                                            │
│  ──────                                                          │
│  • demo.webwaka.com                                              │
│  • Production infrastructure                                     │
│  • Demo-only database                                            │
│  • Pre-seeded demo accounts                                      │
│  • Resettable on schedule                                        │
│  • Public access (with demo flag)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION                                                      │
│  ───────────                                                     │
│  • app.webwaka.com + custom domains                              │
│  • Full HA deployment                                            │
│  • Multi-region (Lagos, Cape Town, Nairobi)                      │
│  • Production database (RDS Multi-AZ)                            │
│  • Blue-green deployment                                         │
│  • Zero-downtime required                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   DEVELOPER     │
│   Push to       │
│   Branch        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS - BUILD & TEST                                   │
│  ─────────────────────────────                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Lint        │  │ Type Check  │  │ Unit Tests  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Build       │  │ Security    │  │ FREEZE      │              │
│  │ Frontend    │  │ Scan        │  │ Check       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────┐
         ▼                                     ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  PR PREVIEW             │    │  MAIN BRANCH            │
│  (Vercel Preview)       │    │  (Continues below)      │
│  ─────────────────      │    │                         │
│  • Auto-deploy          │    │                         │
│  • E2E Tests            │    │                         │
│  • Visual Regression    │    │                         │
│  • PR Comment           │    │                         │
└─────────────────────────┘    └────────────┬────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGING DEPLOYMENT                                              │
│  ──────────────────                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Deploy to   │  │ Integration │  │ Performance │              │
│  │ Staging K8s │  │ Tests       │  │ Tests       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ Security    │  │ Approval    │                               │
│  │ Scan        │  │ Gate        │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ (Manual approval or scheduled)
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT (Blue-Green)                              │
│  ──────────────────────────────────                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  ┌─────────┐     ┌─────────┐     ┌─────────┐              ││
│  │  │ Deploy  │────►│ Smoke   │────►│ Traffic │              ││
│  │  │ Green   │     │ Tests   │     │ Switch  │              ││
│  │  └─────────┘     └─────────┘     └─────────┘              ││
│  │                                        │                    ││
│  │                            ┌───────────┴───────────┐       ││
│  │                            ▼                       ▼       ││
│  │                    ┌─────────────┐         ┌─────────────┐ ││
│  │                    │ Gradual     │         │ Rollback    │ ││
│  │                    │ Rollout     │         │ (if needed) │ ││
│  │                    │ (10%→100%)  │         │             │ ││
│  │                    └─────────────┘         └─────────────┘ ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Secrets Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECRETS ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SECRET STORAGE:                                                │
│  ──────────────                                                  │
│  • AWS Secrets Manager / GCP Secret Manager                     │
│  • HashiCorp Vault (for enterprise)                             │
│                                                                  │
│  SECRET TYPES:                                                  │
│  ─────────────                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Platform Secrets (WebWaka-managed)                        │ │
│  │ • Database credentials                                     │ │
│  │ • API keys (internal services)                            │ │
│  │ • Encryption keys                                          │ │
│  │ • JWT signing keys                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Tenant Secrets (Tenant-managed)                           │ │
│  │ • Payment gateway keys (per tenant)                       │ │
│  │ • SMS provider keys (per tenant)                          │ │
│  │ • Email provider keys (per tenant)                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Partner Secrets (Partner-managed)                         │ │
│  │ • Partner API keys                                         │ │
│  │ • Webhook signing secrets                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ENVIRONMENT INJECTION:                                         │
│  ─────────────────────                                           │
│  • Kubernetes: External Secrets Operator                        │
│  • Vercel: Environment Variables (encrypted)                    │
│  • Local: .env files (gitignored)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Rollback Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLLBACK PROCEDURES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND ROLLBACK (Vercel):                                    │
│  ─────────────────────────────                                   │
│  1. Navigate to Vercel dashboard                                │
│  2. Select previous successful deployment                       │
│  3. Click "Promote to Production"                               │
│  4. Traffic immediately switches                                │
│  Time: < 1 minute                                               │
│                                                                  │
│  BACKEND ROLLBACK (Kubernetes):                                 │
│  ───────────────────────────────                                 │
│  1. kubectl rollout undo deployment/api                         │
│  2. Previous pods scaled up                                     │
│  3. Current pods scaled down                                    │
│  4. Health checks verified                                      │
│  Time: 2-5 minutes                                              │
│                                                                  │
│  DATABASE ROLLBACK:                                             │
│  ──────────────────                                              │
│  • Migrations are forward-only                                  │
│  • Compensating migrations for rollback                         │
│  • Point-in-time recovery available (RPO: 5 min)               │
│  • Data-preserving approach (no destructive rollbacks)         │
│                                                                  │
│  FULL DISASTER RECOVERY:                                        │
│  ────────────────────────                                        │
│  • RTO: 1 hour                                                  │
│  • RPO: 5 minutes                                               │
│  • Cross-region failover available                              │
│  • Runbook documented and tested quarterly                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Security, Compliance & Trust

### 7.1 Authentication Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRIMARY: JWT with Refresh Tokens                               │
│  ─────────────────────────────────                               │
│  • Access Token: 15 minutes                                     │
│  • Refresh Token: 7 days (sliding)                              │
│  • Stored: HttpOnly cookies                                     │
│  • Algorithm: RS256                                             │
│                                                                  │
│  JWT CLAIMS:                                                    │
│  ───────────                                                     │
│  {                                                              │
│    "sub": "user_id",                                            │
│    "tenant_id": "tenant_uuid",                                  │
│    "partner_id": "partner_uuid",    // if applicable            │
│    "roles": ["admin", "auditor"],                               │
│    "permissions": ["read:*", "write:transactions"],             │
│    "is_demo": false,                                            │
│    "iat": 1704700000,                                           │
│    "exp": 1704700900                                            │
│  }                                                              │
│                                                                  │
│  ENTERPRISE OPTIONS:                                            │
│  ──────────────────                                              │
│  • SAML 2.0 (for enterprise SSO)                                │
│  • OAuth 2.0 / OIDC (Google, Microsoft)                         │
│  • MFA via TOTP or SMS                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Authorization Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION MODEL                           │
│                    (Hierarchical RBAC)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PLATFORM LEVEL                                                 │
│  ──────────────                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Platform Admin                                               ││
│  │ • Full system access                                         ││
│  │ • Partner management                                         ││
│  │ • Platform configuration                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  PARTNER LEVEL                                                  │
│  ─────────────                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Partner Admin                                                ││
│  │ • Manage own tenants only                                    ││
│  │ • Cannot access other partners                               ││
│  │ • Limited to allowed configurations                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  TENANT LEVEL                                                   │
│  ────────────                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tenant Admin        │ Tenant User         │ Auditor         ││
│  │ • Full tenant access│ • Role-based access │ • Read-only     ││
│  │ • User management   │ • Feature-specific  │ • Audit logs    ││
│  │ • Settings          │ • No admin functions│ • Reports       ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  SPECIAL ROLES                                                  │
│  ─────────────                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Regulator                                                    ││
│  │ • Read-only access to specified tenants                     ││
│  │ • All access logged with IP, timestamp, user-agent          ││
│  │ • Cannot modify any data                                     ││
│  │ • Export capabilities (with audit trail)                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Tenant Data Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ISOLATION LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LAYER 1: APPLICATION MIDDLEWARE                                │
│  ───────────────────────────────                                 │
│  • Every request must have x-tenant-id header                   │
│  • Middleware validates tenant exists and user has access       │
│  • Tenant context injected into request lifecycle               │
│                                                                  │
│  LAYER 2: SERVICE LAYER                                         │
│  ─────────────────────                                           │
│  • All queries automatically scoped to tenant                   │
│  • Cross-tenant queries require elevated permissions            │
│  • Service methods never expose raw tenant_id parameter         │
│                                                                  │
│  LAYER 3: DATABASE (RLS)                                        │
│  ───────────────────────                                         │
│  • Row-Level Security on all tenant tables                      │
│  • SET app.current_tenant before every query                    │
│  • Even direct DB access is tenant-scoped                       │
│                                                                  │
│  LAYER 4: OBJECT STORAGE                                        │
│  ───────────────────────                                         │
│  • Bucket policy: tenant can only access own prefix             │
│  • Path format: s3://bucket/{tenant_id}/{object_type}/{id}      │
│  • Pre-signed URLs scoped to tenant                             │
│                                                                  │
│  DEFENSE IN DEPTH:                                              │
│  ─────────────────                                               │
│  • Even if one layer fails, others prevent cross-tenant access │
│  • All cross-tenant access attempts logged                      │
│  • Automated alerts on suspicious patterns                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Audit Log Integrity

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIT LOG ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WHAT IS LOGGED:                                                │
│  ──────────────                                                  │
│  • All data modifications (create, update, soft-delete)        │
│  • All authentication events (login, logout, failed)           │
│  • All authorization checks (granted, denied)                  │
│  • All data exports                                             │
│  • All regulator access                                         │
│  • All configuration changes                                    │
│                                                                  │
│  LOG ENTRY SCHEMA:                                              │
│  ─────────────────                                               │
│  {                                                              │
│    "id": "uuid",                                                │
│    "timestamp": "2026-01-08T12:00:00Z",                         │
│    "tenant_id": "uuid",                                         │
│    "user_id": "uuid",                                           │
│    "action": "transaction.create",                              │
│    "resource_type": "transaction",                              │
│    "resource_id": "uuid",                                       │
│    "changes": { "before": {...}, "after": {...} },              │
│    "ip_address": "203.0.113.50",                                │
│    "user_agent": "Mozilla/5.0...",                              │
│    "session_id": "uuid",                                        │
│    "request_id": "uuid",                                        │
│    "hash": "sha256:..."      // Integrity hash                  │
│  }                                                              │
│                                                                  │
│  IMMUTABILITY ENFORCEMENT:                                      │
│  ─────────────────────────                                       │
│  1. Database: APPEND-ONLY table (no UPDATE/DELETE)             │
│  2. Storage: S3 Object Lock (WORM compliance)                  │
│  3. Replication: Cross-region for disaster recovery            │
│  4. Hashing: Each entry hashed, chain integrity                │
│  5. Monitoring: Alerts on any modification attempt             │
│                                                                  │
│  RETENTION:                                                     │
│  ──────────                                                      │
│  • Minimum: 7 years (regulatory requirement)                   │
│  • Hot storage: 1 year                                          │
│  • Cold storage: 6+ years (Glacier/Archive)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 Regulator Access Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGULATOR ACCESS FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Access Request                                         │
│  ──────────────────────                                          │
│  • Regulator submits formal request (portal or API)            │
│  • Request specifies: tenant, date range, data scope           │
│  • Request logged with timestamp                                │
│                                                                  │
│  STEP 2: Tenant Notification                                    │
│  ──────────────────────────                                      │
│  • Tenant notified of regulator access request                 │
│  • Tenant can view but NOT block (regulatory requirement)      │
│  • Transparency preserved                                       │
│                                                                  │
│  STEP 3: Access Granted                                         │
│  ────────────────────                                            │
│  • Regulator receives time-limited credentials                 │
│  • Credentials scoped to requested data only                   │
│  • Read-only access enforced at all layers                     │
│                                                                  │
│  STEP 4: Session Logging                                        │
│  ───────────────────────                                         │
│  • Every action logged: views, searches, exports               │
│  • IP address, user-agent, timestamps                          │
│  • Data accessed (not content, but references)                 │
│                                                                  │
│  STEP 5: Session Termination                                    │
│  ──────────────────────────                                      │
│  • Automatic expiry after time limit                           │
│  • Access revoked                                               │
│  • Comprehensive session report generated                      │
│  • Tenant receives access summary                              │
│                                                                  │
│  SAFEGUARDS:                                                    │
│  ───────────                                                     │
│  ❌ Regulators CANNOT modify data                               │
│  ❌ Regulators CANNOT delete records                            │
│  ❌ Regulators CANNOT access unscoped tenants                   │
│  ✅ All regulator actions are logged                           │
│  ✅ Tenants maintain visibility                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.6 Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY PLAN                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OBJECTIVES:                                                    │
│  ───────────                                                     │
│  • RTO (Recovery Time Objective): 1 hour                       │
│  • RPO (Recovery Point Objective): 5 minutes                   │
│                                                                  │
│  BACKUP STRATEGY:                                               │
│  ────────────────                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Database                                                     ││
│  │ • Continuous WAL archiving (5-min intervals)                ││
│  │ • Daily full snapshots                                       ││
│  │ • Cross-region replication (Lagos ↔ Johannesburg)           ││
│  │ • 30-day retention                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Object Storage                                               ││
│  │ • Cross-region replication enabled                          ││
│  │ • Versioning enabled                                         ││
│  │ • Lifecycle policies for cost optimization                  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Configuration                                                ││
│  │ • Infrastructure as Code (Terraform)                        ││
│  │ • Git-versioned configuration                                ││
│  │ • Secrets backed up to secondary vault                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  FAILOVER PROCEDURE:                                            │
│  ───────────────────                                             │
│  1. Detection: Automated health checks (30s intervals)         │
│  2. Alert: PagerDuty notification to on-call                   │
│  3. Assessment: Confirm outage scope (partial/full)            │
│  4. Decision: Failover if primary > 15 min unavailable         │
│  5. Execution: DNS switch to secondary region                  │
│  6. Verification: Smoke tests on failover environment          │
│  7. Communication: Status page update, customer notification   │
│                                                                  │
│  TESTING:                                                       │
│  ────────                                                        │
│  • DR drill: Quarterly                                          │
│  • Backup restore test: Monthly                                 │
│  • Failover test: Bi-annually                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Risks & Mitigations

### 8.1 Technical Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Vercel outage** | High | Low | Backend independent, static fallback, CDN caching |
| **Database corruption** | Critical | Very Low | Multi-AZ, point-in-time recovery, cross-region replicas |
| **DDoS attack** | High | Medium | Cloudflare protection, rate limiting, auto-scaling |
| **Tenant data leak** | Critical | Low | RLS, defense-in-depth, regular penetration testing |
| **Certificate expiry** | Medium | Low | Auto-renewal via Cloudflare, monitoring alerts |
| **Cold start latency** | Low | Medium | Keep-alive pings, provisioned concurrency |

### 8.2 Operational Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Vendor lock-in (Vercel)** | Medium | Medium | Backend fully portable, frontend migration path documented |
| **Cost overrun** | Medium | Medium | Budget alerts, reserved capacity, usage monitoring |
| **Skills shortage** | Medium | Medium | Documentation, cross-training, managed services preference |
| **Configuration drift** | Low | Medium | Infrastructure as Code, GitOps, drift detection |

### 8.3 Compliance Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Data residency violation** | Critical | Low | Region-locked deployments, data classification |
| **Audit log tampering** | Critical | Very Low | WORM storage, integrity hashing, access monitoring |
| **GDPR/NDPR breach** | High | Low | Data minimization, consent tracking, DPO appointed |
| **Regulatory access failure** | High | Low | Documented procedures, tested quarterly |

### 8.4 Business Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Partner misuse** | Medium | Medium | Strong agreements, monitoring, immediate suspension capability |
| **Demo data in production** | High | Low | Strict environment separation, data classification |
| **FREEZE violation** | Critical | Very Low | Automated CI checks, code review gates, audit logging |

---

## 9. Clear Recommendation & Rationale

### 9.1 Primary Recommendation

**HYBRID ARCHITECTURE: Vercel (Frontend) + AWS/GCP (Backend)**

### 9.2 Rationale

| Factor | Why Hybrid Wins |
|--------|-----------------|
| **Governance Control** | Full infrastructure control for FREEZE enforcement |
| **Data Residency** | African data stays in Africa (Lagos, Johannesburg) |
| **Compliance** | Enterprise-grade audit, logging, and access controls |
| **Scalability** | Independent scaling of frontend and backend |
| **Cost Predictability** | Reserved instances + committed use discounts |
| **Developer Experience** | Vercel's excellent DX + Kubernetes power |
| **Partner Enablement** | Self-service within governed boundaries |

### 9.3 Implementation Priority

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PHASES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: FOUNDATION (Weeks 1-4)                                │
│  ─────────────────────────────────                               │
│  • Cloud account setup (AWS/GCP)                                │
│  • Kubernetes cluster provisioning                              │
│  • Database migration from Emergent                             │
│  • CI/CD pipeline establishment                                 │
│  • Monitoring and alerting setup                                │
│                                                                  │
│  PHASE 2: CORE DEPLOYMENT (Weeks 5-8)                           │
│  ───────────────────────────────────                             │
│  • Backend services deployment                                  │
│  • Vercel production configuration                              │
│  • Custom domain setup                                          │
│  • SSL/TLS automation                                           │
│  • Security hardening                                           │
│                                                                  │
│  PHASE 3: MULTI-TENANCY (Weeks 9-12)                            │
│  ────────────────────────────────────                            │
│  • Tenant resolution middleware                                 │
│  • Row-level security implementation                            │
│  • Partner dashboard development                                │
│  • Demo environment setup                                       │
│  • White-label theming system                                   │
│                                                                  │
│  PHASE 4: HARDENING (Weeks 13-16)                               │
│  ────────────────────────────────                                │
│  • Penetration testing                                          │
│  • DR drill execution                                           │
│  • Performance optimization                                     │
│  • Documentation completion                                     │
│  • Partner onboarding pilot                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Cost Estimate (Monthly)

| Component | Estimated Cost | Notes |
|-----------|----------------|-------|
| Vercel (Pro) | $20/user | ~$200/mo for team |
| AWS EKS | $73/cluster | + node costs |
| EC2/Compute | $500-2000 | Depends on scale |
| RDS PostgreSQL | $200-800 | Multi-AZ |
| S3 + CloudFront | $100-500 | Storage + CDN |
| Cloudflare (Business) | $200 | WAF, DDoS, SSL |
| Monitoring (Datadog) | $200-500 | APM, logs |
| **Total (Estimated)** | **$1,500 - $4,500** | Initial scale |

*Note: Costs scale with tenants and traffic. Reserved instances can reduce compute costs by 30-50%.*

---

## 10. Open Questions / Decisions Required

### 10.1 Strategic Decisions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **Primary Cloud Provider** | AWS / GCP / Azure | AWS (stronger African presence) |
| 2 | **African Region Priority** | Lagos / Johannesburg / Nairobi | Lagos primary, Johannesburg secondary |
| 3 | **Partner Billing Model** | Revenue share / Per-tenant / Hybrid | Per-tenant with volume discounts |
| 4 | **Enterprise Tier Isolation** | Shared / Dedicated database | Dedicated for enterprise (optional) |

### 10.2 Technical Decisions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 5 | **Kubernetes Flavor** | EKS / GKE / Self-managed | EKS (AWS-native) |
| 6 | **Database** | Supabase / RDS / Cloud SQL | RDS PostgreSQL (control + compliance) |
| 7 | **Secrets Management** | AWS Secrets Manager / Vault | AWS Secrets Manager (simpler) |
| 8 | **Monitoring Stack** | Datadog / Grafana Cloud / CloudWatch | Datadog (unified) |

### 10.3 Operational Decisions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 9 | **On-Call Model** | Internal / Managed / Hybrid | Hybrid (internal + managed NOC) |
| 10 | **Support Tiers** | Standard / Premium / Enterprise | All three with SLA differentiation |
| 11 | **DR Secondary Region** | Johannesburg / Mumbai / London | Johannesburg (African presence) |

### 10.4 Compliance Decisions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 12 | **Data Classification** | By tenant / By data type / Both | Both (defense in depth) |
| 13 | **Audit Log Retention** | 7 years / 10 years / Configurable | 7 years (regulatory minimum) |
| 14 | **Penetration Testing** | Annual / Bi-annual / Continuous | Bi-annual + continuous scanning |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | E1 Agent | Initial strategic document |

---

**END OF DOCUMENT**

*This document is a strategic recommendation only. No implementation has been performed.*
