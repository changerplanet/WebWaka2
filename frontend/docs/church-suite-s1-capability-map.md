# Church Suite — S1 Capability Map

**Date**: January 8, 2026  
**Classification**: NEW v2 External Vertical  
**Risk Tier**: HIGH (faith, money, trust, minors, governance)  
**Primary Context**: Nigeria-First  
**Author**: Emergent Agent (E1)  
**Status**: S1 IN PROGRESS

---

## 1. S1 Objective

Translate S0 functional domains into:
1. **Capability Keys** — discrete, testable platform features
2. **Reuse Analysis** — identify capabilities shared with existing suites
3. **New Capabilities** — church-specific features requiring fresh implementation
4. **Commerce Boundary Interfaces** — explicit facts-only integration points

---

## 2. Capability Key Naming Convention

```
chu_{domain}_{capability}
```

Examples:
- `chu_registry_denomination` — Church registry denomination management
- `chu_member_registration` — Member registration capability
- `chu_giving_tithe_fact` — Tithe fact recording (FACTS ONLY)

---

## 3. Domain → Capability Mapping

### A. Church Registry & Structure

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_registry_denomination` | Denomination/church body registration | NEW | P0 |
| `chu_registry_hierarchy` | Multi-level structure (National → Diocese → Zone → District → Parish) | NEW | P0 |
| `chu_registry_branch` | Branch/parish creation & lifecycle | NEW | P0 |
| `chu_registry_leadership` | Leadership assignment (time-bound, role-based) | NEW | P0 |
| `chu_registry_audit` | Branch & leadership change logs (append-only) | REUSE (audit pattern) | P0 |

**Hierarchy Levels** (Nigeria-specific):
```
Denomination
  └── Diocese / Region
       └── Zone / Area
            └── District
                 └── Parish / Local Church
                      └── Cell / Fellowship
```

---

### B. Membership & Pastoral Care

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_member_registration` | Member registration (adult, youth, child) | NEW | P0 |
| `chu_member_guardian` | Guardian linkage for minors | NEW | P0 |
| `chu_member_lifecycle` | Status transitions (Visitor → New Convert → Member → Worker) | NEW | P0 |
| `chu_member_attendance` | Service/event attendance tracking | REUSE (event pattern) | P1 |
| `chu_member_cell_group` | Cell/fellowship assignment | NEW | P1 |
| `chu_member_pastoral_note` | Confidential pastoral notes (access-controlled) | NEW | P1 |
| `chu_member_transfer` | Inter-branch member transfer | NEW | P2 |

**Member Statuses**:
- `VISITOR` — First-time attendee
- `NEW_CONVERT` — Recently accepted faith
- `MEMBER` — Full member
- `WORKER` — Active volunteer/department member
- `INACTIVE` — Lapsed attendance
- `TRANSFERRED` — Moved to another branch
- `DECEASED` — Memorial record only

---

### C. Ministries, Departments & Workforce

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_dept_registry` | Department/ministry creation | NEW | P0 |
| `chu_dept_membership` | Member assignment to departments | NEW | P0 |
| `chu_dept_leadership` | Department head assignment | NEW | P1 |
| `chu_volunteer_schedule` | Volunteer shift/duty scheduling | REUSE (scheduling pattern) | P1 |
| `chu_volunteer_training` | Training & certification records | NEW | P2 |

**Common Nigerian Church Departments**:
- Choir / Music Ministry
- Ushering / Protocol
- Media / Technical
- Welfare / Benevolence
- Children's Ministry
- Youth Ministry
- Men's Ministry
- Women's Ministry
- Evangelism / Outreach
- Prayer Ministry
- Hospitality
- Security
- Sanitation

---

### D. Services, Events & Programs

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_service_template` | Service type templates (Sunday, Midweek, Special) | NEW | P0 |
| `chu_service_instance` | Individual service occurrence | NEW | P0 |
| `chu_service_attendance` | Headcount & attendance logging | NEW | P0 |
| `chu_event_create` | Event creation (conferences, crusades, weddings, funerals) | REUSE (event pattern) | P1 |
| `chu_event_registration` | Event participant registration | REUSE (event pattern) | P1 |
| `chu_program_calendar` | Church calendar management | REUSE (calendar pattern) | P1 |

