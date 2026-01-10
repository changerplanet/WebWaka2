# Education Suite — S2 Services Documentation

**Suite**: Education  
**Standard**: Platform Standardisation v2  
**Phase**: S2 — Schema & Services  
**Created**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document describes the domain services implemented for the Education Suite. All services are:
- Deterministic
- Tenant-scoped
- No API calls
- No UI logic
- No payment logic
- No journal logic

---

## Services Summary

| Service | File | Responsibility |
|---------|------|----------------|
| StudentService | `student-service.ts` | Student registry, guardians, status management |
| AcademicService | `academic-service.ts` | Sessions, terms, classes, subjects |
| FeeFactService | `fee-fact-service.ts` | Fee structures, fee facts → Billing |
| AttendanceService | `attendance-service.ts` | Daily attendance, backfill support |
| AssessmentService | `assessment-service.ts` | Assessments, grading, results |

---

## Student Service

### File
`/src/lib/education/student-service.ts`

### Responsibilities
- Student ID generation
- Student entity creation
- Guardian entity creation
- Guardian-student linking
- Status transition validation
- Input validation

### Key Functions

```typescript
// ID Generation
generateStudentId(prefix, year, sequence): string
// Example: "STU-2025-0001"

// Entity Creation
createStudentEntity(input, studentId): EduStudent
createGuardianEntity(input): EduGuardian
createGuardianLinkEntity(input): EduStudentGuardianLink

// Status Management
isValidStudentStatusTransition(from, to): boolean
getAllowedStudentStatuses(current): EduStudentStatus[]

// Validation
validateStudentInput(input): { valid, errors }
validateGuardianInput(input): { valid, errors }
```

### Nigeria-First Features
- Nigerian phone validation (+234...)
- Default nationality: "Nigerian"
- Guardian communication: SMS + WhatsApp preferred

---

## Academic Service

### File
`/src/lib/education/academic-service.ts`

### Responsibilities
- Session management
- Term management (3-term calendar)
- Class management
- Subject management
- Status transitions

### Key Functions

```typescript
// Session/Term Generation
generateSessionCode(startYear): string  // "2025-2026"
generateSessionName(startYear): string  // "2025/2026 Academic Session"
generateDefaultTerms(tenantId, sessionId, start, end): EduTerm[]

// Entity Creation
createSessionEntity(input): EduSession
createTermEntity(input): EduTerm
createClassEntity(input): EduClass
createSubjectEntity(input): EduSubject

// Status Management
isValidSessionStatusTransition(from, to): boolean
isValidTermStatusTransition(from, to): boolean

// Validation
validateSessionInput(input): { valid, errors }
validateClassInput(input): { valid, errors }
validateSubjectInput(input): { valid, errors }
```

### Nigeria-First Constants

```typescript
DEFAULT_TERM_COUNT = 3        // Nigeria 3-term system
DEFAULT_CA_WEIGHT = 40        // 40% CA
DEFAULT_EXAM_WEIGHT = 60      // 60% Exam

TERM_NAMES = {
  TERM_1: 'First Term',
  TERM_2: 'Second Term',
  TERM_3: 'Third Term'
}

NIGERIA_SECONDARY_SUBJECTS = [
  { code: 'ENG', name: 'English Language', isCompulsory: true },
  { code: 'MATH', name: 'Mathematics', isCompulsory: true },
  // ... 24 standard subjects
]
```

---

## Fee Fact Service

### File
`/src/lib/education/fee-fact-service.ts`

### Responsibilities
- Fee structure management
- Fee assignment to students
- **Fee fact emission to Billing Suite** (CRITICAL)
- Discount calculations

### Key Functions

```typescript
// Entity Creation
createFeeStructureEntity(input): EduFeeStructure
createFeeAssignmentEntity(input, structure, number): EduFeeAssignment

// Commerce Integration
createFeeFact(assignment, structure, student, guardian?, context?): FeeFact

// Payment Status (from Billing callbacks)
calculatePaymentStatus(amountPaid, finalAmount): EduFeeAssignmentStatus

// Discounts
calculateSiblingDiscount(siblingNumber, baseAmount): { percent, amount }
calculateScholarshipDiscount(percent, baseAmount): number

// Validation
validateFeeStructureInput(input): { valid, errors }
validateAssignFeeInput(input): { valid, errors }
```

### Commerce Reuse Boundary (CRITICAL)

```
┌─────────────────────────────────────────────────────────────┐
│                         EDUCATION                           │
│                                                             │
│  edu_fee_structure → edu_fee_assignment → createFeeFact()   │
│                                                   │         │
└───────────────────────────────────────────────────┼─────────┘
                                                    │
                                                    ▼ FeeFact
┌─────────────────────────────────────────────────────────────┐
│                         COMMERCE                            │
│                                                             │
│  billing_invoices → payments → accounting_journals          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Nigeria-First Constants

```typescript
EDUCATION_VAT_EXEMPT = true   // Education is VAT-exempt
DEFAULT_CURRENCY = 'NGN'
DEFAULT_INSTALLMENT_COUNT = 3 // Most parents pay in 3 installments
DEFAULT_GRACE_PERIOD_DAYS = 14
```

---

## Attendance Service

### File
`/src/lib/education/attendance-service.ts`

### Responsibilities
- Daily attendance recording
- Bulk attendance (class-level)
- Attendance statistics
- Absence alerts
- Backfill support (offline tolerance)

### Key Functions

```typescript
// Entity Creation
createAttendanceEntity(input): EduAttendance
createBulkAttendanceEntities(...): EduAttendance[]

