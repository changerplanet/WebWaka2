# Real Estate Management Suite — User Guide

## Document Info
- **Suite**: Real Estate Management
- **Phase**: 7A
- **Version**: Demo-Ready v1
- **Status**: FROZEN (Production-grade)
- **Date**: January 2026

---

## 1️⃣ OVERVIEW

The **Real Estate Management** suite enables property managers, landlords, and estate agents to manage their rental property portfolios. It provides comprehensive tools for:

- **Property Management**: Register and track properties
- **Unit Management**: Manage individual units within properties
- **Lease Management**: Create and manage tenant agreements
- **Rent Collection**: Track payments and arrears
- **Maintenance Requests**: Handle tenant service requests

### Target Users
- Property Managers
- Landlords (Direct)
- Estate Agents
- Facility Managers

### Nigeria-First Defaults
- Currency: Nigerian Naira (NGN)
- Address Format: Nigerian states, LGAs, landmarks
- Rent Frequency: Annual rent (common in Nigeria)
- Phone Format: Nigerian mobile numbers

---

## 2️⃣ GETTING STARTED

### Accessing the Suite
1. Navigate to `/real-estate-suite` from the dashboard
2. The main dashboard shows:
   - Portfolio overview (properties, units, occupancy)
   - Financial summary (monthly income, collection rate)
   - Alerts (expiring leases, overdue rent, emergencies)
   - Quick action buttons

### First Steps
1. **Add a Property**: Click "Add Property" to register your first property
2. **Add Units**: Create units within the property
3. **Create a Lease**: Assign a tenant to a unit
4. **Generate Rent Schedule**: Create payment schedule for the lease

---

## 3️⃣ PROPERTIES

### Property Types
| Type | Description |
|------|-------------|
| RESIDENTIAL | Houses, apartments, flats |
| COMMERCIAL | Shops, offices, warehouses |
| MIXED | Combined residential/commercial |
| LAND | Undeveloped land |

### Property Status
| Status | Meaning |
|--------|---------|
| AVAILABLE | Has vacant units |
| OCCUPIED | All units occupied |
| MAINTENANCE | Under renovation/repair |
| UNLISTED | Not actively managed |

### Adding a Property
1. Navigate to Properties → Add Property
2. Enter:
   - Property name
   - Type (Residential, Commercial, etc.)
   - Address (including State, LGA, landmark)
   - Owner details (optional)
   - Photos and documents
3. Save the property

### Property Dashboard
Each property shows:
- Unit breakdown (total, vacant, occupied)
- Current monthly rent potential
- Active maintenance requests
- Linked owner information

---

## 4️⃣ UNITS

### Unit Types
| Type | Typical Use |
|------|-------------|
| FLAT | Residential apartment |
| ROOM | Single room rental |
| SHOP | Commercial retail space |
| OFFICE | Commercial office space |
| WAREHOUSE | Storage/industrial |
| PARKING | Parking space |

### Unit Status
| Status | Meaning |
|--------|---------|
| VACANT | Available for rent |
| OCCUPIED | Has active tenant |
| RESERVED | Lease pending |
| MAINTENANCE | Under repair |

### Adding a Unit
1. Navigate to a property → Add Unit
2. Enter:
   - Unit number (e.g., "Flat 1A", "Shop B2")
   - Type
   - Specifications (bedrooms, bathrooms, size)
   - Monthly rent (NGN)
   - Service charge (optional)
   - Caution deposit
3. Save the unit

---

## 5️⃣ LEASES

### Creating a Lease
1. Navigate to Leases → New Lease
2. Select a vacant unit
3. Enter tenant details:
   - Name, phone, email
   - CRM contact link (optional)
4. Set lease terms:
   - Start and end dates
   - Monthly rent
   - Service charge
   - Security deposit
   - Rent frequency (Monthly, Quarterly, Biannually, Annually)
5. Save as Draft
6. Activate when tenant signs

### Lease Status Flow
```
DRAFT → ACTIVE → EXPIRED/TERMINATED/RENEWED
```

### Lease Actions
| Action | When to Use |
|--------|-------------|
| Activate | Tenant has signed, move-in ready |
| Terminate | Early termination with reason |
| Renew | Create new lease for extension |

### Expiring Leases
The dashboard alerts you to leases expiring within 30 days. Take action to:
- Renew the lease
- Start tenant exit process
- List unit for new tenant

---

## 6️⃣ RENT COLLECTION

### Payment Status
| Status | Meaning |
|--------|---------|
| PENDING | Not yet due or awaiting payment |
| PAID | Fully paid |
| PARTIAL | Part payment received |
| OVERDUE | Past due date, unpaid |
| WAIVED | Payment exempted |

