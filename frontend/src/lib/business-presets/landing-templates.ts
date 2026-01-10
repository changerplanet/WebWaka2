/**
 * PHASE 6: Landing Page Templates
 * 
 * Pre-built landing page templates for Sites & Funnels
 * for each business type.
 */

import { BusinessType } from './registry';

export interface LandingPageTemplate {
  businessType: BusinessType;
  name: string;
  description: string;
  
  // Hero section
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaUrl: string;
  };
  
  // Sections
  sections: Array<{
    type: 'features' | 'services' | 'pricing' | 'testimonial' | 'cta' | 'gallery';
    title: string;
    items?: string[];
    content?: string;
  }>;
  
  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  
  // Theme
  theme: {
    primaryColor: string;
    accentColor: string;
    style: 'modern' | 'classic' | 'bold' | 'minimal';
  };
}

// ============================================================================
// PHASE 6.1 — COMMERCE TEMPLATES
// ============================================================================

export const RETAIL_POS_TEMPLATE: LandingPageTemplate = {
  businessType: 'retail_pos',
  name: 'Retail Store Landing Page',
  description: 'Professional landing page for retail shops',
  hero: {
    headline: 'Quality Products, Affordable Prices',
    subheadline: 'Your one-stop shop for all your needs. Visit us today!',
    ctaText: 'View Products',
    ctaUrl: '/store',
  },
  sections: [
    {
      type: 'features',
      title: 'Why Shop With Us',
      items: ['Quality Products', 'Best Prices', 'Fast Service', 'Easy Returns'],
    },
    {
      type: 'gallery',
      title: 'Our Products',
    },
    {
      type: 'cta',
      title: 'Visit Our Store Today',
      content: 'Come experience quality shopping like never before.',
    },
  ],
  seo: {
    title: 'Your Trusted Retail Store',
    description: 'Quality products at affordable prices. Shop with us today.',
    keywords: ['retail', 'shop', 'store', 'products', 'Nigeria'],
  },
  theme: {
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    style: 'modern',
  },
};

export const MARKET_MVM_TEMPLATE: LandingPageTemplate = {
  businessType: 'market_mvm',
  name: 'Market Association Landing Page',
  description: 'Professional page for markets and trade associations',
  hero: {
    headline: 'Welcome to Our Market',
    subheadline: 'Hundreds of traders, thousands of products, one marketplace.',
    ctaText: 'Explore Traders',
    ctaUrl: '/marketplace',
  },
  sections: [
    {
      type: 'features',
      title: 'Why Trade Here',
      items: ['Verified Traders', 'Quality Products', 'Secure Payments', 'Association Support'],
    },
    {
      type: 'services',
      title: 'Our Categories',
      items: ['Foodstuff', 'Electronics', 'Clothing', 'Provisions', 'Cosmetics'],
    },
    {
      type: 'cta',
      title: 'Join Our Market',
      content: 'Become a registered trader today and grow your business.',
    },
  ],
  seo: {
    title: 'Trade Association Marketplace',
    description: 'Official marketplace of our trade association. Buy from verified traders.',
    keywords: ['market', 'traders', 'marketplace', 'association', 'Nigeria'],
  },
  theme: {
    primaryColor: '#F59E0B',
    accentColor: '#EF4444',
    style: 'bold',
  },
};

export const RESTAURANT_TEMPLATE: LandingPageTemplate = {
  businessType: 'restaurant',
  name: 'Restaurant Landing Page',
  description: 'Appetizing landing page for restaurants',
  hero: {
    headline: 'Delicious Food, Unforgettable Experience',
    subheadline: 'Authentic Nigerian cuisine prepared with love. Dine with us today!',
    ctaText: 'View Menu',
    ctaUrl: '/menu',
  },
  sections: [
    {
      type: 'services',
      title: 'Our Specialties',
      items: ['Jollof Rice', 'Pepper Soup', 'Suya', 'Traditional Soups', 'Grilled Meats'],
    },
    {
      type: 'features',
      title: 'Why Dine With Us',
      items: ['Fresh Ingredients', 'Fast Service', 'Cozy Atmosphere', 'Takeaway Available'],
    },
    {
      type: 'cta',
      title: 'Make a Reservation',
      content: 'Book your table now and enjoy a memorable dining experience.',
    },
  ],
  seo: {
    title: 'Fine Dining Restaurant',
    description: 'Experience authentic Nigerian cuisine. Fresh ingredients, amazing taste.',
    keywords: ['restaurant', 'food', 'dining', 'Nigerian cuisine', 'jollof'],
  },
  theme: {
    primaryColor: '#EF4444',
    accentColor: '#F59E0B',
    style: 'bold',
  },
};

