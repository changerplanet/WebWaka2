# Partner Governance, Rights & Pricing Control System

## DESIGN REVIEW DOCUMENT

**Version:** 1.0  
**Date:** January 9, 2026  
**Status:** AWAITING APPROVAL  
**Phase:** Stop Point 1 — Design Review

---

## Executive Summary

This document presents the complete design for the Partner Governance, Rights & Pricing Control System. It covers data models, permission architecture, pricing configuration, UI flows, and audit mechanisms.

**Core Principle:** Pricing is governance, not math. Permissions precede features.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Models](#2-data-models)
3. [Permission Matrix](#3-permission-matrix)
4. [Pricing Model Engine](#4-pricing-model-engine)
5. [UI Routes & Flows](#5-ui-routes--flows)
6. [Audit System](#6-audit-system)
7. [What This System Does NOT Do](#7-what-this-system-does-not-do)
8. [Implementation Plan](#8-implementation-plan)

---

## 1. Architecture Overview

### System Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN CONTROL PLANE                            │
│                            /admin/partners/*                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Partner      │  │ Pricing      │  │ Rights &     │  │ Assignment   │    │
│  │ Management   │  │ Models       │  │ Privileges   │  │ Engine       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Grants permissions
                                    │ Assigns pricing
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PARTNER ADMIN PORTAL                                 │
│                     /partners/admin/* (permission-gated)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Client       │  │ Client       │  │ Trial        │  │ Pricing      │    │
│  │ Management   │  │ Pricing      │  │ Management   │  │ Facts View   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Emits pricing facts
                                    │ (NO BILLING)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUDIT LAYER                                       │
│                     (Append-only, all actions logged)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Config-based, not database | Maintains schema lock; extensible without migration |
| Capability matrix, not roles | Granular control; avoids role explosion |
| Pricing facts, not billing | Commerce Boundary compliance |
| Append-only changes | Audit integrity; version history |
| Permission-gated UI | No self-service escalation |

---

## 2. Data Models

### 2.1 Partner Type

```typescript
interface PartnerType {
  id: string                    // e.g., "reseller", "system-integrator"
  name: string                  // e.g., "Reseller"
  description: string
  defaultCapabilities: PartnerCapabilities
  allowedCategories: string[]   // Which categories can be assigned
  createdAt: string             // ISO timestamp
  createdBy: string             // Super Admin ID
}

// Predefined Types
const PARTNER_TYPES: PartnerType[] = [
  {
    id: "reseller",
    name: "Reseller",
    description: "Partners who resell WebWaka to their clients",
    defaultCapabilities: { canCreateClients: true, canAssignPricing: true, ... },
    allowedCategories: ["standard", "strategic"],
  },
  {
    id: "system-integrator",
    name: "System Integrator",
    description: "Partners who integrate WebWaka into larger solutions",
    defaultCapabilities: { canCreateClients: true, canCreatePricingModels: true, ... },
    allowedCategories: ["strategic", "pilot"],
  },
  {
    id: "government-partner",
    name: "Government Partner",
    description: "Partners serving government/civic entities",
    defaultCapabilities: { canCreateClients: true, canAssignPricing: false, ... },
    allowedCategories: ["strategic", "restricted"],
  },
  {
    id: "faith-partner",
    name: "Faith Partner",
    description: "Partners serving religious organizations",
    defaultCapabilities: { canCreateClients: true, canOfferTrials: true, ... },
    allowedCategories: ["standard", "pilot"],
  },
]
```

### 2.2 Partner Category

```typescript
interface PartnerCategory {
  id: string                    // e.g., "strategic", "standard"
  name: string                  // e.g., "Strategic Partner"
  description: string
  tier: number                  // 1 = highest priority
  capabilityOverrides?: Partial<PartnerCapabilities>
  pricingOverrides?: {
    maxDiscountPercent: number
    canNegotiateCustom: boolean
  }
  createdAt: string
  createdBy: string
}

// Predefined Categories
const PARTNER_CATEGORIES: PartnerCategory[] = [
  {
    id: "strategic",
    name: "Strategic Partner",
    description: "High-value, long-term partnership",
    tier: 1,
    capabilityOverrides: { canCreatePricingModels: true, maxTrialDays: 90 },
    pricingOverrides: { maxDiscountPercent: 30, canNegotiateCustom: true },
  },
  {
    id: "standard",
    name: "Standard Partner",
    description: "Standard partnership terms",
    tier: 2,
    pricingOverrides: { maxDiscountPercent: 15, canNegotiateCustom: false },
  },
  {
    id: "pilot",
    name: "Pilot Partner",
    description: "Evaluation/pilot partnership",
    tier: 3,
    capabilityOverrides: { maxTrialDays: 14 },
    pricingOverrides: { maxDiscountPercent: 0, canNegotiateCustom: false },
  },
  {
    id: "restricted",
    name: "Restricted Partner",
    description: "Limited capabilities pending review",
    tier: 4,
    capabilityOverrides: { canCreateClients: false, canAssignPricing: false },
    pricingOverrides: { maxDiscountPercent: 0, canNegotiateCustom: false },
  },
]
```

### 2.3 Partner Capabilities (Rights & Privileges)

```typescript
interface PartnerCapabilities {
  // Client Management
  canCreateClients: boolean
  canSuspendClients: boolean
  maxClients: number | null     // null = unlimited
  
  // Pricing Control
  canAssignPricing: boolean
  canCreatePricingModels: boolean
  canApplyDiscounts: boolean
  maxDiscountPercent: number
  
  // Trial Management
  canOfferTrials: boolean
  maxTrialDays: number
  maxConcurrentTrials: number | null
  
  // Domain Management
  canManageDomains: boolean
  maxDomains: number | null
  
  // Suite Access
  allowedSuites: string[]       // e.g., ["commerce", "education", "health"]
  restrictedSuites: string[]    // Explicitly denied
  
  // Administrative
  canViewPricingFacts: boolean
  canExportReports: boolean
  
  // Timestamps
  effectiveFrom: string
  effectiveUntil: string | null // null = indefinite
}

// Default capabilities (baseline)
const DEFAULT_PARTNER_CAPABILITIES: PartnerCapabilities = {
  canCreateClients: false,
  canSuspendClients: false,
  maxClients: 0,
  canAssignPricing: false,
  canCreatePricingModels: false,
  canApplyDiscounts: false,
  maxDiscountPercent: 0,
  canOfferTrials: false,
  maxTrialDays: 0,
  maxConcurrentTrials: 0,
  canManageDomains: false,
  maxDomains: 0,
  allowedSuites: [],
  restrictedSuites: [],
  canViewPricingFacts: false,
  canExportReports: false,
  effectiveFrom: new Date().toISOString(),
  effectiveUntil: null,
}
```

### 2.4 Pricing Model

```typescript
type PricingModelType = 
  | "flat"           // Fixed price per period
  | "per-suite"      // Price varies by suite
  | "per-seat"       // Price by user count (fact only)
  | "tiered"         // Volume-based tiers
  | "custom"         // Negotiated custom terms

interface PricingModel {
  id: string
  name: string
  description: string
  type: PricingModelType
  
  // Model-specific configuration
  config: PricingModelConfig
  
  // Metadata
  currency: string            // e.g., "NGN", "USD"
  billingPeriod: "monthly" | "quarterly" | "annually"
  isActive: boolean
  
  // Versioning (append-only)
  version: number
  previousVersionId: string | null
  
  // Governance
  createdAt: string
  createdBy: string
  approvedAt: string | null
  approvedBy: string | null
}

// Config varies by type
type PricingModelConfig = 
  | FlatPricingConfig
  | PerSuitePricingConfig
  | PerSeatPricingConfig
  | TieredPricingConfig
  | CustomPricingConfig

interface FlatPricingConfig {
  type: "flat"
  basePrice: number           // e.g., 50000 (NGN)
  includedSuites: string[]
}

interface PerSuitePricingConfig {
  type: "per-suite"
  suitePrices: Record<string, number>  // e.g., { "commerce": 30000, "education": 25000 }
}

interface PerSeatPricingConfig {
  type: "per-seat"
  pricePerSeat: number
  minSeats: number
  maxSeats: number | null
  includedSuites: string[]
}

interface TieredPricingConfig {
  type: "tiered"
  tiers: Array<{
    minUnits: number
    maxUnits: number | null
    pricePerUnit: number
  }>
  unitType: "clients" | "seats" | "transactions"
}

interface CustomPricingConfig {
  type: "custom"
  terms: string               // Free-form negotiated terms
  customFields: Record<string, unknown>
}
```

### 2.5 Pricing Assignment

```typescript
interface PricingAssignment {
  id: string
  
  // Target (one of these)
  targetType: "partner" | "partner-group" | "client"
  targetId: string
  
  // Pricing Model Reference
  pricingModelId: string
  
  // Override/customization
  overrides?: {
    discountPercent?: number
    customPrice?: number
    additionalTerms?: string
  }
  
  // Validity
  effectiveFrom: string
  effectiveUntil: string | null
  
  // Status
  status: "active" | "suspended" | "expired"
  
  // Governance
  assignedAt: string
  assignedBy: string
  approvalRequired: boolean
  approvedAt: string | null
  approvedBy: string | null
}
```

### 2.6 Trial Grant

```typescript
interface TrialGrant {
  id: string
  
  // Target
  clientId: string
  partnerId: string           // Who granted the trial
  
  // Trial Configuration
  allowedSuites: string[]
  maxUsers: number | null
  
  // Duration
  startDate: string
  endDate: string
  durationDays: number
  
  // Expiry Behavior
  expiryAction: "suspend" | "convert-to-paid" | "notify-only"
  expiryNotificationDays: number[]  // e.g., [7, 3, 1]
  
  // Status
  status: "pending" | "active" | "expired" | "converted" | "cancelled"
  
  // Governance
  createdAt: string
  createdBy: string
}
```

### 2.7 Partner Entitlement

```typescript
interface PartnerEntitlement {
  partnerId: string
  
  // Resolved capabilities (computed)
  effectiveCapabilities: PartnerCapabilities
  
  // Pricing models available to assign
  availablePricingModels: string[]
  
  // Current assignments
  currentPricingAssignment: PricingAssignment | null
  
  // Client summary
  clientCount: number
  activeTrialCount: number
  
  // Computed timestamps
  computedAt: string
}
```

### 2.8 Client Entitlement

```typescript
interface ClientEntitlement {
  clientId: string
  partnerId: string
  
  // Resolved entitlements
  activeSuites: string[]
  pricingFacts: PricingFact[]
  
  // Trial status
  activeTrial: TrialGrant | null
  
  // Status
  status: "active" | "trial" | "suspended" | "expired"
  
  // Computed timestamps
  computedAt: string
}
```

### 2.9 Pricing Fact (Emitted, NOT Billed)

```typescript
interface PricingFact {
  id: string
  
  // Context
  partnerId: string
  clientId: string
  
  // Fact details
  factType: "subscription" | "seat-count" | "usage" | "trial-start" | "trial-end"
  period: {
    start: string
    end: string
  }
  
  // Values (facts only, no billing)
  pricingModelId: string
  computedAmount: number      // What WOULD be charged (fact)
  currency: string
  
  // Breakdown
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  
  // Governance
  emittedAt: string
  emittedBy: string           // System or partner
  
  // Explicit marker
  _billingStatus: "FACT_ONLY_NOT_BILLED"
}
```

---

## 3. Permission Matrix

### 3.1 Super Admin vs Partner Admin

| Action | Super Admin | Partner Admin (with permission) |
|--------|-------------|--------------------------------|
| **Partner Management** | | |
| Create partner types | ✓ | ✗ |
| Create partner categories | ✓ | ✗ |
| Create/edit partner | ✓ | ✗ |
| Assign partner type/category | ✓ | ✗ |
| Grant/revoke capabilities | ✓ | ✗ |
| View all partners | ✓ | ✗ |
| **Pricing Models** | | |
| Create global pricing models | ✓ | ✗ |
| Edit global pricing models | ✓ | ✗ |
| Create client-level pricing | ✓ | ✓ (if `canCreatePricingModels`) |
| Assign pricing to partner | ✓ | ✗ |
| Assign pricing to client | ✓ | ✓ (if `canAssignPricing`) |
| Apply discounts | ✓ | ✓ (up to `maxDiscountPercent`) |
| **Client Management** | | |
| Create clients | ✓ | ✓ (if `canCreateClients`) |
| Suspend clients | ✓ | ✓ (if `canSuspendClients`) |
| View own clients | ✓ | ✓ |
| View other partners' clients | ✓ | ✗ |
| **Trial Management** | | |
| Grant trial to any client | ✓ | ✗ |
| Grant trial to own clients | ✓ | ✓ (if `canOfferTrials`) |
| Set trial duration | ✓ | ✓ (up to `maxTrialDays`) |
| Cancel trial | ✓ | ✓ (own clients) |
| **Audit & Reporting** | | |
| View all audit logs | ✓ | ✗ |
| View own audit logs | ✓ | ✓ |
| View pricing facts | ✓ | ✓ (if `canViewPricingFacts`) |
| Export reports | ✓ | ✓ (if `canExportReports`) |

### 3.2 Capability Resolution Logic

```typescript
function resolvePartnerCapabilities(
  partner: Partner,
  partnerType: PartnerType,
  partnerCategory: PartnerCategory
): PartnerCapabilities {
  // Start with defaults
  let capabilities = { ...DEFAULT_PARTNER_CAPABILITIES }
  
  // Apply type defaults
  capabilities = { ...capabilities, ...partnerType.defaultCapabilities }
  
  // Apply category overrides (higher priority)
  if (partnerCategory.capabilityOverrides) {
    capabilities = { ...capabilities, ...partnerCategory.capabilityOverrides }
  }
  
  // Apply partner-specific overrides (highest priority)
  if (partner.capabilityOverrides) {
    capabilities = { ...capabilities, ...partner.capabilityOverrides }
  }
  
  return capabilities
}
```

### 3.3 Permission Check Flow

```
Request to perform action
         │
         ▼
┌─────────────────────────┐
│ Is user Super Admin?    │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │ Yes         │ No
     ▼             ▼
  Allow     ┌─────────────────────────┐
            │ Resolve partner         │
            │ capabilities            │
            └───────────┬─────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │ Check action against    │
            │ capability matrix       │
            └───────────┬─────────────┘
                        │
                ┌───────┴───────┐
                │ Has permission │
                ▼               ▼
              Allow           Deny
                │               │
                ▼               ▼
           Log audit       Return 403
           record          with reason
```

---

## 4. Pricing Model Engine

### 4.1 Model Creation Flow

```
Super Admin creates pricing model
         │
         ▼
┌─────────────────────────┐
│ Validate configuration  │
│ (type-specific rules)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Assign version 1        │
│ Set status: draft       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Review & approve        │
│ (governance step)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Set status: active      │
│ Model is now assignable │
└─────────────────────────┘
```

### 4.2 Pricing Assignment Flow

```
Assign pricing to target (partner/client)
         │
         ▼
┌─────────────────────────┐
│ Check assignor          │
│ permissions             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validate target exists  │
│ and is assignable       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Check discount limits   │
│ (if applicable)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Create assignment       │
│ record (append-only)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Emit pricing fact       │
│ (NOT billing)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Log audit event         │
└─────────────────────────┘
```

### 4.3 Trial Grant Flow

```
Partner grants trial to client
         │
         ▼
┌─────────────────────────┐
│ Check partner has       │
│ canOfferTrials = true   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Check trial duration    │
│ ≤ maxTrialDays          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Check concurrent trials │
│ ≤ maxConcurrentTrials   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validate allowed suites │
│ (partner's allowedSuites)│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Create trial grant      │
│ Status: active          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Emit trial-start fact   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Log audit event         │
└─────────────────────────┘
```

### 4.4 Fact Emission (NOT Billing)

```typescript
function emitPricingFact(
  partnerId: string,
  clientId: string,
  pricingAssignment: PricingAssignment,
  period: { start: string; end: string }
): PricingFact {
  const model = getPricingModel(pricingAssignment.pricingModelId)
  
  // Compute what WOULD be charged (fact only)
  const lineItems = computeLineItems(model, pricingAssignment)
  const computedAmount = lineItems.reduce((sum, item) => sum + item.amount, 0)
  
  const fact: PricingFact = {
    id: generateId(),
    partnerId,
    clientId,
    factType: "subscription",
    period,
    pricingModelId: model.id,
    computedAmount,
    currency: model.currency,
    lineItems,
    emittedAt: new Date().toISOString(),
    emittedBy: "system",
    
    // CRITICAL: Explicit marker
    _billingStatus: "FACT_ONLY_NOT_BILLED",
  }
  
  // Append to facts store (read-only after creation)
  appendPricingFact(fact)
  
  // Log audit event
  logAuditEvent({
    action: "pricing.fact.emitted",
    targetId: fact.id,
    metadata: { partnerId, clientId, computedAmount },
  })
  
  return fact
}
```

---

## 5. UI Routes & Flows

### 5.1 Super Admin Routes

| Route | Purpose |
|-------|---------|
| `/admin/partners` | Partner management dashboard |
| `/admin/partners/types` | Manage partner types |
| `/admin/partners/categories` | Manage partner categories |
| `/admin/partners/[id]` | Single partner detail/edit |
| `/admin/partners/[id]/capabilities` | Partner capability management |
| `/admin/pricing` | Pricing model management |
| `/admin/pricing/models` | List/create pricing models |
| `/admin/pricing/models/[id]` | Single model detail |
| `/admin/pricing/assignments` | View all assignments |
| `/admin/audit` | Audit log viewer |

### 5.2 Partner Admin Routes (Permission-Gated)

| Route | Required Capability | Purpose |
|-------|---------------------|---------|
| `/partners/admin` | (base access) | Partner dashboard |
| `/partners/admin/clients` | `canCreateClients` | Client management |
| `/partners/admin/clients/[id]` | (base access) | Client detail |
| `/partners/admin/pricing` | `canAssignPricing` | Client pricing |
| `/partners/admin/pricing/assign` | `canAssignPricing` | Assign pricing |
| `/partners/admin/trials` | `canOfferTrials` | Trial management |
| `/partners/admin/trials/new` | `canOfferTrials` | Create trial |
| `/partners/admin/facts` | `canViewPricingFacts` | View pricing facts |

### 5.3 Super Admin UI - Partner Management

```
/admin/partners
┌─────────────────────────────────────────────────────────────────────────┐
│ Partner Management                                    [+ Create Partner] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Filters: [Type ▼] [Category ▼] [Status ▼]              [Search...] │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Partner          │ Type           │ Category  │ Clients │ Status   │ │
│ ├───────────────────┼────────────────┼───────────┼─────────┼──────────┤ │
│ │ Acme Solutions   │ Reseller       │ Strategic │ 24      │ Active   │ │
│ │ GovTech Partners │ Govt Partner   │ Strategic │ 12      │ Active   │ │
│ │ Faith First      │ Faith Partner  │ Standard  │ 8       │ Active   │ │
│ │ NewCo Pilot      │ Reseller       │ Pilot     │ 2       │ Trial    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Super Admin UI - Capability Assignment

```
/admin/partners/[id]/capabilities
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Partners                                                       │
│                                                                          │
│ Acme Solutions - Capabilities                                            │
│ Type: Reseller │ Category: Strategic                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ CLIENT MANAGEMENT                                                    │ │
│ │                                                                      │ │
│ │ Can create clients          [✓]                                     │ │
│ │ Can suspend clients         [✓]                                     │ │
│ │ Max clients                 [ 50 ] (null = unlimited)               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ PRICING CONTROL                                                      │ │
│ │                                                                      │ │
│ │ Can assign pricing          [✓]                                     │ │
│ │ Can create pricing models   [ ]                                     │ │
│ │ Can apply discounts         [✓]                                     │ │
│ │ Max discount %              [ 20 ]                                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ TRIAL MANAGEMENT                                                     │ │
│ │                                                                      │ │
│ │ Can offer trials            [✓]                                     │ │
│ │ Max trial days              [ 30 ]                                  │ │
│ │ Max concurrent trials       [ 5 ]                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ SUITE ACCESS                                                         │ │
│ │                                                                      │ │
│ │ Allowed suites:                                                      │ │
│ │ [✓] Commerce  [✓] Education  [✓] Health  [ ] Political  [ ] Church │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                        [Cancel] [Save Capabilities]      │
│                                                                          │
│ ⚠️ Changes take effect immediately and are logged.                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Partner Admin UI - Client Pricing

```
/partners/admin/pricing
┌─────────────────────────────────────────────────────────────────────────┐
│ Client Pricing                                              [Read-Only] │
│                                                                          │
│ ⓘ You can assign pricing within your granted permissions.               │
│   Max discount: 20% │ Available models: 3                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Client              │ Current Plan    │ Amount    │ Status │ Action │ │
│ ├─────────────────────┼─────────────────┼───────────┼────────┼────────┤ │
│ │ Lagos Retail Co.    │ Per-Suite       │ ₦45,000   │ Active │ [Edit] │ │
│ │ Ibadan School       │ Flat            │ ₦50,000   │ Active │ [Edit] │ │
│ │ Abuja Health Clinic │ —               │ —         │ Trial  │ [Set]  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ⚠️ Pricing shown is FACT ONLY. No billing is executed by this system.   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Partner Admin UI - Trial Management

```
/partners/admin/trials
┌─────────────────────────────────────────────────────────────────────────┐
│ Trial Management                                          [+ New Trial] │
│                                                                          │
│ ⓘ You can grant trials up to 30 days. Max 5 concurrent.                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Active Trials: 3 / 5                                                     │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Client              │ Suites              │ Ends      │ Action      │ │
│ ├─────────────────────┼─────────────────────┼───────────┼─────────────┤ │
│ │ Test Corp           │ Commerce, Education │ Jan 20    │ [Cancel]    │ │
│ │ Demo Health Ltd     │ Health              │ Jan 25    │ [Cancel]    │ │
│ │ NewSchool           │ Education           │ Feb 1     │ [Cancel]    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ Expired Trials (last 30 days): 2                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Audit System

### 6.1 Audit Event Structure

```typescript
interface PartnerGovernanceAuditEvent {
  id: string
  timestamp: string
  
  // Actor
  actorId: string
  actorType: "super-admin" | "partner-admin" | "system"
  actorEmail: string
  
  // Action
  action: PartnerGovernanceAction
  
  // Scope
  scope: {
    partnerId?: string
    clientId?: string
    pricingModelId?: string
    trialId?: string
  }
  
  // Change details
  changeType: "create" | "update" | "assign" | "revoke" | "emit"
  previousValue?: unknown
  newValue?: unknown
  
  // Context
  reason?: string
  ipAddress?: string
  sessionId?: string
}

type PartnerGovernanceAction =
  // Partner management
  | "partner.created"
  | "partner.updated"
  | "partner.type.assigned"
  | "partner.category.assigned"
  | "partner.capabilities.updated"
  | "partner.suspended"
  | "partner.reactivated"
  
  // Pricing models
  | "pricing-model.created"
  | "pricing-model.updated"
  | "pricing-model.activated"
  | "pricing-model.deactivated"
  
  // Pricing assignments
  | "pricing.assigned"
  | "pricing.discount.applied"
  | "pricing.assignment.revoked"
  
  // Trial management
  | "trial.granted"
  | "trial.extended"
  | "trial.cancelled"
  | "trial.expired"
  | "trial.converted"
  
  // Client management
  | "client.created"
  | "client.updated"
  | "client.suspended"
  | "client.reactivated"
  
  // Facts
  | "pricing.fact.emitted"
```

### 6.2 Audit Integration Points

| Component | Events Logged |
|-----------|--------------|
| Partner Management | Create, update, type/category assign, suspend, reactivate |
| Capability System | Capability grants, revocations, updates |
| Pricing Models | Create, update, activate, deactivate |
| Pricing Assignments | Assign, discount, revoke |
| Trial Management | Grant, extend, cancel, expire, convert |
| Client Management | Create, update, suspend, reactivate |
| Pricing Facts | All fact emissions |

### 6.3 Audit Visibility

| Viewer | Can See |
|--------|---------|
| Super Admin | All audit events |
| Partner Admin | Own partner's events only |
| Regulator Portal | Anonymized summary statistics |

---

## 7. What This System Does NOT Do

### Explicitly NOT Implemented

| Capability | Reason |
|------------|--------|
| Payment processing | Commerce Boundary |
| Invoice generation | Commerce Boundary |
| Wallet management | Commerce Boundary |
| Balance tracking | Commerce Boundary |
| Auto-billing | Commerce Boundary |
| Collection/dunning | Commerce Boundary |
| Tax calculation | Commerce Boundary (facts only) |
| Currency conversion | Commerce Boundary |

### Explicit Boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHAT THIS SYSTEM DOES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Define pricing models (configuration)                                  │
│ ✓ Assign pricing to partners/clients (governance)                        │
│ ✓ Grant and manage trials (time-bound entitlements)                     │
│ ✓ Emit pricing facts (what WOULD be charged)                            │
│ ✓ Control partner rights and privileges (permissions)                   │
│ ✓ Audit all actions (governance trail)                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    WHAT THIS SYSTEM DOES NOT DO                          │
├─────────────────────────────────────────────────────────────────────────┤
│ ✗ Charge money                                                           │
│ ✗ Generate invoices                                                      │
│ ✗ Manage payment methods                                                 │
│ ✗ Track account balances                                                 │
│ ✗ Process refunds                                                        │
│ ✗ Collect payments                                                       │
│ ✗ Calculate taxes                                                        │
│ ✗ Handle currency                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Plan

### Phase 1: Core Data Models & Registry (Config-Based)
- Partner types registry
- Partner categories registry
- Capabilities schema
- Pricing models schema
- No database changes

### Phase 2: Super Admin Control Plane UI
- Partner management dashboard
- Partner type/category management
- Capability assignment UI
- Pricing model creation UI
- Assignment management

### Phase 3: Partner Admin Portal UI
- Permission-gated dashboard
- Client management (if permitted)
- Pricing assignment (if permitted)
- Trial management (if permitted)
- Pricing facts view

### Phase 4: Audit & Governance
- Audit event logging
- Audit viewer for Super Admin
- Regulator portal integration
- Documentation

### Phase 5: Final Review & Lock
- Full testing
- Documentation finalization
- Governance report

---

## Approval Request

This design document requires explicit approval before implementation begins.

**Questions for Approval:**

1. **Data Models:** Are the proposed data structures acceptable? Any concerns about complexity or missing fields?

2. **Permission Matrix:** Is the capability-based approach acceptable vs. role-based? Are the permission boundaries correct?

3. **Pricing Models:** Are the proposed model types (flat, per-suite, per-seat, tiered, custom) sufficient?

4. **UI Routes:** Are the proposed routes acceptable? Any concerns about the admin/partner separation?

5. **Commerce Boundary:** Is the "facts only, no billing" approach clearly delineated?

6. **Implementation Order:** Is the proposed phasing acceptable?

---

**AWAITING APPROVAL TO PROCEED TO IMPLEMENTATION**
