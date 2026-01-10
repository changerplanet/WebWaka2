# Project Management Suite — Capability Map

**Phase**: 7C.2  
**Suite**: Project Management  
**Submission Date**: January 6, 2026  
**Status**: ✅ S0-S4 COMPLETE | 🟡 AWAITING S5 APPROVAL

---

## S0: Context Confirmation

### What This Suite IS

A **practical, lightweight project system** for Nigerian SMEs that need to:
- Track projects from inception to completion
- Manage milestones, tasks, and deadlines
- Assign staff and external contributors
- Monitor basic budgets (without complex cost accounting)
- Maintain activity history and accountability

### What This Suite is NOT

| Excluded | Rationale |
|----------|-----------|
| ❌ Jira-level complexity | Overwhelming for SME target users |
| ❌ Agile boards (Scrum/Kanban) | Enterprise methodology complexity |
| ❌ Time tracking payroll engine | Existing Payroll module handles this |
| ❌ Advanced cost accounting | Existing Accounting module handles this |
| ❌ Enterprise PMO compliance | Out of scope for SME focus |
| ❌ Resource capacity planning | Advanced ERP feature |
| ❌ Gantt charts | Phase 8+ consideration |
| ❌ Critical path analysis | Enterprise complexity |
| ❌ Multi-currency projects | NGN-first approach |
| ❌ External project portals | Phase 8+ consideration |

### Target Customers (Nigeria-First)

| Customer Type | Project Pattern | Key Needs |
|---------------|-----------------|-----------|
| **SMEs** (Retail, Services) | Internal improvement projects | Simple task tracking, accountability |
| **Construction Firms** | Site projects, renovations | Milestones, material budgets |
| **Agencies** (Marketing, Tech) | Client projects, campaigns | Client association, deliverables |
| **NGOs & Nonprofits** | Donor-funded programs | Budget tracking, reporting |
| **Consulting Firms** | Engagements, audits | Resource assignment, phases |
| **Schools** | Events, infrastructure | Timeline tracking, approvals |

### Project Context (Nigeria)

| Aspect | Nigerian Reality |
|--------|------------------|
| **Formality** | Mix of formal and informal; many "projects" are verbal agreements |
| **Budget** | NGN-based; frequent cash flow constraints |
| **Deadlines** | Flexible; "Nigerian time" culture requires soft reminders |
| **Approval** | Manual, hierarchical; WhatsApp confirmations common |
| **Documentation** | Often scattered; need centralized project folder |
| **Reporting** | Donor compliance (NGOs); client updates (agencies) |

---

## S1: Capability Mapping

### Domain 1: Project Setup & Governance

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 1.1 | Create project with name, description, dates | P0 | — | NEW |
| 1.2 | Associate project with CRM client | P0 | CRM | EXTEND |
| 1.3 | Assign project owner (staff) | P0 | HR | EXTEND |
| 1.4 | Assign project manager (optional) | P1 | HR | EXTEND |
| 1.5 | Set project status (Draft → Active → On Hold → Completed → Cancelled) | P0 | — | NEW |
| 1.6 | Set project priority (Low / Medium / High / Critical) | P0 | — | NEW |
| 1.7 | Set project category/type | P1 | — | NEW |
| 1.8 | Set project visibility (Private / Team / Organization) | P1 | — | NEW |
| 1.9 | Archive completed projects | P1 | — | NEW |
| 1.10 | Clone project as template | P2 | — | NEW |

### Domain 2: Milestones & Phases

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 2.1 | Create milestone with name, target date | P0 | — | NEW |
| 2.2 | Order milestones sequentially | P0 | — | NEW |
| 2.3 | Mark milestone complete | P0 | — | NEW |
| 2.4 | Set milestone dependencies (simple: must complete X before Y) | P1 | — | NEW |
| 2.5 | Group tasks under milestones | P0 | — | NEW |
| 2.6 | Track milestone progress (% of tasks complete) | P0 | — | NEW |
| 2.7 | Set milestone deliverables (description only) | P1 | — | NEW |
| 2.8 | Milestone overdue alerts (logic only, no notifications) | P1 | — | NEW |