export const EVENT_TICKETING_TEMPLATE: LandingPageTemplate = {
  businessType: 'event_ticketing',
  name: 'Event Ticketing Landing Page',
  description: 'Dynamic event promotion page',
  hero: {
    headline: 'Don\'t Miss Out!',
    subheadline: 'Get your tickets now before they sell out.',
    ctaText: 'Buy Tickets',
    ctaUrl: '/tickets',
  },
  sections: [
    {
      type: 'features',
      title: 'Event Highlights',
      items: ['World-Class Entertainment', 'VIP Experience', 'Food & Drinks', 'Networking'],
    },
    {
      type: 'pricing',
      title: 'Ticket Options',
      items: ['Regular', 'VIP', 'VVIP', 'Table Booking'],
    },
    {
      type: 'cta',
      title: 'Secure Your Spot',
      content: 'Limited tickets available. Book now!',
    },
  ],
  seo: {
    title: 'Event Tickets - Get Yours Now',
    description: 'Official ticketing for events. Secure, fast, reliable.',
    keywords: ['events', 'tickets', 'concert', 'party', 'Lagos'],
  },
  theme: {
    primaryColor: '#EC4899',
    accentColor: '#8B5CF6',
    style: 'bold',
  },
};

// ============================================================================
// PHASE 6.2 — SERVICES TEMPLATES
// ============================================================================

export const BEAUTY_SALON_TEMPLATE: LandingPageTemplate = {
  businessType: 'beauty_salon',
  name: 'Beauty Salon Landing Page',
  description: 'Elegant landing page for salons and spas',
  hero: {
    headline: 'Look Good, Feel Great',
    subheadline: 'Professional beauty services to bring out your best self.',
    ctaText: 'Book Appointment',
    ctaUrl: '/book',
  },
  sections: [
    {
      type: 'services',
      title: 'Our Services',
      items: ['Hair Styling', 'Braiding', 'Makeup', 'Manicure & Pedicure', 'Facials'],
    },
    {
      type: 'features',
      title: 'Why Choose Us',
      items: ['Experienced Stylists', 'Quality Products', 'Relaxing Atmosphere', 'Affordable Prices'],
    },
    {
      type: 'gallery',
      title: 'Our Work',
    },
    {
      type: 'cta',
      title: 'Ready for Your Transformation?',
      content: 'Book your appointment today and let us pamper you.',
    },
  ],
  seo: {
    title: 'Beauty Salon & Spa',
    description: 'Professional beauty services. Hair, makeup, nails, and more.',
    keywords: ['salon', 'beauty', 'hair', 'makeup', 'spa', 'Lagos'],
  },
  theme: {
    primaryColor: '#F472B6',
    accentColor: '#8B5CF6',
    style: 'modern',
  },
};

export const LAUNDRY_TEMPLATE: LandingPageTemplate = {
  businessType: 'laundry',
  name: 'Laundry Service Landing Page',
  description: 'Clean and professional laundry service page',
  hero: {
    headline: 'Fresh, Clean, Ready',
    subheadline: 'Professional laundry and dry cleaning with pickup & delivery.',
    ctaText: 'Schedule Pickup',
    ctaUrl: '/book',
  },
  sections: [
    {
      type: 'services',
      title: 'Our Services',
      items: ['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Pickup & Delivery'],
    },
    {
      type: 'pricing',
      title: 'Our Rates',
      items: ['Shirts from ₦500', 'Suits from ₦4,000', 'Traditional Wear from ₦2,500'],
    },
    {
      type: 'cta',
      title: 'Get Started',
      content: 'Schedule your first pickup today. Free delivery on orders above ₦5,000.',
    },
  ],
  seo: {
    title: 'Laundry & Dry Cleaning Services',
    description: 'Professional laundry services with pickup and delivery.',
    keywords: ['laundry', 'dry cleaning', 'wash', 'ironing', 'Lagos'],
  },
  theme: {
    primaryColor: '#06B6D4',
    accentColor: '#3B82F6',
    style: 'minimal',
  },
};

