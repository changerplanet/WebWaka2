/**
 * CIVIC SUITE: Configuration & Constants
 * 
 * Labels, enums, types, and configuration for the Civic Suite.
 * Nigerian civic context - LGAs, CDAs, Estate Associations, etc.
 */

// ============================================================================
// LABELS (UI Display)
// ============================================================================

export const CIVIC_LABELS = {
  constituents: 'Members',
  households: 'Households',
  dues: 'Dues',
  levies: 'Levies',
  serviceRequests: 'Service Requests',
  certificates: 'Certificates',
  events: 'Events',
  meetings: 'Meetings',
  voting: 'Voting',
  polls: 'Polls',
  announcements: 'Announcements',
  wards: 'Wards',
  zones: 'Zones',
  units: 'Units',
};

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export const ORGANIZATION_TYPES = {
  LGA: { name: 'Local Government Area', code: 'LGA' },
  STATE_AGENCY: { name: 'State Government Agency', code: 'SGA' },
  CDA: { name: 'Community Development Association', code: 'CDA' },
  ESTATE: { name: 'Estate/Resident Association', code: 'ERA' },
  COOPERATIVE: { name: 'Cooperative Society', code: 'COOP' },
  RELIGIOUS: { name: 'Religious Organization', code: 'REL' },
  TRADITIONAL: { name: 'Traditional Council/Town Union', code: 'TRD' },
  NGO: { name: 'NGO/Civil Society', code: 'NGO' },
} as const;

export type OrganizationType = keyof typeof ORGANIZATION_TYPES;

// ============================================================================
// MEMBERSHIP TYPES & STATUS
// ============================================================================

export const MEMBERSHIP_TYPES = {
  RESIDENT: { name: 'Resident', description: 'Lives within the community' },
  LANDLORD: { name: 'Landlord', description: 'Property owner' },
  TENANT: { name: 'Tenant', description: 'Renting property' },
  BUSINESS: { name: 'Business', description: 'Business operator' },
  HONORARY: { name: 'Honorary', description: 'Honorary member' },
  ASSOCIATE: { name: 'Associate', description: 'Associate/affiliate member' },
} as const;

export type MembershipType = keyof typeof MEMBERSHIP_TYPES;

export const MEMBERSHIP_STATUS = {
  ACTIVE: { name: 'Active', color: 'green' },
  SUSPENDED: { name: 'Suspended', color: 'red' },
  INACTIVE: { name: 'Inactive', color: 'gray' },
  PENDING: { name: 'Pending Approval', color: 'yellow' },
  DECEASED: { name: 'Deceased', color: 'gray' },
} as const;

export type MembershipStatus = keyof typeof MEMBERSHIP_STATUS;

// ============================================================================
// DUES & LEVY TYPES
// ============================================================================

export const DUES_TYPES = {
  DEVELOPMENT_LEVY: { name: 'Development Levy', frequency: 'MONTHLY' },
  SERVICE_CHARGE: { name: 'Service Charge', frequency: 'MONTHLY' },
  SECURITY_LEVY: { name: 'Security Levy', frequency: 'MONTHLY' },
  TENEMENT_RATE: { name: 'Tenement Rate', frequency: 'ANNUAL' },
  MEMBERSHIP_DUES: { name: 'Membership Dues', frequency: 'MONTHLY' },
  SPECIAL_LEVY: { name: 'Special Levy', frequency: 'ONE_TIME' },
  TITHE: { name: 'Tithe', frequency: 'MONTHLY' },
  OFFERING: { name: 'Offering', frequency: 'WEEKLY' },
  WELFARE: { name: 'Welfare Contribution', frequency: 'MONTHLY' },
} as const;

export type DuesType = keyof typeof DUES_TYPES;

