# Civic / GovTech Suite S3: API Layer Documentation

**Phase**: S3 (API Layer)  
**Standard**: Platform Standardisation v2  
**Status**: COMPLETE  
**Date**: December 2025

---

## Overview

This document describes the API layer implementation for the Civic / GovTech Suite. All endpoints are:
- **Capability-guarded** - Access controlled by tenant capabilities
- **Authentication required** (except public tracking)
- **401/403 enforced** - Unauthorized/Forbidden responses as appropriate
- **Append-only semantics preserved** - No destructive updates for auditable entities

---

## API Architecture

```
/app/frontend/src/app/api/civic/
├── route.ts                    # Main civic config & stats
├── citizens/route.ts           # Citizen profiles
├── organizations/route.ts      # Organization profiles
├── agencies/route.ts           # Government agencies
├── departments/route.ts        # Agency departments
├── units/route.ts              # Department units
├── staff/route.ts              # Agency staff
├── services/route.ts           # Service catalogue
├── requests/route.ts           # Service requests
├── cases/route.ts              # Case workflow
├── inspections/route.ts        # Field inspections
├── approvals/route.ts          # Approval decisions
├── billing-facts/route.ts      # Billing facts (Commerce boundary)
├── audit/route.ts              # Audit logs & transparency
└── public/route.ts             # Public status (no auth)
```

---

## Capability Guards

| Endpoint | Required Capability | Description |
|----------|-------------------|-------------|
| `/api/civic` | `civic_registry` | Main config |
| `/api/civic/citizens` | `civic_registry` | Citizen management |
| `/api/civic/organizations` | `civic_registry` | Organization management |
| `/api/civic/agencies` | `civic_agencies` | Agency structure |
| `/api/civic/departments` | `civic_agencies` | Departments |
| `/api/civic/units` | `civic_agencies` | Units |
| `/api/civic/staff` | `civic_agencies` | Staff management |
| `/api/civic/services` | `civic_services` | Service catalogue |
| `/api/civic/requests` | `civic_requests` | Request workflow |
| `/api/civic/cases` | `civic_requests` | Case workflow |
| `/api/civic/inspections` | `civic_inspections` | Inspections |
| `/api/civic/approvals` | `civic_inspections` | Approvals |
| `/api/civic/billing-facts` | `civic_billing` | Billing facts |
| `/api/civic/audit` | `civic_audit` | Audit & transparency |
| `/api/civic/public` | *None* | Public tracking |

---

## New Capabilities Added

```typescript
// In registry.ts - 8 new civic GovTech capabilities
civic_registry        // Citizen & Organization Registry
civic_agencies        // Agency Structure
civic_services        // Service Catalogue
civic_requests        // Request & Case Workflow
civic_inspections     // Inspections & Approvals
civic_billing         // Billing Facts
civic_payments_view   // Payment Status (Read-Only)
civic_audit           // Audit & Transparency
```

---

## Endpoint Reference

### Main Civic Route (`/api/civic`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=config` | Get civic suite configuration |
| GET | `?action=stats` | Get civic statistics |
| POST | `{action: 'initialize'}` | Initialize civic suite for tenant |

### Citizens (`/api/civic/citizens`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get citizen by ID |
| GET | `?citizenNumber={number}` | Get citizen by number |
| GET | `?phone={phone}` | Get citizen by phone |
| GET | `?id={id}&action=documents` | Get citizen's documents |
| GET | (list) | List citizens with filters |
| POST | Create citizen | firstName, lastName required |
| POST | `{action: 'uploadDocument'}` | Upload document |
| PATCH | `{id, ...data}` | Update citizen |
| PATCH | `{id, action: 'verify'}` | Verify citizen |
| PATCH | `{action: 'verifyDocument'}` | Verify document |

### Organizations (`/api/civic/organizations`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get organization by ID |
| GET | `?orgNumber={number}` | Get organization by number |
| GET | `?id={id}&action=documents` | Get organization's documents |
| GET | (list) | List organizations with filters |
| POST | Create organization | name required |
| POST | `{action: 'uploadDocument'}` | Upload document |
| PATCH | `{id, ...data}` | Update organization |
| PATCH | `{id, action: 'verify'}` | Verify organization |

### Agencies (`/api/civic/agencies`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get agency by ID (with departments) |
| GET | `?code={code}` | Get agency by code |
| GET | (list) | List agencies |
| POST | Create agency | code, name required |
| PATCH | `{id, ...data}` | Update agency |

