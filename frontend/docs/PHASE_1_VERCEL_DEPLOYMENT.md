# PHASE 1 — VERCEL DUAL DEPLOYMENT (READ-ONLY)

**Document Type:** Deployment Execution Guide  
**Date:** January 9, 2026  
**Status:** READY FOR DEPLOYMENT  
**Classification:** Phase 1 — External Deployment

---

## Objective

Run the same WebWaka application on Vercel alongside Emergent, using:
- ✅ Same Supabase database
- ✅ Same auth flow
- ✅ Same governance
- ❌ No traffic cutover yet

---

## 1. Vercel Project Configuration

### Create Project

| Setting | Value |
|---------|-------|
| Source | GitHub repository (same as Emergent) |
| Framework | Next.js |
| App Router | Enabled |
| Node Version | 18.x |

### Build Settings

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

---

## 2. Environment Variables (CRITICAL)

Set these **EXACTLY** as in Emergent:

### Required (Database)

```
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project]:[password]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

### Required (Application)

```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_PLATFORM_NAME=WebWaka
NEXT_PUBLIC_DEMO_MODE_ENABLED=true
NEXT_PUBLIC_GOVERNANCE_LOCKED=true
```

### Required (Email - Resend)

```
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=noreply@webwaka.com
```

### Optional (Auth)

```
AUTH_SECRET=<generate-secure-secret>
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

---

## 3. Files Created for Deployment

| File | Purpose |
|------|---------|
| `/middleware.ts` | Edge middleware for domain resolution |
| `/vercel.json` | Vercel configuration |

---

## 4. Middleware Behavior

The Edge Middleware (`/middleware.ts`) handles:

1. **Domain Resolution**
   - Looks up hostname in domain registry
   - Resolves: domain → partner → tenant → suite

2. **Lifecycle Enforcement**
   - PENDING → Rewrite to `/domain-pending`
   - SUSPENDED → Rewrite to `/domain-suspended`
   - ACTIVE → Continue with headers

3. **Header Injection**
   - `x-ww-partner` — Partner slug
   - `x-ww-tenant` — Tenant slug
   - `x-ww-suite` — Primary suite
   - `x-ww-regulator-mode` — If applicable

### Excluded Domains

Middleware skips resolution for:
- `localhost`
- `127.0.0.1`
- `*.vercel.app`
- `*.emergent.*`

---

## 5. Domain Handling (Phase 1 Rules)

| Item | Status |
|------|--------|
| `*.vercel.app` domain | ✅ Allowed |
| Custom partner domains | ❌ NOT YET |
| DNS verification | ❌ NOT YET |
| Traffic switch | ❌ NOT YET |

---

## 6. Verification Checklist

### Functional Tests

- [ ] App loads on `*.vercel.app`
- [ ] Login works (demo accounts)
- [ ] Login works (real accounts)
- [ ] Same users visible as Emergent
- [ ] Audit logs appear in same DB
- [ ] Partner admin portal works
- [ ] Role banner displays correctly
- [ ] Permission gates enforced

### Data Persistence Tests

- [ ] Create test audit event on Vercel
- [ ] Verify visible in Emergent
- [ ] Create test on Emergent
- [ ] Verify visible on Vercel

### Governance Tests

- [ ] No demo-only code paths
- [ ] Same permission gates enforced
- [ ] Same role banner visible
- [ ] Same error boundary behavior

---

## 7. What Is STRICTLY FORBIDDEN in Phase 1

| Action | Allowed? |
|--------|----------|
| Attaching partner domains | ❌ NO |
| Changing DATABASE_URL | ❌ NO |
| Creating new auth providers | ❌ NO |
| Adding billing logic | ❌ NO |
| Environment-specific behavior | ❌ NO |
| Forking demo vs production | ❌ NO |

---

## 8. Success Criteria

### ✅ Phase 1 SUCCESS if:

- Vercel and Emergent show identical behavior
- Same DB records visible in both
- Same governance enforcement
- Zero schema or auth changes

### ❌ Phase 1 FAIL if:

- Any demo-only behavior reappears
- Any data divergence occurs
- Any new env-specific logic is added

---

## 9. Deployment Steps

### Step 1: Connect to GitHub

1. Go to Vercel Dashboard
2. Import Project
3. Select WebWaka repository
4. Choose `frontend` as root directory

### Step 2: Configure Build

1. Framework: Next.js
2. Build Command: `npm run build`
3. Install Command: `npm install`
4. Output Directory: `.next`

### Step 3: Set Environment Variables

Copy all variables from Section 2 above.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Verify deployment URL

### Step 5: Verify

Run through checklist in Section 6.

---

## 10. Next Phase Preview

After Phase 1 verification:

**Phase 2 — Partner Domain Attachment**
- Add DNS verification
- Activate domain lifecycle states
- Attach first real partner domain

---

**Document Prepared By:** E1 Agent  
**Document Date:** January 9, 2026  
**Deployment Status:** READY
