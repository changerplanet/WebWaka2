# PHASE 3: REACT HOOK WARNINGS BASELINE

**Generated**: January 2026  
**Status**: BASELINED — Domain-Owned / Deferred  
**Total Warnings**: 52  
**Owner**: DOMAIN_REVIEW_REQUIRED

---

## Purpose

This document establishes a formal baseline of all remaining React Hook dependency warnings that cannot be mechanically fixed without risk of behavioral changes. These warnings are explicitly accepted as technical debt pending domain expert review.

---

## Baseline Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| Auth/Session Flow | 6 | 🔴 High |
| Provider Components | 5 | 🔴 High |
| Dashboard Pages | 8 | 🟡 Medium |
| Partner Portal | 8 | 🟡 Medium |
| Commerce (POS/SVM) | 5 | 🔴 High |
| Admin Pages | 4 | 🟡 Medium |
| Domain-Specific Pages | 16 | 🟢 Low-Medium |

---

## Detailed Baseline

### 🔴 HIGH RISK — Auth & Provider Components

| # | File | Line | Missing Dependencies | Reason |
|---|------|------|---------------------|--------|
| 1 | `src/components/AuthProvider.tsx` | 212 | `fetchInstances`, `switchTenantInternal` | Circular callback chain for auth state machine |
| 2 | `src/components/AuthProvider.tsx` | 251 | `switchTenantInternal` | Tenant switching affects auth context |
| 3 | `src/components/AuthProvider.tsx` | 299 | `refreshSession` | Session refresh timing critical |
| 4 | `src/components/AuthProvider.tsx` | 310 | `switchTenantInternal` | Post-auth tenant selection |
| 5 | `src/components/pos/POSProvider.tsx` | 207 | `state` | POS state machine initialization |
| 6 | `src/components/pos/POSProvider.tsx` | 217 | `fetchLocations` | Location-dependent POS config |
| 7 | `src/components/pos/POSProvider.tsx` | 406 | `removeFromCart` | Cart modification callback |
| 8 | `src/components/pos/POSProvider.tsx` | 562 | `state` | Transaction state dependencies |
| 9 | `src/components/svm/SVMProvider.tsx` | 363 | `cart` | E-commerce cart state |

**Owner**: DOMAIN_REVIEW_REQUIRED  
**Reason**: These components manage critical application state. Dependency changes could alter initialization order, cause infinite loops, or break transaction flows.

---

### 🟡 MEDIUM RISK — Dashboard & Admin Pages

| # | File | Line | Missing Dependencies | Reason |
|---|------|------|---------------------|--------|
| 10 | `src/app/dashboard/page.tsx` | 53 | `fetchActiveCapabilities` | Dashboard initialization |
| 11 | `src/app/dashboard/accounting/page.tsx` | 66 | `fetchDashboardData` | Accounting data fetch timing |
| 12 | `src/app/dashboard/analytics/page.tsx` | 91 | `initializeAndFetch` | Analytics initialization |
| 13 | `src/app/dashboard/payments/page.tsx` | 89 | `initializeAndFetch` | Payment data initialization |
| 14 | `src/app/dashboard/platform-instances/page.tsx` | 54 | `fetchData` | Instance data fetch |
| 15 | `src/app/dashboard/settings/page.tsx` | 55 | `fetchData` | Settings data fetch |
| 16 | `src/app/dashboard/partner/clients/page.tsx` | 29 | `fetchPartnerInfo` | Partner client data |
| 17 | `src/app/admin/tenants/[id]/page.tsx` | 58 | `fetchTenantDetails` | Tenant detail fetch |

**Owner**: DOMAIN_REVIEW_REQUIRED  
**Reason**: Data fetching callbacks with filter/state dependencies. Need to verify intended update triggers.

---

### 🟡 MEDIUM RISK — Partner Portal

| # | File | Line | Missing Dependencies | Reason |
|---|------|------|---------------------|--------|
| 18 | `src/app/partner-portal/page.tsx` | 162 | `fetchSession` | Portal auth state |
| 19 | `src/app/partner-portal/page.tsx` | 168 | `fetchPartnerData` | Partner data initialization |
| 20 | `src/app/partner-portal/funnels/[funnelId]/editor/page.tsx` | 110 | `fetchFunnel` | Funnel editor state |
| 21 | `src/app/partner-portal/sites/[siteId]/editor/page.tsx` | 100 | `fetchSite` | Site editor state |
| 22 | `src/app/partner/page.tsx` | 101 | `checkAuthAndFetchDashboard` | Partner dashboard auth |
| 23 | `src/app/partner/audit/page.tsx` | 60 | `checkAuthAndFetchData` | Audit page auth |
| 24 | `src/app/partner/audit/page.tsx` | 70 | `fetchActivityReport`, `fetchAuditLogs` | Audit data fetch |
| 25 | `src/app/partner/earnings/page.tsx` | 79 | `checkAuthAndFetchData` | Earnings auth |
| 26 | `src/app/partner/earnings/page.tsx` | 85 | `fetchPerformance` | Performance data |
| 27 | `src/app/partner/referrals/page.tsx` | 51 | `checkAuthAndFetchData` | Referrals auth |
| 28 | `src/app/partner/referrals/page.tsx` | 57 | `fetchReferrals` | Referral data |

