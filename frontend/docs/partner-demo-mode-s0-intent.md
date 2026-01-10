# Partner Demo Mode — S0: Intent & UX Narrative

**Phase**: Phase 2 — Enablement & Storytelling
**Track**: A (Partner Demo Mode)
**Status**: S0 SUBMITTED
**Risk Level**: LOW
**Touches Frozen Suites**: ❌ NO (UI-only, orchestration-only)

---

## 1. Executive Summary

Partner Demo Mode transforms the Commerce Suite from a static showcase into a **guided storytelling experience**. It enables Partners, Investors, and Regulators to understand the platform's value through structured walkthroughs—without requiring technical knowledge or manual navigation.

### What This Is
- A **guided overlay system** on existing demo pages
- **Repeatable, trainable sales motions** for partners
- **Contextual tooltips** explaining "why this matters"
- A **toggle mode** (Live vs. Guided) preserving real functionality

### What This Is NOT
- ❌ Mock data or fake transactions
- ❌ Changes to frozen suite logic
- ❌ New APIs or database modifications
- ❌ A separate demo environment

---

## 2. Target Audiences

| Audience | Primary Need | Demo Focus |
|----------|--------------|------------|
| **Partners** | Sales enablement, client onboarding | End-to-end flows, ROI narratives |
| **Investors** | Platform maturity, market fit | Architecture breadth, Nigeria-first design |
| **Regulators** | Compliance, audit trails | VAT handling, financial integrity |
| **Internal Team** | Training, alignment | Feature coverage, integration points |

---

## 3. Success Criteria

| Metric | Target |
|--------|--------|
| Time to complete full platform demo | < 15 minutes |
| Partner training time reduction | 50%+ |
| Demo abandonment rate | < 10% |
| Demo-to-conversion improvement | Measurable increase |

### Qualitative Success
- Partner can demo independently after one walkthrough
- Investor understands platform differentiation in 5 minutes
- No support tickets from demo confusion

---

## 4. Canonical Demo Storylines

### Storyline 1: "Retail Business in Lagos"
**Persona**: Small-to-medium retail shop owner
**Suites Covered**: POS → Inventory → Payments → Accounting

| Step | Suite | Action | Narrative |
|------|-------|--------|-----------|
| 1 | POS | Open shift | "Your day starts with opening a cash drawer" |
| 2 | POS | Process sale | "Ring up a customer with Naira, card, or transfer" |
| 3 | Inventory | Check stock | "Real-time stock levels prevent overselling" |
| 4 | Payments | View transfer | "Bank transfers are first-class citizens" |
| 5 | Accounting | See journal | "Every sale creates an audit-ready entry" |

---

### Storyline 2: "Marketplace Operator"
**Persona**: Platform owner connecting multiple vendors
**Suites Covered**: MVM → Inventory → Payments → Billing

| Step | Suite | Action | Narrative |
|------|-------|--------|-----------|
| 1 | MVM | View vendors | "Onboard vendors with approval workflow" |
| 2 | MVM | See commission | "Automatic 15% commission calculation" |
| 3 | Inventory | Multi-vendor stock | "Each vendor manages their own inventory" |
| 4 | Payments | Split payouts | "Split payments automatically by vendor" |
| 5 | Billing | Vendor invoice | "Generate invoices for vendor settlements" |

---

### Storyline 3: "SME with Invoicing + Accounting"
**Persona**: Service business needing financial management
**Suites Covered**: Billing → Payments → Accounting

| Step | Suite | Action | Narrative |
|------|-------|--------|-----------|
| 1 | Billing | Create invoice | "Professional invoices with 7.5% VAT" |
| 2 | Billing | Send to customer | "Email delivery with tracking" |
| 3 | Payments | Record payment | "Track partial payments over time" |
| 4 | Billing | Apply credit note | "Handle returns and adjustments properly" |
| 5 | Accounting | View trial balance | "Books are always balanced" |

---

### Storyline 4: "End-to-End Commerce Flow"
**Persona**: Investor or technical evaluator
**Suites Covered**: All 8 suites (overview)

| Step | Suite | Action | Narrative |
|------|-------|--------|-----------|
| 1 | Commerce Demo | Overview | "8 integrated suites, 40+ APIs" |
| 2 | POS | Quick demo | "Physical retail operations" |
| 3 | SVM | Quick demo | "Single-vendor e-commerce" |
| 4 | MVM | Quick demo | "Multi-vendor marketplace" |
| 5 | Inventory | Quick demo | "Stock control across channels" |
| 6 | Payments | Quick demo | "Nigeria-first payment methods" |
| 7 | Billing | Quick demo | "Invoicing with VAT compliance" |
| 8 | Accounting | Quick demo | "Double-entry bookkeeping" |
| 9 | Rules Engine | Quick demo | "Configuration-driven business logic" |

---

## 5. Demo Entry Points

### Primary Entry
```
/commerce-demo?mode=partner
```