### Domain 3: Task Management

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 3.1 | Create task with title, description | P0 | — | NEW |
| 3.2 | Assign task to milestone (or project directly) | P0 | — | NEW |
| 3.3 | Assign task to staff member | P0 | HR | EXTEND |
| 3.4 | Set task priority (Low / Medium / High / Urgent) | P0 | — | NEW |
| 3.5 | Set task status (To Do → In Progress → Review → Done) | P0 | — | NEW |
| 3.6 | Set task due date | P0 | — | NEW |
| 3.7 | Set estimated hours (optional) | P1 | — | NEW |
| 3.8 | Log actual hours (manual entry) | P1 | — | NEW |
| 3.9 | Add task checklist (subtasks) | P1 | — | NEW |
| 3.10 | Set task dependencies (simple: blocked by) | P2 | — | NEW |
| 3.11 | Bulk task status update | P2 | — | NEW |
| 3.12 | Task templates | P2 | — | NEW |

### Domain 4: Resource Assignment

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 4.1 | Assign project team members (staff) | P0 | HR | EXTEND |
| 4.2 | Set team member role (Lead / Member / Observer) | P1 | — | NEW |
| 4.3 | Assign external contributor (CRM contact) | P1 | CRM | EXTEND |
| 4.4 | View staff workload (tasks assigned across projects) | P2 | HR | EXTEND |
| 4.5 | Remove team member from project | P0 | — | NEW |

### Domain 5: Progress Tracking

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 5.1 | Calculate project % complete (based on tasks) | P0 | — | NEW |
| 5.2 | Display milestone progress summary | P0 | — | NEW |
| 5.3 | Project health indicator (On Track / At Risk / Delayed) | P0 | — | NEW |
| 5.4 | Dashboard: projects by status | P0 | — | NEW |
| 5.5 | Dashboard: overdue tasks count | P0 | — | NEW |
| 5.6 | Dashboard: upcoming deadlines | P1 | — | NEW |
| 5.7 | Generate project status report (basic) | P2 | — | NEW |

### Domain 6: Documents & Files

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 6.1 | Create project folder (auto) | P0 | Files | EXTEND |
| 6.2 | Upload files to project | P0 | Files | EXTEND |
| 6.3 | Attach files to tasks | P1 | Files | EXTEND |
| 6.4 | Attach files to milestones | P1 | Files | EXTEND |
| 6.5 | Download project files | P0 | Files | EXTEND |
| 6.6 | Delete project files | P1 | Files | EXTEND |

### Domain 7: Budget Tracking (Light)

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 7.1 | Set project estimated budget (NGN) | P1 | — | NEW |
| 7.2 | Record budget line items (category, amount) | P1 | — | NEW |
| 7.3 | Link expenses to project (from Accounting) | P1 | Accounting | EXTEND |
| 7.4 | Calculate budget variance (estimated vs actual) | P1 | — | NEW |
| 7.5 | Budget alerts (over budget flag) | P2 | — | NEW |
| 7.6 | Budget breakdown by milestone | P2 | — | NEW |

### Domain 8: Activity & Audit Trail

| # | Capability | Priority | Reuse? | New/Extend |
|---|------------|----------|--------|------------|
| 8.1 | Log all project changes (created, updated, status change) | P0 | Activity Log | EXTEND |
| 8.2 | Log task status changes | P0 | Activity Log | EXTEND |
| 8.3 | Add comments to project | P0 | Notes | EXTEND |
| 8.4 | Add comments to tasks | P0 | Notes | EXTEND |
| 8.5 | View project activity timeline | P0 | Activity Log | EXTEND |
| 8.6 | Filter activity by type | P1 | Activity Log | EXTEND |
| 8.7 | @mention team members in comments | P2 | Notes | EXTEND |

---

## Capability Summary

