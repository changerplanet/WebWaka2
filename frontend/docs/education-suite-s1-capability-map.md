# Education Suite — S1 Capability Mapping

**Suite**: Education  
**Standard**: Platform Standardisation v2  
**Phase**: S1 — Capability Mapping  
**Created**: January 7, 2026  
**Status**: COMPLETE  
**Prerequisite**: S0 Domain Audit ✅

---

## Purpose

This document maps the specific capabilities required for the Education Suite, identifies reuse opportunities from Commerce, and declares demo/narrative intent per v2 requirements.

---

## Capability Legend

| Symbol | Meaning |
|--------|---------|
| 🔲 | To be built (Education-specific) |
| ♻️ | Reuse from Commerce |
| 🔗 | Integration required |

---

## 1. Student & Guardian Management

### Student Registry

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Student CRUD | Create, read, update student profiles | 🔲 | Core Education entity |
| Student ID generation | Unique identifier per institution | 🔲 | Format: `STU-{YEAR}-{SEQ}` |
| Demographics | Name, DOB, gender, nationality | 🔲 | |
| Contact info | Phone, email, address | 🔲 | |
| Medical notes | Allergies, conditions (optional) | 🔲 | PII — restricted access |
| Photo | Student photograph | 🔲 | Optional |
| Status management | Active, suspended, withdrawn, graduated | 🔲 | State machine |
| Status history | Audit trail of status changes | 🔲 | Append-only |

### Guardian Management

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Guardian CRUD | Create, read, update guardian profiles | 🔲 | |
| Guardian-student linking | Many-to-many relationship | 🔲 | Siblings support |
| Primary contact | Designate primary guardian | 🔲 | For communications |
| Relationship type | Father, mother, guardian, sponsor | 🔲 | |
| Communication preferences | SMS, email, WhatsApp | 🔲 | Nigeria-first |

### Enrollment

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Admission application | New student intake | 🔲 | |
| Enrollment confirmation | Accept → Active | 🔲 | |
| Class assignment | Assign to class/level | 🔲 | |
| Transfer in | From another school | 🔲 | |
| Transfer out | To another school | 🔲 | |
| Withdrawal | Student leaves | 🔲 | Reason capture |
| Graduation | Completion of programme | 🔲 | |

---

## 2. Academic Structure

### Sessions & Terms

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Session CRUD | Academic year management | 🔲 | e.g., 2025/2026 |
| Term CRUD | Term 1, 2, 3 per session | 🔲 | Nigeria 3-term default |
| Term dates | Start, end, mid-term break | 🔲 | |
| Active term | Current operational term | 🔲 | System-wide context |
| Term rollover | Advance to next term | 🔲 | Batch operation |

### Classes & Levels

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Class CRUD | JSS1, SS2, Year 1, etc. | 🔲 | |
| Class capacity | Maximum students | 🔲 | Optional |
| Class teacher | Form teacher assignment | 🔲 | |
| Class arms | JSS1A, JSS1B (streams) | 🔲 | Optional |
| Promotion rules | Auto-promote, manual, conditional | 🔲 | End-of-session |

### Courses & Subjects

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Subject catalog | Mathematics, English, etc. | 🔲 | Institution-level |
| Subject-class mapping | Which subjects for which class | 🔲 | |
| Compulsory vs elective | Subject categorization | 🔲 | |
| Credit units | For tertiary (optional) | 🔲 | |

### Teacher Assignment

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Teacher-subject-class | Who teaches what where | 🔲 | |
| Assignment history | Past assignments | 🔲 | Audit |

---

## 3. Fees & Billing (COMMERCE REUSE)

> **Principle**: Education does not re-implement billing.
> Education emits fee facts → Billing creates invoices → Payments processes → Accounting records.

### Fee Definition (Education-Specific)

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Fee schedule CRUD | Define fees per term/class | 🔲 | Education owns definition |
| Fee types | Tuition, levy, exam, PTA | 🔲 | Configurable |
| Fee-class mapping | Different fees per level | 🔲 | |
| Scholarship/discount | Percentage or fixed reduction | 🔲 | |
| Fee waiver | Full exemption | 🔲 | |

### Billing Integration (Reuse)

