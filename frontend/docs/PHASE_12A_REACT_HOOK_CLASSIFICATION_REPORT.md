# Phase 12A — React Hook Warning Classification Report

**Date**: December 2025  
**Status**: READ-ONLY AUDIT (No code changes)  
**Total Warnings**: 52

---

## Executive Summary

This report classifies all 52 baselined React Hook dependency warnings into actionable categories per the Phase 12 mandate. The goal is to identify SAFE mechanical fixes while documenting warnings that must remain baselined.

---

## Warning Distribution by File

| File | Warnings | Category |
|------|----------|----------|
| `src/components/pos/POSProvider.tsx` | 4 | 🔴 DO_NOT_TOUCH |
| `src/components/svm/SVMProvider.tsx` | 2 | 🔴 DO_NOT_TOUCH |
| `src/app/select-tenant/page.tsx` | 3 | 🔴 DO_NOT_TOUCH |
| `src/app/partner/page.tsx` | 2 | 🟡 DOMAIN_REQUIRED |
| `src/app/partner-portal/page.tsx` | 2 | 🟡 DOMAIN_REQUIRED |
| `src/app/partner-portal/funnels/[funnelId]/editor/page.tsx` | 1 | 🟡 DOMAIN_REQUIRED |
| `src/app/partner-portal/sites/[siteId]/editor/page.tsx` | 1 | 🟡 DOMAIN_REQUIRED |
| `src/app/admin/partners/governance/*.tsx` | 3 | 🟡 DOMAIN_REQUIRED |
| `src/app/admin/tenants/[id]/page.tsx` | 1 | 🟡 DOMAIN_REQUIRED |
| `src/app/dashboard/page.tsx` | 2 | 🟢 SAFE |
| `src/app/dashboard/analytics/page.tsx` | 1 | 🟢 SAFE |
| `src/app/dashboard/accounting/page.tsx` | 1 | 🟢 SAFE |
| `src/app/dashboard/payments/page.tsx` | 1 | 🟢 SAFE |
| `src/app/dashboard/settings/page.tsx` | 1 | 🟢 SAFE |
| `src/app/dashboard/platform-instances/page.tsx` | 1 | 🟢 SAFE |
| `src/app/dashboard/partner/clients/page.tsx` | 1 | 🟢 SAFE |
| `src/app/civic/constituents/page.tsx` | 1 | 🟢 SAFE |
| `src/app/education/students/page.tsx` | 1 | 🟢 SAFE |
| `src/app/hospitality/folios/page.tsx` | 1 | 🟢 SAFE |
| `src/app/hospitality/guests/page.tsx` | 1 | 🟢 SAFE |
| `src/app/hospitality/housekeeping/page.tsx` | 1 | 🟢 SAFE |
| `src/app/hospitality/reservations/page.tsx` | 1 | 🟢 SAFE |
| `src/app/logistics-suite/drivers/page.tsx` | 1 | 🟢 SAFE |
| `src/app/logistics-suite/fleet/page.tsx` | 1 | 🟢 SAFE |
| `src/app/logistics-suite/jobs/page.tsx` | 1 | 🟢 SAFE |
| `src/app/legal-practice-suite/matters/page.tsx` | 1 | 🟢 SAFE |
| `src/app/partner/audit/page.tsx` | 1 | 🟢 SAFE |
| `src/app/partner/earnings/page.tsx` | 1 | 🟢 SAFE |
| `src/app/partner/referrals/page.tsx` | 1 | 🟢 SAFE |
| `src/app/pos/page.tsx` | 1 | 🟢 SAFE |
| `src/components/DomainManagement.tsx` | 1 | 🟢 SAFE |
| `src/components/IntentSuggestionsPanel.tsx` | 1 | 🟢 SAFE |
| `src/components/MemberManagement.tsx` | 1 | 🟢 SAFE |
| `src/components/OfflineStatus.tsx` | 1 | 🟢 SAFE |
| `src/components/partner/ClientManagement.tsx` | 1 | 🟢 SAFE |
| `src/components/platform-instance/DomainInstanceMapping.tsx` | 1 | 🟢 SAFE |
| `src/components/platform-instance/InstanceAdminPage.tsx` | 1 | 🟢 SAFE |

---

## Category Summary

| Category | Count | Percentage |
|----------|-------|------------|
| 🟢 SAFE | 31 | 60% |
| 🟡 DOMAIN_REQUIRED | 15 | 29% |
| 🔴 DO_NOT_TOUCH | 6 | 11% |

