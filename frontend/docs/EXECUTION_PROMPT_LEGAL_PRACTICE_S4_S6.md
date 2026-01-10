# 🚀 EXECUTION PROMPT — LEGAL PRACTICE SUITE S4–S6

## Platform Standardisation v2

You are now executing **Legal Practice Suite — S4 & S5 (Demo UI + Narrative Integration)** followed by **S6 (Verification & FREEZE)** under Platform Standardisation v2.

---

## CONTEXT (DO NOT SKIP)

- Legal Practice Suite has **S0–S3 COMPLETE**.
- Schema (`leg_*` tables), services, and API layer already exist and are stable.
- This suite is currently **PRE-v2 / LEGACY** due to missing demo and narrative layers.
- **NO schema, service, or API changes are allowed in this task.**
- Commerce is the constitutional reference.
- Demo Mode, Quick Start, and Storylines are mandatory platform requirements.

**Your job is to canonicalize Legal Practice to v2 by completing S4, S5, and S6.**

---

## 🎯 OBJECTIVE

Bring Legal Practice Suite to narrative parity with other v2-frozen verticals by:

1. Creating a demo-safe UI (`/legal-demo`)
2. Integrating Partner Demo Mode
3. Registering storylines
4. Enabling Quick Start role entry
5. Verifying and declaring FREEZE

**No business logic changes. No persistence changes. No refactors.**

---

## 📦 S4 — DEMO UI (REQUIRED)

### 1. Demo Page
Create: `/legal-demo`

### 2. Demo Scenario (Nigeria-First)
Use a realistic Nigerian context:

> **"Adebayo & Partners, Lagos"**
> A mid-sized commercial law firm handling civil, corporate, and banking matters across Nigerian courts.

### 3. UI Requirements
The demo page MUST include:

- `DemoModeProvider` wrapper
- Demo Preview Mode (unauthenticated view)
- Hero section with suite title
- Nigeria-first badges (Capability Guarded, Demo Mode, NGN context)
- Stats cards (e.g., Active Matters, Billable Hours, Deadlines, Retainer Balance)
- Module cards (Active):
  - Matters & Cases
  - Time & Billing
  - Clients & Parties
  - Court Deadlines
  - Documents & Filings
  - Retainers
- Architecture diagram showing:
  - Legal Practice → (Fee Facts) → Commerce (Billing/Invoicing/Payments)
- Clear "Demo / Sample Data" notice
- Footer navigation consistent with other demos

### 4. Demo Data
- Use existing demo data utilities if present (`/scripts/seed-legal-practice-demo.ts`)
- If missing, create demo-only seed logic (NO schema changes)
- Data must be:
  - Read-only safe
  - Deterministic
  - Nigerian-contextual (Nigerian courts, NGN currency, Nigerian lawyer names)

---

## 📘 S5 — NARRATIVE INTEGRATION (MANDATORY)

### 1. Demo Mode Integration
- Wrap `/legal-demo` in `DemoModeProvider`
- Enable `DemoOverlay`
- Ensure Exit Demo returns to `/commerce-demo`

### 2. Storylines (REGISTER ALL)

Register **4 storylines** in `storylines.ts`:

| Storyline ID | Persona | Steps | Narrative Focus |
|-------------|---------|-------|-----------------|
| `legalClient` | Client / Instructing Party | 5 | Matter visibility, billing transparency, deadline awareness |
| `lawyer` | Lawyer / Counsel | 7 | Matter workflow → time tracking → billing → filings |
| `firmAdmin` | Firm Administrator / Managing Partner | 6 | Practice oversight, team utilization, retainer management |
| `legalAuditor` | Regulator / Compliance / Finance | 6 | Fee verification, Commerce boundary, audit trail |

Each step MUST:
- Reference a real UI element
- Be read-only
- Advance cleanly
- Include Nigeria-first copy where relevant (Nigerian courts, NGN currency)

### 3. Quick Start Roles

Register Quick Start roles in `quickstart.ts`:

```
?quickstart=legalClient
?quickstart=lawyer
?quickstart=firmAdmin
?quickstart=legalAuditor
```

Requirements:
- Role banner displays correctly
- Copy Link works
- Switch Role works
- Invalid roles fail safely to selector

---

## 🔒 S6 — VERIFICATION & FREEZE

### Verification Checklist
Before declaring FREEZE, verify:

- [ ] `/legal-demo` loads without auth
- [ ] All 4 Quick Start URLs work
- [ ] Invalid quickstart fails safely
- [ ] DemoOverlay renders correctly
- [ ] Exit Demo returns to `/commerce-demo`
- [ ] No console errors
- [ ] Commerce boundary is visible and respected
- [ ] Prisma schema valid
- [ ] TypeScript compilation clean (for Legal Practice components)

### Documentation Required

Create: `/app/frontend/docs/legal-practice-suite-s4-s5-canonicalization.md`

Document:
- Demo scenario
- Storylines
- Quick Start roles
- Demo compliance confirmation

Update: `/app/memory/PRD.md`
- Mark S4 COMPLETE
- Mark S5 COMPLETE
- Mark S6 COMPLETE
- Change status from "PRE-v2 / LEGACY" to "🔒 FROZEN"

Create: `/app/frontend/docs/legal-practice-suite-s6-freeze.md`
- Formal FREEZE declaration
- Verification results

---

## 🚫 OUT OF SCOPE (STRICT)

- ❌ No schema changes
- ❌ No Prisma migrations
- ❌ No API changes
- ❌ No new capabilities
- ❌ No background jobs
- ❌ No notifications
- ❌ No persistence changes

---

## 🧪 VERIFICATION REQUIREMENTS

Before stopping, verify:
- `/legal-demo` loads without auth
- All 4 Quick Start URLs work
- Invalid quickstart fails safely
- DemoOverlay renders correctly
- Exit Demo returns to `/commerce-demo`
- No console errors
- Commerce boundary is visible and respected

---

## 📝 COMMERCE BOUNDARY (CRITICAL)

Legal Practice Suite respects the Commerce boundary:

### What Legal Practice Does
- ✅ Matter Management
- ✅ Time Entry Tracking
- ✅ Retainer Management
- ✅ Deadline Tracking
- ✅ Document Management
- ✅ Court Filing Records
- ✅ Fee & Disbursement Facts

### What Commerce Handles
- ✅ Invoice Generation
- ✅ Payment Collection
- ✅ VAT Calculation
- ✅ Accounting Journals
- ✅ Client Payments

**Boundary Rule**: Legal Practice creates fee facts (billable hours, disbursements, retainer usage). Commerce handles invoicing, VAT calculation, payment collection, and accounting. Legal Practice NEVER processes payments directly.

---

## 🛑 STOP POINT

When S4–S5–S6 are complete:
- Present a formal **Legal Practice Suite FREEZE declaration summary**
- Include verification results
- Confirm PRD has been updated

---

## REFERENCE

- Platform Standardisation v2
- Commerce, Education, Health, Hospitality, Civic, Logistics, Real Estate, Project Management, Recruitment demos
- Existing Legal Practice Suite admin UI at `/legal-practice-suite`

---

**EXECUTE LEGAL PRACTICE SUITE — S4–S5–S6 NOW.**
