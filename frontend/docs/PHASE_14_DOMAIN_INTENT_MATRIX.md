# Phase 14A — Domain Intent Matrix

**Date**: December 2025  
**Status**: READ-ONLY ANALYSIS  
**Purpose**: Document intended behavior for each DOMAIN_REQUIRED React Hook warning before any code changes

---

## Overview

This matrix captures the **original design intent** behind each React Hook warning classified as DOMAIN_REQUIRED in Phase 12. No code changes are permitted until domain owners review and approve the proposed remediation strategy.

---

## Intent Analysis Matrix

### Warning #1: `partner/page.tsx:101` — `checkAuthAndFetchDashboard`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/partner/page.tsx` |
| **Line** | 101 |
| **Hook** | `useEffect(() => { checkAuthAndFetchDashboard() }, [])` |
| **Missing Dependency** | `checkAuthAndFetchDashboard` |
| **Current Behavior** | Runs once on mount |

**Intent Analysis:**
```typescript
useEffect(() => {
  checkAuthAndFetchDashboard()  // Auth check + dashboard data fetch
}, [])  // Empty deps = mount-only
```

**Why dependency was omitted:**
- Function performs one-time auth check and redirect
- Should NOT re-run if function identity changes
- Re-running would cause duplicate auth checks and potential race conditions

**Intended Lifecycle:**
- ✅ Run once on component mount
- ❌ Do NOT re-run on function identity change
- ❌ Do NOT re-run on re-render

**Domain Question:**
> "Should the partner dashboard re-fetch when returning to the page from navigation?"

**Proposed Strategy:**
| Option | Description | Recommendation |
|--------|-------------|----------------|
| A | Wrap `checkAuthAndFetchDashboard` in `useCallback` | ⚠️ SAFE but adds complexity |
| B | Keep empty deps with inline comment | ✅ RECOMMENDED (intentional) |
| C | Add eslint-disable with justification | ✅ ACCEPTABLE |

---

### Warning #2: `partner-portal/page.tsx:162` — `fetchSession`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/partner-portal/page.tsx` |
| **Line** | 162 |
| **Hook** | `useEffect(() => { ... fetchSession() }, [authLoading, isAuthenticated, user])` |
| **Missing Dependency** | `fetchSession` |
| **Current Behavior** | Runs when auth state changes |

**Intent Analysis:**
```typescript
useEffect(() => {
  if (!authLoading && isAuthenticated && user) {
    fetchSession()  // Fetch partner session data
  } else if (!authLoading && !isAuthenticated) {
    setLoading(false)
    setError('Authentication required')
  }
}, [authLoading, isAuthenticated, user])  // Intentionally excludes fetchSession
```

**Why dependency was omitted:**
- `fetchSession` is only called when auth state settles
- Function identity changes would cause duplicate fetches
- Auth state (`authLoading`, `isAuthenticated`, `user`) is the actual trigger

**Intended Lifecycle:**
- ✅ Run when auth state transitions
- ❌ Do NOT re-run if `fetchSession` is recreated
- ❌ Do NOT cause duplicate session fetches

**Domain Question:**
> "Should session fetch be tied to auth state changes only, or should it also respond to function recreation?"

**Proposed Strategy:**
| Option | Description | Recommendation |
|--------|-------------|----------------|
| A | Wrap `fetchSession` in `useCallback` with stable deps | ⚠️ Complex (uses retryCount state) |
| B | Keep current deps with inline comment | ✅ RECOMMENDED (auth-state driven) |
| C | Inline the fetch logic directly | ❌ NOT RECOMMENDED (reduces reusability) |

---

### Warning #3: `partner-portal/page.tsx:168` — `fetchPartnerData`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/partner-portal/page.tsx` |
| **Line** | 168 |
| **Hook** | `useEffect(() => { if (partnerId) fetchPartnerData() }, [partnerId])` |
| **Missing Dependency** | `fetchPartnerData` |
| **Current Behavior** | Runs when partnerId changes |