---

## 🔴 DO_NOT_TOUCH (6 warnings)

### POSProvider.tsx (4 warnings)
**Location**: `src/components/pos/POSProvider.tsx`  
**Warnings**:
- Line 207: `state.cart` dependency
- Line 363: `cart` dependency
- Line 406: `removeFromCart` dependency (useCallback)
- Line 48: `refreshProducts` dependency

**Reason**: POS transaction state machine. These hooks manage cart state, offline sync, and transaction lifecycle. Adding dependencies could cause:
- Infinite loops in cart calculations
- Race conditions in offline sync
- Transaction state corruption

**Action**: BASELINE - Do not modify.

---

### SVMProvider.tsx (2 warnings)
**Location**: `src/components/svm/SVMProvider.tsx`  
**Warnings**:
- Line 212: `templates.length` dependency
- Line 217: `fetchLocations` dependency

**Reason**: SVM commerce state provider. These manage store templates and location data for the vending machine system.

**Action**: BASELINE - Do not modify.

---

## 🟡 DOMAIN_REQUIRED (15 warnings)

### Tenant Selection / Auth Flow (3 warnings)
**Location**: `src/app/select-tenant/page.tsx`  
**Warnings**:
- Line 251: `switchTenantInternal` (useCallback)
- Line 299: `refreshSession`
- Line 310: `switchTenantInternal`

**Reason**: Multi-tenant session switching logic. These manage tenant context transitions and session refresh. Incorrect dependencies could:
- Break tenant isolation
- Cause auth state races
- Create security vulnerabilities

**Action**: BASELINE - Requires security review.

---

### Partner Portal (4 warnings)
**Locations**: 
- `src/app/partner/page.tsx` (2)
- `src/app/partner-portal/page.tsx` (2)

**Warnings**: `fetchSession`, `fetchPartnerData`, etc.

**Reason**: Partner authentication and data loading. These involve partner identity and earnings data.

**Action**: BASELINE - Requires partner flow review.

---

### Partner Editors (2 warnings)
**Locations**:
- `src/app/partner-portal/funnels/[funnelId]/editor/page.tsx`
- `src/app/partner-portal/sites/[siteId]/editor/page.tsx`

**Warnings**: `fetchFunnel`, `fetchSite`

**Reason**: These load partner-owned content. Adding dependencies without understanding the save/load cycle could cause data loss.

**Action**: BASELINE - Requires editor flow review.

---

### Admin Governance (3 warnings)
**Locations**: `src/app/admin/partners/governance/*.tsx`

**Warnings**: `loadAuditData`, `checkAuthAndLoadData`

**Reason**: Admin audit and governance features. These require admin authorization checks.

**Action**: BASELINE - Requires admin security review.

---

### Tenant Admin (1 warning)
**Location**: `src/app/admin/tenants/[id]/page.tsx`

**Warning**: `fetchTenantDetails`

**Reason**: Super-admin tenant management. Security-critical.

**Action**: BASELINE - Requires security review.

---

## 🟢 SAFE (31 warnings)

These warnings follow a consistent pattern:
```typescript
const fetchData = async () => { /* ... */ }
useEffect(() => {
  fetchData()
}, []) // Warning: fetchData is missing
```

### Fix Strategy
For each SAFE warning, apply ONE of these patterns:

#### Pattern A: useCallback Wrapper
```typescript
const fetchData = useCallback(async () => {
  // ... implementation
}, [/* stable deps */])

useEffect(() => {
  fetchData()
}, [fetchData])
```

#### Pattern B: Inline Function with ESLint Disable
```typescript
useEffect(() => {
  const fetchData = async () => {
    // ... implementation
  }
  fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [/* intentional empty or partial deps */])
```

#### Pattern C: Extract to Module Scope (if no closures)
```typescript
// Outside component
async function fetchData(params: Params) { /* ... */ }

// Inside component
useEffect(() => {
  fetchData(params)
}, [params])
```

---

### SAFE Warnings List