// Statistics
calculateAttendanceStats(attendances): AttendanceStats
calculateDailyClassSummary(attendances, date): DailySummary

// Alerts
checkAbsenceAlert(stats, thresholds): { needsAlert, alertLevel }

// Backfill Validation
validateBackfillDate(date, termStart, termEnd): { valid, error }

// Date Helpers
getWeekdaysInRange(start, end): Date[]
isWeekday(date): boolean

// Validation
validateAttendanceInput(input): { valid, errors }
```

### Nigeria-First Features
- Backfill support for rural schools with poor connectivity
- Absence alerts via SMS/WhatsApp (thresholds configurable)

---

## Assessment Service

### File
`/src/lib/education/assessment-service.ts`

### Responsibilities
- Assessment recording (CA, tests, exams)
- Grade calculation
- Result computation
- Position/ranking
- **Transcript integrity** (append-only)

### Key Functions

```typescript
// Entity Creation
createAssessmentEntity(input): EduAssessment
createResultEntity(input): EduResult

// Grading
getGradeFromScore(score, boundaries): GradeBoundary
calculateTotalScore(ca, exam, caMax, examMax): number
calculateCaTotal(assessments, targetMax): number

// Ranking
calculatePositions(studentScores): Map<studentId, { position, classSize }>
calculateClassAverage(studentScores): number

// Status Transitions
isValidResultStatusTransition(from, to): boolean
getAllowedResultStatuses(current): EduResultStatus[]

// Transcript Integrity
canModifyResult(result): { canModify, reason }
createResultLock(reason): ResultLock

// Validation
validateAssessmentInput(input): { valid, errors }
```

### Nigeria-First Grading Scale

```typescript
NIGERIA_GRADE_BOUNDARIES = [
  { grade: 'A', minScore: 70, maxScore: 100, gradePoint: 4.0, remark: 'Excellent' },
  { grade: 'B', minScore: 60, maxScore: 69, gradePoint: 3.5, remark: 'Very Good' },
  { grade: 'C', minScore: 50, maxScore: 59, gradePoint: 3.0, remark: 'Good' },
  { grade: 'D', minScore: 45, maxScore: 49, gradePoint: 2.5, remark: 'Fair' },
  { grade: 'E', minScore: 40, maxScore: 44, gradePoint: 2.0, remark: 'Pass' },
  { grade: 'F', minScore: 0,  maxScore: 39, gradePoint: 0.0, remark: 'Fail' },
]
```

### Transcript Integrity

Results follow append-only design:
- `DRAFT` → `SUBMITTED` → `APPROVED` → `RELEASED` → `LOCKED`
- Once `RELEASED`, cannot be modified
- Once `LOCKED`, immutable for transcripts
- Lock includes timestamp and reason

---

## Type Definitions

### File
`/src/lib/education/types.ts`

### Contents
- All enum types (mirrored from Prisma)
- All entity interfaces
- Input types for service functions
- `FeeFact` interface for Commerce integration

---

## Barrel Export

### File
`/src/lib/education/index.ts`

### Usage

```typescript
import {
  // Types
  EduStudent,
  EduFeeAssignment,
  FeeFact,
  
  // Student service
  generateStudentId,
  createStudentEntity,
  validateStudentInput,
  
  // Academic service
  generateDefaultTerms,
  NIGERIA_SECONDARY_SUBJECTS,
  
  // Fee fact service
  createFeeFact,
  EDUCATION_VAT_EXEMPT,
  
  // Attendance service
  calculateAttendanceStats,
  
  // Assessment service
  getGradeFromScore,
  NIGERIA_GRADE_BOUNDARIES,
} from '@/lib/education'
```

---

## Verification

TypeScript compilation verified:
```
✅ npx tsc --noEmit --skipLibCheck src/lib/education/*.ts
```

---

## Guardrails Compliance

| Rule | Status |
|------|--------|
| ❌ No API routes | ✅ Compliant |
| ❌ No UI logic | ✅ Compliant |
| ❌ No payment logic | ✅ Compliant |
| ❌ No journal logic | ✅ Compliant |
| ✅ Deterministic | ✅ Compliant |
| ✅ Tenant-scoped | ✅ Compliant |
| ✅ Commerce reuse explicit | ✅ Compliant |

---

## Document References

- `/docs/education-suite-s0-domain-audit.md`
- `/docs/education-suite-s1-capability-map.md`
- `/docs/education-suite-s2-schema.md`
- `/docs/education-suite-s2-services.md` (this document)

---

*This document follows Platform Standardisation v2 requirements.*
