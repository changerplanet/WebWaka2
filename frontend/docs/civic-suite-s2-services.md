# Civic / GovTech Suite S2: Services Documentation

**Phase**: S2 (Schema & Services)  
**Standard**: Platform Standardisation v2  
**Status**: COMPLETE  
**Date**: December 2025

---

## Overview

This document describes the domain services implemented for the Civic / GovTech Suite. All services are:
- **Deterministic** - No side effects beyond database operations
- **Tenant-scoped** - All operations filtered by tenantId
- **Commerce-boundary compliant** - Emit facts only, no billing logic

---

## Service Architecture

```
/app/frontend/src/lib/civic/services/
├── index.ts                      # Service exports
├── citizen-service.ts            # Citizen & Organization management
├── agency-service.ts             # Agency structure management
├── service-catalogue-service.ts  # Government services catalogue
├── request-service.ts            # Service request handling
├── case-service.ts               # Case workflow management
├── inspection-service.ts         # Inspections & Approvals
├── billing-fact-service.ts       # Commerce boundary (facts only)
└── audit-service.ts              # Audit logging & transparency
```

---

## Service Details

### 1. CitizenService (`citizen-service.ts`)

**Purpose**: Manages citizen and organization profiles for government service delivery.

#### Citizen Management
| Function | Description |
|----------|-------------|
| `generateCitizenNumber(tenantId)` | Generate unique citizen number (CIT-YYYY-NNNNN) |
| `createCitizen(data)` | Create new citizen profile |
| `getCitizen(tenantId, id)` | Get citizen by ID with documents |
| `getCitizenByNumber(tenantId, citizenNumber)` | Get citizen by number |
| `getCitizenByPhone(tenantId, phone)` | Find citizen by phone |
| `updateCitizen(tenantId, id, data)` | Update citizen profile |
| `verifyCitizen(tenantId, id, verifiedBy)` | Mark citizen as verified |
| `listCitizens(tenantId, options)` | List citizens with filters |

#### Organization Management
| Function | Description |
|----------|-------------|
| `generateOrgNumber(tenantId)` | Generate unique org number (ORG-YYYY-NNNNN) |
| `createOrganization(data)` | Create organization profile |
| `getOrganization(tenantId, id)` | Get organization by ID |
| `getOrganizationByNumber(tenantId, orgNumber)` | Get organization by number |
| `updateOrganization(tenantId, id, data)` | Update organization |
| `verifyOrganization(tenantId, id, verifiedBy)` | Mark organization as verified |
| `listOrganizations(tenantId, options)` | List organizations with filters |

#### Document Management
| Function | Description |
|----------|-------------|
| `uploadDocument(data)` | Upload supporting document |
| `verifyDocument(tenantId, id, verifiedBy, status, note)` | Verify document |
| `getCitizenDocuments(tenantId, citizenId)` | Get citizen's documents |
| `getOrganizationDocuments(tenantId, organizationId)` | Get organization's documents |

---

### 2. AgencyService (`agency-service.ts`)

**Purpose**: Manages government agency structure including departments, units, and staff.

#### Agency Management
| Function | Description |
|----------|-------------|
| `createAgency(data)` | Create new agency |
| `getAgency(tenantId, id)` | Get agency with departments |
| `getAgencyByCode(tenantId, code)` | Get agency by code |
| `updateAgency(tenantId, id, data)` | Update agency |
| `listAgencies(tenantId, options)` | List agencies |

#### Department Management
| Function | Description |
|----------|-------------|
| `createDepartment(data)` | Create department |
| `getDepartment(tenantId, id)` | Get department with units |
| `updateDepartment(tenantId, id, data)` | Update department |
| `listDepartments(tenantId, agencyId)` | List departments |

#### Unit Management
| Function | Description |
|----------|-------------|
| `createUnit(data)` | Create unit |
| `getUnit(tenantId, id)` | Get unit |
| `listUnits(tenantId, departmentId)` | List units |

#### Staff Management
| Function | Description |
|----------|-------------|
| `generateStaffNumber(tenantId)` | Generate staff number |
| `createStaff(data)` | Create staff member |
| `getStaff(tenantId, id)` | Get staff by ID |
| `getStaffByNumber(tenantId, staffNumber)` | Get staff by number |
| `updateStaff(tenantId, id, data)` | Update staff |
| `deactivateStaff(tenantId, id)` | Deactivate staff |
| `listStaff(tenantId, options)` | List staff with filters |
| `getStaffByRole(tenantId, agencyId, role)` | Get staff by role |

