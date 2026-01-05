# Suite-Specific Personas: Education
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Education Suite Overview

**Capabilities:** `school_attendance`, `school_grading`

**Note:** Education capabilities are registered but marked as `status: 'planned'` in the capability registry.

---

## Planned Capabilities

### school_attendance
- Track student attendance
- Generate attendance reports
- Domain: `education`

### school_grading
- Record student grades
- Generate grade reports
- Dependencies: `school_attendance`
- Domain: `education`

---

## Potential Personas (Not Yet Implemented)

Based on capability names, the following personas would apply when implemented:

| Role | Type | Description |
|------|------|-------------|
| School Admin | Internal | Full school management |
| Teacher | Internal | Attendance/grading for assigned classes |
| Student | External | View own grades/attendance |
| Parent | External | View child's grades/attendance |

**Note:** These personas are NOT currently implemented. The capabilities exist in the registry as planned features only.

---

**Document Status:** EXTRACTION COMPLETE  
**Note:** Education suite is PLANNED, not implemented.
