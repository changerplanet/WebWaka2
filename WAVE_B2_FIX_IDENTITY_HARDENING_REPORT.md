# Wave B2-Fix: Identity Coherence Hardening Report

**Date:** 2026-01-16  
**Status:** COMPLETED  
**Author:** Agent  
**Scope:** Runtime guardrails for identity coherence without schema changes

---

## Executive Summary

Wave B2-Fix implements four identity hardening measures to address gaps identified in the Wave B2 Customer Identity Coherence Analysis. All changes are runtime guardrails and documentation - NO SCHEMA CHANGES were made, preserving backward compatibility.

---

## Fixes Implemented

### B2-F1: Order Access Hardening (GAP-5 CLOSURE)

**Problem:** Order numbers were acting as bearer tokens - anyone with an order reference could view full order details.

**Solution:**
- Live tenants now require customer verification (email OR phone) to access order details
- Demo tenants preserve unrestricted access for testing
- Verification form presented for live tenant order access without credentials
- Generic error messages - system does NOT reveal whether order exists

**Security Design (Architect-Reviewed):**
1. Order is located FIRST across all systems
2. Verification is performed against THAT SPECIFIC record
3. This prevents cross-system ref collision verification attacks
4. Phone normalization handles Nigerian country code variations (+234, 234, 0)

**Files Modified:**
- `frontend/src/lib/orders/public-order-resolver.ts`
  - Added `verification` parameter to `resolveOrderByRef()`
  - Added `verifyCustomerAgainstOrder()` - verifies against specific order record
  - Added `normalizePhoneForVerification()` - handles NG country codes
  - Order located FIRST, then verified (prevents collision attacks)
  - Returns `verification_required` for live tenants without credentials
  
- `frontend/src/app/[tenantSlug]/orders/[orderRef]/page.tsx`
  - Now passes search params (email/phone) to resolver
  - Renders verification form for live tenants without credentials
  
- `frontend/src/app/[tenantSlug]/orders/[orderRef]/OrderVerificationClient.tsx`
  - New component for customer identity verification
  - Mobile-first, tenant-branded verification form
  - Supports both email and phone verification methods

**Security Properties:**
- Order enumeration attacks blocked (generic error responses)
- Live tenant orders require identity proof
- Demo mode preserved for testing workflows

---

### B2-F2: Identity Fragmentation Signaling

**Problem:** No explicit signaling when customer identity is fragmented across systems.

**Solution:**
- Added `FragmentationStatus` interface to canonical customer types
- Signals fragmentation level: NONE | LOW | MEDIUM | HIGH
- Lists linked and unlinkable systems
- Provides merge blockers for transparency

**Files Modified:**
- `frontend/src/lib/commerce/canonical-customer/types.ts`
  - Added `FragmentationStatus` interface
  - Added `fragmentation` field to `CanonicalCustomer`
  - Added `fragmentationLevel` to `AmbiguousCustomerEntry`
  - Added `fragmentationSummary` to `CustomerResolutionResult`

- `frontend/src/lib/commerce/canonical-customer/adapters.ts`
  - `aggregateToCanonical()` now computes fragmentation status
  - Phone-only identities marked as MEDIUM fragmentation
  - Email-only identities flagged for ParkHub incompatibility
  - **Architect Fix:** Fragmentation/privacy fields now RECOMPUTED when source systems are added during merge

- `frontend/src/lib/commerce/canonical-customer/canonical-customer-service.ts`
  - Ambiguous entries now include fragmentation level

**Key Fragmentation Rules:**
- ParkHub phone-only = MEDIUM fragmentation (cannot link to email-based SVM/MVM)
- Email-only = LOW fragmentation (cannot link to ParkHub)
- Email + Phone = NONE (full cross-system linkability)
- Multiple conflicting phones/emails = HIGH fragmentation

---

### B2-F3: Canonical Identity Guardrails

**Problem:** No documented rules about identity validation and prohibited operations.

