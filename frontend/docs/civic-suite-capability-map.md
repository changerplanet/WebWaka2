# Civic Suite - Capability Mapping Document

## S0: Context Confirmation ✅
## S1: Capability Mapping (Design Only - NO CODE)

---

## Suite Overview

**Target Customers:**
- Local Government Areas (LGAs)
- State Government Agencies
- Municipal Councils
- Community Development Associations (CDAs)
- Estate Management Associations
- Cooperative Societies
- Religious Organizations (Churches, Mosques)
- Traditional Councils
- NGOs & Civil Society Organizations
- Resident Associations

**Key Capabilities Required:**
1. Constituent/Member Management
2. Dues & Levy Collection
3. Service Request Management
4. Document & Certificate Issuance
5. Event & Meeting Management
6. Communication & Announcements
7. Voting & Elections (Simple Polls)

---

## Nigerian Civic Context

### Common Civic Organizations in Nigeria

| Organization Type | Examples | Primary Functions |
|-------------------|----------|-------------------|
| **LGA/Municipal** | Lagos Island LGA, Ikeja LGA | Revenue collection, certificates, permits |
| **CDA** | Community Development Associations | Development levies, community projects |
| **Estate Association** | Lekki Phase 1 Residents Association | Service charges, security, maintenance |
| **Cooperative** | Teacher's Cooperative, Market Cooperative | Savings, loans, bulk purchasing |
| **Religious** | Parish Council, Mosque Committee | Tithes, offerings, welfare |
| **Traditional** | Town Union, Age Grade | Cultural events, hometown development |

### Common Revenue/Dues Types

| Type | Nigerian Context | Collection Pattern |
|------|------------------|-------------------|
| **Tenement Rate** | LGA property tax | Annual/Quarterly |
| **Development Levy** | CDA contributions | Monthly/Annual |
| **Service Charge** | Estate maintenance | Monthly |
| **Security Levy** | Gated community security | Monthly |
| **Dues** | Union/association membership | Monthly/Annual |
| **Tithe/Offering** | Religious contributions | Weekly/Monthly |
| **Special Levy** | Project-based collections | One-time |

---

## Capability Mapping Matrix

### 1. CONSTITUENT/MEMBER MANAGEMENT

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Member Profiles | **CRM Contacts** | Configure contact type = "CONSTITUENT" or "MEMBER" | ✅ REUSE |
| Household/Family | **CRM Contacts** | Configure contact type = "HOUSEHOLD" with relationships | ✅ REUSE |
| Member ID Generation | **StaffMember.employeeId pattern** | Apply same ID generation for Member Numbers | ✅ REUSE |
| Member Categories | **CRM Segmentation** | Use segments (Ward, Zone, Unit, Block) | ✅ REUSE |
| Membership Status | **CRM Contact Tags** | Use tags (Active, Suspended, Honorary, Deceased) | ✅ REUSE |
| Membership History | **CRM Engagement** | Track membership events | ✅ REUSE |
| Property Ownership | **CRM Contact metadata** | Store property details in metadata | ✅ REUSE |

**Verdict: 100% REUSE** - CRM module with civic-specific configuration

**Constituent Metadata Schema (stored in CRM Contact.metadata):**
```json
{
  "contactType": "CONSTITUENT",
  "memberNumber": "MEM-2025-0001",
  "membershipType": "RESIDENT",
  "membershipStatus": "ACTIVE",
  "ward": "Ward 3",
  "zone": "Zone A",
  "unit": "Unit 12",
  "block": "Block 5",
  "propertyType": "RESIDENTIAL",
  "propertyAddress": "Plot 15, Adenuga Street",
  "householdSize": 4,
  "occupation": "Civil Servant",
  "employmentStatus": "EMPLOYED",
  "registrationDate": "2020-03-15",
  "lastContributionDate": "2025-01-01"
}
```

---

