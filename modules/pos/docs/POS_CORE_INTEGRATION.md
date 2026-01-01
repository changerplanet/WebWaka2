# POS Core Integration Guide

## Version: pos-integration-v1.0.0

---

## Overview

This document describes how the POS module integrates with SaaS Core.

```
┌─────────────────┐         ┌─────────────────┐
│   POS MODULE    │ ──────▶ │   SaaS CORE     │
│   /modules/pos  │ events  │   /saas-core    │
└─────────────────┘         └─────────────────┘
        │                           │
        │                           ▼
        │                   ┌───────────────┐
        │                   │  Event        │
        │                   │  Handlers     │
        │                   └───────────────┘
        │                           │
        ▼                           ▼
  ┌───────────┐             ┌───────────────┐
  │ POS DB    │             │  Core DB      │
  │ (tables)  │             │  (audit,      │
  └───────────┘             │   inventory)  │
                            └───────────────┘
```

---

## Integration Points

### 1. Event Handlers

**Location:** `/app/saas-core/src/lib/pos-event-handlers.ts`

**Handlers:**
| Event | Handler | Action |
|-------|---------|--------|
| `pos.sale.completed` | `handleSaleCompleted` | Log audit, (future: deduct inventory) |
| `pos.sale.cancelled` | `handleSaleCancelled` | Log audit, (future: release inventory) |
| `pos.payment.captured` | `handlePaymentCaptured` | Record payment, log audit |
| `pos.refund.created` | `handleRefundCreated` | Log audit, (future: restore inventory) |

**Idempotency:** All handlers check `idempotencyKey` before processing.

---

### 2. API Routes

**Location:** `/app/saas-core/src/app/api/pos/`

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/pos/events` | POST | Receive events from POS |
| `/api/pos/entitlements` | GET | Return POS entitlements for tenant |

**Usage from POS Module:**
```typescript
// Submit event
await fetch('/api/pos/events', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'evt_123',
    eventType: 'pos.sale.completed',
    idempotencyKey: 'sale_123_completed',
    timestamp: new Date().toISOString(),
    payload: { ... }
  })
})

// Check entitlements
const resp = await fetch('/api/pos/entitlements?tenantId=xxx')
const { features, limits } = await resp.json()
```

---

### 3. Database Migration

**Script:** `/app/modules/pos/scripts/migrate-pos.sh`

**Prerequisites:**
1. Create `/app/modules/pos/.env` with `DATABASE_URL`
2. Get connection string from Supabase:
   - Project Settings → Database → Connection string (URI)

**Commands:**
```bash
# Generate Prisma client only
./scripts/migrate-pos.sh generate

# Push schema (development)
./scripts/migrate-pos.sh push

# Create migrations (production)
./scripts/migrate-pos.sh migrate

# Check status
./scripts/migrate-pos.sh status
```

**Tables Created:**
- `pos_registers`
- `pos_register_sessions`
- `pos_shifts`
- `pos_sales`
- `pos_sale_line_items`
- `pos_sale_discounts`
- `pos_payments`
- `pos_refunds`
- `pos_refund_items`
- `pos_layaways`
- `pos_layaway_items`
- `pos_layaway_payments`
- `pos_settings`
- `pos_discount_rules`

---

## Configuration Steps

### Step 1: Database Setup

```bash
# 1. Copy env template
cp /app/modules/pos/.env.example /app/modules/pos/.env

# 2. Edit .env and add DATABASE_URL
# DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# 3. Run migration
cd /app/modules/pos
./scripts/migrate-pos.sh push
```

### Step 2: Verify Integration

```bash
# Test event endpoint
curl -X POST http://localhost:3000/api/pos/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test_001",
    "eventType": "pos.sale.completed",
    "idempotencyKey": "test_sale_completed",
    "timestamp": "2026-01-01T12:00:00Z",
    "payload": {
      "saleId": "sale_test",
      "saleNumber": "S-TEST-001",
      "tenantId": "tenant_test",
      "staffId": "staff_test",
      "grandTotal": 25.00,
      "lineItems": [],
      "payments": []
    }
  }'

# Test entitlements endpoint
curl "http://localhost:3000/api/pos/entitlements?tenantId=tenant_test"
```

### Step 3: Enable POS for Tenant

To enable POS for a tenant, create an Entitlement record:

```sql
INSERT INTO "Entitlement" (
  id, "tenantId", module, status, source, limits, "validUntil", "createdAt", "updatedAt"
) VALUES (
  'ent_pos_tenant123',
  'tenant123',
  'POS',
  'ACTIVE',
  'SUBSCRIPTION',
  '{"max_registers": 2, "max_staff": 10, "max_locations": 1}',
  NULL,
  NOW(),
  NOW()
);
```

---

## Future Enhancements

### Inventory Integration

When the `InventoryLevel` model is added to Core:

```typescript
// In handleSaleCompleted:
for (const item of lineItems) {
  await prisma.inventoryLevel.updateMany({
    where: {
      tenantId,
      productId: item.productId,
      variantId: item.variantId || null
    },
    data: {
      available: { decrement: item.quantity },
      committed: { decrement: item.quantity }
    }
  })
}
```

### Payment Processing

When Stripe is integrated:

```typescript
// In handlePaymentCaptured:
if (method === 'CARD' && !corePaymentId) {
  // Create payment intent
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: 'usd',
    metadata: { saleId, tenantId }
  })
  // Update with corePaymentId
}
```

---

## Troubleshooting

### Event Not Processing

1. Check idempotency key - may already be processed
2. Check audit logs for `POS_EVENT_PROCESSED` entries
3. Verify event payload structure

### Entitlements Not Found

1. Verify `Entitlement` record exists for tenant
2. Check `module = 'POS'` and `status = 'ACTIVE'`
3. Check `validUntil` hasn't expired

### Migration Errors

1. Verify `DATABASE_URL` is correct
2. Check Supabase connection is allowed
3. Try `./scripts/migrate-pos.sh status` first

---

## Files Created

| File | Purpose |
|------|---------|
| `/saas-core/src/lib/pos-event-handlers.ts` | Event handling logic |
| `/saas-core/src/app/api/pos/events/route.ts` | Event API endpoint |
| `/saas-core/src/app/api/pos/entitlements/route.ts` | Entitlements API |
| `/modules/pos/scripts/migrate-pos.sh` | Database migration script |
| `/modules/pos/docs/POS_CORE_INTEGRATION.md` | This document |

---

## Summary

- ✅ Event handlers created for 4 event types
- ✅ API routes mounted at `/api/pos/*`
- ✅ Migration script ready (requires DATABASE_URL)
- ⏳ Inventory integration pending (Core model needed)
- ⏳ Payment processing pending (Stripe integration needed)