**Intent Analysis:**
```typescript
useEffect(() => {
  if (partnerId) {
    fetchPartnerData()  // Fetch detailed partner data
  }
}, [partnerId])  // Trigger is partnerId, not the function
```

**Why dependency was omitted:**
- `partnerId` is the meaningful trigger
- Function identity doesn't affect fetch semantics
- Adding function dep would cause extra fetches

**Intended Lifecycle:**
- ✅ Run when `partnerId` becomes available or changes
- ❌ Do NOT re-run on function recreation

**Domain Question:**
> "Should partner data re-fetch if the fetch function is updated, or only when partnerId changes?"

**Proposed Strategy:**
| Option | Description | Recommendation |
|--------|-------------|----------------|
| A | Wrap `fetchPartnerData` in `useCallback([partnerId])` | ✅ SAFE (function already depends on partnerId) |
| B | Keep `[partnerId]` with inline comment | ✅ ACCEPTABLE |

---

### Warning #4: `partner-portal/page.tsx:30` — `fetchSession` (Initial)

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/partner-portal/page.tsx` |
| **Line** | 30 (Interface definition area - may be misreported) |
| **Note** | This appears to be the same `fetchSession` as #2 |

**Status:** Duplicate — see Warning #2 analysis

---

### Warning #5: `partner-portal/funnels/[funnelId]/editor/page.tsx:110` — `fetchFunnel`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/partner-portal/funnels/[funnelId]/editor/page.tsx` |
| **Line** | 110 |
| **Hook** | `useEffect(() => { if (funnelId) fetchFunnel() }, [funnelId])` |
| **Missing Dependency** | `fetchFunnel` |
| **Current Behavior** | Runs when funnelId changes |

**Intent Analysis:**
```typescript
useEffect(() => {
  if (funnelId) {
    fetchFunnel();  // Load funnel editor data
  }
}, [funnelId]);  // Route param is the trigger
```

**Why dependency was omitted:**
- `funnelId` from URL params is the trigger
- Function is stable (no external deps)
- Editor should load once per funnel

**Intended Lifecycle:**
- ✅ Run when `funnelId` URL param changes
- ❌ Do NOT cause extra loads during editing session

**Domain Question:**
> "Should the funnel re-fetch if navigating to a different funnel? (Answer: Yes, via funnelId change)"

**Proposed Strategy:**
| Option | Description | Recommendation |
|--------|-------------|----------------|
| A | Wrap `fetchFunnel` in `useCallback([funnelId])` | ✅ RECOMMENDED |
| B | Keep `[funnelId]` with inline comment | ✅ ACCEPTABLE |

---

### Warning #6: `partner-portal/sites/[siteId]/editor/page.tsx:100` — `fetchSite`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/partner-portal/sites/[siteId]/editor/page.tsx` |
| **Line** | 100 |
| **Hook** | `useEffect(() => { if (siteId) fetchSite() }, [siteId])` |
| **Missing Dependency** | `fetchSite` |
| **Current Behavior** | Runs when siteId changes |

**Intent Analysis:**
- Identical pattern to Warning #5 (funnel editor)
- `siteId` from URL params triggers load
- Function is stable

**Proposed Strategy:** Same as Warning #5 — `useCallback` wrapper recommended

---

### Warning #7-8: `admin/partners/governance/*.tsx:39,52` — `loadAuditData`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/admin/partners/governance/audit/page.tsx` |
| **Lines** | 39, 52 |
| **Hook** | `useEffect(() => { loadAuditData() }, [filters])` |
| **Missing Dependency** | `loadAuditData` |
| **Current Behavior** | Runs when filters change |

**Intent Analysis:**
```typescript
useEffect(() => {
  loadAuditData()  // Reload governance audit data
}, [filters])  // Filter changes trigger reload
```

**Why dependency was omitted:**
- `filters` state is the trigger
- `loadAuditData` uses `filters` internally
- Function identity shouldn't trigger reload

**Intended Lifecycle:**
- ✅ Run when admin changes filter selections
- ❌ Do NOT re-run on function recreation

