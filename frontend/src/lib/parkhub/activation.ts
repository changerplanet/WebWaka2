/**
 * PARKHUB: Partner Activation & Packaging Service
 * 
 * Defines how Partners activate ParkHub for their clients.
 * ParkHub is a capability bundle, not a standalone product.
 * 
 * PARTNER-FIRST: Only partners can activate ParkHub for tenants.
 */

import { PARKHUB_CAPABILITY_BUNDLE, PARKHUB_MVM_CONFIG } from './config';

// ============================================================================
// ACTIVATION TYPES
// ============================================================================

export interface ParkHubActivationRequest {
  tenantId: string;
  partnerId: string;
  platformInstanceId: string;
  parkName: string;
  parkAddress: string;
  parkPhone: string;
  parkEmail?: string;
  initialCommissionRate?: number;
  selectedTier: 'free' | 'starter' | 'professional' | 'enterprise';
}

export interface ParkHubActivationResult {
  success: boolean;
  activationId?: string;
  activatedCapabilities?: string[];
  configuration?: typeof PARKHUB_MVM_CONFIG;
  error?: string;
}

// ============================================================================
// PARTNER ACTIVATION CHECKLIST
// ============================================================================

export const PARKHUB_ACTIVATION_CHECKLIST = {
  preActivation: [
    {
      step: 1,
      title: 'Verify Partner Agreement',
      description: 'Ensure partner has active agreement allowing ParkHub activation',
      required: true,
    },
    {
      step: 2,
      title: 'Create/Select Tenant',
      description: 'Create new tenant for the motor park or select existing',
      required: true,
    },
    {
      step: 3,
      title: 'Verify Capability Access',
      description: 'Confirm tenant plan includes MVM, Logistics, and Payments capabilities',
      required: true,
    },
  ],
  
  activation: [
    {
      step: 4,
      title: 'Activate Capability Bundle',
      description: 'Enable ParkHub capability bundle (MVM + Logistics + Payments)',
      required: true,
      action: 'activateCapabilityBundle',
    },
    {
      step: 5,
      title: 'Configure MVM Profile',
      description: 'Apply ParkHub-specific MVM configuration (labels, product types)',
      required: true,
      action: 'configureMVMProfile',
    },
    {
      step: 6,
      title: 'Set Commission Rate',
      description: 'Configure park-level commission rate for ticket sales',
      required: true,
      action: 'setCommissionRate',
    },
  ],
  
  postActivation: [
    {
      step: 7,
      title: 'Create Admin Account',
      description: 'Set up park administrator account for the tenant',
      required: true,
    },
    {
      step: 8,
      title: 'Seed Demo Data (Optional)',
      description: 'Optionally seed demo transport companies and routes for testing',
      required: false,
    },
    {
      step: 9,
      title: 'Training & Handover',
      description: 'Provide training to park administrator on using the platform',
      required: true,
    },
  ],
};

// ============================================================================
// CAPABILITY BUNDLE DEFINITION
// ============================================================================

export const PARKHUB_SOLUTION_PACKAGE = {
  id: 'parkhub',
  name: 'ParkHub - Motor Park Solution',
  tagline: 'Complete motor park management with multi-vendor marketplace',
  
  description: `
    Transform your motor park into a digital marketplace. ParkHub enables motor parks 
    to manage multiple transport companies, sell tickets online and at the counter, 
    track trips in real-time, and automate commission calculations.
  `,
  
  targetCustomers: [
    'Motor parks',
    'Transport terminals',
    'Bus stations',
    'State transport corporations',
  ],
  
  keyFeatures: [
    {
      title: 'Multi-Vendor Marketplace',
      description: 'Onboard multiple transport companies to operate from your park',
      capability: 'mvm',
    },
    {
      title: 'Online & Walk-in Booking',
      description: 'Accept bookings online and through park agents with POS',
      capability: 'mvm',
    },
    {
      title: 'Driver & Trip Management',
      description: 'Assign drivers to trips and track real-time trip status',
      capability: 'logistics',
    },
    {
      title: 'Automated Commission',
      description: 'Automatically calculate and track park commission on ticket sales',
      capability: 'payments',
    },
    {
      title: 'Offline Support',
      description: 'Continue operations even without internet connectivity',
      capability: 'core',
    },
  ],
  
  includedCapabilities: PARKHUB_CAPABILITY_BUNDLE.requiredCapabilities,
  optionalCapabilities: PARKHUB_CAPABILITY_BUNDLE.optionalCapabilities,
  
  pricing: {
    model: 'SUBSCRIPTION',
    tiers: [
      {
        name: 'Free',
        price: 0,
        description: 'For small parks getting started',
        limits: PARKHUB_CAPABILITY_BUNDLE.entitlements.maxRoutes.free + ' routes',
      },
      {
        name: 'Starter',
        price: 25000, // NGN/month
        description: 'For growing motor parks',
        limits: PARKHUB_CAPABILITY_BUNDLE.entitlements.maxRoutes.starter + ' routes',
      },
      {
        name: 'Professional',
        price: 75000, // NGN/month
        description: 'For busy motor parks',
        limits: PARKHUB_CAPABILITY_BUNDLE.entitlements.maxRoutes.professional + ' routes',
      },
      {
        name: 'Enterprise',
        price: null, // Custom
        description: 'For state transport corporations',
        limits: 'Unlimited',
      },
    ],
  },
};

// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================

/**
 * Activate ParkHub for a tenant
 * This is called by partners during client onboarding
 */
export async function activateParkHub(
  request: ParkHubActivationRequest
): Promise<ParkHubActivationResult> {
  const { tenantId, partnerId, platformInstanceId, selectedTier } = request;
  
  try {
    // Step 1: Verify partner can activate
    // In production: Check partner agreement and permissions
    
    // Step 2: Check tenant exists and is accessible
    // In production: Verify tenant belongs to partner's portfolio
    
    // Step 3: Activate capability bundle
    const activatedCapabilities = [
      'parkhub',
      ...PARKHUB_CAPABILITY_BUNDLE.requiredCapabilities,
    ];
    
    // Step 4: Apply MVM configuration
    const configuration = {
      ...PARKHUB_MVM_CONFIG,
      commissionRate: request.initialCommissionRate || PARKHUB_MVM_CONFIG.defaultCommissionRate,
    };
    
    // Step 5: Set entitlements based on tier
    const entitlements = Object.entries(PARKHUB_CAPABILITY_BUNDLE.entitlements).reduce(
      (acc, [key, tiers]) => ({
        ...acc,
        [key]: tiers[selectedTier as keyof typeof tiers],
      }),
      {}
    );
    
    // Generate activation ID
    const activationId = `parkhub_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
    
    console.log('[ParkHub] Activated for tenant:', tenantId, {
      activationId,
      capabilities: activatedCapabilities,
      tier: selectedTier,
    });
    
    return {
      success: true,
      activationId,
      activatedCapabilities,
      configuration,
    };
    
  } catch (error: any) {
    console.error('[ParkHub] Activation failed:', error);
    return {
      success: false,
      error: error.message || 'Activation failed',
    };
  }
}

/**
 * Check if ParkHub can be activated for a tenant
 */
export function canActivateParkHub(
  tenantCapabilities: string[],
  partnerPermissions: string[]
): { canActivate: boolean; missingCapabilities: string[]; missingPermissions: string[] } {
  const requiredCapabilities = PARKHUB_CAPABILITY_BUNDLE.requiredCapabilities;
  const missingCapabilities = requiredCapabilities.filter(cap => !tenantCapabilities.includes(cap));
  
  const requiredPermissions = ['activate_solutions', 'manage_tenants'];
  const missingPermissions = requiredPermissions.filter(perm => !partnerPermissions.includes(perm));
  
  return {
    canActivate: missingCapabilities.length === 0 && missingPermissions.length === 0,
    missingCapabilities,
    missingPermissions,
  };
}

/**
 * Get activation status for a tenant
 */
export function getParkHubActivationStatus(tenantCapabilities: string[]): {
  isActivated: boolean;
  activatedComponents: string[];
  missingComponents: string[];
} {
  const requiredCapabilities = ['parkhub', ...PARKHUB_CAPABILITY_BUNDLE.requiredCapabilities];
  const activatedComponents = requiredCapabilities.filter(cap => tenantCapabilities.includes(cap));
  const missingComponents = requiredCapabilities.filter(cap => !tenantCapabilities.includes(cap));
  
  return {
    isActivated: missingComponents.length === 0,
    activatedComponents,
    missingComponents,
  };
}

// ============================================================================
// DEMO ONBOARDING FLOW
// ============================================================================

export const PARKHUB_DEMO_ONBOARDING = {
  title: 'ParkHub Setup Wizard',
  steps: [
    {
      step: 1,
      title: 'Welcome to ParkHub',
      description: 'Let\'s set up your motor park on ParkHub',
      fields: [],
    },
    {
      step: 2,
      title: 'Park Information',
      description: 'Tell us about your motor park',
      fields: ['parkName', 'parkAddress', 'parkPhone', 'parkEmail'],
    },
    {
      step: 3,
      title: 'Commission Settings',
      description: 'Set your commission rate for ticket sales',
      fields: ['commissionRate'],
      defaultValue: { commissionRate: 10 },
    },
    {
      step: 4,
      title: 'Select Plan',
      description: 'Choose the plan that fits your park',
      fields: ['selectedTier'],
      options: PARKHUB_SOLUTION_PACKAGE.pricing.tiers,
    },
    {
      step: 5,
      title: 'Setup Complete',
      description: 'Your motor park is ready!',
      fields: [],
      actions: ['viewDashboard', 'addFirstCompany', 'inviteStaff'],
    },
  ],
};
