# Post-Phase Z Comprehensive Bug Hunt Report
**Generated:** January 14, 2026  
**Investigation Type:** READ-ONLY (Documentation Only)  
**Platform:** WebWaka Multi-Tenant SaaS  

---

## Executive Summary

This bug hunt was conducted after Phase Z validation to identify issues not caught in the initial 61-test validation sweep. The investigation covered the entire platform including marketing website, authentication, APIs, suites, database integrity, and security.

### Summary Statistics
| Category | Count | Severity Distribution |
|----------|-------|----------------------|
| **Critical Bugs** | 5 | Production blockers |
| **High Priority** | 8 | Must fix before launch |
| **Medium Priority** | 12 | Should fix soon |
| **Low Priority** | 7 | Nice to have |
| **Total Issues** | 32 | - |

---

## Critical Bugs (P0 - Production Blockers)

### BUG-001: Missing `/sites-funnels-suite` Page (404)
- **Location:** Homepage footer, navigation
- **Symptom:** Links to `/sites-funnels-suite` return 404 error
- **Impact:** Users clicking "Sites & Funnels" link see error page
- **Root Cause:** No `page.tsx` in `frontend/src/app/sites-funnels-suite/` directory
- **Evidence:** 
  - 2 broken links found on homepage: `href="/sites-funnels-suite"`
  - Only subpage exists: `sites-funnels-suite/admin/page.tsx`
- **Fix:** Create `page.tsx` or redirect to `/sites-funnels-suite/admin`

### BUG-002: Missing POS Shifts API Endpoint
- **Location:** `/api/pos/shifts`
- **Symptom:** API returns HTML 404 instead of JSON
- **Impact:** POS shift management functionality broken
- **Evidence:** 
  - Workflow log: `GET /api/pos/shifts 404 in 332ms`
  - Database has: `pos_shift` table with 2 records
  - Missing route: `frontend/src/app/api/pos/shifts/route.ts`
- **Fix:** Create shifts API endpoint

### BUG-003: npm Security Vulnerabilities (Critical + High)
- **Location:** `frontend/package.json`
- **Vulnerabilities:**
  | Package | Severity | Issue |
  |---------|----------|-------|
  | next 14.2.21 | CRITICAL | Authorization Bypass, SSRF, DoS, Cache Poisoning (8 CVEs) |
  | glob 10.2.0-10.4.5 | HIGH | Command injection via -c/--cmd flag |
  | @next/eslint-plugin-next | HIGH | Depends on vulnerable glob |
  | eslint-config-next | HIGH | Depends on vulnerable @next/eslint-plugin-next |
- **Total:** 4 vulnerabilities (3 high, 1 critical)
- **Fix:** Run `npm audit fix --force` (upgrades Next.js to 14.2.35)

### BUG-004: Mock Data in Production Code
- **Location:** `frontend/src/app/education/students/page.tsx`
- **Symptom:** Page displays hardcoded mock students instead of database data
- **Evidence:** 
  ```typescript
  const mockStudents: Student[] = [
  let filtered = mockStudents;
  ```
- **Impact:** Education suite shows fake data instead of real demo records
- **Fix:** Replace with Prisma database queries

### BUG-005: Missing Education Students API Endpoint
- **Location:** `/api/edu/students`
- **Symptom:** Returns HTML 404 instead of JSON error
- **Expected:** `/api/education/students` exists but `/api/edu/students` doesn't
- **Impact:** Front-end calling wrong endpoint

---

## High Priority Bugs (P1 - Must Fix Before Launch)

### BUG-006: Hardcoded `localhost:3000` References
- **Count:** 9 files affected
- **Port Issue:** Server runs on port 5000, not 3000
- **Affected Files:**
  1. `src/app/api/auth/magic-link/route.ts`
  2. `src/app/api/debug/activate-all-capabilities/route.ts`
  3. `src/lib/partner-first/client-service.ts` (2 occurrences)
  4. `src/lib/partner-tenant-creation.ts`
  5. `src/lib/demo/types.ts`
  6. `src/lib/intent/service.ts`
  7. `src/lib/tenant-resolver.ts`
  8. `src/middleware.ts`
