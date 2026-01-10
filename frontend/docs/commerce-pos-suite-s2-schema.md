# POS & Retail Operations Suite — S2 Schema Implementation

## Document Info
- **Suite**: POS & Retail Operations (Commerce Sub-Suite 1 of 8)
- **Phase**: S2 (Schema)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: COMPLETE — AWAITING S3 APPROVAL
- **Date**: December 2025
- **Author**: E1 Agent

---

## 1️⃣ SCHEMA ASSESSMENT

### What Already Existed (Reused)

| Entity | Purpose | Reuse Status |
|--------|---------|--------------|
| `TaxRule` / `TaxRate` | Tenant-configurable tax rates | ✅ Full reuse |
| `PayPaymentMethod` enum | BANK_TRANSFER, MOBILE_MONEY, POS_TERMINAL already defined | ✅ Full reuse |
| `Entitlement` | POS module feature gating | ✅ Full reuse |
| `AuditLog` | Event logging | ✅ Full reuse |
| `Product`, `Customer`, `Location` | Core entities | ✅ Full reuse |

### What Was Needed (Added)

| Need | Solution | Justification |
|------|----------|---------------|
| Shift management | `pos_shift` table | Required for Z-reports, accountability |
| Sale records | `pos_sale` table | Required for reporting, history |
| Sale line items | `pos_sale_item` table | Required for itemized receipts, analytics |
| Cash drawer tracking | `pos_cash_movement` table | Required for reconciliation |

---

## 2️⃣ NEW TABLES ADDED (4)

### pos_shift
Track register shifts with opening/closing balances and payment breakdown.

| Column | Type | Purpose |
|--------|------|---------|
| `shiftNumber` | String | Unique: SHIFT-YYYYMMDD-XXX |
| `status` | pos_ShiftStatus | OPEN, CLOSED, RECONCILED, VOID |
| `openingFloat` | Decimal | Starting cash balance (NGN) |
| `expectedCash` | Decimal | Calculated expected drawer |
| `actualCash` | Decimal | Counted cash at close |
| `cashVariance` | Decimal | Difference (over/short) |
| `totalSales` | Decimal | Gross sales for shift |
| `totalRefunds` | Decimal | Refunds processed |
| `netSales` | Decimal | Gross - Refunds |
| `cashTotal` | Decimal | Cash payment total |
| `cardTotal` | Decimal | Card payment total |
| `transferTotal` | Decimal | Bank transfer total |
| `mobileMoneyTotal` | Decimal | Mobile money total |

### pos_sale
Individual sale records with payment details.

| Column | Type | Purpose |
|--------|------|---------|
| `saleNumber` | String | Unique: SALE-YYYYMMDD-XXXXX |
| `receiptNumber` | String | Customer-facing receipt |
| `status` | pos_SaleStatus | COMPLETED, VOIDED, REFUNDED, PARTIALLY_REFUNDED |
| `subtotal` | Decimal | Before tax/discount (NGN) |
| `discountTotal` | Decimal | Total discounts |
| `taxTotal` | Decimal | Tax amount |
| `taxRate` | Decimal | Rate at time of sale |
| `grandTotal` | Decimal | Final amount |
| `paymentMethod` | String | CASH, CARD, TRANSFER, MOBILE_MONEY, SPLIT |
| `amountTendered` | Decimal | For cash payments |
| `changeGiven` | Decimal | Change returned |
| `transferReference` | String | Bank reference for transfers |
| `splitPayments` | Json | For multi-method payments |
| `offlineId` | String | Client-generated for offline sync |

### pos_sale_item
Sale line items for itemized records.

| Column | Type | Purpose |
|--------|------|---------|
| `productId` | String | FK to Product |
| `productName` | String | Denormalized for receipts |
| `quantity` | Int | Units sold |
| `unitPrice` | Decimal | Price per unit (NGN) |
| `discount` | Decimal | Line discount |
| `tax` | Decimal | Line tax |
| `lineTotal` | Decimal | Final line amount |
| `unitCost` | Decimal | For margin tracking |
| `returnedQuantity` | Int | For partial refunds |

### pos_cash_movement
Track all cash drawer operations.

| Column | Type | Purpose |
|--------|------|---------|
| `movementType` | pos_CashMovementType | OPEN_FLOAT, SALE, REFUND, PAYOUT, etc. |
| `amount` | Decimal | Movement amount (NGN) |
| `direction` | String | IN or OUT |
| `balanceBefore` | Decimal | Drawer before movement |
| `balanceAfter` | Decimal | Drawer after movement |

---

## 3️⃣ NEW ENUMS ADDED (4)

### pos_ShiftStatus
```
OPEN        — Shift is active
CLOSED      — Shift ended, not yet reconciled
RECONCILED  — Cash counted, variance documented
VOID        — Shift cancelled/invalid
```

### pos_CashMovementType
```
OPEN_FLOAT   — Opening cash balance
SALE         — Cash from sale
REFUND       — Cash refund payout
PAYOUT       — Manual cash removal
PAY_IN       — Manual cash addition
DROP         — Safe drop
ADJUSTMENT   — Count correction
```

### pos_SaleStatus
```
COMPLETED           — Normal completed sale
VOIDED              — Cancelled before payment
REFUNDED            — Full refund issued
PARTIALLY_REFUNDED  — Partial refund issued
```

---

## 4️⃣ NIGERIA-FIRST COMPLIANCE

| Requirement | Implementation |
|-------------|----------------|
| ✅ NGN as default currency | All Decimal fields default `currency: "NGN"` |
| ✅ Bank transfer support | `transferReference`, `transferBank` fields |
| ✅ Mobile money support | `mobileMoneyTotal` in shift summary |
| ✅ Split payments | `splitPayments` JSON field for multi-method |
| ✅ Offline-first | `offlineId`, `syncedAt` for offline sales |

---

## 5️⃣ SCHEMA IMPACT

| Metric | Value |
|--------|-------|
| New tables | 4 |
| New enums | 4 |
| Breaking changes | 0 |
| Existing tables modified | 0 |
| Migration type | ADDITIVE ONLY |

---

## 6️⃣ DATABASE MIGRATION

```bash
# Applied successfully
cd /app/frontend
npx prisma format      # ✅ Schema formatted
npx prisma generate    # ✅ Client generated
npx prisma db push     # ✅ Database synced
```

---

## 7️⃣ WHAT'S NOT IN SCHEMA

The following P0 fixes do NOT require schema changes:

| Fix | Implementation Approach |
|-----|------------------------|
| Currency display (₦) | UI/service layer fix |
| Tax configuration | Use existing `TaxRule` model |
| Payment method options | Use existing `PayPaymentMethod` enum |

---

## 📌 S2 DELIVERABLES COMPLETE

| Deliverable | Status |
|-------------|--------|
| Schema assessment | ✅ |
| Additive tables | ✅ 4 tables |
| Additive enums | ✅ 4 enums |
| Migration applied | ✅ |
| Nigeria-first compliance | ✅ |
| Zero breaking changes | ✅ |

---

## 🛑 STOP — AWAITING S3 APPROVAL

S2 is complete. The agent will now STOP and await explicit approval to proceed to S3 (Core Services).

### Next Phase (S3) Will Include:
- POS configuration service (tax integration)
- Shift management service
- Sale processing service  
- Cash drawer service
- Receipt service
- Report service (X/Z reports)

**Request**: Approve S3 to proceed with core services implementation.
