# Demo Suite Priority Matrix

**Document Type:** Design Document (READ-ONLY)  
**Date:** January 14, 2026  
**Scope:** Demo Partner Only  
**Status:** DESIGN ONLY - NO EXECUTION

---

## Priority Classification

### Classification Definitions

| Level | Classification | Definition |
|-------|---------------|------------|
| P0 | REQUIRED FOR DEMO | Must have seeded data; critical for sales demo |
| P1 | HIGH PRIORITY | Should have data; important for demo narrative |
| P2 | OPTIONAL | Nice to have; static/empty-state acceptable |
| P3 | NOT REQUIRED | Hidden or admin-only; no demo value |

---

## Suite Priority Matrix

| Suite | Priority | Demo Necessity | Demo Tenant | Seed Script Status |
|-------|----------|----------------|-------------|-------------------|
| **Commerce/POS** | P0 | REQUIRED | demo-retail-store | EXISTS (not run) |
| **Commerce/SVM** | P0 | REQUIRED | demo-retail-store | EXISTS (not run) |
| **Commerce/MVM** | P0 | REQUIRED | demo-marketplace | EXISTS (not run) |
| **Commerce/Inventory** | P0 | REQUIRED | demo-retail-store | NEEDS CREATION |
| **Education** | P0 | REQUIRED | demo-school | NEEDS CREATION |
| **Health** | P0 | REQUIRED | demo-clinic | NEEDS CREATION |
| **Hospitality** | P1 | HIGH PRIORITY | demo-hotel | NEEDS CREATION |
| **Civic** | P1 | HIGH PRIORITY | demo-civic | NEEDS CREATION |
| **Recruitment** | P1 | HIGH PRIORITY | demo-recruitment | EXISTS (not run) |
| **Project Mgmt** | P1 | HIGH PRIORITY | demo-project | EXISTS (not run) |
| **Legal Practice** | P1 | HIGH PRIORITY | demo-legal | EXISTS (not run) |
| **Warehouse** | P1 | HIGH PRIORITY | demo-warehouse | EXISTS (not run) |
| **Church** | P2 | OPTIONAL | demo-church | NEEDS CREATION |
| **Political** | P2 | OPTIONAL | demo-political | NEEDS CREATION |
| **Real Estate** | P2 | OPTIONAL | demo-real-estate | NEEDS CREATION |
| **Logistics** | P2 | OPTIONAL | demo-logistics | NEEDS CREATION |
| **HR** | P2 | OPTIONAL | TBD | NEEDS CREATION |
| **Sites & Funnels** | P2 | OPTIONAL | TBD | NEEDS CREATION |
| **Marketing** | P3 | NOT REQUIRED | N/A | N/A |
| **Procurement** | P3 | NOT REQUIRED | N/A | N/A |
| **B2B** | P3 | NOT REQUIRED | demo-b2b | N/A |

---

## Detailed Justifications

### P0: REQUIRED FOR DEMO

#### Commerce/POS
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Core revenue driver; retail is primary market segment |
| **Demo Risk if Omitted** | Cannot demonstrate primary product functionality |
| **Sales Impact** | CRITICAL - Most demos start with POS |
| **Demo Tenant** | Lagos Retail Store (demo-retail-store) |
| **Key Entities** | Products, Sales, Shifts, Cash movements |

#### Commerce/SVM (Online Store)
| Aspect | Detail |
|--------|--------|
| **Business Justification** | E-commerce is high-growth segment |
| **Demo Risk if Omitted** | Cannot show online selling capability |
| **Sales Impact** | HIGH - Modern businesses expect online presence |
| **Demo Tenant** | Lagos Retail Store (demo-retail-store) |
| **Key Entities** | Orders, Carts, Products, Promotions |

#### Commerce/MVM (Marketplace)
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Platform differentiator; multi-vendor capability |
| **Demo Risk if Omitted** | Cannot demonstrate platform scale |
| **Sales Impact** | HIGH - Enterprise deals require marketplace demo |
| **Demo Tenant** | Naija Market Hub (demo-marketplace) |
| **Key Entities** | Vendors, Commissions, Sub-orders, Payouts |

#### Commerce/Inventory
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Foundation for all commerce modules |
| **Demo Risk if Omitted** | Empty product catalogs break demos |
| **Sales Impact** | CRITICAL - No products = no sales demo |
| **Demo Tenant** | Shared across commerce tenants |
| **Key Entities** | Products, Categories, Stock levels, Warehouses |

#### Education
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Large addressable market in Africa |
| **Demo Risk if Omitted** | Lose school management vertical entirely |
| **Sales Impact** | HIGH - Education is top-3 vertical |
| **Demo Tenant** | Bright Future Academy (demo-school) |
| **Key Entities** | Students, Classes, Fees, Grades, Attendance |

#### Health
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Growing healthcare digitization market |
| **Demo Risk if Omitted** | Cannot compete in healthcare vertical |
| **Sales Impact** | HIGH - Clinics are active buyers |
| **Demo Tenant** | HealthFirst Clinic (demo-clinic) |
| **Key Entities** | Patients, Appointments, Encounters, Prescriptions |

