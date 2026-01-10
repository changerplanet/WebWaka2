# Civic / GovTech Suite — S5 Narrative Integration

## Overview

S5 completes the narrative integration for the Civic / GovTech Suite, making it **explainable** through guided tours and role-based quick starts.

**Status**: ✅ COMPLETE  
**Phase**: S5 (Narrative Integration)  
**Standard**: Platform Standardisation v2

---

## Storylines Registered (4)

### 1. Citizen Journey (`civicCitizen`)
**Persona**: Citizen, Property Owner, or Business Applicant  
**Duration**: 8 minutes  
**Steps**: 6

| Step | Title | Nigeria-First Note |
|------|-------|-------------------|
| 1 | Service Discovery | Lagos State Lands Bureau — C of O processing |
| 2 | Submit Application | Tracking codes like LSLB-A1B2C3 for instant reference |
| 3 | Track Progress | Public tracking builds trust in government services |
| 4 | Inspection Notification | Scheduled inspections reduce corruption opportunities |
| 5 | Fee Transparency | Published fees reduce rent-seeking behavior |
| 6 | Approval & Certificate | Digital certificates reduce fraud and forgery |

### 2. Agency Staff Workflow (`civicAgencyStaff`)
**Persona**: Agency Staff, Case Officer, or Department Head  
**Duration**: 10 minutes  
**Steps**: 7

| Step | Title | Nigeria-First Note |
|------|-------|-------------------|
| 1 | Case Assignment | Automated assignment prevents preferential treatment |
| 2 | Document Review | Digital document management reduces lost files |
| 3 | Schedule Inspection | GPS tracking proves inspectors actually visited |
| 4 | Record Findings | Append-only prevents after-the-fact tampering |
| 5 | Make Recommendation | Recorded reasoning enables quality review |
| 6 | SLA Monitoring | SLA enforcement improves service delivery |
| 7 | Billing Facts | Commerce boundary prevents fee manipulation |

### 3. Regulator Oversight (`civicRegulator`)
**Persona**: Regulator, Compliance Officer, or Government Inspector  
**Duration**: 8 minutes  
**Steps**: 6

| Step | Title | Nigeria-First Note |
|------|-------|-------------------|
| 1 | Agency Performance | Performance visibility enables accountability |
| 2 | SLA Breach Reports | Pattern detection identifies systemic issues |
| 3 | Approval Patterns | Consistency analysis detects unfair treatment |
| 4 | Audit Trail Review | Full traceability enables investigation |
| 5 | Fee Compliance | Fee transparency eliminates extortion |
| 6 | FOI Readiness | FOI compliance builds public trust |

### 4. Auditor Review (`civicAuditor`)
**Persona**: Internal Auditor, External Auditor, or Anti-Corruption Officer  
**Duration**: 8 minutes  
**Steps**: 6

| Step | Title | Nigeria-First Note |
|------|-------|-------------------|
| 1 | Case Reconstruction | Rapid case reconstruction saves audit time |
| 2 | Decision Chain | Named accountability prevents ghost approvals |
| 3 | Inspection Verification | GPS proof eliminates desk inspections |
| 4 | Fee Fact Reconciliation | Fact-based reconciliation catches leakage |
| 5 | Anomaly Detection | Pattern anomalies often indicate corruption |
| 6 | Audit Report Export | System-generated reports are tamper-evident |

---

## Quick Start URLs

| Role | URL | Gradient |
|------|-----|----------|
| Citizen | `/civic-demo?quickstart=citizen` | Emerald |
| Agency Staff | `/civic-demo?quickstart=agencyStaff` | Violet |
| Regulator | `/civic-demo?quickstart=civicRegulator` | Rose |
| Auditor | `/civic-demo?quickstart=auditor` | Amber |

---

## Demo Mode Integration

### Components Used
- `DemoModeProvider` — Wraps the `/civic-demo` page
- `DemoOverlay` — Shows guided tour UI when storyline is active
- `QuickStartBanner` — Shows role-specific banner with copy link and switch role

### Behaviors
1. **No quickstart param**: Shows role selector cards
2. **Valid quickstart param**: Shows QuickStartBanner with role context
3. **Invalid quickstart param**: Fails safely to role selector
4. **Exit Demo (X button)**: Returns to `/commerce-demo`
5. **Switch Role**: Returns to `/civic-demo` (no param)
6. **Escape key**: Dismisses quickstart banner

---

## Files Modified

| File | Changes |
|------|---------|
| `/app/frontend/src/lib/demo/types.ts` | Added 4 new `StorylineId` types |
| `/app/frontend/src/lib/demo/storylines.ts` | Added 4 Civic storylines (27 total steps) |
| `/app/frontend/src/lib/demo/quickstart.ts` | Added 4 Quick Start roles with mappings |
| `/app/frontend/src/components/demo/QuickStartBanner.tsx` | Added Civic role messaging |
| `/app/frontend/src/app/civic-demo/page.tsx` | Wrapped with DemoModeProvider, integrated narrative components |

---

## Test Verification

### Quick Start URLs ✅
- [x] `?quickstart=citizen` — Emerald banner, correct tagline
- [x] `?quickstart=agencyStaff` — Violet banner, correct tagline
- [x] `?quickstart=civicRegulator` — Rose banner, correct tagline
- [x] `?quickstart=auditor` — Amber banner, correct tagline

### Safe Failures ✅
- [x] Invalid role (`?quickstart=invalidRole`) falls back to selector
- [x] No quickstart shows role selector cards

### Navigation ✅
- [x] Exit Demo returns to `/commerce-demo`
- [x] Switch Role returns to `/civic-demo`
- [x] Role cards link to correct quickstart URLs

---

## Strategic Value

S5 makes the Civic / GovTech Suite **explainable**.

- **Citizens** see transparency in action
- **Agency Staff** understand accountability workflows
- **Regulators** verify compliance mechanisms
- **Auditors** confirm integrity controls

If S4 proves the system works, **S5 proves the system can be trusted**.

---

## Next Phase

**S6 (Final Verification)**: Verify against Platform Standardisation v2 checklist and formally FREEZE the Civic / GovTech Suite.

*Do not proceed to S6 without explicit authorization.*
