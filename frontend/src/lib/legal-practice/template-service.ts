/**
 * LEGAL PRACTICE SUITE — Matter Template Service
 * Enhancement: Quick matter creation from common Nigerian case types
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { leg_MatterType, leg_MatterStatus } from '@prisma/client';

// Billing types (stored as strings in schema)
type BillingType = 'RETAINER' | 'HOURLY' | 'FLAT_FEE' | 'CONTINGENCY';

// ============================================================================
// TYPES
// ============================================================================

export interface MatterTemplate {
  id: string;
  name: string;
  description: string;
  matterType: leg_MatterType;
  practiceArea: string;
  billingType: leg_BillingType;
  suggestedFee: number;
  suggestedRetainer: number;
  defaultTasks: TemplateTask[];
  defaultDeadlines: TemplateDeadline[];
  defaultDocuments: TemplateDocument[];
  tags: string[];
  estimatedDuration: string;
  commonCourts: string[];
  notes: string;
}

export interface TemplateTask {
  title: string;
  description: string;
  daysFromStart: number;
  priority: number;
}

export interface TemplateDeadline {
  title: string;
  deadlineType: 'COURT_DATE' | 'FILING_DEADLINE' | 'LIMITATION' | 'INTERNAL';
  daysFromStart: number;
  description: string;
}

export interface TemplateDocument {
  title: string;
  category: string;
  description: string;
  required: boolean;
}

export interface CreateMatterFromTemplateInput {
  templateId: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  title: string;
  description?: string;
  court?: string;
  suitNumber?: string;
  leadLawyerId?: string;
  leadLawyerName?: string;
  agreedFee?: number;
  retainerAmount?: number;
}

// ============================================================================
// NIGERIAN LEGAL MATTER TEMPLATES
// ============================================================================

export const MATTER_TEMPLATES: MatterTemplate[] = [
  // CIVIL LITIGATION
  {
    id: 'civil-debt-recovery',
    name: 'Debt Recovery / Money Claim',
    description: 'Standard debt recovery action for unpaid loans, invoices, or contractual debts',
    matterType: 'CIVIL',
    practiceArea: 'Civil Litigation',
    billingType: 'RETAINER',
    suggestedFee: 500000,
    suggestedRetainer: 250000,
    defaultTasks: [
      { title: 'Client Interview & Documentation', description: 'Gather all evidence of debt', daysFromStart: 0, priority: 1 },
      { title: 'Demand Letter', description: 'Draft and send formal demand letter', daysFromStart: 3, priority: 1 },
      { title: 'Draft Writ of Summons', description: 'Prepare court originating process', daysFromStart: 14, priority: 1 },
      { title: 'File at Court Registry', description: 'File originating processes', daysFromStart: 21, priority: 1 },
      { title: 'Effect Service', description: 'Serve defendant via bailiff', daysFromStart: 28, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'Demand Letter Deadline', deadlineType: 'INTERNAL', daysFromStart: 7, description: '7 days to respond to demand' },
      { title: 'Limitation Period Check', deadlineType: 'LIMITATION', daysFromStart: 0, description: 'Verify statute of limitations (6 years for simple contract)' },
    ],
    defaultDocuments: [
      { title: 'Evidence of Debt', ProductCategory: 'evidence', description: 'Contracts, invoices, receipts', required: true },
      { title: 'Demand Letter', ProductCategory: 'correspondence', description: 'Formal demand for payment', required: true },
      { title: 'Writ of Summons', ProductCategory: 'court_process', description: 'Originating court process', required: true },
      { title: 'Statement of Claim', ProductCategory: 'pleading', description: 'Details of claim against defendant', required: true },
    ],
    tags: ['debt', 'recovery', 'civil', 'money-claim'],
    estimatedDuration: '6-12 months',
    commonCourts: ['Magistrate Court', 'High Court', 'Federal High Court'],
    notes: 'Consider mediation before litigation. Check if debtor has assets for enforcement.',
  },

  {
    id: 'civil-breach-of-contract',
    name: 'Breach of Contract',
    description: 'Civil action for breach of contractual obligations with damages claim',
    matterType: 'CIVIL',
    practiceArea: 'Civil Litigation',
    billingType: 'RETAINER',
    suggestedFee: 2000000,
    suggestedRetainer: 1000000,
    defaultTasks: [
      { title: 'Contract Review & Analysis', description: 'Analyze contract terms and breach', daysFromStart: 0, priority: 1 },
      { title: 'Evidence Gathering', description: 'Collect all correspondence and documents', daysFromStart: 3, priority: 1 },
      { title: 'Pre-Action Notice', description: 'Send formal notice of intended action', daysFromStart: 7, priority: 1 },
      { title: 'Draft Originating Summons/Writ', description: 'Prepare court process', daysFromStart: 21, priority: 1 },
      { title: 'Damages Assessment', description: 'Calculate and document losses', daysFromStart: 14, priority: 2 },
    ],
    defaultDeadlines: [
      { title: 'Pre-Action Notice Expiry', deadlineType: 'INTERNAL', daysFromStart: 21, description: '14 days notice period' },
      { title: 'Limitation Period', deadlineType: 'LIMITATION', daysFromStart: 0, description: '6 years from breach (simple contract)' },
    ],
    defaultDocuments: [
      { title: 'Contract Agreement', ProductCategory: 'evidence', description: 'Original contract document', required: true },
      { title: 'Correspondence', ProductCategory: 'evidence', description: 'Emails, letters between parties', required: true },
      { title: 'Damages Schedule', ProductCategory: 'evidence', description: 'Itemized list of losses', required: true },
    ],
    tags: ['contract', 'breach', 'damages', 'civil'],
    estimatedDuration: '12-24 months',
    commonCourts: ['High Court', 'Federal High Court'],
    notes: 'Check for arbitration clause in contract. Consider specific performance as alternative remedy.',
  },

  // CRIMINAL DEFENSE
  {
    id: 'criminal-defense-general',
    name: 'Criminal Defense (General)',
    description: 'Defense of accused person in criminal proceedings',
    matterType: 'CRIMINAL',
    practiceArea: 'Criminal Defense',
    billingType: 'RETAINER',
    suggestedFee: 3000000,
    suggestedRetainer: 1500000,
    defaultTasks: [
      { title: 'Initial Client Interview', description: 'Get full account from client', daysFromStart: 0, priority: 1 },
      { title: 'Police Station Visit', description: 'Visit client if detained, assess situation', daysFromStart: 0, priority: 1 },
      { title: 'Bail Application', description: 'Prepare and file bail application', daysFromStart: 1, priority: 1 },
      { title: 'Review Charge Sheet', description: 'Analyze charges and evidence', daysFromStart: 3, priority: 1 },
      { title: 'Witness Identification', description: 'Identify defense witnesses', daysFromStart: 7, priority: 2 },
      { title: 'Defense Strategy Meeting', description: 'Discuss trial strategy with client', daysFromStart: 14, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'Arraignment Date', deadlineType: 'COURT_DATE', daysFromStart: 7, description: 'First court appearance' },
      { title: 'Bail Hearing', deadlineType: 'COURT_DATE', daysFromStart: 2, description: 'Bail application hearing' },
    ],
    defaultDocuments: [
      { title: 'Charge Sheet', ProductCategory: 'court_process', description: 'Criminal charges against client', required: true },
      { title: 'Bail Application', ProductCategory: 'motion', description: 'Application for bail', required: true },
      { title: 'Client Statement', ProductCategory: 'evidence', description: 'Client\'s written account', required: true },
      { title: 'Witness Statements', ProductCategory: 'evidence', description: 'Defense witness statements', required: false },
    ],
    tags: ['criminal', 'defense', 'bail', 'trial'],
    estimatedDuration: '6-24 months',
    commonCourts: ['Magistrate Court', 'High Court', 'Federal High Court'],
    notes: 'Ensure client understands bail conditions. Preserve evidence immediately.',
  },

  {
    id: 'criminal-financial-crime',
    name: 'Financial Crime Defense (EFCC/ICPC)',
    description: 'Defense against financial crime charges by EFCC, ICPC, or police',
    matterType: 'CRIMINAL',
    practiceArea: 'White Collar Crime',
    billingType: 'RETAINER',
    suggestedFee: 10000000,
    suggestedRetainer: 5000000,
    defaultTasks: [
      { title: 'Emergency Response', description: 'Immediate client contact and protection', daysFromStart: 0, priority: 1 },
      { title: 'Agency Liaison', description: 'Contact EFCC/ICPC investigators', daysFromStart: 0, priority: 1 },
      { title: 'Document Preservation', description: 'Secure all financial records', daysFromStart: 1, priority: 1 },
      { title: 'Forensic Accountant Engagement', description: 'Engage expert to analyze transactions', daysFromStart: 3, priority: 1 },
      { title: 'Bail Strategy', description: 'Prepare comprehensive bail application', daysFromStart: 2, priority: 1 },
      { title: 'Asset Protection Review', description: 'Advise on asset freezing risks', daysFromStart: 5, priority: 2 },
    ],
    defaultDeadlines: [
      { title: 'Detention Review (48 hours)', deadlineType: 'INTERNAL', daysFromStart: 2, description: 'Constitutional detention limit' },
      { title: 'Court Order Review', deadlineType: 'FILING_DEADLINE', daysFromStart: 14, description: 'Extended detention court order expiry' },
    ],
    defaultDocuments: [
      { title: 'Charge Sheet', ProductCategory: 'court_process', description: 'EFCC/ICPC charges', required: true },
      { title: 'Bank Statements', ProductCategory: 'evidence', description: 'Client financial records', required: true },
      { title: 'Forensic Report', ProductCategory: 'evidence', description: 'Expert accountant analysis', required: false },
      { title: 'Asset Declaration', ProductCategory: 'evidence', description: 'Client asset disclosure', required: true },
    ],
    tags: ['efcc', 'icpc', 'financial-crime', 'fraud', 'money-laundering'],
    estimatedDuration: '12-36 months',
    commonCourts: ['Federal High Court', 'High Court'],
    notes: 'Critical: Preserve all communications. No admission without counsel. Media management important.',
  },

  // FAMILY LAW
  {
    id: 'family-divorce',
    name: 'Divorce Proceedings',
    description: 'Dissolution of marriage under Matrimonial Causes Act or customary law',
    matterType: 'FAMILY',
    practiceArea: 'Family Law',
    billingType: 'FLAT_FEE',
    suggestedFee: 1500000,
    suggestedRetainer: 750000,
    defaultTasks: [
      { title: 'Client Consultation', description: 'Understand marriage history and grounds', daysFromStart: 0, priority: 1 },
      { title: 'Marriage Certificate Verification', description: 'Verify type of marriage (statutory/customary)', daysFromStart: 1, priority: 1 },
      { title: 'Petition Drafting', description: 'Draft divorce petition', daysFromStart: 7, priority: 1 },
      { title: 'Property Assessment', description: 'Document matrimonial assets', daysFromStart: 7, priority: 2 },
      { title: 'Child Custody Assessment', description: 'Evaluate custody arrangements', daysFromStart: 7, priority: 2 },
      { title: 'File Petition', description: 'File at appropriate court', daysFromStart: 14, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'Service on Respondent', deadlineType: 'FILING_DEADLINE', daysFromStart: 28, description: 'Serve petition on spouse' },
      { title: 'Response Period', deadlineType: 'INTERNAL', daysFromStart: 42, description: 'Time for respondent to file answer' },
    ],
    defaultDocuments: [
      { title: 'Marriage Certificate', ProductCategory: 'evidence', description: 'Original or certified copy', required: true },
      { title: 'Petition for Divorce', ProductCategory: 'pleading', description: 'Divorce application', required: true },
      { title: 'Financial Statement', ProductCategory: 'evidence', description: 'Assets and liabilities', required: true },
      { title: 'Children Birth Certificates', ProductCategory: 'evidence', description: 'If children involved', required: false },
    ],
    tags: ['divorce', 'family', 'matrimonial', 'custody'],
    estimatedDuration: '6-12 months',
    commonCourts: ['High Court (Family Division)', 'Customary Court'],
    notes: 'Determine ground for divorce (MCA requires one year marriage). Consider mediation first.',
  },

  {
    id: 'family-child-custody',
    name: 'Child Custody Application',
    description: 'Application for custody, guardianship, or access to children',
    matterType: 'FAMILY',
    practiceArea: 'Family Law',
    billingType: 'RETAINER',
    suggestedFee: 1000000,
    suggestedRetainer: 500000,
    defaultTasks: [
      { title: 'Welfare Assessment', description: 'Document child welfare considerations', daysFromStart: 0, priority: 1 },
      { title: 'Evidence of Care', description: 'Gather evidence of caregiving role', daysFromStart: 3, priority: 1 },
      { title: 'Draft Application', description: 'Prepare custody application', daysFromStart: 7, priority: 1 },
      { title: 'Child Interview Prep', description: 'Prepare for court welfare report', daysFromStart: 14, priority: 2 },
    ],
    defaultDeadlines: [
      { title: 'Interim Application', deadlineType: 'FILING_DEADLINE', daysFromStart: 7, description: 'Emergency custody if needed' },
    ],
    defaultDocuments: [
      { title: 'Custody Application', ProductCategory: 'motion', description: 'Formal application to court', required: true },
      { title: 'Affidavit of Welfare', ProductCategory: 'evidence', description: "Child's best interest statement", required: true },
      { title: 'Birth Certificate', ProductCategory: 'evidence', description: 'Child birth documentation', required: true },
    ],
    tags: ['custody', 'children', 'family', 'guardianship'],
    estimatedDuration: '3-9 months',
    commonCourts: ['High Court (Family Division)'],
    notes: "Paramount consideration is child's best interest. Consider child's preference if age appropriate.",
  },

  // PROPERTY LAW
  {
    id: 'property-land-dispute',
    name: 'Land Ownership Dispute',
    description: 'Dispute over ownership, boundaries, or title to land',
    matterType: 'PROPERTY',
    practiceArea: 'Property Law',
    billingType: 'RETAINER',
    suggestedFee: 5000000,
    suggestedRetainer: 2500000,
    defaultTasks: [
      { title: 'Title Document Review', description: 'Analyze all title documents', daysFromStart: 0, priority: 1 },
      { title: 'Land Registry Search', description: 'Conduct search at Land Registry', daysFromStart: 3, priority: 1 },
      { title: 'Survey Plan Review', description: 'Engage surveyor to verify boundaries', daysFromStart: 7, priority: 1 },
      { title: 'Traditional History', description: 'Document customary ownership chain', daysFromStart: 7, priority: 2 },
      { title: 'Site Inspection', description: 'Physical inspection of property', daysFromStart: 5, priority: 1 },
      { title: 'Writ of Summons/Originating Summons', description: 'Prepare court process', daysFromStart: 21, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'Caveat Filing', deadlineType: 'FILING_DEADLINE', daysFromStart: 7, description: 'File caveat to protect interest' },
      { title: 'Limitation Period', deadlineType: 'LIMITATION', daysFromStart: 0, description: '12 years for recovery of land' },
    ],
    defaultDocuments: [
      { title: 'Certificate of Occupancy (C of O)', ProductCategory: 'evidence', description: 'State land title', required: false },
      { title: 'Survey Plan', ProductCategory: 'evidence', description: 'Registered survey document', required: true },
      { title: 'Deed of Assignment', ProductCategory: 'evidence', description: 'Transfer documents', required: false },
      { title: 'Receipt/Purchase Agreement', ProductCategory: 'evidence', description: 'Evidence of purchase', required: true },
      { title: 'Photographs of Property', ProductCategory: 'evidence', description: 'Current state of land', required: true },
    ],
    tags: ['land', 'property', 'title', 'boundary', 'ownership'],
    estimatedDuration: '24-48 months',
    commonCourts: ['High Court', 'Federal High Court (Federal Land)'],
    notes: 'Land cases are lengthy. Consider survey accuracy. Root of title investigation critical.',
  },

  {
    id: 'property-tenancy-dispute',
    name: 'Landlord-Tenant Dispute',
    description: 'Eviction, rent recovery, or tenancy rights dispute',
    matterType: 'PROPERTY',
    practiceArea: 'Property Law',
    billingType: 'FLAT_FEE',
    suggestedFee: 300000,
    suggestedRetainer: 150000,
    defaultTasks: [
      { title: 'Tenancy Agreement Review', description: 'Review lease terms', daysFromStart: 0, priority: 1 },
      { title: 'Notice to Quit', description: 'Serve proper quit notice', daysFromStart: 3, priority: 1 },
      { title: 'Notice of Owner\'s Intention', description: '7 days notice after quit notice expires', daysFromStart: 90, priority: 1 },
      { title: 'Court Application', description: 'File for possession/recovery', daysFromStart: 100, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'Notice Period', deadlineType: 'INTERNAL', daysFromStart: 90, description: 'Notice period per tenancy type' },
      { title: '7 Days Notice Expiry', deadlineType: 'INTERNAL', daysFromStart: 97, description: "Owner's intention notice" },
    ],
    defaultDocuments: [
      { title: 'Tenancy Agreement', ProductCategory: 'evidence', description: 'Original lease document', required: true },
      { title: 'Notice to Quit', ProductCategory: 'correspondence', description: 'Quit notice to tenant', required: true },
      { title: "Owner's Intention Notice", ProductCategory: 'correspondence', description: '7 days recovery notice', required: true },
      { title: 'Rent Receipt/Payment History', ProductCategory: 'evidence', description: 'Payment records', required: true },
    ],
    tags: ['landlord', 'tenant', 'eviction', 'rent', 'possession'],
    estimatedDuration: '3-9 months',
    commonCourts: ['Magistrate Court', 'High Court'],
    notes: 'Notice periods: Weekly (1 week), Monthly (1 month), Yearly (6 months in Lagos). Check Lagos Tenancy Law.',
  },

  // EMPLOYMENT LAW
  {
    id: 'employment-wrongful-termination',
    name: 'Wrongful Termination Claim',
    description: 'Claim for wrongful or unfair dismissal from employment',
    matterType: 'EMPLOYMENT',
    practiceArea: 'Employment Law',
    billingType: 'CONTINGENCY',
    suggestedFee: 2000000,
    suggestedRetainer: 500000,
    defaultTasks: [
      { title: 'Employment History Review', description: 'Document employment timeline', daysFromStart: 0, priority: 1 },
      { title: 'Contract Analysis', description: 'Review employment contract', daysFromStart: 1, priority: 1 },
      { title: 'Termination Letter Analysis', description: 'Analyze grounds for dismissal', daysFromStart: 1, priority: 1 },
      { title: 'Damages Calculation', description: 'Calculate entitlements and losses', daysFromStart: 7, priority: 1 },
      { title: 'Pre-Action Letter', description: 'Demand letter to employer', daysFromStart: 14, priority: 1 },
      { title: 'NIC Complaint/Writ', description: 'File at National Industrial Court', daysFromStart: 30, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'Limitation Period', deadlineType: 'LIMITATION', daysFromStart: 0, description: 'Check applicable limitation' },
      { title: 'Pre-Action Response', deadlineType: 'INTERNAL', daysFromStart: 21, description: '7 days for employer response' },
    ],
    defaultDocuments: [
      { title: 'Employment Contract', ProductCategory: 'evidence', description: 'Terms of employment', required: true },
      { title: 'Termination Letter', ProductCategory: 'evidence', description: 'Dismissal notice', required: true },
      { title: 'Pay Slips', ProductCategory: 'evidence', description: 'Salary documentation', required: true },
      { title: 'Staff Handbook', ProductCategory: 'evidence', description: 'Company policies', required: false },
      { title: 'Query/Warning Letters', ProductCategory: 'evidence', description: 'Disciplinary correspondence', required: false },
    ],
    tags: ['employment', 'termination', 'unfair-dismissal', 'nic'],
    estimatedDuration: '6-18 months',
    commonCourts: ['National Industrial Court'],
    notes: 'NIC has exclusive jurisdiction. Consider negotiated settlement. Document all communications.',
  },

  // CORPORATE/COMMERCIAL
  {
    id: 'corporate-company-dispute',
    name: 'Shareholder/Director Dispute',
    description: 'Disputes involving shareholders, directors, or company management',
    matterType: 'CORPORATE',
    practiceArea: 'Corporate Law',
    billingType: 'HOURLY',
    suggestedFee: 8000000,
    suggestedRetainer: 4000000,
    defaultTasks: [
      { title: 'Company Documents Review', description: 'Review MemoArts, shareholder agreements', daysFromStart: 0, priority: 1 },
      { title: 'CAC Search', description: 'Verify company records at CAC', daysFromStart: 3, priority: 1 },
      { title: 'Board Minutes Review', description: 'Analyze board decisions', daysFromStart: 5, priority: 1 },
      { title: 'Shareholders Register Check', description: 'Verify shareholding', daysFromStart: 3, priority: 1 },
      { title: 'Injunction Application', description: 'If urgent relief needed', daysFromStart: 7, priority: 1 },
    ],
    defaultDeadlines: [
      { title: 'AGM Notice Period', deadlineType: 'INTERNAL', daysFromStart: 21, description: '21 days notice for AGM' },
      { title: 'Injunction Hearing', deadlineType: 'COURT_DATE', daysFromStart: 14, description: 'Interim relief hearing' },
    ],
    defaultDocuments: [
      { title: 'Memorandum & Articles', ProductCategory: 'evidence', description: 'Company constitution', required: true },
      { title: 'Shareholder Agreement', ProductCategory: 'evidence', description: 'If any exists', required: false },
      { title: 'Board Resolutions', ProductCategory: 'evidence', description: 'Relevant board minutes', required: true },
      { title: 'Share Certificates', ProductCategory: 'evidence', description: 'Proof of shareholding', required: true },
      { title: 'CAC Forms', ProductCategory: 'evidence', description: 'Annual returns, Form CAC7', required: true },
    ],
    tags: ['corporate', 'shareholder', 'director', 'company', 'minority'],
    estimatedDuration: '12-24 months',
    commonCourts: ['Federal High Court'],
    notes: 'Consider derivative action vs personal action. Check minority protection provisions in CAMA.',
  },

  // BANKING & FINANCE
  {
    id: 'banking-loan-recovery',
    name: 'Bank Loan Recovery',
    description: 'Recovery of outstanding loan facilities for financial institutions',
    matterType: 'BANKING',
    practiceArea: 'Banking & Finance',
    billingType: 'HOURLY',
    suggestedFee: 5000000,
    suggestedRetainer: 2500000,
    defaultTasks: [
      { title: 'Loan Documentation Review', description: 'Analyze loan facility documents', daysFromStart: 0, priority: 1 },
      { title: 'Security Documentation Review', description: 'Review collateral documents', daysFromStart: 1, priority: 1 },
      { title: 'Default Notice', description: 'Issue formal demand/recall notice', daysFromStart: 3, priority: 1 },
      { title: 'Security Enforcement Options', description: 'Assess enforcement routes', daysFromStart: 7, priority: 1 },
      { title: 'Writ/Originating Summons', description: 'Prepare court process if needed', daysFromStart: 21, priority: 2 },
    ],
    defaultDeadlines: [
      { title: 'Demand Notice Period', deadlineType: 'INTERNAL', daysFromStart: 14, description: 'Notice period before action' },
      { title: 'Security Enforcement Notice', deadlineType: 'INTERNAL', daysFromStart: 21, description: 'AMCON/Receiver appointment' },
    ],
    defaultDocuments: [
      { title: 'Offer Letter', ProductCategory: 'evidence', description: 'Loan facility offer', required: true },
      { title: 'Loan Agreement', ProductCategory: 'evidence', description: 'Facility agreement', required: true },
      { title: 'Deed of Legal Mortgage', ProductCategory: 'evidence', description: 'Security document', required: false },
      { title: 'Guarantee', ProductCategory: 'evidence', description: 'Personal/corporate guarantee', required: false },
      { title: 'Account Statement', ProductCategory: 'evidence', description: 'Loan account history', required: true },
    ],
    tags: ['banking', 'loan', 'recovery', 'security', 'mortgage'],
    estimatedDuration: '6-18 months',
    commonCourts: ['Federal High Court', 'High Court'],
    notes: 'Consider receivership vs litigation. Check BOFIA provisions. AMCON option for eligible debts.',
  },

  // INTELLECTUAL PROPERTY
  {
    id: 'ip-trademark-registration',
    name: 'Trademark Registration',
    description: 'Registration of trademark/service mark with Nigerian Trademarks Registry',
    matterType: 'INTELLECTUAL_PROPERTY',
    practiceArea: 'Intellectual Property',
    billingType: 'FLAT_FEE',
    suggestedFee: 350000,
    suggestedRetainer: 350000,
    defaultTasks: [
      { title: 'Trademark Search', description: 'Search existing registrations', daysFromStart: 0, priority: 1 },
      { title: 'Classification Review', description: 'Determine appropriate classes', daysFromStart: 3, priority: 1 },
      { title: 'Application Preparation', description: 'Prepare TM-1 form', daysFromStart: 7, priority: 1 },
      { title: 'Filing at Registry', description: 'Submit application', daysFromStart: 10, priority: 1 },
      { title: 'Examination Follow-up', description: 'Respond to objections if any', daysFromStart: 90, priority: 2 },
    ],
    defaultDeadlines: [
      { title: 'Search Validity', deadlineType: 'INTERNAL', daysFromStart: 30, description: 'Search results valid 30 days' },
      { title: 'Opposition Period', deadlineType: 'INTERNAL', daysFromStart: 150, description: '2 months for third party opposition' },
    ],
    defaultDocuments: [
      { title: 'Trademark Representation', ProductCategory: 'evidence', description: 'Logo/mark image', required: true },
      { title: 'TM-1 Application Form', ProductCategory: 'court_process', description: 'Registration application', required: true },
      { title: 'Power of Attorney', ProductCategory: 'evidence', description: 'Agent authorization', required: true },
      { title: 'Certificate of Incorporation', ProductCategory: 'evidence', description: 'For corporate applicants', required: false },
    ],
    tags: ['trademark', 'ip', 'registration', 'brand'],
    estimatedDuration: '12-18 months',
    commonCourts: ['Trademarks Registry, Abuja'],
    notes: 'Each class requires separate application. Consider international registration (Madrid Protocol).',
  },

  // TAX
  {
    id: 'tax-appeal',
    name: 'Tax Assessment Appeal',
    description: 'Appeal against FIRS/State tax assessment or penalty',
    matterType: 'TAX',
    practiceArea: 'Tax Law',
    billingType: 'RETAINER',
    suggestedFee: 2000000,
    suggestedRetainer: 1000000,
    defaultTasks: [
      { title: 'Assessment Review', description: 'Analyze tax assessment notice', daysFromStart: 0, priority: 1 },
      { title: 'Financial Records Review', description: 'Review underlying tax records', daysFromStart: 3, priority: 1 },
      { title: 'Objection Letter', description: 'File formal objection with FIRS', daysFromStart: 14, priority: 1 },
      { title: 'TAT Appeal', description: 'Prepare Tax Appeal Tribunal notice', daysFromStart: 30, priority: 1 },
      { title: 'Expert Engagement', description: 'Engage tax consultant if needed', daysFromStart: 7, priority: 2 },
    ],
    defaultDeadlines: [
      { title: 'Objection Deadline', deadlineType: 'FILING_DEADLINE', daysFromStart: 30, description: '30 days from assessment' },
      { title: 'TAT Appeal Deadline', deadlineType: 'FILING_DEADLINE', daysFromStart: 30, description: '30 days from objection decision' },
    ],
    defaultDocuments: [
      { title: 'Assessment Notice', ProductCategory: 'evidence', description: 'FIRS assessment', required: true },
      { title: 'Tax Returns', ProductCategory: 'evidence', description: 'Filed tax returns', required: true },
      { title: 'Financial Statements', ProductCategory: 'evidence', description: 'Audited accounts', required: true },
      { title: 'Objection Letter', ProductCategory: 'correspondence', description: 'Formal objection', required: true },
      { title: 'Notice of Appeal', ProductCategory: 'court_process', description: 'TAT appeal', required: true },
    ],
    tags: ['tax', 'firs', 'appeal', 'assessment'],
    estimatedDuration: '6-12 months',
    commonCourts: ['Tax Appeal Tribunal', 'Federal High Court'],
    notes: 'Strict timelines. Pay disputed amount to preserve appeal rights. ADR available.',
  },
];

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all available matter templates
 */
