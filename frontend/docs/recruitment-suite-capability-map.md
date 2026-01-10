# Recruitment & Onboarding Suite — Capability Map

**Phase**: 7C.1  
**Suite**: Recruitment & Onboarding  
**Submission Date**: January 6, 2026  
**Status**: ✅ S0-S5 COMPLETE | 🟡 AWAITING S6 VERIFICATION

---

## S0: Context Confirmation

### What This Suite IS

A practical **recruitment pipeline** for Nigerian businesses that need to:
- Post job openings (internal + shareable links)
- Track applicants through hiring stages
- Schedule and record interviews
- Manage offers and onboarding checklists
- Hand off new hires to HR module

### What This Suite is NOT

| Excluded | Rationale |
|----------|-----------|
| ❌ Full HRIS/HCM | WebWaka has HR module for post-hire |
| ❌ Payroll | Out of scope; existing Payroll module |
| ❌ Biometric systems | Hardware integration complexity |
| ❌ Government integrations (NYSC, NIN, TIN) | Regulatory complexity |
| ❌ Public job boards | Aggregator complexity |
| ❌ AI screening/matching | Phase 8+ consideration |
| ❌ Psychometric testing | Third-party integration |

### Target Customers (Nigeria-First)

| Customer Type | Hiring Pattern | Key Needs |
|---------------|----------------|-----------|
| **SMEs** (Retail, Logistics) | Frequent entry-level | Fast screening, basic pipeline |
| **Professional Services** (Law, Accounting) | Specialized roles | Interview stages, reference checks |
| **Schools** (Primary, Secondary, Tertiary) | Seasonal batch hiring | Teacher certifications, onboarding |
| **NGOs & Nonprofits** | Project-based staffing | Volunteer tracking, donor compliance |
| **Construction Companies** | Skilled labor + admin | Trade certifications, safety training |
| **Healthcare** (Clinics, Pharmacies) | Licensed professionals | Credential verification, practice numbers |

### Hiring Context (Nigeria)

| Aspect | Nigerian Reality |
|--------|------------------|
| **Channels** | Word-of-mouth, LinkedIn, Jobberman, direct applications |
| **Process** | Informal → Semi-formal; phone screening common |
| **Documentation** | SSCE/WAEC, NYSC certificate, guarantor letters |
| **Salary** | NGN ranges; often negotiated per candidate |
| **Onboarding** | Manual checklists; HR handoff for payroll setup |
| **Compliance** | Pension (PFA), Tax (PAYE), NHF - handled post-hire |

---

## S1: Capability Mapping

### Capability Summary

| Metric | Value |
|--------|-------|
| **Total Capabilities** | 32 |
| **New (Suite-Specific)** | 19 (~59%) |
| **Reused from Existing** | 13 (~41%) |
| **Estimated Schema Impact** | LOW-MEDIUM (5 new tables) |

---

### Domain A: Job Requisitions & Posting (6 capabilities)

| ID | Capability | Description | Reuse Source | New? |
|----|------------|-------------|--------------|------|
| A1 | Create Job Requisition | Define position, requirements, salary band | — | ✅ NEW |
| A2 | Requisition Approval Workflow | Manager/HR approval before posting | — | ✅ NEW |
| A3 | Job Posting (Internal) | Post to internal staff/portal | — | ✅ NEW |
| A4 | Shareable Job Link | Public link for external sharing | Sites & Funnels | 🔄 PARTIAL |
| A5 | Job Expiry & Closing | Auto-close after deadline/filled | — | ✅ NEW |
| A6 | Job Templates | Reusable templates for common roles | — | ✅ NEW |

**Nigerian Context:**
- Salary bands in NGN (e.g., ₦150,000 - ₦250,000/month)
- Common roles: Sales Rep, Driver, Accountant, Teacher, Nurse, Security
- Requirements: SSCE, OND, HND, BSc, Professional certifications

---

### Domain B: Applicant Tracking (7 capabilities)

| ID | Capability | Description | Reuse Source | New? |
|----|------------|-------------|--------------|------|
| B1 | Applicant Registration | Capture applicant details | CRM Contacts | 🔄 EXTEND |
| B2 | CV/Resume Upload | Attach documents to applicant | Files Module | 🔁 REUSE |
| B3 | Application Pipeline | Track stage (Applied → Screening → Interview → Offer → Hired) | — | ✅ NEW |
| B4 | Pipeline Stage Movement | Move applicants between stages | — | ✅ NEW |
| B5 | Applicant Notes | Internal notes/comments | CRM Engagement | 🔄 EXTEND |
| B6 | Applicant Scoring | Rate applicants (1-5 stars, tags) | — | ✅ NEW |
| B7 | Rejection Handling | Reject with reason, optional email | CRM + Email | 🔄 EXTEND |

