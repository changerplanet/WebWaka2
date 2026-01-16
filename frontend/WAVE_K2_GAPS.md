# Wave K.2 Gaps Documentation

## Multi-Vendor Checkout & Order Creation (MVM)

**Wave**: K.2  
**Track**: Commerce Completion (MVM)  
**Prerequisite**: Wave K.1 (Multi-Vendor Cart)  
**Completed**: January 2026

---

## Critical Gaps (Must Address in Future Waves)

### GAP 1: Partial Vendor Payment Failure Handling
**What is missing**: If payment succeeds but one vendor sub-order creation fails, there's no rollback mechanism.  
**Current workaround**: All sub-orders created in single transaction; payment initiated after order creation.  
**Risk level**: LOW (transaction ensures atomicity of order creation)  
**Deferred to**: Wave K.3 or dedicated payment error handling phase.

### GAP 2: Split Refunds
**What is missing**: No mechanism to refund individual vendor sub-orders independently.  
**Current workaround**: Full order refund only (not implemented in K.2).  
**Why it cannot be solved in Wave K.2**: Would require new refund logic and commission recalculation.  
**Deferred to**: Future refund/returns phase.

### GAP 3: Mixed Payment Methods Per Vendor
**What is missing**: Cannot use different payment methods for different vendors in same order.  
**Current workaround**: Single payment method applies to entire order.  
**Why it cannot be solved in Wave K.2**: Would require significant payment architecture changes.  
**Deferred to**: Future multi-payment phase (likely not needed for MVP).

### GAP 4: Inventory Oversell Edge Cases
**What is missing**: Race condition possible if multiple customers checkout same limited-stock item simultaneously.  
**Current workaround**: Inventory check at checkout time, deduction after order creation.  
**Risk level**: MEDIUM (possible oversell in high-concurrency scenarios)  
**Deferred to**: Wave K.3 or inventory reservation system.

### GAP 5: Checkout Recovery After Payment Abort
**What is missing**: If customer abandons payment, order remains in PENDING state indefinitely.  
**Current workaround**: Order stays pending; inventory already deducted.  
**Risk level**: HIGH (inventory leak if payment not completed)  
**Deferred to**: Payment webhook handlers, order expiration logic.

### GAP 6: Shipping Cost Calculation
**What is missing**: No shipping cost calculation - displayed as "Calculated at delivery".  
**Current workaround**: Shipping total set to 0 in order.  
**Why it cannot be solved in Wave K.2**: Would require shipping integration and vendor shipping configs.  
**Deferred to**: Shipping integration phase.

### GAP 7: Tax/VAT Calculation Per Vendor
**What is missing**: VAT calculated at order level, not per vendor based on their tax status.  
**Current workaround**: Standard 7.5% VAT applied to subtotal.  
**Why it cannot be solved in Wave K.2**: Would require vendor tax configuration.  
**Deferred to**: Tax compliance phase.

### GAP 8: Customer Account Linking
**What is missing**: Orders are linked by email/phone only, no customer account system.  
**Current workaround**: Email-based order lookup in customer portal.  
**Why it cannot be solved in Wave K.2**: Would require customer account infrastructure.  
**Deferred to**: Customer accounts phase.

### GAP 9: Payment Webhook Handling
**What is missing**: No webhook endpoint to handle Paystack payment confirmations.  
**Current workaround**: Redirect-based payment verification.  
**Risk level**: MEDIUM (payment status may not update if redirect fails)  
**Deferred to**: Payment integration hardening phase.

### GAP 10: Order Cancellation Before Fulfillment
**What is missing**: No customer-initiated order cancellation flow.  
**Current workaround**: None (orders cannot be cancelled by customer).  
**Why it cannot be solved in Wave K.2**: Would require cancellation logic, inventory restoration.  
**Deferred to**: Order management phase.

---

## Minor Gaps (Low Priority)

### GAP 11: Order Confirmation Email
**What is missing**: No email sent to customer after successful checkout.  
**Current workaround**: Customer must check order portal manually.  
**Deferred to**: Notification system phase.

### GAP 12: Vendor Order Notification
**What is missing**: Vendors not notified when they receive new sub-orders.  
**Current workaround**: Vendors must check dashboard manually.  
**Deferred to**: Notification system phase.

### GAP 13: Promotion/Coupon System
**What is missing**: No coupon or promotion code application at checkout.  
**Current workaround**: Promotion fields exist in schema but not implemented.  
**Deferred to**: Marketing/promotions phase.

### GAP 14: Guest Checkout vs Returning Customer
**What is missing**: No way to identify returning customers or pre-fill their information.  
**Current workaround**: Fresh form entry for every checkout.  
**Deferred to**: Customer accounts phase.

---

## Architecture Constraints (By Design)

1. **No payment capture in checkout endpoint**: Payment initiation only, capture handled by provider.
2. **No background processing**: All operations synchronous per Wave K constraints.
3. **No inventory reservation**: Deduction immediate, no hold period.
4. **Single cart per customer session**: Cookie-based cart key.
5. **NGN currency only**: Nigeria-first constraint.

---

## Dependencies on Existing Systems

| System | Usage in K.2 | Status |
|--------|--------------|--------|
| MultiVendorCartService (K.1) | Cart validation, item retrieval | Working |
| OrderSplitService | Parent/sub-order creation | Working |
| PaymentExecutionService | Payment initiation | Working |
| InventorySyncEngine | Stock deduction | Working |
| TenantContextResolver | Tenant security | Working |
| Customer Order Portal (I.5) | Order visibility | Working |

---

**Wave K.2 Completed**: January 2026  
**Architect Review**: Approved (with payment failure handling fixes applied)