**Proposed Strategy:**
| Option | Description | Recommendation |
|--------|-------------|----------------|
| A | Wrap `loadAuditData` in `useCallback([filters])` | ✅ RECOMMENDED |
| B | Keep `[filters]` with inline comment | ✅ ACCEPTABLE |

---

### Warning #9: `admin/partners/governance/*.tsx:55` — `checkAuthAndLoadData`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/admin/partners/governance/*/page.tsx` |
| **Line** | 55 |
| **Hook** | `useEffect(() => { checkAuthAndLoadData() }, [])` |
| **Missing Dependency** | `checkAuthAndLoadData` |
| **Current Behavior** | Runs once on mount |

**Intent Analysis:**
- Auth check + initial data load pattern
- Mount-only execution is intentional
- Same pattern as Warning #1

**Proposed Strategy:** Keep empty deps with inline comment (intentional mount-only)

---

### Warning #10: `admin/tenants/[id]/page.tsx:58` — `fetchTenantDetails`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/admin/tenants/[id]/page.tsx` |
| **Line** | 58 |
| **Hook** | `useEffect(() => { if (tenantId) fetchTenantDetails() }, [tenantId])` |
| **Missing Dependency** | `fetchTenantDetails` |
| **Current Behavior** | Runs when tenantId changes |

**Intent Analysis:**
- URL param `tenantId` triggers tenant detail load
- Same pattern as funnel/site editors

**Proposed Strategy:** `useCallback` wrapper recommended

---

### Warning #11: `pos/page.tsx:451` — `slug`

| Property | Value |
|----------|-------|
| **File** | `/app/frontend/src/app/parkhub/pos/page.tsx` (or similar) |
| **Line** | 451 (if file exists) |
| **Hook** | `useEffect` with missing `slug` dependency |
| **Note** | Need to verify exact file location |

**Status:** Requires verification — line 451 exceeds some POS page lengths

---

## Summary Table

| # | File | Missing Dep | Recommended Action |
|---|------|-------------|-------------------|
| 1 | partner/page.tsx:101 | `checkAuthAndFetchDashboard` | Keep empty + comment |
| 2 | partner-portal/page.tsx:162 | `fetchSession` | Keep + comment |
| 3 | partner-portal/page.tsx:168 | `fetchPartnerData` | `useCallback` wrap |
| 4 | (Duplicate of #2) | — | — |
| 5 | funnels/.../editor/page.tsx:110 | `fetchFunnel` | `useCallback` wrap |
| 6 | sites/.../editor/page.tsx:100 | `fetchSite` | `useCallback` wrap |
| 7-8 | governance/audit/page.tsx:39,52 | `loadAuditData` | `useCallback` wrap |
| 9 | governance/*/page.tsx:55 | `checkAuthAndLoadData` | Keep empty + comment |
| 10 | admin/tenants/[id]/page.tsx:58 | `fetchTenantDetails` | `useCallback` wrap |
| 11 | pos/page.tsx:451 | `slug` | Verify & assess |

---

## Proposed Remediation Categories

### Category A: Safe to Fix with `useCallback` (6 warnings)
- #3, #5, #6, #7, #8, #10
- Pattern: URL param or filter state triggers fetch
- Fix: Wrap function in `useCallback` with matching deps

### Category B: Intentional Empty Deps — Document Only (4 warnings)
- #1, #2, #4, #9
- Pattern: Mount-only or auth-state-only execution
- Fix: Add inline comment explaining intent

### Category C: Requires Verification (1 warning)
- #11 (POS slug)
- Status: Need to locate exact file and understand context

---

## 🛑 HARD STOP

**No code changes are permitted until this matrix is reviewed and approved.**

Domain owners must confirm:
1. The "Intended Lifecycle" descriptions are accurate
2. The "Proposed Strategy" recommendations are acceptable
3. Any Category B items are truly intentional suppressions

---

**END OF PHASE 14A DOMAIN INTENT MATRIX**
