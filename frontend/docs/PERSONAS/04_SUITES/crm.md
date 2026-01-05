# Suite-Specific Personas: CRM
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## CRM Suite Overview

The CRM (Customer Relationship Management) suite includes:
- Customer segmentation
- Campaign management
- Customer interactions tracking
- Loyalty programs

**Capability:** `crm`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (CRM Context)
- Full CRM configuration
- Create/manage customer segments
- Create/manage campaigns
- View all customer data
- Configure loyalty programs
- View CRM analytics

### TENANT USER (CRM Context)
- View customer information
- Log customer interactions
- View assigned segments
- ❌ Cannot configure segments
- ❌ Cannot create campaigns

---

## External Roles

### Customer (CRM Target)
| Attribute | Value |
|-----------|-------|
| **Model** | `Customer` (from Commerce) |
| **CRM Extension** | `CrmSegmentMembership` |
| **Actions** | Receives campaigns, accumulates loyalty points |

CRM does not duplicate the core Customer model - it references by `customerId`.

---

## Key Models

### CrmCustomerSegment
```prisma
model CrmCustomerSegment {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  criteria    Json?    // Filter criteria
  isActive    Boolean  @default(true)
  memberCount Int      @default(0)
  
  memberships CrmSegmentMembership[]
}
```

### CrmSegmentMembership
```prisma
model CrmSegmentMembership {
  id         String   @id @default(uuid())
  segmentId  String
  customerId String
  addedAt    DateTime @default(now())
}
```

### CrmInteraction
```prisma
model CrmInteraction {
  id         String @id @default(uuid())
  tenantId   String
  customerId String
  type       CrmInteractionType
  channel    CrmChannel
  direction  CrmDirection
  subject    String?
  notes      String?
  staffId    String?
}
```

---

## Summary

| Role | Type | Access |
|------|------|--------|
| TENANT_ADMIN | Internal | Full CRM management |
| TENANT_USER | Internal | View/log interactions |
| Customer | External | Receives campaigns, earns loyalty |

---

## Source Files

- `/app/frontend/prisma/schema.prisma` - CRM models
- `/app/frontend/src/lib/capabilities/registry.ts` - crm capability
- `/app/frontend/src/app/api/crm/` - CRM API routes

---

**Document Status:** EXTRACTION COMPLETE
