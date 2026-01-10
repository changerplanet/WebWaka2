# Advanced Warehouse Suite — S0–S1 Capability Mapping

## Document Info
- **Phase**: 7C.3
- **Stage**: S0–S1 (Capability Mapping Only)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: January 6, 2026
- **Implementation**: NOT YET AUTHORIZED

---

## 1️⃣ Suite Overview

### What is the Advanced Warehouse Suite?

The **Advanced Warehouse Suite** extends WebWaka's existing Inventory module to provide **multi-location, structured warehouse operations** for Nigerian businesses that have outgrown basic inventory tracking but do not need heavy ERP complexity.

> **Key Principle**: This is an EXTENSION of existing inventory capabilities, not a replacement.
> Think: Odoo-level warehouse operations, Nigeria-first.

### Target Nigerian Use Cases

| Segment | Examples | Primary Use Cases |
|---------|----------|-------------------|
| **Distributors & Wholesalers** | FMCG distributors, beverage wholesalers | Multi-depot stock management, bulk transfers |
| **E-commerce Fulfillment** | Jumia/Konga-style ops, SME e-commerce | Pick-pack-ship, order fulfillment |
| **Pharma & Medical Supply** | Drug distributors, medical supply chains | Batch/expiry tracking, NAFDAC compliance |
| **Construction Material Yards** | Building materials depots, cement distributors | Heavy item handling, yard management |
| **NGO Logistics Hubs** | Aid distribution centers, donor warehouses | Donor-funded inventory, distribution tracking |
| **Importers with Multiple Depots** | Container clearing agents, import distributors | Receiving, quality inspection, redistribution |
| **Regional Distribution** | Lagos → Ibadan → Abuja → PH networks | Inter-warehouse transfers, regional replenishment |

### Problems Solved

1. **Single-Location Limitations**: Current inventory is location-aware but lacks warehouse-level structure
2. **Unstructured Storage**: No bin/zone system for finding items quickly
3. **Manual Receiving**: No formal goods receipt process beyond basic stock adjustments
4. **Pick Inefficiency**: No pick lists, wave picking, or optimized pick paths
5. **No Batch Visibility**: Limited lot/batch tracking for expiry-sensitive goods
6. **Transfer Chaos**: Basic transfers exist but lack full lifecycle management
7. **Quality Gaps**: No formal inspection or quarantine workflows

### Positioning in WebWaka

| Relationship | Description |
|--------------|-------------|
| **Builds On** | Inventory (`inv_warehouses`, `inv_stock_transfers`, `inv_audits`), Logistics, Commerce, Accounting |
| **Does NOT Replace** | Core Inventory module (remains source of truth for quantities) |
| **Adds** | Structure (zones/bins), Movement workflows, Traceability (batch/lot), Quality processes |
| **Avoids** | SAP-level complexity, robotics, IoT dependencies |

---

## 2️⃣ Existing Schema Foundation (REUSE ANALYSIS)

### Already Implemented in Prisma Schema

The following tables ALREADY exist and will be heavily reused:

| Table | Columns | Current Usage | Suite Enhancement |
|-------|---------|---------------|-------------------|
| `inv_warehouses` | 22 | Basic warehouse registry | Add zones, bin structure, layout |
| `inv_stock_transfers` | 30 | Warehouse-to-warehouse moves | Add picking, packing workflow |
| `inv_stock_transfer_items` | 16 | Transfer line items | Add batch allocation |
| `inv_audits` | 26 | Cycle counts | Add zone-based counting |
| `inv_audit_items` | 15 | Audit line items | Add bin-level variance |
| `inv_reorder_rules` | 24 | Reorder triggers | Add warehouse-specific rules |
| `inv_supplier_replenishment_rules` | 22 | Supplier ordering | Enhance with lead time |
| `Location` | 19 | Physical locations | Link to warehouses |
| `InventoryLevel` | 14 | Stock quantities | Source of truth (no change) |
| `Product` | 30+ | Product master | Extend with storage attributes |
| `ProductVariant` | 15 | SKU variants | Extend with handling units |

### Existing Inventory Services (REUSE)

