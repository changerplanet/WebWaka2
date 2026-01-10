# Civic Suite - Partner Implementation Guide

## Overview

The Civic Suite enables WebWaka partners to serve government and community organizations with comprehensive civic management tools. Built for the Nigerian context, it supports Local Government Areas (LGAs), Community Development Associations (CDAs), Estate/Resident Associations, Cooperatives, Religious Organizations, and more.

## Target Customers

| Organization Type | Examples | Primary Use Case |
|-------------------|----------|------------------|
| LGA/Municipal | Lagos Island LGA, Ikeja LGA | Revenue collection, certificates, permits |
| CDA | Community Development Associations | Development levies, community projects |
| Estate Association | Lekki Phase 1 Residents Association | Service charges, security, maintenance |
| Cooperative | Teacher's Cooperative, Market Cooperative | Savings, loans, bulk purchasing |
| Religious | Parish Council, Mosque Committee | Tithes, offerings, welfare |
| Traditional | Town Union, Age Grade | Cultural events, hometown development |

## Capability Modules

### 1. Constituent/Member Management
- Member registration and profiles
- Membership types: Resident, Landlord, Tenant, Business, Honorary
- Status tracking: Active, Pending, Suspended, Inactive
- Ward/Zone/Unit organization
- Property information
- Contribution history

**API Endpoints:**
- `GET /api/civic/constituents` - List members
- `POST /api/civic/constituents` - Create/update members

### 2. Dues & Levy Collection
- Multiple dues types: Service Charge, Security Levy, Development Levy, etc.
- Automated billing generation
- Payment recording with receipts
- Arrears tracking
- Exemption/waiver management
- Collection reports

**Dues Types:**
- Development Levy (Monthly)
- Service Charge (Monthly)
- Security Levy (Monthly)
- Tenement Rate (Annual)
- Membership Dues (Monthly)
- Special Levy (One-time)

**API Endpoints:**
- `GET /api/civic/dues` - List dues records
- `POST /api/civic/dues` - Record payments, generate bills

### 3. Service Request Management
- Request categories: Infrastructure, Security, Sanitation, Utilities, Complaints
- Priority levels with SLA tracking
- Assignment workflow
- Escalation on SLA breach
- Resolution tracking

**Request Categories:**
- Infrastructure (Street lights, roads, drainage)
- Security (Gate access, patrol requests)
- Sanitation (Waste collection)
- Utilities (Water, electricity issues)
- Complaints (Noise, parking violations)
- Certificate Requests

**API Endpoints:**
- `GET /api/civic/service-requests` - List requests
- `POST /api/civic/service-requests` - Create/update/resolve requests

### 4. Document & Certificate Issuance
- Certificate types with configurable fees
- Request and approval workflow
- QR code verification
- Validity tracking
- Revenue collection integration

**Certificate Types:**
| Type | Validity | Default Fee |
|------|----------|-------------|
| Good Standing | 6 months | ₦2,500 |
| Residency | 1 year | ₦3,000 |
| Character | 6 months | ₦2,000 |
| Membership | Permanent | ₦1,500 |
| Clearance | 3 months | ₦5,000 |
| Introduction Letter | 1 month | ₦1,000 |

**API Endpoints:**
- `GET /api/civic/certificates` - List certificates
- `GET /api/civic/certificates?verify=CODE` - Verify certificate
- `POST /api/civic/certificates` - Request/issue/revoke certificates

### 5. Event & Meeting Management
- Event types: AGM, Executive Meetings, Community Events
- Quorum tracking for formal meetings
- Agenda management
- Attendance recording
- Minutes upload

**Event Types:**
- Annual General Meeting (AGM)
- Emergency General Meeting (EGM)
- Executive Committee Meeting
- Ward Meeting
- Town Hall Meeting
- Community Event
- Sanitation Day

**API Endpoints:**
- `GET /api/civic/events` - List events
- `POST /api/civic/events` - Create/manage events

### 6. Communications & Announcements
- Bulk SMS campaigns
- Email newsletters
- Targeted messaging by ward/zone
- Announcement history

*Uses existing CRM Campaigns module*

### 7. Voting & Polls
- Election management (executive positions)
- Decision polls (Yes/No/Abstain)
- Budget approval votes
- Voter eligibility verification
- Anonymous voting with hash verification
- Result tabulation

**Poll Types:**
- Election (multiple positions, candidates)
- Decision Poll (proposal voting)
- Survey (opinion gathering)
- Budget Approval

**API Endpoints:**
- `GET /api/civic/voting` - List polls
- `POST /api/civic/voting` - Create polls, cast votes

## Demo Data

The suite includes demo data simulating "Harmony Estate Residents Association":

- **6 Members**: Mix of landlords, residents, tenants
- **7 Dues Records**: Service charges with various payment states
- **5 Service Requests**: Infrastructure, security, complaints
- **4 Certificates**: Good standing, residency certificates
- **4 Events**: AGM, executive meetings, sanitation day
- **3 Polls**: Executive election, CCTV proposal, budget approval

## UI Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/civic/admin` | Overview stats, quick actions |
| Members | `/civic/constituents` | Member list and management |

## Integration Notes

### Capability Reuse
The Civic Suite maximizes reuse of existing WebWaka capabilities:
- **CRM Module**: Member/constituent management
- **Billing Module**: Dues and levy management
- **Payments Module**: Payment processing
- **HR Module**: Staff assignment for requests
- **CRM Campaigns**: Communications

### Data Storage
Currently uses in-memory demo data. For production:
- Configure tenant-specific settings
- Connect to database models
- Enable real payment processing

## Nigerian Compliance

The suite is designed for Nigerian civic context:
- Naira (₦) currency formatting
- Nigerian phone number formats
- Ward/Zone/Unit organization structure
- Common Nigerian civic terminology
- Religious organization support (tithes, offerings)

## Getting Started

1. **Activate Civic Suite** for a tenant
2. **Import Members** via CSV or manual entry
3. **Configure Dues Types** and amounts
4. **Set Up Staff** for request assignment
5. **Create First Event** (e.g., Town Hall)

## Support

For partner support, contact WebWaka Partner Success team.

---

*Document Version: 1.0*
*Created: January 2026*
*Phase: S2-S5 Complete (Demo)*
