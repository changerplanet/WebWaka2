# Education Suite — S3 API Layer Documentation

**Suite**: Education  
**Standard**: Platform Standardisation v2  
**Phase**: S3 — API Layer  
**Created**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document describes the API layer implemented for the Education Suite. All APIs are:
- Capability-guarded (`education`)
- Session-authenticated
- Tenant-scoped
- Thin controllers delegating to S2 services

---

## API Endpoints Summary

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/education` | GET, POST | Suite configuration and initialization |
| `/api/education/students` | GET, POST | Student registry management |
| `/api/education/guardians` | GET, POST | Guardian management |
| `/api/education/staff` | GET, POST | Staff management (light) |
| `/api/education/academic` | GET, POST | Sessions, terms, classes, subjects |
| `/api/education/enrollments` | GET, POST | Student enrollment management |
| `/api/education/attendance` | GET, POST | Attendance tracking |
| `/api/education/assessments` | GET, POST | Assessments and results |
| `/api/education/fees` | GET, POST | Fee structures and assignments |
| `/api/education/grades` | GET, POST | Grade calculations and summaries |
| `/api/education/report-cards` | GET, POST | Report card generation |

---

## Capability Guard

All endpoints enforce the `education` capability:

```typescript
const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education')
if (guardResult) return guardResult
```

Response on capability inactive:
```json
{
  "success": false,
  "error": "Capability not active",
  "code": "CAPABILITY_INACTIVE",
  "capability": "education",
  "message": "The 'education' capability is not activated for this tenant."
}
```

---

## Endpoint Details

### 1. Main Route (`/api/education`)

#### GET
- `?action=config` — Get education configuration and defaults
- `?action=stats` — Get education statistics (counts)
- `?action=subjects-catalog` — Get Nigeria standard subjects

#### POST
- `action: 'initialize'` — Initialize education suite for tenant
- `action: 'update-config'` — Update configuration

**Example Response (config):**
```json
{
  "success": true,
  "initialized": true,
  "config": { "institutionName": "...", ... },
  "defaults": {
    "termCount": 3,
    "caWeight": 40,
    "examWeight": 60,
    "gradeBoundaries": [...]
  }
}
```

---

### 2. Students (`/api/education/students`)

#### GET
- `?id={studentId}` — Get single student with guardians and enrollment
- No ID: List students with filters
  - `?status=ACTIVE`
  - `?classId=...`
  - `?sessionId=...`
  - `?search=...`
  - `?page=1&limit=50`

#### POST Actions
- `action: 'create'` — Create new student
- `action: 'update'` — Update student details
- `action: 'update-status'` — Change student status (with transition validation)
- `action: 'link-guardian'` — Link guardian to student

**Example (Create Student):**
```json
{
  "action": "create",
  "firstName": "Adaeze",
  "lastName": "Okonkwo",
  "gender": "Female",
  "dateOfBirth": "2010-05-15"
}
```

---

### 3. Guardians (`/api/education/guardians`)

#### GET
- `?id={guardianId}` — Get single guardian with linked students
- No ID: List guardians with filters
  - `?search=...`
  - `?page=1&limit=50`

#### POST Actions
- `action: 'create'` — Create guardian
- `action: 'update'` — Update guardian
- `action: 'deactivate'` — Deactivate guardian

---

### 4. Staff (`/api/education/staff`)

#### GET
- `?id={staffId}` — Get single staff with class and subject assignments
- No ID: List staff with filters
  - `?role=TEACHER`
  - `?department=...`
  - `?search=...`
  - `?activeOnly=true`

#### POST Actions
- `action: 'create'` — Create staff member
- `action: 'update'` — Update staff details
- `action: 'assign-class-teacher'` — Assign as class teacher
- `action: 'assign-subject-teacher'` — Assign to teach subject in class
- `action: 'deactivate'` — Deactivate staff
- `action: 'link-user'` — Link to platform user account

---

### 5. Academic (`/api/education/academic`)

#### GET
- `?entity=sessions` — List academic sessions
- `?entity=terms` — List terms
- `?entity=classes` — List classes
- `?entity=subjects` — List subjects

#### POST Actions

**Sessions:**
- `entity: 'session', action: 'create'` — Create session with auto-generated terms
- `entity: 'session', action: 'set-current'` — Set current session
- `entity: 'session', action: 'update-status'` — Update session status

**Terms:**
- `entity: 'term', action: 'set-current'` — Set current term
- `entity: 'term', action: 'lock-results'` — Lock term results

**Classes:**
- `entity: 'class', action: 'create'` — Create class
- `entity: 'class', action: 'assign-teacher'` — Assign class teacher
- `entity: 'class', action: 'assign-subject'` — Assign subject to class

**Subjects:**
- `entity: 'subject', action: 'create'` — Create subject
- `entity: 'subject', action: 'bulk-create'` — Bulk create subjects

---

### 6. Enrollments (`/api/education/enrollments`)

#### GET
- List enrollments with filters
  - `?studentId=...`
  - `?classId=...`
  - `?sessionId=...`
  - `?status=...`

#### POST Actions
- `action: 'enroll'` — Enroll student in class
- `action: 'bulk-enroll'` — Bulk enroll multiple students
- `action: 'update-status'` — Update enrollment status
- `action: 'transfer'` — Transfer student to different class

---

### 7. Attendance (`/api/education/attendance`)

#### GET
- `?studentId=...&action=stats` — Get student attendance statistics
- `?classId=...&date=...` — Get class attendance for a date
- General query with filters

#### POST Actions
- `action: 'mark'` — Mark single attendance
- `action: 'bulk-mark'` — Mark attendance for entire class
- `action: 'backfill'` — Backfill attendance (offline tolerance)

---

### 8. Assessments (`/api/education/assessments`)

#### GET
- `?entity=assessments` — List assessments
- `?entity=results` — List results
- `?entity=result-sheet&studentId=...&termId=...` — Get student result sheet

#### POST Actions
- `action: 'record-assessment'` — Record single assessment
- `action: 'bulk-record-assessment'` — Bulk record assessments
- `action: 'compute-results'` — Compute results for class/subject/term
- `action: 'update-result-status'` — Update result status (with validation)
- `action: 'bulk-approve'` — Bulk approve results
- `action: 'release-results'` — Release results for term

---

### 9. Fees (`/api/education/fees`)

#### GET
- `?entity=structures` — List fee structures
- `?entity=assignments` — List fee assignments
- `?entity=student-fees&studentId=...` — Get student fees summary

#### POST Actions
- `action: 'create-structure'` — Create fee structure
- `action: 'assign-fee'` — Assign fee to student
- `action: 'bulk-assign-fees'` — Bulk assign fees
- `action: 'apply-discount'` — Apply discount (sibling, scholarship)
- `action: 'emit-fee-fact'` — Emit fee fact to Billing (Commerce reuse)
- `action: 'waive-fee'` — Waive fee entirely

**Commerce Reuse Boundary:**
```
Education                    Commerce
─────────────────────────────────────────
[Fee Structure] 
      │
      ▼