---

### P1: HIGH PRIORITY

#### Hospitality
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Hotels/restaurants are mature buyers |
| **Demo Risk if Omitted** | Weak demo for hospitality leads |
| **Sales Impact** | MEDIUM-HIGH - Good revenue potential |
| **Demo Tenant** | PalmView Suites Lagos (demo-hotel) |
| **Key Entities** | Rooms, Reservations, Guests, Housekeeping |

#### Civic
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Government/community digitization trend |
| **Demo Risk if Omitted** | Cannot demo for civic organizations |
| **Sales Impact** | MEDIUM - Niche but valuable |
| **Demo Tenant** | Lagos State Lands Bureau (demo-civic) |
| **Key Entities** | Citizens, Services, Cases, Voting |

#### Recruitment
| Aspect | Detail |
|--------|--------|
| **Business Justification** | HR tech is growing segment |
| **Demo Risk if Omitted** | Miss recruitment agency market |
| **Sales Impact** | MEDIUM - Good upsell potential |
| **Demo Tenant** | Swift HR Solutions (demo-recruitment) |
| **Key Entities** | Jobs, Applications, Interviews, Offers |

#### Project Management
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Cross-industry applicability |
| **Demo Risk if Omitted** | Cannot show project tracking |
| **Sales Impact** | MEDIUM - Useful add-on for any vertical |
| **Demo Tenant** | BuildRight Projects Ltd (demo-project) |
| **Key Entities** | Projects, Tasks, Milestones, Team |

#### Legal Practice
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Underserved market in Africa |
| **Demo Risk if Omitted** | Miss law firm opportunities |
| **Sales Impact** | MEDIUM - Premium pricing potential |
| **Demo Tenant** | Nwosu & Associates Chambers (demo-legal) |
| **Key Entities** | Matters, Time entries, Retainers, Filings |

#### Warehouse
| Aspect | Detail |
|--------|--------|
| **Business Justification** | Enterprise logistics capability |
| **Demo Risk if Omitted** | Cannot demo advanced fulfillment |
| **Sales Impact** | MEDIUM - Enterprise differentiator |
| **Demo Tenant** | Lagos Fulfillment Center (demo-warehouse) |
| **Key Entities** | Zones, Bins, Pick lists, Receipts |

---

### P2: OPTIONAL (Static Demo OK)

| Suite | Reason | Fallback Strategy |
|-------|--------|------------------|
| Church | Niche vertical, can demo empty-state | Show UI structure, explain capability |
| Political | Very niche, seasonal need | Show UI structure, explain capability |
| Real Estate | Can show property forms empty | Walkthrough form completion |
| Logistics | Dependent on commerce flow | Demo as part of commerce workflow |
| HR | Internal tool, less external demo | Show forms and workflow UI |
| Sites & Funnels | Visual tool, UI speaks for itself | Show template gallery |

---

### P3: NOT REQUIRED FOR DEMO

| Suite | Reason |
|-------|--------|
| Marketing | Backend automation, not demo-visible |
| Procurement | Internal ops, not customer-facing demo |
| B2B | Subset of commerce, covered by MVM |

---

## Demo Data Depth Recommendations

| Suite | Level | Depth | Rationale |
|-------|-------|-------|-----------|
| Commerce/POS | Level 3 | Narrative | Full transaction history for reports |
| Commerce/SVM | Level 3 | Narrative | Order history, cart abandonment |
| Commerce/MVM | Level 3 | Narrative | Multi-vendor scenarios |
| Inventory | Level 2 | Functional | Products for workflows |
| Education | Level 3 | Narrative | Student history, grades, attendance |
| Health | Level 3 | Narrative | Patient history, appointments |
| Hospitality | Level 2 | Functional | Rooms, reservations workflow |
| Civic | Level 2 | Functional | Service request workflow |
| Recruitment | Level 2 | Functional | Hiring pipeline |
| Project Mgmt | Level 2 | Functional | Project lifecycle |
| Legal Practice | Level 2 | Functional | Case lifecycle |
| Warehouse | Level 2 | Functional | Pick/pack workflow |
| Church | Level 1 | Minimal | Basic member list |
| Political | Level 1 | Minimal | Basic party structure |
| Real Estate | Level 1 | Minimal | Property listings |
| Logistics | Level 1 | Minimal | Basic delivery zones |
| HR | Level 0 | Hidden | Not demo priority |
| Sites & Funnels | Level 1 | Minimal | Template gallery |

---

## Execution Priority Order

### Sprint 1 (Critical Path)
1. Commerce/Inventory (foundation)
2. Commerce/POS
3. Commerce/SVM
4. Commerce/MVM

### Sprint 2 (Core Verticals)
5. Education
6. Health
7. Hospitality
8. Civic

### Sprint 3 (Specialized)
9. Recruitment
10. Project Management
11. Legal Practice
12. Advanced Warehouse

### Sprint 4 (Nice-to-Have)
13. Church
14. Political
15. Real Estate
16. Logistics

---

*End of Demo Suite Priority Matrix*
