# Commission & Earnings Engine

## Version
**Document Version:** 1.0.0  
**Date:** 2025-01-01  
**Status:** Implemented

---

## Overview

This document describes the Commission Model Engine and Partner Earnings Ledger for the SaaS Core.

### Key Principles

1. **Commission rules are declarative, not procedural** - No hardcoded logic
2. **Rules are versioned over time** - Agreement versions track rule changes
3. **No assumptions about pricing** - Flexible model supports any structure
4. **Earnings are append-only** - No direct edits allowed
5. **Full audit trail** - Every state change is logged

---

## Commission Model Engine

### Supported Models

| Model | Description | Use Case |
|-------|-------------|----------|
| `PERCENTAGE` | % of subscription amount | Standard revenue share |
| `FIXED` | Fixed amount per event | Per-seat or per-transaction |
| `TIERED` | Volume-based tiers | High-volume incentives |
| `HYBRID` | Combination of rules | Complex partner programs |

### Commission Triggers

| Trigger | When Fired | Example |
|---------|------------|---------|
| `ON_PAYMENT` | Any successful payment | Most common |
| `ON_ACTIVATION` | First payment only | One-time bonus |
| `ON_RENEWAL` | Recurring payments only | Ongoing revenue share |
| `ON_SIGNUP` | When subscription created | Sign-up bounty |

---

## Data Structures

### Agreement Configuration

```typescript
interface AgreementConfig {
  // Primary model
  commissionType: 'PERCENTAGE' | 'FIXED' | 'TIERED' | 'HYBRID'
  commissionTrigger: 'ON_PAYMENT' | 'ON_ACTIVATION' | 'ON_RENEWAL' | 'ON_SIGNUP'
  
  // For PERCENTAGE
  commissionRate?: number  // 0.15 = 15%
  
  // For FIXED
  fixedAmount?: number  // 10.00
  
  // One-time setup fee (any model)
  setupFee?: number  // 50.00
  
  // For TIERED
  commissionTiers?: CommissionTier[]
  
  // For HYBRID
  commissionRules?: { rules: HybridRule[] }
  
  // Caps
  minCommission?: number
  maxCommission?: number
  
  // Clearance period
  clearanceDays: number  // Default: 30
}
```

### Tiered Structure

```typescript
interface CommissionTier {
  minVolume: number      // Minimum cumulative volume
  maxVolume: number | null  // Maximum (null = unlimited)
  rate: number           // Rate for this tier
  fixedAmount?: number   // Optional fixed amount instead
}
```

### Hybrid Rules

```typescript
interface HybridRule {
  condition: {
    field: 'eventType' | 'grossAmount' | 'module' | 'isFirstPayment'
    operator: 'equals' | 'in' | 'gt' | 'gte' | 'lt' | 'lte'
    value: any
  }
  type: 'PERCENTAGE' | 'FIXED' | 'TIERED'
  rate?: number
  fixedAmount?: number
  tiers?: CommissionTier[]
}
```

---

## Examples

### Example 1: Simple 15% Commission

```typescript
const agreement = {
  commissionType: 'PERCENTAGE',
  commissionTrigger: 'ON_PAYMENT',
  commissionRate: 0.15,  // 15%
  clearanceDays: 30
}

// Input: $100 payment
// Output: $15.00 commission
```

### Example 2: Fixed $10 Per Renewal

```typescript
const agreement = {
  commissionType: 'FIXED',
  commissionTrigger: 'ON_RENEWAL',
  fixedAmount: 10.00,
  clearanceDays: 30
}

// Input: Any renewal
// Output: $10.00 commission
```

### Example 3: One-Time $50 Setup Fee

```typescript
const agreement = {
  commissionType: 'PERCENTAGE',
  commissionTrigger: 'ON_SIGNUP',
  commissionRate: 0,
  setupFee: 50.00,
  clearanceDays: 30
}

// Input: First payment
// Output: $50.00 commission
```

### Example 4: 10% + $25 Setup Fee