---

### 3. ServiceCatalogueService (`service-catalogue-service.ts`)

**Purpose**: Manages government service definitions, requirements, fees, and SLAs.

| Function | Description |
|----------|-------------|
| `createService(data)` | Create service definition |
| `getService(tenantId, id)` | Get service by ID |
| `getServiceByCode(tenantId, agencyId, code)` | Get service by code |
| `updateService(tenantId, id, data)` | Update service |
| `listServices(tenantId, options)` | List services with filters |
| `listServicesByCategory(tenantId, category)` | List by category |
| `getPublicServiceCatalogue(tenantId)` | Get public catalogue (grouped) |
| `calculateServiceFees(service)` | Calculate total fees |
| `getServicesRequiringRenewal(tenantId)` | Get renewable services |

---

### 4. RequestService (`request-service.ts`)

**Purpose**: Manages citizen service requests and case creation.

| Function | Description |
|----------|-------------|
| `generateRequestNumber(tenantId)` | Generate request number (REQ-YYYY-NNNNN) |
| `generateTrackingCode()` | Generate public tracking code |
| `createRequest(data)` | Create new request |
| `getRequest(tenantId, id)` | Get request with details |
| `getRequestByNumber(tenantId, requestNumber)` | Get by request number |
| `getRequestByTrackingCode(trackingCode)` | Public status lookup |
| `submitRequest(tenantId, id)` | Submit request |
| `acknowledgeRequest(tenantId, id)` | Acknowledge receipt |
| `updateRequestStatus(tenantId, id, status, note)` | Update status |
| `markRequestPaid(tenantId, id, paymentRef, amount)` | Mark as paid |
| `setRequestValidity(tenantId, id, validUntil, certId)` | Set validity |
| `listRequests(tenantId, options)` | List requests with filters |
| `getPendingRequests(tenantId)` | Get pending requests |
| `getRequestsAwaitingPayment(tenantId)` | Get payment pending |
| `getExpiringRequests(tenantId, daysAhead)` | Get expiring permits |

---

### 5. CaseService (`case-service.ts`)

**Purpose**: Manages internal case workflow with append-only audit patterns.

| Function | Description |
|----------|-------------|
| `generateCaseNumber(tenantId)` | Generate case number (CASE-YYYY-NNNNN) |
| `createCase(data)` | Create case for request |
| `getCase(tenantId, id)` | Get case with full details |
| `getCaseByNumber(tenantId, caseNumber)` | Get by case number |
| `updateCaseStatus(tenantId, id, status, reason, by)` | Update status (audited) |
| `assignCase(tenantId, caseId, staffId, assignedBy)` | Assign to staff |
| `addCaseNote(tenantId, caseId, content, author)` | Add note (append-only) |
| `getCaseNotes(tenantId, caseId, includeInternal)` | Get case notes |
| `escalateCase(tenantId, id, escalatedBy, note)` | Escalate case |
| `listCases(tenantId, options)` | List cases with filters |
| `getMyAssignedCases(tenantId, staffId)` | Get staff's cases |
| `getCasesAtRisk(tenantId, hoursAhead)` | Get SLA at-risk cases |
| `checkSlaBreaches(tenantId)` | Mark SLA breaches |
| `getCaseAuditTrail(tenantId, caseId)` | Get chronological trail |

---

### 6. InspectionService (`inspection-service.ts`)

**Purpose**: Manages field inspections and approval decisions.

#### Inspection Management
| Function | Description |
|----------|-------------|
| `generateInspectionNumber(tenantId)` | Generate number (INSP-YYYY-NNNNN) |
| `scheduleInspection(data)` | Schedule inspection |
| `getInspection(tenantId, id)` | Get inspection with findings |
| `getInspectionByNumber(tenantId, number)` | Get by number |
| `startInspection(tenantId, id)` | Start inspection |
| `completeInspection(tenantId, id, result, note)` | Complete with result |
| `rescheduleInspection(tenantId, id, newDate, note)` | Reschedule |
| `cancelInspection(tenantId, id)` | Cancel inspection |
| `addInspectionFinding(data)` | Add finding (append-only) |
| `getInspectionFindings(tenantId, inspectionId)` | Get findings |
| `listInspections(tenantId, options)` | List with filters |
| `getTodayInspections(tenantId, inspectorId)` | Get today's schedule |

