# Partner Domain Models - Architecture Documentation

## Version
**Schema Version:** 1.1.0  
**Date:** 2025-01-01  
**Status:** Implemented

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM LEVEL                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PARTNER DOMAIN                               │   │
│  │                                                                      │   │
│  │   ┌──────────────┐         ┌───────────────────┐                    │   │
│  │   │   Partner    │────────▶│  PartnerAgreement │                    │   │
│  │   │              │   1:N   │  (versioned)      │                    │   │
│  │   │  - name      │         │  - version        │                    │   │
│  │   │  - slug      │         │  - commissionRate │                    │   │
│  │   │  - status    │         │  - effectiveFrom  │                    │   │
│  │   │  - tier      │         │  - status         │                    │   │
│  │   └──────┬───────┘         └─────────┬─────────┘                    │   │
│  │          │                           │                               │   │
│  │          │ 1:N                       │ 1:N                           │   │
│  │          ▼                           ▼                               │   │
│  │   ┌──────────────┐         ┌───────────────────┐                    │   │
│  │   │ PartnerUser  │         │  PartnerEarning   │◀─────┐             │   │
│  │   │              │         │                   │      │             │   │
│  │   │  - role      │         │  - grossAmount    │      │             │   │
│  │   │  - isActive  │         │  - commission     │      │             │   │
│  │   └──────┬───────┘         │  - status         │      │             │   │
│  │          │                 └───────────────────┘      │             │   │
│  │          │ N:1                                        │             │   │
│  │          ▼                                            │ 1:N         │   │
│  │   ┌──────────────┐                                    │             │   │
│  │   │     User     │ (existing model)                   │             │   │
│  │   └──────────────┘                                    │             │   │
│  │                                                       │             │   │
│  │   ┌──────────────┐         ┌───────────────────┐      │             │   │
│  │   │   Partner    │────────▶│PartnerReferralCode│      │             │   │
│  │   └──────────────┘   1:N   │                   │      │             │   │
│  │          │                 │  - code           │      │             │   │
│  │          │                 │  - usageLimit     │      │             │   │
│  │          │                 │  - expiresAt      │      │             │   │
│  │          │                 └─────────┬─────────┘      │             │   │
│  │          │                           │                │             │   │
│  │          │ 1:N                       │ 1:N            │             │   │
│  │          ▼                           ▼                │             │   │
│  │   ┌──────────────────────────────────────────────┐    │             │   │
│  │   │            PartnerReferral                   │────┘             │   │
│  │   │                (IMMUTABLE)                   │                  │   │
│  │   │                                              │                  │   │
│  │   │  - partnerId          - referredAt           │                  │   │
│  │   │  - tenantId           - attributionLocked    │                  │   │
│  │   │  - referralCodeId     - lockedAt             │                  │   │
│  │   └──────────────────────────┬───────────────────┘                  │   │
│  │                              │                                       │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 │ 1:1 (immutable)                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TENANT DOMAIN                                 │   │
│  │                                                                      │   │
│  │   ┌──────────────┐                                                  │   │
│  │   │    Tenant    │ (existing model)                                 │   │
│  │   │              │                                                  │   │
│  │   │  - name      │                                                  │   │
│  │   │  - slug      │                                                  │   │
│  │   │  - status    │                                                  │   │
│  │   └──────────────┘                                                  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Descriptions

### 1. Partner
**Purpose:** Represents a reseller/affiliate organization at platform level.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Company display name |
| slug | String | Unique URL-safe identifier |
| email | String | Primary contact email |
| status | Enum | PENDING → ACTIVE → SUSPENDED → TERMINATED |
| tier | Enum | BRONZE, SILVER, GOLD, PLATINUM |
| companyNumber | String? | Business registration |
| taxId | String? | Tax identification |

**Key Constraints:**
- Partners are NOT tenants (separate entity hierarchy)
- One partner can have multiple users, agreements, referral codes
- Status lifecycle is strictly controlled

---

### 2. PartnerUser
**Purpose:** Links a User to a Partner organization with a role.

| Field | Type | Description |
|-------|------|-------------|
| partnerId | FK | Reference to Partner |
| userId | FK | Reference to User |
| role | Enum | PARTNER_OWNER, PARTNER_ADMIN, PARTNER_MEMBER |
| isActive | Boolean | Can be deactivated without deletion |

**Key Constraints:**
- A user can belong to ONLY ONE partner (prevents conflicts)
- @@unique([userId]) enforces this at database level
- Deletion cascades from Partner

---

### 3. PartnerAgreement
**Purpose:** Versioned contract terms between platform and partner.

| Field | Type | Description |
|-------|------|-------------|
| partnerId | FK | Reference to Partner |
| version | Int | Sequential version number (1, 2, 3...) |
| effectiveFrom | DateTime | Start date |
| effectiveTo | DateTime? | End date (null = current) |
| commissionType | Enum | PERCENTAGE, FIXED, TIERED |
| commissionRate | Decimal | Rate (e.g., 0.1500 = 15%) |
| commissionTiers | JSON? | Tiered structure if applicable |
| status | Enum | DRAFT → ACTIVE → SUPERSEDED/TERMINATED |

