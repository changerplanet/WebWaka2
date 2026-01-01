# Payout Readiness System

## Version
**Document Version:** 1.0.0  
**Date:** 2025-01-01  
**Status:** Implemented

---

## Overview

This document describes the Payout Readiness system for preparing partner payouts WITHOUT actual money movement.

### Key Principles

1. **Track payable balances** - Per-partner balance tracking
2. **Support payout thresholds** - Configurable minimums
3. **Support tax withholding hooks** - Tax calculations without execution
4. **NO payment gateway integration** - Only readiness and reporting
5. **NO actual payout execution** - Phase 5 is preparation only

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYOUT READINESS FLOW                        │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  Partner        │                                            │
│  │  Earnings       │                                            │
│  │  (CLEARED/      │                                            │
│  │  APPROVED)      │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              READINESS CHECKS                            │    │
│  │                                                          │    │
│  │   ☑ Partner Status (ACTIVE)                             │    │
│  │   ☑ Minimum Threshold (≥ $100)                          │    │
│  │   ☑ No Payout Hold                                      │    │
│  │   ☑ Tax Documentation                                   │    │
│  │   ☑ Payment Method                                      │    │
│  │   ☑ Active Agreement                                    │    │
│  │                                                          │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PAYOUT BATCH (DRAFT)                        │    │
│  │                                                          │    │
│  │   • Gross Amount                                         │    │
│  │   • Tax Withholding                                      │    │
│  │   • Net Amount                                           │    │
│  │   • Readiness Status                                     │    │
│  │                                                          │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              APPROVAL WORKFLOW                           │    │
│  │                                                          │    │
│  │   DRAFT → PENDING_APPROVAL → APPROVED → READY           │    │
│  │                                                          │    │
│  │   (PROCESSING, COMPLETED, FAILED = Phase 6+)            │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│                    NO MONEY MOVEMENT                             │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Payable Balance

### Balance Breakdown

| Field | Description |
|-------|-------------|
| `pending` | In clearance period (not yet payable) |
| `cleared` | Ready to be approved for payout |
| `approved` | Approved, waiting to be batched |
| `inBatch` | Already assigned to a payout batch |
| `totalPayable` | cleared + approved - inBatch |

### Example

```typescript
const balance = await getPayableBalance('partner_001')

// Result:
{
  partnerId: 'partner_001',
  partnerName: 'Acme Partners',
  pending: 250.00,      // In clearance
  cleared: 500.00,      // Ready for approval
  approved: 150.00,     // Approved
  inBatch: 100.00,      // In pending batch
  totalPayable: 550.00, // 500 + 150 - 100
  totalPaid: 1200.00,   // Historical
  currency: 'USD',
  minimumPayout: 100.00,
  meetsMinimum: true    // 550 >= 100
}
```

---

## Payout Thresholds

### Configuration

```typescript
interface PartnerPayoutSettings {
  minimumPayout: number      // Default: $100
  payoutFrequency: string    // WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY
  currency: string           // Default: USD
  
  // Tax withholding
  taxWithholdingEnabled: boolean
  taxWithholdingRate: number   // e.g., 0.30 = 30%
  taxDocumentStatus: string    // NOT_SUBMITTED, PENDING, VERIFIED, EXPIRED
  
  // Payment method
  paymentMethodType: string    // BANK_TRANSFER, PAYPAL, CHECK
  paymentMethodVerified: boolean
  
  // Hold status
  payoutHold: boolean
  payoutHoldReason: string
  payoutHoldUntil: Date
}
```

### Threshold Logic

```
IF totalPayable < minimumPayout THEN
  ❌ Cannot create payout batch
  
IF minimumPayout NOT configured THEN
  Use default: $100.00
```

---

## Tax Withholding Hooks

### How It Works

1. Partner submits tax documents (W-9, W-8BEN, etc.)
2. Platform verifies documents
3. If verified: apply configured withholding rate
4. If NOT verified: apply default withholding (30%)

### Calculation

```typescript
// If tax docs NOT verified:
taxWithholding = grossAmount × 0.30  // 30% default

// If tax docs verified:
taxWithholding = grossAmount × configuredRate

// Net amount:
netAmount = grossAmount - taxWithholding
```

### Example

```typescript
// Partner with unverified tax docs
grossAmount = $1000
taxWithholding = $1000 × 0.30 = $300
netAmount = $700

// Partner with verified docs (10% rate)
grossAmount = $1000
taxWithholding = $1000 × 0.10 = $100
netAmount = $900
```

---

## Readiness Checks

### Required Checks

| Check | Pass Condition | Failure Action |
|-------|----------------|----------------|
| `partner_status` | Partner is ACTIVE | Block payout |
| `minimum_threshold` | Balance ≥ minimum | Block payout |
| `payout_hold` | No active hold | Block payout |
| `tax_documentation` | Docs verified | Warning (still allows payout with withholding) |
| `payment_method` | Method verified | Warning (manual payout) |
| `active_agreement` | Agreement exists | Warning (historical earnings ok) |

### Check Results

```typescript
interface ReadinessCheck {
  check: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: Record<string, any>
}

// Example result:
{
  partnerId: 'partner_001',
  isReady: true,
  checks: [
    { check: 'partner_status', status: 'PASS', message: 'Partner is active' },
    { check: 'minimum_threshold', status: 'PASS', message: 'Amount 550 meets minimum 100' },
    { check: 'payout_hold', status: 'PASS', message: 'No payout hold active' },
    { check: 'tax_documentation', status: 'WARNING', message: 'Tax docs pending verification' },
    { check: 'payment_method', status: 'PASS', message: 'Payment method verified' },
    { check: 'active_agreement', status: 'PASS', message: 'Active agreement in place' }
  ],
  blockers: [],
  warnings: ['Tax documentation pending - full withholding will apply'],
  summary: {
    grossAmount: 550.00,
    taxWithholding: 165.00,  // 30% default
    netAmount: 385.00,
    earningsCount: 5
  }
}
```