- **Fix:** Use environment variable `process.env.NEXT_PUBLIC_APP_URL`

### BUG-007: Duplicate Login Pages with Inconsistent UX
- **Pages:**
  - `/login` - Magic link only (email entry)
  - `/login-v2` - Phone + email with password, "Remember device" option
- **Link Distribution:**
  - 6 links to `/login`
  - 5 links to `/login-v2`
- **Impact:** Inconsistent user experience, confusion
- **Fix:** Consolidate to single login page or clearly differentiate purposes

### BUG-008: `/pos-suite` Returns 404
- **Location:** Direct URL access
- **Evidence:** Screenshot shows 404 page
- **Note:** No `/pos-suite/` directory exists
- **Fix:** Create page or redirect to proper POS dashboard

### BUG-009: `/sites-funnels` Also Returns 404
- **Distinction:** Different from `/sites-funnels-suite`
- **Impact:** Multiple broken URL patterns

### BUG-010: API Returns HTML Instead of JSON for 404s
- **Affected Endpoints:**
  - `/api/edu/students` → HTML 404
  - `/api/pos/shifts` → HTML 404
- **Expected:** `{"error": "Not Found", "status": 404}`
- **Impact:** Client-side error handling breaks

### BUG-011: Large Console Error Footprint
- **Count:** 1,004 console.error statements
- **Location:** Primarily in API routes (`src/app/api/`)
- **Impact:** Noise in production logs, potential performance impact
- **Note:** Many are legitimate error handling, but count is high

### BUG-012: NEXT_PUBLIC_APP_URL Environment Variable Not Set
- **Evidence:** Multiple fallbacks to localhost:3000
- **Impact:** Magic links, redirects may break in production

### BUG-013: 8 TODO/FIXME Comments in Production Code
- **Location:** Various files in `src/`
- **Impact:** Incomplete features or technical debt

---

## Medium Priority Bugs (P2 - Should Fix Soon)

### BUG-014: Sample/Demo Data References in Production Pages
- **Count:** Multiple occurrences
- **Examples:**
  - `src/app/civic-demo/page.tsx`: Sample codes array
  - `src/app/dashboard/integrations/page.tsx`: SAMPLE_PAYLOADS
  - `src/app/education-demo/page.tsx`: "sample Nigerian school data"
  - `src/app/demo/playbooks/page.tsx`: "Fee amounts are sample"

### BUG-015: Missing Suite Landing Pages
- **Pattern:** Suite directories exist but lack index page.tsx
- **Affected:**
  - `/sites-funnels-suite` (only has /admin)
  - Potentially others

### BUG-016: Inconsistent Route Naming
- **Examples:**
  - `/api/education/` vs `/api/edu/`
  - `/sites-funnels-suite` vs `/sites-funnels`
  - Pages with `-suite` suffix vs without

### BUG-017: 21 "return null" Statements in Components
- **Location:** `src/app/` directory
- **Impact:** Potential empty renders, loading states, or error states not handled

### BUG-018: Missing Canonical Login Page Redirect
- **Issue:** No redirect from deprecated login to primary login
- **Impact:** Bookmarked URLs may break

### BUG-019: Suite Admin Pages Load with Spinner (No Timeout)
- **Evidence:** `/sites-funnels-suite/admin` shows eternal spinner
- **Impact:** User gets stuck on loading screen

### BUG-020: Generic Page Titles
- **Examples:**
  - `/sites-funnels-suite` → "WebWaka" (not descriptive)
  - `/logistics-suite` → "WebWaka"
- **Good Example:** `/real-estate-suite` → "Real Estate Management | WebWaka"