**Owner**: DOMAIN_REVIEW_REQUIRED  
**Reason**: Partner portal has specific auth and data flow requirements.

---

### 🟡 MEDIUM RISK — Admin Governance

| # | File | Line | Missing Dependencies | Reason |
|---|------|------|---------------------|--------|
| 29 | `src/app/admin/partners/governance/page.tsx` | 55 | `checkAuthAndLoadData` | Governance auth |
| 30 | `src/app/admin/partners/governance/audit/page.tsx` | 39 | `loadAuditData` | Audit data |
| 31 | `src/app/admin/partners/governance/inspection/page.tsx` | 52 | `loadAuditData` | Inspection data |

**Owner**: DOMAIN_REVIEW_REQUIRED  
**Reason**: Admin governance pages with compliance implications.

---

### 🟢 LOW-MEDIUM RISK — Domain-Specific Pages

| # | File | Line | Missing Dependencies | Reason |
|---|------|------|---------------------|--------|
| 32 | `src/app/(auth)/signup-v2/page.tsx` | 394 | `loading`, `onVerify` | Signup flow state |
| 33 | `src/app/civic/constituents/page.tsx` | 87 | `fetchConstituents` | Civic data fetch |
| 34 | `src/app/education/students/page.tsx` | 77 | `fetchStudents` | Education data |
| 35 | `src/app/hospitality/folios/page.tsx` | 133 | `fetchFolios` | Folio data |
| 36 | `src/app/hospitality/guests/page.tsx` | 107 | `fetchGuests` | Guest data |
| 37 | `src/app/hospitality/housekeeping/page.tsx` | 106 | `fetchTasks` | Housekeeping tasks |
| 38 | `src/app/hospitality/reservations/page.tsx` | 120 | `fetchReservations` | Reservation data |
| 39 | `src/app/legal-practice-suite/matters/page.tsx` | 212 | `templates` | Legal templates |
| 40 | `src/app/logistics-suite/drivers/page.tsx` | 100 | `fetchDrivers` | Driver data |
| 41 | `src/app/logistics-suite/fleet/page.tsx` | 98 | `fetchVehicles` | Fleet data |
| 42 | `src/app/logistics-suite/jobs/page.tsx` | 134 | `fetchJobs` | Job data |
| 43 | `src/app/pos/page.tsx` | 48 | `refreshProducts` | POS product refresh |
| 44 | `src/app/select-tenant/page.tsx` | 30 | `fetchSession` | Tenant selection |

**Owner**: DOMAIN_REVIEW_REQUIRED  
**Reason**: Domain-specific data fetching patterns.

---

### 🟢 LOW RISK — UI Components

| # | File | Line | Missing Dependencies | Reason |
|---|------|------|---------------------|--------|
| 45 | `src/components/DomainManagement.tsx` | 37 | `fetchDomains` | Domain list fetch |
| 46 | `src/components/IntentSuggestionsPanel.tsx` | 96 | `fetchSuggestions` | AI suggestions |
| 47 | `src/components/MemberManagement.tsx` | 38 | `fetchMembers` | Member list fetch |
| 48 | `src/components/OfflineStatus.tsx` | 23 | `handleSync` | Offline sync |
| 49 | `src/components/partner/ClientManagement.tsx` | 63 | `fetchClients` | Client list |
| 50 | `src/components/platform-instance/DomainInstanceMapping.tsx` | 55 | `fetchDomains` | Domain mapping |
| 51 | `src/components/platform-instance/InstanceAdminPage.tsx` | 96 | `fetchInstances` | Instance list |
| 52 | `src/components/platform-instance/InstanceAdminPage.tsx` | 450 | `slug` | Slug-dependent |

**Owner**: DOMAIN_REVIEW_REQUIRED  
**Reason**: UI components with data dependencies.

---

## Remediation Guidance (For Future Phases)

### High Risk Files (Require Architectural Review)
- `AuthProvider.tsx` — May need callback consolidation or ref-based approach
- `POSProvider.tsx` — State machine may need reducer pattern
- `SVMProvider.tsx` — Cart state may need context restructuring

### Medium Risk Files (Require Testing)
- Dashboard pages — Can likely be fixed with careful `useCallback` wrapping
- Partner pages — Auth flow needs validation

### Low Risk Files (Batch Fixable)
- Domain-specific pages — Standard `useCallback` pattern should apply
- UI components — Straightforward dependency additions

---

## Acceptance Criteria for Future Fixes

1. ✅ No behavioral changes
2. ✅ No infinite loop risks
3. ✅ No auth/session flow changes
4. ✅ No transaction/cart state changes
5. ✅ Build must pass
6. ✅ Manual testing required for High Risk files

---

## Attestation

> **"This baseline was created in read-only mode.
> No code was modified.
> All warnings are documented for future domain review."**

---

**END OF PHASE 3 BASELINE**
