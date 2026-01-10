# STOP POINT 2.1: Quick Preview Capability Resolution Tool

**Date:** January 9, 2026  
**Phase:** Stop Point 2.1 — Quick Preview Enhancement  
**Status:** ✅ COMPLETE

---

## Overview

The Quick Preview Capability Resolution Tool is a **read-only diagnostic tool** for Super Admins to preview how capabilities are resolved for different partner configurations before making any assignments.

---

## Feature Summary

### What It Does

| Feature | Description |
|---------|-------------|
| **Type Selection** | Choose from 5 partner types |
| **Category Selection** | Choose from valid categories (filtered by type) |
| **Optional Overrides** | Simulate partner-specific overrides |
| **Resolved Capabilities View** | See all 16 capability fields resolved |
| **Pricing Visibility** | See which pricing models are available |
| **Disabled Actions** | Explicit list of unavailable actions |

### What It Does NOT Do

| Restriction | Enforcement |
|-------------|-------------|
| ❌ Persist data | Modal is ephemeral |
| ❌ Modify registries | Read-only access |
| ❌ Simulate billing/pricing execution | Facts only |
| ❌ Work outside Super Admin context | Embedded in governance dashboard |

---

## Access

**Route:** `/admin/partners/governance` → "Quick Preview" button  
**Visibility:** Super Admin only (governance dashboard)  
**Modal:** Opens in overlay, closable via X or backdrop

---

## Example Resolution Scenarios

### Scenario 1: Reseller + Strategic Partner (Tier 1)

**Selection:**
- Partner Type: Reseller
- Partner Category: Strategic Partner (Tier 1)

**Resolved Capabilities:**
| Capability | Value | Source |
|------------|-------|--------|
| Can Create Clients | ✅ Enabled | Type default |
| Can Suspend Clients | ❌ Disabled | Type default |
| Max Clients | ∞ (unlimited) | Category override |
| Can Assign Pricing | ✅ Enabled | Type default |
| Can Create Pricing Models | ✅ Enabled | Category override |
| Max Discount % | 15% | Type default |
| Can Offer Trials | ✅ Enabled | Type default |
| Max Trial Days | 90 days | Category override |

**Disabled Actions:** 1
- 🔒 Suspend Clients — Capability not granted

**Pricing Visibility:** All 5 models available (including Custom)

---

### Scenario 2: Government Partner + Restricted (Tier 4)

**Selection:**
- Partner Type: Government Partner
- Partner Category: Restricted Partner (Tier 4)

**Resolved Capabilities:**
| Capability | Value | Source |
|------------|-------|--------|
| Can Create Clients | ❌ Disabled | Category override |
| Can Suspend Clients | ❌ Disabled | Type default |
| Max Clients | 0 | Category override |
| Can Assign Pricing | ❌ Disabled | Type + Category |
| Can Create Pricing Models | ❌ Disabled | Both |
| Max Discount % | 0% | Category override |
| Can Offer Trials | ❌ Disabled | Category override |
| Max Trial Days | 0 days | Category override |

**Disabled Actions:** 7+
- 🔒 Create Clients
- 🔒 Suspend Clients
- 🔒 Assign Pricing to Clients
- 🔒 Create Custom Pricing Models
- 🔒 Apply Discounts
- 🔒 Offer Trials
- 🔒 Create ANY Clients (max = 0)

**Pricing Visibility:** 4 models (Custom excluded)

---

### Scenario 3: Education Partner + Pilot (Tier 3) with Overrides

**Selection:**
- Partner Type: Education Partner
- Partner Category: Pilot Partner (Tier 3)
- **Override:** canCreatePricingModels = true (simulated)

**Result:**
- Shows override indicator (amber highlight)
- Resolves capability with override applied
- "Clear all overrides" button to reset

---

## UI Components

### Tabs

1. **Resolved Capabilities** — Full capability matrix grouped by category
2. **Pricing Visibility** — Available pricing models and limits
3. **Disabled Actions** — Explicit list with reasons

### Footer

Persistent footer displays:
> **What this tool does NOT do:** Persist data • Modify registries • Simulate billing/pricing execution • Work outside Super Admin context

---

## Implementation

**Component:** `/app/frontend/src/components/governance/QuickPreviewModal.tsx`

**Integration:** Embedded in `/admin/partners/governance` dashboard via "Quick Preview" button

**Dependencies:**
- `@/lib/partner-governance` (types, registries, resolution functions)

---

## Screenshots

| View | Description |
|------|-------------|
| Empty State | Shows selection dropdowns, placeholder message |
| Resolved Capabilities | Full capability matrix for selected type + category |
| Pricing Visibility | Available models with access reasons |
| Disabled Actions | Warning banner + action list with reasons |
| With Overrides | Amber-highlighted overridden capabilities |

---

## Governance Compliance

✅ **Read-only** — No write operations  
✅ **Diagnostic only** — Explainability tool, not execution  
✅ **Super Admin gated** — Only accessible within governance dashboard  
✅ **No persistence** — Modal state is ephemeral  
✅ **Explicit limitations** — Footer clearly states what tool does NOT do  

---

**Submitted:** January 9, 2026
