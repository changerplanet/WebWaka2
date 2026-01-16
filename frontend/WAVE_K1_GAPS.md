# Wave K.1 - Multi-Vendor Customer Cart (MVM) - Gap Documentation

## Overview

Wave K.1 implements a first-class, production-grade Multi-Vendor Cart system for the MVM marketplace. This document records gaps discovered during implementation that cannot be solved within Wave K.1 constraints.

---

## GAP 1: No Product-to-Vendor Attribution in Schema

**What is missing:**
- Products do not have a `vendorId` field directly
- Product ownership is managed through ProductChannelConfig and product_mapping tables
- The cart requires explicit vendorId to be passed with each add operation

**Why it cannot be solved in Wave K.1:**
- Schema changes beyond the approved mvm_cart and mvm_cart_item are out of scope
- Modifying Product model would require significant migration

**Workaround:**
- Cart API requires explicit vendorId from the client
- Client must resolve vendor from marketplace context

**Recommended Resolution Wave:**
- Post-K series: Add optional vendorId to Product model for direct attribution

---

## GAP 2: No Unified Add-to-Cart Button on Product Pages

**What is missing:**
- Product detail pages in marketplace don't have integrated add-to-cart buttons
- Cart integration is only added to the marketplace header/drawer

**Why it cannot be solved in Wave K.1:**
- Full product page integration requires significant UI changes
- Wave K.1 scope focuses on cart infrastructure

**Workaround:**
- Cart drawer is accessible from marketplace header
- Individual product pages can be enhanced in future wave

**Recommended Resolution Wave:**
- Wave K.2 or post-K: Integrate add-to-cart buttons into vendor storefront and product detail pages

---

## GAP 3: No Guest Customer Identity Linking

**What is missing:**
- Cart is tied to browser session/cookie only
- No customer account linkage for order history
- No cart merge when customer logs in

**Why it cannot be solved in Wave K.1:**
- Wave K.1 scope is session-based cart only
- Customer authentication integration is complex

**Workaround:**
- Cart persists via cookie (mvm_cart_key)
- Offline cart uses IndexedDB

**Recommended Resolution Wave:**
- Post-checkout: Implement customer account linking with cart merge capability

---

## GAP 4: ProductChannelConfig MVM Channel May Not Exist

**What is missing:**
- Not all products have ProductChannelConfig entries for MVM channel
- Products may be visible in marketplace without proper MVM channel configuration

**Why it cannot be solved in Wave K.1:**
- Creating ProductChannelConfig entries is a mutation
- Wave K.1 only reads existing data

**Workaround:**
- addItem gracefully handles missing channel config by using base product price
- prepareForCheckout flags products without active MVM channel

**Recommended Resolution Wave:**
- Admin tooling: Ensure ProductChannelConfig is created when product is assigned to MVM vendor

---

## GAP 5: No Real-time Inventory Reservation

**What is missing:**
- Cart does not reserve inventory
- Stock check only happens at checkout preparation
- Race condition possible between cart add and checkout

**Why it cannot be solved in Wave K.1:**
- Inventory reservation is a complex mutation
- Wave K constraints explicitly exclude stock reservation

**Workaround:**
- prepareForCheckout validates current inventory
- Conflict detection shows stock changes to customer
- Final inventory check in Wave K.2 checkout

**Recommended Resolution Wave:**
- Wave K.2: Implement soft reservation with TTL during checkout flow

---

## GAP 6: No Shipping Cost Calculation Per Vendor

**What is missing:**
- Cart shows product subtotals only
- No shipping cost estimation by vendor
- No combined shipping calculation

**Why it cannot be solved in Wave K.1:**
- Shipping calculation requires delivery address
- Complex vendor-specific shipping rules

**Workaround:**
- Cart shows "Shipping calculated at checkout"
- Vendor subtotals are accurate for products

**Recommended Resolution Wave:**
- Wave K.2 or post-K: Implement shipping calculation during checkout

---

## GAP 7: Offline Cart Sync API Not Implemented

**What is missing:**
- MvmOfflineCartService exists but no API endpoint for sync
- No server-side merge with conflict resolution

**Why it cannot be solved in Wave K.1:**
- Full sync requires complex merge logic
- Beyond minimum viable cart scope

**Workaround:**
- Client-side cart restoration using existing cart APIs
- Manual refresh triggers cart reload

**Recommended Resolution Wave:**
- Post-K.2: Implement dedicated /api/mvm/cart/sync endpoint

---

## Implementation Notes

### Schema Changes Made
- `mvm_cart`: Cart header with tenant isolation
- `mvm_cart_item`: Cart line items with vendor attribution

### Services Created
- `MultiVendorCartService`: Server-side cart CRUD and validation
- `MvmOfflineCartService`: Client-side IndexedDB persistence
- `MvmCartConflictDetector`: Conflict detection for sync scenarios

### API Endpoints Created
- `GET /api/mvm/cart`: Retrieve cart
- `POST /api/mvm/cart/add`: Add item
- `POST /api/mvm/cart/update`: Update quantity
- `POST /api/mvm/cart/remove`: Remove item
- `POST /api/mvm/cart/clear`: Clear cart or vendor items
- `POST /api/mvm/cart/prepare-checkout`: Validate for checkout (no payment)

### UI Components Created
- `MultiVendorCartDrawer`: Slide-out cart drawer
- `VendorGroupedCartSection`: Vendor-grouped item display

---

**Wave K.1 Completed**: January 2026  
**Architect Review**: Approved (with tenant isolation fix applied)
