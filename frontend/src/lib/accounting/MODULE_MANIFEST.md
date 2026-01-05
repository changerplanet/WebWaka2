/**
 * MODULE 2: Accounting & Finance
 * Module Manifest & Validation
 * 
 * VERSION: 1.0.0
 * STATUS: COMPLETE
 * 
 * This file serves as the module manifest and validation checklist.
 */

# MODULE 2: ACCOUNTING & FINANCE

## Module Identity
- **Module Key**: `accounting`
- **Display Name**: Accounting & Finance
- **Version**: 1.0.0
- **Domain**: Finance
- **Status**: COMPLETE & VALIDATED

## Module Summary
An independently subscribable module providing double-entry accounting, financial reporting, 
and Nigeria-first tax compliance. This module is **read-only** on Core data (Wallets, Payments) 
and derives all financial data from system events.

---

## VALIDATION CHECKLIST

### ✅ Core Safety
- [x] No Core schema changes made
- [x] No Core tables modified directly
- [x] No wallet balance mutations
- [x] No payment execution
- [x] Module tables prefixed with `acct_`
- [x] Safe removal without breaking POS, SVM, MVM, Inventory

### ✅ Data Ownership
**Module OWNS:**
- [x] AcctChartOfAccount (Chart of Accounts)
- [x] AcctLedgerAccount (Ledger account instances)
- [x] AcctLedgerEntry (Individual debit/credit lines)
- [x] AcctJournalEntry (Transaction groupings)
- [x] AcctFinancialPeriod (Monthly periods)
- [x] AcctExpenseRecord (Manual expenses)
- [x] AcctTaxSummary (VAT summaries)

**Module READS (read-only):**
- [x] Wallets (via events only)
- [x] Payments (via events only)
- [x] Orders/Sales (via events only)
- [x] Inventory adjustments (via events only)

### ✅ Nigeria-first Compliance
- [x] VAT 7.5% support
- [x] Cash-heavy business support (CASH, MOBILE_MONEY)
- [x] Informal expense tracking
- [x] NGN currency default
- [x] Nigeria SME Chart of Accounts (56 accounts)
- [x] Audit-friendly records

### ✅ Double-Entry Accounting
- [x] Debits always equal credits
- [x] Append-only ledger (no updates/deletes)
- [x] Corrections via reversal entries only
- [x] All postings traceable via source

### ✅ Event-Sourced Design
- [x] Idempotent journal posting (eventId/idempotencyKey)
- [x] Event-to-journal mapping for:
  - [x] POS_SALE
  - [x] SVM_ORDER
  - [x] MVM_ORDER
  - [x] REFUND
  - [x] INVENTORY_ADJUSTMENT
  - [x] EXPENSE (manual)

### ✅ Capability Integration
- [x] Registered in capability registry as `accounting`
- [x] All API routes protected by `checkCapabilityForSession`
- [x] Returns 401/403 when capability inactive

### ✅ Entitlement Integration
- [x] Feature flags (advancedReports, taxReports, etc.)
- [x] Usage limits (expenses/month, periods)
- [x] Tier-based entitlements
- [x] Graceful degradation

---

## API ENDPOINTS (38 total)

### Chart of Accounts (5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/accounting/initialize | Initialize COA for tenant |
| GET | /api/accounting/coa | List all accounts |
| POST | /api/accounting/coa | Create custom account |
| GET | /api/accounting/coa/[id] | Get single account |
| PUT | /api/accounting/coa/[id] | Update account |

### Journals & Ledger (12)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounting/journals | List journals |
| POST | /api/accounting/journals | Create manual journal |
| GET | /api/accounting/journals/[id] | Get single journal |
| POST | /api/accounting/journals/[id]?action=void | Void journal |
| POST | /api/accounting/journals/post-event | Post from event |
| GET | /api/accounting/journals/by-source | Lookup by source |
| GET | /api/accounting/ledger | List ledger entries |
| GET | /api/accounting/ledger/accounts | List ledger accounts |
| GET | /api/accounting/periods | List periods |
| POST | /api/accounting/periods | Close/reopen period |

### Expenses (11)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounting/expenses | List expenses |
| POST | /api/accounting/expenses | Create expense |
| GET | /api/accounting/expenses/[id] | Get single expense |
| PUT | /api/accounting/expenses/[id] | Update expense |
| DELETE | /api/accounting/expenses/[id] | Delete expense |
| POST | /api/accounting/expenses/[id]/submit | Submit for approval |
| POST | /api/accounting/expenses/[id]/approve | Approve expense |
| POST | /api/accounting/expenses/[id]/reject | Reject expense |
| POST | /api/accounting/expenses/[id]/post | Post to journal |
| GET | /api/accounting/expenses/categories | Get categories |
| GET | /api/accounting/expenses/summary | Get summary |

### Tax (7)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounting/tax?action=codes | Get tax codes |
| POST | /api/accounting/tax (action=calculate) | Calculate tax |
| GET | /api/accounting/tax?action=vat-summary | Get VAT summary |
| POST | /api/accounting/tax (action=generate-vat-summary) | Generate VAT summary |
| POST | /api/accounting/tax (action=finalize-vat) | Finalize VAT |
| GET | /api/accounting/tax?action=vat-history | VAT history |
| GET | /api/accounting/tax?action=vat-annual | Annual VAT |

### Reports (5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounting/reports?type=profit-loss | P&L Statement |
| GET | /api/accounting/reports?type=balance-sheet | Balance Sheet |
| GET | /api/accounting/reports?type=trial-balance | Trial Balance |
| GET | /api/accounting/reports?type=cash-flow | Cash Flow |
| GET | /api/accounting/reports?type=expense-breakdown | Expense Breakdown |

### Offline (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounting/offline?action=package | Get offline package |
| POST | /api/accounting/offline (action=sync) | Sync expenses |
| GET | /api/accounting/offline?action=changes | Get changes |

### Entitlements (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounting/entitlements?action=summary | Get summary |
| GET | /api/accounting/entitlements?action=check | Check feature |
| GET | /api/accounting/entitlements?action=usage | Check usage |

---

## DATABASE MODELS (7)

1. **AcctChartOfAccount** - Account definitions
2. **AcctLedgerAccount** - Runtime account instances
3. **AcctLedgerEntry** - Debit/credit lines (immutable)
4. **AcctJournalEntry** - Transaction groupings (append-only)
5. **AcctFinancialPeriod** - Monthly periods
6. **AcctExpenseRecord** - Manual expenses
7. **AcctTaxSummary** - VAT period summaries

---

## SERVICE FILES (8)

1. `/lib/accounting/coa-service.ts` - Chart of Accounts
2. `/lib/accounting/journal-service.ts` - Journals & Ledger
3. `/lib/accounting/expense-service.ts` - Expense Tracking
4. `/lib/accounting/tax-service.ts` - Tax Handling
5. `/lib/accounting/reports-service.ts` - Financial Reports
6. `/lib/accounting/offline-service.ts` - Offline Support
7. `/lib/accounting/entitlements-service.ts` - Entitlements
8. `/lib/accounting/MODULE_MANIFEST.md` - This file

---

## KNOWN FUTURE ENHANCEMENTS

1. Multi-currency support (Phase 2)
2. Bank reconciliation (Phase 2)
3. Automated recurring expenses (Phase 2)
4. Export to accounting software (CSV, QBO)
5. Integration with Core payment events
6. Advanced audit trail UI
7. Mobile offline app
8. AI-powered expense categorization

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2, 2026 | Initial release - All 9 phases complete |

---

## MODULE TAG

```
accounting-v1.0.0
```
