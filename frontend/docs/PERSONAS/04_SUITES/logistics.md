# Suite-Specific Personas: Logistics & Delivery
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Logistics Suite Overview

The Logistics suite handles delivery and fulfillment operations.

**Capability:** `logistics`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (Logistics Context)
- Configure delivery zones
- Manage delivery rates
- Assign deliveries to drivers
- View all delivery reports
- Manage fleet/vehicles

### TENANT USER (Logistics Context)
- View assigned deliveries
- Update delivery status
- Basic logistics operations

---

## External Roles

### Driver (Delivery Agent)

| Attribute | Value |
|-----------|-------|
| **Model** | Uses `StaffMember` with driver metadata |
| **Access Method** | Mobile/tablet interface (if implemented) |
| **Actions** | Receive delivery assignments, update status |

### Customer (Delivery Recipient)

| Attribute | Value |
|-----------|-------|
| **Model** | `Customer` (from Commerce) |
| **Actions** | Track deliveries, provide delivery instructions |

---

## Key Models

### DeliveryZone
```prisma
model DeliveryZone {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  areas       Json?    // Geographic data
  baseFee     Decimal
  feePerUnit  Decimal
  isActive    Boolean  @default(true)
}
```

### Delivery
```prisma
model Delivery {
  id           String         @id @default(uuid())
  tenantId     String
  orderId      String?
  status       DeliveryStatus
  driverId     String?
  pickupAddress Json?
  deliveryAddress Json?
  scheduledAt  DateTime?
  deliveredAt  DateTime?
}
```

---

## Summary

| Role | Type | Access |
|------|------|--------|
| TENANT_ADMIN | Internal | Full logistics management |
| TENANT_USER | Internal | Operational tasks |
| Driver | External | Delivery assignments |
| Customer | External | Delivery tracking |

---

**Document Status:** EXTRACTION COMPLETE