| Capability | Source | Integration |
|------------|--------|-------------|
| Invoice generation | ♻️ **Billing Suite** | Education emits `FeeAssessed` event |
| Invoice line items | ♻️ **Billing Suite** | Fee types become line items |
| VAT handling | ♻️ **Billing Suite** | VAT-exempt flag for education |
| Invoice status | ♻️ **Billing Suite** | Draft, sent, paid, overdue |
| Credit notes | ♻️ **Billing Suite** | Refunds, adjustments |

### Payment Integration (Reuse)

| Capability | Source | Integration |
|------------|--------|-------------|
| Payment collection | ♻️ **Payments Suite** | Standard flows |
| Partial payments | ♻️ **Payments Suite** | Installment support |
| Payment methods | ♻️ **Payments Suite** | Bank, card, mobile money |
| Receipt generation | ♻️ **Payments Suite** | Reuse templates |
| Outstanding tracking | ♻️ **Billing Suite** | Arrears reports |

### Accounting Integration (Reuse)

| Capability | Source | Integration |
|------------|--------|-------------|
| Revenue recognition | ♻️ **Accounting Suite** | Journal entries |
| Fee receivable | ♻️ **Accounting Suite** | AR tracking |
| Financial reports | ♻️ **Accounting Suite** | P&L, balance sheet |

### Education-Specific Billing Rules

| Rule | Description |
|------|-------------|
| Block results on outstanding | Configurable per institution |
| Payment deadline enforcement | Grace period settings |
| Sibling discount | Auto-apply for linked students |
| Sponsor billing | Bill to sponsor instead of guardian |

---

## 4. Attendance

### Daily Attendance

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Mark attendance | Present, absent, late, excused | 🔲 | Per student per day |
| Bulk marking | Mark entire class at once | 🔲 | Teacher efficiency |
| Backfill support | Enter past attendance | 🔲 | Offline tolerance |
| Attendance notes | Reason for absence | 🔲 | Optional |

### Period Attendance (Optional)

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Per-subject attendance | Track per class period | 🔲 | Advanced feature |
| Teacher sign-off | Confirm attendance taken | 🔲 | |

### Attendance Reporting

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Daily summary | Class attendance for the day | 🔲 | |
| Student attendance history | Individual student record | 🔲 | |
| Term attendance report | Percentage over term | 🔲 | |
| Absence alerts | Notify guardian on threshold | 🔲 | SMS/WhatsApp |

---

## 5. Assessment & Results

### Continuous Assessment (CA)

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| CA entry | Tests, assignments, class work | 🔲 | Per subject |
| CA categories | Test 1, Test 2, Assignment, etc. | 🔲 | Configurable |
| CA weighting | Percentage contribution | 🔲 | e.g., 40% of total |
| Bulk CA entry | Enter scores for entire class | 🔲 | |

### Examinations

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Exam setup | Mid-term, end-of-term | 🔲 | |
| Exam scores | Per subject per student | 🔲 | |
| Exam weighting | Percentage contribution | 🔲 | e.g., 60% of total |

### Grading

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Grading scale | A-F, percentage, GPA | 🔲 | Configurable per institution |
| Grade calculation | CA + Exam → Final grade | 🔲 | Automatic |
| Grade boundaries | A=70-100, B=60-69, etc. | 🔲 | |
| Remark generation | "Excellent", "Good", etc. | 🔲 | Based on grade |

### Results

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Result sheet | Per-student term results | 🔲 | Printable |
| Class result list | All students in class | 🔲 | Teacher view |
| Position/ranking | Class position | 🔲 | Optional, configurable |
| Subject position | Rank per subject | 🔲 | Optional |
| Class average | Average score per subject | 🔲 | |
| Result approval | Principal/admin sign-off | 🔲 | Before release |
| Result release | Make visible to parents | 🔲 | Controlled |

### Transcripts

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Cumulative record | All terms/sessions | 🔲 | |
| Transcript generation | Official document | 🔲 | Printable/PDF |
| Transcript integrity | Append-only design | 🔲 | No retroactive changes |
| Digital verification | QR code / hash (future) | 🔲 | Phase 2+ |

---

## 6. Staff Management (Light)

