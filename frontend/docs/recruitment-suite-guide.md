# Recruitment & Onboarding Suite — Admin Guide

**Suite**: Phase 7C.1 — Recruitment & Onboarding  
**Version**: Demo-Ready v1  
**Status**: ✅ COMPLETE

---

## Overview

The Recruitment & Onboarding Suite provides Nigerian SMEs with a practical hiring pipeline — from job posting to new hire onboarding. It is designed for businesses that need to:

- Post job openings and share them externally
- Track applicants through hiring stages
- Schedule and record interviews
- Manage job offers
- Onboard new hires with checklists

**This is NOT a full HRIS/HCM system.** For post-hire employee management, use the existing HR Module.

---

## Quick Start

### Accessing the Suite

Navigate to: `/recruitment-suite`

The dashboard provides:
- Overview of open jobs, applicants, and interviews
- Quick action buttons for common tasks
- Pipeline summary showing applicants by stage
- Today's scheduled interviews

### User Roles

| Role | Access Level |
|------|--------------|
| **TENANT_ADMIN** | Full access to all features |
| **TENANT_USER** | View and manage assigned jobs/applications |
| **HR Manager** | Full recruitment access |
| **Hiring Manager** | View applicants for their jobs |

---

## Features

### 1. Job Postings (`/recruitment-suite/jobs`)

**Create a Job:**
1. Click "Create Job"
2. Fill in job details:
   - Title, Department, Location
   - Salary range (in NGN)
   - Employment type (Full-time, Part-time, Contract)
   - Requirements and description
3. Save as Draft or Publish immediately

**Job Lifecycle:**
```
DRAFT → OPEN → ON_HOLD → CLOSED/FILLED
```

- **Draft**: Not visible externally, can be edited
- **Open**: Accepting applications
- **On Hold**: Temporarily paused
- **Filled**: All positions filled
- **Closed**: No longer accepting applications

**Features:**
- Auto-generated job codes (e.g., JOB-2026-0001)
- Filter by status, department
- View applicant count per job
- Shareable job links for external posting

---

### 2. Applications (`/recruitment-suite/applications`)

**Application Pipeline:**
```
APPLIED → SCREENING → INTERVIEW → ASSESSMENT → OFFER → HIRED
                 ↓           ↓           ↓         ↓
             REJECTED    WITHDRAWN   NO_SHOW   DECLINED
```

**Views:**
- **List View**: All applications with filters
- **Pipeline View**: Kanban-style board by stage

**Adding Applicants:**
- Manual entry for walk-in or referral candidates
- Capture: Name, email, phone, location, source, expected salary

**Managing Applications:**
- Move to next stage
- Score/rate applicants (1-5 stars)
- Assign recruiter
- Add notes
- Shortlist or reject

**Filters:**
- By stage (Applied, Screening, Interview, etc.)
- By job
- By source (LinkedIn, Jobberman, Referral, etc.)

---

### 3. Interviews (`/recruitment-suite/interviews`)

**Scheduling an Interview:**
1. Click "Schedule Interview"
2. Select applicant
3. Choose type: Phone, Video, In-Person, Panel
4. Set date, time, duration
5. Add interviewers
6. Specify location or meeting link

**Interview Types:**
| Type | Typical Duration | Use Case |
|------|------------------|----------|
| Phone | 15-30 min | Initial screening |
| Video | 30-60 min | Remote interviews |
| In-Person | 45-90 min | Final rounds |
| Panel | 60-120 min | Multiple interviewers |
| Assessment | 60-180 min | Technical tests |

**Recording Results:**
- Mark as Passed, Failed, or No-Show
- Add feedback and scores
- Reschedule if needed

**Today's Interviews:**
- Dashboard shows all interviews scheduled for today
- Quick access from the main dashboard

---

### 4. Offers (`/recruitment-suite/offers`)

**Creating an Offer:**
1. Click "Create Offer"
2. Select candidate (must be at OFFER stage)
3. Enter compensation:
   - Basic Salary (NGN)
   - Housing Allowance
   - Transport Allowance
   - Other Allowances
4. Set proposed start date
5. Set offer expiry period

**Nigerian Compensation Components:**
| Component | Typical % of Basic |
|-----------|-------------------|
| Housing Allowance | 10-20% |
| Transport Allowance | 8-15% |
| Meal/Other | 5-10% |
| 13th Month | (Annual) |
| Pension | 8% employer + 8% employee |

**Offer Lifecycle:**
```
DRAFT → PENDING_APPROVAL → SENT → ACCEPTED/DECLINED/EXPIRED
```

**Features:**
- Auto-calculate total monthly compensation
- Track offer status
- Send reminders for pending offers
- Convert to HR employee on acceptance