### BUG-021: API tenantId Requirement Not Clear
- **Evidence:** `GET /api/svm/products` returns `{"success":false,"error":"tenantId is required"}`
- **Impact:** Developers may not know how to pass tenantId

### BUG-022: Missing Error Boundaries
- **Evidence:** API errors result in generic error pages
- **Impact:** Poor user experience on errors

### BUG-023: PWA Service Worker Logs Duplicated
- **Evidence:** "Service Worker registered" appears twice in console
- **Impact:** Minor, but indicates potential double registration

### BUG-024: Potential Session Leak (51 Active Sessions)
- **Count:** 51 sessions for 96 users
- **Note:** Needs investigation if sessions are being cleaned up properly

### BUG-025: Demo Indicator Component Not Visible
- **Check:** DemoIndicator component added in Phase D7
- **Status:** Needs verification it's actually rendering

---

## Low Priority Bugs (P3 - Nice to Have)

### BUG-026: React DevTools Warning in Console
- **Message:** "Download the React DevTools for a better development experience"
- **Impact:** None in production

### BUG-027: No robots.txt Optimization
- **Current:** Default behavior
- **Suggestion:** Optimize for SEO

### BUG-028: Missing Breadcrumb Navigation
- **Pages:** Suite admin pages lack breadcrumbs
- **Impact:** Navigation UX

### BUG-029: Form Placeholder Styling Inconsistency
- **Examples:** Some use "you@example.com", others use "Your email address"
- **Impact:** Minor UX inconsistency

### BUG-030: No Loading Skeleton Components
- **Current:** Generic spinners
- **Better:** Content-aware skeleton loaders

### BUG-031: Partner Portal Only Shows Login (Expected)
- **Status:** Working correctly - requires authentication
- **Note:** Not a bug, just documentation

### BUG-032: View Test OTPs Button Visible in UI
- **Location:** `/login-v2` page
- **Note:** Intentional for demo, should be hidden in production

---

## Database Integrity Check (PASSED ✅)

| Check | Status |
|-------|--------|
| Total Tables | 378 |
| Orphan Sessions | 0 |
| Orphan Memberships | 0 |
| Tenants | 16 |
| Users | 96 |
| Sessions | 51 |
| Partners | 1 |
| Memberships | 91 |
| Products | 25 |
| POS Shifts | 2 |
| POS Sales | 20 |

---

## Recommended Fix Priority

### Immediate (Before Any Public Demo)
1. BUG-001: Fix `/sites-funnels-suite` 404
2. BUG-002: Create POS shifts API
3. BUG-003: npm audit fix
4. BUG-004: Replace mock education data
5. BUG-006: Fix localhost references

### Before Production Launch
6. BUG-007: Consolidate login pages
7. BUG-010: JSON error responses for APIs
8. BUG-012: Set NEXT_PUBLIC_APP_URL
9. BUG-019: Add loading timeouts
10. BUG-020: Fix page titles

### Technical Debt (Post-Launch)
- Reduce console.error count
- Clear TODO/FIXME comments
- Implement error boundaries
- Add skeleton loaders

---

## Files Requiring Attention

| File Path | Issue Count | Priority |
|-----------|-------------|----------|
| `src/app/(home)/page.tsx` | 2 broken links | P0 |
| `src/app/education/students/page.tsx` | Mock data | P0 |
| `src/app/api/auth/magic-link/route.ts` | localhost:3000 | P1 |
| `src/lib/partner-first/client-service.ts` | localhost:3000 x2 | P1 |
| `frontend/package.json` | npm vulnerabilities | P0 |

---

## Next Steps

1. **Create Fix Tasks:** Convert this report into actionable task list
2. **Prioritize by Impact:** Address P0 bugs first
3. **Regression Test:** Re-run Phase Z validation after fixes
4. **Production Checklist:** Create pre-deployment checklist

---

**Report Generated By:** WebWaka Platform Bug Hunt  
**Investigation Mode:** Read-Only  
**No Code Changes Made During This Investigation**
