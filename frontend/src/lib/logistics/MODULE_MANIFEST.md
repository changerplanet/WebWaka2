# MODULE 4: LOGISTICS & DELIVERY

**Version:** 1.0.0  
**Capability Key:** `logistics`  
**Status:** IMPLEMENTED

---

## MODULE CONSTITUTION

### This Module OWNS:
- ✅ Delivery configuration (tenant settings)
- ✅ Delivery zones and pricing logic
- ✅ Rider/delivery personnel management
- ✅ Delivery lifecycle tracking
- ✅ Status history (append-only)
- ✅ Proof of delivery records

### This Module DOES NOT OWN:
- ❌ Orders (referenced by ID only via events)
- ❌ Customers (referenced by ID only)
- ❌ Payments/Wallets (pricing is ADVISORY only)
- ❌ Communication/Messaging (delegates to Core engine)
- ❌ Products/Inventory

### EXPLICIT CONFIRMATIONS:
- ✅ **"Orders are not duplicated"** - Orders referenced by `orderId` only
- ✅ **"No payment or wallet logic"** - `estimatedFee` is advisory, no execution

---

## DATABASE TABLES (7)

All prefixed with `logistics_`:

| Table | Description |
|-------|-------------|
| `logistics_delivery_zones` | Geographic delivery areas |
| `logistics_delivery_pricing_rules` | Zone-based pricing logic |
| `logistics_delivery_agents` | Riders/delivery personnel |
| `logistics_delivery_assignments` | Order-to-rider assignments |
| `logistics_delivery_status_history` | Immutable status trail |
| `logistics_delivery_proofs` | Proof of delivery records |
| `logistics_configurations` | Tenant settings |

---

## DELIVERY ZONES (Phase 2)

### Zone Types:
- `CITY` - City-based zone
- `LGA` - Local Government Area (Nigeria-specific)
- `STATE` - State-based zone
- `DISTANCE` - Distance from origin
- `CUSTOM` - Custom polygon

### Pricing Types:
- `FLAT_RATE` - Fixed delivery fee
- `DISTANCE_BASED` - Fee per km
- `WEIGHT_BASED` - Fee per kg
- `ORDER_VALUE` - Percentage of order
- `TIERED` - Tiered pricing brackets

### Default Nigerian Zones:
- Lagos Island, Lagos Mainland, Ikeja, Lekki, Victoria Island
- Abuja Central
- Port Harcourt
- Ibadan
- Kano

---

## DELIVERY WORKFLOW (Phase 3)

### Status Flow:
```
PENDING → ASSIGNED → ACCEPTED → PICKING_UP → PICKED_UP → IN_TRANSIT → ARRIVING → DELIVERED
                ↓                     ↓              ↓                       ↓
            (reassign)            FAILED          RETURNED                FAILED
                                    ↓                                       ↓
                                PENDING                                  RETURNED
                                    
CANCELLED (can occur from most states)
```

### Priorities:
- `STANDARD` - Default
- `EXPRESS` - Faster delivery
- `SAME_DAY` - Same day delivery
- `NEXT_DAY` - Next business day

---

## RIDER MANAGEMENT (Phase 4)

### Agent Types:
- `IN_HOUSE` - Company employee
- `FREELANCE` - Freelance rider
- `THIRD_PARTY` - 3PL provider rider

### Agent Availability:
- `AVAILABLE` - Ready for assignments
- `BUSY` - On a task
- `OFFLINE` - Not working
- `ON_DELIVERY` - Currently delivering

### Nigeria-First Features:
- Phone number as primary identifier
- No email required
- Vehicle tracking (motorcycle, bicycle, car, van, truck)
- Bank details for future payouts (NOT payroll)

---

## PROOF OF DELIVERY (Phase 5)

### Proof Types:
- `PHOTO` - Delivery photo
- `SIGNATURE` - Customer signature
- `PIN_CODE` - 4-digit PIN verification
- `OTP` - 6-digit OTP verification
- `RECIPIENT_NAME` - Recipient confirmation
- `NOTES` - Delivery notes

### Verification:
- PINs and OTPs are hashed before storage
- Verification is secure comparison

---

## EVENT PROCESSING (Phase 7)

### Events Consumed:
| Event | Action |
|-------|--------|
| `ORDER_READY_FOR_DELIVERY` | Create delivery assignment |
| `ORDER_CANCELLED` | Cancel delivery assignment |