---

### 5. Onboarding (`/recruitment-suite/onboarding`)

**Automatic Task Generation:**
When an offer is accepted, standard onboarding tasks are created:

**Documentation (Nigerian Requirements):**
- National ID / Passport copy
- NYSC Certificate or Exemption Letter
- Educational Certificates (SSCE/WAEC, Degree)
- Guarantor Forms (2 required)
- Bank Account Details
- Passport Photographs

**IT Setup:**
- Email account creation
- System access provisioning
- Equipment assignment

**Orientation:**
- HR orientation session
- Department introduction
- Company policies review

**Views:**
- **By Hire**: See all tasks grouped by new employee
- **All Tasks**: Flat list with filters

**Task Management:**
- Mark tasks complete
- Upload required documents
- Reassign tasks
- Track overdue items

**Progress Tracking:**
- Progress bar per new hire
- Overdue alerts prominently displayed

---

## Nigerian Context

### Salary Bands (2026 Market Rates)

| Role Level | Monthly Range (NGN) |
|------------|---------------------|
| Entry Level | ₦80,000 - ₦150,000 |
| Mid Level | ₦150,000 - ₦350,000 |
| Senior | ₦350,000 - ₦600,000 |
| Management | ₦600,000 - ₦1,500,000 |
| Executive | ₦1,500,000+ |

### Required Documents

| Document | Purpose |
|----------|---------|
| National ID / Passport | Identity verification |
| NYSC Certificate | Mandatory for graduates |
| WAEC/NECO Certificate | Educational qualification |
| Degree/HND/OND | Higher education |
| Guarantor Form | Character reference |
| Bank Letter | Salary account |

### Common Hiring Sources

- Jobberman
- LinkedIn
- Company Website
- Referrals (common in Nigeria)
- Walk-ins
- Universities (fresh graduates)
- NYSC postings

---

## API Reference

### Jobs
- `GET /api/recruitment/jobs` - List jobs
- `POST /api/recruitment/jobs` - Create job
- `GET /api/recruitment/jobs/{id}` - Get job details
- `PATCH /api/recruitment/jobs/{id}` - Update job
- `POST /api/recruitment/jobs/{id}` - Actions (publish, hold, close)

### Applications
- `GET /api/recruitment/applications` - List applications
- `POST /api/recruitment/applications` - Apply to job
- `POST /api/recruitment/applications/{id}` - Actions (moveStage, score, reject)

### Interviews
- `GET /api/recruitment/interviews` - List interviews
- `POST /api/recruitment/interviews` - Schedule interview
- `POST /api/recruitment/interviews/{id}` - Actions (feedback, reschedule)

### Offers
- `GET /api/recruitment/offers` - List offers
- `POST /api/recruitment/offers` - Create offer
- `POST /api/recruitment/offers/{id}` - Actions (send, accept, decline)

### Onboarding
- `GET /api/recruitment/onboarding` - List tasks
- `POST /api/recruitment/onboarding` - Create task
- `POST /api/recruitment/onboarding/{id}` - Actions (complete, upload)

### Dashboard
- `GET /api/recruitment/dashboard` - Aggregated stats

---

## Known Limitations (Demo Mode)

| Feature | Status | Notes |
|---------|--------|-------|
| Email Notifications | ❌ Not Implemented | Manual follow-up required |
| SMS Alerts | ❌ Not Implemented | Future enhancement |
| Calendar Sync | ❌ Not Implemented | Manual scheduling |
| CV Parsing | ❌ Not Implemented | Manual data entry |
| Background Checks | ❌ Not Implemented | Third-party integration |
| Public Careers Page | ❌ Not Implemented | Use shareable links |
| Job Board Integration | ❌ Not Implemented | Manual posting |
| Offer Letter PDF | ❌ Not Implemented | External generation |

---

## Best Practices

### For Recruiters
1. Keep job descriptions clear and specific
2. Move candidates through pipeline promptly
3. Add notes after each interaction
4. Set realistic closing dates
5. Follow up on overdue onboarding tasks

### For HR Managers
1. Review pipeline weekly
2. Monitor time-to-hire metrics
3. Ensure offers align with budget
4. Track source effectiveness
5. Complete onboarding before handoff to HR module

### For Hiring Managers
1. Provide timely interview feedback
2. Participate in panel interviews
3. Approve offers within 48 hours
4. Welcome new hires during orientation

---

## Support

For issues or questions:
1. Contact your WebWaka Partner
2. Check the [Capability Map](/frontend/docs/recruitment-suite-capability-map.md)
3. Review test data in demo mode

---

**Last Updated**: January 2026  
**Version**: 1.0.0