| Service | Location | Functions | Reuse % |
|---------|----------|-----------|---------|
| `warehouse-service.ts` | `/lib/inventory/` | CRUD, listings | 90% |
| `transfer-service.ts` | `/lib/inventory/` | Transfer lifecycle | 85% |
| `audit-service.ts` | `/lib/inventory/` | Cycle counting | 80% |
| `reorder-service.ts` | `/lib/inventory/` | Replenishment | 75% |
| `event-emitter.ts` | `/lib/inventory/` | Event pub/sub | 100% |

**Overall Schema Reuse: ~70%**

---

## 3️⃣ Capability Mapping

### Domain A: Warehouse Structure (8 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-A01 | Multi-Warehouse Registry | Manage multiple warehouses per tenant | P0 | ✅ EXISTS | 100% `inv_warehouses` |
| AWH-A02 | Warehouse Zones | Define zones (Receiving, Storage, Picking, Shipping, Quarantine) | P0 | 🆕 NEW | 0% |
| AWH-A03 | Bin/Slot Locations | Create bin addresses (Aisle-Rack-Level-Position) | P0 | 🆕 NEW | 0% |
| AWH-A04 | Bin Types | Define bin types (Pallet, Shelf, Bulk, Cold, Hazmat) | P1 | 🆕 NEW | 0% |
| AWH-A05 | Bin Capacity | Track capacity per bin (weight, volume, units) | P1 | 🆕 NEW | 0% |
| AWH-A06 | Warehouse Layout | Logical layout for pick path optimization | P2 | 🆕 NEW | 0% |
| AWH-A07 | Default Bin Rules | Auto-assign bins by product category | P1 | 🆕 NEW | 0% |
| AWH-A08 | Zone Permissions | Restrict zone access by staff role | P2 | 🆕 NEW | 0% |

### Domain B: Stock Placement & Putaway (6 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-B01 | Putaway Task Generation | Create putaway tasks from received goods | P0 | 🆕 NEW | 0% |
| AWH-B02 | Bin Suggestion | Suggest optimal bin based on product, zone, capacity | P0 | 🆕 NEW | 0% |
| AWH-B03 | Manual Bin Override | Allow operator to choose different bin | P0 | 🆕 NEW | 0% |
| AWH-B04 | Putaway Confirmation | Confirm stock placed in bin | P0 | 🆕 NEW | 0% |
| AWH-B05 | Stock Relocation | Move stock between bins within warehouse | P1 | 🆕 NEW | 0% |
| AWH-B06 | Bin Content Inquiry | View what's in a specific bin | P0 | 🆕 NEW | 0% |

### Domain C: Stock Movement & Transfers (7 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-C01 | Transfer Request | Create inter-warehouse transfer request | P0 | ✅ EXISTS | 95% `inv_stock_transfers` |
| AWH-C02 | Transfer Approval | Approve/reject transfer requests | P0 | ✅ EXISTS | 95% |
| AWH-C03 | Transfer Picking | Pick items for outbound transfer | P0 | 🔧 EXTEND | 30% |
| AWH-C04 | Transfer Shipping | Ship transfer with tracking | P0 | ✅ EXISTS | 90% |
| AWH-C05 | Transfer Receiving | Receive transfer at destination | P0 | ✅ EXISTS | 90% |
| AWH-C06 | Transfer Variance | Handle short-ship and over-receive | P0 | ✅ EXISTS | 85% |
| AWH-C07 | Internal Movement | Move stock within same warehouse (zone to zone) | P1 | 🆕 NEW | 0% |

### Domain D: Batch & Lot Tracking (6 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-D01 | Batch Number Assignment | Assign batch numbers on receipt | P0 | 🔧 EXTEND | 40% (partial in transfers) |
| AWH-D02 | Lot/Serial Tracking | Track individual units by serial | P1 | 🆕 NEW | 0% |
| AWH-D03 | Expiry Date Tracking | Track expiry dates per batch | P0 | 🆕 NEW | 0% |
| AWH-D04 | FIFO/FEFO Enforcement | Pick oldest/earliest-expiry first | P0 | 🆕 NEW | 0% |
| AWH-D05 | Batch Recall | Identify and isolate recalled batches | P1 | 🆕 NEW | 0% |
| AWH-D06 | Batch History | Full movement history per batch | P1 | 🆕 NEW | 0% |

