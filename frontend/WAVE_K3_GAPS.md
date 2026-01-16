# Wave K.3: Remaining Commerce Gaps Registry

**Wave K.3 Completed**: January 2026  
**Purpose**: Document all remaining commerce gaps after Wave K.3

---

## Gap Categories

### 🔴 Critical (Should be addressed in next wave)
### 🟡 Important (Should be planned)
### 🟢 Nice-to-have (Future consideration)

---

## 1. Refund Execution 🔴

**Gap**: RefundIntent model created but no actual refund execution.

**Why NOT solved in K.3**:
- K.3 constraint: NO money movement
- Requires payment provider refund API integration
- Needs financial reconciliation logic

**Future Wave**: K.4 or Financial Operations Wave

**Requirements for resolution**:
- Paystack refund API integration
- Wallet crediting logic
- Commission reversal for vendors
- Partial refund calculation

---

## 2. Inventory Restoration on Payment Failure/Refund 🔴

**Gap**: When order payment fails (via webhook) or is refunded, inventory is not automatically restored.

**Why NOT solved in K.3**:
- K.3 constraint: NO automation
- Requires careful multi-step restoration logic
- Complex multi-variant inventory handling
- Inventory was deducted at checkout (Wave K.2), webhook failure path cancels order but doesn't restore stock

**Future Wave**: K.4 (Inventory Compensation Wave)

**Note**: Documented in webhook-processor.ts as explicit gap.

---

## 3. Payment Webhook Security Enhancement 🟡

**Gap**: Webhook signature verification skipped in demo mode.

**Why NOT solved in K.3**:
- Demo mode needed for testing without Paystack
- Production has proper verification

**Future Wave**: Security hardening wave

**Recommendations**:
- Add IP allowlist for Paystack webhooks
- Rate limiting on webhook endpoints
- Audit logging for all webhook events

---

## 4. Notification System 🟡

**Gap**: No email/SMS notifications for:
- Order confirmation
- Payment success/failure
- Fulfillment updates
- Refund status changes

**Why NOT solved in K.3**:
- K.3 scope: correctness and safety only
- Requires email/SMS provider integration
- Needs template system

**Future Wave**: Notification Wave

---

## 5. Customer Account Linking 🟡

**Gap**: Orders are linked by email only, no proper customer accounts.

**Why NOT solved in K.3**:
- K.3 scope: order lifecycle, not customer identity
- Requires authentication system extension

**Future Wave**: Customer Identity Wave

---

## 6. Vendor Order Notification 🟡

**Gap**: Vendors not notified when they receive sub-orders.

**Why NOT solved in K.3**:
- Tied to notification system gap
- Requires vendor dashboard real-time updates

**Future Wave**: Notification Wave

---

## 7. Shipping Carrier Integration 🟢

**Gap**: No actual shipping carrier integration.

**Why NOT solved in K.3**:
- K.3 constraint: deterministic allocation only
- Carrier integrations are external dependencies
- Nigeria shipping ecosystem fragmented

**Future Wave**: Logistics Wave

**Notes**:
- Current: proportional/weight-based allocation
- Future: GIG Logistics, Kwik, DHL integration

---

## 8. Real-time Inventory Sync 🟢

**Gap**: Inventory checked at checkout but not locked during cart.

**Why NOT solved in K.3**:
- Complex distributed locking
- Would require background jobs (K.3 constraint)

**Future Wave**: Inventory Locking Wave

**Risk**: Oversell possible on high-volume items

---

## 9. Order Modification 🟢

**Gap**: Cannot modify order after placement.

**Why NOT solved in K.3**:
- Complex order modification logic
- Affects payment, inventory, vendor sub-orders
- Needs clear business rules

**Future Wave**: Order Management Wave

---

## 10. Split Payment 🟢

**Gap**: Cannot split payment across methods (e.g., part wallet, part card).

**Why NOT solved in K.3**:
- K.3 constraint: no new payment systems
- Requires wallet system
- Complex reconciliation

**Future Wave**: Payment Enhancement Wave

---

## 11. Dispute Resolution 🟢

**Gap**: No formal dispute handling between customer and vendor.

**Why NOT solved in K.3**:
- K.3 scope: order lifecycle
- Requires arbitration workflow
- Needs messaging system

**Future Wave**: Dispute Resolution Wave

---

## 12. Performance Optimization 🟢

**Gap**: Order queries may be slow at scale.

**Why NOT solved in K.3**:
- K.3 focus: correctness first
- Optimization after stability

**Future Wave**: Performance Wave

**Recommendations**:
- Add materialized views for order aggregations
- Implement query caching
- Consider read replicas

---

## Integration Status Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| PaymentExecutionService | ✅ Used | Existing, no changes |
| OrderSplitService | ✅ Used | Extended for status updates |
| InventorySyncEngine | ✅ Used | Existing, no changes |
| MultiVendorCartService | ✅ Used | Existing, no changes |
| FulfillmentService | ✅ New | Wave K.3 addition |
| RefundIntentService | ✅ New | Wave K.3 addition (visibility only) |
| ShippingAllocationService | ✅ New | Wave K.3 addition |
| OrderRecoveryService | ✅ New | Wave K.3 addition |
| WebhookProcessor | ✅ New | Wave K.3 addition |

---

## Constraint Compliance Summary

| Constraint | Complied | Evidence |
|------------|----------|----------|
| No new payment providers | ✅ | Uses existing PaymentExecutionService |
| No payout execution | ✅ | No payout code added |
| No background jobs | ✅ | All operations user-triggered |
| No automations | ✅ | No scheduled tasks |
| No schema rewrites | ✅ | Only added mvm_refund_intent model |
| No breaking existing APIs | ✅ | All endpoints additive |
| Idempotency enforced | ✅ | Webhook processor checks status first |
| Demo-safe behavior | ✅ | Demo webhook endpoint provided |
| Tenant isolation | ✅ | All queries filtered by tenantId |

---

**Wave K.3 Completed**: January 2026  
**Architect Review**: Approved  
**Next Authorization Required**: Yes
