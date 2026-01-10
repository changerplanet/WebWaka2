# Civic / GovTech Suite — S0 Domain Audit

**Suite**: Civic / GovTech  
**Standard**: Platform Standardisation v2  
**Phase**: S0 — Domain Audit  
**Date**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

The Civic / GovTech Suite enables Nigerian government agencies, local government areas (LGAs), and public service organizations to digitize citizen services, manage requests and cases, and maintain audit-grade transparency — all while respecting the constitutional Commerce boundary.

This is the **highest-scrutiny vertical** in the platform. It will be reviewed by regulators, auditors, media, and the public. Every design decision must be defensible.

---

## 🎯 Domain Intent

### What This Suite Does

1. **Citizen & Organization Registry**: Maintain references to citizens and organizations for service delivery (not a national ID replacement)
2. **Service Catalogue**: Define available government services with requirements, fees, and SLAs
3. **Request & Case Workflow**: Track service requests from submission to resolution with append-only audit trails
4. **Inspections & Approvals**: Record inspection outcomes and approval decisions as immutable facts
5. **Billing Facts Emission**: Generate fee and penalty facts for Commerce to process
6. **Audit & Transparency**: Provide full traceability for FOI requests and regulatory audits

### What This Suite Does NOT Do

- ❌ Replace or duplicate National ID (NIN) systems
- ❌ Handle elections or voting
- ❌ Capture biometric data
- ❌ Manage law enforcement systems
- ❌ Execute treasury or budget operations
- ❌ Integrate directly with other government systems
- ❌ Calculate VAT or record payments (Commerce handles)

---

## 📦 Domain Scope

### In Scope (Phase 1)

| Domain Area | Description |
|-------------|-------------|
| Citizen Registry | Identity references for service delivery |
| Organization Registry | Business and NGO references |
| Agency Structure | Departments, units, and staff assignments |
| Service Catalogue | Government services with fees and SLAs |
| Service Requests | Citizen-initiated requests |
| Case Workflow | Internal case tracking and routing |
| Inspections | Field inspection records |
| Approvals | Decision records with rationale |
| Billing Facts | Fee and penalty facts for Commerce |
| Audit Logs | Immutable action history |
| Transparency Views | Public-facing status and statistics |

### Explicitly Out of Scope (Phase 1)

| Domain Area | Reason |
|-------------|--------|
| National ID (NIN) | Separate government system |
| Elections / Voting | Specialized domain |
| Biometrics | Privacy and security concerns |
| Law Enforcement | Specialized domain |
| Treasury / Budget | Finance ministry domain |
| Inter-Government APIs | Future integration phase |
| Judiciary / Courts | Specialized domain |
| Tax Assessment | Revenue service domain |

---

## 🇳🇬 Nigeria-First Assumptions

### Operational Realities

| Reality | Design Implication |
|---------|--------------------|
| Multi-agency fragmentation | Each agency operates independently with own workflows |
| Paper-to-digital transition | Support hybrid paper + digital processes |
| Cash + Bank + POS payments | Commerce handles all payment methods |
| High audit sensitivity | Every action must be traceable |
| FOI (Freedom of Information) | Public transparency is mandatory |
| Public scrutiny | UI must be clear and defensible |
| Low digital literacy | Simple, guided workflows required |
| Network unreliability | Offline-capable design consideration |

### Payment Realities

| Payment Type | Handling |
|--------------|----------|
| Service fees | Civic emits fact → Commerce bills |
| Permit fees | Civic emits fact → Commerce bills |
| Fines/Penalties | Civic emits fact → Commerce bills |
| Late fees | Civic emits fact → Commerce bills |
| VAT | Commerce calculates (varies by service) |
| Payment recording | Commerce only |
| Receipts | Commerce only |

### Regulatory Context

| Regulation | Implication |
|------------|-------------|
| Freedom of Information Act | Public access to non-sensitive data |
| Data Protection Act | Citizen data privacy |
| Public Procurement Act | Transparency in approvals |
| Anti-Corruption (EFCC/ICPC) | Full audit trails mandatory |
| State/LGA autonomy | Multi-tenant by jurisdiction |

---

## 🏛️ Domain Entities (Indicative)

### Core Entities

```
Citizen Registry
├── civic_citizen (identity reference, not NIN)
├── civic_organization (business/NGO reference)
└── civic_citizen_document (uploaded documents)

Agency Structure
├── civic_agency (government agency/ministry)
├── civic_department (department within agency)
├── civic_unit (unit within department)
└── civic_staff (staff assignments)

Service Catalogue
├── civic_service (service definition)
├── civic_service_requirement (required documents/info)
├── civic_service_fee (fee structure)
└── civic_service_sla (SLA definitions)

Request & Case Workflow
├── civic_request (citizen-initiated request)
├── civic_case (internal case record)
├── civic_case_assignment (staff assignment)
├── civic_case_note (internal notes, append-only)
├── civic_case_status_change (status history)
└── civic_case_document (case attachments)

Inspections & Approvals
├── civic_inspection (field inspection record)
├── civic_inspection_finding (findings, append-only)
├── civic_approval (decision record)
└── civic_approval_condition (conditions if any)

Billing & Audit
├── civic_billing_fact (fee/penalty facts → Commerce)
├── civic_audit_log (immutable action log)
└── civic_public_status (transparency view)
```