### Domain E: Receiving & Goods Receipt (6 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-E01 | Expected Receipt (ASN) | Log expected deliveries from suppliers | P0 | 🆕 NEW | 0% |
| AWH-E02 | Goods Receipt | Record actual receipt with quantities | P0 | 🔧 EXTEND | 50% (basic receiving exists) |
| AWH-E03 | Receipt Variance | Handle over/under delivery | P0 | 🆕 NEW | 0% |
| AWH-E04 | Quality Inspection | Inspect received goods before putaway | P1 | 🆕 NEW | 0% |
| AWH-E05 | Quarantine Hold | Hold stock pending inspection/release | P1 | 🆕 NEW | 0% |
| AWH-E06 | Manual Receipt (No PO) | Receive goods without advance notice | P0 | 🆕 NEW | 0% |

### Domain F: Picking & Packing (7 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-F01 | Pick List Generation | Create pick lists from orders/transfers | P0 | 🆕 NEW | 0% |
| AWH-F02 | Single-Order Picking | Pick one order at a time | P0 | 🆕 NEW | 0% |
| AWH-F03 | Batch Picking | Pick multiple orders in one pass | P1 | 🆕 NEW | 0% |
| AWH-F04 | Pick Path Optimization | Suggest efficient pick route | P2 | 🆕 NEW | 0% |
| AWH-F05 | Pick Confirmation | Confirm item picked from bin | P0 | 🆕 NEW | 0% |
| AWH-F06 | Short-Pick Handling | Record and escalate short-picks | P0 | 🆕 NEW | 0% |
| AWH-F07 | Packing Slip Generation | Generate packing documents | P0 | 🔧 EXTEND | 60% Commerce |

### Domain G: Dispatch Integration (4 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-G01 | Dispatch Manifest | Create dispatch document with items | P0 | 🔧 EXTEND | 70% Logistics |
| AWH-G02 | Carrier Assignment | Assign to internal fleet or 3PL | P1 | 🔧 EXTEND | 80% Logistics |
| AWH-G03 | Waybill Generation | Generate waybill for shipment | P0 | 🔧 EXTEND | 75% Logistics |
| AWH-G04 | Dispatch Confirmation | Confirm goods left warehouse | P0 | 🆕 NEW | 0% |

### Domain H: Inventory Adjustments & Controls (5 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-H01 | Stock Adjustment | Adjust quantities with reason codes | P0 | ✅ EXISTS | 90% `inv_audits` |
| AWH-H02 | Cycle Counting | Zone/bin-level cycle counts | P0 | ✅ EXISTS | 85% `inv_audits` |
| AWH-H03 | Full Physical Count | Complete warehouse count | P1 | ✅ EXISTS | 85% `inv_audits` |
| AWH-H04 | Adjustment Approval | Require approval for large adjustments | P0 | ✅ EXISTS | 90% |
| AWH-H05 | Scrap/Damage Write-Off | Record and write off damaged goods | P1 | 🆕 NEW | 0% |

### Domain I: Reporting & Analytics (4 capabilities)

| ID | Capability | Description | Priority | Status | Reuse |
|----|------------|-------------|----------|--------|-------|
| AWH-I01 | Stock by Location | View stock per warehouse/zone/bin | P0 | 🔧 EXTEND | 70% |
| AWH-I02 | Movement History | Track all stock movements | P0 | 🔧 EXTEND | 75% event logs |
| AWH-I03 | Inventory Valuation | Stock value per warehouse (NGN) | P0 | 🔧 EXTEND | 80% Accounting |
| AWH-I04 | Warehouse KPIs | Fill rate, turnover, accuracy metrics | P2 | 🆕 NEW | 0% |

---

## 4️⃣ Capability Summary

| Domain | P0 | P1 | P2 | Total | New | Extend | Exists |
|--------|----|----|----|----|-----|--------|--------|
| A. Warehouse Structure | 3 | 3 | 2 | 8 | 6 | 0 | 2 |
| B. Stock Placement | 5 | 1 | 0 | 6 | 6 | 0 | 0 |
| C. Stock Movement | 5 | 2 | 0 | 7 | 1 | 1 | 5 |
| D. Batch/Lot Tracking | 2 | 4 | 0 | 6 | 5 | 1 | 0 |
| E. Receiving | 4 | 2 | 0 | 6 | 4 | 2 | 0 |
| F. Picking & Packing | 4 | 1 | 2 | 7 | 6 | 1 | 0 |
| G. Dispatch Integration | 2 | 1 | 0 | 4 | 1 | 3 | 0 |
| H. Adjustments & Controls | 2 | 2 | 0 | 5 | 1 | 0 | 4 |
| I. Reporting | 3 | 0 | 1 | 4 | 1 | 3 | 0 |
| **TOTAL** | **30** | **16** | **5** | **53** | **31** | **11** | **11** |

