# Education Suite — S0 Domain Audit

**Suite**: Education  
**Standard**: Platform Standardisation v2  
**Phase**: S0 — Domain Audit  
**Created**: January 7, 2026  
**Status**: COMPLETE

---

## Purpose

This document defines the scope, exclusions, and regulatory context for the Education vertical under Platform Standardisation v2.

The Education Suite serves:
- Private schools (primary, secondary)
- Tertiary institutions
- Training centers
- EdTech platforms

All with **Nigeria-first assumptions**.

---

## Scope (What's In)

### 1. Student Registry
| Capability | Description |
|------------|-------------|
| Student profiles | Demographics, contact, medical notes |
| Guardian linking | Parent/guardian relationships |
| Enrollment lifecycle | Admission → Active → Graduated/Withdrawn |
| Student status | Active, suspended, withdrawn, graduated |
| Cohort management | Class/level assignment |

### 2. Academic Structure
| Capability | Description |
|------------|-------------|
| Sessions | Academic year (e.g., 2025/2026) |
| Terms | Term 1, 2, 3 (Nigeria standard) |
| Classes/Levels | JSS1, SS2, Year 1, etc. |
| Courses/Subjects | Subject catalog per level |
| Teacher assignment | Subject-to-teacher mapping |
| Timetable (basic) | Class schedule structure |

### 3. Fees & Billing
| Capability | Description |
|------------|-------------|
| Fee schedules | Tuition, levies, per-term breakdown |
| Installment plans | Partial payment support |
| Fee waivers | Scholarships, discounts |
| Receipts | Payment confirmation |
| Outstanding tracking | Arrears, reminders |

> **REUSE**: Billing, Payments, Accounting suites from Commerce

### 4. Attendance
| Capability | Description |
|------------|-------------|
| Daily attendance | Present/absent/late per student |
| Period attendance | Per-subject tracking (optional) |
| Backfill support | Offline capture, later sync |
| Attendance reports | Daily, weekly, term summaries |
| Absence alerts | Configurable thresholds |

### 5. Assessment & Results
| Capability | Description |
|------------|-------------|
| Continuous assessment (CA) | Tests, assignments, class work |
| Examinations | Mid-term, end-of-term |
| Grading rules | A-F, percentage, GPA configurable |
| Result sheets | Per-student, per-class |
| Transcripts | Cumulative academic record |
| Position/ranking | Class position (optional) |

### 6. Staff Management (Light)
| Capability | Description |
|------------|-------------|
| Teacher profiles | Name, subjects, classes |
| Admin roles | Bursar, registrar, principal |
| Staff-class assignment | Who teaches what |

---

## Exclusions (What's Out — Phase 1)

| Exclusion | Reason |
|-----------|--------|
| LMS / e-learning | Content delivery is separate product |
| Video streaming | Infrastructure complexity |
| National exam result ingestion | WAEC/NECO API integration is Phase 2+ |
| Government integrations | Ministry reporting is Phase 2+ |
| Hostel/boarding management | Separate vertical consideration |
| Transport management | Separate vertical consideration |
| Library management | Separate vertical consideration |
| Full HR for staff | Light staff only; HR suite separate |

---

## Nigeria-First Assumptions

### Academic Calendar
- **3-term system** (default)
- Term 1: September–December
- Term 2: January–April  
- Term 3: April–July
- Mid-term breaks supported

### Billing Behavior
- **Installments are common** — most parents pay in 2-3 installments
- Per-term billing (not annual lump sum)
- Development levies, PTA fees, exam fees as line items
- Outstanding fees may block result release (configurable)

### Guardian Relationships
- Multiple guardians per student supported
- Primary contact designation
- Guardian may have multiple students (siblings)
- WhatsApp/SMS as primary communication channels

### Currency & Tax
- **NGN only**
- **Education services are VAT-exempt** by default (verify per institution type)
- No automatic VAT calculation on school fees

### Offline Tolerance
- Attendance may be captured offline and synced later
- Results may be entered in batches
- Network resilience assumed for rural schools

### Grading Norms
- A (70-100), B (60-69), C (50-59), D (45-49), E (40-44), F (0-39) — common scale
- Position/ranking culturally expected but optional
- CA + Exam weighting (typically 40/60 or 30/70)

---

## Regulatory Context

### Private School Compliance
- State Ministry of Education registration
- Approved curriculum adherence
- Teacher qualification requirements
- Facility standards (varies by state)

### Data Privacy (NDPR)
- Student data is PII — consent required
- Guardian access to own children's records only
- Staff access scoped by role
- Data retention policies required

### Transcript Integrity
- Academic records should be **append-only** in spirit
- Result modifications require audit trail
- Transcript generation should be tamper-evident
- Digital signatures consideration for official transcripts

### Examination Bodies (Reference Only — Phase 1)
- WAEC (West African Examinations Council)
- NECO (National Examinations Council)
- JAMB (Joint Admissions and Matriculation Board)

> **Note**: Direct integration with these bodies is out of scope for Phase 1.

---

## Dependency Map (Commerce Reuse)

| Education Need | Commerce Suite | Integration Pattern |
|----------------|----------------|---------------------|
| Fee invoicing | **Billing** | Education emits fee facts → Billing creates invoices |
| Payment collection | **Payments** | Standard payment flows |
| Financial records | **Accounting** | Journal entries via existing adapters |
| Receipt generation | **Payments** | Reuse receipt templates |
| Outstanding tracking | **Billing** | Invoice status tracking |

### Reuse Principle
> **Education does not re-implement billing.**
> It emits facts into Billing.
> Billing emits events into Accounting.
> The chain is preserved.

---

## Demo Intent (S5 Preparation)

Even though Demo UI is S4+, we declare intent now:

### Demo Route
- `/education-demo`

### Demo Personas
| Persona | Journey |
|---------|---------|
| School Owner / Founder | Setup → Enrollment → Fees → Results |
| Parent / Guardian | View child → Pay fees → See results |
| Administrator / Bursar | Manage students → Track payments → Generate reports |
| Regulator | Compliance view, audit trails |

### Storyline Intent
| Storyline | Audience | Key Message |
|-----------|----------|-------------|
| School Owner | Founders, administrators | "From enrollment to accounting, without chaos" |
| Parent | Parents, guardians | "Know exactly what you owe and what your child achieved" |
| Auditor | Regulators, inspectors | "Full traceability from admission to graduation" |

### Quick Start Roles (Proposed)
- `?quickstart=school` → School Owner storyline
- `?quickstart=parent` → Parent storyline

---

## S0 Completion Checklist

| Requirement | Status |
|-------------|--------|
| Scope defined | ✅ |
| Exclusions explicit | ✅ |
| Nigeria-first assumptions documented | ✅ |
| Regulatory context captured | ✅ |
| Commerce reuse declared | ✅ |
| Demo intent stated | ✅ |

---

## S0 Sign-Off

**S0 Domain Audit: COMPLETE**

Education Suite may proceed to S1 (Capability Mapping).

---

*This document follows Platform Standardisation v2 requirements.*
