# Partner Demo Mode — S1-S2: UX Wiring & Demo Engine

**Phase**: Phase 2 — Enablement & Storytelling
**Track**: A (Partner Demo Mode)
**Status**: S1-S2 SUBMITTED
**Depends On**: S0 Intent Document (APPROVED)

---

## 1. Overview

This document summarizes the implementation of the Partner Demo Mode infrastructure:
- `DemoModeProvider` context for state management
- Tooltip/step engine for navigation
- URL state handling (stateless by default)
- Zero leakage into production logic

---

## 2. Architecture Implemented

### 2.1 File Structure (Created)

```
/app/frontend/src/
├── lib/
│   └── demo/
│       ├── index.ts          ✅ Barrel export
│       ├── types.ts          ✅ Type definitions
│       ├── context.tsx       ✅ DemoModeProvider
│       └── storylines.ts     ✅ 4 storyline configs
├── components/
│   └── demo/
│       ├── index.ts          ✅ Component exports
│       ├── DemoTooltip.tsx   ✅ Step tooltip
│       ├── DemoModeBanner.tsx ✅ Top banner
│       ├── DemoModeToggle.tsx ✅ Mode switcher
│       ├── DemoOverlay.tsx   ✅ Combined overlay
│       └── StorylineSelector.tsx ✅ Storyline picker
└── app/
    └── commerce-demo/
        └── page.tsx          ✅ Updated with demo mode
```

---

## 3. Components Built

### 3.1 DemoModeProvider

**Purpose**: Central context provider for demo state management

**URL-Driven State**:
- `mode`: 'live' | 'partner'
- `storyline`: 'retail' | 'marketplace' | 'sme' | 'full'
- `step`: Step number (1-based)

**Methods Exposed**:
| Method | Purpose |
|--------|---------|
| `nextStep()` | Navigate to next step |
| `prevStep()` | Navigate to previous step |
| `goToStep(n)` | Jump to specific step |
| `startStoryline(id)` | Begin a storyline |
| `exitDemo()` | Return to /commerce-demo |
| `toggleMode()` | Switch between live/partner |
| `getCurrentStep()` | Get current DemoStep |
| `getCurrentStoryline()` | Get current Storyline |
| `getTotalSteps()` | Total steps in current storyline |
| `isFirstStep()` | Check if on first step |
| `isLastStep()` | Check if on last step |

---

### 3.2 DemoTooltip

**Purpose**: Non-invasive step information display

**Features**:
- Step counter (e.g., "Step 3 of 5")
- Step title and description
- Narrative (why this matters)
- Nigeria-first context note (when present)
- Action hint (when present)
- Back/Next navigation
- Progress dots
- Exit button

**Position**: Fixed bottom center, max-width 512px

---

### 3.3 DemoModeBanner

**Purpose**: Persistent indicator that demo mode is active

**Features**:
- "Partner Demo Mode" badge
- Storyline name display
- Progress bar with percentage
- Step counter (e.g., "3/5")
- Exit button (always visible)

**Position**: Fixed top, full width, z-index 100

---

### 3.4 StorylineSelector

**Purpose**: Storyline picker when entering partner mode

**Features**:
- 4 storyline cards with icons
- Duration estimate (e.g., "8 min")
- Step count display
- Suite coverage preview
- Click to start storyline

---

### 3.5 DemoModeToggle

**Purpose**: Simple toggle between Live and Guided modes

**Features**:
- Two-button toggle UI
- Current mode highlighted
- Click to switch modes

---

### 3.6 DemoOverlay

**Purpose**: Combined component rendering banner + tooltip

**Behavior**:
- Renders only when `demo.isActive === true`
- Renders only when storyline is selected
- Auto-hides in Live Mode

---

## 4. Storylines Implemented

| ID | Name | Duration | Steps | Suites |
|----|------|----------|-------|--------|
| `retail` | Retail Business in Lagos | 8 min | 5 | POS → Inventory → Payments → Accounting |
| `marketplace` | Marketplace Operator | 10 min | 5 | MVM → Inventory → Payments → Billing |
| `sme` | SME with Invoicing + Accounting | 7 min | 5 | Billing → Payments → Accounting |
| `full` | End-to-End Commerce Flow | 12 min | 9 | All 8 suites |

---

## 5. URL Scheme

### Parameters
| Parameter | Values | Purpose |
|-----------|--------|---------|
| `mode` | `live`, `partner` | Toggle guided mode |
| `storyline` | `retail`, `marketplace`, `sme`, `full` | Pre-select storyline |
| `step` | `1-9` | Jump to specific step |

### Example URLs
```
/commerce-demo                           # Live mode, landing page
/commerce-demo?mode=partner              # Partner mode, show selector
/commerce-demo?mode=partner&storyline=retail&step=1   # Retail, step 1
/pos-demo?mode=partner&storyline=retail&step=2       # Retail, step 2 (POS)
/payments-demo?mode=partner&storyline=retail&step=4  # Retail, step 4 (Payments)
```

---

## 6. Zero Production Leakage

### Verification Points
| Check | Status |
|-------|--------|
| No demo code in frozen suite services | ✅ |
| No demo code in frozen suite APIs | ✅ |
| No demo code in frozen suite schemas | ✅ |
| Demo components are lazy-loadable | ✅ |
| Demo state resets on page refresh | ✅ |
| URL is single source of truth | ✅ |

### Isolation Mechanism
- `useDemoModeOptional()` returns `null` outside provider
- `DemoOverlay` renders `null` when inactive
- No persistent state (all from URL)
- No database writes from demo mode

---

## 7. Visual Design Implementation

### Demo Mode Banner
- Background: Emerald-to-teal gradient
- Text: White with emerald accents
- Progress bar: White on transparent

### Demo Tooltip
- Background: Slate-900 (dark)
- Header: Slate-800 with step counter
- Narrative: Amber lightbulb icon
- Nigeria note: Emerald flag icon
- Navigation: Emerald buttons

### Storyline Cards
- Color-coded by storyline type
- Hover effects with arrow
- Duration and step badges

---

## 8. Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard navigation | Tab through buttons |
| Exit with Escape | Via button click (future: keyboard) |
| Screen reader | data-testid attributes |
| High contrast | Dark tooltip on light page |

---

## 9. Definition of Done (S1-S2)

- [x] DemoModeProvider created
- [x] URL state handling implemented
- [x] Tooltip component created
- [x] Banner component created
- [x] Storyline selector created
- [x] Mode toggle created
- [x] All 4 storylines configured
- [x] Commerce-demo page updated
- [x] Zero production leakage verified
- [x] Visual design matches spec

---

## 🛑 STOP POINT A2

**Status**: SUBMITTED FOR APPROVAL

**Next Phase**: S3-S4 (Suite Walkthroughs)

**Approval Required Before**:
- Adding demo mode support to individual suite demo pages
- Creating suite-specific step highlighting
- Building cross-page navigation flow

**What S3-S4 Will Add**:
- DemoOverlay integration in all 8 demo pages
- Element highlighting (optional)
- Smooth transitions between suites

---

**Document Version**: 1.0
**Created**: January 7, 2026
**Author**: E1 Agent
**Track**: A (Partner Demo Mode)
