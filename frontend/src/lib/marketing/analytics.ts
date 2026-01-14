/**
 * Marketing Analytics Hooks (Phase M5.4)
 * 
 * IMPORTANT: All analytics are DISABLED by default.
 * This file provides placeholder hooks for future analytics integration.
 * 
 * To enable analytics:
 * 1. Set NEXT_PUBLIC_ENABLE_ANALYTICS=true in environment
 * 2. Add GA4 tracking ID to NEXT_PUBLIC_GA_MEASUREMENT_ID
 * 3. Add Meta Pixel ID to NEXT_PUBLIC_META_PIXEL_ID (if needed)
 * 
 * Privacy-first approach:
 * - No cookies without consent
 * - No PII collection
 * - SSR-safe (runs only in browser)
 */

// Check if analytics is enabled
const isAnalyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
}

// Check if we're in browser
const isBrowser = (): boolean => typeof window !== 'undefined'

/**
 * Page view tracking
 * Call on route changes for SPA navigation
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isBrowser() || !isAnalyticsEnabled()) return
  
  // GA4 placeholder
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    })
  }
  
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page view:', { path, title })
  }
}

/**
 * CTA click tracking
 * Track clicks on important CTAs
 */
export const trackCTAClick = (
  ctaName: string,
  ctaLocation: string,
  destination?: string
): void => {
  if (!isBrowser() || !isAnalyticsEnabled()) return
  
  // GA4 placeholder
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
      destination: destination,
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] CTA click:', { ctaName, ctaLocation, destination })
  }
}

/**
 * WhatsApp CTA tracking
 * Special tracking for WhatsApp contact buttons
 */
export const trackWhatsAppClick = (
  source: string,
  message?: string
): void => {
  if (!isBrowser() || !isAnalyticsEnabled()) return
  
  // GA4 placeholder
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'whatsapp_click', {
      source: source,
      message_type: message ? 'custom' : 'default',
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] WhatsApp click:', { source, message })
  }
}

/**
 * Demo portal tracking
 * Track demo tenant selections and exploration
 */
export const trackDemoExplore = (
  tenantSlug: string,
  suiteName: string,
  action: 'view' | 'enter' | 'explore'
): void => {
  if (!isBrowser() || !isAnalyticsEnabled()) return
  
  // GA4 placeholder
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'demo_explore', {
      tenant_slug: tenantSlug,
      suite_name: suiteName,
      action: action,
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Demo explore:', { tenantSlug, suiteName, action })
  }
}

/**
 * Partner signup funnel tracking
 */
export const trackPartnerFunnel = (
  step: 'view_page' | 'click_get_started' | 'start_form' | 'submit_form',
  partnerType?: string
): void => {
  if (!isBrowser() || !isAnalyticsEnabled()) return
  
  // GA4 placeholder
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'partner_funnel', {
      funnel_step: step,
      partner_type: partnerType,
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Partner funnel:', { step, partnerType })
  }
}

/**
 * Suite interest tracking
 * Track which suites users are most interested in
 */
export const trackSuiteInterest = (
  suiteName: string,
  category: string,
  action: 'view' | 'click' | 'expand'
): void => {
  if (!isBrowser() || !isAnalyticsEnabled()) return
  
  // GA4 placeholder
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'suite_interest', {
      suite_name: suiteName,
      category: category,
      action: action,
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Suite interest:', { suiteName, category, action })
  }
}

/**
 * Analytics initialization script (for layout)
 * Returns null - GA4 script should be added when analytics is enabled
 */
export const getAnalyticsScript = (): string | null => {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!gaId || !isAnalyticsEnabled()) return null
  
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `
}

/**
 * Analytics status checker for debugging
 */
export const getAnalyticsStatus = (): {
  enabled: boolean
  gaConfigured: boolean
  metaConfigured: boolean
  environment: string
} => {
  return {
    enabled: isAnalyticsEnabled(),
    gaConfigured: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    metaConfigured: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
    environment: process.env.NODE_ENV || 'unknown',
  }
}