### Totals by Domain

| Domain | P0 | P1 | P2 | Total |
|--------|----|----|----| ------|
| 1. Project Setup & Governance | 6 | 3 | 1 | 10 |
| 2. Milestones & Phases | 6 | 2 | 0 | 8 |
| 3. Task Management | 7 | 2 | 3 | 12 |
| 4. Resource Assignment | 2 | 2 | 1 | 5 |
| 5. Progress Tracking | 5 | 1 | 1 | 7 |
| 6. Documents & Files | 3 | 3 | 0 | 6 |
| 7. Budget Tracking | 0 | 4 | 2 | 6 |
| 8. Activity & Audit Trail | 5 | 1 | 1 | 7 |
| **TOTAL** | **34** | **18** | **9** | **61** |

### Reuse Analysis

| Category | Count | % of Total |
|----------|-------|------------|
| **NEW** (new tables/logic) | 40 | 66% |
| **EXTEND** (reuse existing modules) | 21 | 34% |

### Modules Reused

| Module | Capabilities Reused |
|--------|---------------------|
| HR | Staff assignment (4.1, 4.2, 4.4, 3.3, 1.3, 1.4) |
| CRM | Client association (1.2, 4.3) |
| Files | Project documents (6.1–6.6) |
| Accounting | Budget expenses (7.3) |
| Activity Log | Audit trail (8.1, 8.2, 8.5, 8.6) |
| Notes | Comments (8.3, 8.4, 8.7) |

---

## Gap Register

### P0 — MVP (Must Have for Demo)

| Gap ID | Capability | Domain | Notes |
|--------|------------|--------|-------|
| G-PM-001 | Project CRUD | Setup | Core entity |
| G-PM-002 | Milestone CRUD | Milestones | Track major deliverables |
| G-PM-003 | Task CRUD | Tasks | Day-to-day work items |
| G-PM-004 | Task assignment | Tasks | Accountability |
| G-PM-005 | Status transitions | All | Workflow tracking |
| G-PM-006 | Progress calculation | Progress | Project health |
| G-PM-007 | Dashboard stats | Progress | Overview metrics |
| G-PM-008 | Activity logging | Activity | Audit trail |

### P1 — Full Feature Set

| Gap ID | Capability | Domain | Notes |
|--------|------------|--------|-------|
| G-PM-009 | Milestone dependencies | Milestones | Simple blocking |
| G-PM-010 | Budget tracking | Budget | NGN estimated/actual |
| G-PM-011 | Time logging | Tasks | Manual hours entry |
| G-PM-012 | Task checklists | Tasks | Subtask breakdown |
| G-PM-013 | External contributors | Resources | CRM contacts |
| G-PM-014 | File attachments | Documents | Task-level files |

### P2 — Enhancements

| Gap ID | Capability | Domain | Notes |
|--------|------------|--------|-------|
| G-PM-015 | Project templates | Setup | Clone for reuse |
| G-PM-016 | Task dependencies | Tasks | Blocking relationships |
| G-PM-017 | @mentions | Activity | Team notifications |
| G-PM-018 | Status reports | Progress | Export/print |
| G-PM-019 | Budget breakdown | Budget | By milestone |
| G-PM-020 | Workload view | Resources | Staff task counts |

---

## Schema Impact Summary

### New Tables Required

| Table | Purpose | Estimated Columns |
|-------|---------|-------------------|
| `project_project` | Core project entity | 15-18 |
| `project_milestone` | Project milestones | 10-12 |
| `project_task` | Tasks/work items | 15-18 |
| `project_team_member` | Project team assignments | 6-8 |
| `project_budget_item` | Budget line items | 8-10 |

### New Enums Required

