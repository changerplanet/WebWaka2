# Platform Standardisation v2

## Canonical Template for All Product Suites

**Version**: 2.0.0  
**Effective Date**: January 7, 2026  
**Status**: ACTIVE

---

## Purpose

Platform Standardisation v2 defines the mandatory lifecycle, guardrails, and presentation requirements for all current and future suites built on the platform.

This document elevates **Demo Mode**, **Quick Start**, and **Narrative Flow** to first-class platform requirements, based on the Commerce pillar serving as the reference implementation.

> **Commerce is not a vertical. Commerce is the constitution.**

---

## Core Principles

### 1. Canonical First
- Every suite must follow the same lifecycle (S0–S6)
- No bespoke shortcuts
- Deviations require explicit justification and approval

### 2. Nigeria-First by Default
- Currency (NGN)
- Tax behavior (7.5% VAT)
- Payment methods (bank transfer, mobile money, cards)
- Regulatory assumptions (CAC, FIRS, sector-specific)

### 3. Narrative Is Infrastructure
- Demo Mode and Quick Start are **not** marketing features
- They are **platform guarantees**
- Every suite must be demonstrable to investors, partners, and regulators

### 4. Freeze Means Freeze
- Once S6 is reached, future work is **additive only**
- No modifications to frozen logic
- Breaking changes require new version (v1.1+)

---

## Mandatory Lifecycle (All Suites)

| Phase | Name | Description | Deliverables |
|-------|------|-------------|--------------|
| **S0** | Domain Audit | Scope, exclusions, regulatory context | Intent document |
| **S1** | Capability Mapping | Capabilities, gaps, reuse of existing suites | Capability matrix |
| **S2** | Schema & Services | Domain models, services, Nigeria-first defaults | Schema + service docs |
| **S3** | API Layer | `/api/[suite]/*`, capability guards | API specification |
| **S4** | Demo UI | `/[suite]-demo` page | Working demo page |
| **S5** | Narrative Integration | Demo Mode + Quick Start | Storyline participation |
| **S6** | Verification & FREEZE | Tests, documentation, freeze declaration | FREEZE document |

> ⚠️ **S5 is mandatory. No suite may be frozen without it.**

---

## Phase Details

### S0 — Domain Audit

**Purpose**: Define what the suite does and does not do.

