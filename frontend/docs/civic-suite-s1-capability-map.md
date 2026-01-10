# Civic / GovTech Suite — S1 Capability Map

**Suite**: Civic / GovTech  
**Standard**: Platform Standardisation v2  
**Phase**: S1 — Capability Mapping  
**Date**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document defines the capability structure for the Civic / GovTech Suite, mapping functional areas to capability keys, API surface, and tenant permissions.

---

## 🔑 Capability Groups

### 1. Citizen & Organization Registry

**Capability Key**: `civic_registry`

| Function | Description |
|----------|-------------|
| Citizen profiles | Create and manage citizen references |
| Organization profiles | Business and NGO references |
| Document management | Upload and verify citizen documents |
| Profile search | Find citizens/orgs by ID or criteria |
| Merge duplicates | Combine duplicate profiles |

**API Surface** (S3):
```
POST   /api/civic/citizens          Create citizen
GET    /api/civic/citizens          List citizens
GET    /api/civic/citizens/:id      Get citizen
PATCH  /api/civic/citizens/:id      Update citizen
POST   /api/civic/organizations     Create organization
GET    /api/civic/organizations     List organizations
POST   /api/civic/documents         Upload document
```

---

### 2. Agencies & Departments

**Capability Key**: `civic_agencies`

| Function | Description |
|----------|-------------|
| Agency setup | Configure government agencies |
| Department structure | Define departments and units |
| Staff assignments | Assign staff to units |
| Role management | Define staff roles and permissions |
| Operating hours | Set service hours |

**API Surface** (S3):
```
POST   /api/civic/agencies          Create agency
GET    /api/civic/agencies          List agencies
PATCH  /api/civic/agencies/:id      Update agency
POST   /api/civic/departments       Create department
GET    /api/civic/departments       List departments
POST   /api/civic/staff             Create staff
GET    /api/civic/staff             List staff
```

---

### 3. Service Catalogue

**Capability Key**: `civic_services`

| Function | Description |
|----------|-------------|
| Service definitions | Define available services |
| Requirements | Specify required documents |
| Fee structures | Define service fees |
| SLA definitions | Set processing time expectations |
| Service categories | Organize services |

**API Surface** (S3):
```
POST   /api/civic/services          Create service
GET    /api/civic/services          List services
GET    /api/civic/services/:id      Get service details
PATCH  /api/civic/services/:id      Update service
POST   /api/civic/services/:id/requirements  Add requirement
POST   /api/civic/services/:id/fees Add fee
```

---

### 4. Requests & Case Workflow

**Capability Key**: `civic_requests`

| Function | Description |
|----------|-------------|
| Request submission | Citizens submit service requests |
| Case creation | Convert requests to internal cases |
| Case assignment | Assign cases to staff |
| Status tracking | Track case progress |
| Case notes | Add internal notes (append-only) |
| Document requests | Request additional documents |
| Escalation | Escalate cases to supervisors |

**API Surface** (S3):
```
POST   /api/civic/requests          Submit request
GET    /api/civic/requests          List requests
GET    /api/civic/requests/:id      Get request
GET    /api/civic/cases             List cases
GET    /api/civic/cases/:id         Get case
PATCH  /api/civic/cases/:id/assign  Assign case
POST   /api/civic/cases/:id/notes   Add note (append-only)
PATCH  /api/civic/cases/:id/status  Update status
POST   /api/civic/cases/:id/escalate Escalate case
```

---

### 5. Inspections & Approvals

**Capability Key**: `civic_inspections`

| Function | Description |
|----------|-------------|
| Schedule inspection | Plan field inspections |
| Record findings | Document inspection results (append-only) |
| Upload evidence | Attach photos/documents |
| Approval decisions | Record approval/rejection |
| Conditions | Add conditions to approvals |
| Certificate generation | Trigger certificate issuance |

**API Surface** (S3):
```
POST   /api/civic/inspections       Schedule inspection
GET    /api/civic/inspections       List inspections
GET    /api/civic/inspections/:id   Get inspection
POST   /api/civic/inspections/:id/findings  Add finding (append-only)
POST   /api/civic/approvals         Record approval
GET    /api/civic/approvals         List approvals
POST   /api/civic/approvals/:id/conditions  Add condition
```

---

### 6. Billing Facts (Commerce Boundary)

**Capability Key**: `civic_billing`

| Function | Description |
|----------|-------------|
| Fee fact creation | Emit fee facts for Commerce |
| Penalty facts | Emit penalty/fine facts |
| Late fee facts | Emit late payment facts |
| Mark as billed | Update when Commerce bills |
| Waive charges | Waive fees with authorization |
| Billing summary | View pending/billed facts |

**API Surface** (S3):
```
POST   /api/civic/billing-facts     Create billing fact
GET    /api/civic/billing-facts     List billing facts
GET    /api/civic/billing-facts/:id Get billing fact
PATCH  /api/civic/billing-facts/:id/billed  Mark as billed (Commerce callback)
PATCH  /api/civic/billing-facts/:id/waive   Waive charge
GET    /api/civic/billing-facts/summary     Get summary
```

**⚠️ Commerce Boundary**:
- Civic emits facts ONLY
- Commerce creates invoices
- Commerce calculates VAT (if applicable)
- Commerce records payments
- Commerce posts to accounting

---

### 7. Payments Visibility (Read-Only)

**Capability Key**: `civic_payments_view`

| Function | Description |
|----------|-------------|
| Payment status | View payment status from Commerce |
| Receipt reference | Link to Commerce receipt |
| Outstanding balance | View unpaid amounts |

**API Surface** (S3):
```
GET    /api/civic/payments/status/:requestId  Get payment status (read-only)
GET    /api/civic/payments/outstanding        Get outstanding balances
```

