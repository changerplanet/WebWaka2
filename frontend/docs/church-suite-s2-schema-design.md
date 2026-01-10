# Church Suite — S2 Schema Design

**Date**: January 8, 2026  
**Classification**: NEW v2 External Vertical  
**Risk Tier**: HIGH (faith, money, minors, trust)  
**Primary Context**: Nigeria-First  
**Author**: Emergent Agent (E1)  
**Status**: S2 COMPLETE — AWAITING S3 AUTHORIZATION

---

## Scope

- **Included**: Schema + Domain Services (design only)
- **Explicitly Excluded**: APIs, UI, Demo wiring, payments
- **Design Principle**: Audit-first, append-only where required, Nigeria-first

---

## 🧱 Core Design Rules (Locked)

1. **Jurisdiction-aware**
   - Church → Diocese/Zone → Parish → Cell/Unit

2. **Append-only where trust is involved**
   - Giving, expenses, audits, disclosures

3. **Minors safety**
   - Explicit age flags, restricted access, no free text exposure

4. **Pastoral confidentiality**
   - Notes are sealed, access-controlled, non-searchable

5. **Commerce boundary**
   - Facts only → Commerce executes

---

## 📊 Schema Overview

- **Total Tables**: 41
- **Append-Only Tables**: 17
- **Reused Patterns**: Political Suite + Platform Core

---

## A. Church Registry & Structure (5 tables)

| Table | Purpose | Notes |
|-------|---------|-------|
| `chu_church` | Root entity | Denomination-neutral |
| `chu_church_unit` | Parish/Branch | Jurisdiction-scoped |
| `chu_hierarchy_link` | Parent-child links | Append-only |
| `chu_role` | Church roles | Pastor, Elder, Deacon |
| `chu_role_assignment` | Role history | Append-only |

### Hierarchy Levels (Nigeria-specific)
```
Denomination (chu_church)
  └── Diocese / Region (chu_church_unit, level=1)
       └── Zone / Area (chu_church_unit, level=2)
            └── District (chu_church_unit, level=3)
                 └── Parish / Local Church (chu_church_unit, level=4)
                      └── Cell / Fellowship (chu_cell_group)
```

---

## B. Membership & Pastoral Care (7 tables)

| Table | Purpose | Controls |
|-------|---------|----------|
| `chu_member` | Member record | Age flag (minor/adult) |
| `chu_member_status` | Status history | Append-only |
| `chu_family_unit` | Household | Nigeria-first |
| `chu_cell_group` | Fellowship cells | Reused pattern |
| `chu_cell_membership` | Cell history | Append-only |
| `chu_pastoral_note` | Confidential notes | 🔒 Encrypted |
| `chu_pastoral_access_log` | Access tracking | Append-only |

### ⚠️ Pastoral Notes Security
- ❌ No UPDATE
- ❌ No DELETE
- ❌ No full-text search
- ✅ Explicit access logging

### Member Statuses
```
VISITOR → NEW_CONVERT → MEMBER → WORKER
                              ↓
                         INACTIVE
                              ↓
                    TRANSFERRED | DECEASED
```

---

## C. Ministries & Departments (5 tables)

| Table | Purpose |
|-------|---------|
| `chu_ministry` | Choir, Youth, Men, Women |
| `chu_department` | Admin, Finance, Welfare |
| `chu_assignment` | Member → Ministry |
| `chu_training_record` | Training history |
| `chu_volunteer_log` | Service activity (append-only) |

### Common Nigerian Church Departments
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

---

## D. Services & Events (6 tables)

| Table | Purpose |
|-------|---------|
| `chu_service` | Worship services |
| `chu_event` | Programs, crusades |
| `chu_event_schedule` | Dates/times |
| `chu_attendance_fact` | Attendance counts |
| `chu_speaker_invite` | Guest ministers |
| `chu_event_log` | Event lifecycle |

### Service Types
- `SUNDAY_SERVICE` — Main weekly service
- `MIDWEEK_SERVICE` — Wednesday/Thursday services
- `SPECIAL_SERVICE` — Thanksgiving, Anniversary
- `PRAYER_MEETING` — Prayer gatherings
- `BIBLE_STUDY` — Teaching sessions
- `VIGIL` — Night services
- `CRUSADE` — Evangelistic outreach
- `CONFERENCE` — Multi-day events

