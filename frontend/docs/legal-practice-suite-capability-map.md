# Legal Practice Suite — S0-S1 Capability Mapping

## Document Info
- **Suite**: Legal Practice Management
- **Phase**: 7B (Class B Domain)
- **Step**: S0-S1 (Capability Mapping)
- **Status**: SUBMITTED — AWAITING APPROVAL
- **Date**: January 6, 2026
- **Author**: E1 Agent

---

## 1️⃣ S0: CONTEXT CONFIRMATION

### 1.1 Suite Definition
The **Legal Practice Suite** is a practice management system for Nigerian law firms, chambers, solo practitioners, and corporate legal departments. It manages the operational aspects of legal practice: clients, matters, documents, time tracking, billing, and deadlines.

**This is NOT**:
- A judiciary/court system
- A legal research platform
- An e-filing integration
- An AI legal advisor

### 1.2 Target Customers (Nigeria-First)

| Customer Type | Description | Size |
|---------------|-------------|------|
| **Solo Practitioners** | Individual lawyers with own practice | 1 person |
| **Small Law Firms** | 2-10 lawyers, 1-3 support staff | 3-13 people |
| **Mid-sized Chambers** | 10-50 lawyers, multiple practice areas | 15-70 people |
| **Corporate Legal Depts** | In-house counsel teams | 2-20 people |
| **NGO Legal Units** | Public interest, human rights, legal aid | 2-10 people |

### 1.3 Nigerian Legal Practice Realities

| Reality | Implication |
|---------|-------------|
| **Retainer-based billing** | Common model: clients pay retainer, drawn down over time |
| **Manual court filings** | Physical submissions still dominate; tracking is critical |
| **Heavy document workflows** | Briefs, motions, evidence, correspondence |
| **Multiple matters per client** | One client may have 5+ active cases |
| **Court calendar dominance** | Practice revolves around court dates |
| **NGN currency** | All billing in Nigerian Naira |
| **Disbursement recovery** | Filing fees, transport, printing passed to clients |
| **Seniority-based billing** | Partner vs Associate vs Paralegal rates |
| **Audit trail requirements** | Strong need for who-did-what-when |

### 1.4 Nigerian Case Type Coverage

| Category | Example Types |
|----------|---------------|
| **Civil Litigation** | Contract disputes, torts, property, recovery |
| **Criminal Defense** | Bail, defense, appeals |
| **Corporate/Commercial** | M&A, compliance, contracts, incorporations |
| **Family Law** | Divorce, custody, inheritance |
| **Real Estate/Property** | Conveyancing, land disputes, title verification |
| **Employment/Labour** | Wrongful termination, disputes |
| **Intellectual Property** | Trademark, copyright, patents |
| **Tax & Revenue** | Tax disputes, FIRS matters |
| **Banking & Finance** | Loan recovery, banking disputes |
| **Administrative/Regulatory** | Permits, licenses, regulatory compliance |

---

## 2️⃣ S1: CAPABILITY MAPPING

### 2.1 Domain A: Client & Party Management

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| A1 | Client Registration | Create client record (individual/corporate) | 95% | CRM Contacts | No |
| A2 | Client Types | Individual, Corporate, Government, NGO | 90% | CRM + Config | No |
| A3 | Client Contact Details | Phone, email, address, alternate contacts | 100% | CRM Contacts | No |
| A4 | Client Documents | KYC, ID, CAC docs for corporate clients | 85% | Files Module | No |
| A5 | Opposing Parties | Track opposing counsel, parties in matters | 80% | CRM Contacts | Minor |
| A6 | Witnesses | Witness contact info per matter | 80% | CRM Contacts | Minor |
| A7 | Related Contacts | Judges, registrars, experts (reference only) | 75% | CRM Contacts | Minor |
| A8 | Client History | View all matters, invoices, communications | 90% | CRM + Billing | No |
| A9 | Conflict Check | Search existing parties before engagement | 0% | **NEW** | **Yes** |

**Domain A Reuse: ~77%**

---