**Note**: This is READ-ONLY access to Commerce payment data. Civic never writes payment records.

---

### 8. Audit, Logs & Transparency

**Capability Key**: `civic_audit`

| Function | Description |
|----------|-------------|
| Audit log query | Search action history |
| Case audit trail | Full case history |
| Transparency reports | Public statistics |
| FOI data export | Freedom of Information requests |
| Compliance reports | Regulatory reports |

**API Surface** (S3):
```
GET    /api/civic/audit/logs        Query audit logs
GET    /api/civic/audit/case/:id    Get case audit trail
GET    /api/civic/transparency/stats Get public statistics
GET    /api/civic/transparency/services Service performance
POST   /api/civic/audit/export      Export for FOI
```

---

## 📊 Capability Matrix

| Capability Key | Read | Write | Admin | Audit |
|----------------|------|-------|-------|-------|
| `civic_registry` | ✅ | ✅ | ✅ | ✅ |
| `civic_agencies` | ✅ | ✅ | ✅ | ✅ |
| `civic_services` | ✅ | ✅ | ✅ | ✅ |
| `civic_requests` | ✅ | ✅ | ✅ | ✅ |
| `civic_inspections` | ✅ | ✅ | ✅ | ✅ |
| `civic_billing` | ✅ | ✅ | ✅ | ✅ |
| `civic_payments_view` | ✅ | ❌ | ❌ | ✅ |
| `civic_audit` | ✅ | ❌ | ✅ | ✅ |

---

## 🛡️ Capability Guards

### Per-Route Protection

All `/api/civic/*` routes require:
1. **Authentication**: Valid session
2. **Tenant scope**: Active tenant ID
3. **Capability check**: `checkCapabilityForSession(tenantId, capabilityKey)`

### Response Codes

| Code | Meaning |
|------|--------|
| 401 | Not authenticated |
| 403 | Capability not active |
| 404 | Resource not found |
| 400 | Validation error |

---

## 🔗 Cross-Suite Integration

### Commerce Integration

```
Civic                          Commerce
─────                          ────────
civic_billing_fact    ──────►  billing_invoice
       ◄───── markAsBilled() ─────
                               payment_record
                               accounting_journal
```

### Integration Points

| From | To | Method | Purpose |
|------|----|---------|---------|
| Civic | Commerce Billing | Emit fact | Create invoice |
| Commerce | Civic | Callback | Mark as billed |
| Civic | Commerce | Read | Payment status |

---

## 🎨 Demo Mode Capabilities

### Quick Start Roles

| Role | Storyline ID | Capabilities |
|------|-------------|---------------|
| `citizen` | civicCitizen | civic_registry (own), civic_requests (own) |
| `agencyStaff` | civicStaff | civic_requests, civic_inspections |
| `regulator` | civicRegulator | civic_audit (read) |
| `auditor` | civicAuditor | civic_audit (full) |

### Storyline Summary

| Storyline | Steps | Focus |
|-----------|-------|-------|
| civicCitizen | 6 | Submit request → Track → Receive approval |
| civicStaff | 7 | Process → Inspect → Approve → Emit facts |
| civicRegulator | 5 | Audit trails → Compliance → Transparency |
| civicAuditor | 6 | Full system audit → FOI → Reports |

---

## 🇳🇬 Nigeria-First Capability Design

### Multi-Agency Support

| Feature | Implementation |
|---------|----------------|
| Agency isolation | Tenant per agency |
| Cross-agency view | Federation capability (future) |
| State/LGA hierarchy | Tenant hierarchy support |

### Offline Considerations

| Scenario | Design |
|----------|--------|
| Field inspections | Sync-capable inspection module |
| Document upload | Chunked upload with resume |
| Status updates | Queue for sync |

### Payment Flexibility

| Payment Method | Support |
|----------------|--------|
| Cash | Commerce POS integration |
| Bank transfer | Commerce bank integration |
| Online | Commerce payment gateway |
| POS | Commerce POS integration |

**Note**: All payment methods handled by Commerce, not Civic.

---

## 📐 Service Layer Design (S2 Preview)

### Expected Services

| Service | Methods | Purpose |
|---------|---------|--------|
| CitizenService | ~10 | Citizen profile management |
| OrganizationService | ~8 | Organization management |
| AgencyService | ~12 | Agency and department setup |
| ServiceCatalogueService | ~15 | Service definitions |
| RequestService | ~18 | Request submission and tracking |
| CaseService | ~20 | Case workflow management |
| InspectionService | ~12 | Inspection scheduling and findings |
| ApprovalService | ~10 | Approval decisions |
| BillingFactService | ~12 | Fee and penalty fact emission |
| AuditService | ~15 | Audit logs and transparency |

**Total**: ~130+ methods across 10 services

---

## 📋 Verification Checklist (S1)

- [x] 8 capability groups defined
- [x] Capability keys assigned
- [x] API surface outlined per capability
- [x] Commerce boundary clearly marked
- [x] Capability matrix documented
- [x] Guard requirements specified
- [x] Cross-suite integration defined
- [x] Demo roles and storylines proposed
- [x] Nigeria-first considerations included
- [x] S2 service preview provided

---

## 🛑 STOP POINT

S0 (Domain Audit) and S1 (Capability Map) are complete.

**Awaiting explicit authorization for S2 (Schema & Services).**

---

## 📊 Platform Vertical Status

| Vertical | Status | Current Phase |
|----------|--------|---------------|
| Commerce | 🔒 FROZEN | Complete |
| Education | 🔒 FROZEN | Complete |
| Health | 🔒 FROZEN | Complete |
| Hospitality | 🔒 FROZEN | Complete |
| **Civic / GovTech** | 🟡 IN PROGRESS | **S0-S1 Complete** |

---

*This document follows Platform Standardisation v2 requirements.*