export const COURIER_TEMPLATE: LandingPageTemplate = {
  businessType: 'courier',
  name: 'Courier Service Landing Page',
  description: 'Fast and reliable delivery service page',
  hero: {
    headline: 'Fast, Reliable Delivery',
    subheadline: 'Same-day delivery across Lagos. Track your package in real-time.',
    ctaText: 'Ship Now',
    ctaUrl: '/ship',
  },
  sections: [
    {
      type: 'services',
      title: 'Delivery Options',
      items: ['Same-Day Express', 'Next-Day Delivery', 'Scheduled Pickup', 'Bulk Shipping'],
    },
    {
      type: 'features',
      title: 'Why Choose Us',
      items: ['Real-Time Tracking', 'Proof of Delivery', 'Insurance Options', 'Competitive Rates'],
    },
    {
      type: 'pricing',
      title: 'Our Rates',
      items: ['Same Area: ₦1,500', 'Cross-Town: ₦2,500', 'Express: ₦5,000'],
    },
  ],
  seo: {
    title: 'Courier & Delivery Services',
    description: 'Fast, reliable parcel delivery. Same-day available.',
    keywords: ['courier', 'delivery', 'shipping', 'parcel', 'Lagos'],
  },
  theme: {
    primaryColor: '#F97316',
    accentColor: '#EF4444',
    style: 'bold',
  },
};

export const AUTO_WORKSHOP_TEMPLATE: LandingPageTemplate = {
  businessType: 'auto_workshop',
  name: 'Auto Workshop Landing Page',
  description: 'Professional mechanic workshop page',
  hero: {
    headline: 'Expert Auto Care',
    subheadline: 'Professional vehicle repair and maintenance you can trust.',
    ctaText: 'Book Service',
    ctaUrl: '/book',
  },
  sections: [
    {
      type: 'services',
      title: 'Our Services',
      items: ['Full Service', 'Oil Change', 'Brake Repair', 'AC Service', 'Engine Diagnosis'],
    },
    {
      type: 'features',
      title: 'Why Choose Us',
      items: ['Certified Mechanics', 'Quality Parts', 'Fair Pricing', 'Warranty on Repairs'],
    },
    {
      type: 'cta',
      title: 'Keep Your Car Running Smoothly',
      content: 'Schedule your service appointment today.',
    },
  ],
  seo: {
    title: 'Auto Workshop & Mechanic Services',
    description: 'Professional car repair and maintenance services.',
    keywords: ['mechanic', 'auto repair', 'car service', 'workshop', 'Lagos'],
  },
  theme: {
    primaryColor: '#84CC16',
    accentColor: '#22C55E',
    style: 'classic',
  },
};

// ============================================================================
// PHASE 6.3 — COMMUNITY TEMPLATES
// ============================================================================

export const NGO_TEMPLATE: LandingPageTemplate = {
  businessType: 'ngo',
  name: 'NGO Landing Page',
  description: 'Impactful nonprofit organization page',
  hero: {
    headline: 'Making a Difference Together',
    subheadline: 'Empowering communities through education, healthcare, and support.',
    ctaText: 'Donate Now',
    ctaUrl: '/donate',
  },
  sections: [
    {
      type: 'services',
      title: 'Our Programs',
      items: ['Education Support', 'Healthcare Outreach', 'Skills Training', 'Community Development'],
    },
    {
      type: 'features',
      title: 'Our Impact',
      items: ['10,000+ Lives Touched', '50+ Communities', '100% Transparent', 'Registered NGO'],
    },
    {
      type: 'cta',
      title: 'Join Our Mission',
      content: 'Your donation changes lives. Every contribution matters.',
    },
  ],
  seo: {
    title: 'NGO - Making a Difference',
    description: 'Join us in empowering communities across Nigeria.',
    keywords: ['NGO', 'charity', 'nonprofit', 'donate', 'Nigeria'],
  },
  theme: {
    primaryColor: '#22C55E',
    accentColor: '#3B82F6',
    style: 'modern',
  },
};