### Departments (`/api/civic/departments`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get department by ID (with units) |
| GET | `?agencyId={id}` | List departments for agency |
| POST | Create department | agencyId, code, name required |
| PATCH | `{id, ...data}` | Update department |

### Units (`/api/civic/units`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get unit by ID |
| GET | `?departmentId={id}` | List units for department |
| POST | Create unit | departmentId, code, name required |

### Staff (`/api/civic/staff`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get staff by ID |
| GET | `?staffNumber={number}` | Get staff by number |
| GET | `?agencyId={id}&role={role}` | Get staff by role |
| GET | (list) | List staff with filters |
| POST | Create staff | firstName, lastName, role required |
| PATCH | `{id, ...data}` | Update staff |
| PATCH | `{id, action: 'deactivate'}` | Deactivate staff |

### Services (`/api/civic/services`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get service by ID (with fees) |
| GET | `?code={code}&agencyId={id}` | Get service by code |
| GET | `?action=publicCatalogue` | Get public service catalogue |
| GET | `?action=renewalRequired` | Get services requiring renewal |
| GET | `?category={category}` | List services by category |
| GET | (list) | List services with filters |
| POST | Create service | agencyId, code, name required |
| PATCH | `{id, ...data}` | Update service |

### Requests (`/api/civic/requests`)

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get request by ID |
| GET | `?requestNumber={number}` | Get request by number |
| GET | `?trackingCode={code}` | Get request by tracking code |
| GET | `?action=pending` | Get pending requests |
| GET | `?action=awaitingPayment` | Get requests awaiting payment |
| GET | `?action=expiring` | Get expiring requests |
| GET | (list) | List requests with filters |
| POST | Create request | applicantName, serviceId, serviceName required |
| POST | `{action: 'submit', id}` | Submit request |
| PATCH | `{id, action: 'acknowledge'}` | Acknowledge request |
| PATCH | `{id, action: 'markPaid'}` | Mark request as paid |
| PATCH | `{id, action: 'setValidity'}` | Set request validity |
| PATCH | `{id, status}` | Update request status |

### Cases (`/api/civic/cases`) *APPEND-ONLY for notes/status*

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get case by ID |
| GET | `?caseNumber={number}` | Get case by number |
| GET | `?id={id}&action=auditTrail` | Get case audit trail |
| GET | `?id={id}&action=notes` | Get case notes |
| GET | `?action=myAssigned&staffId={id}` | Get assigned cases |
| GET | `?action=atRisk` | Get SLA at-risk cases |
| GET | `?action=checkSlaBreaches` | Check for SLA breaches |
| GET | (list) | List cases with filters |
| POST | Create case | requestId required |
| POST | `{action: 'assign'}` | Assign case to staff |
| POST | `{action: 'addNote'}` | Add case note *(append-only)* |
| PATCH | `{id, status, reason}` | Update case status *(creates audit)* |
| PATCH | `{id, action: 'escalate'}` | Escalate case |

### Inspections (`/api/civic/inspections`) *APPEND-ONLY for findings*

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get inspection by ID |
| GET | `?inspectionNumber={number}` | Get by number |
| GET | `?id={id}&action=findings` | Get inspection findings |
| GET | `?action=today` | Get today's inspections |
| GET | (list) | List inspections with filters |
| POST | Schedule inspection | caseId, scheduledDate required |
| POST | `{action: 'start'}` | Start inspection |
| POST | `{action: 'addFinding'}` | Add finding *(append-only)* |
| PATCH | `{id, action: 'complete'}` | Complete inspection |
| PATCH | `{id, action: 'reschedule'}` | Reschedule inspection |
| PATCH | `{id, action: 'cancel'}` | Cancel inspection |

### Approvals (`/api/civic/approvals`) *APPEND-ONLY*

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get approval by ID |
| GET | `?caseId={id}` | Get case approvals |
| GET | (list) | List approvals with filters |
| POST | Record approval | caseId, decision, approverName required *(append-only)* |

**Note**: No PATCH or DELETE - approvals are append-only for audit compliance.