**Key Constraints:**
- @@unique([partnerId, version]) - one version number per partner
- Only ONE agreement can be ACTIVE at a time per partner
- Previous agreements become SUPERSEDED when new one activates
- Earnings reference the agreement that was active at time of earning

---

### 4. PartnerReferralCode
**Purpose:** Trackable codes for attribution campaigns.

| Field | Type | Description |
|-------|------|-------------|
| partnerId | FK | Reference to Partner |
| code | String | Unique code (e.g., "PARTNER2024") |
| isActive | Boolean | Can be disabled |
| usageLimit | Int? | Maximum uses (null = unlimited) |
| usageCount | Int | Current usage count |
| expiresAt | DateTime? | Expiration (null = never) |
| campaignName | String? | Campaign identifier |

**Key Constraints:**
- Code is globally unique across all partners
- Soft controls (isActive, usageLimit, expiresAt) for flexibility

---

### 5. PartnerReferral ⚠️ IMMUTABLE
**Purpose:** Permanent attribution link between Partner and Tenant.

| Field | Type | Description |
|-------|------|-------------|
| partnerId | FK | Partner who referred |
| tenantId | FK | Tenant who was referred (UNIQUE) |
| referralCodeId | FK? | Code used (if any) |
| referredAt | DateTime | Timestamp of referral |
| attributionLocked | Boolean | True after first billing |
| lockedAt | DateTime? | When lock was applied |

**Key Constraints:**
- @@unique([tenantId]) - Each tenant can have ONLY ONE referral
- NO updatedAt field - intentionally immutable
- onDelete: Restrict - prevents accidental deletion
- attributionLocked becomes TRUE after first successful billing
- Once locked, the record CANNOT be modified or deleted

**Immutability Rules:**
1. Once created, partnerId and tenantId cannot change
2. After attributionLocked=true, NO modifications allowed
3. Application layer enforces these rules
4. Database constraints provide additional protection

---

### 6. PartnerEarning
**Purpose:** Tracks commissions earned per billing period.

| Field | Type | Description |
|-------|------|-------------|
| partnerId | FK | Partner earning commission |
| referralId | FK | Which referral generated this |
| agreementId | FK | Agreement terms at time of earning |
| periodStart | DateTime | Billing period start |
| periodEnd | DateTime | Billing period end |
| grossAmount | Decimal | Total billed to tenant |
| commissionRate | Decimal | Rate at time of earning |
| commissionAmount | Decimal | Calculated commission |
| status | Enum | PENDING → APPROVED → PAID |

**Key Constraints:**
- Links to specific agreement version (historical accuracy)
- Commission rate captured at creation (agreement may change later)
- onDelete: Restrict - earnings are permanent records

---

## Relationship Summary

| Relationship | Cardinality | Notes |
|--------------|-------------|-------|
| Partner → PartnerUser | 1:N | Multiple users per partner |
| Partner → PartnerAgreement | 1:N | Versioned agreements |
| Partner → PartnerReferralCode | 1:N | Multiple codes per partner |
| Partner → PartnerReferral | 1:N | Multiple tenant referrals |
| Partner → PartnerEarning | 1:N | Multiple earning records |
| User → PartnerUser | 1:1 | User can belong to ONE partner only |
| Tenant → PartnerReferral | 1:1 | Tenant has ONE referral (immutable) |
| PartnerReferralCode → PartnerReferral | 1:N | Code used for multiple referrals |
| PartnerAgreement → PartnerEarning | 1:N | Agreement governs multiple earnings |
| PartnerReferral → PartnerEarning | 1:N | Referral generates multiple earnings |

---

## Migration Plan

### Phase 1: Schema Creation (COMPLETED)
```bash
# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# Push to database (development)
npx prisma db push
```

### Phase 2: Production Migration (WHEN READY)
```bash
# Create migration file
npx prisma migrate dev --name add_partner_domain

# Deploy to production
npx prisma migrate deploy
```

### Phase 3: Data Migration (IF NEEDED)
If migrating existing reseller data:
1. Export existing data
2. Transform to new schema format
3. Import using seed script
4. Verify referential integrity

---

## Isolation Guarantees

### Partner ≠ Tenant
- Separate entity hierarchies
- No shared tables except User (via PartnerUser)
- Partner data not subject to tenant isolation rules

### Module Independence
- No module-specific fields in Partner models
- All models are product-agnostic
- Future modules (POS, SVM, MVM) consume these models

### Attribution Immutability
- PartnerReferral.tenantId has UNIQUE constraint
- No ON UPDATE CASCADE - changes blocked at DB level
- Application layer adds additional protection

---

## Audit Actions Added

```prisma
enum AuditAction {
  // ... existing actions ...
  
  // Partner actions
  PARTNER_CREATED
  PARTNER_UPDATED
  PARTNER_APPROVED
  PARTNER_SUSPENDED
  PARTNER_TERMINATED
  PARTNER_USER_ADDED
  PARTNER_USER_REMOVED
  PARTNER_AGREEMENT_CREATED
  PARTNER_AGREEMENT_SIGNED
  PARTNER_AGREEMENT_APPROVED
  PARTNER_REFERRAL_CREATED
  PARTNER_REFERRAL_LOCKED
  PARTNER_EARNING_CREATED
  PARTNER_EARNING_APPROVED
  PARTNER_EARNING_PAID
}
```
