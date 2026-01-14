/**
 * SITES & FUNNELS: Visual Page Builder Types
 * 
 * Type definitions for the block-based page editor.
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

// ============================================================================
// BLOCK TYPES
// ============================================================================

export type BlockType = 
  | 'hero'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'cta'
  | 'form'
  | 'footer';

export interface BaseBlock {
  id: string;
  type: BlockType;
  name: string;
  isVisible: boolean;
  sortOrder: number;
}

// ============================================================================
// HERO BLOCK
// ============================================================================

export interface HeroContent {
  headline: string;
  subheadline?: string;
  backgroundImage?: string;
  backgroundOverlay?: boolean;
  ctaText?: string;
  ctaLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  content: HeroContent;
}

// ============================================================================
// FEATURES BLOCK
// ============================================================================

export interface FeatureItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
}

export interface FeaturesContent {
  title: string;
  subtitle?: string;
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
}

export interface FeaturesBlock extends BaseBlock {
  type: 'features';
  content: FeaturesContent;
}

// ============================================================================
// PRICING BLOCK
// ============================================================================

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaText: string;
  ctaLink?: string;
  isPopular?: boolean;
}

export interface PricingContent {
  title: string;
  subtitle?: string;
  tiers: PricingTier[];
}

export interface PricingBlock extends BaseBlock {
  type: 'pricing';
  content: PricingContent;
}

// ============================================================================
// TESTIMONIALS BLOCK
// ============================================================================

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsContent {
  title: string;
  subtitle?: string;
  testimonials: TestimonialItem[];
  layout?: 'grid' | 'carousel';
}

export interface TestimonialsBlock extends BaseBlock {
  type: 'testimonials';
  content: TestimonialsContent;
}

// ============================================================================
// CTA BLOCK
// ============================================================================

export interface CTAContent {
  headline: string;
  subheadline?: string;
  ctaText: string;
  ctaLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface CTABlock extends BaseBlock {
  type: 'cta';
  content: CTAContent;
}

// ============================================================================
// FORM BLOCK (Integrates with E1.3 Forms)
// ============================================================================

export interface FormBlockContent {
  formId?: string;
  title?: string;
  description?: string;
  submitText?: string;
  successMessage?: string;
  showInline?: boolean;
}

export interface FormBlock extends BaseBlock {
  type: 'form';
  content: FormBlockContent;
}

// ============================================================================
// FOOTER BLOCK
// ============================================================================

export interface FooterLink {
  id: string;
  text: string;
  url: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterContent {
  logoText?: string;
  logoUrl?: string;
  tagline?: string;
  columns: FooterColumn[];
  copyright?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface FooterBlock extends BaseBlock {
  type: 'footer';
  content: FooterContent;
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type PageBlock = 
  | HeroBlock
  | FeaturesBlock
  | PricingBlock
  | TestimonialsBlock
  | CTABlock
  | FormBlock
  | FooterBlock;

// ============================================================================
// EDITOR STATE
// ============================================================================

export interface EditorState {
  pageId: string;
  siteId?: string;
  funnelId?: string;
  blocks: PageBlock[];
  selectedBlockId: string | null;
  previewMode: 'desktop' | 'mobile';
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
}

// ============================================================================
// BLOCK REGISTRY
// ============================================================================

export interface BlockDefinition {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  defaultContent: Record<string, any>;
  category: 'header' | 'content' | 'conversion' | 'footer';
}

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  hero: {
    type: 'hero',
    name: 'Hero Section',
    description: 'Eye-catching hero section with headline and CTA',
    icon: 'layout',
    category: 'header',
    defaultContent: {
      headline: 'Your Headline Here',
      subheadline: 'Add a compelling subheadline to engage your visitors',
      ctaText: 'Get Started',
      ctaLink: '#',
      alignment: 'center',
    },
  },
  features: {
    type: 'features',
    name: 'Features',
    description: 'Showcase your product or service features',
    icon: 'grid-3x3',
    category: 'content',
    defaultContent: {
      title: 'Our Features',
      subtitle: 'Why choose us',
      features: [
        { id: '1', title: 'Feature One', description: 'Description of the first feature', icon: 'star' },
        { id: '2', title: 'Feature Two', description: 'Description of the second feature', icon: 'zap' },
        { id: '3', title: 'Feature Three', description: 'Description of the third feature', icon: 'shield' },
      ],
      columns: 3,
    },
  },
  pricing: {
    type: 'pricing',
    name: 'Pricing',
    description: 'Display pricing plans and options',
    icon: 'credit-card',
    category: 'conversion',
    defaultContent: {
      title: 'Simple Pricing',
      subtitle: 'Choose the plan that works for you',
      tiers: [
        { id: '1', name: 'Basic', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], ctaText: 'Start Free' },
        { id: '2', name: 'Pro', price: '$29', period: '/month', features: ['Everything in Basic', 'Feature 3', 'Feature 4'], ctaText: 'Get Pro', isPopular: true },
        { id: '3', name: 'Enterprise', price: '$99', period: '/month', features: ['Everything in Pro', 'Feature 5', 'Priority Support'], ctaText: 'Contact Us' },
      ],
    },
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and testimonials',
    icon: 'message-square',
    category: 'content',
    defaultContent: {
      title: 'What Our Customers Say',
      subtitle: 'Real feedback from real customers',
      testimonials: [
        { id: '1', quote: 'This product changed my business completely!', author: 'John Doe', role: 'CEO', company: 'Company Inc' },
        { id: '2', quote: 'Excellent service and amazing results.', author: 'Jane Smith', role: 'Founder', company: 'Startup Co' },
      ],
      layout: 'grid',
    },
  },
  cta: {
    type: 'cta',
    name: 'Call to Action',
    description: 'Conversion-focused call to action section',
    icon: 'megaphone',
    category: 'conversion',
    defaultContent: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of satisfied customers today',
      ctaText: 'Start Now',
      ctaLink: '#',
      backgroundStyle: 'gradient',
    },
  },
  form: {
    type: 'form',
    name: 'Form',
    description: 'Embed a form from your form library',
    icon: 'file-text',
    category: 'conversion',
    defaultContent: {
      title: 'Contact Us',
      description: 'Fill out the form and we\'ll get back to you',
      submitText: 'Submit',
      showInline: true,
    },
  },
  footer: {
    type: 'footer',
    name: 'Footer',
    description: 'Page footer with links and copyright',
    icon: 'layout',
    category: 'footer',
    defaultContent: {
      logoText: 'Company Name',
      tagline: 'Your trusted partner',
      columns: [
        { id: '1', title: 'Company', links: [{ id: '1', text: 'About', url: '/about' }, { id: '2', text: 'Contact', url: '/contact' }] },
        { id: '2', title: 'Legal', links: [{ id: '1', text: 'Privacy', url: '/privacy' }, { id: '2', text: 'Terms', url: '/terms' }] },
      ],
      copyright: '© 2026 Company Name. All rights reserved.',
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createBlock(type: BlockType): PageBlock {
  const definition = BLOCK_REGISTRY[type];
  const id = crypto.randomUUID ? crypto.randomUUID() : `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    type,
    name: definition.name,
    isVisible: true,
    sortOrder: 0,
    content: { ...definition.defaultContent },
  } as PageBlock;
}

export function isValidBlockType(type: string): type is BlockType {
  return type in BLOCK_REGISTRY;
}