**Service Types**:
- `SUNDAY_SERVICE` — Main weekly service
- `MIDWEEK_SERVICE` — Wednesday/Thursday services
- `SPECIAL_SERVICE` — Thanksgiving, Anniversary, etc.
- `PRAYER_MEETING` — Prayer gatherings
- `BIBLE_STUDY` — Teaching sessions
- `VIGIL` — Night services
- `CRUSADE` — Evangelistic outreach
- `CONFERENCE` — Multi-day events

---

### E. Giving, Donations & Financial FACTS ⚠️

**🔒 STRICT COMMERCE BOUNDARY — FACTS ONLY**

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_giving_tithe_fact` | Tithe declaration fact | NEW (follows Political pattern) | P0 |
| `chu_giving_offering_fact` | General offering fact | NEW (follows Political pattern) | P0 |
| `chu_giving_seed_fact` | Seed/special offering fact | NEW | P1 |
| `chu_giving_pledge_fact` | Pledge/commitment declaration | NEW (follows Political pattern) | P1 |
| `chu_giving_pledge_redemption` | Pledge redemption tracking | NEW | P2 |
| `chu_expense_fact` | Approved expense recording | REUSE (Political pattern) | P1 |
| `chu_giving_disclosure` | Financial summary generation | REUSE (Political pattern) | P2 |

**Giving Types** (Nigeria-specific):
- `TITHE` — 10% income offering
- `OFFERING` — General freewill offering
- `SEED` — Special faith offering
- `FIRST_FRUIT` — First income of year/month
- `THANKSGIVING` — Gratitude offering
- `PLEDGE` — Future commitment
- `BUILDING_FUND` — Construction/development
- `WELFARE` — Benevolence fund
- `MISSIONS` — Evangelism support
- `SPECIAL_PROJECT` — Designated giving

**Commerce Boundary Interface**:
```
Church Suite                    Commerce Suite
─────────────                   ──────────────
chu_giving_tithe_fact      →    payment_intent
chu_giving_offering_fact   →    payment_intent
chu_expense_fact           →    disbursement_request

🚫 NO reverse calls
🚫 NO payment status in Church Suite
🚫 NO receipts generated by Church Suite
🚫 NO balance tracking
```

---

### F. Assets & Facilities

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_asset_registry` | Church asset registration (buildings, vehicles, equipment) | REUSE (asset pattern) | P2 |
| `chu_asset_assignment` | Asset assignment to branches | NEW | P2 |
| `chu_facility_booking` | Facility reservation/booking | REUSE (booking pattern) | P2 |
| `chu_asset_maintenance` | Maintenance log tracking | REUSE (maintenance pattern) | P3 |

---

### G. Communication & Digital Presence

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_announcement_create` | Church announcements | REUSE (announcement pattern) | P1 |
| `chu_announcement_publish` | Multi-channel publishing | REUSE (publishing pattern) | P1 |
| `chu_sermon_metadata` | Sermon metadata (NOT content moderation) | NEW | P2 |
| `chu_contact_sms_fact` | SMS delivery fact (no gateway ownership) | REUSE (notification pattern) | P2 |
| `chu_contact_email_fact` | Email delivery fact | REUSE (notification pattern) | P2 |

---

### H. Governance & Compliance

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_gov_constitution` | Church constitution/bylaws storage | NEW | P1 |
| `chu_gov_resolution` | Board/trustee resolution recording | NEW (follows Political pattern) | P1 |
| `chu_gov_policy` | Policy document management | REUSE (document pattern) | P2 |
| `chu_gov_decision_log` | Decision audit trail (append-only) | REUSE (audit pattern) | P1 |
| `chu_gov_leadership_change` | Leadership transition records | NEW | P1 |

---

### I. Audit, Transparency & Accountability

| Capability Key | Description | New/Reuse | Priority |
|----------------|-------------|-----------|----------|
| `chu_audit_trail` | Immutable audit log | REUSE (Political pattern) | P0 |
| `chu_audit_financial_disclosure` | Financial fact disclosure | REUSE (Political pattern) | P1 |
| `chu_audit_export` | Evidence export for auditors | REUSE (Political pattern) | P2 |
| `chu_audit_integrity_check` | Hash-based integrity verification | REUSE (Political pattern) | P2 |

---

## 4. Capability Reuse Summary