---

## Payout Batch Lifecycle

### Status Flow

```
DRAFT → PENDING_APPROVAL → APPROVED → READY
                                         │
                              ┌──────────┴──────────┐
                              │   PHASE 6+          │
                              │   PROCESSING        │
                              │   COMPLETED/FAILED  │
                              └─────────────────────┘
```

### Batch Operations (Phase 5)

| Operation | Description | Allowed Statuses |
|-----------|-------------|------------------|
| Create | Create draft batch from earnings | - |
| Approve | Approve batch for payout | DRAFT, PENDING_APPROVAL |
| Cancel | Cancel and release earnings | DRAFT, PENDING_APPROVAL |

### Batch Schema

```typescript
interface PayoutBatch {
  batchNumber: string     // "PO-2025-000001"
  status: string          // DRAFT, APPROVED, etc.
  
  grossAmount: number     // Total before withholding
  taxWithholding: number  // Tax withheld
  netAmount: number       // Amount to be paid
  
  earningsCount: number   // Number of earnings
  
  readinessChecks: object // Snapshot of checks
  readinessStatus: string // READY, BLOCKED
}
```

---

## Reporting Views

### Partner Payout Report

```typescript
const report = await getPayoutReport(
  'partner_001',
  new Date('2025-01-01'),
  new Date('2025-12-31')
)

// Result:
{
  partnerId: 'partner_001',
  partnerName: 'Acme Partners',
  period: { start: '2025-01-01', end: '2025-12-31' },
  
  balance: {
    pending: 250.00,
    cleared: 500.00,
    approved: 150.00,
    totalPayable: 550.00,
    meetsMinimum: true
  },
  
  pendingBatches: [
    { batchNumber: 'PO-2025-000001', status: 'APPROVED', netAmount: 385.00 }
  ],
  
  paidBatches: [
    { batchNumber: 'PO-2024-000012', netAmount: 450.00, paidAt: '2024-12-15' }
  ],
  
  totalPending: 385.00,
  totalPaidThisPeriod: 0,
  totalPaidAllTime: 1200.00
}
```

### Platform Summary

```typescript
const summary = await getPlatformPayoutSummary(
  new Date('2025-01-01'),
  new Date('2025-12-31')
)

// Result:
{
  period: { start: '2025-01-01', end: '2025-12-31' },
  
  totalPartners: 50,
  partnersWithBalance: 35,
  partnersReadyForPayout: 20,
  partnersOnHold: 2,
  
  totalPending: 5000.00,
  totalCleared: 12000.00,
  totalApproved: 3000.00,
  totalInBatches: 2500.00,
  
  draftBatches: 5,
  approvedBatches: 3,
  
  currency: 'USD'
}
```

---

## API Reference

### Payout Settings

| Function | Description |
|----------|-------------|
| `getPayoutSettings(partnerId)` | Get or create settings |
| `updatePayoutSettings(partnerId, updates, updatedBy)` | Update settings |

### Balance

| Function | Description |
|----------|-------------|
| `getPayableBalance(partnerId)` | Get partner balance |
| `getAllPayableBalances(options)` | Get all partner balances |

### Readiness

| Function | Description |
|----------|-------------|
| `checkPayoutReadiness(partnerId, amount?)` | Full readiness check |

### Tax Withholding

| Function | Description |
|----------|-------------|
| `calculateTaxWithholding(grossAmount, settings)` | Calculate withholding |
| `updateTaxDocumentStatus(partnerId, status, docType, updatedBy)` | Update tax docs |

### Payout Hold

| Function | Description |
|----------|-------------|
| `applyPayoutHold(partnerId, reason, holdUntil?, appliedBy?)` | Apply hold |
| `releasePayoutHold(partnerId, releasedBy?)` | Release hold |

### Payout Batches

| Function | Description |
|----------|-------------|
| `createPayoutBatch(input)` | Create draft batch |
| `approvePayoutBatch(batchId, approvedBy)` | Approve batch |
| `cancelPayoutBatch(batchId, reason, cancelledBy)` | Cancel batch |

### Reporting

| Function | Description |
|----------|-------------|
| `getPayoutReport(partnerId, start, end)` | Partner report |
| `getPlatformPayoutSummary(start, end)` | Platform summary |

---

## Verification Checklist

### Payout Readiness ✅

- [x] Track payable balances per partner
- [x] Configurable minimum thresholds
- [x] Payout hold functionality
- [x] Readiness checks with blockers/warnings

### Tax Withholding ✅

- [x] Tax withholding rate configuration
- [x] Tax document status tracking
- [x] Default withholding for unverified docs
- [x] Withholding calculation (no actual deduction)

### Reporting ✅

- [x] Partner balance view
- [x] Partner payout report
- [x] Platform-wide summary
- [x] Batch status tracking

### NO Money Movement ✅

- [x] No payment gateway integration
- [x] No actual payout execution
- [x] PROCESSING/COMPLETED statuses not used
- [x] `EXECUTION_ENABLED: false` flag

---

## Implementation Files

| File | Description |
|------|-------------|
| `/prisma/schema.prisma` | PartnerPayoutSettings, enhanced PayoutBatch |
| `/src/lib/payout-readiness.ts` | Complete payout readiness service |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial implementation (no money movement) |
