# SVM Module - Shipping & Delivery Rules Documentation

## Phase 4 Overview

The Shipping & Delivery Rules feature provides flexible shipping configuration for the Single Vendor Marketplace module.

## Key Principles

1. **SVM calculates shipping fees** - All fee calculation happens in the SVM module
2. **Payment collection remains in Core** - SVM does NOT process payments
3. **Module isolation** - Shipping data is owned by SVM, uses tenant ID references

## Capabilities

### Zone-Based Shipping
- Define geographic zones by country, state, city, or postal code
- Priority-based zone matching (higher priority zones checked first)
- Default fallback zone for unmatched destinations

### Rate Types
- **FLAT** - Fixed shipping fee
- **WEIGHT_BASED** - Base fee + rate per weight unit
- **PRICE_BASED** - Percentage of order subtotal
- **ITEM_BASED** - Fee per item in cart

### Free Shipping Rules
- Per-rate free shipping thresholds
- Shows "amount to free shipping" when threshold not met
- Multiple thresholds per zone (e.g., Standard free at $50, Express free at $100)

### Product Restrictions
- Include/exclude specific products by ID
- Include/exclude product categories
- Weight and order total limits per rate

## API Endpoints

### Calculate Shipping
```
POST /api/svm/shipping
```
Calculates available shipping options for a cart.

**Request:**
```json
{
  "tenantId": "tenant_123",
  "destination": {
    "country": "US",
    "state": "CA",
    "city": "San Francisco",
    "postalCode": "94105"
  },
  "items": [
    { "productId": "prod_001", "quantity": 2, "unitPrice": 29.99, "weight": 0.5 }
  ],
  "subtotal": 59.98
}
```

**Response:**
```json
{
  "success": true,
  "matchedZone": { "id": "zone_xxx", "name": "US Domestic" },
  "options": [
    {
      "rateId": "rate_xxx",
      "rateName": "Standard Shipping",
      "carrier": "USPS",
      "fee": 0,
      "originalFee": 5.99,
      "isFree": true,
      "freeShippingApplied": true,
      "freeShippingThreshold": 50,
      "estimatedDays": { "min": 5, "max": 7 }
    }
  ],
  "cheapestOption": { ... },
  "fastestOption": { ... }
}
```

### List Shipping Zones
```
GET /api/svm/shipping?tenantId=xxx
```

### Create Zone
```
POST /api/svm/shipping/zones
```

### Get/Update/Delete Zone
```
GET /api/svm/shipping/zones/:zoneId?tenantId=xxx
PUT /api/svm/shipping/zones/:zoneId
DELETE /api/svm/shipping/zones/:zoneId?tenantId=xxx
```

### Update Zone Actions
```json
// UPDATE_ZONE - Update zone properties
{
  "tenantId": "xxx",
  "action": "UPDATE_ZONE",
  "name": "New Name",
  "priority": 100
}

// ADD_RATE - Add a new rate
{
  "tenantId": "xxx",
  "action": "ADD_RATE",
  "rate": {
    "name": "Express",
    "rateType": "FLAT",
    "flatRate": 12.99,
    "freeAbove": 100
  }
}

// UPDATE_RATE - Modify existing rate
{
  "tenantId": "xxx",
  "action": "UPDATE_RATE",
  "rateId": "rate_xxx",
  "rate": { "flatRate": 14.99 }
}

// DELETE_RATE - Remove a rate
{
  "tenantId": "xxx",
  "action": "DELETE_RATE",
  "rateId": "rate_xxx"
}
```

## Default Zones

When a tenant first uses the shipping API, default zones are auto-created:

### US Domestic (Priority: 100)
- **Standard Shipping**: $5.99, free above $50, 5-7 days (USPS)
- **Express Shipping**: $12.99, free above $100, 2-3 days (UPS)
- **Overnight**: $24.99, 1 day (FedEx)

### Canada (Priority: 90)
- **Standard Shipping**: $9.99, free above $75, 7-14 days (USPS)
- **Express Shipping**: $19.99, 3-5 days (UPS)

### International (Priority: 0, Default)
- **International Standard**: $19.99, 14-21 days (USPS)
- **International Express**: $39.99, 5-10 days (DHL)

## Zone Matching Priority

1. Zones are sorted by `priority` (descending)
2. First matching zone is selected
3. If no zone matches, the `isDefault: true` zone is used
4. Matching criteria (all must pass if defined):
   - Country match (case-insensitive)
   - State match (case-insensitive)
   - City match (case-insensitive)
   - Postal code match (supports prefix with `*`, e.g., `94*`)

## Integration with Order Flow

1. Customer adds items to cart
2. Customer enters shipping address
3. Frontend calls `POST /api/svm/shipping` to get options
4. Customer selects shipping option
5. Selected `rateId` and `fee` are passed to order creation
6. Order stores `shippingMethod` and `shippingTotal`
7. Payment is processed by Core (SVM does NOT handle payments)

## Files Reference

- `/saas-core/src/lib/shipping-storage.ts` - Shared storage (globalThis singleton)
- `/saas-core/src/app/api/svm/shipping/route.ts` - Calculate & list zones
- `/saas-core/src/app/api/svm/shipping/zones/route.ts` - Create zone
- `/saas-core/src/app/api/svm/shipping/zones/[zoneId]/route.ts` - CRUD operations
- `/modules/svm/src/lib/shipping-engine.ts` - Business logic classes
- `/modules/svm/prisma/schema.prisma` - ShippingZone & ShippingRate models

## Testing Verified

- ✅ Zone matching by country (US, CA)
- ✅ Default zone fallback (International)
- ✅ Free shipping thresholds
- ✅ Multiple rates per zone
- ✅ CRUD operations (create, read, update, delete zones)
- ✅ Rate management (add, update, delete rates)
- ✅ Weight-based calculations
- ✅ Cheapest/fastest option identification
- ✅ Delivery time estimates

## Current Limitations

- Storage is in-memory (not persisted to database yet)
- Calculated rates (carrier API integration) not implemented
- City-based matching requires exact string match
