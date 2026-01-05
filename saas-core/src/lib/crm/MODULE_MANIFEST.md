# MODULE 3: CRM & CUSTOMER ENGAGEMENT

## Module Identity
- **Module Key**: `crm`
- **Display Name**: CRM & Customer Engagement
- **Version**: 1.0.0
- **Domain**: CRM
- **Status**: COMPLETE & VALIDATED

## Module Summary
A Nigeria-first CRM module for customer retention, loyalty, and growth. 
This module helps businesses know their customers, retain them, and sell more 
across POS, online store, and marketplace channels.

---

## VALIDATION CHECKLIST

### ✅ Core Safety
- [x] No Core schema changes made
- [x] No Core tables modified directly
- [x] No Customer table duplication (references by customerId)
- [x] No Wallet mutations
- [x] No Payment execution
- [x] No direct messaging (delegates to Core)
- [x] Module tables prefixed with `crm_`
- [x] Safe removal without breaking POS, SVM, MVM, Inventory

### ✅ Data Ownership
**Module OWNS:**
- [x] CrmCustomerSegment (Segmentation rules)
- [x] CrmSegmentMembership (Customer-segment links)
- [x] CrmLoyaltyProgram (Loyalty configuration)
- [x] CrmLoyaltyRule (Earn/redeem rules)
- [x] CrmLoyaltyTransaction (Points ledger)
- [x] CrmCampaign (Campaign definitions)
- [x] CrmCampaignAudience (Audience targeting)
- [x] CrmEngagementEvent (Engagement tracking)
- [x] CrmConfiguration (Module settings)

**Module USES (read-only):**
- [x] Customer (via customerId reference)
- [x] Orders (via events)
- [x] Sales (via events)

### ✅ Nigeria-first Compliance
- [x] SMS-first engagement support
- [x] Phone-number-first identification
- [x] Simple points-based loyalty
- [x] Support for incomplete customer profiles
- [x] NGN currency default

---

## API ENDPOINTS (25 total)

### CRM Configuration (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm | Get CRM config |
| POST | /api/crm (action=initialize) | Initialize CRM module |
| PUT | /api/crm | Update CRM config |

### Segments (5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/segments | List segments |
| POST | /api/crm/segments | Create segment |
| GET | /api/crm/segments/[id] | Get segment |
| PUT | /api/crm/segments/[id] | Update segment |
| DELETE | /api/crm/segments/[id] | Delete segment |

### Loyalty (6)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/loyalty | Get program |
| POST | /api/crm/loyalty (action=initialize) | Initialize program |
| POST | /api/crm/loyalty (action=create-rule) | Create rule |
| POST | /api/crm/loyalty (action=earn) | Award points |
| POST | /api/crm/loyalty (action=redeem) | Redeem points |
| GET | /api/crm/loyalty/customer/[id] | Customer summary |

### Campaigns (6)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/campaigns | List campaigns |
| POST | /api/crm/campaigns | Create campaign |
| GET | /api/crm/campaigns/[id] | Get campaign |
| PUT | /api/crm/campaigns/[id] | Update campaign |
| DELETE | /api/crm/campaigns/[id] | Delete campaign |
| POST | /api/crm/campaigns/[id] (actions) | Publish/pause/cancel |

### Engagement (2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/engagement | Get analytics |
| POST | /api/crm/engagement | Record/process events |

### Utilities (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/utils?resource=entitlements | Entitlement summary |
| GET | /api/crm/utils?resource=offline | Offline package |
| POST | /api/crm/utils (action=sync-loyalty) | Sync offline earnings |

### Validation (1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/validate | Run validation checks |

---

## DATABASE MODELS (9)

1. **CrmCustomerSegment** - Segment definitions with rules
2. **CrmSegmentMembership** - Customer-segment associations
3. **CrmLoyaltyProgram** - Loyalty program config
4. **CrmLoyaltyRule** - Earn/redeem/bonus rules
5. **CrmLoyaltyTransaction** - Points ledger (append-only)
6. **CrmCampaign** - Campaign definitions
7. **CrmCampaignAudience** - Target audience config
8. **CrmEngagementEvent** - Customer engagement tracking
9. **CrmConfiguration** - Tenant CRM settings

---

## SERVICE FILES (6)

1. `/lib/crm/segmentation-service.ts` - Customer Segmentation
2. `/lib/crm/loyalty-service.ts` - Loyalty & Rewards
3. `/lib/crm/campaign-service.ts` - Marketing Campaigns
4. `/lib/crm/engagement-service.ts` - Event Processing
5. `/lib/crm/entitlements-service.ts` - Feature Gating
6. `/lib/crm/offline-service.ts` - Offline Support

---

## DEFAULT SEGMENTS (8)

1. VIP Customers (spend > ₦100,000)
2. Active Customers (purchase in 30 days)
3. At-Risk Customers (60-90 days inactive)
4. Churned Customers (90+ days inactive)
5. POS Customers (in-store shoppers)
6. Online Customers (web/marketplace)
7. New Customers (joined in 30 days)
8. Repeat Customers (3+ purchases)

---

## LOYALTY TIERS (4)

1. Bronze (0+ points) - 1x multiplier
2. Silver (1,000+ points) - 1.25x multiplier
3. Gold (5,000+ points) - 1.5x multiplier
4. Platinum (10,000+ points) - 2x multiplier

---

## CAMPAIGN TYPES (6)

1. PROMOTIONAL - Sales and discounts
2. LOYALTY - Points multipliers
3. ENGAGEMENT - Re-engagement
4. ANNOUNCEMENT - Product announcements
5. BIRTHDAY - Birthday offers
6. WINBACK - Win-back inactive customers

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2, 2026 | Initial release - All 8 phases complete |

---

## MODULE TAG

```
crm-v1.0.0
```