```typescript
const agreement = {
  commissionType: 'PERCENTAGE',
  commissionTrigger: 'ON_PAYMENT',
  commissionRate: 0.10,
  setupFee: 25.00,
  clearanceDays: 30
}

// Input: $100 first payment
// Output: $35.00 ($10 + $25)

// Input: $100 renewal
// Output: $10.00 (no setup fee)
```

### Example 5: Volume-Based Tiers

```typescript
const agreement = {
  commissionType: 'TIERED',
  commissionTrigger: 'ON_PAYMENT',
  commissionTiers: [
    { minVolume: 0, maxVolume: 10000, rate: 0.20 },      // 20% for < $10k
    { minVolume: 10000, maxVolume: 50000, rate: 0.15 },  // 15% for $10k-$50k
    { minVolume: 50000, maxVolume: null, rate: 0.10 }    // 10% for > $50k
  ],
  clearanceDays: 30
}

// Partner has $25,000 historical volume
// Input: $100 payment
// Output: $15.00 (Tier 2: 15%)
```

### Example 6: Hybrid Model

```typescript
const agreement = {
  commissionType: 'HYBRID',
  commissionTrigger: 'ON_PAYMENT',
  commissionRules: {
    rules: [
      {
        condition: { field: 'isFirstPayment', operator: 'equals', value: true },
        type: 'PERCENTAGE',
        rate: 0.25  // 25% on first payment
      },
      {
        condition: { field: 'eventType', operator: 'equals', value: 'SUBSCRIPTION_RENEWED' },
        type: 'PERCENTAGE',
        rate: 0.10  // 10% on renewals
      }
    ]
  },
  clearanceDays: 30
}

// Input: $100 first payment
// Output: $25.00 (Rule 1: 25%)

// Input: $100 renewal
// Output: $10.00 (Rule 2: 10%)
```

---

## Partner Earnings Ledger

### State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│ PENDING │───▶│ CLEARED │───▶│APPROVED │───▶│  PAID   │    │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    │
     │              │              │              │          │
     │              │              │              │          │
     ▼              ▼              ▼              ▼          │
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│ VOIDED  │    │DISPUTED │───▶│REVERSED │◀───┤REVERSED │    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    │
                    │                                         │
                    │         (back to CLEARED if resolved)   │
                    └─────────────────────────────────────────┘
```

### Status Definitions

| Status | Description | Next States |
|--------|-------------|-------------|
| `PENDING` | Created, in clearance period | CLEARED, VOIDED, DISPUTED |
| `CLEARED` | Clearance passed, ready for approval | APPROVED, DISPUTED, REVERSED |
| `APPROVED` | Approved for payout batch | PAID, DISPUTED, REVERSED |
| `PAID` | Payment processed | DISPUTED, REVERSED |
| `DISPUTED` | Under review | CLEARED, REVERSED, VOIDED |
| `REVERSED` | Reversed (terminal) | - |
| `VOIDED` | Voided before clearance (terminal) | - |

### Ledger Schema

```prisma
model PartnerEarning {
  id                  String           @id
  partnerId           String
  referralId          String
  agreementId         String
  
  // Entry type (CREDIT or DEBIT for reversals)
  entryType           EarningEntryType @default(CREDIT)
  
  // Idempotency
  idempotencyKey      String           @unique
  
  // Financial snapshot (IMMUTABLE)
  grossAmount         Decimal
  commissionType      CommissionType
  commissionRate      Decimal?
  fixedAmount         Decimal?
  commissionAmount    Decimal
  currency            String
  calculationDetails  Json?
  
  // Status
  status              EarningStatus    @default(PENDING)
  
  // State transition timestamps
  clearedAt           DateTime?
  approvedAt          DateTime?
  paidAt              DateTime?
  disputedAt          DateTime?
  reversedAt          DateTime?
  voidedAt            DateTime?
  
  // Reversals
  reversalEntryId     String?
  reversedById        String?
  reversalReason      String?
  
  // Audit
  createdAt           DateTime         @default(now())
  // NO updatedAt - append-only
}
```

### Idempotency Strategy

Every earning entry has a unique `idempotencyKey`:

```typescript
// For subscription events
idempotencyKey = `evt_${eventId}_comm`