### Key Enums (Indicative)

```
CivicRequestStatus: DRAFT, SUBMITTED, UNDER_REVIEW, PENDING_DOCUMENTS, 
                    PENDING_PAYMENT, PENDING_INSPECTION, APPROVED, 
                    REJECTED, CANCELLED, EXPIRED

CivicCaseStatus: OPEN, ASSIGNED, IN_PROGRESS, PENDING_ACTION, 
                 ESCALATED, RESOLVED, CLOSED

CivicInspectionResult: PASSED, FAILED, CONDITIONAL, RESCHEDULED

CivicApprovalDecision: APPROVED, REJECTED, DEFERRED, CONDITIONAL

CivicBillingFactType: SERVICE_FEE, PERMIT_FEE, INSPECTION_FEE, 
                       PENALTY, LATE_FEE, RENEWAL_FEE

CivicBillingFactStatus: PENDING, BILLED, WAIVED, CANCELLED
```

---

## 💰 Commerce Boundary (MANDATORY)

### The Rule

```
Civic [Fee / Penalty Facts] → Commerce [Billing] → Payments → Accounting
```

### What Civic Does

- ✅ Emits `civic_billing_fact` for fees, penalties, late fees
- ✅ References Commerce invoice ID when billed
- ✅ Marks facts as BILLED when Commerce confirms
- ✅ Shows payment status (read-only from Commerce)

### What Civic NEVER Does

- ❌ Creates invoices
- ❌ Calculates VAT (varies by service type)
- ❌ Records payments
- ❌ Issues receipts
- ❌ Touches accounting journals
- ❌ Imports Billing, Payments, or Accounting modules

### VAT Handling

| Service Type | VAT Treatment |
|--------------|---------------|
| Permit fees | Exempt (typically) |
| License fees | Exempt (typically) |
| Fines/Penalties | Exempt |
| Service charges | May apply (Commerce decides) |

**Note**: VAT treatment varies by service type. Commerce handles this complexity, not Civic.

---

## 🔒 Security & Privacy Considerations

### Data Classification

| Data Type | Classification | Access |
|-----------|----------------|--------|
| Citizen PII | Confidential | Agency staff only |
| Case details | Restricted | Assigned staff + citizen |
| Inspection findings | Restricted | Agency + citizen |
| Approval decisions | Public (redacted) | Transparency view |
| Aggregate statistics | Public | Dashboard |
| Audit logs | Confidential | Auditors only |

### Append-Only Requirements

| Entity | Append-Only | Reason |
|--------|-------------|--------|
| Case notes | Yes | Audit trail |
| Status changes | Yes | History preservation |
| Inspection findings | Yes | Legal defensibility |
| Approval decisions | Yes | Accountability |
| Audit logs | Yes | Regulatory compliance |

### Access Control

| Role | Access Level |
|------|-------------|
| Citizen | Own requests and cases only |
| Agency Staff | Assigned cases only |
| Supervisor | Department cases |
| Agency Admin | Agency-wide |
| Auditor | Read-only all (audit mode) |
| Public | Transparency views only |

---

## 🎨 Demo Intent (Declared)

### Route

`/civic-demo`

### Demo Scenario

**Agency**: Lagos State Lands Bureau  
**Service**: Certificate of Occupancy (C of O) Application  
**Flow**: Application → Document Review → Inspection → Approval → Certificate Issuance

### Proposed Quick Start Roles

| Role | Persona | Storyline Focus |
|------|---------|----------------|
| `citizen` | Lagos Resident | Submit request → track status → receive approval |
| `agencyStaff` | Lands Bureau Officer | Process requests → conduct inspections → record decisions |
| `regulator` | EFCC / Audit Officer | Verify audit trails → check compliance |
| `auditor` | State Auditor General | Full transparency review → FOI compliance |

### Nigeria-First Demo Data

- Lagos State Lands Bureau
- Ikeja, Lagos location
- Nigerian citizen names
- NGN currency for all fees
- Realistic SLAs (30-90 days)
- Common permit types

---

## 📋 Verification Checklist (S0)

- [x] Domain intent defined
- [x] In-scope entities listed
- [x] Out-of-scope explicitly stated
- [x] Nigeria-first assumptions documented
- [x] Commerce boundary declared
- [x] Security considerations outlined
- [x] Demo intent declared
- [x] Quick Start roles proposed

---

## 🛑 STOP POINT

S0 Domain Audit is complete. Proceeding to S1 Capability Mapping.

---

*This document follows Platform Standardisation v2 requirements.*