### 2. DUES & LEVY COLLECTION

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Dues/Levy Types | **Billing/Subscription Plans** | Configure dues as subscription plans | ✅ REUSE |
| Payment Schedules | **Billing Intervals** | Monthly, Quarterly, Annual already supported | ✅ REUSE |
| Invoice Generation | **Invoice Model** | Already exists | ✅ REUSE |
| Payment Processing | **Payments Module** | Cash, Transfer, POS supported | ✅ REUSE |
| Payment Receipts | **Payment Events** | Already tracks payments | ✅ REUSE |
| Arrears Tracking | **Invoice Status** | OVERDUE status tracking | ✅ REUSE |
| Partial Payments | **Payment Adjustments** | Already supports partial payments | ✅ REUSE |
| Penalties/Late Fees | **Billing Add-ons** | Configure as penalty add-ons | ✅ REUSE |
| Payment Reminders | **CRM Campaigns** | Automated SMS/Email reminders | ✅ REUSE |
| Collection Reports | **Analytics** | Payment analytics already exist | ✅ REUSE |
| Special Levies | **Billing Adjustments** | One-time charges supported | ✅ REUSE |
| Exemptions/Waivers | **Billing Discounts** | Configure exemption types | ✅ REUSE |

**Verdict: 100% REUSE** - Billing module fully applicable

**Dues Configuration Metadata:**
```json
{
  "duesType": "DEVELOPMENT_LEVY",
  "frequency": "MONTHLY",
  "baseAmount": 5000,
  "penaltyRate": 0.10,
  "gracePeriodDays": 15,
  "applicableTo": ["RESIDENT", "LANDLORD"],
  "exemptCategories": ["ELDERLY_70_PLUS", "DISABLED"],
  "proRataAllowed": true
}
```

---

### 3. SERVICE REQUEST MANAGEMENT

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Request Submission | **CRM Engagement** | Create engagement type = "SERVICE_REQUEST" | ✅ REUSE |
| Request Categories | **CRM Engagement Types** | Configure civic service types | ✅ REUSE |
| Request Status | **CRM Engagement Status** | Track request lifecycle | ✅ REUSE |
| Assignment to Staff | **HR StaffMember** | Assign requests to staff | ✅ REUSE |
| Request Notes | **CRM Engagement Notes** | Already exists | ✅ REUSE |
| SLA Tracking | - | Store SLA in engagement metadata | ⚠️ PARTIAL |
| Escalation | - | Business logic only | 🔴 GAP (SERVICE) |

**Verdict: 85% REUSE** - CRM Engagement with civic configuration

**Service Request Types (Nigerian Context):**
- Waste Collection Request
- Street Light Repair
- Road Maintenance Request
- Water Supply Issue
- Security Patrol Request
- Noise Complaint
- Building Permit Inquiry
- Certificate Request
- General Inquiry/Complaint

**Service Request Metadata Schema:**
```json
{
  "engagementType": "SERVICE_REQUEST",
  "requestId": "REQ-2025-0001",
  "category": "INFRASTRUCTURE",
  "subcategory": "STREET_LIGHT",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "location": "Junction of Adenuga Street",
  "description": "Street light not working for 2 weeks",
  "assignedTo": "staff_001",
  "slaHours": 72,
  "slaDue": "2025-01-08T10:00:00Z",
  "escalatedAt": null,
  "resolvedAt": null,
  "resolutionNotes": null
}
```

---

### 4. DOCUMENT & CERTIFICATE ISSUANCE

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Certificate Templates | **SF Templates** | Use Sites & Funnels template system | ✅ REUSE |
| Certificate Generation | - | PDF generation service | 🔴 GAP (SERVICE) |
| Certificate Tracking | **CRM Engagement** | Track as engagement type = "CERTIFICATE" | ✅ REUSE |
| Certificate Fees | **Product (SERVICE)** | Configure services as certificate fees | ✅ REUSE |
| Payment for Certificates | **Payments Module** | Already exists | ✅ REUSE |
| Certificate Verification | - | QR code/lookup service | 🔴 GAP (SERVICE) |

**Verdict: 70% REUSE** - Requires new certificate service

