# Education Suite - Capability Mapping Document

## S0: Context Confirmation ✅
## S1: Capability Mapping (Design Only - NO CODE)

---

## Suite Overview

**Target Customers:**
- Primary & Secondary Schools
- Universities
- Training Centers
- Tutoring Services

**Key Capabilities Required:**
1. Student Management
2. Academic Records (grading, assessments)
3. Attendance
4. Fee Management
5. Staff Management

---

## Capability Mapping Matrix

### 1. STUDENT MANAGEMENT

| Education Need | Existing Capability | Reuse Strategy | Gap? |
|---------------|---------------------|----------------|------|
| Student Profiles | **CRM Contacts** | Configure contact type = "STUDENT" with education metadata | ✅ REUSE |
| Parent/Guardian | **CRM Contacts** | Configure contact type = "GUARDIAN" with relationship linking | ✅ REUSE |
| Student ID Generation | **StaffMember.employeeId pattern** | Apply same ID generation logic | ✅ REUSE |
| Class/Section Assignment | **CRM Segmentation** | Use segments as classes/sections | ✅ REUSE |
| Enrollment History | **CRM Engagement** | Track enrollment as engagement events | ✅ REUSE |

**Verdict: 100% REUSE** - CRM module with education-specific configuration

---

### 2. ACADEMIC RECORDS (Grading & Assessments)

| Education Need | Existing Capability | Reuse Strategy | Gap? |
|---------------|---------------------|----------------|------|
| Subjects/Courses | **Inventory Categories** | Configure as subject catalog | ⚠️ PARTIAL |
| Grade Recording | - | None directly applicable | 🔴 GAP |
| Report Cards | - | None directly applicable | 🔴 GAP |
| GPA Calculation | - | None directly applicable | 🔴 GAP |
| Assessment Types | - | None directly applicable | 🔴 GAP |

**Verdict: GAP IDENTIFIED** - Academic grading requires NEW capability services (no schema)
- **Proposed**: Education-specific grading service using existing CRM/tenant structures
- **Data Storage**: Use CRM `metadata` JSON fields + tenant-scoped records

---

### 3. ATTENDANCE

| Education Need | Existing Capability | Reuse Strategy | Gap? |
|---------------|---------------------|----------------|------|
| Daily Attendance | **HR Attendance Service** | Adapt for students (AttendanceService) | ✅ REUSE |
| Class Period Tracking | **HR Attendance** | Use clockIn/clockOut per period | ✅ REUSE |
| Absence Notifications | **CRM Campaigns** | Automated SMS/Email to parents | ✅ REUSE |
| Attendance Reports | **HR AttendanceSummary** | Same report structure | ✅ REUSE |
| Offline Attendance | **HR Offline Sync** | Already supports offline | ✅ REUSE |

**Verdict: 95% REUSE** - HR Attendance with configuration changes
- Configure `entityType` = "STUDENT" instead of "EMPLOYEE"
- Reuse same clock-in/out pattern for period-based attendance

---

### 4. FEE MANAGEMENT

| Education Need | Existing Capability | Reuse Strategy | Gap? |
|---------------|---------------------|----------------|------|
| Fee Structure | **Billing/Subscription Plans** | Configure fee plans per term/year | ✅ REUSE |
| Fee Categories | **Billing Add-ons** | Tuition, Lab, Library, Transport as add-ons | ✅ REUSE |
| Invoice Generation | **Invoice Model** | Already exists | ✅ REUSE |
| Payment Processing | **Payments Module** | Already exists with multiple methods | ✅ REUSE |
| Discounts (Scholarships) | **Billing Discounts** | Configure as scholarship types | ✅ REUSE |
| Payment Plans | **Billing Adjustments** | Installment support exists | ✅ REUSE |
| Fee Reminders | **CRM Campaigns** | Automated reminders | ✅ REUSE |
| Fee Receipts | **Invoice/Payment Events** | Already tracks payments | ✅ REUSE |

**Verdict: 100% REUSE** - Billing module fully applicable

---

### 5. STAFF MANAGEMENT

| Education Need | Existing Capability | Reuse Strategy | Gap? |
|---------------|---------------------|----------------|------|
| Teacher Profiles | **StaffMember Model** | Already exists | ✅ REUSE |
| Department Assignment | **StaffMember.department** | Already exists | ✅ REUSE |
| Staff Attendance | **HR Attendance** | Already exists | ✅ REUSE |
| Leave Management | **HR Leave Service** | Already exists | ✅ REUSE |
| Payroll | **HR Payroll Service** | Already exists | ✅ REUSE |
| Staff Permissions | **StaffMember.permissions** | Already exists | ✅ REUSE |

**Verdict: 100% REUSE** - HR module fully applicable

---

## Summary: Capability Reuse Analysis

| Capability Area | Reuse % | Primary Module | Notes |
|-----------------|---------|----------------|-------|
| Student Management | 100% | CRM | Contact type configuration |
| Academic Records | 20% | NEW | Gap - requires grading services |
| Attendance | 95% | HR | Entity type configuration |
| Fee Management | 100% | Billing | Fee plan configuration |
| Staff Management | 100% | HR | Already complete |