**Pipeline Stages (Default):**
```
APPLIED → SCREENING → INTERVIEW → ASSESSMENT → OFFER → HIRED
                ↓           ↓           ↓         ↓
            REJECTED    WITHDRAWN   NO_SHOW   DECLINED
```

---

### Domain C: Interview Management (6 capabilities)

| ID | Capability | Description | Reuse Source | New? |
|----|------------|-------------|--------------|------|
| C1 | Schedule Interview | Set date, time, location/link | Calendar | 🔄 EXTEND |
| C2 | Interview Types | Phone, In-Person, Video, Panel | — | ✅ NEW |
| C3 | Interviewer Assignment | Assign staff to conduct interview | HR Staff | 🔁 REUSE |
| C4 | Interview Feedback | Structured feedback forms | — | ✅ NEW |
| C5 | Interview Scorecard | Rating criteria per role | — | ✅ NEW |
| C6 | Interview Calendar View | Recruiter calendar of interviews | Calendar | 🔁 REUSE |

**Nigerian Context:**
- Phone screening is the norm (saves transport costs)
- Panel interviews for senior roles
- WhatsApp video calls common for remote
- Interview times: 9am-5pm, avoid public holidays

---

### Domain D: Offer Management (5 capabilities)

| ID | Capability | Description | Reuse Source | New? |
|----|------------|-------------|--------------|------|
| D1 | Generate Offer | Create offer with salary, benefits, start date | — | ✅ NEW |
| D2 | Offer Letter Template | Customizable offer letter templates | Files/Templates | 🔄 EXTEND |
| D3 | Offer Approval | Manager/finance approval before sending | — | ✅ NEW |
| D4 | Offer Tracking | Track status (Sent, Viewed, Accepted, Declined, Expired) | — | ✅ NEW |
| D5 | Salary Negotiation Log | Track negotiation history | — | ✅ NEW |

**Nigerian Offer Components:**
- Basic Salary (NGN)
- Housing Allowance
- Transport Allowance
- Leave Days
- Pension (8% employer, 8% employee)
- HMO/Health Insurance
- 13th Month (if applicable)

---

### Domain E: Onboarding (5 capabilities)

| ID | Capability | Description | Reuse Source | New? |
|----|------------|-------------|--------------|------|
| E1 | Onboarding Checklist | Tasks for new hire completion | — | ✅ NEW |
| E2 | Document Collection | Collect required documents (ID, certificates, guarantor) | Files Module | 🔁 REUSE |
| E3 | Onboarding Task Assignment | Assign IT, HR, Manager tasks | HR Tasks | 🔄 EXTEND |
| E4 | Orientation Scheduling | Schedule orientation sessions | Calendar | 🔁 REUSE |
| E5 | HR Handoff | Convert applicant to Employee record | HR Module | 🔄 EXTEND |

**Nigerian Onboarding Documents:**
- National ID / Voter's Card / International Passport
- SSCE/WAEC Certificate
- Degree/HND/OND Certificate
- NYSC Certificate or Exemption Letter
- Professional License (if applicable)
- Guarantor Form (2 guarantors)
- Bank Account Details (for salary)
- Passport Photographs
- Medical Certificate (optional)

---

### Domain F: Recruiter Management (3 capabilities)

| ID | Capability | Description | Reuse Source | New? |
|----|------------|-------------|--------------|------|
| F1 | Recruiter Assignment | Assign jobs to recruiters/HR staff | HR Staff | 🔁 REUSE |
| F2 | Recruiter Workload | View assigned jobs and applicants | — | ✅ NEW |
| F3 | Recruiter Performance | Metrics: time-to-hire, conversion rates | Analytics | 🔄 EXTEND |

---

### Summary by Domain

| Domain | Total | New | Reused/Extended |
|--------|-------|-----|-----------------|
| A. Job Requisitions | 6 | 5 | 1 |
| B. Applicant Tracking | 7 | 3 | 4 |
| C. Interview Management | 6 | 3 | 3 |
| D. Offer Management | 5 | 4 | 1 |
| E. Onboarding | 5 | 1 | 4 |
| F. Recruiter Management | 3 | 1 | 2 |
| **TOTAL** | **32** | **17** | **15** |

---

## Reuse Strategy

### High-Reuse Modules

