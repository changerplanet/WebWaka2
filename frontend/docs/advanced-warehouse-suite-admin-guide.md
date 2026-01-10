# Advanced Warehouse Suite — Admin Guide

## Document Info
- **Suite**: Advanced Warehouse Operations
- **Phase**: 7C.3
- **Stage**: S5 (Admin UI + Demo Data)
- **Version**: 1.0
- **Date**: January 2026

---

## 1. Overview

The **Advanced Warehouse Suite** extends WebWaka's inventory capabilities to provide structured, multi-location warehouse operations for Nigerian businesses. It enables:

- **Multi-Warehouse Management**: Lagos, Ibadan, Abuja, Port Harcourt depots
- **Zone & Bin Structure**: Organized storage locations
- **Batch/Lot Tracking**: FIFO/FEFO compliance for pharma and FMCG
- **Goods Receiving**: Formal receiving and inspection workflows
- **Putaway Operations**: Systematic stock placement
- **Order Fulfillment**: Pick lists, packing, and dispatch
- **Full Traceability**: Complete audit trail of all movements

---

## 2. Accessing the Suite

Navigate to: **`/advanced-warehouse-suite`**

### Navigation Tabs

| Tab | Function | Primary Use Case |
|-----|----------|------------------|
| **Dashboard** | Overview of all warehouse operations | Daily monitoring, KPI review |
| **Zones & Bins** | Manage warehouse structure | Setup, bin blocking, capacity planning |
| **Batches** | Batch/lot tracking with expiry | NAFDAC compliance, expiry management |
| **Receipts & Putaway** | Inbound operations | Receiving goods, quality inspection, putaway |
| **Pick Lists** | Order fulfillment | Picking, packing, dispatch |
| **Movements** | Audit trail | Traceability, reconciliation, reporting |

---

## 3. Dashboard Guide

### Warehouse Selector
- Use the dropdown to switch between warehouses
- Stats update automatically based on selected warehouse

### Key Metrics
| Metric | Description | Action Threshold |
|--------|-------------|------------------|
| Zones | Total zones in warehouse | - |
| Bin Occupancy | % of bins with stock | >90% = add capacity |
| Pending Tasks | Putaway + Pick tasks awaiting action | >20 = staff alert |
| Dispatched Today | Orders shipped today | Track vs target |

### Operations Summary
Visual breakdown of:
- **Receiving**: Expected → In Progress → Completed
- **Putaway**: Pending → In Progress → Done
- **Picking**: Pending → Picking → Packed → Dispatched

### Expiring Batches Alert
- Shows batches expiring within 30 days
- Click to view full list and take action

---

## 4. Zones & Bins Management

### Zone Types

| Type | Code Prefix | Purpose |
|------|-------------|---------|
| RECEIVING | RCV | Goods unloading and initial staging |
| STORAGE | STG | Main inventory storage |
| PICKING | PCK | Order picking staging |
| SHIPPING | SHP | Dispatch and loading dock |
| QUARANTINE | QTN | Inspection hold area |
| COLD | CLD | Temperature-controlled storage |
| BULK | BLK | Large/heavy item storage |

### Creating a Zone
1. Click **"New Zone"** button
2. Enter zone code (e.g., `STG-D`)
3. Select zone type
4. Set capacity limits
5. Configure inspection requirements

### Bin Address Format
Standard format: **`Aisle-Rack-Level-Position`**

Example: `A-01-02-03`
- A = Aisle A
- 01 = Rack 01
- 02 = Level 02 (from ground)
- 03 = Position 03 (left to right)

### Bin Types

| Type | Use Case | Capacity |
|------|----------|----------|
| SHELF | Standard cartons | 100-300 units |
| PALLET | Full pallets | 400-800 units |
| BULK | Floor storage | Variable |
| COLD | Temperature-sensitive | 100-200 units |
| HAZMAT | Dangerous goods | Restricted |

### Blocking a Bin
Use when:
- Damage discovered
- Inspection required
- Maintenance needed

Steps:
1. Find bin in table
2. Click Actions → **Block**
3. Enter reason
4. Bin shows as blocked (red indicator)

---

## 5. Batch Tracking