**Overall Reuse: ~83%**

---

## Gap Register

### GAP-EDU-001: Academic Grading System

**Description:** No existing capability for recording grades, calculating GPAs, or generating report cards.

**Proposed Solution (Design Only):**
- Create `education/grading-service.ts` - Business logic only
- Store grades in tenant-scoped data structures
- Use CRM contact metadata for student academic records
- Generate report cards as PDF documents

**Data Model Approach (NO SCHEMA CHANGES):**
```
// Store in CRM Contact metadata JSON field
{
  "academicRecords": [
    {
      "termId": "2025-T1",
      "subjects": [
        { "code": "MATH", "score": 85, "grade": "A", "remarks": "Excellent" },
        { "code": "ENG", "score": 78, "grade": "B", "remarks": "Good" }
      ],
      "gpa": 3.65,
      "position": 5,
      "totalStudents": 45
    }
  ]
}
```

**Core Impact:** NONE - Uses existing JSON metadata fields

---

### GAP-EDU-002: Class/Subject Management

**Description:** Need structured way to manage classes, sections, and subjects.

**Proposed Solution (Design Only):**
- Use CRM Segments for classes (e.g., "Class 5A", "Grade 10 Science")
- Use tenant configuration for subject catalog
- No new tables required

**Core Impact:** NONE - Configuration only

---

## Core Impact Assessment

| Question | Answer |
|----------|--------|
| New database tables required? | **NO** |
| Schema changes to existing tables? | **NO** |
| New Core primitives required? | **NO** |
| Cross-suite data dependencies? | **NO** |
| Partner-First compliance? | **YES** |

### Detailed Assessment:

1. **CRM Module Extension**
   - Add education-specific contact types: STUDENT, GUARDIAN, TEACHER
   - Store academic data in existing `metadata` JSON field
   - **Impact: NONE** - Configuration only

2. **HR Attendance Extension**
   - Configure for student entity type
   - **Impact: NONE** - Service configuration only

3. **Billing Extension**
   - Configure fee plans and add-ons for education
   - **Impact: NONE** - Data configuration only

4. **New Services Required**
   - `education/grading-service.ts` - Pure business logic
   - `education/academic-service.ts` - Term/class management
   - `education/report-card-service.ts` - Document generation
   - **Impact: NONE** - New code, no schema changes

---

## What Will NOT Be Built

1. ❌ Custom student database table
2. ❌ Custom grade/marks table
3. ❌ Custom class/section table
4. ❌ Custom timetable system (use calendar integrations)
5. ❌ Library management (separate suite)
6. ❌ Transport management (use ParkHub)
7. ❌ Hostel/dormitory management (use Hospitality Suite)
8. ❌ Direct student/parent portals (Partner activates access)

---

## What Will Be Reused

1. ✅ **CRM Module** - Student/parent management
2. ✅ **HR Attendance** - Student attendance tracking
3. ✅ **HR Staff Management** - Teacher/staff management
4. ✅ **HR Payroll** - Staff salary processing
5. ✅ **Billing Module** - Fee management
6. ✅ **Payments Module** - Payment processing
7. ✅ **CRM Campaigns** - Notifications to parents
8. ✅ **CRM Segmentation** - Class/section grouping
9. ✅ **Capability Framework** - Module activation
10. ✅ **Partner-First Model** - Activation flow

---

## Architecture: Education Suite Composition

```
┌─────────────────────────────────────────────────────────────┐
│                    EDUCATION SUITE                          │
│         (School/University Management Solution)             │
└─────────────────────────────────────────────────────────────┘
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────────┐  ┌───────┐  ┌───────┐
│  CRM  │  │  HR   │  │  Billing  │  │Payments│ │ NEW   │
│       │  │       │  │           │  │        │ │Grading│
│Student│  │Attend │  │Fee Plans  │  │Process │ │Service│
│Parent │  │Staff  │  │Invoices   │  │Refunds │ │Reports│
└───────┘  └───────┘  └───────────┘  └───────┘  └───────┘
```

---

## Recommended Next Steps (S2-S5)

**S2: Core Services**
- Create `education/grading-service.ts`
- Create `education/academic-service.ts`
- Create `education/report-card-service.ts`
- Configure CRM for education contact types

**S3: API Routes**
- `/api/education/students` - Student CRUD (wraps CRM)
- `/api/education/grades` - Grade recording
- `/api/education/attendance` - Attendance (wraps HR)
- `/api/education/fees` - Fee management (wraps Billing)
- `/api/education/report-cards` - Report card generation

**S4: UI Pages**
- School Admin Dashboard
- Teacher Dashboard
- Student/Parent Portal (view-only)
- Grade Entry Forms
- Fee Payment Portal

**S5: Integration & Testing**
- Full end-to-end testing
- Partner activation flow testing

---

## Sign-off

| Item | Status |
|------|--------|
| Capability mapping complete | ✅ |
| Gap register documented | ✅ |
| Core impact assessment: NO CHANGES | ✅ |
| Partner-First compliance | ✅ |
| Ready for S2 (Services) | ✅ |

---

*Document Version: 1.0*
*Created: January 2026*
*Phase: S0-S1 Complete*