| Existing Module | Recruitment Use | Reuse Type |
|-----------------|-----------------|------------|
| **CRM Contacts** | Applicants stored as contact type `APPLICANT` | EXTEND |
| **Files** | CV uploads, certificates, offer letters | REUSE |
| **Calendar** | Interview scheduling | REUSE |
| **HR Staff** | Interviewers, recruiters | REUSE |
| **HR Module** | Employee creation (handoff) | EXTEND |
| **Email/Notifications** | Applicant updates, interview invites | REUSE |

### Handoff Points

| From | To | Trigger |
|------|-----|---------|
| CRM Contact (Applicant) | recruit_application | When applying to job |
| recruit_application | HR Employee | When offer accepted + onboarding complete |

---

## Gap Register (Schema Required)

| Gap ID | Description | Priority | Schema Impact |
|--------|-------------|----------|---------------|
| GAP-REC-001 | Job Requisition entity | P0 | `recruit_job` table |
| GAP-REC-002 | Application tracking entity | P0 | `recruit_application` table |
| GAP-REC-003 | Interview entity | P0 | `recruit_interview` table |
| GAP-REC-004 | Offer entity | P0 | `recruit_offer` table |
| GAP-REC-005 | Onboarding task entity | P1 | `recruit_onboarding_task` table |

---

## Proposed Schema (S2 Preview)

> 🛑 **Schema proposal only — requires approval before implementation**

### New Tables (5)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `recruit_job` | Job requisition | title, department, salaryMin, salaryMax, status, expiry |
| `recruit_application` | Applicant-to-job link | jobId, applicantContactId, stage, score, assignedTo |
| `recruit_interview` | Interview records | applicationId, type, scheduledAt, interviewers, feedback |
| `recruit_offer` | Offer details | applicationId, salary, benefits, status, sentAt, respondedAt |
| `recruit_onboarding_task` | Onboarding checklist | applicationId, taskName, assignedTo, status, dueDate |

### New Enums (6)

| Enum | Values |
|------|--------|
| `recruit_JobStatus` | DRAFT, OPEN, ON_HOLD, CLOSED, FILLED, CANCELLED |
| `recruit_ApplicationStage` | APPLIED, SCREENING, INTERVIEW, ASSESSMENT, OFFER, HIRED, REJECTED, WITHDRAWN |
| `recruit_InterviewType` | PHONE, VIDEO, IN_PERSON, PANEL, ASSESSMENT |
| `recruit_InterviewResult` | PENDING, PASS, FAIL, NO_SHOW, RESCHEDULED |
| `recruit_OfferStatus` | DRAFT, PENDING_APPROVAL, SENT, VIEWED, ACCEPTED, DECLINED, EXPIRED, WITHDRAWN |
| `recruit_OnboardingStatus` | PENDING, IN_PROGRESS, COMPLETED, OVERDUE |

---

## Nigeria-First Defaults

| Setting | Default Value |
|---------|---------------|
| Currency | NGN |
| Salary Display | Monthly (per month) |
| Notice Period | 1 month |
| Probation | 3-6 months |
| Work Week | Monday-Friday (some include Saturday) |
| Interview Hours | 9:00 AM - 5:00 PM WAT |
| Default Pipeline | 6-stage (Applied → Hired) |

---

## Demo Data Plan (S5)

| Entity | Count | Sample Context |
|--------|-------|----------------|
| Jobs | 8 | Sales Rep, Accountant, Driver, Teacher, Nurse, Software Dev, Admin, Security |
| Applicants | 25 | Nigerian names, Lagos/Abuja/PH locations |
| Applications | 40 | Various stages across jobs |
| Interviews | 20 | Mix of phone, video, in-person |
| Offers | 8 | Accepted, pending, declined |
| Onboarding Tasks | 15 | Document collection, IT setup, orientation |

### Sample Jobs

| Job Title | Department | Salary Range (NGN) | Status |
|-----------|------------|-------------------|--------|
| Sales Representative | Sales | ₦150,000 - ₦250,000 | OPEN |
| Staff Accountant | Finance | ₦300,000 - ₦450,000 | OPEN |
| Delivery Driver | Operations | ₦80,000 - ₦120,000 | OPEN |
| Secondary School Teacher | Education | ₦100,000 - ₦180,000 | OPEN |
| Registered Nurse | Healthcare | ₦200,000 - ₦350,000 | OPEN |
| Software Developer | IT | ₦500,000 - ₦900,000 | OPEN |
| Administrative Officer | Admin | ₦120,000 - ₦180,000 | FILLED |
| Security Guard | Operations | ₦50,000 - ₦80,000 | CLOSED |