### Reuse Analysis Summary

| Category | Count | Percentage |
|----------|-------|------------|
| **NEW** (0% reuse) | 31 | 58% |
| **EXTEND** (30-80% reuse) | 11 | 21% |
| **EXISTS** (85%+ reuse) | 11 | 21% |

**Effective Reuse: ~42%** (from existing Inventory, Logistics, Commerce modules)

---

## 5️⃣ Gap Register

### GAP-AWH-001: Zone & Bin Structure
- **Description**: No zone/bin concept exists. Current `inv_warehouses` is flat.
- **Impact**: Cannot track stock at bin level, no putaway/pick optimization
- **Resolution**: New tables for zones and bins (see Schema Proposal)
- **Priority**: P0 - Core to suite functionality

### GAP-AWH-002: Batch/Lot Tracking
- **Description**: Partial batch support in transfers, no comprehensive lot tracking
- **Impact**: Cannot support pharma, food, or expiry-sensitive industries
- **Resolution**: New batch registry table with expiry tracking
- **Priority**: P0 - Required for key Nigerian verticals (pharma, FMCG)

### GAP-AWH-003: Putaway Workflow
- **Description**: No formal putaway process. Stock is "received" but not "placed"
- **Impact**: No bin-level accuracy, pick inefficiency
- **Resolution**: Putaway task table and workflow
- **Priority**: P0 - Core warehouse operation

### GAP-AWH-004: Pick List System
- **Description**: No pick list generation or picking workflow
- **Impact**: Manual order fulfillment, no pick optimization
- **Resolution**: Pick list and pick task tables
- **Priority**: P0 - Required for order fulfillment

### GAP-AWH-005: Goods Receipt Process
- **Description**: Basic receiving exists but no ASN, inspection, or quarantine
- **Impact**: No supplier accountability, quality gaps
- **Resolution**: ASN, receipt, and inspection tables
- **Priority**: P0 - Required for supplier management

### GAP-AWH-006: FIFO/FEFO Logic
- **Description**: No automatic picking based on receipt date or expiry
- **Impact**: Expired stock risk, NAFDAC compliance issues
- **Resolution**: Service logic for FIFO/FEFO allocation
- **Priority**: P0 - Regulatory compliance for pharma

---

## 6️⃣ Schema Impact Proposal (NO MIGRATION YET)

### Proposed New Tables

| Table Name | Description | Columns (est.) | Risk |
|------------|-------------|----------------|------|
| `wh_zones` | Warehouse zones (Receiving, Storage, etc.) | 12 | LOW |
| `wh_bins` | Bin locations within zones | 18 | LOW |
| `wh_batches` | Batch/lot registry with expiry | 15 | LOW |
| `wh_receipts` | Goods receipt header | 20 | LOW |
| `wh_receipt_items` | Goods receipt line items | 14 | LOW |
| `wh_putaway_tasks` | Putaway task queue | 16 | LOW |
| `wh_pick_lists` | Pick list header | 14 | LOW |
| `wh_pick_list_items` | Pick list line items | 16 | LOW |
| `wh_stock_movements` | Detailed movement log | 20 | LOW |

**Total New Tables: 9**

### Proposed New Enums

| Enum Name | Values | Used By |
|-----------|--------|---------|
| `wh_zone_type` | RECEIVING, STORAGE, PICKING, SHIPPING, QUARANTINE, RETURNS, BULK | `wh_zones` |
| `wh_bin_type` | PALLET, SHELF, BULK, COLD, HAZMAT, FLOOR, RACK | `wh_bins` |
| `wh_receipt_status` | EXPECTED, RECEIVING, INSPECTING, COMPLETED, CANCELLED | `wh_receipts` |
| `wh_putaway_status` | PENDING, IN_PROGRESS, COMPLETED, CANCELLED | `wh_putaway_tasks` |
| `wh_pick_status` | PENDING, PICKING, PICKED, PACKED, DISPATCHED, CANCELLED | `wh_pick_lists` |
| `wh_movement_type` | RECEIPT, PUTAWAY, PICK, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT, RELOCATION, SCRAP | `wh_stock_movements` |

