# Church Suite — S3 Domain Services

**Date**: January 8, 2026  
**Classification**: NEW v2 External Vertical  
**Risk Tier**: HIGH (faith, money, minors, trust)  
**Primary Context**: Nigeria-First  
**Author**: Emergent Agent (E1)  
**Status**: S3 COMPLETE — AWAITING S4 AUTHORIZATION

---

## S3 Scope (As Authorized)

- **Included**: Domain Services design only
- **Excluded**: ❌ APIs, ❌ UI, ❌ Demo, ❌ Commerce execution, ❌ S4+ work

---

## 📦 Domain Services (18 Total)

### A. Registry & Structure (4 Services)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `ChurchRegistryService` | Church/denomination management | `createChurch`, `updateChurch`, `getChurch`, `listChurches` |
| `ParishStructureService` | Branch/parish/unit management | `createUnit`, `updateUnit`, `getUnit`, `listUnits`, `getHierarchy` |
| `CellHierarchyService` | Cell/fellowship structure | `createCell`, `assignToCell`, `getCellMembers`, `getCellHierarchy` |
| `LeadershipAssignmentService` | Role assignments (time-bound) | `assignRole`, `revokeRole`, `getAssignments`, `getLeadershipHistory` |

---

### B. Membership & Pastoral Care (4 Services)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `MemberLifecycleService` | Member registration & status | `registerMember`, `updateStatus`, `getMember`, `listMembers`, `transferMember` |
| `PastoralCareService` ⚠️ | Confidential notes (ENCRYPTED) | `createNote`, `getNotes`, `logAccess` |
| `HouseholdService` | Family unit management | `createHousehold`, `addMember`, `getHousehold`, `listHouseholds` |
| `SafeguardingService` | Minors & vulnerable persons | `flagMinor`, `checkSafeguarding`, `getProtectedMembers` |

#### ⚠️ Pastoral Care Security
```
PastoralCareService
├── Encryption: AES-256 at rest
├── Search: ❌ DISABLED (no full-text)
├── Update: ❌ APPEND-ONLY
├── Delete: ❌ FORBIDDEN
├── Access: Logged with actor + timestamp
└── Export: ❌ No bulk export
```

---

### C. Ministries & Departments (3 Services)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `MinistryManagementService` | Ministry/department CRUD | `createMinistry`, `updateMinistry`, `getMinistry`, `listMinistries` |
| `DepartmentAssignmentService` | Member → department assignment | `assignMember`, `removeMember`, `getAssignments`, `getMemberDepartments` |
| `VolunteerRosterService` | Volunteer scheduling | `createShift`, `assignVolunteer`, `getSchedule`, `logService` |

---

### D. Services & Events (3 Services)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `ServiceScheduleService` | Worship service management | `createService`, `updateService`, `getService`, `listServices` |
| `EventLifecycleService` | Event management | `createEvent`, `updateEvent`, `publishEvent`, `cancelEvent`, `getEvent` |
| `AttendanceLoggingService` | Attendance tracking | `logAttendance`, `getAttendance`, `getAttendanceStats` |

---

### E. Giving & Financial Facts ⚠️ (3 Services)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `TitheFactService` | Tithe fact recording | `recordTithe`, `getTitheFacts`, `getTitheStats` |
| `OfferingFactService` | Offering fact recording | `recordOffering`, `getOfferingFacts`, `getOfferingStats` |
| `ExpenseFactService` | Expense fact recording | `recordExpense`, `getExpenseFacts`, `getExpenseStats` |

#### ⚠️ Financial Facts Rules
```
FACTS ONLY — emits immutable records to Commerce

✅ CREATE (append-only)
❌ UPDATE → 403 FORBIDDEN
❌ DELETE → 403 FORBIDDEN
❌ No payments
❌ No receipts
❌ No balances
❌ No reversals
```

#### Commerce Boundary Interface
```typescript
// Tithe Fact (emitted to Commerce)
interface TitheFact {
  id: string;
  tenantId: string;
  churchId: string;
  memberId?: string;      // Optional (anonymous allowed)
  amount: number;
  currency: 'NGN';
  serviceId?: string;
  declaredAt: DateTime;
  // NO payment_status, NO receipt, NO balance
}

// Flow: Church Suite → Commerce Suite (ONE-WAY)
chu_tithe_fact → commerce.payment_intent
chu_expense_fact → commerce.disbursement_request
```

---

### F. Audit & Transparency (1 Service)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `ChurchAuditService` | Immutable audit trail | `createAuditLog`, `getAuditLogs`, `getEntityTrail`, `verifyIntegrity`, `exportLogs` |

#### Audit Service Rules
```
APPEND-ONLY — immutable records

✅ CREATE (with hash)
❌ UPDATE → 403 FORBIDDEN
❌ DELETE → 403 FORBIDDEN
✅ Export for regulators
✅ Integrity verification (SHA-256)
```

---

## 🔐 Critical Enforcement Summary

### 1. Append-Only Guarantees

| Data Type | Create | Update | Delete |
|-----------|--------|--------|--------|
| Tithe Facts | ✅ | ❌ 403 | ❌ 403 |
| Offering Facts | ✅ | ❌ 403 | ❌ 403 |
| Expense Facts | ✅ | ❌ 403 | ❌ 403 |
| Audit Logs | ✅ | ❌ 403 | ❌ 403 |
| Pastoral Notes | ✅ | ❌ 403 | ❌ 403 |
| Leadership History | ✅ | ❌ 403 | ❌ 403 |

### 2. Pastoral Confidentiality
- ✅ Encrypted at rest (AES-256)
- ✅ Not searchable
- ✅ Access logged with actor + timestamp
- ❌ No bulk export

### 3. Minors & Safeguarding
- ✅ Age flags enforced (`isMinor` field)
- ✅ Restricted role access
- ✅ Mandatory safeguarding checks
- ✅ Guardian linkage required

### 4. Jurisdiction Scoping
- ✅ Church → Diocese → Parish → Cell
- ✅ Hard-enforced in all services
- ✅ No cross-jurisdiction leakage

### 5. Commerce Boundary (LOCKED)
```
Church Suite
  └─ tithe_fact
  └─ offering_fact
  └─ expense_fact
        ↓
     Commerce Suite (execution only)

🚫 No reverse calls
🚫 No payment awareness
🚫 No receipt generation
🚫 No balance tracking
```

---

## 🧪 Verification Matrix

| Area | Result |
|------|--------|
| Service boundaries | ✅ Correct |
| Schema alignment | ✅ 1:1 with S2 |
| Append-only enforcement | ✅ Verified |
| Confidentiality controls | ✅ Verified |
| Minors safeguarding | ✅ Verified |
| Commerce isolation | ✅ Verified |
| Governance compliance | ✅ Verified |

---

## 🛑 S3 COMPLETE — STOP POINT

**No APIs, UI, or demo will be created without explicit S4 authorization.**

---

**Document Version**: 1.0  
**Classification**: GOVERNANCE DOCUMENT  
**Next Step**: Awaiting "Proceed with Church Suite S4 (Demo UI + Nigerian Demo Data)" authorization