---

## Explicitly Excluded (Scope Lock)

| Feature | Reason |
|---------|--------|
| ❌ Public job board hosting | Aggregator complexity |
| ❌ LinkedIn/Indeed integration | Third-party API dependency |
| ❌ AI resume parsing | Phase 8+ consideration |
| ❌ Background check integration | Third-party service |
| ❌ Psychometric assessments | Third-party integration |
| ❌ Payroll setup | Existing Payroll module |
| ❌ NYSC/NIN verification | Government API complexity |
| ❌ Multi-currency offers | NGN-only for Phase 7 |

---

## UI Pages (S5 Preview)

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/recruitment-suite` | Overview, open jobs, pipeline summary |
| Jobs | `/recruitment-suite/jobs` | Job list, create/edit jobs |
| Applicants | `/recruitment-suite/applicants` | Applicant directory |
| Pipeline | `/recruitment-suite/pipeline` | Kanban view of applications |
| Interviews | `/recruitment-suite/interviews` | Interview calendar/list |
| Offers | `/recruitment-suite/offers` | Offer tracking |
| Onboarding | `/recruitment-suite/onboarding` | Onboarding checklist management |

---

## Alignment with Other Suites

| Suite | Touchpoint |
|-------|------------|
| **HR Module** | Employee creation handoff |
| **Legal Practice** | Law firm hiring patterns in demo |
| **Construction** | Skilled labor recruitment patterns |
| **CRM** | Applicant as contact type |
| **Sites & Funnels** | Shareable job links |

---

## S0-S1 Completion Checklist

- [x] Context confirmed (what IS / what IS NOT)
- [x] Target customers identified (Nigeria-first)
- [x] Capabilities mapped (32 total)
- [x] Reuse strategy defined (~41% reuse)
- [x] Gap register created (5 new tables)
- [x] Schema preview prepared
- [x] Demo data plan outlined
- [x] Exclusions documented

---

## 🛑 S4 COMPLETE — AWAITING S5 APPROVAL

**S4 API Routes Implementation is COMPLETE.**

### API Routes Implemented (11 route files)

| Route | Methods | Endpoint | Description |
|-------|---------|----------|-------------|
| Jobs | GET | `/api/recruitment/jobs` | List jobs, get stats |
| Jobs | POST | `/api/recruitment/jobs` | Create job |
| Job Detail | GET | `/api/recruitment/jobs/[id]` | Get job |
| Job Detail | PATCH | `/api/recruitment/jobs/[id]` | Update job |
| Job Detail | POST | `/api/recruitment/jobs/[id]` | Actions: publish, hold, close, approve |
| Job Detail | DELETE | `/api/recruitment/jobs/[id]` | Delete draft job |
| Applications | GET | `/api/recruitment/applications` | List, stats, pipeline view |
| Applications | POST | `/api/recruitment/applications` | Apply to job, bulk assign |
| Application Detail | GET | `/api/recruitment/applications/[id]` | Get application |
| Application Detail | PATCH | `/api/recruitment/applications/[id]` | Update application |
| Application Detail | POST | `/api/recruitment/applications/[id]` | Actions: moveStage, assign, score, reject |
| Application Detail | DELETE | `/api/recruitment/applications/[id]` | Delete application |
| Interviews | GET | `/api/recruitment/interviews` | List, stats, upcoming, today |
| Interviews | POST | `/api/recruitment/interviews` | Schedule interview |
| Interview Detail | GET | `/api/recruitment/interviews/[id]` | Get interview |
| Interview Detail | PATCH | `/api/recruitment/interviews/[id]` | Update interview |
| Interview Detail | POST | `/api/recruitment/interviews/[id]` | Actions: feedback, reschedule, cancel |
| Interview Detail | DELETE | `/api/recruitment/interviews/[id]` | Delete interview |
| Offers | GET | `/api/recruitment/offers` | List offers, stats |
| Offers | POST | `/api/recruitment/offers` | Create offer |
| Offer Detail | GET | `/api/recruitment/offers/[id]` | Get offer + total compensation |
| Offer Detail | PATCH | `/api/recruitment/offers/[id]` | Update offer |
| Offer Detail | POST | `/api/recruitment/offers/[id]` | Actions: approve, send, accept, negotiate |
| Offer Detail | DELETE | `/api/recruitment/offers/[id]` | Delete draft offer |
| Onboarding | GET | `/api/recruitment/onboarding` | List tasks, checklist, overdue |
| Onboarding | POST | `/api/recruitment/onboarding` | Create task, generate checklist |
| Onboarding Detail | GET | `/api/recruitment/onboarding/[id]` | Get task |
| Onboarding Detail | PATCH | `/api/recruitment/onboarding/[id]` | Update task |
| Onboarding Detail | POST | `/api/recruitment/onboarding/[id]` | Actions: complete, upload, verify |
| Onboarding Detail | DELETE | `/api/recruitment/onboarding/[id]` | Delete task |
| Dashboard | GET | `/api/recruitment/dashboard` | Aggregated stats |

### Tenant Scoping Enforcement ✅
- All routes require `x-tenant-id` header
- Returns 401 Unauthorized without header
- All queries filtered by tenantId

### API Test Results

| Test | Result |
|------|--------|
| GET /api/recruitment/jobs | ✅ PASS |
| GET /api/recruitment/jobs?stats=true | ✅ PASS |
| POST /api/recruitment/jobs (create) | ✅ PASS |
| POST /api/recruitment/jobs/[id] (publish) | ✅ PASS |
| POST /api/recruitment/applications (apply) | ✅ PASS |
| POST /api/recruitment/applications/[id] (moveStage) | ✅ PASS |
| POST /api/recruitment/interviews (schedule) | ✅ PASS |
| GET /api/recruitment/dashboard | ✅ PASS |
| GET /api/recruitment/jobs (no tenant) | ✅ PASS (401 returned) |

### S4 Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| Routes under /api/recruitment/* only | ✅ |
| Tenant-scoped all routes | ✅ |
| No UI pages | ✅ |
| No email/SMS triggers | ✅ |
| No calendar sync | ✅ |
| No file storage logic | ✅ |
| No auth changes | ✅ |

---

## 🛑 S5 COMPLETE — AWAITING S6 VERIFICATION

**S5 Admin UI + Demo Data is COMPLETE.**

### S5 Admin UI Pages Implemented

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/recruitment-suite` | Overview with pipeline stats, quick actions, today's interviews |
| Jobs | `/recruitment-suite/jobs` | Job list, create, publish, filter by status |
| Applications | `/recruitment-suite/applications` | List/Pipeline view, stage badges, scoring |
| Interviews | `/recruitment-suite/interviews` | Schedule, today's interviews, results |
| Offers | `/recruitment-suite/offers` | Compensation breakdown, offer lifecycle |
| Onboarding | `/recruitment-suite/onboarding` | Task checklists, progress tracking |

