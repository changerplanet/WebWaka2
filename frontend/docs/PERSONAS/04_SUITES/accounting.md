# Suite-Specific Personas: Accounting & Finance
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Accounting Suite Overview

The Accounting/Finance suite includes:
- **Accounting** (General Ledger, Journal Entries)
- **Payments** (Payment processing, wallets)
- **Subscriptions & Billing** (Platform subscription management)
- **Compliance & Tax** (Tax compliance, reporting)

**Capabilities:** `accounting`, `payments`, `subscriptions_billing`, `compliance_tax`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (Finance Context)
- Full access to all accounting modules
- Create/edit chart of accounts
- Post journal entries
- View/generate financial reports
- Manage payment settings
- Configure tax settings
- View compliance reports

### TENANT USER (Finance Context)
- View financial summaries (if permitted by tenant admin)
- Process day-to-day transactions
- ❌ Cannot modify accounting settings
- ❌ Cannot access compliance settings

---

## External Roles

**Note:** The Accounting suite does not have external-facing personas. All financial operations are internal to the tenant.

---

## Key Models

### Account (Chart of Accounts)
```prisma
model Account {
  id          String      @id @default(uuid())
  tenantId    String
  code        String      // Account code
  name        String
  type        AccountType
  parentId    String?
  isActive    Boolean     @default(true)
  balance     Decimal     @default(0)
}
```

### JournalEntry
```prisma
model JournalEntry {
  id          String    @id @default(uuid())
  tenantId    String
  entryNumber String
  date        DateTime
  description String?
  status      JournalEntryStatus
  totalDebit  Decimal
  totalCredit Decimal
  createdById String
  postedById  String?
}
```

---

## Wallet System (Finance)

Used for managing tenant financial flows:

```prisma
enum WalletType {
  CUSTOMER  // Customer refunds, credits
  VENDOR    // Vendor payouts
  PLATFORM  // Platform fee collection
}
```

### Transaction Types
```prisma
enum WalletTransactionType {
  CREDIT_ORDER_PAYMENT    // Customer paid for order
  CREDIT_PLATFORM_FEE     // Platform fee collected
  CREDIT_SALE_PROCEEDS    // Vendor earned from sale
  CREDIT_REFUND_REVERSAL  // Refund reversed
  DEBIT_VENDOR_PAYOUT     // Payout to vendor
  DEBIT_CUSTOMER_REFUND   // Refund to customer
}
```

---

## Summary

| Role | Type | Access Level |
|------|------|-------------|
| TENANT_ADMIN | Internal | Full financial access |
| TENANT_USER | Internal | Limited view/transaction access |

---

## Source Files

- `/app/frontend/prisma/schema.prisma` - Account, JournalEntry, Wallet models
- `/app/frontend/src/lib/capabilities/registry.ts` - accounting capability
- `/app/frontend/src/app/api/accounting/` - Accounting API routes

---

**Document Status:** EXTRACTION COMPLETE