**Common Nigerian Civic Certificates:**
- Certificate of Occupancy (C of O) Application
- Building Approval Certificate
- Letter of Good Standing
- Residency Certificate
- Marriage Introduction Letter
- Age Declaration
- Character Certificate
- Land Use Clearance
- Development Permit

**Certificate Metadata Schema:**
```json
{
  "certificateType": "GOOD_STANDING",
  "certificateNumber": "CERT-2025-0001",
  "constituentId": "member_001",
  "issuedTo": "John Adebayo",
  "purpose": "Employment Verification",
  "issuedDate": "2025-01-05",
  "validUntil": "2025-07-05",
  "issuedBy": "staff_001",
  "verificationCode": "GS-ABC123XYZ",
  "status": "ISSUED",
  "feePaid": 2500,
  "invoiceId": "inv_001"
}
```

---

### 5. EVENT & MEETING MANAGEMENT

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Event Creation | **CRM Engagement** | Create engagement type = "EVENT" | ✅ REUSE |
| Event Registration | **CRM Engagement** | Track RSVPs as engagement records | ✅ REUSE |
| Meeting Minutes | **CRM Engagement Notes** | Store minutes in engagement | ✅ REUSE |
| Attendance Tracking | **HR Attendance patterns** | Adapt for event attendance | ⚠️ PARTIAL |
| Event Reminders | **CRM Campaigns** | Automated notifications | ✅ REUSE |
| Event Calendar | - | UI-only, no backend needed | ✅ UI-ONLY |

**Verdict: 85% REUSE** - CRM Engagement with event configuration

**Event Types (Nigerian Civic Context):**
- Town Hall Meeting
- Annual General Meeting (AGM)
- Executive Committee Meeting
- Ward Meeting
- Community Sanitation Day
- Cultural Festival
- End-of-Year Party
- Inauguration Ceremony
- Development Project Launch

**Event Metadata Schema:**
```json
{
  "engagementType": "EVENT",
  "eventId": "EVT-2025-0001",
  "eventType": "AGM",
  "title": "2025 Annual General Meeting",
  "description": "Annual general meeting of all members",
  "venue": "Community Hall, Block A",
  "eventDate": "2025-02-15",
  "startTime": "10:00",
  "endTime": "14:00",
  "expectedAttendees": 200,
  "actualAttendees": 0,
  "status": "SCHEDULED",
  "agenda": ["Chairman's Address", "Financial Report", "Elections", "AOB"],
  "minutesUrl": null
}
```

---

### 6. COMMUNICATION & ANNOUNCEMENTS

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Bulk SMS | **CRM Campaigns** | Already supports SMS campaigns | ✅ REUSE |
| Email Newsletters | **CRM Campaigns** | Already supports email campaigns | ✅ REUSE |
| Announcements | **CRM Campaigns** | Create announcement campaign type | ✅ REUSE |
| Targeted Messages | **CRM Segmentation** | Send to specific wards/zones | ✅ REUSE |
| Message History | **CRM Campaign Logs** | Already tracked | ✅ REUSE |
| Announcement Board | - | UI page to display announcements | ✅ UI-ONLY |

**Verdict: 100% REUSE** - CRM Campaigns fully applicable

---

### 7. VOTING & ELECTIONS (Simple Polls)

| Civic Need | Existing Capability | Reuse Strategy | Gap? |
|------------|---------------------|----------------|------|
| Poll Creation | - | NEW service for simple polls | 🔴 GAP (SERVICE) |
| Candidate Registration | **CRM Contacts** | Configure as candidates | ✅ REUSE |
| Vote Recording | - | NEW service with in-memory storage | 🔴 GAP (SERVICE) |
| Vote Verification | - | NEW service to prevent double voting | 🔴 GAP (SERVICE) |
| Result Tabulation | - | NEW service for counting | 🔴 GAP (SERVICE) |
| Voter Eligibility | **CRM Segmentation** | Use segments for voter lists | ✅ REUSE |

**Verdict: 40% REUSE** - Voting requires NEW service