| Capability | Description | Status | Notes |
|------------|-------------|--------|-------|
| Teacher profile | Name, subjects, qualifications | 🔲 | |
| Admin roles | Bursar, registrar, principal | 🔲 | |
| Role assignment | Staff → Role | 🔲 | RBAC integration |
| Staff-class mapping | Who handles which class | 🔲 | |

> **Note**: Full HR (payroll, leave, etc.) is out of scope. Light staff management only.

---

## 7. Reports (Cross-Cutting)

| Report | Description | Status |
|--------|-------------|--------|
| Enrollment summary | Students by class, status | 🔲 |
| Fee collection report | Paid, outstanding by class | ♻️ Billing |
| Attendance report | By class, by student | 🔲 |
| Result summary | Class performance | 🔲 |
| Term report card | Per-student printable | 🔲 |

---

## 8. Demo & Narrative (MANDATORY — v2)

### Demo Route

| Requirement | Target | Status |
|-------------|--------|--------|
| Demo page | `/education-demo` | 🔲 S4 |
| DemoModeProvider | Wrap page | 🔲 S5 |
| DemoOverlay | Support tooltips | 🔲 S5 |
| Quick Start | `?quickstart=school` | 🔲 S5 |
| Commerce Demo link | Listed in portal | 🔲 S5 |

### Storyline Participation

| Storyline | Persona | Key Steps | Status |
|-----------|---------|-----------|--------|
| School Owner | Founders, administrators | Enrollment → Fees → Attendance → Results → Accounting | 🔲 S5 |
| Parent | Parents, guardians | View child → Pay fees → See results | 🔲 S5 |
| Auditor | Regulators | Compliance → Audit trails | 🔲 S5 |

### Quick Start Roles (Proposed)

| Role | Storyline | Tagline |
|------|-----------|---------|
| `school` | School Owner | "Run your school from enrollment to graduation" |
| `parent` | Parent | "Track your child's education journey" |

### Demo Promise

> "From enrollment → fees → attendance → results → accounting, without chaos."

---

## Integration Summary

### Commerce Suite Reuse

| Commerce Suite | Education Usage | Integration Type |
|----------------|-----------------|------------------|
| **Billing** | Fee invoicing | Event-driven |
| **Payments** | Payment collection | Direct reuse |
| **Accounting** | Financial records | Event-driven |

### Integration Pattern

```
Education                    Commerce
─────────────────────────────────────────
[Fee Schedule] 
      │
      ▼
[FeeAssessed Event] ──────► [Billing Suite]
                                  │
                                  ▼
                           [Invoice Created]
                                  │
                                  ▼
                           [Payments Suite]
                                  │
                                  ▼
                           [PaymentReceived Event]
                                  │
                                  ▼
                           [Accounting Suite]
                                  │
                                  ▼
                           [Journal Entry]
```

---

## S1 Completion Checklist

| Requirement | Status |
|-------------|--------|
| Student/Guardian capabilities mapped | ✅ |
| Academic structure capabilities mapped | ✅ |
| Fees & Billing (Commerce reuse) declared | ✅ |
| Attendance capabilities mapped | ✅ |
| Assessment & Results capabilities mapped | ✅ |
| Staff management (light) mapped | ✅ |
| Demo intent declared | ✅ |
| Storylines proposed | ✅ |
| Quick Start roles proposed | ✅ |

---

## S1 Sign-Off

**S1 Capability Mapping: COMPLETE**

Education Suite S0–S1 is complete under Platform Standardisation v2.

### Next Steps (Require Authorization)

| Phase | Description | Status |
|-------|-------------|--------|
| S2 | Schema & Services | 🔲 Awaiting authorization |
| S3 | API Layer | 🔲 Blocked on S2 |
| S4 | Demo UI | 🔲 Blocked on S3 |
| S5 | Narrative Integration | 🔲 Blocked on S4 |
| S6 | Verification & FREEZE | 🔲 Blocked on S5 |

---

## 🛑 STOP POINT

Education Suite S0–S1 is complete.

**Awaiting explicit authorization to proceed with S2 (Schema & Services).**

---

*This document follows Platform Standardisation v2 requirements.*