// For reversals
idempotencyKey = `reversal_${originalEarningId}`

// For adjustments
idempotencyKey = `adj_${partnerId}_${timestamp}_${reason}`
```

If an entry with the same key already exists, the operation returns the existing entry instead of creating a duplicate.

### Reversal Strategy

**Reversals do NOT modify existing entries.** Instead, they:

1. Create a new DEBIT entry with negative amount
2. Mark the original entry as REVERSED
3. Link the two entries via `reversalEntryId`

```typescript
// Original entry
{ id: 'earn_001', commissionAmount: 15.00, entryType: 'CREDIT', status: 'REVERSED' }

// Reversal entry
{ id: 'earn_002', commissionAmount: -15.00, entryType: 'DEBIT', reversedById: 'earn_001' }
```

---

## API Reference

### Commission Engine

```typescript
import { calculateCommission } from '@/lib/commission-engine'

const result = calculateCommission(agreement, {
  eventType: 'SUBSCRIPTION_RENEWED',
  grossAmount: 100,
  currency: 'USD',
  periodStart: new Date(),
  periodEnd: new Date(),
  isFirstPayment: false
})

// Result:
{
  success: true,
  commissionAmount: 15.00,
  currency: 'USD',
  details: {
    commissionType: 'PERCENTAGE',
    formula: 'grossAmount × rate',
    inputs: { grossAmount: 100, rate: 0.15 },
    breakdown: [
      { component: 'base_percentage', amount: 15.00, calculation: '100 × 0.15 = 15.00' }
    ]
  }
}
```

### Earnings Ledger

```typescript
import { 
  createEarning,
  clearEarning,
  approveEarning,
  markEarningPaid,
  createReversalEntry,
  getPartnerEarnings,
  getLedgerSummary
} from '@/lib/earnings-ledger'

// Create earning
const earning = await createEarning({
  partnerId: 'partner_001',
  referralId: 'ref_001',
  agreementId: 'agr_001',
  subscriptionEventId: 'evt_001',
  idempotencyKey: 'evt_evt_001_comm',
  periodStart: new Date(),
  periodEnd: new Date(),
  grossAmount: 100,
  commissionType: 'PERCENTAGE',
  commissionRate: 0.15,
  commissionAmount: 15.00,
  currency: 'USD'
})

// State transitions
await clearEarning(earning.id)
await approveEarning(earning.id, 'admin_user_id')
await markEarningPaid(earning.id, {
  payoutBatchId: 'batch_001',
  paymentReference: 'txn_12345',
  paymentMethod: 'bank_transfer'
})

// Reversal
await createReversalEntry(earning.id, 'Chargeback received', 'admin_user_id')

// Queries
const { earnings, total } = await getPartnerEarnings('partner_001', {
  status: ['PENDING', 'CLEARED'],
  startDate: new Date('2025-01-01'),
  limit: 50
})

const summary = await getLedgerSummary('partner_001', startDate, endDate)
```

---

## Verification Checklist

### Commission Engine ✅

- [x] No hardcoded logic - all rules from agreement
- [x] Rules are declarative (configuration, not code)
- [x] No assumptions about pricing
- [x] Supports percentage, fixed, tiered, hybrid models
- [x] Setup fees supported
- [x] Min/max caps supported
- [x] Calculation details provided for audit

### Earnings Ledger ✅

- [x] Earnings are append-only
- [x] No direct edits allowed
- [x] Reversals create DEBIT entries
- [x] Idempotency prevents duplicates
- [x] Full state machine with valid transitions
- [x] Audit trail for all state changes
- [x] Linked to subscription events

---

## Implementation Files

| File | Description |
|------|-------------|
| `/prisma/schema.prisma` | Enhanced PartnerAgreement and PartnerEarning models |
| `/src/lib/commission-engine.ts` | Commission calculation strategies |
| `/src/lib/earnings-ledger.ts` | Append-only earnings ledger |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial implementation |