**Solution:**
- Added documented guardrails in types.ts
- Added `validateIdentity()` function for runtime validation
- Documents prohibited operations explicitly

**Files Modified:**
- `frontend/src/lib/commerce/canonical-customer/types.ts`
  - Added `IdentityValidationResult` interface
  - Added `validateIdentity()` function
  - Added guardrail documentation block

**Guardrail Rules:**
1. Customer identity MUST have at least email OR phone
2. Cross-system merging requires EXACT identifier match
3. ParkHub phone-only identities cannot merge with email-only SVM/MVM
4. Ambiguous identities MUST be flagged before automated processing

**Prohibited Operations:**
- Automatic merging of ambiguous identities
- Cross-tenant identity sharing
- Bulk erasure without explicit confirmation
- Silent identity degradation

---

### B2-F4: Privacy & Compliance Disclosure

**Problem:** No visibility into privacy limitations and GDPR compliance gaps.

**Solution:**
- Added `PrivacyLimitations` interface
- Every canonical customer now carries privacy metadata
- Explicitly documents erasure blockers

**Files Modified:**
- `frontend/src/lib/commerce/canonical-customer/types.ts`
  - Added `PrivacyLimitations` interface
  - Added `privacyLimitations` field to `CanonicalCustomer`

- `frontend/src/lib/commerce/canonical-customer/adapters.ts`
  - `aggregateToCanonical()` populates privacy limitations

**Privacy Limitations Disclosed:**
- `canFullyErase: false` - No GDPR erasure workflow implemented
- `erasureBlockers`:
  - No GDPR erasure workflow implemented
  - Order history retained for tax compliance
  - ParkHub tickets require manifest retention
- `consentStatus: 'IMPLICIT'` - No explicit consent collection
- `rightToPortability: false` - No data export capability
- `crossSystemLinkable` - Based on email + phone presence

---

## Testing Notes

### Verification Flow Testing

1. **Demo Tenant Access:**
   - Navigate to `/demo-tenant/orders/ORDER-123`
   - Should display order directly without verification

2. **Live Tenant Without Verification:**
   - Navigate to `/live-tenant/orders/ORDER-123`
   - Should see verification form
   - Enter matching email/phone
   - Should redirect to order detail

3. **Live Tenant With Wrong Credentials:**
   - Navigate to `/live-tenant/orders/ORDER-123?email=wrong@email.com`
   - Should see 404 Not Found (generic error)

4. **Live Tenant With Correct Credentials:**
   - Navigate to `/live-tenant/orders/ORDER-123?email=customer@email.com`
   - Should display order detail

---

## Backward Compatibility

All changes are additive and backward compatible:
- No database schema changes
- No breaking API changes
- Demo tenants preserve original behavior
- New fields on types have sensible defaults

---

## Remaining Gaps (Accepted Risks)

These gaps require schema changes and are documented for future implementation:

1. **No persistent customer records** - Identity derived from orders
2. **No GDPR erasure workflow** - Documented in privacyLimitations
3. **No data portability** - rightToPortability: false
4. **ParkHub email gap** - Cannot be fixed without schema change

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `public-order-resolver.ts` | Modified - verification logic |
| `page.tsx` (orders/[orderRef]) | Modified - verification handling |
| `OrderVerificationClient.tsx` | New - verification UI |
| `types.ts` (canonical-customer) | Modified - new interfaces |
| `adapters.ts` (canonical-customer) | Modified - fragmentation/privacy fields |
| `canonical-customer-service.ts` | Modified - fragmentationLevel |

---

## Conclusion

Wave B2-Fix successfully hardens customer identity coherence through runtime guardrails without requiring schema changes. The order access hardening (B2-F1) closes the critical GAP-5 security vulnerability, while fragmentation signaling (B2-F2), guardrails (B2-F3), and privacy disclosure (B2-F4) provide transparency and safety rails for future development.

**Platform Status:** Production-safe with documented limitations.