**Note:** This is for SIMPLE internal polls/elections (committee elections, decision polls), NOT for government elections which require specialized electoral systems.

**Poll Metadata Schema:**
```json
{
  "pollId": "POLL-2025-0001",
  "pollType": "ELECTION",
  "title": "Executive Committee Election 2025",
  "description": "Election of new executive committee members",
  "positions": [
    { "key": "CHAIRMAN", "title": "Chairman", "candidates": ["c1", "c2"] },
    { "key": "SECRETARY", "title": "Secretary", "candidates": ["c3", "c4"] }
  ],
  "votingStart": "2025-02-15T08:00:00Z",
  "votingEnd": "2025-02-15T17:00:00Z",
  "eligibleVoters": "segment_active_members",
  "status": "SCHEDULED",
  "totalVotes": 0,
  "results": null
}
```

---

## Summary: Capability Reuse Analysis

| Capability Area | Reuse % | Primary Module | Notes |
|-----------------|---------|----------------|-------|
| Constituent Management | 100% | CRM | Contact type configuration |
| Dues & Levy Collection | 100% | Billing | Plan/invoice configuration |
| Service Requests | 85% | CRM Engagement | Engagement type configuration |
| Document Issuance | 70% | NEW + Products | Certificate service needed |
| Event Management | 85% | CRM Engagement | Event engagement type |
| Communications | 100% | CRM Campaigns | Already complete |
| Voting/Elections | 40% | NEW | Simple poll service needed |

**Overall Reuse: ~83%**

---

## Gap Register

### GAP-CIVIC-001: Certificate Issuance Service

**Description:** No existing capability for generating and tracking civic certificates/documents.

**Proposed Solution (Design Only):**
- Create `civic/certificate-service.ts` - Business logic only
- Store certificates in tenant-scoped in-memory storage (demo)
- Generate PDF certificates with QR verification codes
- Link to Products/Billing for fee collection

**Data Model Approach (NO SCHEMA CHANGES):**
```typescript
interface Certificate {
  id: string;
  tenantId: string;
  constituentId: string;  // CRM Contact ID
  certificateType: CertificateType;
  certificateNumber: string;
  issuedTo: string;
  purpose?: string;
  issuedDate: string;
  validUntil?: string;
  issuedBy: string;  // StaffMember ID
  verificationCode: string;
  status: 'PENDING' | 'ISSUED' | 'REVOKED' | 'EXPIRED';
  feePaid?: number;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

type CertificateType = 
  | 'GOOD_STANDING'
  | 'RESIDENCY'
  | 'CHARACTER'
  | 'MEMBERSHIP'
  | 'CLEARANCE'
  | 'INTRODUCTION_LETTER'
  | 'CUSTOM';
```

**Core Impact:** NONE - In-memory demo storage

---

### GAP-CIVIC-002: Simple Voting/Poll Service

**Description:** No existing capability for conducting simple polls and elections.

**Proposed Solution (Design Only):**
- Create `civic/voting-service.ts` - Business logic only
- Store polls and votes in tenant-scoped in-memory storage (demo)
- Verify voter eligibility via CRM segments
- Prevent double voting via voter registry

**Data Model Approach (NO SCHEMA CHANGES):**
```typescript
interface Poll {
  id: string;
  tenantId: string;
  pollType: 'ELECTION' | 'DECISION' | 'SURVEY';
  title: string;
  description?: string;
  positions?: PollPosition[];  // For elections
  options?: PollOption[];      // For decision polls
  votingStart: string;
  votingEnd: string;
  eligibleVotersSegment: string;  // CRM Segment ID
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  totalVotes: number;
  results?: Record<string, number>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Vote {
  id: string;
  pollId: string;
  voterId: string;  // CRM Contact ID
  voterHash: string;  // Hashed ID for anonymity
  selections: Record<string, string>;  // position -> candidateId
  votedAt: string;
}

interface PollPosition {
  key: string;
  title: string;
  candidates: string[];  // CRM Contact IDs
}

interface PollOption {
  key: string;
  label: string;
  description?: string;
}
```