---

## E. Giving & Financial Facts ⚠️ (7 tables — HIGH RISK)

| Table | Type | Rule |
|-------|------|------|
| `chu_giving_tithe_fact` | FACT | Append-only |
| `chu_giving_offering_fact` | FACT | Append-only |
| `chu_giving_special_fact` | FACT | Append-only |
| `chu_pledge` | Intent | Mutable until fulfilled |
| `chu_expense_fact` | FACT | Append-only |
| `chu_disclosure` | Report | Generated |
| `chu_finance_audit_log` | Audit | Append-only |

### Giving Types (Nigeria-specific)
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

### Commerce Boundary (Hard Lock)

```
Church Suite
  └─ *_fact tables
        ↓
     Commerce Suite
        ↓
  Payments / Accounting / VAT

🚫 No balances
🚫 No receipts
🚫 No payment status
🚫 No wallets
```

---

## F. Assets & Facilities (4 tables)

| Table | Purpose |
|-------|---------|
| `chu_asset` | Buildings, equipment |
| `chu_asset_assignment` | Usage history |
| `chu_facility_booking` | Halls, rooms |
| `chu_maintenance_log` | Maintenance history |

---

## G. Communication (5 tables)

| Table | Purpose |
|-------|---------|
| `chu_announcement` | Notices |
| `chu_message` | SMS/email/push |
| `chu_message_recipient` | Delivery log |
| `chu_document` | Bulletins, reports |
| `chu_publish_log` | Publish audit |

---

## H. Governance & Compliance (5 tables)

| Table | Purpose |
|-------|---------|
| `chu_board_resolution` | Decisions |
| `chu_meeting` | Council meetings |
| `chu_meeting_minutes` | Records |
| `chu_policy` | Governance docs |
| `chu_compliance_event` | Incidents |

---

## I. Audit & Transparency (4 tables)

| Table | Rule |
|-------|------|
| `chu_audit_log` | Append-only |
| `chu_evidence_bundle` | Immutable |
| `chu_public_report` | Read-only |
| `chu_regulator_access` | Scoped access |

---

## 🧠 Domain Services (Defined, NOT IMPLEMENTED)

**18 Services declared:**

### Registry Services
1. `ChurchRegistryService` — Church/denomination management
2. `ChurchUnitService` — Branch/parish management
3. `HierarchyService` — Structure management
4. `RoleAssignmentService` — Leadership assignments

### Membership Services
5. `MemberLifecycleService` — Member registration & status
6. `FamilyUnitService` — Household management
7. `CellGroupService` — Fellowship group management
8. `PastoralCareService` — Confidential notes (encrypted)

### Ministry Services
9. `MinistryService` — Ministry/department management
10. `AssignmentService` — Member assignments
11. `VolunteerService` — Volunteer scheduling

### Service & Event Services
12. `ChurchServiceService` — Worship service management
13. `EventService` — Event management
14. `AttendanceService` — Attendance tracking

### Financial Fact Services
15. `GivingFactService` — Tithe/offering facts (APPEND-ONLY)
16. `ExpenseFactService` — Expense recording (APPEND-ONLY)
17. `DisclosureService` — Financial disclosure generation

### Audit Services
18. `AuditService` — Immutable audit trail

**🚫 No APIs | 🚫 No UI | 🚫 No demo wiring**

---

## 🔒 S2 Compliance Checklist

| Requirement | Status |
|-------------|--------|
| Schema only | ✅ |
| Append-only enforced | ✅ |
| Minors safety | ✅ |
| Pastoral confidentiality | ✅ |
| Commerce boundary | ✅ |
| Nigeria-first | ✅ |
| No APIs/UI | ✅ |

---

## 🛑 S2 COMPLETE — STOP POINT

**No implementation will proceed without explicit S3 authorization.**

---

**Document Version**: 1.0  
**Classification**: GOVERNANCE DOCUMENT  
**Next Step**: Awaiting "Proceed with Church Suite S3 Domain Services" authorization
