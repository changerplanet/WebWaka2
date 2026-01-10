# Education Suite — S2 Schema Documentation

**Suite**: Education  
**Standard**: Platform Standardisation v2  
**Phase**: S2 — Schema & Services  
**Created**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document describes the Prisma schema additions for the Education Suite. All tables follow the `edu_` prefix convention and are additive to the existing schema.

---

## Schema Summary

| Model | Description | Records |
|-------|-------------|---------|
| `edu_session` | Academic year (e.g., 2025/2026) | Sessions |
| `edu_term` | Term within a session | Terms |
| `edu_class` | Class/Level (e.g., JSS1, SS2) | Classes |
| `edu_subject` | Subject/Course catalog | Subjects |
| `edu_class_subject` | Subject-Class-Teacher mapping | Assignments |
| `edu_student` | Core student entity | Students |
| `edu_guardian` | Parent/Guardian entity | Guardians |
| `edu_student_guardian` | Student-Guardian relationships | Links |
| `edu_staff` | Teachers and admins (light) | Staff |
| `edu_enrollment` | Student-Class-Session enrollment | Enrollments |
| `edu_fee_structure` | Fee definitions per class/term | Fee definitions |
| `edu_fee_assignment` | Fee assigned to a student | Assigned fees |
| `edu_attendance` | Daily attendance records | Attendance |
| `edu_assessment` | Individual assessment scores | Assessments |
| `edu_result` | Computed term result per subject | Results |
| `edu_grading_scale` | Configurable grading rules | Scales |
| `edu_config` | Tenant-level education settings | Config |

---

## Nigeria-First Defaults

| Setting | Default Value | Rationale |
|---------|---------------|-----------|
| Term count | 3 | Nigeria standard academic calendar |
| CA weight | 40% | Standard continuous assessment weight |
| Exam weight | 60% | Standard examination weight |
| VAT exempt | true | Education services are VAT-exempt in Nigeria |
| Currency | NGN | Nigerian Naira |
| Communication | SMS + WhatsApp | Primary contact methods in Nigeria |

---

## Entity Relationship Diagram (Text)

```
edu_session (1) ──── (*) edu_term
      │
      └── (*) edu_enrollment

edu_class (1) ──── (*) edu_enrollment
      │          ──── (*) edu_class_subject
      │          ──── (*) edu_attendance
      │          ──── (*) edu_assessment
      │          ──── (*) edu_result
      │          ──── (*) edu_fee_structure
      └── (1) edu_staff [classTeacher]

edu_subject (1) ──── (*) edu_class_subject
             ──── (*) edu_assessment
             ──── (*) edu_result

edu_student (1) ──── (*) edu_student_guardian
           ──── (*) edu_enrollment
           ──── (*) edu_attendance
           ──── (*) edu_assessment
           ──── (*) edu_result
           ──── (*) edu_fee_assignment

edu_guardian (1) ──── (*) edu_student_guardian

edu_staff (1) ──── (*) edu_class_subject [teacher]
         ──── (*) edu_attendance [markedBy]
         ──── (*) edu_assessment [gradedBy]
         ──── (*) edu_result [approvedBy]
```

---

## Core Models

### edu_session

Academic year container.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | Tenant scope |
| name | String | "2025/2026 Academic Session" |
| code | String | "2025-2026" (unique per tenant) |
| startDate | DateTime | Session start |
| endDate | DateTime | Session end |
| status | EduSessionStatus | PLANNED, ACTIVE, COMPLETED, ARCHIVED |
| isCurrent | Boolean | Is this the current session? |
| termCount | Int | Number of terms (default: 3) |

### edu_term

Term within a session.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | Tenant scope |
| sessionId | String | Parent session |
| termNumber | EduTermNumber | TERM_1, TERM_2, TERM_3 |
| name | String | "First Term" |
| startDate | DateTime | Term start |
| endDate | DateTime | Term end |
| midTermBreakStart | DateTime? | Optional mid-term break |
| midTermBreakEnd | DateTime? | Optional mid-term break |
| status | EduTermStatus | PLANNED, ACTIVE, COMPLETED, ARCHIVED |
| isCurrent | Boolean | Is this the current term? |
| resultsLocked | Boolean | Lock results (transcript integrity) |

### edu_student