[Fee Assignment] → emit-fee-fact → [Billing Suite]
                                         │
                                         ▼
                                   [Invoice Created]
```

---

### 10. Grades (`/api/education/grades`)

#### GET
- `?action=boundaries` — Get Nigeria grade boundaries
- `?action=calculate&score=75` — Calculate grade from score
- `?action=class-summary&classId=...&termId=...` — Get class grade summary
- `?action=student-grades&studentId=...` — Get student grades

#### POST Actions
- `action: 'recalculate-positions'` — Recalculate class positions
- `action: 'bulk-calculate'` — Calculate grades for multiple scores

---

### 11. Report Cards (`/api/education/report-cards`)

#### GET
- `?action=generate&studentId=...&termId=...` — Generate report card
- `?action=remark-suggestions&score=75` — Get remark suggestions

#### POST Actions
- `action: 'add-class-teacher-remark'` — Add class teacher remark
- `action: 'add-principal-remark'` — Add principal remark
- `action: 'generate-batch'` — Check batch generation readiness

**Report Card Structure:**
```json
{
  "student": { "id": "...", "fullName": "...", "class": {...} },
  "term": { "name": "First Term", ... },
  "session": { "name": "2025/2026 Academic Session" },
  "results": [
    { "subject": {...}, "caScore": 35, "examScore": 50, "totalScore": 85, "grade": "A" }
  ],
  "summary": {
    "totalSubjects": 10,
    "averageScore": 72.5,
    "overallGrade": "A"
  },
  "attendance": {
    "presentDays": 55,
    "absentDays": 3,
    "attendancePercentage": 95
  }
}
```

---

## Commerce Reuse Boundaries (CRITICAL)

Education Suite APIs strictly enforce the following boundaries:

| Education CAN | Education CANNOT |
|---------------|------------------|
| Create fee structures | Create invoices |
| Assign fees to students | Process payments |
| Emit fee facts to Billing | Touch accounting journals |
| Track payment status (from callbacks) | Handle refunds |

**Canonical Flow:**
```
Education (fee fact) → Billing (invoice) → Payments → Accounting
```

---

## VAT Handling

Education fees are **VAT-exempt** in Nigeria. This is enforced at the service level:

```typescript
isVatExempt: true  // Always true for Education
```

---

## Currency

Default currency is **NGN** (Nigerian Naira). Configurable per tenant.

---

## Grade Boundaries (Nigeria Default)

| Grade | Min | Max | Grade Point | Remark |
|-------|-----|-----|-------------|--------|
| A | 70 | 100 | 4.0 | Excellent |
| B | 60 | 69 | 3.5 | Very Good |
| C | 50 | 59 | 3.0 | Good |
| D | 45 | 49 | 2.5 | Fair |
| E | 40 | 44 | 2.0 | Pass |
| F | 0 | 39 | 0.0 | Fail |

---

## Guardrails Compliance

| Rule | Status |
|------|--------|
| ✅ Capability guard on all routes | ✅ Compliant |
| ✅ Tenant scoping | ✅ Compliant |
| ✅ Thin controllers | ✅ Compliant |
| ✅ Commerce reuse boundaries | ✅ Compliant |
| ✅ VAT-exempt enforced | ✅ Compliant |
| ❌ No payment handling | ✅ Compliant |
| ❌ No journal creation | ✅ Compliant |

---

## Files Created/Updated

| File | Action |
|------|--------|
| `/api/education/route.ts` | Created |
| `/api/education/students/route.ts` | Created |
| `/api/education/guardians/route.ts` | Created |
| `/api/education/staff/route.ts` | Created |
| `/api/education/academic/route.ts` | Created |
| `/api/education/enrollments/route.ts` | Created |
| `/api/education/attendance/route.ts` | Created |
| `/api/education/assessments/route.ts` | Created |
| `/api/education/fees/route.ts` | Created |
| `/api/education/grades/route.ts` | Updated |
| `/api/education/report-cards/route.ts` | Updated |

---

## Testing Notes

All endpoints require:
1. Valid session with `activeTenantId`
2. `education` capability enabled for tenant

Test with demo credentials from `/docs/DEMO_CREDENTIALS_INDEX.md`.

---

## Document References

- `/docs/education-suite-s0-domain-audit.md`
- `/docs/education-suite-s1-capability-map.md`
- `/docs/education-suite-s2-schema.md`
- `/docs/education-suite-s2-services.md`
- `/docs/education-suite-s3-api.md` (this document)

---

## S3 Sign-Off

**S3 API Layer: COMPLETE**

Education Suite S3 is complete under Platform Standardisation v2.

### Next Steps (Require Authorization)

| Phase | Description | Status |
|-------|-------------|--------|
| S4 | Demo UI | 🔲 Awaiting authorization |
| S5 | Narrative Integration | 🔲 Blocked on S4 |
| S6 | Verification & FREEZE | 🔲 Blocked on S5 |

---

## 🛑 STOP POINT

Education Suite S3 is complete.

**Awaiting explicit authorization to proceed with S4 (Demo UI).**

---

*This document follows Platform Standardisation v2 requirements.*