### Nigerian Compliance Context
- **NAFDAC Requirements**: All pharmaceutical products must have traceable batch numbers
- **FIFO/FEFO**: Automated picking suggests oldest/earliest-expiry batches first
- **Recall Support**: Any batch can be quarantined and traced instantly

### Batch Statuses

| Status | Color | Description |
|--------|-------|-------------|
| APPROVED | Green | Cleared for sale/distribution |
| PENDING | Yellow | Awaiting quality verification |
| QUARANTINE | Orange | On hold for inspection |
| EXPIRED | Gray | Past expiry date |
| RECALLED | Red | NAFDAC or quality recall |

### Expiry Monitoring
- **< 14 days**: Red badge, urgent action required
- **14-30 days**: Orange badge, plan clearance
- **> 30 days**: Green, normal status

### Registering a New Batch
1. Click **"Register Batch"**
2. Select product from catalog
3. Enter batch number and lot number
4. Set manufacturing and expiry dates
5. Enter initial quantity
6. Optionally link to supplier

### Initiating a Recall
1. Find batch in table
2. Click Actions → **Recall Batch**
3. Enter NAFDAC reference or internal reason
4. System automatically:
   - Marks batch as RECALLED
   - Blocks all affected bins
   - Creates movement record

---

## 6. Receipts & Putaway

### Goods Receipt Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   EXPECTED  │ -> │  RECEIVING  │ -> │ INSPECTING  │ -> │  COMPLETED  │
│             │    │             │    │ (if needed) │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Creating a Receipt
1. Click **"New Receipt"**
2. Select destination warehouse
3. Choose reference type:
   - **PO**: Purchase Order from supplier
   - **TRANSFER**: Inter-warehouse transfer
   - **RETURN**: Customer return
   - **MANUAL**: Walk-in/unplanned delivery
4. Select supplier and expected date
5. Enable inspection if required
6. Add line items with quantities

### Receiving Goods
1. Find receipt with status EXPECTED
2. Click Actions → **Start Receiving**
3. For each item:
   - Enter received quantity
   - Note any damaged units
   - Capture batch/expiry if applicable
4. Click **Complete Receiving**

### Quality Inspection
If receipt requires inspection:
1. Status changes to INSPECTING
2. QC team reviews goods
3. Click **Pass Inspection** or **Fail Inspection**
4. Passed goods trigger putaway task generation

### Putaway Tasks
Generated automatically from completed receipts.

#### Task Priorities
| Priority | Color | SLA |
|----------|-------|-----|
| URGENT | Red | 1 hour |
| HIGH | Orange | 4 hours |
| NORMAL | Blue | 8 hours |
| LOW | Gray | 24 hours |

#### Processing Putaway
1. Go to **Putaway Tasks** tab
2. Find pending task
3. Click Actions → **Assign** (assign to staff)
4. Staff navigates to suggested bin
5. If different bin used, update actual location
6. Click **Complete**

---

## 7. Pick Lists & Dispatch

### Pick Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PENDING   │ -> │   PICKING   │ -> │   PICKED    │ -> │   PACKED    │ -> │ DISPATCHED  │
│             │    │             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Creating a Pick List
Typically auto-generated from sales orders, but manual creation available:
1. Click **"New Pick List"**
2. Select warehouse
3. Choose pick type (ORDER, TRANSFER, REPLENISH)
4. Enter source order number
5. Set priority
6. System auto-suggests bins using FIFO/FEFO logic

### Processing a Pick
1. Assign picker: Actions → **Assign Picker**
2. Picker starts: Actions → **Start Picking**
3. For each item:
   - Go to suggested bin
   - Pick quantity
   - If short, record short-pick with reason
4. Complete picking: Actions → **Complete Picking**

### Packing
1. Find picked order
2. Actions → **Start Packing**
3. Enter:
   - Number of packages
   - Total weight
   - Packing notes
4. Generate packing slip

### Dispatch
1. Find packed order
2. Actions → **Dispatch**
3. Enter:
   - Carrier name (GIG, DHL, etc.)
   - Waybill number
   - Manifest reference
4. System records dispatch timestamp

