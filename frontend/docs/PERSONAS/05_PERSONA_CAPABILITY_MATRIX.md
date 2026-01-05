# Persona × Capability Matrix
## WebWaka Platform - Persona Extraction Document 05
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Overview

This matrix maps what each persona can do per capability, based on existing permissions.

**Legend:**
- **Full** - Complete read/write access
- **Limited** - Partial access (view or specific operations)
- **None** - No access

---

## Platform-Level Capabilities

| Capability | SUPER_ADMIN | PARTNER_OWNER | PARTNER_ADMIN | PARTNER_SALES | PARTNER_SUPPORT | PARTNER_STAFF |
|------------|-------------|---------------|---------------|---------------|-----------------|---------------|
| tenant_management | Full | None* | None* | None* | None* | None* |
| user_management | Full | None | None | None | None | None |
| capability_governance | Full | None | None | None | None | None |
| platform_config | Full | None | None | None | None | None |
| audit_logs | Full | None | None | None | None | None |
| partner_management | Full | Own** | Own** | Own** | Own** | Own** |
| impersonation | Full | None | None | None | None | None |

*Partners cannot access tenant internals but can CREATE tenants
**Partners can only view/manage their own partner organization

---

## Partner Capabilities

| Capability | SUPER_ADMIN | PARTNER_OWNER | PARTNER_ADMIN | PARTNER_SALES | PARTNER_SUPPORT | PARTNER_STAFF |
|------------|-------------|---------------|---------------|---------------|-----------------|---------------|
| client_creation | Full | Full | Full | Full | None | None |
| referral_codes | Full | Full | Full | Full | None | Full |
| view_all_referrals | Full | Full | Full | None | None | None |
| view_own_referrals | Full | Full | Full | Full | None | Full |
| view_all_earnings | Full | Full | Full | None | None | None |
| view_own_earnings | Full | Full | Full | Full | None | Limited |
| export_earnings | Full | Full | Full | None | None | None |
| partner_settings | Full | Full | None | None | None | None |
| agreement_signing | Approve | Full | None | None | None | None |

---

## Tenant-Level Capabilities (Commerce)

| Capability | TENANT_ADMIN | TENANT_USER | Customer | Vendor |
|------------|--------------|-------------|----------|--------|
| pos | Full | Full | None | None |
| svm (Storefront) | Full | Limited | Browse/Purchase | None |
| mvm (Marketplace) | Full | Limited | Browse/Purchase | Full (Own Products) |
| inventory | Full | Limited | None | Own Only |
| product_management | Full | Limited | None | Own Only |
| order_management | Full | Full | Own Only | Own Only |
| customer_data | Full | Limited | Own Only | None |
| pricing_config | Full | None | None | Own Only |

---

## Tenant-Level Capabilities (Finance)

| Capability | TENANT_ADMIN | TENANT_USER | External |
|------------|--------------|-------------|----------|
| accounting | Full | None | N/A |
| payments | Full | Limited | N/A |
| subscriptions_billing | Full | None | N/A |
| compliance_tax | Full | None | N/A |
| financial_reports | Full | None | N/A |

---

## Tenant-Level Capabilities (Operations)

| Capability | TENANT_ADMIN | TENANT_USER | Driver | Customer |
|------------|--------------|-------------|--------|----------|
| crm | Full | Limited | None | Target |
| logistics | Full | Limited | Full | Track Only |
| hr_payroll | Full | Own Only | N/A | N/A |
| procurement | Full | Limited | N/A | N/A |
| analytics | Full | Limited | N/A | N/A |
| marketing | Full | Limited | N/A | Target |
| b2b | Full | Limited | N/A | N/A |

---

## Planned Capabilities (Not Yet Implemented)

| Capability | Status | Domain |
|------------|--------|--------|
| school_attendance | Planned | Education |
| school_grading | Planned | Education |
| patient_records | Planned | Healthcare |
| appointment_scheduling | Planned | Healthcare |
| hotel_rooms | Planned | Hospitality |
| hotel_reservations | Planned | Hospitality |

---

## Access Control Sources

### API Guards
- `requireSuperAdmin()` - Super Admin only
- `requirePartnerAccess()` - Partner members
- `requireTenantAdmin()` - Tenant admins
- `requireTenantMember()` - Any tenant member
- `requireCapability()` - Capability-specific

### UI Guards
- `/app/admin/*` - Super Admin sidebar/layout
- `/dashboard/partner/*` - Partner dashboard
- `/dashboard/*` - Tenant dashboard

### Capability Registry
- `lib/capabilities/registry.ts` - Capability definitions
- `TenantCapability` model - Per-tenant activation

---

## Notes

1. **Super Admin** has read access to everything but cannot operate within tenants
2. **Partners** can create clients but cannot access client internals
3. **Tenant Admin** has full access to all activated capabilities
4. **Tenant User** access varies by capability design (some view-only, some operational)
5. **External users** (Customer, Vendor) have strictly scoped access to own data

---

**Document Status:** EXTRACTION COMPLETE