**Core Impact:** NONE - In-memory demo storage

---

### GAP-CIVIC-003: Service Request Escalation

**Description:** Need business logic for SLA tracking and escalation of service requests.

**Proposed Solution (Design Only):**
- Create `civic/service-request-service.ts` - Wraps CRM Engagement
- Add SLA calculation and escalation logic
- Automated escalation via scheduled checks

**Data Model Approach (NO SCHEMA CHANGES):**
- Store SLA configuration in tenant settings
- Track escalation status in engagement metadata
- No new tables required

**Core Impact:** NONE - Configuration and business logic only

---

## Core Impact Assessment

| Question | Answer |
|----------|--------|
| New database tables required? | **NO** |
| Schema changes to existing tables? | **NO** |
| New Core primitives required? | **NO** |
| Cross-suite data dependencies? | **NO** |
| Partner-First compliance? | **YES** |

### Detailed Assessment:

1. **CRM Module Extension**
   - Add civic-specific contact types: CONSTITUENT, MEMBER, HOUSEHOLD
   - Add engagement types: SERVICE_REQUEST, CERTIFICATE, EVENT, ANNOUNCEMENT
   - Store civic data in existing `metadata` JSON field
   - **Impact: NONE** - Configuration only

2. **Billing Module Extension**
   - Configure dues/levy as subscription plans
   - Add penalty add-ons
   - Configure exemption discounts
   - **Impact: NONE** - Data configuration only

3. **HR Module Extension**
   - Assign service requests to staff members
   - **Impact: NONE** - Already supported

4. **CRM Campaigns Extension**
   - Configure civic announcement templates
   - **Impact: NONE** - Already supported

5. **New Services Required**
   - `civic/config.ts` - Labels, constants, enums
   - `civic/constituent-service.ts` - Wraps CRM for constituent management
   - `civic/dues-service.ts` - Wraps Billing for dues collection
   - `civic/service-request-service.ts` - Service request management
   - `civic/certificate-service.ts` - Certificate issuance
   - `civic/event-service.ts` - Event management
   - `civic/voting-service.ts` - Simple polls/elections
   - **Impact: NONE** - New code, no schema changes

---

## What Will NOT Be Built

1. ❌ Custom constituent database table
2. ❌ Custom certificate table
3. ❌ Custom voting table
4. ❌ Complex electoral systems (use INEC for government elections)
5. ❌ Full property tax assessment system
6. ❌ Court/legal case management
7. ❌ Birth/death registration (federal registry function)
8. ❌ Land registry (state function)
9. ❌ Complex GIS/mapping integration
10. ❌ Citizen portal (Partner activates access)

---

## What Will Be Reused

1. ✅ **CRM Module** - Constituent/member management
2. ✅ **CRM Engagement** - Service requests, events, certificates
3. ✅ **CRM Campaigns** - Announcements, reminders, notifications
4. ✅ **CRM Segmentation** - Ward/zone/unit grouping
5. ✅ **HR Staff Management** - Staff assignment for requests
6. ✅ **Billing Module** - Dues/levy management
7. ✅ **Payments Module** - Payment processing
8. ✅ **Invoice Model** - Due notices
9. ✅ **Product (SERVICE)** - Certificate fees, service fees
10. ✅ **Analytics** - Collection reports
11. ✅ **Capability Framework** - Module activation
12. ✅ **Partner-First Model** - Activation flow

---

## Architecture: Civic Suite Composition

```
┌─────────────────────────────────────────────────────────────┐
│                      CIVIC SUITE                            │
│        (Government/Community Management Solution)           │
└─────────────────────────────────────────────────────────────┘
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────────┐  ┌───────┐  ┌─────────┐
│  CRM  │  │Billing│  │  Payments │  │  HR   │  │   NEW   │
│       │  │       │  │           │  │       │  │Services │
│Member │  │ Dues  │  │ Collect   │  │ Staff │  │ Certs   │
│Engage │  │Levies │  │ Process   │  │Assign │  │ Voting  │
└───────┘  └───────┘  └───────────┘  └───────┘  └─────────┘
    │           │           │           │           │
    └───────────┴───────────┴───────────┴───────────┘
                            │
                    ┌───────────────┐
                    │  CRM Campaigns │
                    │  (Announcements│
                    │   & Reminders) │
                    └───────────────┘
```