### 2.2 Domain B: Case / Matter Management

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| B1 | Matter Creation | Create legal matter with case details | 0% | **NEW** | **Yes** |
| B2 | Matter Types | Civil, Criminal, Corporate, Family, etc. | 0% | **NEW (Enum)** | **Yes** |
| B3 | Matter Status | Open, Active, On Hold, Closed, Archived | 0% | **NEW (Enum)** | **Yes** |
| B4 | Matter Assignment | Assign lawyers/staff to matter | 70% | HR Staff + Config | Minor |
| B5 | Court/Tribunal Reference | Court name, division, suit number | 0% | **NEW (Fields)** | **Yes** |
| B6 | Judge/Registrar Reference | Reference only (not integration) | 0% | **NEW (Fields)** | **Yes** |
| B7 | Matter Timeline | Key events, milestones in chronological order | 60% | Activity Logs | Minor |
| B8 | Matter Notes | Internal notes, strategy, observations | 90% | Notes Module | No |
| B9 | Matter Linking | Link related matters (appeals, cross-claims) | 0% | **NEW** | **Yes** |
| B10 | Practice Area Tagging | Tag matters by practice area | 80% | Tags/Categories | No |
| B11 | Matter Search | Search by client, type, status, date | 85% | Search Infrastructure | No |
| B12 | Matter Dashboard | Overview of matter status, team, deadlines | 0% | **NEW (UI)** | **Yes** |

**Domain B Reuse: ~39%**

---

### 2.3 Domain C: Document & Filing Management

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| C1 | Document Upload | Upload documents to matter | 90% | Files Module | No |
| C2 | Document Categories | Brief, Motion, Evidence, Correspondence, etc. | 70% | Files + Config | Minor |
| C3 | Document Versioning | Track versions of same document | 60% | Files Module | Minor |
| C4 | Document Access Control | Restrict sensitive docs by role | 80% | Permissions | No |
| C5 | Filing Tracker | Track what was filed, when, where | 0% | **NEW** | **Yes** |
| C6 | Filing Proof | Upload stamped/filed copies | 85% | Files Module | No |
| C7 | Evidence Registry | Tag documents as evidence with exhibit numbers | 0% | **NEW** | **Yes** |
| C8 | Document Templates | Standard templates (briefs, letters, motions) | 50% | Sites & Funnels Templates | Minor |
| C9 | Document Search | Full-text search across matter documents | 70% | Search Infrastructure | Minor |
| C10 | Document Sharing | Share specific docs with client (portal future) | 40% | **Partial** | Minor |

**Domain C Reuse: ~55%**

---

### 2.4 Domain D: Time & Activity Tracking

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| D1 | Time Entry | Log time spent on matter | 0% | **NEW** | **Yes** |
| D2 | Billable vs Non-Billable | Flag time as billable or internal | 0% | **NEW (Field)** | **Yes** |
| D3 | Activity Types | Research, Drafting, Appearance, Call, etc. | 0% | **NEW (Enum)** | **Yes** |
| D4 | Staff Assignment | Link time to specific lawyer/staff | 70% | HR Staff | Minor |
| D5 | Hourly Rates | Rate per staff member per matter | 0% | **NEW** | **Yes** |
| D6 | Time Approval | Partner approves associate time entries | 0% | **NEW** | **Yes** |
| D7 | Time Summary | Total hours per matter, per staff | 0% | **NEW (Calc)** | **Yes** |
| D8 | Activity Log | Automatic log of actions on matter | 80% | Audit Logs | No |
| D9 | Timer (Optional) | Start/stop timer for active work | 0% | **NEW (UI)** | **Yes** |

**Domain D Reuse: ~17%**

---

### 2.5 Domain E: Billing & Finance

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| E1 | Retainer Management | Track retainer balance, deposits, drawdowns | 0% | **NEW** | **Yes** |
| E2 | Hourly Billing | Generate bills from approved time entries | 30% | Billing + NEW | **Yes** |
| E3 | Flat Fee Billing | Fixed fee per matter or phase | 80% | Billing Module | No |
| E4 | Disbursements | Track expenses (filing fees, transport, etc.) | 0% | **NEW** | **Yes** |
| E5 | Invoice Generation | Generate invoice from time + disbursements | 70% | Billing Module | Minor |
| E6 | Invoice Templates | Legal invoice format (detailed breakdown) | 50% | Billing + Config | Minor |
| E7 | Payment Recording | Record payments against invoices | 95% | Payments Module | No |
| E8 | Payment Methods | Transfer, Cash, Card, Cheque | 100% | Payments Module | No |
| E9 | Outstanding Balances | Track unpaid amounts per client/matter | 90% | Billing Module | No |
| E10 | Trust Accounting | Separate client funds from firm funds | 0% | **NEW** | **Yes** |
| E11 | Receipt Generation | Generate receipts for payments | 95% | Payments Module | No |
| E12 | Currency (NGN) | All amounts in Nigerian Naira | 100% | Platform Default | No |

