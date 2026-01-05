# Suite-Specific Personas: Marketing Automation
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Marketing Suite Overview

**Capability:** `marketing`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (Marketing Context)
- Create/manage campaigns
- Configure promotions
- View marketing analytics
- Manage promotional codes

### TENANT USER (Marketing Context)
- View active campaigns
- ❌ Cannot create campaigns
- ❌ Cannot modify promotions

---

## External Roles

### Customer (Campaign Target)
- Receives marketing communications
- Redeems promotional codes
- Participates in campaigns

---

## Key Models

### Promotion
```prisma
model Promotion {
  id           String         @id @default(uuid())
  tenantId     String
  code         String?
  name         String
  type         PromotionType
  discountType DiscountType
  discountValue Decimal
  minOrderValue Decimal?
  maxUses      Int?
  usedCount    Int           @default(0)
  startDate    DateTime
  endDate      DateTime?
  isActive     Boolean       @default(true)
}
```

---

## Summary

| Role | Type | Access |
|------|------|--------|
| TENANT_ADMIN | Internal | Full marketing management |
| TENANT_USER | Internal | View only |
| Customer | External | Receives/redeems promotions |

---

**Document Status:** EXTRACTION COMPLETE