### Generating Rent Schedules
When a lease is activated:
1. Navigate to the lease
2. Click "Generate Rent Schedule"
3. System creates payment entries based on:
   - Rent frequency
   - Lease duration
   - Monthly rent + service charge

### Recording Payments
1. Navigate to Rent Schedules
2. Find the payment record
3. Click "Record Payment"
4. Enter:
   - Amount paid
   - Payment date
   - Reference number
   - Receipt number

### Arrears Management
The system automatically:
- Marks payments as OVERDUE after due date
- Calculates late fees (configurable)
- Generates arrears report by tenant

### Arrears Report
Access via Rent Schedules → "Arrears Report" to see:
- All tenants with outstanding payments
- Total arrears per tenant
- Contact information for follow-up

---

## 7️⃣ MAINTENANCE REQUESTS

### Request Categories
| Category | Examples |
|----------|----------|
| PLUMBING | Leaks, blocked drains, water heater |
| ELECTRICAL | Power outlets, lighting, wiring |
| STRUCTURAL | Cracks, roof, walls, floors |
| HVAC | Air conditioning, ventilation |
| CLEANING | Deep cleaning, pest control |
| SECURITY | Locks, doors, gates, alarms |
| OTHER | Miscellaneous |

### Priority Levels
| Priority | Response Time |
|----------|---------------|
| LOW | Within 7 days |
| MEDIUM | Within 3 days |
| HIGH | Within 24 hours |
| EMERGENCY | Immediate |

### Request Status Flow
```
OPEN → ASSIGNED → IN_PROGRESS → COMPLETED
                              ↳ CANCELLED
```

### Creating a Request
1. Navigate to Maintenance → New Request
2. Select property and unit (if applicable)
3. Enter:
   - Title (brief description)
   - Category
   - Priority
   - Detailed description
   - Requester contact
   - Photos (before)
4. Submit

### Managing Requests
| Action | When |
|--------|------|
| Assign | Assign to technician/vendor |
| Start Work | Technician begins |
| Complete | Work finished, add resolution notes |
| Cancel | Request no longer needed |

### Completion
When marking complete:
- Add actual cost
- Upload "after" photos
- Write resolution notes

---

## 8️⃣ REPORTS & ANALYTICS

### Dashboard Metrics
- **Occupancy Rate**: % of units occupied
- **Collection Rate**: % of rent collected vs due
- **Monthly Income**: Total from active leases
- **Vacancy Rate**: % of units vacant

### Available Reports
1. **Property Summary**: All properties with key stats
2. **Vacancy Report**: List of vacant units
3. **Arrears Report**: Outstanding rent by tenant
4. **Maintenance Costs**: Expenses by category
5. **Expiring Leases**: Leases ending soon

---

## 9️⃣ BEST PRACTICES

### Property Management
- Keep property photos updated
- Document all property documents (C of O, receipts)
- Regularly update amenities list

### Lease Management
- Always start with a DRAFT lease
- Collect security deposit before activation
- Generate rent schedule immediately after activation
- Set calendar reminders for expiring leases

### Rent Collection
- Record payments same-day
- Follow up on overdue payments within 7 days
- Apply late fees consistently
- Keep payment references for disputes

### Maintenance
- Respond to EMERGENCY requests immediately
- Document all work with photos
- Track costs for budgeting
- Regular preventive maintenance reduces emergencies

---

## 🔧 TROUBLESHOOTING

### Common Issues

**Q: Unit shows VACANT but has active lease**
A: Check lease status. If DRAFT, activate it.

**Q: Rent schedule not generated**
A: Manually generate from lease detail page.

**Q: Can't delete property**
A: Remove all active leases first.

**Q: Payment not updating status**
A: Ensure paid amount >= total due for PAID status.

---

## 📞 SUPPORT

For assistance:
- Email: support@webwaka.com
- Documentation: docs.webwaka.com/real-estate
- In-app: Help → Real Estate Guide

---

## 📋 APPENDIX: Nigerian States

The suite includes all 36 Nigerian states plus FCT:
- Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa
- Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti
- Enugu, **FCT (Abuja)**, Gombe, Imo, Jigawa, Kaduna
- Kano, Katsina, Kebbi, Kogi, Kwara, **Lagos**, Nasarawa
- Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers
- Sokoto, Taraba, Yobe, Zamfara

### Popular LGAs (Lagos)
- Ikeja, Lekki, Victoria Island, Ikoyi
- Surulere, Yaba, Ajah, Apapa
- Ojo, Alimosho, Agege, Mushin

---

*Document Version: 1.0 | Last Updated: January 2026*