**Domain E Reuse: ~59%**

---

### 2.6 Domain F: Deadlines & Compliance

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| F1 | Court Date Tracking | Record upcoming court appearances | 0% | **NEW** | **Yes** |
| F2 | Filing Deadlines | Track statutory/court-imposed deadlines | 0% | **NEW** | **Yes** |
| F3 | Deadline Reminders | Email/SMS reminders before deadlines | 70% | Notifications + Calendar | Minor |
| F4 | Calendar Integration | View deadlines in calendar format | 80% | Calendar Module | No |
| F5 | Deadline Escalation | Alert supervisor if deadline approaching | 50% | Notifications | Minor |
| F6 | Deadline Status | Pending, Completed, Missed, Extended | 0% | **NEW (Enum)** | **Yes** |
| F7 | Limitation Tracking | Track limitation periods (statute of limitations) | 0% | **NEW** | **Yes** |
| F8 | Adjournment Tracking | Track when matters are adjourned | 0% | **NEW (Field)** | **Yes** |

**Domain F Reuse: ~25%**

---

### 2.7 Domain G: Reporting & Oversight

| # | Capability | Description | Reuse % | Source Module | Gap? |
|---|------------|-------------|---------|---------------|------|
| G1 | Matter Load Report | Cases per lawyer, by status | 0% | **NEW (Query)** | **Yes** |
| G2 | Revenue per Matter | Total billed/collected per case | 70% | Billing Analytics | Minor |
| G3 | Staff Utilization | Billable hours vs capacity | 0% | **NEW (Query)** | **Yes** |
| G4 | Aging Report | Outstanding invoices by age | 90% | Billing Module | No |
| G5 | Retainer Status | Retainer balances across clients | 0% | **NEW (Query)** | **Yes** |
| G6 | Deadline Compliance | Deadlines met vs missed | 0% | **NEW (Query)** | **Yes** |
| G7 | Practice Area Analysis | Revenue/matters by practice area | 60% | Analytics + Tags | Minor |
| G8 | Firm Dashboard | Overview KPIs for partners/management | 30% | **NEW (UI)** | **Yes** |

**Domain G Reuse: ~31%**

---

## 3️⃣ CAPABILITY SUMMARY

### 3.1 Overall Statistics

| Metric | Count |
|--------|-------|
| **Total Capabilities** | 58 |
| **High Reuse (≥70%)** | 22 (38%) |
| **Partial Reuse (30-69%)** | 10 (17%) |
| **New Development (<30%)** | 26 (45%) |
| **Overall Reuse Rate** | **~43%** |

### 3.2 By Domain

| Domain | Capabilities | Avg Reuse |
|--------|-------------|-----------|
| A. Client & Party Management | 9 | 77% |
| B. Case/Matter Management | 12 | 39% |
| C. Document & Filing | 10 | 55% |
| D. Time & Activity | 9 | 17% |
| E. Billing & Finance | 12 | 59% |
| F. Deadlines & Compliance | 8 | 25% |
| G. Reporting & Oversight | 8 | 31% |

### 3.3 Reuse Sources

| Source Module | Capabilities Reused | Notes |
|---------------|---------------------|-------|
| CRM Contacts | 8 | Clients, parties, witnesses |
| Billing Module | 7 | Invoices, payments, outstanding |
| Payments Module | 4 | Payment recording, receipts |
| Files Module | 5 | Document storage, uploads |
| HR/Staff Module | 3 | Staff assignment, rates |
| Calendar | 2 | Deadline calendar view |
| Audit Logs | 2 | Activity tracking |
| Permissions | 2 | Access control |
| Notifications | 2 | Reminders, alerts |
| Tags/Categories | 2 | Practice areas, doc types |

---

## 4️⃣ GAP REGISTER

| Gap ID | Description | Domain | Priority | Implementation Notes |
|--------|-------------|--------|----------|---------------------|
| **GAP-LEG-001** | Legal Matter entity | B | P0 | Core entity - must build |
| **GAP-LEG-002** | Time Entry model | D | P0 | Core for billing - must build |
| **GAP-LEG-003** | Retainer tracking | E | P0 | Nigeria-critical - must build |
| **GAP-LEG-004** | Filing/Deadline entity | F | P0 | Court date tracking - must build |
| **GAP-LEG-005** | Disbursement tracking | E | P1 | Expense passthrough - must build |
| **GAP-LEG-006** | Conflict check service | A | P1 | Search existing parties |
| **GAP-LEG-007** | Evidence registry | C | P1 | Tag docs as exhibits |
| **GAP-LEG-008** | Time approval workflow | D | P2 | Partner approves entries |
| **GAP-LEG-009** | Trust accounting | E | P2 | Client funds separation |
| **GAP-LEG-010** | Matter linking | B | P2 | Related cases reference |
| **GAP-LEG-011** | Hourly rate configuration | D | P1 | Per-staff, per-matter rates |
| **GAP-LEG-012** | Limitation period tracking | F | P2 | Statute of limitations |