Core student entity.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | Tenant scope |
| studentId | String | "STU-2025-0001" (unique per tenant) |
| firstName | String | First name |
| lastName | String | Last name |
| middleName | String? | Middle name |
| fullName | String? | Computed full name |
| dateOfBirth | DateTime? | Date of birth |
| gender | String? | M, F, Other |
| nationality | String | Default: "Nigerian" |
| stateOfOrigin | String? | State of origin |
| lga | String? | Local Government Area |
| status | EduStudentStatus | PROSPECTIVE → ACTIVE → GRADUATED |
| admissionDate | DateTime? | When admitted |
| admissionNumber | String? | Admission number |

### edu_fee_assignment

Fee assigned to a student (Commerce integration point).

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | Tenant scope |
| studentId | String | Student owing the fee |
| feeStructureId | String | Reference to fee structure |
| originalAmount | Decimal | Original fee amount |
| discountAmount | Decimal | Discount (scholarship, sibling) |
| finalAmount | Decimal | Amount after discount |
| status | EduFeeAssignmentStatus | PENDING → BILLED → PAID |
| billingInvoiceId | String? | **Link to Billing Suite** |
| billingInvoiceRef | String? | Invoice number for display |
| amountPaid | Decimal | Denormalized payment tracking |
| amountOutstanding | Decimal | Remaining balance |

### edu_result

Computed term result (append-only for transcript integrity).

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | Tenant scope |
| studentId | String | Student |
| classId | String | Class |
| subjectId | String | Subject |
| termId | String | Term |
| sessionId | String | Session |
| caScore | Decimal | Total CA score |
| examScore | Decimal | Exam score |
| totalScore | Decimal | CA + Exam |
| grade | String? | A, B, C, D, E, F |
| gradePoint | Decimal? | 4.0, 3.5, etc. |
| remark | String? | Excellent, Good, etc. |
| classPosition | Int? | Position in class (optional) |
| status | EduResultStatus | DRAFT → SUBMITTED → APPROVED → RELEASED → LOCKED |
| isLocked | Boolean | Transcript lock (cannot modify) |
| lockedAt | DateTime? | When locked |
| lockedReason | String? | Why locked |

---

## Enums

### Student Lifecycle
```
EduStudentStatus: PROSPECTIVE → ACTIVE → GRADUATED/WITHDRAWN/etc.
```

### Enrollment Lifecycle
```
EduEnrollmentStatus: PENDING → APPROVED → ENROLLED
```

### Session/Term Lifecycle
```
EduSessionStatus: PLANNED → ACTIVE → COMPLETED → ARCHIVED
EduTermStatus: PLANNED → ACTIVE → COMPLETED → ARCHIVED
```

### Fee Assignment Lifecycle
```
EduFeeAssignmentStatus: PENDING → BILLED → PARTIALLY_PAID → PAID
```

### Result Lifecycle
```
EduResultStatus: DRAFT → SUBMITTED → APPROVED → RELEASED → LOCKED
```

---

## Commerce Integration

### Fee Fact Flow

Education emits fee facts to Billing Suite:

```
1. edu_fee_structure   [Education defines fee]
         ↓
2. edu_fee_assignment  [Education assigns to student]
         ↓
3. FeeFact event       [Education emits to Billing]
         ↓
4. billing_invoices    [Billing creates invoice]
         ↓
5. payments            [Payments processes]
         ↓
6. accounting_journals [Accounting records]
```

### Integration Fields

`edu_fee_assignment` has explicit Commerce links:
- `billingInvoiceId` → Reference to `billing_invoices.id`
- `billingInvoiceRef` → Invoice number for display

Education **never** handles money directly. It only:
- Defines fee structures
- Assigns fees to students
- Emits facts to Billing
- Receives payment status updates

---

## Indexes

All tables include indexes on:
- `tenantId` — Multi-tenant isolation
- `status` — Status-based queries
- Foreign keys — Relationship queries

---

## Validation

Prisma schema has been validated:
```
✅ npx prisma format — Success
✅ npx prisma validate — Success
```

---

## Document References

- `/docs/education-suite-s0-domain-audit.md`
- `/docs/education-suite-s1-capability-map.md`
- `/docs/education-suite-s2-schema.md` (this document)

---

*This document follows Platform Standardisation v2 requirements.*