| Enum | Values |
|------|--------|
| `project_status` | DRAFT, ACTIVE, ON_HOLD, COMPLETED, CANCELLED |
| `project_priority` | LOW, MEDIUM, HIGH, CRITICAL |
| `project_health` | ON_TRACK, AT_RISK, DELAYED |
| `project_task_status` | TODO, IN_PROGRESS, REVIEW, DONE |
| `project_task_priority` | LOW, MEDIUM, HIGH, URGENT |
| `project_member_role` | OWNER, MANAGER, LEAD, MEMBER, OBSERVER |

### Schema Summary

| Metric | Count |
|--------|-------|
| New Tables | 5 |
| New Enums | 6 |
| Foreign Keys to Existing Tables | ~8 (HR, CRM, Files, Accounting) |
| Risk Level | **Low** (additive, no breaking changes) |

---

## Explicit Exclusions

| Feature | Reason | Alternative |
|---------|--------|-------------|
| Gantt charts | UI complexity | Simple milestone timeline |
| Critical path analysis | Algorithm complexity | Manual dependencies |
| Resource capacity planning | ERP-level feature | Simple workload view |
| Timesheets/payroll | Existing Payroll module | Manual time logging |
| Cost accounting | Existing Accounting module | Simple budget variance |
| Multi-currency | NGN-first policy | NGN only |
| External portals | Phase 8+ | Internal admin only |
| Agile boards | Methodology complexity | Simple status columns |
| Sprint planning | Enterprise feature | Basic milestones |
| Automated notifications | Not in scope for S2-S6 | Activity log only |
| Calendar sync | Integration complexity | Due dates display only |
| Third-party integrations | Phase 8+ | Manual workflows |

---

## Nigeria-First Design Elements

| Element | Implementation |
|---------|----------------|
| **Currency** | NGN (₦) for all budget fields |
| **Dates** | Nigerian date formats, flexible deadlines |
| **Approvals** | Manual status changes (no automated workflows) |
| **Names** | Nigerian sample data (Chidi, Amaka, Tunde, etc.) |
| **Project Types** | Construction, NGO Program, Client Project, Internal |
| **Budget Ranges** | ₦100K - ₦100M typical SME projects |
| **Documents** | Nigerian business context (proposals, LPOs, invoices) |

---

## API Surface Area (Planned)

### Route Groups

| Route Group | Purpose |
|-------------|---------|
| `/api/project-management/dashboard` | Aggregated stats |
| `/api/project-management/projects` | Project CRUD + actions |
| `/api/project-management/projects/{id}/milestones` | Milestone management |
| `/api/project-management/projects/{id}/tasks` | Task management |
| `/api/project-management/projects/{id}/team` | Team members |
| `/api/project-management/projects/{id}/budget` | Budget items |
| `/api/project-management/tasks` | Cross-project task queries |

### Actions (POST to resource)

| Resource | Actions |
|----------|---------|
| Projects | `start`, `hold`, `complete`, `cancel`, `archive` |
| Milestones | `complete`, `reopen` |
| Tasks | `assign`, `start`, `complete`, `reopen` |

---

