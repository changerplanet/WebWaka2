# Education Suite - Partner Implementation Guide

## Overview

The Education Suite is a comprehensive school and university management solution built on the WebWaka platform. It leverages existing capabilities (CRM, HR, Billing) to provide:

- **Student Management** - Enrollment, profiles, guardian relationships
- **Academic Records** - Sessions, terms, classes, subjects
- **Grade Recording** - Score entry, GPA calculation, grade conversion
- **Attendance Tracking** - Daily attendance, reports, analytics
- **Fee Management** - Fee structures, invoices, payment collection
- **Report Cards** - Automated generation, remarks, transcripts

## Architecture

### Capability Composition
The Education Suite follows WebWaka's "Capability Composition" pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     EDUCATION SUITE                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Students   │  │  Academics  │  │   Grades    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │  Attendance │  │    Fees     │  │   Reports   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
├─────────┼────────────────┼────────────────┼─────────────────┤
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │  CRM/Contact│  │   Billing   │  │     HR      │         │
│  │   Module    │  │   Module    │  │   Module    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│                    WEBWAKA CORE PLATFORM                    │
└─────────────────────────────────────────────────────────────┘
```

### No New Schemas
The Education Suite stores all data using existing platform models:
- **Students** → CRM Contacts with `contactType: STUDENT` in metadata
- **Guardians** → CRM Contacts with `contactType: GUARDIAN` in metadata
- **Teachers** → HR Staff Members
- **Classes/Sessions** → Tenant configuration (in-memory for demo)
- **Fees** → Billing invoices and payments

## API Endpoints

### Main Education API
```
GET  /api/education?action=config          - Get suite configuration
GET  /api/education?action=solution-package - Partner solution info
POST /api/education                         - Activate suite / seed data
```

### Students API
```
GET    /api/education/students              - List students
GET    /api/education/students?id={id}      - Get single student
POST   /api/education/students              - Create student/guardian
PATCH  /api/education/students              - Update student
```

### Academic API
```
GET    /api/education/academic?resource=overview    - Full academic overview
GET    /api/education/academic?resource=classes     - List classes
GET    /api/education/academic?resource=subjects    - List subjects
POST   /api/education/academic                      - Create class/subject/session
PATCH  /api/education/academic                      - Update entities
DELETE /api/education/academic?resource=class&id={} - Delete class
```

### Grades API
```
GET  /api/education/grades?action=student-current  - Current term grades
GET  /api/education/grades?action=class-summary    - Class grade summary
POST /api/education/grades                         - Record grades
```

### Attendance API
```
GET  /api/education/attendance?action=overview        - Today's overview
GET  /api/education/attendance?action=class-attendance - Class attendance
POST /api/education/attendance                        - Mark attendance
```

### Fees API
```
GET  /api/education/fees?action=structures    - Fee structures
GET  /api/education/fees?action=defaulters    - Outstanding payments
POST /api/education/fees                      - Create structure/invoice/payment
```

### Report Cards API
```
GET  /api/education/report-cards?action=generate  - Generate report card
POST /api/education/report-cards                  - Bulk generate / add remarks
```

## UI Pages

| Path | Description |
|------|-------------|
| `/education/admin` | School admin dashboard with overview stats |
| `/education/students` | Student list with search/filter |
| `/education/grades` | Grade entry by class/subject |
| `/education/attendance` | Daily attendance marking |
| `/education/fees` | Fee collection and tracking |
| `/education/reports` | Report card generation |

## Nigerian Education System Support

### Grade Scales
- **WAEC Scale** (Default): A1 (75-100) to F9 (0-39)
- **NECO Scale**: Distinction, Credit, Pass, Fail
- **Primary Scale**: Simplified letter grades

### School Structure
- Junior Secondary: JSS 1-3 (Grades 7-9)
- Senior Secondary: SS 1-3 (Grades 10-12)
- Common sections: A, B, C or Science/Arts/Commercial

### Academic Calendar
- Three terms per session
- First Term: September - December
- Second Term: January - April
- Third Term: May - July

## Partner Activation Checklist

1. **Configure School Profile**
   - Set school name, address, contact details
   - Upload school logo

2. **Set Up Academic Structure**
   - Create/customize classes (JSS 1 - SS 3)
   - Define sections per class
   - Assign subjects to classes

3. **Import/Add Students**
   - Bulk import via CSV
   - Manual entry with guardian details
   - Generate admission numbers

4. **Configure Fee Structure**
   - Define fee categories (Tuition, Lab, Sports)
   - Set amounts per class
   - Configure payment schedules

5. **Add Teachers & Staff**
   - Create teacher profiles
   - Assign to classes/subjects
   - Set permissions

6. **Go Live**
   - Enable student/parent portal access
   - Start attendance tracking
   - Begin fee collection

## Pricing Recommendations

| Tier | Max Students | Monthly (NGN) |
|------|--------------|---------------|
| Starter | 200 | ₦5,000 |
| Professional | 1,000 | ₦15,000 |
| Enterprise | Unlimited | Custom |

## Technical Notes

### Current Limitations (Demo Implementation)
- Academic configuration stored in-memory (resets on server restart)
- Student data uses demo stubs - requires schema extension for production
- Report card generation returns empty results pending grade data

### Production Requirements
- Add `metadata` JSON field to Tenant model for education config
- Extend Customer model for student-specific fields OR create Education-specific models
- Implement proper data persistence for all services

## Support

For partner support, contact: partners@webwaka.com
Technical documentation: https://docs.webwaka.com/education
