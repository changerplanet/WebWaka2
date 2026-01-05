# External Users & Portals
## WebWaka Platform - Persona Extraction Document 06
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Overview

This document extracts all external/non-authenticated or limited-access personas.

**Sources:** `prisma/schema.prisma`, Portal pages, Public routes

---

## 1. CUSTOMER (Buyer)

| Attribute | Value |
|-----------|-------|
| **Model** | `Customer` |
| **Access Method** | Public storefront (SVM), Marketplace (MVM) |
| **Authentication** | Optional (guest checkout supported) |

### Data Model
```prisma
model Customer {
  id            String         @id @default(uuid())
  tenantId      String
  firstName     String
  lastName      String
  email         String?
  phone         String?
  status        CustomerStatus @default(ACTIVE)
  totalOrders   Int            @default(0)
  totalSpent    Decimal        @default(0)
  loyaltyPoints Int            @default(0)
  tags          String[]       @default([])
  notes         String?
}
```

### Actions Allowed
| Action | Allowed |
|--------|---------|
| Browse products | ✅ |
| Add to cart | ✅ |
| Checkout (guest) | ✅ |
| Checkout (registered) | ✅ |
| View order history | ✅ (if registered) |
| Track orders | ✅ |
| Manage profile | ✅ (if registered) |
| View loyalty balance | ✅ |
| Redeem loyalty points | ✅ |
| Use promo codes | ✅ |
| Request refunds | ✅ |

### Data Visibility Limits
- ✅ Own orders
- ✅ Own profile
- ✅ Own loyalty balance
- ✅ Public product catalog
- ❌ Other customers' data
- ❌ Internal pricing/margins
- ❌ Inventory levels
- ❌ Cost data

---

## 2. VENDOR (Marketplace Seller)

| Attribute | Value |
|-----------|-------|
| **Model** | `Vendor` |
| **Access Method** | Vendor management in tenant dashboard |
| **Authentication** | Required (via TenantMembership or portal) |

### Data Model
```prisma
model Vendor {
  id              String       @id @default(uuid())
  tenantId        String
  name            String
  contactName     String?
  email           String?
  phone           String?
  address         Json?
  status          VendorStatus @default(ACTIVE)
  commissionRate  Decimal?
  paymentTerms    Int?
}
```

### Actions Allowed
| Action | Allowed |
|--------|---------|
| List products | ✅ |
| Manage own inventory | ✅ |
| View own sales | ✅ |
| View own earnings | ✅ |
| Request payouts | ✅ |
| Update vendor profile | ✅ |

### Data Visibility Limits
- ✅ Own products
- ✅ Own sales
- ✅ Own earnings/payouts
- ❌ Other vendors' data
- ❌ Platform margins
- ❌ Customer personal data

---

## 3. CLIENT PORTAL USER (Tenant Admin as Client)

| Attribute | Value |
|-----------|-------|
| **Route** | `/portal` |
| **Access Method** | Magic link (via Partner) |
| **Authentication** | Required |

### Portal Features
The Client Portal allows Partners' clients to view their platform status:

```typescript
// From /portal/page.tsx
interface PortalData {
  instance: {
    name: string
    slug: string
    partnerName: string
    status: string
    subscription?: {...}
  }
  contact: {
    partnerEmail: string
    supportEmail: string
    supportPhone: string
  }
}
```

### Actions Allowed
| Action | Allowed |
|--------|---------|
| View platform status | ✅ |
| View subscription details | ✅ |
| Contact partner for support | ✅ |
| ❌ Change pricing | ❌ |
| ❌ See WebWaka branding | ❌ |
| ❌ Activate capabilities | ❌ |
| ❌ Bypass partner | ❌ |

### Data Visibility Limits
- ✅ Own instance status
- ✅ Own subscription info
- ✅ Partner contact details
- ❌ Other tenants' data
- ❌ Platform internals
- ❌ Partner's other clients

---

## 4. PUBLIC VIEWER (Marketing Site)

| Attribute | Value |
|-----------|-------|
| **Routes** | `/`, `/platform`, `/capabilities`, `/suites`, `/about`, etc. |
| **Access Method** | Public URLs |
| **Authentication** | None |

### Actions Allowed
- View marketing content
- Learn about platform
- Submit partner inquiry
- Access pricing information (if published)

### Data Visibility Limits
- ✅ Public marketing content
- ❌ Any tenant/partner data
- ❌ Any internal systems

---

## 5. MEMBER (Community/Association - PLANNED)

**Note:** Community/Association capabilities are not currently implemented.

When implemented, would include:
- Association members
- Club members
- Community participants

---

## 6. PATIENT (Healthcare - PLANNED)

**Note:** Healthcare capabilities are not currently implemented.

When implemented, would include:
- View medical records
- Book appointments
- View prescriptions

---

## 7. CITIZEN (Civic - PLANNED)

**Note:** Civic capabilities are not currently implemented.

When implemented, would include:
- Government service users
- Permit applicants
- Public service recipients

---

## Portal Access Summary

| Portal | Route | Users | Authentication |
|--------|-------|-------|----------------|
| Client Portal | `/portal` | Tenant Admins | Magic link |
| Storefront | SVM routes | Customers | Optional |
| Marketplace | MVM routes | Customers, Vendors | Varies |
| Public Site | Marketing routes | Everyone | None |

---

## Wallet Integration

External users interact with wallets for commerce:

### Customer Wallet
```prisma
enum WalletType {
  CUSTOMER  // Store credits, refunds, gift cards
}
```
- Receive refunds
- Use store credit
- Redeem gift cards

### Vendor Wallet
```prisma
enum WalletType {
  VENDOR    // Sales earnings
}
```
- Receive sales proceeds
- Request payouts

---

**Document Status:** EXTRACTION COMPLETE
