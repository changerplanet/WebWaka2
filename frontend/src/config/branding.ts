/**
 * WebWaka Platform Branding Configuration
 * 
 * Central configuration for platform branding.
 * Part of HandyLife Digital - empowering African businesses.
 * 
 * Brand Architecture:
 * - Platform: WebWaka
 * - Parent: HandyLife Digital (social enterprise umbrella)
 * - Suites: Commerce, Education, Health, Civic, Hospitality, etc.
 * - Solutions: WebWaka POS, WebWaka Market, WebWaka Store, etc.
 */

export const PLATFORM_BRANDING = {
  // Platform Identity
  name: 'WebWaka',
  tagline: 'Digital Tools for African Success',
  description: 'Empowering businesses and organizations across Africa with industry-specific digital solutions',
  
  // Parent Organization
  parentOrg: {
    name: 'HandyLife Digital',
    tagline: 'Technology for Social Impact',
    description: 'A social enterprise building digital infrastructure for African communities',
  },
  
  // Domain Configuration
  primaryDomain: 'webwaka.com',
  subdomainSuffix: '.webwaka.com',
  cnameTarget: 'cname.webwaka.com',
  dnsVerifyPrefix: '_webwaka-verify',
  
  // Brand Colors (consistent with African optimism)
  colors: {
    primary: '#16a34a',      // Green - growth, trust, prosperity
    primaryDark: '#15803d',  // Darker green
    secondary: '#1f2937',    // Charcoal gray - professionalism
    accent: '#f59e0b',       // Warm amber/gold - warmth, value
    accentHover: '#d97706',  // Darker amber
    success: '#16a34a',      // Green
    warning: '#f59e0b',      // Amber
    error: '#dc2626',        // Red
  },
  
  // Gradients
  gradients: {
    hero: 'from-green-600 to-green-700',
    heroAlt: 'from-gray-900 to-gray-800',
    card: 'from-white to-gray-50',
    button: 'from-green-600 to-green-700',
    cta: 'from-amber-500 to-orange-500',
  },
  
  // Solution Names (user-facing) - Commerce Suite
  solutions: {
    pos: {
      name: 'WebWaka POS',
      shortName: 'POS',
      description: 'Point of sale for shops and retail businesses',
      suite: 'commerce',
    },
    store: {
      name: 'WebWaka Store',
      shortName: 'Online Store',
      description: 'E-commerce storefront for single sellers',
      suite: 'commerce',
    },
    market: {
      name: 'WebWaka Market',
      shortName: 'Marketplace',
      description: 'Multi-vendor marketplace platform',
      suite: 'commerce',
    },
    inventory: {
      name: 'WebWaka Inventory',
      shortName: 'Inventory',
      description: 'Stock management and tracking',
      suite: 'commerce',
    },
    accounting: {
      name: 'WebWaka Accounts',
      shortName: 'Accounting',
      description: 'Financial management and reporting',
      suite: 'commerce',
    },
  },
  
  // Legacy alias for backward compatibility
  modules: {
    pos: {
      name: 'WebWaka POS',
      shortName: 'POS',
      description: 'Point of sale for shops and retail businesses',
    },
    svm: {
      name: 'WebWaka Store',
      shortName: 'Online Store',
      description: 'E-commerce storefront for single sellers',
    },
    mvm: {
      name: 'WebWaka Market',
      shortName: 'Marketplace',
      description: 'Multi-vendor marketplace platform',
    },
  },
  
  // Footer & Legal
  copyright: `© ${new Date().getFullYear()} WebWaka. A HandyLife Digital company. All rights reserved.`,
  companyName: 'WebWaka',
  legalName: 'HandyLife Digital Ltd',
  
  // Social Links
  social: {
    twitter: 'https://twitter.com/webwaka',
    facebook: 'https://facebook.com/webwaka',
    instagram: 'https://instagram.com/webwaka',
    linkedin: 'https://linkedin.com/company/webwaka',
    whatsapp: '+234 800 000 0000',
  },
  
  // Support
  support: {
    email: 'support@webwaka.com',
    phone: '+234 800 000 0000',
    whatsapp: '+234 800 000 0000',
  },
  
  // SEO Defaults
  seo: {
    title: 'WebWaka - Digital Tools for African Success',
    description: 'Empowering African businesses with industry-specific digital solutions. POS, Online Store, Marketplace, and more.',
    keywords: [
      'african business software',
      'nigerian pos system',
      'african digital solutions',
      'business management africa',
      'webwaka',
      'handylife digital',
    ],
  },
} as const

export type PlatformBranding = typeof PLATFORM_BRANDING