### Handling Short-Picks
When requested quantity not available:
1. Record short quantity and reason
2. System options:
   - Cancel unfulfilled items
   - Backorder for next shipment
   - Substitute with different batch

---

## 8. Stock Movements (Audit Trail)

### Movement Types

| Type | Direction | Description |
|------|-----------|-------------|
| RECEIPT | In (+) | Goods received from supplier/transfer |
| PUTAWAY | Neutral | Move from receiving to storage |
| PICK | Out (-) | Items picked for order |
| TRANSFER_OUT | Out (-) | Sent to another warehouse |
| TRANSFER_IN | In (+) | Received from another warehouse |
| ADJUSTMENT | +/- | Inventory correction |
| RELOCATION | Neutral | Bin-to-bin move |
| SCRAP | Out (-) | Damaged/expired write-off |

### Using the Movements Page
- **Search**: By product, batch, SKU, or movement number
- **Filter by Type**: See only specific movement types
- **Filter by Warehouse**: Focus on one location
- **Export**: Download for external reporting

### Movement Details
Each movement records:
- Timestamp and performer
- Before/after quantities
- Source and destination bins
- Reference document (GRN, Pick List, etc.)
- Reason code if applicable
- Unit cost for valuation

---

## 9. Nigerian Context Notes

### Currency
- All monetary values in **Nigerian Naira (NGN)**
- No multi-currency support in this version

### Compliance
- **NAFDAC**: Batch tracking supports regulatory requirements
- **Expiry Enforcement**: System prevents sale of expired goods
- **Recall Capability**: Instant batch isolation and tracing

### Common Scenarios

#### Lagos → Ibadan Transfer
1. Create pick list with source = TRANSFER
2. Pick and pack items in Lagos
3. Dispatch with waybill
4. Ibadan receives via Transfer Receipt
5. Automatic TRANSFER_OUT/TRANSFER_IN movements logged

#### FMCG Receiving (No PO)
For walk-in suppliers without advance notice:
1. Create Manual Receipt
2. Capture supplier details on the spot
3. Register new batches if needed
4. Complete receiving and putaway

#### Pharma Inspection Workflow
1. Enable "Requires Inspection" on receipt
2. Goods moved to QUARANTINE zone
3. QC performs sampling and testing
4. Pass → Generate putaway to storage
5. Fail → Initiate return or destruction

---

## 10. Demo Data

The suite includes realistic Nigerian demo data:

### Warehouses
- Lagos Main Warehouse (Victoria Island)
- Ibadan Regional Depot (Dugbe)
- Abuja Distribution Center (Garki)
- Port Harcourt Depot (Trans Amadi)

### Product Categories
- Pharmaceuticals (Paracetamol, Amoxicillin, etc.)
- Cold Chain (Insulin)
- FMCG (Indomie, Peak Milk)
- PPE/Hygiene (Sanitizers, Masks, Gloves)

### Suppliers
- Prime Pharma Ltd
- MedSupply Nigeria
- HealthFirst Distributors
- Nestle Nigeria
- Emzor Pharmaceuticals

### Customers
- Shoprite, HealthPlus, MedPlus, Medbury
- Spar, Jendol, Justrite, Market Square

---

## 11. Best Practices

### Daily Operations
1. **Morning**: Review dashboard, check expiring batches
2. **Ongoing**: Process receipts and putaway tasks promptly
3. **Afternoon**: Clear pending pick lists
4. **End of Day**: Verify dispatch completion

### Inventory Accuracy
- Use cycle counts for high-value items
- Investigate any adjustment reasons
- Reconcile movements weekly

### Capacity Management
- Monitor bin occupancy >80%
- Plan seasonal inventory increases
- Archive old movement data quarterly

---

## 12. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Cannot pick from bin | Bin blocked | Unblock or use alternative |
| Putaway task missing | Receipt not completed | Complete receiving first |
| Batch not showing | Wrong filter | Clear expiry/status filters |
| Cannot dispatch | Not yet packed | Complete packing step |

### Support
For technical issues, contact WebWaka support with:
- Screenshot of error
- Movement/receipt numbers involved
- Steps to reproduce

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Suite: Advanced Warehouse (Phase 7C.3)*
