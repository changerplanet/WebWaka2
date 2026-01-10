# Commerce Suite: Accounting (Light)
## S0-S1: Audit & Capability Map

**Suite Code**: `COM-ACCT`  
**Phase**: S0-S1 (Audit & Capability Mapping)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. Audit Summary

### 1.1 Existing Infrastructure Status

**CRITICAL FINDING**: Unlike other Commerce suites, Accounting already has a **mature, production-ready implementation** (v1.0.0).

| Component | Status | Quality |
|-----------|--------|---------|
| Services (8 files) | ✅ EXISTS | HIGH |
| APIs (38 endpoints) | ✅ EXISTS | HIGH |
| Schema (7 models) | ✅ EXISTS | HIGH |
| Dashboard UI | ✅ EXISTS | MEDIUM |
| Documentation | ✅ EXISTS | HIGH |
| Nigeria-first | ✅ COMPLIANT | HIGH |

### 1.2 Files Audited

**Services** (`/app/frontend/src/lib/accounting/`):
| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `coa-service.ts` | Chart of Accounts | ~980 | ✅ Complete |
| `journal-service.ts` | Double-entry journals | ~600+ | ✅ Complete |
| `expense-service.ts` | Expense tracking | ~400+ | ✅ Complete |
| `tax-service.ts` | VAT calculations | ~300+ | ✅ Complete |
| `reports-service.ts` | Financial reports | ~300+ | ✅ Complete |
| `offline-service.ts` | Offline support | ~200+ | ✅ Complete |
| `entitlements-service.ts` | Feature flags | ~150+ | ✅ Complete |
| `index.ts` | Exports | ~15 | ✅ Complete |
| `MODULE_MANIFEST.md` | Documentation | ~217 | ✅ Complete |

**APIs** (`/app/frontend/src/app/api/accounting/`):
- `/coa` - Chart of Accounts (5 endpoints)
- `/journals` - Journal entries (12 endpoints)
- `/expenses` - Expense management (11 endpoints)
- `/tax` - VAT handling (7 endpoints)
- `/reports` - Financial reports (5 endpoints)
- `/offline` - Offline sync (3 endpoints)
- `/entitlements` - Feature checks (3 endpoints)
- `/ledger` - Ledger accounts (2 endpoints)
- `/periods` - Financial periods (2 endpoints)
- `/initialize` - COA initialization (1 endpoint)
- `/validate` - Validation (1 endpoint)

**Total: 38 API endpoints**

**Schema** (`acct_*` tables):
| Model | Purpose |
|-------|---------|
| `acct_chart_of_accounts` | Account definitions |
| `acct_ledger_accounts` | Runtime account instances |
| `acct_ledger_entries` | Debit/credit lines (immutable) |
| `acct_journal_entries` | Transaction groupings |
| `acct_financial_periods` | Monthly periods |
| `acct_expense_records` | Manual expenses |
| `acct_tax_summaries` | VAT period summaries |

---

## 2. Nigeria-First Compliance Assessment

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **NGN Currency** | Default throughout | ✅ |
| **7.5% VAT** | `VAT_7.5` tax code, auto-calculation | ✅ |
| **Cash-heavy business** | CASH, MOBILE_MONEY payment methods | ✅ |
| **Informal expense tracking** | Expense receipts, categories | ✅ |
| **Nigeria SME COA** | 56-account template | ✅ |
| **Mobile Money accounts** | OPay, PalmPay, etc. (1130) | ✅ |
| **POS Transaction Fees** | Account 6510 | ✅ |
| **Audit-friendly records** | Append-only, traceable | ✅ |

### 2.1 Chart of Accounts (Nigeria SME Template)

```
1xxx: Assets
  1110 - Cash on Hand
  1120 - Cash in Bank
  1130 - Mobile Money (OPay, PalmPay)
  1140 - POS Terminal Float
  1200 - Accounts Receivable
  1300 - Inventory
  
2xxx: Liabilities
  2110 - Accounts Payable
  2120 - VAT Payable (7.5%)
  2130 - Withholding Tax Payable
  2150 - Customer Deposits
  
3xxx: Equity
  3100 - Owner's Capital
  3200 - Retained Earnings
  3300 - Owner's Drawings
  
4xxx: Revenue
  4110 - POS Sales
  4120 - Online Sales
  4130 - Marketplace Sales
  
5xxx: Cost of Goods Sold
  5000 - COGS
  5100 - Inventory Purchases
  5300 - Inventory Adjustments
  
6xxx: Operating Expenses
  6100 - Rent
  6210 - Electricity (NEPA/DISCO)
  6220 - Internet & Data
  6300 - Salaries
  6510 - POS Transaction Fees
  6700 - Transport & Logistics
```

---

## 3. Integration with Frozen Suites

### 3.1 Event-to-Journal Mapping

The accounting module is designed to consume events from frozen suites:

