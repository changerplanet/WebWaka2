# Suite-Specific Personas: Procurement
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Procurement Suite Overview

**Capability:** `procurement`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (Procurement Context)
- Manage suppliers/vendors
- Create purchase orders
- Approve POs
- Configure procurement workflows
- View all procurement reports

### TENANT USER (Procurement Context)
- Create purchase requisitions
- View supplier catalog
- ❌ Cannot approve POs (unless workflow configured)

---

## External Roles

### Supplier/Vendor

| Attribute | Value |
|-----------|-------|
| **Model** | `Vendor` |
| **Access Method** | Email/external communication |
| **Actions** | Receive POs, provide quotes |

---

## Key Models

### Vendor (Supplier)
```prisma
model Vendor {
  id             String       @id @default(uuid())
  tenantId       String
  name           String
  contactName    String?
  email          String?
  phone          String?
  address        Json?
  status         VendorStatus @default(ACTIVE)
  paymentTerms   Int?         // Days
}
```

### PurchaseOrder
```prisma
model PurchaseOrder {
  id           String    @id @default(uuid())
  tenantId     String
  vendorId     String
  orderNumber  String
  status       POStatus
  orderDate    DateTime
  expectedDate DateTime?
  totalAmount  Decimal
}
```

---

## Summary

| Role | Type | Access |
|------|------|--------|
| TENANT_ADMIN | Internal | Full procurement management |
| TENANT_USER | Internal | Requisition creation |
| Supplier | External | PO receipt, quotes |

---

**Document Status:** EXTRACTION COMPLETE