---

## Nigerian Civic Use Cases

### Use Case 1: Estate/Resident Association

**Scenario:** Lekki Phase 1 Residents Association

| Function | Implementation |
|----------|----------------|
| Resident Registration | CRM Contact (type=MEMBER) with property details |
| Service Charges | Billing subscription (monthly) |
| Security Levy | Additional billing add-on |
| Complaint Logging | CRM Engagement (SERVICE_REQUEST) |
| Gate Pass System | Certificate issuance (VISITOR_PASS) |
| AGM Voting | Poll service for executive elections |
| Estate Announcements | CRM Campaign (SMS/Email) |

### Use Case 2: Local Government Revenue

**Scenario:** Ikeja Local Government Area

| Function | Implementation |
|----------|----------------|
| Taxpayer Registration | CRM Contact (type=CONSTITUENT) |
| Tenement Rate | Billing subscription (annual) |
| Business Levy | Additional billing plan |
| Complaints | CRM Engagement (SERVICE_REQUEST) |
| Certificates | Certificate service (Building Approval, etc.) |
| Public Notices | CRM Campaign (announcement) |

### Use Case 3: Town Union / CDA

**Scenario:** Ogbomosho Progressive Union, Lagos Chapter

| Function | Implementation |
|----------|----------------|
| Member Registration | CRM Contact (type=MEMBER) |
| Monthly Dues | Billing subscription |
| Development Levy | One-time billing adjustment |
| Meeting Attendance | Event engagement tracking |
| Election of Officers | Poll service |
| Hometown News | CRM Campaign (newsletter) |

### Use Case 4: Religious Organization

**Scenario:** Grace Community Church

| Function | Implementation |
|----------|----------------|
| Member Registration | CRM Contact (type=MEMBER) |
| Tithe Recording | Billing with flexible amounts |
| Offerings | One-time payments via Payments module |
| Welfare Requests | CRM Engagement (SERVICE_REQUEST) |
| Church Events | Event engagement |
| Announcements | CRM Campaign |

---

## Recommended Next Steps (S2-S5)

**S2: Core Services**
- Create `civic/config.ts` - Labels, constants, enums
- Create `civic/constituent-service.ts` - Wraps CRM for member management
- Create `civic/dues-service.ts` - Wraps Billing for dues collection
- Create `civic/service-request-service.ts` - Service request workflow
- Create `civic/certificate-service.ts` - Certificate issuance
- Create `civic/event-service.ts` - Event management
- Create `civic/voting-service.ts` - Simple poll service

**S3: API Routes**
- `/api/civic` - Suite configuration and activation
- `/api/civic/constituents` - Constituent CRUD (wraps CRM)
- `/api/civic/dues` - Dues/levy management (wraps Billing)
- `/api/civic/service-requests` - Service request management
- `/api/civic/certificates` - Certificate issuance
- `/api/civic/events` - Event management
- `/api/civic/voting` - Polls and elections

**S4: UI Pages**
- Civic Admin Dashboard
- Constituent Registry
- Dues Collection & Arrears
- Service Request Center
- Certificate Issuance
- Event Calendar & Management
- Voting/Polls Management
- Announcements Board

**S5: Demo Data & Documentation**
- Demo constituents, dues, requests
- Partner implementation guide

---

## Sign-off

| Item | Status |
|------|--------|
| Capability mapping complete | ✅ |
| Gap register documented | ✅ |
| Core impact assessment: NO CHANGES | ✅ |
| Partner-First compliance | ✅ |
| Ready for S2 (Services) | ✅ |

---

*Document Version: 1.0*
*Created: January 2026*
*Phase: S0-S1 Complete*