### Reused from Political Suite (High Confidence)
| Capability | Political Suite Source | Church Suite Target |
|------------|----------------------|---------------------|
| `pol_donation_fact` | Donation fact pattern | `chu_giving_tithe_fact`, `chu_giving_offering_fact` |
| `pol_expense_fact` | Expense fact pattern | `chu_expense_fact` |
| `pol_disclosure` | Disclosure generation | `chu_giving_disclosure` |
| `pol_governance_audit` | Audit trail pattern | `chu_audit_trail` |
| `pol_petition` | Grievance pattern | `chu_grievance` (if needed) |

### Reused from Platform Core
| Capability | Core Source | Church Suite Target |
|------------|-------------|---------------------|
| Event management | Core events | `chu_event_create`, `chu_event_registration` |
| Scheduling | Core scheduling | `chu_volunteer_schedule` |
| Calendar | Core calendar | `chu_program_calendar` |
| Notifications | Core notifications | `chu_contact_sms_fact`, `chu_contact_email_fact` |
| Documents | Core documents | `chu_gov_policy`, `chu_gov_constitution` |
| Assets | Core assets | `chu_asset_registry` |

### NEW (Church-Specific)
| Capability | Reason |
|------------|--------|
| `chu_registry_*` | Church hierarchy is unique (denomination → parish) |
| `chu_member_*` | Membership lifecycle is faith-specific |
| `chu_dept_*` | Church department structure is unique |
| `chu_service_*` | Church service patterns are domain-specific |
| `chu_giving_*` | Faith-based giving types (tithe, seed, first-fruit) |
| `chu_gov_*` | Church governance structures are unique |

---

## 5. Priority Matrix

### P0 — Must Have (MVP)
- Church registry & hierarchy
- Member registration & lifecycle
- Department registry
- Service management & attendance
- Tithe & offering facts
- Audit trail

### P1 — Should Have (Phase 2)
- Pastoral notes
- Cell groups
- Volunteer scheduling
- Event management
- Expense facts
- Announcements
- Governance records

### P2 — Could Have (Phase 3)
- Pledges & redemption
- Financial disclosures
- Asset management
- Sermon metadata
- Member transfers
- Training records

### P3 — Future
- Facility booking
- Asset maintenance
- Advanced analytics

---

## 6. Commerce Boundary Interface Specification

### Facts Emitted by Church Suite

```typescript
// Tithe Fact
interface TitheFact {
  id: string;
  tenantId: string;
  churchId: string;
  memberId: string;        // Optional (anonymous giving allowed)
  amount: number;          // Declared amount (NOT processed)
  currency: string;        // NGN
  serviceId?: string;      // Associated service
  declaredAt: DateTime;
  // NO payment_status, NO receipt, NO balance
}

// Offering Fact
interface OfferingFact {
  id: string;
  tenantId: string;
  churchId: string;
  memberId?: string;
  offeringType: OfferingType;
  amount: number;
  currency: string;
  serviceId?: string;
  purpose?: string;
  declaredAt: DateTime;
}

// Expense Fact
interface ExpenseFact {
  id: string;
  tenantId: string;
  churchId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  approvedBy: string;
  approvedAt: DateTime;
  // NO disbursement_status
}
```

### Commerce Suite Receives (One-Way)

```
Church Suite → Commerce Suite
────────────────────────────
POST /api/commerce/church-facts/tithe
POST /api/commerce/church-facts/offering
POST /api/commerce/church-facts/expense

Commerce Suite handles:
- Payment collection
- Disbursement
- Receipt generation
- Accounting
- VAT (if applicable)
```

---

## 7. S1 Exit Criteria

| Requirement | Status |
|-------------|--------|
| All S0 domains mapped to capabilities | ✅ |
| Capability keys defined | ✅ |
| Reuse analysis complete | ✅ |
| New capabilities identified | ✅ |
| Priority matrix defined | ✅ |
| Commerce boundary interfaces specified | ✅ |

---

## 🛑 S1 COMPLETE — STOP POINT

**No schema, services, or APIs will be created without explicit S2 authorization.**

---

**Document Version**: 1.0  
**Classification**: GOVERNANCE DOCUMENT  
**Next Step**: Awaiting "Proceed with Church Suite S2 Schema Design" authorization
