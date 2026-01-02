/**
 * eMarketWaka Branding Configuration
 * 
 * Central configuration for platform branding.
 * Nigerian market focused - green for trust and growth.
 */

export const PLATFORM_BRANDING = {
  // Platform Identity
  name: 'eMarketWaka',
  tagline: 'Your Business, Simplified',
  description: 'Manage your shop, sales, and customers in one place',
  
  // Domain Configuration
  primaryDomain: 'emarketwaka.com',
  subdomainSuffix: '.emarketwaka.com',
  cnameTarget: 'cname.emarketwaka.com',
  dnsVerifyPrefix: '_emarketwaka-verify',
  
  // Nigerian Market Colors
  colors: {
    primary: '#16a34a',      // Green - trust, growth
    primaryDark: '#15803d',  // Darker green
    secondary: '#1f2937',    // Charcoal gray
    accent: '#f59e0b',       // Warm amber/orange for CTAs
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
  
  // Module Names (user-facing)
  modules: {
    pos: {
      name: 'eMarketWaka POS',
      shortName: 'POS',
      description: 'Sell in your shop with one-tap checkout',
    },
    svm: {
      name: 'eMarketWaka Store',
      shortName: 'Online Store',
      description: 'Sell online and on WhatsApp',
    },
    mvm: {
      name: 'eMarketWaka Marketplace',
      shortName: 'Marketplace',
      description: 'Run your own marketplace with multiple vendors',
    },
  },
  
  // Footer & Legal
  copyright: `© ${new Date().getFullYear()} eMarketWaka. All rights reserved.`,
  companyName: 'eMarketWaka',
  
  // Social Links
  social: {
    twitter: 'https://twitter.com/emarketwaka',
    facebook: 'https://facebook.com/emarketwaka',
    instagram: 'https://instagram.com/emarketwaka',
    whatsapp: '+234 800 000 0000',
  },
  
  // Support
  support: {
    email: 'support@emarketwaka.com',
    phone: '+234 800 000 0000',
    whatsapp: '+234 800 000 0000',
  },
  
  // SEO Defaults
  seo: {
    title: 'eMarketWaka - Your Business, Simplified',
    description: 'Manage your shop, sales, and customers in one place. POS, Online Store & Marketplace for Nigerian businesses.',
    keywords: ['pos nigeria', 'online store', 'marketplace', 'nigerian business', 'sell online nigeria', 'shop management'],
  },
} as const

export type PlatformBranding = typeof PLATFORM_BRANDING