### UI Features Implemented

| Feature | Status |
|---------|--------|
| Nigeria-first labels (₦ salaries, NGN currency) | ✅ |
| Status badges (stage, result, offer status) | ✅ |
| Filters by stage/status | ✅ |
| Demo Mode badge | ✅ |
| Search functionality | ✅ |
| Quick actions | ✅ |
| Pipeline visualization | ✅ |
| Today's interviews highlight | ✅ |
| Overdue task alerts | ✅ |
| Progress bars for onboarding | ✅ |

### Demo Data Created

| Entity | Count | Nigerian Context |
|--------|-------|------------------|
| Jobs | 5 | Sales Rep, Accountant, Developer, Admin, Driver |
| Applications | 7 | Nigerian names (Adaeze, Emeka, Fatima, etc.) |
| Interviews | 6 | Phone, Video, In-Person, Panel types |
| Offers | 4 | NGN compensation breakdown |
| Onboarding Tasks | 8+ | NYSC, Guarantor forms, IT setup |

### Demo Data Nigerian Elements

- **Names**: Adaeze Okonkwo, Emeka Nwosu, Fatima Abdullahi, Chukwudi Eze, etc.
- **Phone Format**: +234 XXX XXX XXXX
- **Salary Ranges**: ₦80,000 - ₦900,000/month
- **Documents**: NYSC Certificate, WAEC, Guarantor Forms
- **Locations**: Lagos, Abuja, Port Harcourt
- **Sources**: LinkedIn, Jobberman, Referral, Direct

### S5 Documentation

| Document | Location |
|----------|----------|
| Admin Usage Guide | `/frontend/docs/recruitment-suite-guide.md` |
| Demo Data Seeder | `/frontend/scripts/seed-recruitment-demo.ts` |

### S5 Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| No public careers page | ✅ |
| No applicant self-service portal | ✅ |
| No email/SMS notifications | ✅ |
| No HR employee auto-creation | ✅ |
| No offer letter PDF generation | ✅ |
| No calendar sync | ✅ |

**Upon S6 verification, this suite will be FROZEN as Demo-Ready v1.**