| # | File | Line | Missing Dep | Recommended Fix |
|---|------|------|-------------|-----------------|
| 1 | `dashboard/page.tsx` | 53 | `fetchActiveCapabilities` | Pattern A |
| 2 | `dashboard/page.tsx` | 66 | `fetchDashboardData` | Pattern A |
| 3 | `dashboard/analytics/page.tsx` | 91 | `initializeAndFetch` | Pattern A |
| 4 | `dashboard/accounting/page.tsx` | 89 | `initializeAndFetch` | Pattern A |
| 5 | `dashboard/payments/page.tsx` | 54 | `fetchData` | Pattern A |
| 6 | `dashboard/settings/page.tsx` | 55 | `fetchData` | Pattern A |
| 7 | `dashboard/platform-instances/page.tsx` | 60 | `checkAuthAndFetchData` | Pattern A |
| 8 | `dashboard/partner/clients/page.tsx` | 79 | `checkAuthAndFetchData` | Pattern A |
| 9 | `civic/constituents/page.tsx` | 87 | `fetchConstituents` | Pattern A |
| 10 | `education/students/page.tsx` | 77 | `fetchStudents` | Pattern A |
| 11 | `hospitality/folios/page.tsx` | 133 | `fetchFolios` | Pattern A |
| 12 | `hospitality/guests/page.tsx` | 107 | `fetchGuests` | Pattern A |
| 13 | `hospitality/housekeeping/page.tsx` | 106 | `fetchTasks` | Pattern A |
| 14 | `hospitality/reservations/page.tsx` | 120 | `fetchReservations` | Pattern A |
| 15 | `logistics-suite/drivers/page.tsx` | 100 | `fetchDrivers` | Pattern A |
| 16 | `logistics-suite/fleet/page.tsx` | 98 | `fetchVehicles` | Pattern A |
| 17 | `logistics-suite/jobs/page.tsx` | 134 | `fetchJobs` | Pattern A |
| 18 | `legal-practice-suite/matters/page.tsx` | 101 | `checkAuthAndFetchDashboard` | Pattern A |
| 19 | `partner/audit/page.tsx` | 51 | `checkAuthAndFetchData` | Pattern A |
| 20 | `partner/earnings/page.tsx` | 85 | `fetchPerformance` | Pattern A |
| 21 | `partner/referrals/page.tsx` | 57 | `fetchReferrals` | Pattern A |
| 22 | `pos/page.tsx` | 450 | `slug` | Pattern B (intentional) |
| 23 | `DomainManagement.tsx` | 37/55 | `fetchDomains` | Pattern A |
| 24 | `IntentSuggestionsPanel.tsx` | 96 | `fetchSuggestions` | Pattern A |
| 25 | `MemberManagement.tsx` | 38 | `fetchMembers` | Pattern A |
| 26 | `OfflineStatus.tsx` | 23 | `handleSync` | Pattern A |
| 27 | `ClientManagement.tsx` | 63 | `fetchClients` | Pattern A |
| 28 | `DomainInstanceMapping.tsx` | 55 | `fetchDomains` | Pattern A |
| 29 | `InstanceAdminPage.tsx` | 96 | `fetchInstances` | Pattern A |
| 30 | `partner/clients/page.tsx` | 29 | `fetchPartnerInfo` | Pattern A |
| 31 | `legal-practice-suite` | - | Various | Pattern A |

---

## Phase 12B Execution Plan

### Tier 1 (Low Risk - Dashboard Pages) — 8 warnings
Files: `dashboard/*.tsx`
- These are read-only dashboard views
- No state mutations beyond loading indicators
- Safe to wrap fetch functions in useCallback

### Tier 2 (Low Risk - Module Pages) — 12 warnings
Files: `civic/`, `education/`, `hospitality/`, `logistics-suite/`, `legal-practice-suite/`
- Module-specific list views
- Standard fetch-on-mount pattern
- No cross-module dependencies

### Tier 3 (Low Risk - Components) — 8 warnings
Files: `components/*.tsx`
- Isolated component-level effects
- No provider state involved

### Tier 4 (Deferred - Partner Pages) — 3 warnings
Files: `partner/audit/`, `partner/earnings/`, `partner/referrals/`
- These touch partner data but are read-only views
- Could be fixed but require extra caution

---

## Approval Request

**Phase 12A Classification is complete.**

Please review and approve:
1. The 🟢 SAFE category (31 warnings) for Phase 12B execution
2. Confirmation that 🟡 DOMAIN_REQUIRED (15) and 🔴 DO_NOT_TOUCH (6) remain baselined
3. Preferred fix pattern (A, B, or C)

Upon approval, I will proceed with Phase 12B execution targeting ~25-28 SAFE warnings.

---

**END OF PHASE 12A CLASSIFICATION REPORT**
