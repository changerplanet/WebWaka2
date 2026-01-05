# Suite-Specific Personas: Commerce
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Commerce Suite Overview

The Commerce suite includes:
- **POS** (Point of Sale)
- **SVM** (Store Virtual Module - Storefront)
- **MVM** (Multi-Vendor Marketplace)
- **Inventory** (Inventory Management)

**Capabilities:**
- `pos`, `svm`, `mvm`, `inventory`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (Commerce Context)
- Full access to all commerce modules
- Configure POS settings, products, pricing
- Manage storefront and marketplace settings
- View all sales and inventory reports
- Manage vendor relationships (MVM)

### TENANT USER (Commerce Context)
- Operate POS terminal (create sales, process payments)
- View product catalog
- Basic inventory operations (stock checks)
- Limited to operational tasks

---

## External Roles (Public/Customer Facing)

### 1. Customer (Buyer)

| Attribute | Value |
|-----------|-------|
| **Model** | `Customer` |
| **Access Method** | Public storefront, checkout |
| **Authentication** | Optional (guest checkout supported) |

#### Data Model
```prisma
model Customer {
  id           String         @id @default(uuid())
  tenantId     String
  firstName    String
  lastName     String
  email        String?
  phone        String?
  status       CustomerStatus @default(ACTIVE)
  totalOrders  Int            @default(0)
  totalSpent   Decimal        @default(0)
  loyaltyPoints Int           @default(0)
  tags         String[]       @default([])
  notes        String?
}
```

#### Actions Allowed
- Browse products (SVM, MVM)
- Add items to cart
- Checkout (with or without account)
- View order history (if registered)
- Track orders
- Request returns/refunds
- Earn/redeem loyalty points
- Use promotional codes

#### Data Visibility
- Own orders and order history
- Own profile information
- Own loyalty balance
- Product catalog (public)
- ❌ Cannot see internal pricing/margins
- ❌ Cannot see other customers' data
- ❌ Cannot see internal inventory levels

---

### 2. Vendor (MVM Seller)

| Attribute | Value |
|-----------|-------|
| **Model** | `Vendor` |
| **Access Method** | Vendor portal (if implemented), or tenant dashboard |
| **Authentication** | Required |

#### Data Model
```prisma
model Vendor {
  id            String @id @default(uuid())
  tenantId      String
  name          String
  contactName   String?
  email         String?
  phone         String?
  address       Json?
  status        VendorStatus @default(ACTIVE)
  commissionRate Decimal?
  paymentTerms  Int?
}
```

#### Actions Allowed (in MVM context)
- List products for sale
- Manage own inventory
- View own sales reports
- Receive payouts from marketplace
- Manage own vendor profile
- Respond to customer queries (own products)

#### Data Visibility
- Own products and sales
- Own earnings and payout history
- Own vendor profile
- ❌ Cannot see other vendors' data
- ❌ Cannot see platform/tenant margins
- ❌ Cannot see customer personal data

---

## Wallet System (Commerce Financial)

The platform includes a wallet system for commerce:

```prisma
enum WalletType {
  CUSTOMER // Customer wallet for refunds, store credit
  VENDOR   // Vendor wallet for earnings from MVM sales
  PLATFORM // Platform fee collection
}
```

### Customer Wallet
- Store credits
- Refund balances
- Gift card balances
- Loyalty point redemption

### Vendor Wallet
- Sales proceeds (minus commission)
- Payout requests
- Transaction history

---

## Staff Member (Internal)

| Attribute | Value |
|-----------|-------|
| **Model** | `StaffMember` |
| **Access Method** | Tenant dashboard |
| **Authentication** | Via TenantMembership |

```prisma
model StaffMember {
  id        String   @id @default(uuid())
  tenantId  String
  userId    String?  // Links to User if authenticated
  firstName String
  lastName  String
  email     String?
  phone     String?
  role      StaffRole @default(STAFF)
  status    StaffStatus @default(ACTIVE)
  hireDate  DateTime?
  hourlyRate Decimal?
  commissionRate Decimal?
}
```

**Note:** StaffMember is primarily for HR/Payroll tracking, not access control. Access control is via TenantMembership.

---

## Summary

| Role | Type | Authentication | Primary Actions |
|------|------|---------------|-----------------|
| TENANT_ADMIN | Internal | Required | Full commerce management |
| TENANT_USER | Internal | Required | POS operations, basic tasks |
| Customer | External | Optional | Browse, purchase, track orders |
| Vendor | External | Required | Sell products, manage inventory |
| StaffMember | Internal | Optional | HR/Payroll tracking only |

---

## Source Files

- `/app/frontend/prisma/schema.prisma` - Customer, Vendor, StaffMember, Wallet models
- `/app/frontend/src/lib/capabilities/registry.ts` - pos, svm, mvm, inventory capabilities
- `/app/frontend/src/app/api/pos/` - POS API routes
- `/app/frontend/src/app/api/inventory/` - Inventory API routes

---

**Document Status:** EXTRACTION COMPLETE