export const ALUMNI_PORTAL_TEMPLATE: LandingPageTemplate = {
  businessType: 'alumni_portal',
  name: 'Alumni Association Landing Page',
  description: 'Professional alumni engagement page',
  hero: {
    headline: 'Stay Connected, Stay Strong',
    subheadline: 'Join thousands of alumni making a difference.',
    ctaText: 'Join Now',
    ctaUrl: '/join',
  },
  sections: [
    {
      type: 'features',
      title: 'Member Benefits',
      items: ['Networking Events', 'Career Support', 'Exclusive Updates', 'Mentorship Program'],
    },
    {
      type: 'services',
      title: 'Upcoming Events',
      items: ['Annual Reunion', 'Career Fair', 'Mentorship Day', 'Chapter Meetings'],
    },
    {
      type: 'cta',
      title: 'Reconnect With Your Alma Mater',
      content: 'Register today and be part of our growing community.',
    },
  ],
  seo: {
    title: 'Alumni Association',
    description: 'Official alumni association. Connect, network, grow.',
    keywords: ['alumni', 'association', 'university', 'network', 'Nigeria'],
  },
  theme: {
    primaryColor: '#7C3AED',
    accentColor: '#EC4899',
    style: 'classic',
  },
};

export const GATE_PASS_TEMPLATE: LandingPageTemplate = {
  businessType: 'gate_pass',
  name: 'Estate Management Landing Page',
  description: 'Professional estate security page',
  hero: {
    headline: 'Secure Living, Peace of Mind',
    subheadline: 'Professional estate management and visitor access control.',
    ctaText: 'Resident Login',
    ctaUrl: '/login',
  },
  sections: [
    {
      type: 'features',
      title: 'Our Services',
      items: ['24/7 Security', 'Visitor Management', 'QR Access Passes', 'Delivery Tracking'],
    },
    {
      type: 'services',
      title: 'For Residents',
      items: ['Easy Visitor Registration', 'Instant Notifications', 'Service Provider Access', 'Emergency Contacts'],
    },
    {
      type: 'cta',
      title: 'Secure Your Estate',
      content: 'Modern visitor management for modern estates.',
    },
  ],
  seo: {
    title: 'Estate Management & Security',
    description: 'Professional estate security and visitor management.',
    keywords: ['estate', 'security', 'visitor', 'gate pass', 'Lagos'],
  },
  theme: {
    primaryColor: '#64748B',
    accentColor: '#3B82F6',
    style: 'minimal',
  },
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const LANDING_PAGE_TEMPLATES: Partial<Record<BusinessType, LandingPageTemplate>> = {
  retail_pos: RETAIL_POS_TEMPLATE,
  supermarket: RETAIL_POS_TEMPLATE,
  market_mvm: MARKET_MVM_TEMPLATE,
  ecommerce_store: RETAIL_POS_TEMPLATE,
  restaurant: RESTAURANT_TEMPLATE,
  event_ticketing: EVENT_TICKETING_TEMPLATE,
  beauty_salon: BEAUTY_SALON_TEMPLATE,
  laundry: LAUNDRY_TEMPLATE,
  cleaning_service: LAUNDRY_TEMPLATE,
  repair_service: AUTO_WORKSHOP_TEMPLATE,
  auto_workshop: AUTO_WORKSHOP_TEMPLATE,
  courier: COURIER_TEMPLATE,
  ngo: NGO_TEMPLATE,
  alumni_portal: ALUMNI_PORTAL_TEMPLATE,
  sales_agent: RETAIL_POS_TEMPLATE,
  gate_pass: GATE_PASS_TEMPLATE,
  parking: GATE_PASS_TEMPLATE,
};

export function getLandingPageTemplate(businessType: BusinessType): LandingPageTemplate | undefined {
  return LANDING_PAGE_TEMPLATES[businessType];
}