### Billing Facts (`/api/civic/billing-facts`) *Commerce Boundary*

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?id={id}` | Get billing fact by ID |
| GET | `?action=pending` | Get pending facts for Commerce |
| GET | `?action=citizenSummary&citizenId={id}` | Citizen billing summary |
| GET | `?action=requestSummary&requestId={id}` | Request billing summary |
| GET | (list) | List billing facts with filters |
| POST | Create billing fact | factType, description, unitAmount required |
| POST | `{action: 'serviceFee'}` | Create service fee fact |
| POST | `{action: 'inspectionFee'}` | Create inspection fee fact |
| POST | `{action: 'penalty'}` | Create penalty fact |
| POST | `{action: 'lateFee'}` | Create late fee fact |
| POST | `{action: 'generateRequestFees'}` | Generate fees from service |
| PATCH | `{action: 'markBilled'}` | Mark as billed *(by Commerce)* |
| PATCH | `{action: 'waive'}` | Waive billing fact |
| PATCH | `{action: 'cancel'}` | Cancel billing fact |

### Audit (`/api/civic/audit`) *APPEND-ONLY*

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=publicStatus&trackingCode={code}` | Public status |
| GET | `?action=transparencyStats` | Transparency statistics |
| GET | `?action=servicePerformance` | Service performance metrics |
| GET | `?action=entityTrail&entityType={type}&entityId={id}` | Entity audit trail |
| GET | `?action=actorActivity&actorId={id}` | Actor activity |
| GET | `?action=exportFOI` | Export for FOI request |
| GET | (query) | Query audit logs |
| POST | `{action: 'updatePublicStatus'}` | Update public tracking status |
| POST | `{action: 'logRequest'}` | Log request action |
| POST | `{action: 'logCase'}` | Log case action |
| POST | `{action: 'logInspection'}` | Log inspection action |
| POST | `{action: 'logApproval'}` | Log approval action |
| POST | Log generic audit event | auditAction, entityType, entityId, actorName required |

**Note**: No PATCH or DELETE - audit logs are append-only for regulatory compliance.

### Public (`/api/civic/public`) *No Auth Required*

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?trackingCode={code}` | Public status lookup |

---

## Commerce Boundary

The Civic Suite strictly maintains the Commerce boundary:

**Civic EMITS:**
- Service fees
- Processing fees
- Inspection fees
- Late fees
- Penalties
- Refund facts

**Commerce HANDLES:**
- Invoice creation
- VAT calculation
- Payment recording
- Accounting journal entries

The `/api/civic/billing-facts` endpoint serves as the **ONLY** integration point between Civic and Commerce. Commerce can:
1. Query pending facts via `?action=pending`
2. Mark facts as billed via `{action: 'markBilled', billingInvoiceId}`

---

## Append-Only Enforcement

The following entities are **append-only** to ensure regulatory compliance and audit integrity:

| Entity | Endpoint | Notes |
|--------|----------|-------|
| Case Notes | `/api/civic/cases` POST addNote | No edits/deletes |
| Case Status Changes | `/api/civic/cases` PATCH | Creates audit record |
| Inspection Findings | `/api/civic/inspections` POST addFinding | No edits/deletes |
| Approvals | `/api/civic/approvals` | No PATCH/DELETE methods |
| Audit Logs | `/api/civic/audit` | No PATCH/DELETE methods |

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Missing required fields |
| 401 | Unauthorized - No valid session |
| 403 | Forbidden - Capability not activated |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Total API Endpoints

| Category | Routes | Methods |
|----------|--------|---------|
| Main | 1 | 2 (GET, POST) |
| Citizens | 1 | 3 (GET, POST, PATCH) |
| Organizations | 1 | 3 (GET, POST, PATCH) |
| Agencies | 1 | 3 (GET, POST, PATCH) |
| Departments | 1 | 3 (GET, POST, PATCH) |
| Units | 1 | 2 (GET, POST) |
| Staff | 1 | 3 (GET, POST, PATCH) |
| Services | 1 | 3 (GET, POST, PATCH) |
| Requests | 1 | 3 (GET, POST, PATCH) |
| Cases | 1 | 3 (GET, POST, PATCH) |
| Inspections | 1 | 3 (GET, POST, PATCH) |
| Approvals | 1 | 2 (GET, POST) |
| Billing Facts | 1 | 3 (GET, POST, PATCH) |
| Audit | 1 | 2 (GET, POST) |
| Public | 1 | 1 (GET) |
| **Total** | **15** | **39** |

---

## Compliance Checklist

| Requirement | Status |
|-------------|--------|
| Capability guards on all endpoints | ✅ |
| 401 for unauthenticated | ✅ |
| 403 for unauthorized (missing capability) | ✅ |
| Append-only semantics preserved | ✅ |
| Read-only payment status views | ✅ |
| Commerce boundary enforced | ✅ |
| No UI code | ✅ |
| No demo page | ✅ |
| No Demo Mode wiring | ✅ |
| No background jobs | ✅ |
| TypeScript compilation success | ✅ |
| Prisma validate passed | ✅ |

---

*Document generated as part of Civic / GovTech Suite S3 completion.*
