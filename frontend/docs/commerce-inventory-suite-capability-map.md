# Inventory & Stock Control Suite — S0-S1 Capability Mapping

**Date:** January 6, 2026  
**Phase:** S0 (Context Confirmation) + S1 (Capability Mapping)  
**Status:** COMPLETE — Awaiting S2 Approval

---

## S0: Context Confirmation

### Suite Intent

**What Inventory & Stock Control IS:**
- A centralized stock management system for tracking quantities across locations
- A warehouse operations module for multi-location businesses
- An intelligent reorder system for proactive stock replenishment
- A stock audit workflow for variance detection and correction
- A transfer management system for inter-warehouse movements
- An offline-capable system for environments with intermittent connectivity

**What Inventory & Stock Control is NOT:**
- ❌ A full ERP system (no manufacturing, no MRP)
- ❌ A supply chain management system (no supplier portals, no EDI)
- ❌ A demand forecasting engine (basic velocity only)
- ❌ A barcode/RFID scanning system (API-ready but not included)
- ❌ An accounting module (integrates with accounting, doesn't replace it)

### Target Customers

| Customer Type | Use Case |
|---------------|----------|
| Retail Stores | Multi-branch stock visibility, inter-store transfers |
| Wholesalers/Distributors | Warehouse operations, bulk movement tracking |
| Supermarkets | Shelf replenishment, low-stock alerts |
| E-commerce Fulfillment | Pick/pack operations, bin management |
| Pharmacies | Batch/lot tracking, expiry management |
| Restaurants/Hotels | Ingredients inventory, par-level ordering |

### Nigeria-First Assumptions

| Assumption | Implementation |
|------------|----------------|
| Informal suppliers | Phone/WhatsApp contact fields, manual order placement |
| Power outages | Full offline mode with queue-based sync |
| Multiple locations | LGA and State codes for warehouse addressing |
| Cash-heavy operations | No automated payment integration assumed |
| Manual fulfillment | Default `orderMethod: 'MANUAL'` for reorder |
| Low connectivity | Offline-first architecture, conflict resolution |

---

## S0: Current State Assessment

### CRITICAL FINDING: Module Already Exists

The Inventory & Warehouse Management module was built as **"MODULE 1"** prior to the PC-SCP standardization program. It is documented as:

> **Status: VALIDATED & FROZEN (January 2, 2026)**

This module was built with proper separation from Core:
- 9 module-specific tables (`inv_*`)
- 9 warehouse tables (`wh_*`) 
- 31 API endpoints
- Event-driven architecture (emits events for Core to process)
- Entitlements system
- Offline sync capability

### Schema Inventory

#### Module Tables (inv_*)
| Table | Purpose | Status |
|-------|---------|--------|
| `inv_warehouses` | Extended warehouse metadata | ✅ EXISTS |
| `inv_stock_movements` | Immutable audit trail | ✅ EXISTS |
| `inv_stock_transfers` | Transfer requests | ✅ EXISTS |
| `inv_stock_transfer_items` | Transfer line items | ✅ EXISTS |
| `inv_reorder_rules` | Reorder configuration | ✅ EXISTS |
| `inv_reorder_suggestions` | Generated suggestions | ✅ EXISTS |
| `inv_audits` | Stock count workflows | ✅ EXISTS |
| `inv_audit_items` | Audit line items | ✅ EXISTS |
| `inv_supplier_replenishment_rules` | Supplier rules | ✅ EXISTS |

#### Warehouse Tables (wh_*)
| Table | Purpose | Status |
|-------|---------|--------|
| `wh_zone` | Warehouse zones (receiving, storage, shipping) | ✅ EXISTS |
| `wh_bin` | Bin/slot locations within zones | ✅ EXISTS |
| `wh_batch` | Batch/lot tracking | ✅ EXISTS |
| `wh_receipt` | Goods receipt headers | ✅ EXISTS |
| `wh_receipt_item` | Goods receipt line items | ✅ EXISTS |
| `wh_putaway_task` | Putaway work queue | ✅ EXISTS |
| `wh_pick_list` | Pick list headers | ✅ EXISTS |
| `wh_pick_list_item` | Pick list line items | ✅ EXISTS |
| `wh_stock_movement` | Comprehensive movement log | ✅ EXISTS |

**Total Tables:** 18 (9 `inv_*` + 9 `wh_*`)

### Service Inventory

| Service | File | Status |
|---------|------|--------|
| Warehouse Service | `/lib/inventory/warehouse-service.ts` | ✅ EXISTS |
| Transfer Service | `/lib/inventory/transfer-service.ts` | ✅ EXISTS |
| Reorder Service | `/lib/inventory/reorder-service.ts` | ✅ EXISTS |
| Audit Service | `/lib/inventory/audit-service.ts` | ✅ EXISTS |
| Event Service | `/lib/inventory/event-service.ts` | ✅ EXISTS |
| Event Emitter | `/lib/inventory/event-emitter.ts` | ✅ EXISTS |
| Entitlements Service | `/lib/inventory/entitlements-service.ts` | ✅ EXISTS |
| Offline Sync Service | `/lib/inventory/offline-sync-service.ts` | ✅ EXISTS |

### API Route Inventory

| Route Group | Endpoints | Status |
|-------------|-----------|--------|
| `/api/inventory/warehouses` | 4+ | ✅ EXISTS |
| `/api/inventory/transfers` | 9+ | ✅ EXISTS |
| `/api/inventory/reorder-rules` | 5+ | ✅ EXISTS |
| `/api/inventory/reorder-suggestions` | 5+ | ✅ EXISTS |
| `/api/inventory/audits` | 10+ | ✅ EXISTS |
| `/api/inventory/offline` | 3+ | ✅ EXISTS |
| `/api/inventory/low-stock` | 1 | ✅ EXISTS |
| `/api/inventory/events` | 1 | ✅ EXISTS |
| `/api/inventory/entitlements` | 2 | ✅ EXISTS |

**Total Endpoints:** ~40+

### UI Assessment

| Component | Status |
|-----------|--------|
| Warehouse Management UI | ⚠️ UNKNOWN - Needs audit |
| Transfer Management UI | ⚠️ UNKNOWN - Needs audit |
| Audit Workflow UI | ⚠️ UNKNOWN - Needs audit |
| Reorder Dashboard UI | ⚠️ UNKNOWN - Needs audit |
| Low Stock Alerts UI | ⚠️ UNKNOWN - Needs audit |
| Demo Page | ❌ NOT EXISTS |

---

## S1: Capability Mapping

### Capability Categories

#### 1. Stock Visibility (8 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_stock_levels` | View current stock by location | Core InventoryLevel | ✅ |
| `inv_stock_history` | View stock movement history | inv_stock_movements | ✅ |
| `inv_multi_location` | Track stock across locations | inv_warehouses + Core | ✅ |
| `inv_low_stock_alerts` | Automated low stock notifications | API exists | ✅ |
| `inv_stock_valuation` | Calculate stock value (FIFO/LIFO/Avg) | 🔲 GAP |
| `inv_stock_aging` | Track stock age and shelf life | wh_batch | ✅ |
| `inv_reserved_stock` | Track allocated vs available | Core InventoryLevel | ✅ |
| `inv_stock_snapshot` | Point-in-time stock reports | inv_stock_movements | ✅ |

#### 2. Warehouse Operations (12 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_warehouse_crud` | Create/manage warehouses | inv_warehouses | ✅ |
| `inv_zone_management` | Define warehouse zones | wh_zone | ✅ |
| `inv_bin_management` | Define bin locations | wh_bin | ✅ |
| `inv_goods_receiving` | Receive goods workflow | wh_receipt | ✅ |
| `inv_putaway_tasks` | Put-away work queue | wh_putaway_task | ✅ |
| `inv_pick_lists` | Generate pick lists | wh_pick_list | ✅ |
| `inv_packing_slip` | Generate packing slips | 🔲 GAP |
| `inv_batch_tracking` | Track batches/lots | wh_batch | ✅ |
| `inv_expiry_tracking` | Track expiration dates | wh_batch.expiryDate | ✅ |
| `inv_serial_tracking` | Track individual units | 🔲 GAP (v2) |
| `inv_cycle_counting` | Scheduled partial counts | inv_audits | ✅ |
| `inv_full_physical_count` | Complete warehouse count | inv_audits | ✅ |

#### 3. Stock Transfers (6 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_transfer_request` | Request inter-warehouse transfer | inv_stock_transfers | ✅ |
| `inv_transfer_approval` | Approve/reject transfers | API exists | ✅ |
| `inv_transfer_ship` | Ship transfer | API exists | ✅ |
| `inv_transfer_receive` | Receive transfer | API exists | ✅ |
| `inv_transfer_variance` | Track receiving variance | inv_stock_transfer_items | ✅ |
| `inv_transfer_history` | View transfer history | API exists | ✅ |

#### 4. Stock Adjustments (5 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_manual_adjustment` | Manual stock +/- | inv_stock_movements | ✅ |
| `inv_adjustment_approval` | Require approval for adjustments | Event system | ✅ |
| `inv_adjustment_reasons` | Configurable adjustment reasons | Enum StockMovementReason | ✅ |
| `inv_writeoff` | Write off damaged/lost stock | inv_stock_movements | ✅ |
| `inv_adjustment_audit` | Audit trail for adjustments | inv_stock_movements | ✅ |

#### 5. Reorder Intelligence (7 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_reorder_point` | Define min stock levels | inv_reorder_rules | ✅ |
| `inv_reorder_quantity` | Define reorder quantities | inv_reorder_rules | ✅ |
| `inv_auto_suggestions` | Auto-generate reorder suggestions | inv_reorder_suggestions | ✅ |
| `inv_velocity_reorder` | Velocity-based reorder points | Service logic | ✅ |
| `inv_lead_time` | Track supplier lead times | inv_reorder_rules | ✅ |
| `inv_safety_stock` | Calculate safety stock | Service logic | ✅ |
| `inv_supplier_assignment` | Assign preferred suppliers | inv_supplier_replenishment_rules | ✅ |

#### 6. Stock Audits (6 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_audit_create` | Create audit sessions | inv_audits | ✅ |
| `inv_audit_workflow` | Multi-step audit workflow | State machine | ✅ |
| `inv_audit_counts` | Record counted quantities | inv_audit_items | ✅ |
| `inv_audit_variance` | Calculate variance | API exists | ✅ |
| `inv_audit_approval` | Approve audit results | Event system | ✅ |
| `inv_audit_auto_adjust` | Auto-apply approved adjustments | Event system | ✅ |

#### 7. Offline & Sync (4 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_offline_mode` | Work without connectivity | offline-sync-service | ✅ |
| `inv_offline_queue` | Queue operations offline | Service exists | ✅ |
| `inv_sync_resolution` | Resolve sync conflicts | Service exists | ✅ |
| `inv_sync_status` | Monitor sync progress | Service exists | ✅ |

#### 8. Entitlements (8 capabilities)

| Capability | Description | Reuse | Status |
|------------|-------------|-------|--------|
| `inv_entitlement_warehouses` | Limit warehouse count | entitlements-service | ✅ |
| `inv_entitlement_transfers` | Limit monthly transfers | entitlements-service | ✅ |
| `inv_entitlement_audits` | Limit monthly audits | entitlements-service | ✅ |
| `inv_entitlement_reorder` | Enable auto-reorder | entitlements-service | ✅ |
| `inv_entitlement_velocity` | Enable velocity-based reorder | entitlements-service | ✅ |
| `inv_entitlement_offline` | Enable offline mode | entitlements-service | ✅ |
| `inv_entitlement_batch` | Enable batch/lot tracking | entitlements-service | ✅ |
| `inv_entitlement_rules` | Limit reorder rules | entitlements-service | ✅ |

---

## S1: Gap Analysis

### Gaps Identified

| Gap ID | Description | Priority | Notes |
|--------|-------------|----------|-------|
| GAP-INV-001 | Stock valuation (FIFO/LIFO/Avg) | P2 | Accounting integration |
| GAP-INV-002 | Packing slip generation | P2 | PDF generation needed |
| GAP-INV-003 | Serial number tracking | P3 | v2 feature |
| GAP-INV-004 | Capability guard on APIs | P0 | **PC-SCP COMPLIANCE** |
| GAP-INV-005 | Demo page for inventory | P1 | Required for S5 |
| GAP-INV-006 | UI audit (verify all components exist) | P1 | Unknown state |

### Critical Gap: Capability Guard

The existing inventory APIs at `/api/inventory/*` do **NOT** appear to use the capability guard pattern established in PC-SCP. This is a **P0 compliance issue**.

**UPDATE S2-S4 COMPLETE:** All 31 inventory API routes now have capability guards integrated. The pattern matches the MVM implementation:

```typescript
// Capability guard
const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
if (guardResult) return guardResult;
```

**Routes Updated (31 total):**
- `/api/inventory/warehouses/` (GET, POST)
- `/api/inventory/warehouses/[id]/` (GET, PATCH, DELETE)
- `/api/inventory/transfers/` (GET, POST)
- `/api/inventory/transfers/[id]/` (GET)
- `/api/inventory/transfers/[id]/submit/` (POST)
- `/api/inventory/transfers/[id]/approve/` (POST)
- `/api/inventory/transfers/[id]/reject/` (POST)
- `/api/inventory/transfers/[id]/ship/` (POST)
- `/api/inventory/transfers/[id]/receive/` (POST)
- `/api/inventory/transfers/[id]/cancel/` (POST)
- `/api/inventory/reorder-rules/` (GET, POST)
- `/api/inventory/reorder-rules/[id]/` (PATCH, DELETE)
- `/api/inventory/reorder-suggestions/` (GET, POST)
- `/api/inventory/reorder-suggestions/[id]/approve/` (POST)
- `/api/inventory/reorder-suggestions/[id]/reject/` (POST)
- `/api/inventory/audits/` (GET, POST)
- `/api/inventory/audits/[id]/` (GET)
- `/api/inventory/audits/[id]/start/` (POST)
- `/api/inventory/audits/[id]/counts/` (POST)
- `/api/inventory/audits/[id]/submit/` (POST)
- `/api/inventory/audits/[id]/approve/` (POST)
- `/api/inventory/audits/[id]/recount/` (POST)
- `/api/inventory/audits/[id]/cancel/` (POST)
- `/api/inventory/audits/[id]/variance/` (GET)
- `/api/inventory/offline/` (GET, POST)
- `/api/inventory/offline/sync/` (POST)
- `/api/inventory/offline/conflicts/` (GET, POST)
- `/api/inventory/events/` (GET)
- `/api/inventory/entitlements/` (GET)
- `/api/inventory/entitlements/check/` (POST)
- `/api/inventory/low-stock/` (GET)

---

## S1: Reuse Analysis

### Reuse from Other Suites

| Source | What | Reuse Level |
|--------|------|-------------|
| **Core** | InventoryLevel model | 100% - Single source of truth |
| **Core** | Product, ProductVariant | 100% - Reference by ID |
| **Core** | Location model | 100% - Warehouse extends Location |
| **Core** | Supplier model | 100% - Reference for reorder |
| **POS** | Stock decrement on sale | 100% - Event-driven |
| **SVM** | Stock reservation on order | 100% - Event-driven |
| **MVM** | Vendor stock isolation | 100% - Event-driven |
| **Accounting** | Stock valuation | 0% - GAP-INV-001 |

### What This Module Adds

The Inventory module adds **intelligence and workflow** on top of Core:
- **Warehouses** extend Locations with operational metadata
- **Transfers** orchestrate multi-step stock movements
- **Audits** provide variance detection and correction
- **Reorder** provides proactive replenishment intelligence
- **Offline** enables operations without connectivity

**"Inventory tables remain Core-owned. This module adds intelligence, not duplication."**

---

## S1: Guardrails

### What Will NOT Be Built

| Excluded Feature | Reason |
|------------------|--------|
| Manufacturing/MRP | Out of scope (future Light Manufacturing suite) |
| Demand forecasting | AI/ML required (future enhancement) |
| Supplier portals | Out of scope (future Procurement suite) |
| EDI integration | Out of scope |
| Barcode/RFID hardware | API-ready but not included |
| Automated purchasing | Manual approval required for Nigeria context |

### Architecture Constraints

1. **Core InventoryLevel is the ONLY source of truth for quantities**
2. **This module tracks MOVEMENTS, not STATE**
3. **All quantity changes emit events for Core to process**
4. **Module tables can be dropped without breaking POS/SVM/MVM**

---

## S1: Capability Count Summary

| Category | Capabilities | Status |
|----------|-------------|--------|
| Stock Visibility | 8 | 7 ✅, 1 GAP |
| Warehouse Operations | 12 | 10 ✅, 2 GAP |
| Stock Transfers | 6 | 6 ✅ |
| Stock Adjustments | 5 | 5 ✅ |
| Reorder Intelligence | 7 | 7 ✅ |
| Stock Audits | 6 | 6 ✅ |
| Offline & Sync | 4 | 4 ✅ |
| Entitlements | 8 | 8 ✅ |
| **TOTAL** | **56** | **53 ✅, 3 GAP** |

**Reuse Rate:** ~94% (53/56 capabilities already exist)

---

## S0-S1 Recommendation

### Assessment

The Inventory & Stock Control module is **substantially complete** from a pre-PC-SCP build. Unlike MVM which required S0-S6 from scratch, this module requires:

1. **S2 (Schema)**: Already exists — No changes needed
2. **S3 (Services)**: Already exists — No changes needed
3. **S4 (APIs)**: ✅ **COMPLETE** — All 31 routes now have capability guards
4. **S5 (UI + Demo)**: Needs audit + demo page creation
5. **S6 (Verification)**: Full end-to-end verification

### S2-S4 Completion Summary

**Date:** January 6, 2026

All 31 inventory API routes have been updated with PC-SCP compliant capability guards:

| Category | Routes Updated |
|----------|----------------|
| Warehouses | 2 route files (5 handlers) |
| Transfers | 8 route files (9 handlers) |
| Reorder Rules | 2 route files (4 handlers) |
| Reorder Suggestions | 3 route files (4 handlers) |
| Audits | 8 route files (10 handlers) |
| Offline | 3 route files (5 handlers) |
| Events | 1 route file (1 handler) |
| Entitlements | 2 route files (2 handlers) |
| Low Stock | 1 route file (1 handler) |
| **TOTAL** | **31 route files (~41 handlers)** |

**Capability Key:** `inventory`  
**Guard Function:** `checkCapabilityForSession(tenantId, 'inventory')`

### Estimated Remaining Effort

- **S5**: Medium (UI audit + demo page)
- **S6**: Low (verification)

**🛑 STOP POINT: Awaiting user approval before proceeding to S5 (UI + Demo)**

---

## Deliverables

- ✅ `/app/frontend/docs/commerce-inventory-suite-capability-map.md` (this document)
- ✅ 56 capabilities mapped
- ✅ 6 gaps identified (3 P0/P1, 3 P2/P3)
- ✅ Reuse analysis complete
- ✅ Guardrails documented

---

**🛑 STOP POINT: Awaiting user approval before proceeding to S2-S4 (Capability Guard Integration)**

---

## Appendix: File Inventory

### Schema
- `/app/frontend/prisma/schema.prisma` — 18 inventory/warehouse tables

### Services
- `/app/frontend/src/lib/inventory/warehouse-service.ts`
- `/app/frontend/src/lib/inventory/transfer-service.ts`
- `/app/frontend/src/lib/inventory/reorder-service.ts`
- `/app/frontend/src/lib/inventory/audit-service.ts`
- `/app/frontend/src/lib/inventory/event-service.ts`
- `/app/frontend/src/lib/inventory/event-emitter.ts`
- `/app/frontend/src/lib/inventory/entitlements-service.ts`
- `/app/frontend/src/lib/inventory/offline-sync-service.ts`
- `/app/frontend/src/lib/inventory/types.ts`
- `/app/frontend/src/lib/inventory/index.ts`

### API Routes
- `/app/frontend/src/app/api/inventory/*` (~40 endpoints)

### Documentation
- `/app/frontend/src/lib/inventory/MODULE_MANIFEST.md`