## Admin UI Pages (Planned for S5)

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/project-management-suite` | Overview, stats, quick actions |
| Projects | `/project-management-suite/projects` | Project list, filters |
| Project Detail | `/project-management-suite/projects/{id}` | Milestones, tasks, team, budget |
| Tasks | `/project-management-suite/tasks` | Cross-project task view |
| My Work | `/project-management-suite/my-work` | Current user's assigned tasks |

---

## S0-S1 Verification Checklist

| Requirement | Status |
|-------------|--------|
| Context confirmation (S0) | ✅ |
| Capability mapping (61 capabilities) | ✅ |
| Domain breakdown (8 domains) | ✅ |
| Priority classification (P0/P1/P2) | ✅ |
| Reuse analysis (34% reuse) | ✅ |
| Gap register | ✅ |
| Schema impact summary | ✅ |
| Explicit exclusions | ✅ |
| Nigeria-first design elements | ✅ |

---

## ✅ S2 COMPLETE — Schema Implementation

**S2 Migration Applied Successfully**

### Tables Created

| Table | Columns | Purpose |
|-------|---------|---------|
| `project_project` | 25 | Core project entity |
| `project_milestone` | 15 | Project milestones |
| `project_task` | 22 | Tasks/work items |
| `project_team_member` | 13 | Team assignments |
| `project_budget_item` | 15 | Budget line items |

### Enums Created

| Enum | Values |
|------|--------|
| `project_Status` | DRAFT, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED |
| `project_Priority` | LOW, MEDIUM, HIGH, CRITICAL |
| `project_Health` | ON_TRACK, AT_RISK, DELAYED |
| `project_TaskStatus` | TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED |
| `project_TaskPriority` | LOW, MEDIUM, HIGH, URGENT |
| `project_MemberRole` | OWNER, MANAGER, LEAD, MEMBER, OBSERVER |

### Schema Features

| Feature | Implementation |
|---------|----------------|
| Tenant Scoping | `tenantId` + `platformInstanceId` on all tables |
| Project Code | Auto-format: PRJ-2026-0001 |
| Budget Currency | Default NGN, Decimal(14,2) for up to ₦100B |
| Dependencies | Simple blocking (milestone → milestone, task → task) |
| Checklist | JSON column for subtasks |
| Reuse Links | `clientId` (CRM), `ownerId`/`assigneeId` (HR), `expenseId` (Accounting) |

### Indexes Created

All tables have proper indexes on:
- `tenantId`, `platformInstanceId`
- `projectId` (for child tables)
- Status, priority, date fields
- Foreign key references

### S2 Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| All tables prefixed `project_` | ✅ |
| All enums prefixed `project_` | ✅ |
| Tenant + PlatformInstance scoping | ✅ |
| Additive migration (no breaking changes) | ✅ |
| No duplicate entities | ✅ |

---

## ✅ S3 COMPLETE — Core Services

**S3 Core Services Implemented**

### Services Created

| Service | File | Functions |
|---------|------|-----------|
| Project Service | `project-service.ts` | create, get, list, update, delete, status transitions, progress calc |
| Milestone Service | `milestone-service.ts` | create, get, list, complete, reopen, reorder, progress calc |
| Task Service | `task-service.ts` | create, get, list, assign, complete, block, bulk update |
| Team Service | `team-service.ts` | add/remove members, roles, ownership transfer, workload |
| Budget Service | `budget-service.ts` | line items, approval, actual tracking, summary |

### Service Functions Summary

| Service | Function Count |
|---------|----------------|
| Project Service | 15 functions |
| Milestone Service | 11 functions |
| Task Service | 18 functions |
| Team Service | 14 functions |
| Budget Service | 14 functions |
| **Total** | **72 functions** |

### Key Features Implemented

| Feature | Service | Status |
|---------|---------|--------|
| Project status transitions (DRAFT→ACTIVE→COMPLETED) | Project | ✅ |
| Project health calculation (ON_TRACK/AT_RISK/DELAYED) | Project | ✅ |
| Milestone dependencies | Milestone | ✅ |
| Task blocking/dependencies | Task | ✅ |
| Task checklist (subtasks) | Task | ✅ |
| Team role management (OWNER/MANAGER/LEAD/MEMBER) | Team | ✅ |
| Ownership transfer | Team | ✅ |
| Budget variance calculation | Budget | ✅ |
| Budget approval workflow | Budget | ✅ |

### S3 Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| No UI work | ✅ |
| No calendar sync | ✅ |
| No Gantt / Agile boards | ✅ |
| No payroll/time tracking | ✅ |
| No notifications | ✅ |
| Domain logic only | ✅ |
| Tenant-scoped only | ✅ |
| Nigeria-first defaults (NGN) | ✅ |

### Service Location

```
/app/frontend/src/lib/project-management/
├── index.ts              # Re-exports all services
├── project-service.ts    # 15 functions
├── milestone-service.ts  # 11 functions
├── task-service.ts       # 18 functions
├── team-service.ts       # 14 functions
└── budget-service.ts     # 14 functions
```

---

## ✅ S4 COMPLETE — API Routes

**S4 API Routes Implemented**

### API Route Files

| Route Group | File | Methods |
|-------------|------|---------|
| Dashboard | `/api/project-management/dashboard/route.ts` | GET |
| Projects | `/api/project-management/projects/route.ts` | GET, POST |
| Project Detail | `/api/project-management/projects/[id]/route.ts` | GET, PATCH, POST, DELETE |
| Milestones | `/api/project-management/milestones/route.ts` | GET, POST |
| Milestone Detail | `/api/project-management/milestones/[id]/route.ts` | GET, PATCH, POST, DELETE |
| Tasks | `/api/project-management/tasks/route.ts` | GET, POST |
| Task Detail | `/api/project-management/tasks/[id]/route.ts` | GET, PATCH, POST, DELETE |
| Team | `/api/project-management/team/route.ts` | GET, POST |
| Team Member Detail | `/api/project-management/team/[id]/route.ts` | GET, PATCH, POST, DELETE |
| Budget | `/api/project-management/budget/route.ts` | GET, POST |
| Budget Item Detail | `/api/project-management/budget/[id]/route.ts` | GET, PATCH, POST, DELETE |

**Total: 11 route files**

### API Actions Implemented

| Resource | Actions (POST to /[id]) |
|----------|-------------------------|
| Projects | start, hold, resume, complete, cancel, archive, recalculate |
| Milestones | complete, reopen, recalculate |
| Tasks | start, review, complete, reopen, block, assign, unassign |
| Team | transferOwnership, setManager |
| Budget | approve, revokeApproval, recordSpend, linkExpense |

### Special Endpoints

| Endpoint | Purpose |
|----------|---------|
| GET /projects?stats=true | Project statistics only |
| GET /tasks?view=my | Current user's assigned tasks |
| GET /tasks?overdue=true | Overdue tasks filter |
| GET /team?view=workload | Team workload view |
| GET /budget?summary=true | Budget summary |
| GET /budget?status=true | Simple budget status |
| POST /tasks (action=bulkStatus) | Bulk task status update |
| POST /milestones (action=reorder) | Reorder milestones |

### S4 API Testing Results

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Dashboard without x-tenant-id | 401 | 401 | ✅ PASS |
| Dashboard with x-tenant-id | 200 + stats | 200 + stats | ✅ PASS |
| Create project | 201 + project | 201 + project | ✅ PASS |
| List projects | 200 + array | 200 + array | ✅ PASS |
| Create milestone | 201 + milestone | 201 + milestone | ✅ PASS |
| Create task | 201 + task | 201 + task | ✅ PASS |
| Task stats | 200 + byStatus | 200 + byStatus | ✅ PASS |
| Missing projectId (budget) | 400 | 400 | ✅ PASS |

### S4 Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| REST only | ✅ |
| Tenant + platformInstance scoped | ✅ |
| Consistent error codes | ✅ |
| No UI | ✅ |
| No notifications | ✅ |
| No calendar integrations | ✅ |
| No real-time collaboration | ✅ |

### API Route Location

```
/app/frontend/src/app/api/project-management/
├── dashboard/route.ts
├── projects/
│   ├── route.ts
│   └── [id]/route.ts
├── milestones/
│   ├── route.ts
│   └── [id]/route.ts
├── tasks/
│   ├── route.ts
│   └── [id]/route.ts
├── team/
│   ├── route.ts
│   └── [id]/route.ts
└── budget/
    ├── route.ts
    └── [id]/route.ts
```

---

## 🛑 STOP — AWAITING S5 APPROVAL

**Project Management Suite S4 complete — awaiting approval for S5.**

Before proceeding to S5 (Admin UI + Demo Data), please confirm:

1. ✅ API surface area is acceptable
2. ✅ Tenant enforcement is correct
3. ✅ Action-based mutations are properly structured
4. ✅ Error handling is consistent

**Upon approval, will proceed with S5 (Admin UI + Demo Data).**