### Mode Toggle
| Mode | Behavior |
|------|----------|
| **Live Mode** (default) | Standard demo pages, no overlays |
| **Guided Demo Mode** | Tooltip overlays, step navigation, storyline selection |

### URL Parameters
| Parameter | Values | Purpose |
|-----------|--------|---------|
| `mode` | `live`, `partner` | Toggle guided mode |
| `storyline` | `retail`, `marketplace`, `sme`, `full` | Pre-select storyline |
| `step` | `1-9` | Jump to specific step |

### Example URLs
- `/commerce-demo?mode=partner` — Start guided demo
- `/commerce-demo?mode=partner&storyline=retail` — Retail storyline
- `/payments-demo?mode=partner&step=3` — Jump to step 3 of payments

---

## 6. UX Principles

### Non-Invasive
- Tooltips appear alongside UI, never blocking
- Dismiss with click or Escape key
- Progress bar shows position in storyline

### Self-Documenting
- Each step explains "What you're seeing"
- Each step explains "Why this matters"
- Each step shows "Next: [action]"

### Escapable
- Exit button always visible
- Return to `/commerce-demo` at any time
- No forced completion

### Accessible
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatible
- High contrast tooltip backgrounds

---

## 7. Visual Design Guidelines

### Tooltip Anatomy
```
┌─────────────────────────────────────────┐
│ Step 3 of 5                        [X]  │
├─────────────────────────────────────────┤
│ 📍 Recording a Payment                  │
│                                         │
│ This is where you track incoming money. │
│ Partial payments are fully supported.   │
│                                         │
│ Nigeria-first: Bank transfer proof-of-  │
│ payment verification built in.          │
│                                         │
│ [← Back]              [Next →]          │
└─────────────────────────────────────────┘
```

### Progress Bar
```
━━━━━━━━━●━━━━━━━━━━
Step 3/5: Payments
```

### Highlighted Elements
- Pulsing border on target element
- Dimmed background (optional)
- Arrow pointing to element

---

## 8. Technical Boundaries

### What We Build (Track A)
| Component | Purpose |
|-----------|---------|
| `DemoModeProvider` | Context for demo state |
| `DemoTooltip` | Tooltip UI component |
| `DemoStepEngine` | Navigation logic |
| `DemoProgressBar` | Visual progress indicator |
| `DemoHighlight` | Element highlighting |
| Storyline configs | JSON-based step definitions |

### What We Don't Touch
| Component | Reason |
|-----------|--------|
| Frozen suite APIs | Phase boundary |
| Frozen suite services | Phase boundary |
| Frozen suite schemas | Phase boundary |
| Existing demo page logic | Additive only |

---

## 9. File Structure (Proposed)

```
/app/frontend/src/
├── lib/
│   └── demo/
│       ├── index.ts                 # Barrel export
│       ├── types.ts                 # Demo types
│       ├── context.tsx              # DemoModeProvider
│       ├── step-engine.ts           # Navigation logic
│       └── storylines/
│           ├── retail.ts            # Retail storyline config
│           ├── marketplace.ts       # Marketplace storyline config
│           ├── sme.ts               # SME storyline config
│           └── full-tour.ts         # Full tour config
├── components/
│   └── demo/
│       ├── DemoTooltip.tsx          # Tooltip component
│       ├── DemoProgressBar.tsx      # Progress indicator
│       ├── DemoHighlight.tsx        # Element highlighter
│       ├── DemoModeToggle.tsx       # Mode switcher
│       └── DemoStorylineSelector.tsx # Storyline picker
└── app/
    └── commerce-demo/
        └── page.tsx                 # Updated with demo mode support
```

---

## 10. Integration Points (Future)

### With Track B (Billing → Accounting)
Once Track B is frozen, Partner Demo Mode can show:
- "This invoice automatically creates these journal entries"
- Live accounting impact during billing walkthrough
- Cross-suite data flow visualization

### With Future Suites
- Same pattern applies to Education, Health, Civic, etc.
- Storyline configs are JSON-based, easily extensible

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Demo mode bleeds into production | Strict context isolation, URL param gating |
| Tooltips become stale | Storyline configs version-controlled, tied to suite versions |
| Performance impact | Lazy-load demo components, no DOM manipulation at rest |
| Accessibility regression | WCAG 2.1 AA compliance built into tooltip design |

---

## 12. Definition of Done (S0)

- [x] Intent document approved
- [x] Target audiences defined
- [x] Success criteria measurable
- [x] 4 canonical storylines documented
- [x] Entry points and URL scheme defined
- [x] UX principles established
- [x] Technical boundaries clear
- [x] File structure proposed
- [x] Risks identified

---

## 🛑 STOP POINT A0

**Status**: SUBMITTED FOR APPROVAL

**Next Phase**: S1–S2 (UX Wiring & Tooltip Engine)

**Approval Required Before**:
- Creating `/lib/demo/` namespace
- Building `DemoModeProvider`
- Implementing tooltip components

---

**Document Version**: 1.0
**Created**: January 7, 2026
**Author**: E1 Agent
**Track**: A (Partner Demo Mode)
