/**
 * eMarketWaka Branding Configuration
 * 
 * Central configuration for platform branding.
 * Tenants can override these with their own branding.
 */

export const PLATFORM_BRANDING = {
  // Platform Identity
  name: 'eMarketWaka',
  tagline: 'Complete Commerce Platform',
  description: 'POS, Online Store & Marketplace — all in one platform',
  
  // Domain Configuration
  primaryDomain: 'emarketwaka.com',
  subdomainSuffix: '.emarketwaka.com',
  cnameTarget: 'cname.emarketwaka.com',
  dnsVerifyPrefix: '_emarketwaka-verify',
  
  // Default Colors (can be overridden by tenant)
  colors: {
    primary: '#6366f1',      // Indigo
    secondary: '#8b5cf6',    // Purple
    accent: '#f59e0b',       // Amber
    success: '#10b981',      // Emerald
    warning: '#f59e0b',      // Amber
    error: '#ef4444',        // Red
  },
  
  // Default Gradients
  gradients: {
    hero: 'from-indigo-600 via-purple-600 to-pink-500',
    card: 'from-slate-50 to-white',
    button: 'from-indigo-600 to-purple-600',
  },
  
  // Module Names (user-facing)
  modules: {
    pos: {
      name: 'eMarketWaka POS',
      shortName: 'POS',
      description: 'Touch-first point of sale system',
    },
    svm: {
      name: 'eMarketWaka Store',
      shortName: 'Store',
      description: 'Single-vendor e-commerce storefront',
    },
    mvm: {
      name: 'eMarketWaka Marketplace',
      shortName: 'Marketplace',
      description: 'Multi-vendor marketplace platform',
    },
  },
  
  // Footer & Legal
  copyright: `© ${new Date().getFullYear()} eMarketWaka. All rights reserved.`,
  companyName: 'eMarketWaka',
  
  // Social Links (optional)
  social: {
    twitter: null,
    facebook: null,
    instagram: null,
    linkedin: null,
  },
  
  // Support
  support: {
    email: 'support@emarketwaka.com',
    docs: 'https://docs.emarketwaka.com',
  },
  
  // SEO Defaults
  seo: {
    title: 'eMarketWaka - Complete Commerce Platform',
    description: 'POS, Online Store & Marketplace for African businesses. Multi-tenant, white-label ready.',
    keywords: ['ecommerce', 'pos', 'marketplace', 'africa', 'commerce', 'saas'],
  },
} as const

export type PlatformBranding = typeof PLATFORM_BRANDING