| Source Suite | Event Type | Journal Entry |
|--------------|------------|---------------|
| **POS** | POS_SALE | Dr Cash 1110 / Cr Sales 4110 + VAT 2120 |
| **SVM** | SVM_ORDER | Dr Bank 1120 / Cr Sales 4120 + VAT 2120 |
| **MVM** | MVM_ORDER | Dr Bank 1120 / Cr Sales 4130 + VAT 2120 |
| **Inventory** | INVENTORY_ADJUSTMENT | Dr/Cr COGS 5300 / Cr/Dr Inventory 1300 |
| **Payments** | REFUND | Dr Sales Return 4400 / Cr Cash/Bank |
| **Billing** | (Not yet integrated) | Potential: Invoice journals |

### 3.2 Gap: Billing Integration

**Current State**: No direct integration with Billing Suite

**Opportunity**:
- Invoice creation → Journal entry (AR/Revenue)
- Invoice payment → Journal entry (Cash/AR)
- Credit note → Reversal entry

**Recommendation**: Add `BILLING_INVOICE` and `BILLING_PAYMENT` to `AcctJournalSourceType`

---

## 4. Capability Assessment

### 4.1 What Accounting (Light) IS

| Capability | Status | Notes |
|------------|--------|-------|
| Double-entry bookkeeping | ✅ | Debits = Credits enforced |
| Chart of Accounts | ✅ | Nigeria SME template |
| Journal entries | ✅ | Manual + event-sourced |
| Ledger accounts | ✅ | Runtime balances |
| Expense tracking | ✅ | With approval workflow |
| VAT summaries | ✅ | Period-based |
| Financial periods | ✅ | Open/close |
| P&L Statement | ✅ | Report generation |
| Balance Sheet | ✅ | Report generation |
| Trial Balance | ✅ | Report generation |
| Cash Flow | ✅ | Report generation |
| Offline support | ✅ | Sync expenses |

### 4.2 What Accounting (Light) is NOT

| Out of Scope | Reason |
|--------------|--------|
| Full ERP accounting | Too complex for SME target |
| Statutory filings | Requires regulatory integration |
| Bank reconciliation | Phase 2 enhancement |
| Multi-currency | Phase 2 enhancement |
| Payroll processing | Separate module |
| Fixed asset register | Phase 2 enhancement |
| Automated depreciation | Phase 2 enhancement |

---

## 5. S2-S6 Recommendation

### 5.1 Assessment

Given the **mature state** of the existing Accounting module, the standard S2-S6 process requires adaptation:

| Phase | Standard Action | Recommended Action |
|-------|-----------------|-------------------|
| S2 (Schema) | Add tables | **SKIP** - Schema complete |
| S3 (Services) | Create services | **REVIEW ONLY** - Services complete |
| S4 (API) | Create routes | **REVIEW ONLY** - Routes complete |
| S5 (Demo UI) | Create demo page | **CREATE** - `/accounting-demo` |
| S6 (Verify) | Test & freeze | **EXECUTE** - Full verification |

### 5.2 Recommended S2-S5 Scope (Condensed)

**S2-S4: Review & Gap Fill (Combined)**
1. Review existing services for PC-SCP compliance
2. Add Billing integration (if approved)
3. Verify capability guards on all APIs
4. Document any gaps

**S5: Demo Page**
1. Create `/accounting-demo` page
2. Show:
   - Chart of Accounts viewer
   - Journal entry demo
   - Expense tracking demo
   - VAT Calculator (reuse from Billing)
   - P&L / Balance Sheet preview
   - Nigeria-first info banner

**S6: Verification & Freeze**
1. Full testing agent verification
2. Documentation finalization
3. Formal FREEZE

---

## 6. Gap Register

| Gap ID | Description | Priority | Status |
|--------|-------------|----------|--------|
| GAP-001 | No `/accounting-demo` page | P1 | OPEN |
| GAP-002 | Billing suite not integrated | P2 | OPEN |
| GAP-003 | Dashboard UI needs polish | P3 | OPEN |
| GAP-004 | Missing capability guard audit | P1 | OPEN |

---

## 7. Files of Reference

| Path | Description |
|------|-------------|
| `/app/frontend/src/lib/accounting/` | Service layer (8 files) |
| `/app/frontend/src/app/api/accounting/` | API routes (38 endpoints) |
| `/app/frontend/prisma/schema.prisma` | `acct_*` models |
| `/app/frontend/src/app/dashboard/accounting/page.tsx` | Dashboard UI |
| `/app/frontend/src/lib/accounting/MODULE_MANIFEST.md` | Documentation |

---

## 8. Conclusion

**Accounting (Light) is ~90% complete** and significantly ahead of other pre-canonicalization suites. 

The module was built with:
- ✅ Nigeria-first design
- ✅ Double-entry integrity
- ✅ Event-sourced architecture
- ✅ Capability integration
- ✅ Comprehensive documentation

**Required for FREEZE**:
1. Create `/accounting-demo` page (S5)
2. Verify capability guards (S6)
3. Full testing verification (S6)

**Optional enhancements** (can be deferred):
- Billing suite integration
- Dashboard UI polish
- Bank reconciliation (Phase 2)

---

*Document prepared under PC-SCP guidelines*  
*S0-S1 Audit & Capability Map — COMPLETE*
