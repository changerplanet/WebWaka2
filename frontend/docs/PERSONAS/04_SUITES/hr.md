# Suite-Specific Personas: HR & Payroll
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## HR & Payroll Suite Overview

**Capability:** `hr_payroll`

---

## Internal Roles (Tenant Users)

### TENANT ADMIN (HR Context)
- Manage staff records
- Process payroll
- Configure pay schedules
- View all HR reports
- Manage departments

### TENANT USER (HR Context)
- View own employee record (if linked)
- Submit time/attendance (if implemented)
- ❌ Cannot view other employees' data
- ❌ Cannot process payroll

---

## Key Models

### StaffMember
```prisma
model StaffMember {
  id             String      @id @default(uuid())
  tenantId       String
  userId         String?     // Links to User if authenticated
  firstName      String
  lastName       String
  email          String?
  phone          String?
  role           StaffRole   @default(STAFF)
  status         StaffStatus @default(ACTIVE)
  department     String?
  jobTitle       String?
  hireDate       DateTime?
  terminationDate DateTime?
  hourlyRate     Decimal?
  salary         Decimal?
  commissionRate Decimal?
}
```

### StaffRole (HR Context)
```prisma
enum StaffRole {
  MANAGER
  SUPERVISOR
  STAFF
  PART_TIME
}
```

**Note:** StaffRole is for HR classification, not system access control. System access is via TenantMembership.

---

## External Roles

The HR suite does not have external-facing personas. All HR operations are internal.

Employees who need system access must be granted TenantMembership separately from their StaffMember record.

---

## Summary

| Role | Type | Access |
|------|------|--------|
| TENANT_ADMIN | Internal | Full HR management |
| TENANT_USER | Internal | Own record only |

---

**Document Status:** EXTRACTION COMPLETE