### Gap Priority Key
- **P0**: Must have for MVP (core functionality)
- **P1**: Should have for full suite (important features)
- **P2**: Nice to have (enhancement, future iteration)

---

## 5️⃣ SCHEMA IMPACT ASSESSMENT

### 5.1 New Models Required

| Model | Description | Priority | Fields (Key) |
|-------|-------------|----------|--------------|
| `leg_matter` | Legal case/matter | P0 | id, tenantId, clientId, matterNumber, matterType, status, title, court, suitNumber, openDate, closeDate |
| `leg_time_entry` | Time tracking | P0 | id, tenantId, matterId, staffId, date, hours, activityType, description, billable, approved, rate |
| `leg_retainer` | Retainer accounts | P0 | id, tenantId, clientId, matterId, initialAmount, balance, currency |
| `leg_retainer_transaction` | Retainer movements | P0 | id, retainerId, type, amount, description, date, reference |
| `leg_deadline` | Court dates & deadlines | P0 | id, tenantId, matterId, deadlineType, dueDate, description, status, completedDate |
| `leg_disbursement` | Matter expenses | P1 | id, tenantId, matterId, date, category, amount, description, billable, invoiced |
| `leg_filing` | Filing records | P1 | id, tenantId, matterId, filingType, filedDate, court, description, documentId |
| `leg_matter_party` | Parties on matter | P1 | id, matterId, contactId, partyRole, notes |

### 5.2 New Enums Required

| Enum | Values |
|------|--------|
| `leg_MatterType` | CIVIL, CRIMINAL, CORPORATE, FAMILY, PROPERTY, EMPLOYMENT, IP, TAX, BANKING, ADMINISTRATIVE, OTHER |
| `leg_MatterStatus` | DRAFT, ACTIVE, ON_HOLD, CLOSED, ARCHIVED |
| `leg_ActivityType` | RESEARCH, DRAFTING, REVIEW, APPEARANCE, CALL, MEETING, TRAVEL, FILING, CORRESPONDENCE, OTHER |
| `leg_DeadlineType` | COURT_DATE, FILING_DEADLINE, LIMITATION, INTERNAL, OTHER |
| `leg_DeadlineStatus` | PENDING, COMPLETED, MISSED, EXTENDED, CANCELLED |
| `leg_PartyRole` | CLIENT, OPPOSING_PARTY, OPPOSING_COUNSEL, WITNESS, EXPERT, JUDGE, REGISTRAR, OTHER |
| `leg_DisbursementCategory` | FILING_FEE, TRANSPORT, PRINTING, COURIER, ACCOMMODATION, EXPERT_FEE, OTHER |
| `leg_RetainerTransactionType` | DEPOSIT, WITHDRAWAL, ADJUSTMENT, REFUND |
| `leg_FilingType` | ORIGINATING_PROCESS, MOTION, BRIEF, AFFIDAVIT, EXHIBIT, JUDGMENT, ORDER, OTHER |

### 5.3 Schema Impact Summary

| Impact Level | Assessment |
|--------------|------------|
| **Breaking Changes** | ❌ NONE |
| **Existing Table Modifications** | ❌ NONE |
| **New Tables** | 8 new tables (all `leg_` prefixed) |
| **New Enums** | 9 new enums (all `leg_` prefixed) |
| **Foreign Keys** | To `Tenant`, `Customer` (CRM), `User` (Staff) |
| **Overall Impact** | **MEDIUM** (additive only) |

### 5.4 Relationship Diagram

```
Tenant (existing)
  └── leg_matter
        ├── leg_time_entry
        ├── leg_deadline
        ├── leg_disbursement
        ├── leg_filing
        └── leg_matter_party
              └── Customer (CRM - existing)

  └── leg_retainer
        ├── Customer (client)
        └── leg_retainer_transaction
```

---

## 6️⃣ EXPLICIT EXCLUSIONS

The following are **OUT OF SCOPE** for the Legal Practice Suite:

