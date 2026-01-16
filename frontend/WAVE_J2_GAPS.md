# Wave J.2 Gap Documentation

## Overview

This document records all gaps, inconsistencies, and limitations discovered during the implementation of Wave J.2 (Unified Customer Identity). These gaps are documented per spec requirements and are NOT solved or worked around in Wave J.2.

---

## GAP 1: No Persistent Customer Table

**What is missing:**
- No dedicated `customer` table exists
- Customer identity is derived from order/ticket data
- No persistent customer profiles

**Impact:**
- Cannot store customer preferences
- Cannot track customer lifecycle
- Customer data is fragmented across orders

**Current workaround:**
- Derive customer identity from `svm_orders`, `mvm_parent_order`, `park_ticket`
- Generate deterministic `canonicalId` from email/phone hash

**Deferred to:** Future - requires business decision on customer data model

---

## GAP 2: No Authentication / Login System

**What is missing:**
- No customer authentication mechanism
- No login/password flow
- No session management for customers

**Impact:**
- Cannot verify customer owns the identity
- No secure customer portal access
- Relies on email/phone as weak identifiers

**Current workaround:**
- APIs require tenantSlug only (no auth)
- Demo tenants allow open access
- Order reference acts as implicit token

**Deferred to:** Post-Wave J - requires auth infrastructure

---

## GAP 3: No Deduplication or Merge Strategy

**What is missing:**
- No automatic deduplication of customer records
- No merge strategy for conflicting identities
- Same customer may appear multiple times with variations

**Impact:**
- Customer history may be fragmented
- Analytics may overcount unique customers
- Manual intervention needed for merges

**Current workaround:**
- Detect ambiguity, flag in response
- Do NOT auto-merge - return multiple entries
- `listAmbiguous` endpoint surfaces potential duplicates

**Deferred to:** Future - requires customer data stewardship workflow

---

## GAP 4: No Customer Consent Tracking

**What is missing:**
- No record of customer consent (marketing, data processing)
- No opt-in/opt-out tracking
- No GDPR/NDPR compliance tracking

**Impact:**
- Cannot verify consent for communications
- Compliance risk for marketing activities
- No audit trail for consent changes

**Current workaround:**
- Not addressed - consent must be tracked externally
- This wave is read-only and cannot add consent tracking

**Deferred to:** Future - requires consent management system

---

## GAP 5: No Cross-Tenant Identity Resolution

**What is missing:**
- Customer identity is tenant-isolated
- Same person across tenants treated as different customers
- No unified identity across the platform

**Impact:**
- Cannot recognize returning customers across partners
- Platform-level analytics miss cross-tenant patterns
- No single customer view for super admins

**Current workaround:**
- Tenant isolation enforced by design
- Cross-tenant resolution explicitly forbidden

**Deferred to:** Future - requires platform-level identity strategy

---

## GAP 6: No Customer Profile UI

**What is missing:**
- No customer-facing profile page
- No self-service identity management
- No way for customers to view/edit their data

**Impact:**
- Customers cannot update contact info
- No self-service for data access requests
- Admin intervention required for changes

**Current workaround:**
- API endpoints only (no UI)
- Profile management handled by existing admin flows

**Deferred to:** Future - requires customer portal development

---

## GAP 7: Phone Number Format Inconsistencies

**What is missing:**
- Phone numbers stored in various formats across systems
- No standard format enforced at data entry
- Nigerian phone formats vary (0-prefix, +234, etc.)

**Impact:**
- Phone matching may fail across systems
- Same phone may not resolve correctly
- Normalization is best-effort

**Current workaround:**
- `normalizePhone()` attempts Nigerian format standardization
- Handles: +234XXXXXXXXXX, 234XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
- Non-Nigerian formats preserved as-is

**Deferred to:** Future - requires data cleanup and validation at entry

---

## GAP 8: Email Trustworthiness Not Guaranteed

**What is missing:**
- No email verification at order time
- Customers may enter incorrect/fake emails
- No validation that email belongs to customer

**Impact:**
- Identity resolution may link wrong orders
- Customers may be unreachable
- False positive identity matches possible

**Current workaround:**
- Accept emails as-is (read-only abstraction)
- Flag ambiguity when detected
- Do not guarantee accuracy

**Deferred to:** Future - requires email verification flow

---

## GAP 9: No Soft-Delete Handling

**What is missing:**
- No tracking of deleted/deactivated customers
- No archive state for customer data
- Order data deletion not addressed

**Impact:**
- Deleted orders may leave orphan customer references
- No way to "forget" a customer (GDPR right to erasure)
- Customer reactivation not possible

**Current workaround:**
- Read all available data (no soft-delete filtering)
- Deletion handling is out of scope

**Deferred to:** Future - requires data lifecycle management

---

## GAP 10: No Customer Lifecycle State

**What is missing:**
- No tracking of customer state (new, returning, churned)
- No first/last purchase tracking
- No customer segmentation attributes

**Impact:**
- Cannot identify returning vs new customers
- No lifecycle-based targeting
- Analytics limited to order-level data

**Current workaround:**
- `originalReferences` shows which systems have data
- Order count can be derived from referenced IDs
- No lifecycle state computed

**Deferred to:** Future - requires customer analytics layer

---

## Summary

| Gap # | Description | Severity | Deferred To |
|-------|-------------|----------|-------------|
| 1 | No persistent customer table | High | Future |
| 2 | No authentication/login | High | Post-Wave J |
| 3 | No deduplication/merge | Medium | Future |
| 4 | No consent tracking | High | Future |
| 5 | No cross-tenant identity | Medium | Future |
| 6 | No customer profile UI | Medium | Future |
| 7 | Phone format inconsistencies | Medium | Future |
| 8 | Email trustworthiness | Medium | Future |
| 9 | No soft-delete handling | Low | Future |
| 10 | No customer lifecycle state | Low | Future |

---

## Document Metadata

- **Wave:** J.2 - Unified Customer Identity
- **Created:** Wave J.2 Implementation
- **Status:** Complete - gaps documented per spec
- **Next Steps:** Review gaps, await approval, prepare Wave J.3
