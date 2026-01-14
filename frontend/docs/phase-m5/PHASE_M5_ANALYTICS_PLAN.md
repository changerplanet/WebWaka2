# Phase M5 Analytics Plan

## Overview
Analytics readiness implementation with privacy-first, opt-in approach.

---

## Implementation Status

### Analytics Module Created
**File:** `frontend/src/lib/marketing/analytics.ts`

**Status:** ✅ DISABLED BY DEFAULT (Safe to Merge)

---

## Available Tracking Functions

### 1. Page View Tracking
```typescript
import { trackPageView } from '@/lib/marketing/analytics'

// Usage on route change
trackPageView('/suites', 'Industry Suites')
```

### 2. CTA Click Tracking
```typescript
import { trackCTAClick } from '@/lib/marketing/analytics'

// Usage on button click
trackCTAClick('Become a Partner', 'Homepage Hero', '/partners/get-started')
```

### 3. WhatsApp CTA Tracking
```typescript
import { trackWhatsAppClick } from '@/lib/marketing/analytics'

// Usage on WhatsApp button click
trackWhatsAppClick('Demo Page', 'Request demo walkthrough')
```

### 4. Demo Portal Tracking
```typescript
import { trackDemoExplore } from '@/lib/marketing/analytics'

// Usage when user explores demo
trackDemoExplore('demo-retail-store', 'Commerce Suite', 'enter')
```

### 5. Partner Funnel Tracking
```typescript
import { trackPartnerFunnel } from '@/lib/marketing/analytics'

// Usage in partner signup flow
trackPartnerFunnel('click_get_started', 'Digital Agency')
```

### 6. Suite Interest Tracking
```typescript
import { trackSuiteInterest } from '@/lib/marketing/analytics'

// Usage when user shows interest in a suite
trackSuiteInterest('Education Suite', 'service', 'expand')
```

---

## Environment Variables (Not Set - Analytics Disabled)

| Variable | Purpose | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Master switch for all analytics | NOT SET |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 tracking ID | NOT SET |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta/Facebook Pixel ID | NOT SET |

---

## Enabling Analytics (Future)

To enable analytics after Phase M5 approval:

### Step 1: Set Environment Variables
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 2: Add GA4 Script to Layout
```tsx
// In root layout or marketing layout
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {getAnalyticsScript()}
</Script>
```

### Step 3: Add Tracking Calls to Components
- Add `trackPageView` to route change handlers
- Add `trackCTAClick` to button click handlers
- Add `trackWhatsAppClick` to WhatsApp FAB component

---

## Event Tracking Matrix

### Pages & Expected Events

| Page | Events to Track |
|------|-----------------|
| / | page_view, cta_click (hero, partner-model, footer) |
| /suites | page_view, suite_interest (category expand), cta_click (demo, partner) |
| /sites-and-funnels | page_view, cta_click (get-started, demo) |
| /partners | page_view, partner_funnel, cta_click (WhatsApp, get-started) |
| /demo | page_view, demo_explore, whatsapp_click |

### CTA Tracking Locations

| CTA Name | Location | Destination |
|----------|----------|-------------|
| Become a Partner | Hero, Nav, Footer | /partners/get-started |
| Enter Demo Portal | Hero, Suites | /demo |
| WhatsApp Contact | FAB, Demo page | wa.me link |
| Get Started | Multiple sections | /partners/get-started |

---

## Privacy & Compliance

### Privacy-First Approach
1. **Analytics disabled by default** - No tracking without explicit enablement
2. **No cookies without consent** - GA4 configured for cookieless tracking when enabled
3. **No PII collection** - Only page views and anonymous events
4. **SSR-safe** - All tracking runs client-side only

### GDPR/NDPR Considerations
- [ ] Cookie consent banner (implement when enabling)
- [ ] Privacy policy update (document tracking)
- [ ] User opt-out mechanism

---

## Future Integrations (Not Implemented)

### Google Analytics 4 (GA4)
- Ready: Event structure defined
- Pending: Script integration, consent banner

### Meta Pixel
- Ready: Placeholder in analytics module
- Pending: Pixel ID, conversion events

### Custom Events
- Scroll depth tracking
- Form abandonment
- Time on page

---

## Debugging

### Check Analytics Status
```typescript
import { getAnalyticsStatus } from '@/lib/marketing/analytics'

console.log(getAnalyticsStatus())
// Output:
// {
//   enabled: false,
//   gaConfigured: false,
//   metaConfigured: false,
//   environment: 'development'
// }
```

### Development Console Logging
When `NODE_ENV=development` and analytics is enabled, all tracking calls log to console for debugging.

---

## Status
**COMPLETE** - Analytics hooks created and DISABLED by default.

## Recommendations for Production Enablement

1. **Implement Cookie Consent**
   - Use cookie consent library
   - Only enable analytics after consent

2. **Configure GA4**
   - Create GA4 property
   - Set up conversion goals
   - Configure data retention

3. **Set Up Reports**
   - Partner funnel visualization
   - Demo engagement dashboard
   - WhatsApp CTA effectiveness

4. **Monitor Privacy Compliance**
   - NDPR (Nigeria Data Protection Regulation)
   - GDPR (if serving EU visitors)