#### Approval Management
| Function | Description |
|----------|-------------|
| `generateApprovalNumber(tenantId)` | Generate number (APR-YYYY-NNNNN) |
| `recordApproval(data)` | Record decision (append-only) |
| `getApproval(tenantId, id)` | Get approval |
| `getCaseApprovals(tenantId, caseId)` | Get case's approvals |
| `listApprovals(tenantId, options)` | List with filters |

---

### 7. BillingFactService (`billing-fact-service.ts`)

**Purpose**: Emits fee and penalty facts for Commerce to bill.

> **⚠️ Commerce Boundary**: This service ONLY creates billing facts.  
> Commerce is responsible for invoicing, VAT, payments, and accounting.

| Function | Description |
|----------|-------------|
| `createBillingFact(data)` | Create billing fact |
| `createServiceFeeFact(...)` | Create service fee fact |
| `createInspectionFeeFact(...)` | Create inspection fee fact |
| `createPenaltyFact(...)` | Create penalty fact |
| `createLateFeeFact(...)` | Create late fee fact |
| `getBillingFact(tenantId, id)` | Get billing fact |
| `markAsBilled(tenantId, id, invoiceId)` | Mark as billed (by Commerce) |
| `markMultipleAsBilled(tenantId, ids, invoiceId)` | Bulk mark as billed |
| `waiveBillingFact(tenantId, id, by, reason)` | Waive fact |
| `cancelBillingFact(tenantId, id)` | Cancel fact |
| `listBillingFacts(tenantId, options)` | List facts |
| `getPendingBillingFacts(tenantId, citizenId, requestId)` | Get pending |
| `getCitizenBillingSummary(tenantId, citizenId)` | Citizen summary |
| `getRequestBillingSummary(tenantId, requestId)` | Request summary |
| `generateRequestFees(tenantId, requestId, citizenId, service)` | Generate from service |

---

### 8. AuditService (`audit-service.ts`)

**Purpose**: Manages audit logging and transparency views (FOI-ready).

#### Audit Logging (Append-Only)
| Function | Description |
|----------|-------------|
| `logAuditEvent(data)` | Log audit event |
| `logRequestAction(...)` | Log request action |
| `logCaseAction(...)` | Log case action |
| `logInspectionAction(...)` | Log inspection action |
| `logApprovalAction(...)` | Log approval action |
| `queryAuditLogs(tenantId, options)` | Query logs |
| `getEntityAuditTrail(tenantId, type, id)` | Entity trail |
| `getActorActivity(tenantId, actorId, from, to)` | Actor activity |

#### Public Status & Transparency
| Function | Description |
|----------|-------------|
| `upsertPublicStatus(...)` | Update public tracking |
| `getPublicStatus(trackingCode)` | Get public status |
| `getTransparencyStats(tenantId)` | Get transparency stats |
| `getServicePerformanceMetrics(tenantId)` | Service performance |
| `exportForFOI(tenantId, options)` | Export for FOI request |

---

## Service Index (`index.ts`)

```typescript
export * as CitizenService from './citizen-service'
export * as AgencyService from './agency-service'
export * as ServiceCatalogueService from './service-catalogue-service'
export * as RequestService from './request-service'
export * as CaseService from './case-service'
export * as InspectionService from './inspection-service'
export * as BillingFactService from './billing-fact-service'
export * as AuditService from './audit-service'
```

---

## TypeScript Compilation

✅ All services compile without errors  
✅ Proper Prisma type handling for Json fields  
✅ Enum imports from `@prisma/client`  
✅ Decimal handling for monetary values

---

## Compliance Checklist

| Requirement | Status |
|-------------|--------|
| Schema + Services only | ✅ |
| Append-only for cases, inspections, audit logs | ✅ |
| Facts-only emission for fees/penalties | ✅ |
| No VAT logic | ✅ |
| No payments | ✅ |
| No journals | ✅ |
| Additive Prisma changes only | ✅ |
| Tenant-scoped operations | ✅ |
| Deterministic services | ✅ |

---

*Document generated as part of Civic / GovTech Suite S2 completion.*