export async function getMatterTemplates(): Promise<MatterTemplate[]> {
  return MATTER_TEMPLATES;
}

/**
 * Get templates by matter type
 */
export async function getTemplatesByType(matterType: leg_MatterType): Promise<MatterTemplate[]> {
  return MATTER_TEMPLATES.filter((t: any) => t.matterType === matterType);
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(templateId: string): Promise<MatterTemplate | null> {
  return MATTER_TEMPLATES.find((t: any) => t.id === templateId) || null;
}

/**
 * Create a new matter from a template
 */
export async function createMatterFromTemplate(
  tenantId: string,
  platformInstanceId: string,
  input: CreateMatterFromTemplateInput
): Promise<any> {
  const template = await getTemplateById(input.templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${input.templateId}`);
  }

  // Generate matter number
  const year = new Date().getFullYear();
  const count = await prisma.leg_matter.count({ 
    where: { tenantId, matterNumber: { startsWith: `MAT-${year}-` } } 
  });
  const matterNumber = `MAT-${year}-${String(count + 1).padStart(4, '0')}`;

  // Create the matter
  const matter = await prisma.leg_matter.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      matterNumber,
      title: input.title,
      description: input.description || template.description,
      matterType: template.matterType,
      status: 'DRAFT',
      practiceArea: template.practiceArea,
      clientId: input.clientId,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      clientEmail: input.clientEmail,
      court: input.court,
      suitNumber: input.suitNumber,
      billingType: template.billingType,
      agreedFee: input.agreedFee || template.suggestedFee,
      retainerAmount: input.retainerAmount || template.suggestedRetainer,
      leadLawyerId: input.leadLawyerId,
      leadLawyerName: input.leadLawyerName,
      openDate: new Date(),
      tags: template.tags,
    }),
  });

  // Create default deadlines from template
  const deadlinePromises = template.defaultDeadlines.map((d: any) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + d.daysFromStart);
    
    return prisma.leg_deadline.create({
      data: withPrismaDefaults({
        tenantId,
        matterId: matter.id,
        deadlineType: d.deadlineType,
        title: d.title,
        description: d.description,
        dueDate,
        status: 'PENDING',
        priority: 2,
      }),
    });
  });

  // Create document placeholders from template
  const documentPromises = template.defaultDocuments
    .filter((d: any) => d.required)
    .map((d: any) => {
      return prisma.leg_document.create({
        data: withPrismaDefaults({
          tenantId,
          matterId: matter.id,
          title: d.title,
          ProductCategory: d.category,
          description: d.description,
          status: 'Draft',
        }),
      });
    });

  // Execute all creates
  await Promise.all([...deadlinePromises, ...documentPromises]);

  return {
    matter,
    templateUsed: template.name,
    deadlinesCreated: template.defaultDeadlines.length,
    documentsCreated: template.defaultDocuments.filter((d: any) => d.required).length,
    suggestedTasks: template.defaultTasks,
    notes: template.notes,
  };
}

/**
 * Get template statistics
 */
export async function getTemplateStats(): Promise<{
  totalTemplates: number;
  byMatterType: Record<string, number>;
  byPracticeArea: Record<string, number>;
}> {
  const byMatterType: Record<string, number> = {};
  const byPracticeArea: Record<string, number> = {};

  MATTER_TEMPLATES.forEach((t: any) => {
    byMatterType[t.matterType] = (byMatterType[t.matterType] || 0) + 1;
    byPracticeArea[t.practiceArea] = (byPracticeArea[t.practiceArea] || 0) + 1;
  });

  return {
    totalTemplates: MATTER_TEMPLATES.length,
    byMatterType,
    byPracticeArea,
  };
}