export const PAYMENT_STATUS = {
  PAID: { name: 'Paid', color: 'green' },
  PARTIAL: { name: 'Partially Paid', color: 'yellow' },
  PENDING: { name: 'Pending', color: 'blue' },
  OVERDUE: { name: 'Overdue', color: 'red' },
  WAIVED: { name: 'Waived', color: 'gray' },
  EXEMPT: { name: 'Exempt', color: 'purple' },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;

// ============================================================================
// SERVICE REQUEST TYPES & STATUS
// ============================================================================

export const SERVICE_REQUEST_CATEGORIES = {
  INFRASTRUCTURE: { name: 'Infrastructure', icon: 'road' },
  SECURITY: { name: 'Security', icon: 'shield' },
  SANITATION: { name: 'Sanitation/Waste', icon: 'trash' },
  UTILITIES: { name: 'Utilities', icon: 'bolt' },
  COMPLAINT: { name: 'Complaint', icon: 'exclamation' },
  GENERAL_INQUIRY: { name: 'General Inquiry', icon: 'question' },
  CERTIFICATE: { name: 'Certificate Request', icon: 'certificate' },
  PERMIT: { name: 'Permit Application', icon: 'file' },
} as const;

export type ServiceRequestCategory = keyof typeof SERVICE_REQUEST_CATEGORIES;

export const SERVICE_REQUEST_STATUS = {
  SUBMITTED: { name: 'Submitted', color: 'blue' },
  UNDER_REVIEW: { name: 'Under Review', color: 'yellow' },
  IN_PROGRESS: { name: 'In Progress', color: 'purple' },
  ESCALATED: { name: 'Escalated', color: 'orange' },
  RESOLVED: { name: 'Resolved', color: 'green' },
  CLOSED: { name: 'Closed', color: 'gray' },
  REJECTED: { name: 'Rejected', color: 'red' },
} as const;

export type ServiceRequestStatus = keyof typeof SERVICE_REQUEST_STATUS;

export const SERVICE_REQUEST_PRIORITY = {
  LOW: { name: 'Low', color: 'gray', slaHours: 168 },      // 7 days
  MEDIUM: { name: 'Medium', color: 'yellow', slaHours: 72 }, // 3 days
  HIGH: { name: 'High', color: 'orange', slaHours: 24 },     // 1 day
  URGENT: { name: 'Urgent', color: 'red', slaHours: 4 },     // 4 hours
} as const;

export type ServiceRequestPriority = keyof typeof SERVICE_REQUEST_PRIORITY;

// ============================================================================
// CERTIFICATE TYPES
// ============================================================================

export const CERTIFICATE_TYPES = {
  GOOD_STANDING: { name: 'Certificate of Good Standing', validityDays: 180, fee: 2500 },
  RESIDENCY: { name: 'Residency Certificate', validityDays: 365, fee: 3000 },
  CHARACTER: { name: 'Character Certificate', validityDays: 180, fee: 2000 },
  MEMBERSHIP: { name: 'Membership Certificate', validityDays: null, fee: 1500 },
  CLEARANCE: { name: 'Clearance Certificate', validityDays: 90, fee: 5000 },
  INTRODUCTION_LETTER: { name: 'Introduction Letter', validityDays: 30, fee: 1000 },
  INDIGENE: { name: 'Indigene Certificate', validityDays: null, fee: 5000 },
  BUSINESS_PERMIT: { name: 'Business Operating Permit', validityDays: 365, fee: 10000 },
} as const;

export type CertificateType = keyof typeof CERTIFICATE_TYPES;

export const CERTIFICATE_STATUS = {
  PENDING: { name: 'Pending', color: 'yellow' },
  APPROVED: { name: 'Approved', color: 'blue' },
  ISSUED: { name: 'Issued', color: 'green' },
  REJECTED: { name: 'Rejected', color: 'red' },
  REVOKED: { name: 'Revoked', color: 'red' },
  EXPIRED: { name: 'Expired', color: 'gray' },
} as const;

export type CertificateStatus = keyof typeof CERTIFICATE_STATUS;

// ============================================================================
// EVENT TYPES
// ============================================================================

export const EVENT_TYPES = {
  AGM: { name: 'Annual General Meeting', requiresQuorum: true },
  EGM: { name: 'Emergency General Meeting', requiresQuorum: true },
  EXECUTIVE: { name: 'Executive Committee Meeting', requiresQuorum: true },
  WARD: { name: 'Ward Meeting', requiresQuorum: false },
  TOWN_HALL: { name: 'Town Hall Meeting', requiresQuorum: false },
  COMMUNITY: { name: 'Community Event', requiresQuorum: false },
  SANITATION: { name: 'Sanitation Day', requiresQuorum: false },
  CULTURAL: { name: 'Cultural Festival', requiresQuorum: false },
  INAUGURATION: { name: 'Inauguration Ceremony', requiresQuorum: false },
  FUNDRAISING: { name: 'Fundraising Event', requiresQuorum: false },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export const EVENT_STATUS = {
  DRAFT: { name: 'Draft', color: 'gray' },
  SCHEDULED: { name: 'Scheduled', color: 'blue' },
  ONGOING: { name: 'Ongoing', color: 'purple' },
  COMPLETED: { name: 'Completed', color: 'green' },
  CANCELLED: { name: 'Cancelled', color: 'red' },
  POSTPONED: { name: 'Postponed', color: 'yellow' },
} as const;

export type EventStatus = keyof typeof EVENT_STATUS;

// ============================================================================
// VOTING/POLL TYPES
// ============================================================================

export const POLL_TYPES = {
  ELECTION: { name: 'Election', description: 'Elect officers/committee members' },
  DECISION: { name: 'Decision Poll', description: 'Yes/No/Abstain on proposals' },
  SURVEY: { name: 'Survey', description: 'Gather member opinions' },
  BUDGET_APPROVAL: { name: 'Budget Approval', description: 'Approve financial budgets' },
} as const;

export type PollType = keyof typeof POLL_TYPES;

export const POLL_STATUS = {
  DRAFT: { name: 'Draft', color: 'gray' },
  SCHEDULED: { name: 'Scheduled', color: 'blue' },
  ACTIVE: { name: 'Active/Voting', color: 'green' },
  CLOSED: { name: 'Closed', color: 'purple' },
  CANCELLED: { name: 'Cancelled', color: 'red' },
  RESULTS_DECLARED: { name: 'Results Declared', color: 'green' },
} as const;

export type PollStatus = keyof typeof POLL_STATUS;

// ============================================================================
// TYPES
// ============================================================================

export interface Constituent {
  id: string;
  tenantId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  membershipType: MembershipType;
  membershipStatus: MembershipStatus;
  ward?: string;
  zone?: string;
  unit?: string;
  block?: string;
  propertyType?: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED';
  propertyAddress?: string;
  householdSize?: number;
  occupation?: string;
  registrationDate: string;
  lastContributionDate?: string;
  totalContributions: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface DuesRecord {
  id: string;
  tenantId: string;
  constituentId: string;
  constituentName: string;
  duesType: DuesType;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAmount: number;
  paidDate?: string;
  receiptNumber?: string;
  period: string; // e.g., "January 2025" or "Q1 2025"
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  id: string;
  tenantId: string;
  ticketNumber: string;
  constituentId?: string;
  constituentName: string;
  category: ServiceRequestCategory;
  subcategory?: string;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  subject: string;
  description: string;
  location?: string;
  attachments?: string[];
  assignedTo?: string;
  assignedToName?: string;
  slaHours: number;
  slaDue: string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  tenantId: string;
  certificateNumber: string;
  constituentId: string;
  constituentName: string;
  certificateType: CertificateType;
  purpose?: string;
  status: CertificateStatus;
  issuedDate?: string;
  validUntil?: string;
  issuedBy?: string;
  verificationCode: string;
  feePaid: number;
  invoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CivicEvent {
  id: string;
  tenantId: string;
  eventType: EventType;
  title: string;
  description?: string;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  expectedAttendees: number;
  actualAttendees: number;
  quorumRequired: number;
  quorumMet: boolean;
  agenda?: string[];
  minutesUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Poll {
  id: string;
  tenantId: string;
  pollType: PollType;
  title: string;
  description?: string;
  positions?: PollPosition[];
  options?: PollOption[];
  votingStart: string;
  votingEnd: string;
  eligibleVotersCount: number;
  status: PollStatus;
  totalVotes: number;
  results?: Record<string, number>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollPosition {
  key: string;
  title: string;
  candidates: PollCandidate[];
}

export interface PollCandidate {
  id: string;
  name: string;
  manifesto?: string;
  photoUrl?: string;
}

export interface PollOption {
  key: string;
  label: string;
  description?: string;
}

export interface Vote {
  id: string;
  pollId: string;
  voterId: string;
  voterHash: string;
  selections: Record<string, string>;
  votedAt: string;
}

// ============================================================================
// CAPABILITY BUNDLE
// ============================================================================

export const CIVIC_CAPABILITY_BUNDLE = {
  key: 'civic',
  name: 'Civic Suite',
  description: 'Complete government and community organization management',
  requiredCapabilities: ['crm', 'billing', 'payments'],
  optionalCapabilities: ['analytics', 'campaigns', 'hr'],
};

// ============================================================================
// HELPERS
// ============================================================================

export function generateMemberNumber(tenantId: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MEM-${year}-${random}`;
}

export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `TKT-${year}-${random}`;
}

export function generateCertificateNumber(type: CertificateType): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  const prefix = CERTIFICATE_TYPES[type]?.name.substring(0, 3).toUpperCase() || 'CRT';
  return `${prefix}-${year}-${random}`;
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculateSlaDue(priority: ServiceRequestPriority): string {
  const slaHours = SERVICE_REQUEST_PRIORITY[priority].slaHours;
  const due = new Date();
  due.setHours(due.getHours() + slaHours);
  return due.toISOString();
}

export function isOverdue(slaDue: string): boolean {
  return new Date(slaDue) < new Date();
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
}