**Required Outputs**:
- Scope statement (what's in)
- Exclusions (what's explicitly out)
- Regulatory context (Nigeria-specific requirements)
- Dependency map (which existing suites it reuses)

**Template**:
```markdown
## [Suite Name] — S0 Domain Audit

### Scope
- [Capability 1]
- [Capability 2]

### Exclusions
- [What we won't build]

### Regulatory Context
- [Nigeria-specific requirements]

### Dependencies
- Reuses: [Billing, Payments, etc.]
```

---

### S1 — Capability Mapping

**Purpose**: Define specific capabilities and their implementation approach.

**Required Outputs**:
- Capability list with descriptions
- Reuse vs. build-new decisions
- Gap analysis against existing platform capabilities

**Template**:
```markdown
## [Suite Name] — S1 Capability Mapping

| Capability | Description | Approach | Source |
|------------|-------------|----------|--------|
| [Name] | [What it does] | Reuse / Build | [Existing suite or New] |
```

---

### S2 — Schema & Services

**Purpose**: Harden the data model and service layer.

**Required Outputs**:
- Domain models (Prisma schema or equivalent)
- Service interfaces
- Nigeria-first defaults (currency, tax, etc.)

**Guardrails**:
- All monetary values in NGN (kobo for precision)
- VAT defaulted to 7.5%
- Timestamps in UTC, displayed in WAT

---

### S3 — API Layer

**Purpose**: Expose suite capabilities via guarded APIs.

**Required Outputs**:
- API routes under `/api/[suite]/*`
- Capability guards (who can access what)
- Error responses (standardized format)

**Guardrails**:
- All routes prefixed with `/api`
- Authentication required unless explicitly public
- Rate limiting on write operations

---

### S4 — Demo UI

**Purpose**: Create a demonstrable interface for the suite.

**Required Outputs**:
- `/[suite]-demo` route
- Demo-safe data (no real customer data)
- Read-only or reversible actions

**Guardrails**:
- Must load without authentication
- Nigeria-first copy visible
- Mobile-responsive

---

### S5 — Narrative Integration (NEW in v2)

**Purpose**: Integrate the suite into the platform's narrative engine.

**Required Outputs**:
- Wrapped in `DemoModeProvider`
- Supports `DemoOverlay`
- Participates in at least one storyline
- Resolves correctly via `?quickstart=[role]`
- Linked from `/commerce-demo`

> ⚠️ **Failure to meet S5 requirements blocks FREEZE.**

**Implementation Checklist**:
```tsx
// Required wrapper
<DemoModeProvider>
  <YourSuiteDemo />
</DemoModeProvider>

// Required overlay support
<DemoOverlay suiteId="your-suite" />

// Required storyline step
{
  id: 'your-suite-step',
  suiteId: 'your-suite',
  route: '/your-suite-demo',
  // ...
}
```

---

### S6 — Verification & FREEZE

**Purpose**: Formally verify and lock the suite.

**Required Outputs**:
- All S0–S5 complete
- Demo Compliance Checklist satisfied
- Phase documentation complete
- Verification report attached
- FREEZE declaration signed

**FREEZE Declaration Template**:
```markdown
## [Suite Name] — S6 FREEZE Declaration

**Status**: FROZEN
**Version**: 1.0.0
**Frozen Date**: [Date]
**Frozen By**: [Agent/Team]

### Scope Lock
- [What's included]
- [What's excluded]

### Files Frozen
- [List of frozen files]

### Future Work
- All changes must be additive (v1.1+)
```

---

## Demo Compliance Checklist (Required for FREEZE)

This checklist must be fully satisfied before any suite can be marked FROZEN.

### Routing & Access

- [ ] `/[suite]-demo` route exists
- [ ] Linked from `/commerce-demo` portal
- [ ] Loads without authentication
- [ ] Returns 200 OK (no errors)

### Demo Mode Integration

- [ ] Wrapped with `DemoModeProvider`
- [ ] `DemoOverlay` renders correctly
- [ ] Exit demo returns user safely
- [ ] Demo state does not persist after exit

### Quick Start Compatibility

- [ ] Responds to `?quickstart=[role]` appropriately
- [ ] Invalid roles fail safely (no crash)
- [ ] Role banner displays correctly when applicable
- [ ] Keyboard escape (Esc) works

### Storyline Participation

- [ ] At least one storyline step references this suite
- [ ] Step copy is Nigeria-first
- [ ] Navigation advances correctly to next step
- [ ] Back navigation works

### Guardrails

- [ ] No destructive writes in demo mode
- [ ] Clear "demo / derived" notices where needed
- [ ] No cookies or tracking (unless explicitly approved)
- [ ] Demo data is clearly synthetic

---

## Demo Entry Requirements

Each suite must expose:

| Requirement | Description |
|-------------|-------------|
| **Route** | `/[suite]-demo` |
| **Data** | Demo-safe, synthetic data |
| **Actions** | Read-only or reversible |
| **Copy** | Nigeria-first language |
| **Accessibility** | No auth required |

---

## Freeze Gate Requirements

A suite **cannot** be marked FROZEN unless:

1. ✅ S0–S6 are complete
2. ✅ Demo Compliance Checklist is fully satisfied
3. ✅ Documentation exists for each phase
4. ✅ Verification report is attached
5. ✅ At least one storyline includes the suite

---

## Reference Implementation

The following suites are the **reference baseline** for v2:

| Suite | Status | Notes |
|-------|--------|-------|
| Commerce (8 sub-suites) | ✅ FROZEN | Reference implementation |
| Partner Demo Mode v1.1 | ✅ FROZEN | Narrative engine |
| Quick Start v0 | ✅ FROZEN | Entry point control |
| Convergence v0 | ✅ FROZEN | Cross-suite visibility |

All future suites must match or exceed this bar.

---

## Quick Start Role Mappings

New suites should consider adding relevant roles:

| Role | Current Storyline | Potential Expansion |
|------|-------------------|---------------------|
| `investor` | Full Tour | Include new suite overview |
| `cfo` | CFO / Finance | Include financial features |
| `regulator` | Regulator / Auditor | Include compliance features |
| `partner` | Retail | Include partner-relevant features |
| `founder` | SME | Include operational features |

---

## Storyline Integration Guide

When adding a suite to an existing storyline:

```typescript
// In /lib/demo/storylines.ts

const existingStoryline: Storyline = {
  // ...existing steps...
  steps: [
    // ...existing steps...
    {
      id: 'new-suite-step',
      suiteId: 'new-suite',
      title: 'Your Feature',
      route: '/new-suite-demo',
      tooltip: {
        title: 'Feature Name',
        description: 'What this does',
        highlight: 'Key benefit',
        tip: 'Nigeria-first insight'
      }
    }
  ]
}
```

---

## Audit Procedure (Existing Suites)

For suites built before v2, conduct an audit:

### Audit Table Template

| Phase | v2 Requirement | Current Status | Gap |
|-------|----------------|----------------|-----|
| S0 | Domain audit doc | ✅ / 🟡 / ❌ | [Description] |
| S1 | Capability map | ✅ / 🟡 / ❌ | [Description] |
| S2 | Services hardened | ✅ / 🟡 / ❌ | [Description] |
| S3 | API guarded | ✅ / 🟡 / ❌ | [Description] |
| S4 | Demo page | ✅ / 🟡 / ❌ | [Description] |
| S5 | Demo Mode + Quick Start | ✅ / 🟡 / ❌ | [Description] |
| S6 | Verification + freeze | ✅ / 🟡 / ❌ | [Description] |

### Status Legend

- ✅ Complete — Meets v2 requirements
- 🟡 Partial — Exists but needs updates
- ❌ Missing — Does not exist

### Rules

1. No refactoring unless required for compliance
2. Any ❌ in S5 blocks FREEZE under v2
3. Output documented in `/docs/platform-standardisation-v2-audit.md`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial standardisation (S0-S4) |
| 2.0.0 | Jan 7, 2026 | Added S5 (Narrative Integration), Demo Compliance Checklist |

---

## Governance

### Change Process

1. Propose change via documentation
2. Review against Core Principles
3. Approval required before implementation
4. Version increment on approval

### Enforcement

- All new suites must follow v2 from S0
- Existing suites must be audited against v2
- FREEZE blocked until compliance achieved

---

*This document is the canonical reference for platform standardisation. All suites, current and future, must comply.*