### Events Emitted:
| Event | Trigger |
|-------|---------|
| `DELIVERY_ASSIGNED` | Rider assigned to delivery |
| `DELIVERY_PICKED_UP` | Order collected |
| `DELIVERY_IN_TRANSIT` | On the way |
| `DELIVERY_COMPLETED` | Successfully delivered |
| `DELIVERY_FAILED` | Delivery failed |

### Idempotency:
- Events tracked by `{eventType}:{orderId}:{orderType}`
- Duplicate processing prevented

---

## OFFLINE SUPPORT (Phase 6)

### Offline-Safe Actions:
- Status updates (queued)
- Proof capture (queued)
- Location updates (queued)

### Sync Rules:
- Idempotent (offlineId tracking)
- Conflict resolution by timestamp + status precedence
- Higher status precedence wins ties

### Status Precedence:
```
DELIVERED (10) > RETURNED (9) = CANCELLED (9) > FAILED (8) > 
ARRIVING (7) > IN_TRANSIT (6) > PICKED_UP (5) > PICKING_UP (4) > 
ACCEPTED (3) > ASSIGNED (2) > PENDING (1)
```

---

## ENTITLEMENTS (Phase 8)

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Logistics Enabled | ❌ | ✅ | ✅ | ✅ |
| Max Zones | 0 | 5 | 20 | Unlimited |
| Max Riders | 0 | 5 | 20 | Unlimited |
| Daily Assignments | 0 | 50 | 200 | Unlimited |
| Auto-Assignment | ❌ | ❌ | ✅ | ✅ |
| Real-Time Tracking | ❌ | ❌ | ✅ | ✅ |
| Express Delivery | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ |

---

## API ENDPOINTS

### Configuration
- `GET /api/logistics` - Get configuration
- `POST /api/logistics` - Initialize logistics
- `PUT /api/logistics` - Update configuration

### Zones
- `GET /api/logistics/zones` - List zones
- `POST /api/logistics/zones` - Create zone
- `GET /api/logistics/zones/[id]` - Get zone
- `PUT /api/logistics/zones/[id]` - Update zone
- `DELETE /api/logistics/zones/[id]` - Delete zone
- `POST /api/logistics/zones/[id]/pricing` - Add pricing rule
- `GET /api/logistics/zones/quote` - Calculate delivery quote

### Agents
- `GET /api/logistics/agents` - List agents
- `POST /api/logistics/agents` - Create agent
- `GET /api/logistics/agents/[id]` - Get agent
- `PUT /api/logistics/agents/[id]` - Update agent
- `DELETE /api/logistics/agents/[id]` - Terminate agent
- `PUT /api/logistics/agents/[id]/availability` - Update availability
- `PUT /api/logistics/agents/[id]/location` - Update location
- `GET /api/logistics/agents/[id]/performance` - Get metrics

### Assignments
- `GET /api/logistics/assignments` - List assignments
- `POST /api/logistics/assignments` - Create assignment
- `GET /api/logistics/assignments/[id]` - Get assignment
- `PUT /api/logistics/assignments/[id]` - Update assignment
- `POST /api/logistics/assignments/[id]/assign` - Assign agent
- `POST /api/logistics/assignments/[id]/status` - Update status
- `POST /api/logistics/assignments/[id]/proof` - Capture proof
- `POST /api/logistics/assignments/[id]/rate` - Rate delivery
- `POST /api/logistics/assignments/[id]/cancel` - Cancel

### Utilities
- `GET /api/logistics/utils?resource=entitlements` - Get entitlements
- `GET /api/logistics/utils?resource=statistics` - Get statistics
- `GET /api/logistics/offline` - Get offline package
- `POST /api/logistics/offline/sync` - Sync offline changes
- `POST /api/logistics/events` - Process event
- `GET /api/logistics/validate` - Validate module

---

## SERVICE FILES

1. `zone-service.ts` - Zone & pricing management
2. `agent-service.ts` - Rider management
3. `assignment-service.ts` - Delivery workflow
4. `proof-service.ts` - Proof of delivery
5. `event-service.ts` - Event processing
6. `offline-service.ts` - Offline support
7. `entitlements-service.ts` - Feature gating
8. `config-service.ts` - Configuration
9. `validation-service.ts` - Module validation

---

## NIGERIA-FIRST FEATURES

- ✅ LGA-based zoning (Local Government Areas)
- ✅ Informal address support (landmarks)
- ✅ Phone-first rider identification
- ✅ Offline-capable mobile workflows
- ✅ NGN as default currency
- ✅ Support for informal delivery methods

---

## MODULE TAG

```
logistics-v1.0.0
```
