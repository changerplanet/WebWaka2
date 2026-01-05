# Prisma Schema Naming Conventions

## Overview

This document establishes the naming conventions for Prisma models in the WebWaka platform.
These conventions are enforced by the automated schema validation script.

**Last Updated:** January 5, 2026
**Status:** FROZEN - Do not modify model names without explicit approval

---

## Current Naming Patterns

The WebWaka Prisma schema uses **two distinct naming patterns** based on when features were added:

### Pattern 1: PascalCase (Core Models)
Used for foundational platform models created during Phase 0-2.

**Examples:**
- `User`, `Tenant`, `Session`, `Partner`
- `TenantMembership`, `PartnerUser`, `PlatformInstance`
- `Subscription`, `SubscriptionPlan`, `Invoice`

**Prisma Client Access:**
```typescript
prisma.user.findMany()
prisma.tenant.findUnique()
prisma.tenantMembership.create()
```

### Pattern 2: snake_case (Extension Models)
Used for modular extension tables added during Phase 3-4.

**Examples:**
- `partner_attributions_ext`, `partner_commission_records_ext`
- `core_capabilities`, `core_tenant_capability_activations`
- `analytics_dashboards`, `billing_configurations`
- `pay_payment_transactions`, `inv_stock_movements`

**Prisma Client Access:**
```typescript
prisma.partner_attributions_ext.findMany()
prisma.core_capabilities.findUnique()
prisma.pay_payment_transactions.create()
```

---

## Module Prefixes

Extension models use prefixes to indicate their module:

| Prefix | Module |
|--------|--------|
| `partner_` | Partner & Reseller Platform |
| `core_` | Core Capabilities Framework |
| `analytics_` | Analytics & Reporting |
| `billing_` | Billing & Subscriptions |
| `pay_` | Payment Processing |
| `inv_` | Inventory Management |
| `proc_` | Procurement |
| `crm_` | Customer Relationship Management |
| `hr_` | Human Resources |
| `b2b_` | B2B Commerce |
| `svm_` | Single Vendor Marketplace |
| `mkt_` | Marketing Automation |
| `acct_` | Accounting |
| `logistics_` | Logistics & Delivery |
| `ai_` | AI & Insights |

---

## Validation Rules

The automated validation script (`scripts/validation/validate-prisma-models.js`) enforces:

1. **Model Existence**: All `prisma.modelName.*` references must match a model in the generated Prisma client
2. **Case Sensitivity**: Model names are case-sensitive; `prisma.User` ≠ `prisma.user`
3. **No Aliases**: Use exact model names as they appear in the Prisma client

---

## Common Mistakes to Avoid

### ❌ WRONG: Using PascalCase for extension models
```typescript
// WRONG - Will fail at runtime
prisma.partnerAttributionRecord.findMany()
prisma.partnerReferralLinkExt.create()
```

### ✅ CORRECT: Use snake_case for extension models
```typescript
// CORRECT
prisma.partner_attributions_ext.findMany()
prisma.partner_referral_links_ext.create()
```

### ❌ WRONG: Creating new PrismaClient instances
```typescript
// WRONG - Creates connection pool issues
const prisma = new PrismaClient();
```

### ✅ CORRECT: Import shared instance
```typescript
// CORRECT
import { prisma } from '@/lib/prisma';
```

---

## Running Validation

### Local Development
```bash
# Run validation manually
yarn validate:schema

# Or via npm
npm run validate:schema
```

### Pre-commit Hook (Recommended)
Add to `.husky/pre-commit`:
```bash
yarn validate:schema
```

### CI/CD Integration
The validation script exits with:
- `0` - All validations passed
- `1` - Validation errors found (build should fail)

---

## Model Reference Quick Lookup

### Core Models (PascalCase → camelCase in client)
| Schema Model | Prisma Client |
|--------------|---------------|
| `User` | `prisma.user` |
| `Tenant` | `prisma.tenant` |
| `Session` | `prisma.session` |
| `Partner` | `prisma.partner` |
| `PartnerUser` | `prisma.partnerUser` |
| `TenantMembership` | `prisma.tenantMembership` |
| `PlatformInstance` | `prisma.platformInstance` |

### Extension Models (snake_case preserved)
| Schema Model | Prisma Client |
|--------------|---------------|
| `partner_attributions_ext` | `prisma.partner_attributions_ext` |
| `partner_commission_records_ext` | `prisma.partner_commission_records_ext` |
| `partner_referral_links_ext` | `prisma.partner_referral_links_ext` |
| `core_capabilities` | `prisma.core_capabilities` |
| `pay_payment_transactions` | `prisma.pay_payment_transactions` |

---

## Troubleshooting

### "Model not found" Error
1. Run `npx prisma generate` to regenerate client
2. Check exact model name in `prisma/schema.prisma`
3. Run `yarn validate:schema` to identify mismatches

### Schema Drift Prevention
- **Never** run `prisma db pull` without review
- Always regenerate client after schema changes
- Run validation before committing

---

## Contact

For questions about schema conventions, contact the Platform Team.

**Document Status:** This document describes current conventions only. No changes to existing model names are permitted without explicit approval.