**Total New Enums: 6**

### Schema Risk Assessment

| Factor | Assessment |
|--------|------------|
| **Breaking Changes** | ❌ NONE - All additive |
| **Existing Table Modifications** | Minor - Add optional `batchId` FK to some tables |
| **Migration Complexity** | LOW - Standard CREATE TABLE |
| **Index Impact** | LOW - Standard tenant + warehouse + status indexes |
| **Data Migration** | ❌ NONE - New tables are empty initially |

**Overall Schema Impact: LOW**

---

## 7️⃣ Nigeria-First Design Constraints

### Currency & Valuation
- All values in **NGN (₦)** only
- No multi-currency support
- Valuation methods: FIFO cost, Average cost, Standard cost

### Operational Realities
| Constraint | Design Response |
|------------|-----------------|
| **Informal Suppliers** | Manual receipt without PO supported |
| **Power Outages** | Offline-capable operations (event sync) |
| **Network Issues** | Batch upload, resilient sync |
| **No Barcode Scanners** | Manual entry first, barcode optional (P2) |
| **No Robotics** | Human-driven workflows only |
| **Paper Processes** | Printable pick lists, receipts, manifests |

### Geographic Distribution
- Multi-state warehouse networks supported
- Nigerian state codes (LA, AB, FC, etc.)
- LGA-level location tracking
- Common routes: Lagos → Ibadan → Abuja → Kano

### Compliance Considerations
- NAFDAC batch tracking for pharma/food
- Expiry date enforcement for regulated products
- Audit trail for all stock movements
- Recall capability for batch-specific issues

---

## 8️⃣ Explicit Exclusions (DO NOT BUILD)

| Exclusion | Reason |
|-----------|--------|
| ❌ Robotics / Automation | Nigerian SME context - manual operations |
| ❌ IoT / RFID | Hardware dependency, cost prohibitive |
| ❌ Real-time GPS | Not relevant for warehouse operations |
| ❌ Conveyor Systems | Industrial automation out of scope |
| ❌ ERP-level MRP | Overly complex for target market |
| ❌ Automated Procurement | Simple reorder rules only |
| ❌ Customs/Port Integration | Out of scope for v1 |
| ❌ Cross-docking | Advanced logistics pattern |
| ❌ Wave Planning | P2+ optimization |
| ❌ Voice Picking | Hardware dependency |
| ❌ Barcode Mandatory | Optional enhancement only |
| ❌ Multi-currency | NGN only |

---

## 9️⃣ Reuse Matrix

| Existing Module | Reused For | Reuse % |
|-----------------|------------|---------|
| **Inventory (`inv_*`)** | Warehouses, Transfers, Audits, Reorder | 80% |
| **Logistics** | Dispatch, Carrier, Waybill | 75% |
| **Commerce** | Order fulfillment, Packing slips | 60% |
| **Accounting** | Stock valuation, Cost tracking | 70% |
| **CRM** | Suppliers, Vendor contacts | 85% |
| **HR/Staff** | Warehouse staff, Permissions | 80% |
| **Activity Log** | Movement audit trail | 90% |
| **Location** | Physical addresses | 100% |
| **Product** | Item master, Categories | 100% |

---

## 🔟 Document References

| Document | Location | Purpose |
|----------|----------|---------|
| Capability Map | This document | S0-S1 planning |
| Inventory Module Manifest | `/lib/inventory/MODULE_MANIFEST.md` | Existing inventory docs |
| Inventory Types | `/lib/inventory/types.ts` | Event contracts |
| Logistics Suite Map | `/docs/logistics-suite-capability-map.md` | Dispatch integration |

---

## 🛑 STOP POINT

**This completes S0-S1 Capability Mapping.**

### Awaiting Approval For:
- S2: Schema implementation (9 new tables, 6 new enums)
- S3: Core services
- S4: API routes
- S5: Admin UI + Demo Data
- S6: Verification & Freeze

### Approval Checklist
- [ ] 53 capabilities reviewed and accepted
- [ ] 9 proposed tables approved
- [ ] Gap register acknowledged
- [ ] Nigeria-first constraints validated
- [ ] Exclusions confirmed

---

*Document submitted: January 6, 2026*
*Phase: 7C.3 Advanced Warehouse Suite*
*Stage: S0-S1 Capability Mapping*
