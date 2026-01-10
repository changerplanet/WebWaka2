# Civic / GovTech Suite S2: Schema Documentation

**Phase**: S2 (Schema & Services)  
**Standard**: Platform Standardisation v2  
**Status**: COMPLETE  
**Date**: December 2025

---

## Overview

This document describes the Prisma schema additions for the Civic / GovTech Suite. The schema implements a comprehensive government service delivery platform with strict Commerce boundary compliance and append-only audit patterns.

---

## Design Principles

### 1. Identity Reference (NOT Replacement)
- Citizens are registered with local profile numbers (`CIT-YYYY-NNNNN`)
- References to national IDs (NIN, Voter ID) are **optional** and for **verification only**
- The system is NOT a National ID replacement

### 2. Append-Only Patterns
- Audit logs (`civic_audit_log`) are append-only
- Case status changes (`civic_case_status_change`) are append-only
- Case notes (`civic_case_note`) are append-only
- Inspection findings (`civic_inspection_finding`) are append-only
- Approvals (`civic_approval`) are append-only

### 3. Commerce Boundary
- Civic emits **Billing Facts** (fees, penalties) → Commerce handles billing
- **NO** VAT calculation in Civic
- **NO** payment recording in Civic
- **NO** accounting journal entries in Civic

### 4. Tenant Scoping
- All models include `tenantId` for multi-tenancy
- Appropriate indexes on `tenantId` for performance

---

## Schema Models

### Configuration

| Model | Description |
|-------|-------------|
| `civic_config` | Tenant-level civic configuration |

### Identity & Profiles

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_citizen` | Citizen profiles | citizenNumber, nationalIdRef, voterIdRef |
| `civic_organization` | Business/org profiles | orgNumber, rcNumber, taxId |
| `civic_citizen_document` | Supporting documents | documentType, status, verifiedAt |

### Agency Structure

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_agency` | Government agencies | code, jurisdiction, parentAgencyId |
| `civic_department` | Agency departments | code, agencyId |
| `civic_unit` | Department units | code, departmentId |
| `civic_staff` | Agency staff members | staffNumber, role, designation |

### Service Catalogue

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_service` | Service definitions | code, category, baseFee, slaBusinessDays |

### Request & Case Workflow

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_request` | Service requests | requestNumber, trackingCode, status |
| `civic_case` | Internal case tracking | caseNumber, priority, slaDeadline |
| `civic_case_assignment` | Case assignments | staffId, isActive |
| `civic_case_note` | Case notes (append-only) | content, isInternal, authorId |
| `civic_case_status_change` | Status history (append-only) | fromStatus, toStatus, reason |

### Inspections & Approvals

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_inspection` | Field inspections | inspectionNumber, scheduledDate, result |
| `civic_inspection_finding` | Findings (append-only) | category, severity, photoUrls |
| `civic_approval` | Approval decisions (append-only) | decision, rationale, conditions |

### Billing Integration

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_billing_fact` | Fee facts for Commerce | factType, amount, status |

### Audit & Transparency

| Model | Description | Key Fields |
|-------|-------------|------------|
| `civic_audit_log` | Audit trail (append-only) | action, entityType, changes |
| `civic_public_status` | Public tracking status | trackingCode, progressStage |

---

## Enums

### CivicRequestStatus
```
DRAFT
SUBMITTED
UNDER_REVIEW
PENDING_DOCUMENTS
PENDING_INSPECTION
PENDING_PAYMENT
PENDING_APPROVAL
APPROVED
REJECTED
CANCELLED
EXPIRED
```

### CivicCaseStatus
```
OPEN
ASSIGNED
IN_PROGRESS
PENDING_INFO
ESCALATED
RESOLVED
CLOSED
```

### CivicCasePriority
```
LOW
NORMAL
HIGH
URGENT
```

### CivicInspectionStatus
```
SCHEDULED
RESCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
```

### CivicInspectionResult
```
PASS
FAIL
CONDITIONAL
REINSPECTION_REQUIRED
```

### CivicApprovalDecision
```
APPROVED
APPROVED_WITH_CONDITIONS
REJECTED
DEFERRED
ESCALATED
```

### CivicStaffRole
```
ADMIN
MANAGER
OFFICER
INSPECTOR
CLERK
VIEWER
```

### CivicServiceCategory
```
LAND_REGISTRY
BUILDING_PERMITS
BUSINESS_REGISTRATION
TAX_CLEARANCE
ENVIRONMENTAL
HEALTH_SAFETY
TRANSPORT
EDUCATION
SOCIAL_SERVICES
OTHER
```

### CivicDocumentType
```
NATIONAL_ID
PASSPORT
DRIVER_LICENSE
VOTER_CARD
UTILITY_BILL
BANK_STATEMENT
TAX_CLEARANCE
BUSINESS_REGISTRATION
SURVEY_PLAN
BUILDING_PLAN
OTHER
```

### CivicDocumentStatus
```
PENDING
VERIFIED
REJECTED
EXPIRED
```

### CivicBillingFactType
```
SERVICE_FEE
PROCESSING_FEE
INSPECTION_FEE
LATE_FEE
PENALTY
REFUND
```

### CivicBillingFactStatus
```
PENDING
BILLED
WAIVED
CANCELLED
```

---

## Indexes

All models include appropriate indexes for:
- `tenantId` - Multi-tenant queries
- Unique identifiers (citizenNumber, requestNumber, caseNumber, etc.)
- Status fields for workflow queries
- Date fields for time-based queries
- Foreign keys for relational queries

---

## Model Count Summary

| Category | Models | Append-Only |
|----------|--------|-------------|
| Configuration | 1 | 0 |
| Identity & Profiles | 3 | 0 |
| Agency Structure | 4 | 0 |
| Service Catalogue | 1 | 0 |
| Request & Case | 5 | 3 |
| Inspections | 3 | 2 |
| Billing | 1 | 0 |
| Audit & Transparency | 2 | 1 |
| **Total** | **20** | **6** |

---

## Compliance Notes

### FOI (Freedom of Information) Ready
- All audit logs preserved indefinitely
- Export function with optional PII redaction
- Entity-level audit trails available

### Regulatory Compliance
- No personal identifiers stored beyond references
- Append-only patterns for regulatory audit
- Timestamped all actions with actor identification

### Commerce Boundary Maintained
- `civic_billing_fact` is the **ONLY** interface to Commerce
- Civic emits facts; Commerce bills and collects
- Clean separation of concerns

---

*Document generated as part of Civic / GovTech Suite S2 completion.*