| Exclusion | Reason |
|-----------|--------|
| ❌ Court e-filing integration | Requires judiciary system integration |
| ❌ National judiciary database | External government system |
| ❌ Legal research databases | Specialized service (LawPavilion, etc.) |
| ❌ AI legal advice | Regulatory and liability concerns |
| ❌ Case law search | Specialized legal research tools |
| ❌ Regulatory reporting | Jurisdiction-specific requirements |
| ❌ Client portal (Phase 1) | Future enhancement |
| ❌ Mobile app | Future enhancement |
| ❌ Real-time collaboration | Complex feature, future consideration |
| ❌ Multi-currency billing | Nigeria-first mandate (NGN only) |
| ❌ Legal templates marketplace | Out of core scope |
| ❌ Court scheduling integration | No judiciary API available |

---

## 7️⃣ NIGERIA-FIRST COMPLIANCE

| Requirement | Implementation |
|-------------|----------------|
| **Currency** | NGN (Nigerian Naira) only |
| **Court Structure** | Federal/State High Courts, Magistrate Courts, Tribunals |
| **Case Numbering** | Suit number format: FHC/L/CS/XXX/20XX |
| **Filing Fees** | Manual tracking (no e-filing integration) |
| **Practice Areas** | Nigerian legal categories (NBA practice areas) |
| **Staff Tiers** | Partner, Senior Associate, Associate, Paralegal, Intern |
| **Billing Practice** | Retainer + hourly + disbursements |

---

## 8️⃣ PARTNER-FIRST COMPLIANCE

| Requirement | Status |
|-------------|--------|
| **Tenant-Scoped** | ✅ All data scoped to tenantId |
| **Partner Can Activate** | ✅ Standard capability activation |
| **Multi-Instance** | ✅ Each law firm = separate tenant |
| **White-Label** | ✅ No WebWaka branding in client-facing |
| **Pricing Flexibility** | ✅ Partners set their own pricing |
| **Demo Data Support** | ✅ Nigerian law firm demo data |

---

## 9️⃣ REUSE STRATEGY

### High Reuse (Direct)
- **CRM Module**: Use existing `Customer` model for clients and parties
- **Billing Module**: Use existing invoice and payment infrastructure
- **Files Module**: Use existing document storage
- **Permissions**: Use existing RBAC
- **Audit Logs**: Use existing activity tracking

### Partial Reuse (With Extension)
- **Calendar**: Add legal deadline events
- **Notifications**: Configure for legal reminders
- **Tags**: Add practice area taxonomy

### New Development (Legal-Specific)
- **Matter Management**: Core legal case entity
- **Time Tracking**: Billable hours with approval
- **Retainer System**: Trust accounting basics
- **Deadline Management**: Court dates and limitations
- **Disbursements**: Expense tracking and passthrough

---

## 🔟 IMPLEMENTATION RECOMMENDATION

### Phase 7B-Legal MVP (P0 Gaps)
1. `leg_matter` + Matter CRUD
2. `leg_time_entry` + Time tracking
3. `leg_retainer` + Retainer management
4. `leg_deadline` + Court date tracking
5. Basic legal billing flow

### Phase 7B-Legal Full (P1 Gaps)
6. `leg_disbursement` tracking
7. `leg_filing` records
8. `leg_matter_party` relationships
9. Conflict check service
10. Evidence registry

### Future Enhancement (P2 Gaps)
11. Time approval workflow
12. Trust accounting
13. Matter linking
14. Client portal

---

## ✅ SUBMISSION CHECKLIST

| Item | Status |
|------|--------|
| Context definition (S0) | ✅ Complete |
| Capability mapping (S1) | ✅ 58 capabilities mapped |
| Reuse analysis | ✅ ~43% reuse identified |
| Gap register | ✅ 12 gaps documented |
| Schema impact assessment | ✅ 8 tables, 9 enums (MEDIUM) |
| Explicit exclusions | ✅ 12 exclusions listed |
| Nigeria-first compliance | ✅ Confirmed |
| Partner-first compliance | ✅ Confirmed |

---

## 🛑 AWAITING APPROVAL

This S0-S1 capability mapping is complete.

**DO NOT PROCEED TO S2 (Implementation) without explicit approval.**

### Approval Required For:
1. ✅ Capability scope (58 capabilities)
2. ✅ Gap register (12 gaps)
3. ✅ Schema additions (8 tables, 9 enums)
4. ✅ Exclusions list
5. ✅ Reuse strategy

---

*Document Version: 1.0 | Submitted: January 6, 2026*
