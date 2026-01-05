/**
 * SITES & FUNNELS: Module Index
 * 
 * Central export point for Sites & Funnels module.
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

// Entitlements & Access Control
export * from './entitlements-service';

// Capability key constant
export const CAPABILITY_KEY = 'sites_and_funnels';

// Module metadata
export const MODULE_INFO = {
  name: 'Sites & Funnels',
  version: '1.0.0',
  phase: 5,
  domain: 'marketing',
  description: 'Partner-built websites and marketing funnels with industry templates',
  
  // Features
  features: [
    'sites',
    'funnels', 
    'ai_content',
    'custom_domains',
    'templates',
    'site_analytics',
  ],
  
  // Optional dependencies (enhance functionality but not required)
  optionalDependencies: [
    { key: 'crm', benefit: 'Lead capture forms integrate with CRM contacts' },
    { key: 'analytics', benefit: 'Advanced site analytics and reporting' },
    { key: 'marketing', benefit: 'Funnel automation and email sequences' },
  ],
  
  // Hard dependencies (none for this module)
  requiredDependencies: [],
  
  // Access control rules
  accessControl: {
    partnerOnly: ['create_site', 'create_funnel', 'manage_templates', 'publish'],
    partnerOrClient: ['edit_content', 'view_analytics'],
    readOnly: ['super_admin'],
    visitor: ['view_published'],
  },
  
  // Owned database tables
  ownedTables: [
    'sf_sites',
    'sf_funnels',
    'sf_pages',
    'sf_templates',
    'sf_template_categories',
    'sf_domain_mappings',
    'sf_page_blocks',
    'sf_ai_content_logs',
    'sf_analytics_events',
  ],
};
