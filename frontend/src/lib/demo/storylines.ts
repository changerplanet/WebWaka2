/**
 * Demo Storyline Configurations
 * 
 * JSON-based storyline definitions for Partner Demo Mode.
 * Each storyline is a guided walkthrough of specific suites.
 * 
 * @module lib/demo/storylines
 * @phase Phase 2 Track A
 */

import { Storyline, StorylineId } from './types'

// ============================================================================
// STORYLINE 1: RETAIL BUSINESS IN LAGOS
// ============================================================================

export const retailStoryline: Storyline = {
  id: 'retail',
  name: 'Retail Business in Lagos',
  description: 'A complete walkthrough for small-to-medium retail shop owners',
  persona: 'Small-to-medium retail shop owner',
  durationMinutes: 8,
  suites: ['POS', 'Inventory', 'Payments', 'Accounting'],
  steps: [
    {
      id: 'retail-1',
      stepNumber: 1,
      title: 'POS Overview',
      description: 'Point-of-sale and retail operations',
      narrative: 'Your day starts with opening a cash drawer. This ensures every Naira is tracked from the moment you start.',
      suite: 'POS',
      route: '/pos',
      actionHint: 'This is where staff manages retail transactions',
      nigeriaNote: 'Cash-heavy businesses need strict shift accountability'
    },
    {
      id: 'retail-2',
      stepNumber: 2,
      title: 'Check Stock',
      description: 'Real-time inventory visibility',
      narrative: 'Every sale automatically updates stock levels. No more overselling or manual stock counts.',
      suite: 'Inventory',
      route: '/inventory-demo',
      actionHint: 'View real-time stock levels',
      nigeriaNote: 'Multi-location support for Lagos, Ibadan, Abuja warehouses'
    },
    {
      id: 'retail-3',
      stepNumber: 3,
      title: 'View Transfers',
      description: 'Bank transfer payment tracking',
      narrative: 'Bank transfers are fully tracked with proof-of-payment verification. No more chasing customers.',
      suite: 'Payments',
      route: '/payments-demo',
      actionHint: 'See the bank transfer workflow',
      nigeriaNote: 'GTBank, Access, Zenith, OPay, PalmPay all supported'
    },
    {
      id: 'retail-4',
      stepNumber: 4,
      title: 'See Journal',
      description: 'Automatic accounting entries',
      narrative: 'Every sale creates an audit-ready journal entry. Your books are always balanced.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'View auto-generated journal entries',
      nigeriaNote: '7.5% VAT automatically tracked'
    }
  ]
}

// ============================================================================
// STORYLINE 2: MARKETPLACE OPERATOR
// ============================================================================

export const marketplaceStoryline: Storyline = {
  id: 'marketplace',
  name: 'Marketplace Operator',
  description: 'Platform owner connecting multiple vendors',
  persona: 'Digital marketplace owner',
  durationMinutes: 10,
  suites: ['MVM', 'Inventory', 'Payments', 'Billing'],
  steps: [
    {
      id: 'marketplace-1',
      stepNumber: 1,
      title: 'View Vendors',
      description: 'Manage your marketplace vendors',
      narrative: 'Onboard vendors with a structured approval workflow. Control who sells on your platform.',
      suite: 'MVM',
      route: '/commerce-mvm-demo',
      actionHint: 'See the vendor management dashboard',
      nigeriaNote: 'Lagos Digital Market demo with Nigerian vendors'
    },
    {
      id: 'marketplace-2',
      stepNumber: 2,
      title: 'Multi-Vendor Stock',
      description: 'Each vendor manages their inventory',
      narrative: 'Vendors control their own stock levels while you maintain platform oversight.',
      suite: 'Inventory',
      route: '/inventory-demo',
      actionHint: 'See multi-vendor inventory view'
    },
    {
      id: 'marketplace-3',
      stepNumber: 3,
      title: 'Split Payments',
      description: 'Automatic payment splitting',
      narrative: 'Customer payments are automatically split between vendors and platform commission.',
      suite: 'Payments',
      route: '/payments-demo',
      actionHint: 'View payment splitting logic',
      nigeriaNote: 'Bank transfer verification for vendor payouts'
    },
    {
      id: 'marketplace-4',
      stepNumber: 4,
      title: 'Vendor Invoice',
      description: 'Settlement invoicing',
      narrative: 'Generate professional invoices for vendor settlements with full VAT compliance.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'See vendor settlement invoices',
      nigeriaNote: '7.5% VAT on commission amounts'
    }
  ]
}

// ============================================================================
// STORYLINE 3: SME WITH INVOICING + ACCOUNTING
// ============================================================================

export const smeStoryline: Storyline = {
  id: 'sme',
  name: 'SME with Invoicing + Accounting',
  description: 'Service business needing financial management',
  persona: 'Professional services or B2B business owner',
  durationMinutes: 7,
  suites: ['Billing', 'Payments', 'Accounting'],
  steps: [
    {
      id: 'sme-1',
      stepNumber: 1,
      title: 'Create Invoice',
      description: 'Professional invoice creation',
      narrative: 'Create professional invoices with automatic 7.5% VAT calculation. Nigerian TIN support included.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'See the invoice creation workflow',
      nigeriaNote: 'VAT exempt options for NGOs and educational services'
    },
    {
      id: 'sme-2',
      stepNumber: 2,
      title: 'Send to Customer',
      description: 'Invoice delivery and tracking',
      narrative: 'Send invoices via email with read tracking. Know when your customer opens the invoice.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'View invoice status tracking'
    },
    {
      id: 'sme-3',
      stepNumber: 3,
      title: 'Record Payment',
      description: 'Track incoming payments',
      narrative: 'Record full or partial payments. Partial payment tracking is built-in for B2B relationships.',
      suite: 'Payments',
      route: '/payments-demo',
      actionHint: 'See partial payment recording',
      nigeriaNote: 'Net-30 payment terms standard in Nigeria'
    },
    {
      id: 'sme-4',
      stepNumber: 4,
      title: 'Apply Credit Note',
      description: 'Handle returns and adjustments',
      narrative: 'Issue credit notes for returns, pricing errors, or goodwill. Full audit trail maintained.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'View credit note workflow'
    },
    {
      id: 'sme-5',
      stepNumber: 5,
      title: 'View Trial Balance',
      description: 'Books are always balanced',
      narrative: 'Your trial balance is always current. Debits equal credits, guaranteed.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'See the trial balance report',
      nigeriaNote: 'Nigeria SME Chart of Accounts (56 accounts)'
    }
  ]
}

// ============================================================================
// STORYLINE 4: END-TO-END COMMERCE FLOW
// ============================================================================

export const fullTourStoryline: Storyline = {
  id: 'full',
  name: 'End-to-End Commerce Flow',
  description: 'Complete platform overview for investors and evaluators',
  persona: 'Investor, technical evaluator, or regulator',
  durationMinutes: 12,
  suites: ['All'],
  steps: [
    {
      id: 'full-1',
      stepNumber: 1,
      title: 'Platform Overview',
      description: '8 integrated suites, 40+ APIs',
      narrative: 'WebWaka Commerce is a complete, Nigeria-first commerce platform with 8 frozen, demo-ready suites.',
      suite: 'Overview',
      route: '/commerce-demo',
      actionHint: 'See the unified commerce portal'
    },
    {
      id: 'full-2',
      stepNumber: 2,
      title: 'Multi-Vendor Marketplace',
      description: 'Platform connecting vendors',
      narrative: 'Marketplace with vendor onboarding, commission tiers, and split payments.',
      suite: 'MVM',
      route: '/commerce-mvm-demo',
      nigeriaNote: 'Lagos Digital Market with Nigerian vendors'
    },
    {
      id: 'full-3',
      stepNumber: 3,
      title: 'Inventory Control',
      description: 'Stock tracking across channels',
      narrative: 'Real-time inventory with multi-warehouse support and reorder management.',
      suite: 'Inventory',
      route: '/inventory-demo',
      nigeriaNote: 'Lagos, Ibadan, Abuja, Port Harcourt warehouses'
    },
    {
      id: 'full-4',
      stepNumber: 4,
      title: 'Payments',
      description: 'Nigeria-first payment methods',
      narrative: 'Bank transfer, card, POD, USSD, mobile money. All with proof-of-payment verification.',
      suite: 'Payments',
      route: '/payments-demo',
      nigeriaNote: 'POD excluded in Borno, Yobe, Adamawa'
    },
    {
      id: 'full-5',
      stepNumber: 5,
      title: 'Billing',
      description: 'Invoicing with VAT compliance',
      narrative: 'Professional invoices with 7.5% VAT, credit notes, and aging reports.',
      suite: 'Billing',
      route: '/billing-demo',
      nigeriaNote: 'Optional TIN, Net-30 terms, NGO exemptions'
    },
    {
      id: 'full-6',
      stepNumber: 6,
      title: 'Accounting',
      description: 'Double-entry bookkeeping',
      narrative: 'Nigeria SME Chart of Accounts with journal entries and trial balance.',
      suite: 'Accounting',
      route: '/accounting-demo',
      nigeriaNote: 'Cash, Bank, Mobile Money, POS accounts'
    },
    {
      id: 'full-7',
      stepNumber: 7,
      title: 'Rules Engine',
      description: 'Configuration-driven logic',
      narrative: 'Commission, pricing, promotions, inventory rules. All configuration, no code changes.',
      suite: 'Rules',
      route: '/commerce-rules-demo',
      nigeriaNote: 'Cash discount incentives, lead time buffers'
    }
  ]
}

// ============================================================================
// STORYLINE 5: CFO / FINANCE STORY
// ============================================================================

export const cfoFinanceStoryline: Storyline = {
  id: 'cfo',
  name: 'CFO / Finance Story',
  description: 'Financial correctness, traceability, and compliance',
  persona: 'CFO, Finance Director, or Financial Controller',
  durationMinutes: 10,
  suites: ['Billing', 'Accounting', 'Rules'],
  steps: [
    {
      id: 'cfo-1',
      stepNumber: 1,
      title: 'Invoice Creation',
      description: 'Professional invoicing with automatic VAT',
      narrative: 'Every invoice automatically calculates 7.5% VAT. No spreadsheet adjustments required.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'See automatic VAT calculation in action',
      nigeriaNote: '7.5% VAT rate with exemption support for NGOs'
    },
    {
      id: 'cfo-2',
      stepNumber: 2,
      title: 'Payment Recording',
      description: 'Track every Naira that comes in',
      narrative: 'Full and partial payments are tracked with audit trails. Bank transfers have proof-of-payment verification.',
      suite: 'Payments',
      route: '/payments-demo',
      actionHint: 'View the payment tracking workflow',
      nigeriaNote: 'Bank transfer reconciliation built in'
    },
    {
      id: 'cfo-3',
      stepNumber: 3,
      title: 'Accounting Impact',
      description: 'Invoice → Journal entry (automatic)',
      narrative: 'This is why finance teams trust the system. Every billing event creates a balanced journal entry automatically.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'See derived journal entries from invoices',
      nigeriaNote: 'Debit = Credit, always balanced'
    },
    {
      id: 'cfo-4',
      stepNumber: 4,
      title: 'VAT Summary',
      description: 'Output VAT reporting ready',
      narrative: 'VAT Payable is tracked in real-time. Generate VAT returns without manual calculations.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'Review the VAT summary report',
      nigeriaNote: 'FIRS-ready VAT reporting'
    },
    {
      id: 'cfo-5',
      stepNumber: 5,
      title: 'Trial Balance',
      description: 'Books that balance themselves',
      narrative: 'Your trial balance is always current. Debits equal credits — guaranteed by the system, not by manual checks.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'Verify the trial balance',
      nigeriaNote: 'Nigeria SME Chart of Accounts'
    }
  ]
}

// ============================================================================
// STORYLINE 6: REGULATOR / AUDITOR STORY
// ============================================================================

export const regulatorAuditorStoryline: Storyline = {
  id: 'regulator',
  name: 'Regulator / Auditor Story',
  description: 'Audit trails, data integrity, and compliance verification',
  persona: 'Auditor, Compliance Officer, or Regulatory Inspector',
  durationMinutes: 8,
  suites: ['Accounting', 'Billing', 'Rules'],
  steps: [
    {
      id: 'reg-1',
      stepNumber: 1,
      title: 'Chart of Accounts',
      description: 'Standardized Nigeria SME accounts',
      narrative: 'All accounts follow the Nigeria SME Chart of Accounts standard. No custom, untraceable accounts.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'Review the standardized account structure',
      nigeriaNote: '56 accounts covering Assets, Liabilities, Equity, Revenue, Expenses'
    },
    {
      id: 'reg-2',
      stepNumber: 2,
      title: 'Journal Entries',
      description: 'Append-only, immutable ledger',
      narrative: 'Journals are append-only. No retroactive mutations. Every entry has a timestamp and source reference.',
      suite: 'Accounting',
      route: '/accounting-demo',
      actionHint: 'Examine the journal entry audit trail',
      nigeriaNote: 'Full traceability from source document to ledger'
    },
    {
      id: 'reg-3',
      stepNumber: 3,
      title: 'Invoice Audit Trail',
      description: 'Every invoice state change is logged',
      narrative: 'Draft → Sent → Paid → each state change is recorded with timestamp and user.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'Follow an invoice through its lifecycle',
      nigeriaNote: 'Status history preserved for audit'
    },
    {
      id: 'reg-4',
      stepNumber: 4,
      title: 'VAT Compliance',
      description: '7.5% output VAT correctly handled',
      narrative: 'VAT is calculated automatically and tracked in the correct liability account. Exemptions are properly documented.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'Verify VAT calculation and exemptions',
      nigeriaNote: 'FIRS-compliant VAT handling'
    },
    {
      id: 'reg-5',
      stepNumber: 5,
      title: 'Commission Rules',
      description: 'Transparent, auditable rule configuration',
      narrative: 'All commission calculations are rule-driven and auditable. No hidden formulas or manual overrides.',
      suite: 'Rules',
      route: '/commerce-rules-demo',
      actionHint: 'Review commission rule configuration',
      nigeriaNote: 'Rules are versioned and traceable'
    }
  ]
}

// ============================================================================
// STORYLINE 7: SCHOOL OWNER (EDUCATION SUITE)
// ============================================================================

export const schoolOwnerStoryline: Storyline = {
  id: 'school',
  name: 'School Owner',
  description: 'From enrollment to accounting, without chaos',
  persona: 'School Founder, Proprietor, or Principal',
  durationMinutes: 10,
  suites: ['Education', 'Billing'],
  steps: [
    {
      id: 'school-1',
      stepNumber: 1,
      title: 'Student Registry',
      description: 'Complete student enrollment system',
      narrative: 'Every student is registered with their full Nigerian demographics — state of origin, genotype, guardian contacts. Admission workflow ensures no paperwork gaps.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'View the student registry with Nigerian names',
      nigeriaNote: 'Supports Nigerian name formats, blood groups, genotypes'
    },
    {
      id: 'school-2',
      stepNumber: 2,
      title: 'Academic Structure',
      description: 'JSS/SS classes with 3-term calendar',
      narrative: 'Your school runs on the Nigerian 3-term calendar. JSS 1-3, SS 1-3 classes are pre-configured with curriculum subjects.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'See the Nigerian academic structure',
      nigeriaNote: 'First Term, Second Term, Third Term — automatic session progression'
    },
    {
      id: 'school-3',
      stepNumber: 3,
      title: 'Attendance Discipline',
      description: 'Daily attendance with backfill capability',
      narrative: 'Teachers mark attendance daily. Backfill ensures no records are lost when internet is down. Parents can be notified of absences.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'View attendance records',
      nigeriaNote: 'Supports bulk marking for large classes'
    },
    {
      id: 'school-4',
      stepNumber: 4,
      title: 'Assessment & Results',
      description: '40% CA + 60% Exam grading',
      narrative: 'Continuous Assessment counts for 40%, Exams for 60%. Automatic grade conversion (A-F) and class positions calculated instantly.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'See the Nigerian grading scale in action',
      nigeriaNote: 'A (70-100), B (60-69), C (50-59), D (45-49), E (40-44), F (0-39)'
    },
    {
      id: 'school-5',
      stepNumber: 5,
      title: 'Fee Management',
      description: 'Tuition, levies, and installments',
      narrative: 'Fee structures are defined per term. Support for installment payments means parents can pay in parts. Education fees are VAT-exempt.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'View fee structures and assignments',
      nigeriaNote: 'Tuition ₦150,000/term, Development Levy ₦25,000/year — all VAT exempt'
    },
    {
      id: 'school-6',
      stepNumber: 6,
      title: 'Commerce Integration',
      description: 'Education emits facts → Billing handles money',
      narrative: 'Education Suite creates fee facts. Commerce Billing Suite handles invoices, payments, and accounting. No money logic in Education.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'See how fees flow to the billing system',
      nigeriaNote: 'Full traceability from enrollment to payment'
    }
  ]
}

// ============================================================================
// STORYLINE 8: PARENT / GUARDIAN (EDUCATION SUITE)
// ============================================================================

export const parentGuardianStoryline: Storyline = {
  id: 'parent',
  name: 'Parent / Guardian',
  description: 'Know what you owe and what your child achieved',
  persona: 'Parent, Guardian, or Sponsor',
  durationMinutes: 6,
  suites: ['Education'],
  steps: [
    {
      id: 'parent-1',
      stepNumber: 1,
      title: 'Student Profile',
      description: 'Your child\'s complete school record',
      narrative: 'Access your ward\'s profile anytime — class assignment, enrollment status, and guardian contact information all in one place.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'View a student profile',
      nigeriaNote: 'Nigerian names, local government, state of origin captured'
    },
    {
      id: 'parent-2',
      stepNumber: 2,
      title: 'Attendance Confidence',
      description: 'Know when your child is in school',
      narrative: 'Real-time attendance records. See exactly when your child was present, late, or absent. No more guessing.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'Check attendance history',
      nigeriaNote: 'Daily attendance with date stamps'
    },
    {
      id: 'parent-3',
      stepNumber: 3,
      title: 'Academic Results',
      description: 'CA + Exam scores and grades',
      narrative: 'View Continuous Assessment and Exam scores. See how your child performed across all subjects with automatic grade conversion.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'Review academic performance',
      nigeriaNote: '40% CA + 60% Exam = Final Score. Class positions calculated.'
    },
    {
      id: 'parent-4',
      stepNumber: 4,
      title: 'Fee Transparency',
      description: 'What you owe, clearly stated',
      narrative: 'See exactly what fees are due — tuition, levies, exam fees. Installment options available. No hidden charges.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'View fee breakdown',
      nigeriaNote: 'All amounts in NGN. Education is VAT-exempt.'
    },
    {
      id: 'parent-5',
      stepNumber: 5,
      title: 'Report Cards',
      description: 'Termly performance summary',
      narrative: 'Download professional report cards with teacher remarks, principal comments, and next term expectations.',
      suite: 'Education',
      route: '/education-demo',
      actionHint: 'Preview report card generation',
      nigeriaNote: 'Nigerian format with class position and term average'
    }
  ]
}

// ============================================================================
// STORYLINE 9: CLINIC OWNER / MEDICAL DIRECTOR (HEALTH SUITE)
// ============================================================================

export const clinicOwnerStoryline: Storyline = {
  id: 'clinic',
  name: 'Clinic Owner / Medical Director',
  description: 'From patient greeting to prescription, without chaos',
  persona: 'Clinic Owner, Medical Director, or Healthcare Administrator',
  durationMinutes: 10,
  suites: ['Health', 'Billing'],
  steps: [
    {
      id: 'clinic-1',
      stepNumber: 1,
      title: 'Patient Registry',
      description: 'Complete patient management system',
      narrative: 'Every patient is registered with full Nigerian healthcare demographics — blood group, genotype, allergies, and guardian contacts. No paper files to lose.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View the patient registry with Nigerian names and demographics',
      nigeriaNote: 'Blood groups (O+, A+, B+), genotypes (AA, AS, SS), NIN support'
    },
    {
      id: 'clinic-2',
      stepNumber: 2,
      title: 'Appointments & Walk-ins',
      description: 'Scheduled and walk-in patient handling',
      narrative: 'Nigeria runs on walk-ins. Your clinic can handle both scheduled appointments and walk-in patients seamlessly.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'See how walk-in patients are registered',
      nigeriaNote: 'Walk-in support is critical — most Nigerian clinics handle 60%+ walk-ins'
    },
    {
      id: 'clinic-3',
      stepNumber: 3,
      title: 'Visit Workflow',
      description: 'From registration to discharge',
      narrative: 'Track every patient through their visit — registration, waiting, consultation, labs, and discharge. No patient gets lost.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Follow the patient journey',
      nigeriaNote: 'Queue management for busy clinics'
    },
    {
      id: 'clinic-4',
      stepNumber: 4,
      title: 'Clinical Encounters',
      description: 'Vitals, diagnoses, and clinical notes',
      narrative: 'Doctors record vitals, make diagnoses (ICD-10), and write clinical notes. All records are append-only — no retroactive modifications.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View a clinical encounter with vitals and diagnosis',
      nigeriaNote: 'Common Nigerian diagnoses: Malaria, URI, Typhoid, Hypertension'
    },
    {
      id: 'clinic-5',
      stepNumber: 5,
      title: 'Prescriptions & Lab Orders',
      description: 'Medication and diagnostic orders',
      narrative: 'Prescriptions use Nigerian medication names and dosing conventions. Lab orders flow to your laboratory with full tracking.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'See a prescription with Nigerian medications',
      nigeriaNote: 'Paracetamol, Amoxicillin, Artemether-Lumefantrine, Metformin — local formulary'
    },
    {
      id: 'clinic-6',
      stepNumber: 6,
      title: 'Billing Facts',
      description: 'Service charges without invoice creation',
      narrative: 'This is where healthcare meets commerce safely. The Health Suite creates billing facts — consultation fees, lab charges — but NEVER creates invoices or handles money.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View billing facts emitted by the Health Suite',
      nigeriaNote: 'Healthcare is VAT-exempt in Nigeria'
    },
    {
      id: 'clinic-7',
      stepNumber: 7,
      title: 'Commerce Boundary',
      description: 'Health emits facts → Billing handles money',
      narrative: 'The Commerce Billing Suite receives billing facts and creates invoices. Health never touches money. This boundary keeps clinical and financial concerns separate.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'See how billing facts flow to the Commerce Suite',
      nigeriaNote: 'Full traceability from consultation to payment'
    }
  ]
}

// ============================================================================
// STORYLINE 10: PATIENT / GUARDIAN (HEALTH SUITE)
// ============================================================================

export const healthPatientStoryline: Storyline = {
  id: 'patient',
  name: 'Patient / Guardian',
  description: 'Your health records, accessible and transparent',
  persona: 'Patient, Guardian, or Care Recipient',
  durationMinutes: 6,
  suites: ['Health'],
  steps: [
    {
      id: 'patient-h-1',
      stepNumber: 1,
      title: 'Your Health Profile',
      description: 'Complete medical record in one place',
      narrative: 'Your blood group, genotype, allergies, and chronic conditions are recorded once. Every provider sees the same accurate information.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View a patient profile',
      nigeriaNote: 'Blood group and genotype are critical for Nigerian healthcare'
    },
    {
      id: 'patient-h-2',
      stepNumber: 2,
      title: 'Appointment Booking',
      description: 'Schedule visits in advance',
      narrative: 'Book appointments with your preferred doctor. Walk-ins are also supported — you\'ll never be turned away.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'See the appointment booking workflow',
      nigeriaNote: 'Walk-in support for urgent needs'
    },
    {
      id: 'patient-h-3',
      stepNumber: 3,
      title: 'Visit Transparency',
      description: 'Know your visit status',
      narrative: 'Track your visit from registration through consultation. No more wondering when you\'ll be seen.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View visit status tracking',
      nigeriaNote: 'Queue position visibility reduces anxiety'
    },
    {
      id: 'patient-h-4',
      stepNumber: 4,
      title: 'Clinical Records',
      description: 'Access your diagnosis and notes',
      narrative: 'See what the doctor diagnosed and recommended. Your records are yours — accessible and understandable.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View clinical encounter records',
      nigeriaNote: 'Diagnoses use standard ICD-10 codes'
    },
    {
      id: 'patient-h-5',
      stepNumber: 5,
      title: 'Prescriptions',
      description: 'Clear medication instructions',
      narrative: 'Your prescription includes medication name, dosage, frequency, and duration. No more guessing what the doctor wrote.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Review a prescription',
      nigeriaNote: 'Nigerian dosing conventions: OD, BD, TDS, PRN'
    },
    {
      id: 'patient-h-6',
      stepNumber: 6,
      title: 'Billing Transparency',
      description: 'Know what you\'re paying for',
      narrative: 'Every charge is itemized — consultation fee, lab tests, procedures. No hidden fees, no surprises.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'View billing breakdown',
      nigeriaNote: 'Healthcare services are VAT-exempt in Nigeria'
    }
  ]
}

// ============================================================================
// STORYLINE 11: HEALTH REGULATOR / AUDITOR (HEALTH SUITE)
// ============================================================================

export const healthRegulatorStoryline: Storyline = {
  id: 'healthRegulator',
  name: 'Health Regulator / Auditor',
  description: 'Full traceability from registration to outcome',
  persona: 'Health Regulator, Medical Auditor, or Compliance Officer',
  durationMinutes: 8,
  suites: ['Health'],
  steps: [
    {
      id: 'health-reg-1',
      stepNumber: 1,
      title: 'Patient Registry Audit',
      description: 'Complete demographic records',
      narrative: 'Every patient has a unique MRN. Demographics are complete — no anonymous or incomplete records.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Review patient registry completeness',
      nigeriaNote: 'NIN (National ID) support for identity verification'
    },
    {
      id: 'health-reg-2',
      stepNumber: 2,
      title: 'Appointment Audit Trail',
      description: 'Scheduled and walk-in tracking',
      narrative: 'Every patient interaction starts with either an appointment or walk-in registration. No undocumented visits.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Trace appointment to visit flow',
      nigeriaNote: 'Walk-in patients are tracked with same rigor as scheduled'
    },
    {
      id: 'health-reg-3',
      stepNumber: 3,
      title: 'Clinical Records Integrity',
      description: 'Append-only, immutable records',
      narrative: 'Clinical encounters are append-only. Once a diagnosis or note is recorded, it cannot be deleted. Amendments reference the original.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Examine append-only clinical records',
      nigeriaNote: 'HIPAA-like posture for Nigerian healthcare'
    },
    {
      id: 'health-reg-4',
      stepNumber: 4,
      title: 'Diagnosis Traceability',
      description: 'ICD-10 coded diagnoses',
      narrative: 'All diagnoses use standard ICD-10 codes. Primary and secondary diagnoses are clearly distinguished.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Review diagnosis coding',
      nigeriaNote: 'Standardized coding enables healthcare analytics'
    },
    {
      id: 'health-reg-5',
      stepNumber: 5,
      title: 'Lab Results Immutability',
      description: 'Results cannot be modified',
      narrative: 'Lab results are recorded once and cannot be changed. Verification is the only allowed action.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Verify lab result immutability',
      nigeriaNote: 'Critical for diagnostic accuracy and legal defensibility'
    },
    {
      id: 'health-reg-6',
      stepNumber: 6,
      title: 'Privacy Compliance',
      description: 'Consent and access controls',
      narrative: 'Patient consent is required on registration. Access is tenant-scoped and capability-guarded. No unauthorized data access.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Review privacy controls',
      nigeriaNote: 'Consent on registration, capability guards on every API'
    },
    {
      id: 'health-reg-7',
      stepNumber: 7,
      title: 'Commerce Boundary Audit',
      description: 'Health never handles money',
      narrative: 'The Health Suite emits billing facts only. It never creates invoices, calculates totals, or records payments. Financial logic lives in Commerce.',
      suite: 'Health',
      route: '/health-demo',
      actionHint: 'Verify commerce boundary compliance',
      nigeriaNote: 'Clean separation of clinical and financial concerns'
    }
  ]
}

// ============================================================================
// STORYLINE 12: HOTEL OWNER / GM (HOSPITALITY SUITE)
// ============================================================================

export const hotelOwnerStoryline: Storyline = {
  id: 'hotelOwner',
  name: 'Hotel Owner / GM',
  description: 'From guest arrival to checkout, without chaos',
  persona: 'Hotel Owner, General Manager, or Hospitality Director',
  durationMinutes: 10,
  suites: ['Hospitality', 'Billing'],
  steps: [
    {
      id: 'hotel-1',
      stepNumber: 1,
      title: 'Venue & Rooms',
      description: 'Hotel layout and room inventory',
      narrative: 'Your property starts with a clear layout — floors, room types, and real-time availability. PalmView Suites has 7 rooms across 2 floors.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View the floor plan with room status',
      nigeriaNote: 'Standard, Deluxe, Executive, Suite — Nigerian pricing in NGN'
    },
    {
      id: 'hotel-2',
      stepNumber: 2,
      title: 'Guest Registry',
      description: 'Guest profiles and VIP tracking',
      narrative: 'Every guest is registered with Nigerian-friendly profiles. VIP tracking ensures your best customers get special attention.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See guest profiles with VIP badges',
      nigeriaNote: 'Nigerian names, phone formats, nationality tracking'
    },
    {
      id: 'hotel-3',
      stepNumber: 3,
      title: 'Reservations & Walk-ins',
      description: 'Bookings and walk-in support',
      narrative: 'Nigeria runs on walk-ins. Your hotel handles both advance reservations and spontaneous arrivals seamlessly.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See how reservations and walk-ins are handled',
      nigeriaNote: 'Walk-in support is critical — no mandatory reservations'
    },
    {
      id: 'hotel-4',
      stepNumber: 4,
      title: 'Check-in to Check-out',
      description: 'Complete stay lifecycle',
      narrative: 'Track guests from arrival to departure. Room status updates automatically. Extensions and early checkouts are handled gracefully.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View in-house guests and stay status',
      nigeriaNote: 'Default check-in 2pm, check-out 12pm — Nigerian standard'
    },
    {
      id: 'hotel-5',
      stepNumber: 5,
      title: 'Staff & Shifts',
      description: 'Multi-shift staff scheduling',
      narrative: 'Hotels run 24/7. Schedule morning, afternoon, and night shifts. Track clock-in and clock-out for accountability.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See today\'s active shifts',
      nigeriaNote: 'Morning, Afternoon, Night, Split shifts supported'
    },
    {
      id: 'hotel-6',
      stepNumber: 6,
      title: 'Charge Facts',
      description: 'Room nights and services billed as facts',
      narrative: 'This is where hospitality meets commerce safely. Room nights, minibar, and services create charge facts — but NEVER invoices or payments.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View pending charge facts',
      nigeriaNote: 'VAT 7.5% calculated by Commerce, not Hospitality'
    },
    {
      id: 'hotel-7',
      stepNumber: 7,
      title: 'Commerce Boundary',
      description: 'Hospitality emits facts → Billing handles money',
      narrative: 'The Commerce Billing Suite receives charge facts and creates invoices. Hospitality never touches money. This boundary keeps operations clean.',
      suite: 'Billing',
      route: '/billing-demo',
      actionHint: 'See how charge facts flow to Commerce',
      nigeriaNote: 'Full traceability from room night to payment'
    }
  ]
}

// ============================================================================
// STORYLINE 13: RESTAURANT MANAGER (HOSPITALITY SUITE)
// ============================================================================

export const restaurantManagerStoryline: Storyline = {
  id: 'restaurantManager',
  name: 'Restaurant Manager',
  description: 'Tables, orders, kitchen, and split bills',
  persona: 'Restaurant Manager, F&B Director, or Outlet Manager',
  durationMinutes: 8,
  suites: ['Hospitality'],
  steps: [
    {
      id: 'restaurant-1',
      stepNumber: 1,
      title: 'Table Layout',
      description: 'Restaurant floor with table status',
      narrative: 'Your restaurant floor at a glance. See which tables are available, occupied, or reserved. Party size matching for efficient seating.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View the table grid with status',
      nigeriaNote: '2-8 seater tables for Nigerian dining preferences'
    },
    {
      id: 'restaurant-2',
      stepNumber: 2,
      title: 'Walk-in Guests',
      description: 'No reservation required',
      narrative: 'Most Nigerian diners don\'t reserve. Walk-ins are first-class citizens — quick seating without profile requirements.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See walk-in guest handling',
      nigeriaNote: 'Walk-in first design — reservations optional'
    },
    {
      id: 'restaurant-3',
      stepNumber: 3,
      title: 'Order Taking',
      description: 'Dine-in orders with item tracking',
      narrative: 'Take orders by table. Each item tracks preparation status. Servers know exactly what\'s ready.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View active orders',
      nigeriaNote: 'Jollof Rice, Grilled Chicken, Chapman — Nigerian menu'
    },
    {
      id: 'restaurant-4',
      stepNumber: 4,
      title: 'Kitchen Display',
      description: 'Orders ready for preparation',
      narrative: 'Kitchen sees orders by prep station. Hot kitchen, grill, bar — each station knows their items. No lost orders.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See kitchen queue functionality',
      nigeriaNote: 'Prep stations: Hot Kitchen, Grill, Bar'
    },
    {
      id: 'restaurant-5',
      stepNumber: 5,
      title: 'Split Bills',
      description: 'Divide bills among guests',
      narrative: 'Nigerian groups often split bills. Items can be assigned to different payers. Each person pays their share.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View split bill support',
      nigeriaNote: 'Split bills are essential for Nigerian group dining'
    },
    {
      id: 'restaurant-6',
      stepNumber: 6,
      title: 'Shift Accountability',
      description: 'Server performance and shift tracking',
      narrative: 'Know who served what. Shift clock-in/out ensures accountability. Server tips and performance trackable.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See shift management',
      nigeriaNote: 'Multi-shift support for busy Nigerian restaurants'
    },
    {
      id: 'restaurant-7',
      stepNumber: 7,
      title: 'Charge Facts',
      description: 'F&B orders become billing facts',
      narrative: 'Every order creates charge facts for Commerce. Restaurant never calculates VAT or collects payment. Clean boundary.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View charge facts from orders',
      nigeriaNote: 'VAT 7.5% on food & beverage — handled by Commerce'
    }
  ]
}

// ============================================================================
// STORYLINE 14: HOSPITALITY GUEST (HOSPITALITY SUITE)
// ============================================================================

export const hospitalityGuestStoryline: Storyline = {
  id: 'hospitalityGuest',
  name: 'Hotel / Restaurant Guest',
  description: 'Your stay and dining, transparent and fair',
  persona: 'Hotel Guest, Restaurant Diner, or Corporate Traveler',
  durationMinutes: 6,
  suites: ['Hospitality'],
  steps: [
    {
      id: 'guest-h-1',
      stepNumber: 1,
      title: 'Your Profile',
      description: 'Guest recognition across visits',
      narrative: 'Your preferences and history are remembered. VIP status is earned through loyalty. Every visit builds your guest profile.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View guest profile with VIP badge',
      nigeriaNote: 'Nigerian names and phone formats supported'
    },
    {
      id: 'guest-h-2',
      stepNumber: 2,
      title: 'Make a Reservation',
      description: 'Book a room or table in advance',
      narrative: 'Reserve a room for your trip or a table for dinner. But walk-ins are always welcome — no reservation required.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See reservation options',
      nigeriaNote: 'Reservations optional — walk-ins are first-class'
    },
    {
      id: 'guest-h-3',
      stepNumber: 3,
      title: 'Check-in Experience',
      description: 'Smooth arrival process',
      narrative: 'Arrive at 2pm, get your room key, and settle in. Your stay is tracked from the moment you check in.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View stay check-in flow',
      nigeriaNote: 'Standard Nigerian check-in at 2pm'
    },
    {
      id: 'guest-h-4',
      stepNumber: 4,
      title: 'Dining at the Restaurant',
      description: 'Order food and beverages',
      narrative: 'Dine at the hotel restaurant or order room service. Your orders are tracked and added to your stay charges.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'See active orders',
      nigeriaNote: 'Jollof Rice ₦3,500, Chapman ₦1,500 — Nigerian menu'
    },
    {
      id: 'guest-h-5',
      stepNumber: 5,
      title: 'Bill Transparency',
      description: 'Know exactly what you owe',
      narrative: 'Every charge is itemized — room nights, minibar, restaurant orders. No hidden fees, no surprises at checkout.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'View charge facts breakdown',
      nigeriaNote: 'All charges in NGN with 7.5% VAT clearly shown'
    },
    {
      id: 'guest-h-6',
      stepNumber: 6,
      title: 'Check-out & Settlement',
      description: 'Smooth departure with final bill',
      narrative: 'At checkout, your final bill is ready. All charge facts are compiled. Pay cash, card, or transfer — Commerce handles the rest.',
      suite: 'Hospitality',
      route: '/hospitality-demo',
      actionHint: 'Understand checkout process',
      nigeriaNote: 'Cash-friendly — bank transfer with POP verification supported'
    }
  ]
}

// ============================================================================
// STORYLINE 15: CIVIC CITIZEN (CIVIC / GOVTECH SUITE)
// ============================================================================

export const civicCitizenStoryline: Storyline = {
  id: 'civicCitizen',
  name: 'Citizen Journey',
  description: 'From application submission to certificate issuance',
  persona: 'Citizen, Property Owner, or Business Applicant',
  durationMinutes: 8,
  suites: ['Civic'],
  steps: [
    {
      id: 'civic-citizen-1',
      stepNumber: 1,
      title: 'Service Discovery',
      description: 'Find the government service you need',
      narrative: 'Browse the service catalogue to find what you need — Certificate of Occupancy, business permits, or licenses. Each service shows fees, requirements, and expected timelines.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View the service catalogue',
      nigeriaNote: 'Lagos State Lands Bureau — C of O processing'
    },
    {
      id: 'civic-citizen-2',
      stepNumber: 2,
      title: 'Submit Application',
      description: 'Complete your service request',
      narrative: 'Submit your application with all required documents. You receive a tracking code immediately — no need to wait for acknowledgment.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See how applications are submitted',
      nigeriaNote: 'Tracking codes like LSLB-A1B2C3 for instant reference'
    },
    {
      id: 'civic-citizen-3',
      stepNumber: 3,
      title: 'Track Progress',
      description: 'Monitor your application status (no login required)',
      narrative: 'This is the transparency promise. Track your application status using just your tracking code. No login, no calls, no visits. Real-time visibility.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Try the public status tracker',
      nigeriaNote: 'Public tracking builds trust in government services'
    },
    {
      id: 'civic-citizen-4',
      stepNumber: 4,
      title: 'Inspection Notification',
      description: 'Know when inspectors will visit',
      narrative: 'When your application requires inspection, you\'re notified in advance. No surprise visits. Scheduled times are communicated clearly.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See inspection scheduling',
      nigeriaNote: 'Scheduled inspections reduce corruption opportunities'
    },
    {
      id: 'civic-citizen-5',
      stepNumber: 5,
      title: 'Fee Transparency',
      description: 'Know exactly what you owe',
      narrative: 'All fees are published and itemized. No hidden charges, no unofficial payments. What you see is what you pay.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View fee breakdown',
      nigeriaNote: 'Published fees reduce rent-seeking behavior'
    },
    {
      id: 'civic-citizen-6',
      stepNumber: 6,
      title: 'Approval & Certificate',
      description: 'Receive your approval decision',
      narrative: 'Once approved, your certificate or permit is ready. Every decision is logged, every approval is traceable. Government accountability delivered.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See approval workflow',
      nigeriaNote: 'Digital certificates reduce fraud and forgery'
    }
  ]
}

// ============================================================================
// STORYLINE 16: CIVIC AGENCY STAFF (CIVIC / GOVTECH SUITE)
// ============================================================================

export const civicAgencyStaffStoryline: Storyline = {
  id: 'civicAgencyStaff',
  name: 'Agency Staff Workflow',
  description: 'From intake to approval, with full accountability',
  persona: 'Agency Staff, Case Officer, or Department Head',
  durationMinutes: 10,
  suites: ['Civic'],
  steps: [
    {
      id: 'civic-staff-1',
      stepNumber: 1,
      title: 'Case Assignment',
      description: 'Receive assigned cases in your queue',
      narrative: 'Cases are assigned based on department, workload, and expertise. No cherry-picking. Fair distribution with SLA tracking from day one.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View case assignment queue',
      nigeriaNote: 'Automated assignment prevents preferential treatment'
    },
    {
      id: 'civic-staff-2',
      stepNumber: 2,
      title: 'Document Review',
      description: 'Verify submitted documents',
      narrative: 'Review all submitted documents against requirements. Request additional documents if needed. Every review action is logged.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See document verification workflow',
      nigeriaNote: 'Digital document management reduces lost files'
    },
    {
      id: 'civic-staff-3',
      stepNumber: 3,
      title: 'Schedule Inspection',
      description: 'Coordinate field inspections',
      narrative: 'Schedule inspections with inspectors and notify applicants. GPS-tagged site visits ensure accountability.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View inspection scheduling',
      nigeriaNote: 'GPS tracking proves inspectors actually visited'
    },
    {
      id: 'civic-staff-4',
      stepNumber: 4,
      title: 'Record Findings',
      description: 'Document inspection results (append-only)',
      narrative: 'Inspection findings are recorded and cannot be modified. Append-only logs ensure what was found stays on record.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See how findings are recorded',
      nigeriaNote: 'Append-only prevents after-the-fact tampering'
    },
    {
      id: 'civic-staff-5',
      stepNumber: 5,
      title: 'Make Recommendation',
      description: 'Submit approval or rejection recommendation',
      narrative: 'Based on documents and inspection, make your recommendation. Your reasoning is recorded. Supervisors see your analysis.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View recommendation workflow',
      nigeriaNote: 'Recorded reasoning enables quality review'
    },
    {
      id: 'civic-staff-6',
      stepNumber: 6,
      title: 'SLA Monitoring',
      description: 'Track deadlines and escalations',
      narrative: 'Every case has an SLA. Approaching deadlines trigger alerts. Breached SLAs are escalated automatically. No case gets forgotten.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See SLA tracking dashboard',
      nigeriaNote: 'SLA enforcement improves service delivery'
    },
    {
      id: 'civic-staff-7',
      stepNumber: 7,
      title: 'Billing Facts',
      description: 'Fees are facts, not invoices',
      narrative: 'Staff creates billing facts for services rendered. Invoicing, VAT, and payment collection happen in Commerce. Clean boundary.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View billing facts',
      nigeriaNote: 'Commerce boundary prevents fee manipulation'
    }
  ]
}

// ============================================================================
// STORYLINE 17: CIVIC REGULATOR (CIVIC / GOVTECH SUITE)
// ============================================================================

export const civicRegulatorStoryline: Storyline = {
  id: 'civicRegulator',
  name: 'Regulator Oversight',
  description: 'Compliance verification and governance monitoring',
  persona: 'Regulator, Compliance Officer, or Government Inspector',
  durationMinutes: 8,
  suites: ['Civic'],
  steps: [
    {
      id: 'civic-reg-1',
      stepNumber: 1,
      title: 'Agency Performance',
      description: 'Monitor agency service delivery metrics',
      narrative: 'See how agencies perform against their mandates. Processing times, approval rates, SLA compliance — all visible at a glance.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'View agency performance dashboard',
      nigeriaNote: 'Performance visibility enables accountability'
    },
    {
      id: 'civic-reg-2',
      stepNumber: 2,
      title: 'SLA Breach Reports',
      description: 'Identify systemic delays',
      narrative: 'Which services are consistently delayed? Which departments breach SLAs most? Data-driven oversight for targeted intervention.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Review SLA breach patterns',
      nigeriaNote: 'Pattern detection identifies systemic issues'
    },
    {
      id: 'civic-reg-3',
      stepNumber: 3,
      title: 'Approval Patterns',
      description: 'Analyze decision consistency',
      narrative: 'Are similar applications getting different outcomes? Detect bias, inconsistency, or potential favoritism in approval patterns.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See approval pattern analysis',
      nigeriaNote: 'Consistency analysis detects unfair treatment'
    },
    {
      id: 'civic-reg-4',
      stepNumber: 4,
      title: 'Audit Trail Review',
      description: 'Trace any decision back to its source',
      narrative: 'Every action is logged with timestamp, actor, and context. Reconstruct any case\'s history from submission to decision.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Review audit trails',
      nigeriaNote: 'Full traceability enables investigation'
    },
    {
      id: 'civic-reg-5',
      stepNumber: 5,
      title: 'Fee Compliance',
      description: 'Verify fee collection against published rates',
      narrative: 'Are agencies charging published rates? Billing facts show exactly what was charged. No room for unofficial fees.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Audit fee collection',
      nigeriaNote: 'Fee transparency eliminates extortion'
    },
    {
      id: 'civic-reg-6',
      stepNumber: 6,
      title: 'FOI Readiness',
      description: 'Freedom of Information compliance',
      narrative: 'When citizens request information, it\'s already structured and exportable. FOI requests are answerable, not burdensome.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'See FOI export capabilities',
      nigeriaNote: 'FOI compliance builds public trust'
    }
  ]
}

// ============================================================================
// STORYLINE 18: CIVIC AUDITOR (CIVIC / GOVTECH SUITE)
// ============================================================================

export const civicAuditorStoryline: Storyline = {
  id: 'civicAuditor',
  name: 'Auditor Review',
  description: 'Reconstruct decisions and verify integrity',
  persona: 'Internal Auditor, External Auditor, or Anti-Corruption Officer',
  durationMinutes: 8,
  suites: ['Civic'],
  steps: [
    {
      id: 'civic-audit-1',
      stepNumber: 1,
      title: 'Case Reconstruction',
      description: 'Rebuild complete case history',
      narrative: 'Select any case and see its complete journey — every status change, every document, every decision. Full reconstruction in minutes, not weeks.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Reconstruct a case history',
      nigeriaNote: 'Rapid case reconstruction saves audit time'
    },
    {
      id: 'civic-audit-2',
      stepNumber: 2,
      title: 'Decision Chain',
      description: 'Trace who approved what and when',
      narrative: 'Every approval has a chain — who recommended, who reviewed, who signed. No anonymous decisions. Full accountability.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Follow the decision chain',
      nigeriaNote: 'Named accountability prevents ghost approvals'
    },
    {
      id: 'civic-audit-3',
      stepNumber: 3,
      title: 'Inspection Verification',
      description: 'Verify inspections actually occurred',
      narrative: 'Inspection logs show when, where, and by whom. GPS coordinates and timestamps prove the inspection happened.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Verify inspection records',
      nigeriaNote: 'GPS proof eliminates desk inspections'
    },
    {
      id: 'civic-audit-4',
      stepNumber: 4,
      title: 'Fee Fact Reconciliation',
      description: 'Match billing facts to payments',
      narrative: 'Every fee charged is a fact. Match these facts against Commerce records. Identify discrepancies between charges and collections.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Reconcile fees and payments',
      nigeriaNote: 'Fact-based reconciliation catches leakage'
    },
    {
      id: 'civic-audit-5',
      stepNumber: 5,
      title: 'Anomaly Detection',
      description: 'Spot unusual patterns',
      narrative: 'Unusually fast approvals? Suspiciously similar rejections? Anomaly flags highlight cases that deserve deeper review.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Review flagged anomalies',
      nigeriaNote: 'Pattern anomalies often indicate corruption'
    },
    {
      id: 'civic-audit-6',
      stepNumber: 6,
      title: 'Audit Report Export',
      description: 'Generate auditable reports',
      narrative: 'Export structured audit reports with full evidence trails. Court-ready documentation from system data.',
      suite: 'Civic',
      route: '/civic-demo',
      actionHint: 'Generate audit reports',
      nigeriaNote: 'System-generated reports are tamper-evident'
    }
  ]
}

// ============================================================================
// STORYLINE 19: LOGISTICS DISPATCHER (LOGISTICS SUITE)
// ============================================================================

export const logisticsDispatcherStoryline: Storyline = {
  id: 'logisticsDispatcher',
  name: 'Dispatcher Workflow',
  description: 'Job assignment, routing, tracking, and completion',
  persona: 'Dispatch Manager, Operations Coordinator, or Fleet Controller',
  durationMinutes: 10,
  suites: ['Logistics'],
  steps: [
    {
      id: 'logistics-dispatch-1',
      stepNumber: 1,
      title: 'Job Queue',
      description: 'View pending and active jobs',
      narrative: 'Your dispatch board shows all jobs by status — pending, assigned, in-transit, and completed. Priority and urgency are immediately visible.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View the job queue dashboard',
      nigeriaNote: 'Swift Dispatch Co. processes 50+ jobs daily in Lagos'
    },
    {
      id: 'logistics-dispatch-2',
      stepNumber: 2,
      title: 'Driver Availability',
      description: 'See which drivers are available',
      narrative: 'Before assigning jobs, check driver availability. Available, on-trip, off-duty — all statuses at a glance with current locations.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Check driver status board',
      nigeriaNote: 'Motorcycle, tricycle, van, and truck drivers tracked separately'
    },
    {
      id: 'logistics-dispatch-3',
      stepNumber: 3,
      title: 'Assign Job',
      description: 'Match job to driver and vehicle',
      narrative: 'Assign jobs based on vehicle type, driver license, and proximity. High-priority jobs get Express drivers. Freight jobs get trucks.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See job assignment workflow',
      nigeriaNote: 'License class matching ensures compliance'
    },
    {
      id: 'logistics-dispatch-4',
      stepNumber: 4,
      title: 'Live Tracking',
      description: 'Monitor jobs in real-time',
      narrative: 'Once assigned, track job progress through status updates. Pickup confirmed → In transit → At delivery. No GPS needed — status-based tracking.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View live tracking board',
      nigeriaNote: 'Status-based tracking works on 2G networks'
    },
    {
      id: 'logistics-dispatch-5',
      stepNumber: 5,
      title: 'Handle Exceptions',
      description: 'Manage failed deliveries and issues',
      narrative: 'Not all deliveries succeed. Wrong address? Recipient unavailable? Handle exceptions, reschedule, or reassign with full audit trail.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View exception handling',
      nigeriaNote: 'Address validation reduces failed deliveries'
    },
    {
      id: 'logistics-dispatch-6',
      stepNumber: 6,
      title: 'Settlement View',
      description: 'Track job payments and driver earnings',
      narrative: 'Every completed job has a billing record. COD, prepaid, transfer — all tracked. Driver earnings calculated automatically.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View settlement dashboard',
      nigeriaNote: 'NGN earnings with bank transfer settlements'
    },
    {
      id: 'logistics-dispatch-7',
      stepNumber: 7,
      title: 'Commerce Handoff',
      description: 'Billing facts flow to Commerce',
      narrative: 'Logistics creates delivery facts. Commerce handles invoicing and payments. Clean boundary — operations never touch accounting.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See Commerce boundary',
      nigeriaNote: 'VAT and accounting handled by Commerce Suite'
    }
  ]
}

// ============================================================================
// STORYLINE 20: LOGISTICS DRIVER (LOGISTICS SUITE)
// ============================================================================

export const logisticsDriverStoryline: Storyline = {
  id: 'logisticsDriver',
  name: 'Driver Journey',
  description: 'Accept job, navigate, deliver, capture POD',
  persona: 'Delivery Driver, Rider, or Courier',
  durationMinutes: 8,
  suites: ['Logistics'],
  steps: [
    {
      id: 'logistics-driver-1',
      stepNumber: 1,
      title: 'Start Shift',
      description: 'Go on duty and receive assignments',
      narrative: 'Your day starts with going on duty. Once available, you receive job assignments based on your vehicle type and location.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See driver status toggle',
      nigeriaNote: 'Motorcycle riders in Lagos handle last-mile delivery'
    },
    {
      id: 'logistics-driver-2',
      stepNumber: 2,
      title: 'Accept Job',
      description: 'Review and accept assigned job',
      narrative: 'Job details show pickup address, delivery address, item description, and payment method. Accept to confirm you\'re on it.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View job acceptance flow',
      nigeriaNote: 'Landmark-based addresses for Lagos navigation'
    },
    {
      id: 'logistics-driver-3',
      stepNumber: 3,
      title: 'Navigate to Pickup',
      description: 'Head to pickup location',
      narrative: 'Update status as you move: En route → At pickup. Contact information for sender is one tap away.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See status update workflow',
      nigeriaNote: 'Nigerian phone number formats for direct contact'
    },
    {
      id: 'logistics-driver-4',
      stepNumber: 4,
      title: 'Confirm Pickup',
      description: 'Collect items and confirm',
      narrative: 'Verify items match description. Note any discrepancies. Mark as picked up to start the delivery clock.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View pickup confirmation',
      nigeriaNote: 'Item value tracking for insurance purposes'
    },
    {
      id: 'logistics-driver-5',
      stepNumber: 5,
      title: 'In Transit',
      description: 'Delivery in progress',
      narrative: 'You\'re now carrying the delivery. Status updates keep dispatch and customer informed. Priority jobs have tighter SLAs.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See in-transit tracking',
      nigeriaNote: 'Express priority for time-sensitive deliveries'
    },
    {
      id: 'logistics-driver-6',
      stepNumber: 6,
      title: 'Proof of Delivery',
      description: 'Capture signature or photo',
      narrative: 'At delivery, capture proof — signature, photo, or PIN. This protects you and confirms successful delivery.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View POD capture flow',
      nigeriaNote: 'Digital POD replaces paper waybills'
    },
    {
      id: 'logistics-driver-7',
      stepNumber: 7,
      title: 'Complete & Earn',
      description: 'Job done, earnings credited',
      narrative: 'Successful delivery! Your earnings are calculated and credited. COD collections are reconciled. Ready for the next job.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See earnings dashboard',
      nigeriaNote: 'Daily settlements to Nigerian bank accounts'
    }
  ]
}

// ============================================================================
// STORYLINE 21: LOGISTICS MERCHANT (LOGISTICS SUITE)
// ============================================================================

export const logisticsMerchantStoryline: Storyline = {
  id: 'logisticsMerchant',
  name: 'Merchant/Shipper Journey',
  description: 'Create shipment, track delivery, receive confirmation',
  persona: 'E-commerce Seller, Business Owner, or Corporate Shipper',
  durationMinutes: 6,
  suites: ['Logistics'],
  steps: [
    {
      id: 'logistics-merchant-1',
      stepNumber: 1,
      title: 'Create Shipment',
      description: 'Request a pickup and delivery',
      narrative: 'Enter pickup and delivery addresses, item details, and preferred timing. Get instant pricing based on distance and vehicle type.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'See shipment creation form',
      nigeriaNote: 'Lagos addresses with landmark support'
    },
    {
      id: 'logistics-merchant-2',
      stepNumber: 2,
      title: 'Choose Service Level',
      description: 'Standard, Express, or Freight',
      narrative: 'Select service level based on urgency. Express costs more but delivers faster. Freight handles bulk shipments.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Compare service levels',
      nigeriaNote: 'Same-day Lagos delivery available'
    },
    {
      id: 'logistics-merchant-3',
      stepNumber: 3,
      title: 'Get Tracking Code',
      description: 'Receive job number for tracking',
      narrative: 'Every shipment gets a unique tracking code like JOB-A1B2C3-XYZ. Share with your customer for real-time visibility.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View tracking code generation',
      nigeriaNote: 'SMS/WhatsApp-friendly tracking codes'
    },
    {
      id: 'logistics-merchant-4',
      stepNumber: 4,
      title: 'Monitor Progress',
      description: 'Track your shipment status',
      narrative: 'Watch your shipment move through stages: Assigned → Picked up → In transit → Delivered. No need to call dispatch.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Track shipment progress',
      nigeriaNote: 'Real-time status updates'
    },
    {
      id: 'logistics-merchant-5',
      stepNumber: 5,
      title: 'Delivery Confirmation',
      description: 'Receive POD notification',
      narrative: 'When delivery completes, you get confirmation with proof — who received it, when, and signature/photo if required.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View delivery confirmation',
      nigeriaNote: 'POD protects against disputes'
    },
    {
      id: 'logistics-merchant-6',
      stepNumber: 6,
      title: 'Billing & History',
      description: 'Review costs and past shipments',
      narrative: 'All your shipments are logged with costs. Monthly invoicing for corporate accounts. Full history for reconciliation.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View shipment history',
      nigeriaNote: 'NGN pricing with VAT handling by Commerce'
    }
  ]
}

// ============================================================================
// STORYLINE 22: LOGISTICS AUDITOR (LOGISTICS SUITE)
// ============================================================================

export const logisticsAuditorStoryline: Storyline = {
  id: 'logisticsAuditor',
  name: 'Auditor Review',
  description: 'Job reconstruction, fee verification, Commerce handoff',
  persona: 'Internal Auditor, Finance Controller, or Operations Analyst',
  durationMinutes: 8,
  suites: ['Logistics'],
  steps: [
    {
      id: 'logistics-audit-1',
      stepNumber: 1,
      title: 'Job Reconstruction',
      description: 'Trace complete job history',
      narrative: 'Select any job and see its full timeline — created, assigned, accepted, picked up, delivered. Every status change logged.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Reconstruct job history',
      nigeriaNote: 'Immutable status history for compliance'
    },
    {
      id: 'logistics-audit-2',
      stepNumber: 2,
      title: 'Driver Performance',
      description: 'Review driver metrics and ratings',
      narrative: 'Check driver performance: total trips, ratings, earnings, exception rates. Identify top performers and issues.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'View driver analytics',
      nigeriaNote: 'Performance data for incentive programs'
    },
    {
      id: 'logistics-audit-3',
      stepNumber: 3,
      title: 'POD Verification',
      description: 'Verify proof of delivery records',
      narrative: 'Every delivery should have proof. Audit POD records — signatures, photos, exceptions. Identify missing documentation.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Audit POD records',
      nigeriaNote: 'POD verification reduces fraud claims'
    },
    {
      id: 'logistics-audit-4',
      stepNumber: 4,
      title: 'Fee Reconciliation',
      description: 'Match charges to payments',
      narrative: 'Every job has a billing amount. Match against payments received. COD collections, transfers, prepaid — all reconcilable.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Reconcile fees and payments',
      nigeriaNote: 'Daily settlement reconciliation'
    },
    {
      id: 'logistics-audit-5',
      stepNumber: 5,
      title: 'Exception Analysis',
      description: 'Review failed and cancelled jobs',
      narrative: 'Why do jobs fail? Wrong address, recipient unavailable, refused delivery. Pattern analysis reveals operational issues.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Analyze exceptions',
      nigeriaNote: 'Address quality is a major Lagos challenge'
    },
    {
      id: 'logistics-audit-6',
      stepNumber: 6,
      title: 'Commerce Boundary',
      description: 'Verify billing fact handoff',
      narrative: 'Logistics creates delivery facts. Commerce creates invoices and handles payments. Verify the boundary is clean — no payment logic in Logistics.',
      suite: 'Logistics',
      route: '/logistics-demo',
      actionHint: 'Verify Commerce boundary',
      nigeriaNote: 'Clean boundary for proper accounting'
    }
  ]
}

// ============================================================================
// STORYLINE 23: PROPERTY OWNER (REAL ESTATE SUITE)
// ============================================================================

export const propertyOwnerStoryline: Storyline = {
  id: 'propertyOwner',
  name: 'Property Owner Journey',
  description: 'Portfolio management, leasing, and rent collection visibility',
  persona: 'Landlord, Property Investor, or Estate Developer',
  durationMinutes: 8,
  suites: ['Real Estate'],
  steps: [
    {
      id: 're-owner-1',
      stepNumber: 1,
      title: 'Portfolio Overview',
      description: 'View all your properties at a glance',
      narrative: 'Your property portfolio shows all assets — residential, commercial, mixed. Occupancy rates, rental income, and maintenance status immediately visible.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View portfolio dashboard',
      nigeriaNote: 'Emerald Heights Properties, Lekki manages 3 properties'
    },
    {
      id: 're-owner-2',
      stepNumber: 2,
      title: 'Unit Management',
      description: 'Track individual units and their status',
      narrative: 'Drill into each property to see units — occupied, vacant, under maintenance. Know exactly what\'s earning and what\'s not.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View unit inventory',
      nigeriaNote: 'Flats, shops, offices, and rooms tracked separately'
    },
    {
      id: 're-owner-3',
      stepNumber: 3,
      title: 'Lease Visibility',
      description: 'Monitor active leases and renewals',
      narrative: 'See all active leases, upcoming expirations, and renewal status. Plan ahead with clear visibility into tenant commitments.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Review lease portfolio',
      nigeriaNote: 'Annual rent upfront is the Lagos standard'
    },
    {
      id: 're-owner-4',
      stepNumber: 4,
      title: 'Rent & Service Charges',
      description: 'Track rent schedules and service charge facts',
      narrative: 'Every rent obligation becomes a charge fact. See what\'s due, what\'s paid, what\'s overdue. Service charges tracked separately.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View rent schedules',
      nigeriaNote: 'Service charge separation for estate maintenance'
    },
    {
      id: 're-owner-5',
      stepNumber: 5,
      title: 'Maintenance Tracking',
      description: 'Monitor property maintenance requests',
      narrative: 'Tenants report issues, you track resolution. Emergency, high, medium, low priority — all visible with cost estimates.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View maintenance queue',
      nigeriaNote: 'Plumbing, electrical, HVAC common in Lagos properties'
    },
    {
      id: 're-owner-6',
      stepNumber: 6,
      title: 'Commerce Handoff',
      description: 'Rent facts flow to Commerce for billing',
      narrative: 'Real Estate creates charge facts. Commerce handles invoicing, VAT, and payment collection. Clean boundary — property management never touches accounting.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'See Commerce boundary',
      nigeriaNote: 'VAT on commercial properties, exempt on residential'
    }
  ]
}

// ============================================================================
// STORYLINE 24: PROPERTY MANAGER (REAL ESTATE SUITE)
// ============================================================================

export const propertyManagerStoryline: Storyline = {
  id: 'propertyManager',
  name: 'Property Manager Workflow',
  description: 'Day-to-day property operations and tenant management',
  persona: 'Property Manager, Estate Administrator, or Facility Manager',
  durationMinutes: 10,
  suites: ['Real Estate'],
  steps: [
    {
      id: 're-manager-1',
      stepNumber: 1,
      title: 'Daily Dashboard',
      description: 'Overview of today\'s priorities',
      narrative: 'Start your day with the dashboard — expiring leases, overdue rents, pending maintenance, vacant units. Know what needs attention.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View operations dashboard',
      nigeriaNote: 'Nigerian property managers handle multiple estates'
    },
    {
      id: 're-manager-2',
      stepNumber: 2,
      title: 'Tenant Onboarding',
      description: 'Process new tenant applications',
      narrative: 'New tenant? Create a lease with all terms — rent, service charge, deposit, notice period. Nigerian annual rent norms pre-configured.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'See lease creation workflow',
      nigeriaNote: 'Caution deposit typically 6-12 months rent'
    },
    {
      id: 're-manager-3',
      stepNumber: 3,
      title: 'Rent Collection Tracking',
      description: 'Monitor payments and arrears',
      narrative: 'Track who\'s paid, who\'s partial, who\'s overdue. Late fee calculations automatic. Payment references recorded for reconciliation.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View rent collection status',
      nigeriaNote: 'Cash, transfer, and cheque payments common'
    },
    {
      id: 're-manager-4',
      stepNumber: 4,
      title: 'Maintenance Dispatch',
      description: 'Assign and track maintenance requests',
      narrative: 'Tenant reports a broken pipe? Assign to a vendor, schedule a date, track to completion. Full audit trail of who did what.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Manage maintenance workflow',
      nigeriaNote: 'Vendor management for plumbing, electrical, HVAC'
    },
    {
      id: 're-manager-5',
      stepNumber: 5,
      title: 'Lease Renewals',
      description: 'Process expiring leases',
      narrative: 'Leases expiring soon? Initiate renewal conversations, adjust rent if needed, generate new agreements. No gaps in occupancy.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View renewal pipeline',
      nigeriaNote: 'Annual rent increases of 10-20% common in Lagos'
    },
    {
      id: 're-manager-6',
      stepNumber: 6,
      title: 'Tenant Communication',
      description: 'Send notices and updates',
      narrative: 'Payment reminders, maintenance schedules, estate notices — all tracked. Communication history with every tenant on record.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View communication log',
      nigeriaNote: 'SMS and WhatsApp preferred for tenant comms'
    },
    {
      id: 're-manager-7',
      stepNumber: 7,
      title: 'Reporting',
      description: 'Generate property reports',
      narrative: 'Monthly reports for owners — occupancy, income, expenses, maintenance. Professional reports that build landlord trust.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Generate reports',
      nigeriaNote: 'Property management fees typically 10% of rent'
    }
  ]
}

// ============================================================================
// STORYLINE 25: TENANT (REAL ESTATE SUITE)
// ============================================================================

export const tenantStoryline: Storyline = {
  id: 'tenant',
  name: 'Tenant Experience',
  description: 'Lease terms, rent obligations, and maintenance requests',
  persona: 'Residential Tenant, Commercial Tenant, or Business Lessee',
  durationMinutes: 6,
  suites: ['Real Estate'],
  steps: [
    {
      id: 're-tenant-1',
      stepNumber: 1,
      title: 'Lease Details',
      description: 'View your lease terms and obligations',
      narrative: 'Your lease shows everything — unit details, rent amount, service charges, deposit, start and end dates. No hidden terms.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View lease agreement',
      nigeriaNote: 'Annual leases with upfront payment standard'
    },
    {
      id: 're-tenant-2',
      stepNumber: 2,
      title: 'Rent Schedule',
      description: 'Know when rent is due',
      narrative: 'See your payment schedule — when it\'s due, how much, what\'s already paid. No surprises on rent day.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View payment schedule',
      nigeriaNote: 'Nigerian landlords prefer annual payment'
    },
    {
      id: 're-tenant-3',
      stepNumber: 3,
      title: 'Payment History',
      description: 'Track your payment records',
      narrative: 'Every payment recorded with date, amount, and reference. Your receipts are always available for proof.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View payment history',
      nigeriaNote: 'Receipt numbers for bank reconciliation'
    },
    {
      id: 're-tenant-4',
      stepNumber: 4,
      title: 'Report Issues',
      description: 'Submit maintenance requests',
      narrative: 'Broken pipe? AC not working? Submit a request with priority level. Track progress until resolved.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Submit maintenance request',
      nigeriaNote: 'Emergency requests get same-day attention'
    },
    {
      id: 're-tenant-5',
      stepNumber: 5,
      title: 'Renewal Options',
      description: 'Plan for lease renewal',
      narrative: 'Lease expiring? See renewal options and new terms. Decide early to secure your tenancy.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'View renewal options',
      nigeriaNote: 'Notice period typically 90 days for residential'
    }
  ]
}

// ============================================================================
// STORYLINE 26: REAL ESTATE AUDITOR (REAL ESTATE SUITE)
// ============================================================================

export const realEstateAuditorStoryline: Storyline = {
  id: 'realEstateAuditor',
  name: 'Auditor Review',
  description: 'Lease verification, rent reconciliation, and compliance',
  persona: 'Internal Auditor, Finance Controller, or Property Accountant',
  durationMinutes: 8,
  suites: ['Real Estate'],
  steps: [
    {
      id: 're-audit-1',
      stepNumber: 1,
      title: 'Lease Reconstruction',
      description: 'Verify lease terms and history',
      narrative: 'Select any lease and see its complete history — original terms, amendments, renewals. Full audit trail of changes.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Reconstruct lease history',
      nigeriaNote: 'Lease amendments require landlord approval'
    },
    {
      id: 're-audit-2',
      stepNumber: 2,
      title: 'Rent Reconciliation',
      description: 'Match charges to payments',
      narrative: 'Every rent charge should have a payment. Identify partial payments, overpayments, and outstanding balances.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Reconcile rent vs payments',
      nigeriaNote: 'Annual payments simplify reconciliation'
    },
    {
      id: 're-audit-3',
      stepNumber: 3,
      title: 'Occupancy Verification',
      description: 'Verify unit occupancy records',
      narrative: 'Is every occupied unit backed by an active lease? Identify discrepancies between physical occupancy and records.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Audit occupancy records',
      nigeriaNote: 'Informal subletting is a common issue'
    },
    {
      id: 're-audit-4',
      stepNumber: 4,
      title: 'Service Charge Analysis',
      description: 'Review service charge allocation',
      narrative: 'Service charges collected vs expenses incurred. Verify fair allocation across tenants and proper use of funds.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Audit service charges',
      nigeriaNote: 'Service charge transparency builds tenant trust'
    },
    {
      id: 're-audit-5',
      stepNumber: 5,
      title: 'Maintenance Cost Review',
      description: 'Audit maintenance expenditure',
      narrative: 'Review maintenance costs — estimated vs actual. Identify patterns, vendor performance, and cost outliers.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Review maintenance costs',
      nigeriaNote: 'Vendor invoices require verification'
    },
    {
      id: 're-audit-6',
      stepNumber: 6,
      title: 'Commerce Boundary',
      description: 'Verify billing fact handoff',
      narrative: 'Real Estate creates charge facts. Commerce creates invoices. Verify the boundary is clean — no VAT calculation in Real Estate.',
      suite: 'Real Estate',
      route: '/real-estate-demo',
      actionHint: 'Verify Commerce boundary',
      nigeriaNote: 'Commercial rent attracts VAT, residential exempt'
    }
  ]
}

// ============================================================================
// STORYLINE 27: PROJECT OWNER (PROJECT MANAGEMENT SUITE)
// ============================================================================

export const projectOwnerStoryline: Storyline = {
  id: 'projectOwner',
  name: 'Project Owner Journey',
  description: 'Project visibility, cost control, and delivery oversight',
  persona: 'Business Owner, Client, or Executive Sponsor',
  durationMinutes: 8,
  suites: ['Project Management'],
  steps: [
    {
      id: 'pm-owner-1',
      stepNumber: 1,
      title: 'Project Portfolio',
      description: 'View all your projects at a glance',
      narrative: 'Your project dashboard shows all active initiatives — status, health, progress, and spend. Know exactly where things stand.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View project portfolio',
      nigeriaNote: 'BuildRight Construction Ltd manages multiple Lagos projects'
    },
    {
      id: 'pm-owner-2',
      stepNumber: 2,
      title: 'Project Health',
      description: 'Monitor project health indicators',
      narrative: 'Green, yellow, red — health status shows at a glance. Budget variance, schedule slippage, and risk flags all visible.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Check health dashboard',
      nigeriaNote: 'Nigerian projects often face procurement delays'
    },
    {
      id: 'pm-owner-3',
      stepNumber: 3,
      title: 'Milestone Tracking',
      description: 'Track key deliverables and deadlines',
      narrative: 'Major milestones with target dates and completion status. Know if you\'re on track without diving into task details.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View milestones timeline',
      nigeriaNote: 'Phase completions tied to payment schedules'
    },
    {
      id: 'pm-owner-4',
      stepNumber: 4,
      title: 'Budget Overview',
      description: 'Track project costs against budget',
      narrative: 'Estimated vs actual spend by category. Know where money is going — labor, materials, equipment, contractors.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Review budget summary',
      nigeriaNote: 'NGN budget tracking with category breakdown'
    },
    {
      id: 'pm-owner-5',
      stepNumber: 5,
      title: 'Team Performance',
      description: 'Review team productivity and allocation',
      narrative: 'Who\'s working on what? Team workload, task completion rates, and utilization at a glance.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View team dashboard',
      nigeriaNote: 'Construction crews and office staff tracked separately'
    },
    {
      id: 'pm-owner-6',
      stepNumber: 6,
      title: 'Commerce Handoff',
      description: 'Budget facts flow to Commerce for billing',
      narrative: 'Project Management creates cost facts. Commerce handles invoicing and payments. Clean boundary — projects don\'t process payments.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'See Commerce boundary',
      nigeriaNote: 'VAT and accounting handled by Commerce Suite'
    }
  ]
}

// ============================================================================
// STORYLINE 28: PROJECT MANAGER (PROJECT MANAGEMENT SUITE)
// ============================================================================

export const projectManagerStoryline: Storyline = {
  id: 'projectManager',
  name: 'Project Manager Workflow',
  description: 'Planning, execution, and delivery management',
  persona: 'Project Manager, Operations Lead, or Site Coordinator',
  durationMinutes: 10,
  suites: ['Project Management'],
  steps: [
    {
      id: 'pm-manager-1',
      stepNumber: 1,
      title: 'Daily Dashboard',
      description: 'Your operational command center',
      narrative: 'Start each day with the PM dashboard — overdue tasks, upcoming milestones, team availability, and blockers requiring attention.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View PM dashboard',
      nigeriaNote: 'Lagos construction projects need daily coordination'
    },
    {
      id: 'pm-manager-2',
      stepNumber: 2,
      title: 'Task Management',
      description: 'Create, assign, and track tasks',
      narrative: 'Break milestones into tasks. Assign to team members with deadlines, priorities, and dependencies. Track progress in real-time.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Manage tasks',
      nigeriaNote: 'Task dependencies critical for construction sequencing'
    },
    {
      id: 'pm-manager-3',
      stepNumber: 3,
      title: 'Team Coordination',
      description: 'Manage team assignments and workload',
      narrative: 'Balance workload across team members. Reassign tasks when needed. Know who\'s overloaded and who has capacity.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View team workload',
      nigeriaNote: 'Mix of permanent staff and contract workers'
    },
    {
      id: 'pm-manager-4',
      stepNumber: 4,
      title: 'Timeline Management',
      description: 'Adjust schedules and dependencies',
      narrative: 'When delays happen, update timelines. Cascade changes to dependent tasks. Keep milestones realistic.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Update timeline',
      nigeriaNote: 'Rainy season impacts construction schedules'
    },
    {
      id: 'pm-manager-5',
      stepNumber: 5,
      title: 'Budget Monitoring',
      description: 'Track spend against approved budget',
      narrative: 'Record actual costs as they occur. Compare to estimates. Flag overruns early before they become problems.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Monitor budget',
      nigeriaNote: 'Material cost fluctuations common in Nigeria'
    },
    {
      id: 'pm-manager-6',
      stepNumber: 6,
      title: 'Status Reporting',
      description: 'Generate progress reports',
      narrative: 'Weekly status reports with progress, blockers, and forecasts. Keep stakeholders informed without manual compilation.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Generate reports',
      nigeriaNote: 'Client reporting for payment milestones'
    },
    {
      id: 'pm-manager-7',
      stepNumber: 7,
      title: 'Risk Management',
      description: 'Track and mitigate project risks',
      narrative: 'Identify risks, assess impact, assign mitigation owners. Keep a live risk register that informs project health.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Manage risks',
      nigeriaNote: 'Currency, procurement, and regulatory risks'
    }
  ]
}

// ============================================================================
// STORYLINE 29: TEAM MEMBER (PROJECT MANAGEMENT SUITE)
// ============================================================================

export const teamMemberStoryline: Storyline = {
  id: 'teamMember',
  name: 'Team Member Experience',
  description: 'Tasks, updates, and accountability',
  persona: 'Engineer, Staff Member, or Contractor',
  durationMinutes: 6,
  suites: ['Project Management'],
  steps: [
    {
      id: 'pm-team-1',
      stepNumber: 1,
      title: 'My Tasks',
      description: 'View assigned tasks and priorities',
      narrative: 'Your task list shows everything assigned to you — priorities, deadlines, and blockers. Know exactly what\'s expected.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View my tasks',
      nigeriaNote: 'Clear task ownership reduces confusion on site'
    },
    {
      id: 'pm-team-2',
      stepNumber: 2,
      title: 'Start Work',
      description: 'Mark tasks as in progress',
      narrative: 'When you start a task, mark it as in progress. This signals to the team that work has begun.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Start a task',
      nigeriaNote: 'Status updates visible to supervisors'
    },
    {
      id: 'pm-team-3',
      stepNumber: 3,
      title: 'Log Updates',
      description: 'Record progress and notes',
      narrative: 'Add comments, attach photos, note blockers. Keep a record of work done that anyone can reference.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Log task update',
      nigeriaNote: 'Photo evidence common for construction progress'
    },
    {
      id: 'pm-team-4',
      stepNumber: 4,
      title: 'Complete Task',
      description: 'Mark task as done',
      narrative: 'When finished, mark complete. This updates project progress automatically and notifies stakeholders.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Complete task',
      nigeriaNote: 'Completion unlocks dependent tasks'
    },
    {
      id: 'pm-team-5',
      stepNumber: 5,
      title: 'View Project Context',
      description: 'Understand the bigger picture',
      narrative: 'See how your tasks fit into milestones and project goals. Understand why your work matters.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'View project overview',
      nigeriaNote: 'Context helps teams make better decisions'
    }
  ]
}

// ============================================================================
// STORYLINE 30: PROJECT AUDITOR (PROJECT MANAGEMENT SUITE)
// ============================================================================

export const projectAuditorStoryline: Storyline = {
  id: 'projectAuditor',
  name: 'Auditor Review',
  description: 'Cost traceability and audit trail',
  persona: 'Finance Controller, Auditor, or Compliance Officer',
  durationMinutes: 8,
  suites: ['Project Management'],
  steps: [
    {
      id: 'pm-audit-1',
      stepNumber: 1,
      title: 'Project Reconstruction',
      description: 'Trace complete project history',
      narrative: 'Select any project and see its full timeline — creation, status changes, milestone completions. Full audit trail.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Reconstruct project history',
      nigeriaNote: 'Audit trails essential for corporate governance'
    },
    {
      id: 'pm-audit-2',
      stepNumber: 2,
      title: 'Budget Verification',
      description: 'Verify budget items and approvals',
      narrative: 'Every budget item has an approval chain. Verify who approved what, when, and whether actual spend matches.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Audit budget approvals',
      nigeriaNote: 'Approval workflows prevent unauthorized spend'
    },
    {
      id: 'pm-audit-3',
      stepNumber: 3,
      title: 'Cost Reconciliation',
      description: 'Match costs to deliverables',
      narrative: 'Trace costs back to tasks and milestones. Ensure every expense is tied to a specific deliverable.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Reconcile costs',
      nigeriaNote: 'Deliverable-based costing for client billing'
    },
    {
      id: 'pm-audit-4',
      stepNumber: 4,
      title: 'Resource Utilization',
      description: 'Audit team time and allocation',
      narrative: 'Review how team time was spent. Compare planned vs actual effort. Identify efficiency issues.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Review utilization',
      nigeriaNote: 'Labor cost is major expense in Nigerian projects'
    },
    {
      id: 'pm-audit-5',
      stepNumber: 5,
      title: 'Variance Analysis',
      description: 'Analyze budget and schedule variances',
      narrative: 'Why did the project go over budget? Why was it late? Variance analysis provides answers.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Analyze variances',
      nigeriaNote: 'Post-project reviews improve future estimates'
    },
    {
      id: 'pm-audit-6',
      stepNumber: 6,
      title: 'Commerce Boundary',
      description: 'Verify billing fact handoff',
      narrative: 'Project Management creates cost facts. Commerce creates invoices. Verify the boundary is clean — no payment processing in PM.',
      suite: 'Project Management',
      route: '/project-demo',
      actionHint: 'Verify Commerce boundary',
      nigeriaNote: 'Clean boundary for proper accounting'
    }
  ]
}

// ============================================================================
// STORYLINE 31: RECRUITER (RECRUITMENT SUITE)
// ============================================================================

export const recruiterStoryline: Storyline = {
  id: 'recruiter',
  name: 'Recruiter Workflow',
  description: 'Source candidates, manage pipelines, close placements',
  persona: 'Recruitment Consultant / Talent Acquisition Specialist',
  durationMinutes: 8,
  suites: ['Recruitment'],
  steps: [
    {
      id: 'rec-recruiter-1',
      stepNumber: 1,
      title: 'Create Job Listing',
      description: 'Post a new role for a client',
      narrative: 'Start with the job brief from your client. Define requirements, salary range, and location. Nigerian tech roles often have Lagos or remote options.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Create a new job posting',
      nigeriaNote: 'Paystack, Flutterwave, Andela are top tech clients'
    },
    {
      id: 'rec-recruiter-2',
      stepNumber: 2,
      title: 'Review Candidates',
      description: 'Screen incoming applications',
      narrative: 'Applications flow in from LinkedIn, Indeed Nigeria, and referrals. Screen CVs against job requirements.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Review candidate applications',
      nigeriaNote: 'Referrals are gold in Nigerian hiring'
    },
    {
      id: 'rec-recruiter-3',
      stepNumber: 3,
      title: 'Schedule Interviews',
      description: 'Coordinate with candidates and clients',
      narrative: 'Match candidate availability with hiring manager schedules. Send calendar invites and prep materials.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Schedule an interview',
      nigeriaNote: 'Virtual interviews now standard post-COVID'
    },
    {
      id: 'rec-recruiter-4',
      stepNumber: 4,
      title: 'Advance Pipeline',
      description: 'Move candidates through stages',
      narrative: 'Track candidate progress: Applied → Screening → Interview → Offer. Keep pipeline velocity high.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Move candidate to next stage',
      nigeriaNote: 'Top tech talent gets multiple offers — move fast'
    },
    {
      id: 'rec-recruiter-5',
      stepNumber: 5,
      title: 'Placement Completed',
      description: 'Close the deal and onboard',
      narrative: 'Candidate accepts, start date confirmed. Placement is complete. Time to collect your success metrics.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Mark placement as complete',
      nigeriaNote: 'Typical fee: 15-25% of first year salary'
    },
    {
      id: 'rec-recruiter-6',
      stepNumber: 6,
      title: 'Fee Fact Emitted',
      description: 'Handoff to Commerce for billing',
      narrative: 'Recruitment creates the placement fee fact. Commerce handles invoicing and payment collection. Clean boundary.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'View fee fact in Commerce',
      nigeriaNote: 'VAT and withholding handled by Commerce'
    }
  ]
}

// ============================================================================
// STORYLINE 32: HIRING MANAGER (RECRUITMENT SUITE)
// ============================================================================

export const hiringManagerStoryline: Storyline = {
  id: 'hiringManager',
  name: 'Hiring Manager Experience',
  description: 'Review candidates, conduct interviews, approve offers',
  persona: 'Department Head / Team Lead / VP',
  durationMinutes: 7,
  suites: ['Recruitment'],
  steps: [
    {
      id: 'rec-hm-1',
      stepNumber: 1,
      title: 'View Open Role',
      description: 'Check your hiring request status',
      narrative: 'Your job requisition is live. See how many candidates have applied and where they are in the pipeline.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'View your open role',
      nigeriaNote: 'Track time-to-fill for budget planning'
    },
    {
      id: 'rec-hm-2',
      stepNumber: 2,
      title: 'Review Shortlist',
      description: 'Evaluate pre-screened candidates',
      narrative: 'Recruiters have screened applications. Review the shortlist and provide feedback on who to interview.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Review candidate shortlist',
      nigeriaNote: 'Strong tech talent in Lagos, Abuja, Ibadan'
    },
    {
      id: 'rec-hm-3',
      stepNumber: 3,
      title: 'Interview Candidate',
      description: 'Conduct technical or cultural fit interview',
      narrative: 'Meet the candidate. Assess technical skills, cultural fit, and growth potential. Score against your rubric.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Record interview feedback',
      nigeriaNote: 'Panel interviews common for senior roles'
    },
    {
      id: 'rec-hm-4',
      stepNumber: 4,
      title: 'Submit Feedback',
      description: 'Provide structured interview feedback',
      narrative: 'Log your assessment: strengths, concerns, recommendation. This feeds into the hiring decision.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Submit interview feedback',
      nigeriaNote: 'Structured feedback reduces bias'
    },
    {
      id: 'rec-hm-5',
      stepNumber: 5,
      title: 'Approve Offer',
      description: 'Sign off on compensation package',
      narrative: 'Review and approve the offer letter. Salary, start date, benefits — make sure it aligns with your budget.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Approve offer letter',
      nigeriaNote: 'NGN salary + benefits + performance bonus'
    },
    {
      id: 'rec-hm-6',
      stepNumber: 6,
      title: 'Hire Confirmed',
      description: 'Welcome your new team member',
      narrative: 'Offer accepted! Onboarding begins. Recruitment hands off to HR for first-day setup.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'View hire confirmation',
      nigeriaNote: 'Notice period in Nigeria typically 1-3 months'
    }
  ]
}

// ============================================================================
// STORYLINE 33: CANDIDATE (RECRUITMENT SUITE)
// ============================================================================

export const candidateStoryline: Storyline = {
  id: 'candidate',
  name: 'Candidate Journey',
  description: 'Apply for roles, track applications, receive offers',
  persona: 'Job Seeker / Applicant',
  durationMinutes: 6,
  suites: ['Recruitment'],
  steps: [
    {
      id: 'rec-cand-1',
      stepNumber: 1,
      title: 'Apply for Role',
      description: 'Submit your application',
      narrative: 'Found a role that matches your skills. Submit your CV and cover letter. Application received.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Submit application',
      nigeriaNote: 'Tech roles in Lagos offer competitive salaries'
    },
    {
      id: 'rec-cand-2',
      stepNumber: 2,
      title: 'Track Application',
      description: 'See where you are in the process',
      narrative: 'No more wondering "did they get my CV?" Track your application status in real-time.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Check application status',
      nigeriaNote: 'Transparency builds candidate trust'
    },
    {
      id: 'rec-cand-3',
      stepNumber: 3,
      title: 'Attend Interview',
      description: 'Meet the hiring team',
      narrative: 'Interview scheduled! Prepare with the job brief and company research. Show what you can bring.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'View interview details',
      nigeriaNote: 'Virtual interviews via Zoom or Google Meet'
    },
    {
      id: 'rec-cand-4',
      stepNumber: 4,
      title: 'Receive Offer',
      description: 'Review the compensation package',
      narrative: 'Good news! Offer received. Review salary, benefits, start date. Negotiate if needed.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Review offer letter',
      nigeriaNote: 'HMO, pension, and 13th month common in Nigeria'
    },
    {
      id: 'rec-cand-5',
      stepNumber: 5,
      title: 'Accept & Onboard',
      description: 'Confirm your new role',
      narrative: 'Offer accepted! Complete onboarding documents. Get ready for day one at your new company.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Accept offer',
      nigeriaNote: 'NSITF, NHF, and pension setup required'
    }
  ]
}

// ============================================================================
// STORYLINE 34: RECRUITMENT AUDITOR (RECRUITMENT SUITE)
// ============================================================================

export const recruitmentAuditorStoryline: Storyline = {
  id: 'recruitmentAuditor',
  name: 'Recruitment Auditor Review',
  description: 'Audit placements, verify fees, check Commerce handoff',
  persona: 'Finance / Compliance / Internal Audit',
  durationMinutes: 7,
  suites: ['Recruitment'],
  steps: [
    {
      id: 'rec-audit-1',
      stepNumber: 1,
      title: 'Review Placements',
      description: 'Audit completed placements',
      narrative: 'Start with the placement register. How many hires? What roles? Which clients? Get the big picture.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'View placement register',
      nigeriaNote: 'Quarterly placement audits are best practice'
    },
    {
      id: 'rec-audit-2',
      stepNumber: 2,
      title: 'Verify Timelines',
      description: 'Check time-to-fill metrics',
      narrative: 'How long did each placement take? Compare against SLAs with clients. Identify bottlenecks.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Analyze time-to-fill',
      nigeriaNote: 'Senior tech roles average 45-60 days in Lagos'
    },
    {
      id: 'rec-audit-3',
      stepNumber: 3,
      title: 'Validate Fee Facts',
      description: 'Verify placement fee calculations',
      narrative: 'Check that placement fees match contracts. 15% of ₦18M salary = ₦2.7M fee. Math should be right.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Audit fee calculations',
      nigeriaNote: 'Fee disputes happen — documentation is key'
    },
    {
      id: 'rec-audit-4',
      stepNumber: 4,
      title: 'Cross-Check Commerce',
      description: 'Verify handoff to billing',
      narrative: 'Recruitment creates fee facts. Commerce creates invoices. Verify the data flows correctly.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Compare to Commerce invoices',
      nigeriaNote: 'VAT @ 7.5% applied by Commerce, not Recruitment'
    },
    {
      id: 'rec-audit-5',
      stepNumber: 5,
      title: 'Verify Payment Status',
      description: 'Check payment collection',
      narrative: 'Fees invoiced but are they paid? Recruitment tracks placement. Commerce tracks payment.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Review payment status',
      nigeriaNote: 'Net-30 to Net-60 payment terms typical'
    },
    {
      id: 'rec-audit-6',
      stepNumber: 6,
      title: 'Confirm Boundary',
      description: 'Verify Recruitment stays in lane',
      narrative: 'Recruitment emits facts. Commerce handles money. Confirm no boundary violations — clean audit.',
      suite: 'Recruitment',
      route: '/recruitment-demo',
      actionHint: 'Verify Commerce boundary',
      nigeriaNote: 'Separation of concerns for compliance'
    }
  ]
}

// ============================================================================
// STORYLINE 35: LEGAL CLIENT (LEGAL PRACTICE SUITE)
// ============================================================================

export const legalClientStoryline: Storyline = {
  id: 'legalClient',
  name: 'Client Journey',
  description: 'Track your matters, view billing, monitor deadlines',
  persona: 'Client / Instructing Party',
  durationMinutes: 6,
  suites: ['Legal Practice'],
  steps: [
    {
      id: 'leg-client-1',
      stepNumber: 1,
      title: 'View Your Matters',
      description: 'See all your active legal matters',
      narrative: 'As a client, you want visibility into your cases. See the status, next steps, and assigned lawyers.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View matter list',
      nigeriaNote: 'Nigerian courts can take years — transparency matters'
    },
    {
      id: 'leg-client-2',
      stepNumber: 2,
      title: 'Check Deadlines',
      description: 'Know when important dates are coming',
      narrative: 'Court dates, filing deadlines, limitation periods. Stay informed about critical milestones.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View upcoming deadlines',
      nigeriaNote: 'Missing a limitation period is malpractice'
    },
    {
      id: 'leg-client-3',
      stepNumber: 3,
      title: 'Review Billing',
      description: 'See time entries and fees',
      narrative: 'Understand what you\'re being charged for. Review billable hours and disbursements.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View billing summary',
      nigeriaNote: 'Retainer billing is standard in Nigerian law firms'
    },
    {
      id: 'leg-client-4',
      stepNumber: 4,
      title: 'Check Retainer Balance',
      description: 'Monitor your retainer account',
      narrative: 'See how much of your retainer has been used. Know when to top up.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View retainer balance',
      nigeriaNote: 'Low retainer = firm may slow down work'
    },
    {
      id: 'leg-client-5',
      stepNumber: 5,
      title: 'Access Documents',
      description: 'View case documents and filings',
      narrative: 'Access court documents, briefs, and evidence. Everything in one place.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View documents',
      nigeriaNote: 'Document custody is crucial for Nigerian litigation'
    }
  ]
}

// ============================================================================
// STORYLINE 36: LAWYER (LEGAL PRACTICE SUITE)
// ============================================================================

export const lawyerStoryline: Storyline = {
  id: 'lawyer',
  name: 'Lawyer Workflow',
  description: 'Manage cases, track time, handle filings',
  persona: 'Lawyer / Counsel / Associate',
  durationMinutes: 9,
  suites: ['Legal Practice'],
  steps: [
    {
      id: 'leg-lawyer-1',
      stepNumber: 1,
      title: 'Review Matter Dashboard',
      description: 'See your assigned matters',
      narrative: 'Start your day with a view of all active matters. What needs attention? What\'s urgent?',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View matter dashboard',
      nigeriaNote: 'Nigerian lawyers often handle 20+ matters at once'
    },
    {
      id: 'leg-lawyer-2',
      stepNumber: 2,
      title: 'Check Court Calendar',
      description: 'Know your upcoming appearances',
      narrative: 'Court dates, hearings, mentions. Plan your week around court schedules.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View court calendar',
      nigeriaNote: 'Lagos courts run from 9am — be early'
    },
    {
      id: 'leg-lawyer-3',
      stepNumber: 3,
      title: 'Record Time Entry',
      description: 'Log your billable hours',
      narrative: 'Every hour counts. Record research, drafting, client calls, and court time.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Log time entry',
      nigeriaNote: 'Typical partner rate: ₦50,000-100,000/hour'
    },
    {
      id: 'leg-lawyer-4',
      stepNumber: 4,
      title: 'Draft Documents',
      description: 'Prepare legal documents',
      narrative: 'Briefs, motions, contracts. Use templates and document management.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Access document templates',
      nigeriaNote: 'Nigerian court formats are specific — follow Rules'
    },
    {
      id: 'leg-lawyer-5',
      stepNumber: 5,
      title: 'File at Court',
      description: 'Track court filings',
      narrative: 'Record what was filed, when, and proof of service. Track filing fees as disbursements.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Record court filing',
      nigeriaNote: 'FHC filing fees can exceed ₦50,000'
    },
    {
      id: 'leg-lawyer-6',
      stepNumber: 6,
      title: 'Update Matter Status',
      description: 'Keep matter records current',
      narrative: 'After each milestone, update the matter. Notes, outcomes, next steps.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Update matter notes',
      nigeriaNote: 'Good notes protect against malpractice claims'
    },
    {
      id: 'leg-lawyer-7',
      stepNumber: 7,
      title: 'Billing Handoff',
      description: 'Ensure time is ready for billing',
      narrative: 'Review unbilled time. Mark entries ready for invoicing. Commerce takes it from here.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Review unbilled time',
      nigeriaNote: 'Legal Practice emits fee facts → Commerce invoices'
    }
  ]
}

// ============================================================================
// STORYLINE 37: FIRM ADMIN (LEGAL PRACTICE SUITE)
// ============================================================================

export const firmAdminStoryline: Storyline = {
  id: 'firmAdmin',
  name: 'Firm Administration',
  description: 'Oversee practice, manage team, track retainers',
  persona: 'Firm Administrator / Managing Partner / Office Manager',
  durationMinutes: 7,
  suites: ['Legal Practice'],
  steps: [
    {
      id: 'leg-admin-1',
      stepNumber: 1,
      title: 'Practice Overview',
      description: 'See firm-wide metrics',
      narrative: 'How many active matters? Total billable hours? Revenue pipeline? Get the big picture.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View practice dashboard',
      nigeriaNote: 'Top Lagos firms handle 100+ matters at a time'
    },
    {
      id: 'leg-admin-2',
      stepNumber: 2,
      title: 'Team Utilization',
      description: 'Monitor lawyer workload',
      narrative: 'Who\'s overloaded? Who has capacity? Balance work across the team.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View team utilization',
      nigeriaNote: 'Associate burnout is real — monitor closely'
    },
    {
      id: 'leg-admin-3',
      stepNumber: 3,
      title: 'Retainer Management',
      description: 'Track client retainers',
      narrative: 'Which retainers are running low? Who needs to top up? Prevent work stoppage.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View retainer status',
      nigeriaNote: 'No retainer = no work (firm policy)'
    },
    {
      id: 'leg-admin-4',
      stepNumber: 4,
      title: 'Deadline Oversight',
      description: 'Ensure nothing falls through',
      narrative: 'Review all upcoming deadlines. Flag anything at risk. Court doesn\'t accept excuses.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Review deadline calendar',
      nigeriaNote: 'Missing a court date can mean case dismissal'
    },
    {
      id: 'leg-admin-5',
      stepNumber: 5,
      title: 'Unbilled Time Review',
      description: 'Find revenue leakage',
      narrative: 'Time recorded but not billed? Money on the table. Prompt billing improves cash flow.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Review unbilled time',
      nigeriaNote: 'Nigerian clients pay faster with prompt invoices'
    },
    {
      id: 'leg-admin-6',
      stepNumber: 6,
      title: 'Client Relationships',
      description: 'Manage client health',
      narrative: 'Happy clients return. Track client satisfaction, matter outcomes, and relationship health.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'View client summary',
      nigeriaNote: 'Referrals are the best marketing for law firms'
    }
  ]
}

// ============================================================================
// STORYLINE 38: LEGAL AUDITOR (LEGAL PRACTICE SUITE)
// ============================================================================

export const legalAuditorStoryline: Storyline = {
  id: 'legalAuditor',
  name: 'Legal Auditor Review',
  description: 'Verify fees, audit compliance, check Commerce boundary',
  persona: 'Finance / Compliance / Regulator',
  durationMinutes: 7,
  suites: ['Legal Practice'],
  steps: [
    {
      id: 'leg-audit-1',
      stepNumber: 1,
      title: 'Review Fee Structure',
      description: 'Audit billing rates and fees',
      narrative: 'Are fees within market rates? Do they match engagement letters? Verify fee transparency.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Review fee schedule',
      nigeriaNote: 'NBA has suggested minimum fees — check compliance'
    },
    {
      id: 'leg-audit-2',
      stepNumber: 2,
      title: 'Time Entry Audit',
      description: 'Verify billable hour records',
      narrative: 'Are time entries reasonable? Block billing vs detailed entries? Check for padding.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Audit time entries',
      nigeriaNote: '10-hour days are suspicious without explanation'
    },
    {
      id: 'leg-audit-3',
      stepNumber: 3,
      title: 'Retainer Compliance',
      description: 'Check retainer handling',
      narrative: 'Are retainers properly managed? LPDC rules require retainer accounts. Verify compliance.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Audit retainer accounts',
      nigeriaNote: 'LPDC can discipline for retainer mismanagement'
    },
    {
      id: 'leg-audit-4',
      stepNumber: 4,
      title: 'Disbursement Verification',
      description: 'Audit expense claims',
      narrative: 'Filing fees, transport, expert witness fees. Are disbursements documented and reasonable?',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Review disbursements',
      nigeriaNote: 'Receipts required for all disbursements'
    },
    {
      id: 'leg-audit-5',
      stepNumber: 5,
      title: 'Commerce Handoff Check',
      description: 'Verify fee → invoice flow',
      narrative: 'Legal Practice creates fee facts. Commerce creates invoices. Verify the boundary.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Trace fee to invoice',
      nigeriaNote: 'VAT @ 7.5% must be applied by Commerce only'
    },
    {
      id: 'leg-audit-6',
      stepNumber: 6,
      title: 'Compliance Summary',
      description: 'Document audit findings',
      narrative: 'Summarize findings. Clean audit? Issues found? Commerce boundary respected? Document all.',
      suite: 'Legal Practice',
      route: '/legal-demo',
      actionHint: 'Generate audit report',
      nigeriaNote: 'FRCN requires documented audit trails'
    }
  ]
}

// ============================================================================
// STORYLINE 35: WAREHOUSE MANAGER (ADVANCED WAREHOUSE SUITE)
// ============================================================================

export const warehouseManagerStoryline: Storyline = {
  id: 'warehouseManager',
  name: 'Warehouse Manager',
  description: 'Oversee operations, manage zones, track KPIs',
  persona: 'Warehouse Manager, Operations Director, or Supply Chain Lead',
  durationMinutes: 12,
  suites: ['Advanced Warehouse'],
  steps: [
    {
      id: 'wh-mgr-1',
      stepNumber: 1,
      title: 'Operations Dashboard',
      description: 'View warehouse health at a glance',
      narrative: 'Your dashboard shows total zones, active bins, pending receipts, and pick lists for the day. SwiftStock Distribution in Apapa manages pharmaceuticals and FMCG.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'View the operations dashboard',
      nigeriaNote: 'Apapa Industrial Estate handles major import distribution'
    },
    {
      id: 'wh-mgr-2',
      stepNumber: 2,
      title: 'Zone Management',
      description: 'Monitor zone utilization',
      narrative: 'Eight zones cover receiving, ambient storage, cold chain (2-8°C), picking, and shipping. Each zone shows bin count and utilization percentage.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Review zone utilization',
      nigeriaNote: 'Cold chain critical for pharmaceutical distribution'
    },
    {
      id: 'wh-mgr-3',
      stepNumber: 3,
      title: 'Inbound Receipts',
      description: 'Track incoming shipments',
      narrative: 'May & Baker, GlaxoSmithKline, Emzor — see all expected receipts. Track receiving progress item by item.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Monitor inbound receipts',
      nigeriaNote: 'Nigerian pharma distributors require batch-level tracking'
    },
    {
      id: 'wh-mgr-4',
      stepNumber: 4,
      title: 'Pick List Management',
      description: 'Monitor order fulfillment',
      narrative: 'HealthPlus, MedPlus, Alpha Pharmacy — see active pick lists. Track picker assignments, progress, and priority levels.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Review pick list status',
      nigeriaNote: 'Pharmacy chains require same-day dispatch in Lagos'
    },
    {
      id: 'wh-mgr-5',
      stepNumber: 5,
      title: 'Batch Expiry Tracking',
      description: 'Monitor NAFDAC-compliant batches',
      narrative: 'Every batch has NAFDAC number and expiry date. FEFO (First Expiry, First Out) ensures compliance. Alerts for expiring-soon batches.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Review batch expiry dashboard',
      nigeriaNote: 'NAFDAC requires full batch traceability'
    },
    {
      id: 'wh-mgr-6',
      stepNumber: 6,
      title: 'Stock Movements',
      description: 'Track all inventory movements',
      narrative: 'Every receipt, pick, transfer, and adjustment is logged. Complete audit trail with operator, timestamp, and locations.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'View movement history',
      nigeriaNote: 'Full traceability for regulatory compliance'
    },
    {
      id: 'wh-mgr-7',
      stepNumber: 7,
      title: 'Commerce Boundary',
      description: 'Understand operational vs. financial scope',
      narrative: 'Warehouse creates inventory facts — quantities, batches, locations. Commerce handles POs, SOs, invoicing, and valuation. Clean boundary.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'See Commerce boundary architecture',
      nigeriaNote: 'Inventory facts enable Commerce accounting'
    }
  ]
}

// ============================================================================
// STORYLINE 36: RECEIVING CLERK (ADVANCED WAREHOUSE SUITE)
// ============================================================================

export const receivingClerkStoryline: Storyline = {
  id: 'receivingClerk',
  name: 'Receiving Clerk',
  description: 'Process inbound shipments, verify receipts',
  persona: 'Receiving Clerk, Goods-In Operator, or Inbound Coordinator',
  durationMinutes: 10,
  suites: ['Advanced Warehouse'],
  steps: [
    {
      id: 'wh-rcv-1',
      stepNumber: 1,
      title: 'Expected Receipts',
      description: 'View scheduled deliveries',
      narrative: 'Your receiving bay shows what\'s expected today. May & Baker shipment arriving — 8 items against PO-2026-0112.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'View expected receipts',
      nigeriaNote: 'Nigerian suppliers include local and multinational pharma'
    },
    {
      id: 'wh-rcv-2',
      stepNumber: 2,
      title: 'Start Receiving',
      description: 'Begin goods-in process',
      narrative: 'Delivery arrives. Start receiving process — verify supplier, count items, check documents. PO reference links to Commerce.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Start receiving workflow',
      nigeriaNote: 'Document verification critical for NAFDAC compliance'
    },
    {
      id: 'wh-rcv-3',
      stepNumber: 3,
      title: 'Batch Capture',
      description: 'Record batch numbers and expiry dates',
      narrative: 'Each item needs batch number, NAFDAC number, manufacturing date, and expiry date. This enables FEFO allocation later.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Capture batch details',
      nigeriaNote: 'NAFDAC numbers mandatory for pharmaceutical products'
    },
    {
      id: 'wh-rcv-4',
      stepNumber: 4,
      title: 'Quantity Verification',
      description: 'Match received vs. expected',
      narrative: '5 of 8 items received so far. Any variances? Short shipment? Damaged items? All discrepancies logged for procurement follow-up.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Verify quantities received',
      nigeriaNote: 'Variance reporting triggers supplier claims'
    },
    {
      id: 'wh-rcv-5',
      stepNumber: 5,
      title: 'Quality Inspection',
      description: 'Sample inspection if required',
      narrative: 'Cold chain items need temperature verification. High-value items need visual inspection. Flag items for QC hold if needed.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Perform quality inspection',
      nigeriaNote: 'Cold chain breaks common in Nigerian logistics'
    },
    {
      id: 'wh-rcv-6',
      stepNumber: 6,
      title: 'Complete Receipt',
      description: 'Finalize and trigger putaway',
      narrative: 'Receipt complete. System suggests putaway locations based on zone type and bin availability. Putaway tasks created automatically.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Complete receiving',
      nigeriaNote: 'Automatic putaway suggestion reduces training time'
    }
  ]
}

// ============================================================================
// STORYLINE 37: PICKER / PACKER (ADVANCED WAREHOUSE SUITE)
// ============================================================================

export const pickerStoryline: Storyline = {
  id: 'picker',
  name: 'Picker / Packer',
  description: 'Execute pick lists, pack orders for dispatch',
  persona: 'Warehouse Picker, Packer, or Order Fulfillment Staff',
  durationMinutes: 10,
  suites: ['Advanced Warehouse'],
  steps: [
    {
      id: 'wh-pick-1',
      stepNumber: 1,
      title: 'Pick List Queue',
      description: 'View assigned pick lists',
      narrative: 'HealthPlus Pharmacy order — 15 items, HIGH priority. Your pick list shows items, quantities, and bin locations in optimized sequence.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'View your pick list queue',
      nigeriaNote: 'Priority picking for pharmacy chains'
    },
    {
      id: 'wh-pick-2',
      stepNumber: 2,
      title: 'Start Picking',
      description: 'Begin pick execution',
      narrative: 'Walk the optimized route: AMB-A-C2 → AMB-A-B3 → COLD-01-A1. Bin locations sorted to minimize travel time.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Start pick execution',
      nigeriaNote: 'Route optimization reduces pick time by 30%'
    },
    {
      id: 'wh-pick-3',
      stepNumber: 3,
      title: 'Item Confirmation',
      description: 'Confirm each pick',
      narrative: 'At each bin, confirm item and quantity. Scan barcode or enter manually. FEFO ensures oldest expiry picked first.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Confirm picked items',
      nigeriaNote: 'FEFO compliance prevents expired stock reaching customers'
    },
    {
      id: 'wh-pick-4',
      stepNumber: 4,
      title: 'Handle Short-Picks',
      description: 'Manage unavailable stock',
      narrative: 'Bin shows 500 but only 400 available? Short-pick recorded. Manager notified. Inventory discrepancy investigation triggered.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Handle short-pick scenario',
      nigeriaNote: 'Inventory accuracy critical for pharmaceutical distribution'
    },
    {
      id: 'wh-pick-5',
      stepNumber: 5,
      title: 'Packing',
      description: 'Pack order for dispatch',
      narrative: 'All items picked. Pack in appropriate containers. Cold chain items need insulated packaging. Attach packing slip.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Pack the order',
      nigeriaNote: 'Temperature-controlled packaging for pharma'
    },
    {
      id: 'wh-pick-6',
      stepNumber: 6,
      title: 'Dispatch',
      description: 'Hand off to shipping',
      narrative: 'Packed order moves to shipping dock. Status updated to PACKED. Delivery scheduling handled by Commerce/Logistics integration.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Complete dispatch handoff',
      nigeriaNote: 'Lagos delivery scheduling via Logistics Suite'
    }
  ]
}

// ============================================================================
// STORYLINE 38: WAREHOUSE AUDITOR (ADVANCED WAREHOUSE SUITE)
// ============================================================================

export const warehouseAuditorStoryline: Storyline = {
  id: 'warehouseAuditor',
  name: 'Warehouse Auditor',
  description: 'Audit inventory, verify batches, check Commerce boundary',
  persona: 'Internal Auditor, Compliance Officer, or Inventory Controller',
  durationMinutes: 10,
  suites: ['Advanced Warehouse'],
  steps: [
    {
      id: 'wh-audit-1',
      stepNumber: 1,
      title: 'Inventory Accuracy',
      description: 'Compare system vs. physical counts',
      narrative: 'Select any product and see system quantity, batch breakdown, and bin locations. Cycle count reconciliation reveals discrepancies.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Audit inventory accuracy',
      nigeriaNote: 'Cycle counting standard in Nigerian pharma warehouses'
    },
    {
      id: 'wh-audit-2',
      stepNumber: 2,
      title: 'Batch Compliance',
      description: 'Verify NAFDAC batch records',
      narrative: 'Every batch must have valid NAFDAC number, manufacturing date, and expiry date. Audit batch records for completeness.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Verify batch compliance',
      nigeriaNote: 'NAFDAC audit can close non-compliant warehouses'
    },
    {
      id: 'wh-audit-3',
      stepNumber: 3,
      title: 'Expiry Management',
      description: 'Review expiring and expired stock',
      narrative: 'How much stock is expiring soon? Has expired stock been quarantined? FEFO allocation logs show if oldest stock moved first.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Audit expiry management',
      nigeriaNote: 'Expired pharmaceutical disposal requires NAFDAC witness'
    },
    {
      id: 'wh-audit-4',
      stepNumber: 4,
      title: 'Movement Trail',
      description: 'Trace any product\'s journey',
      narrative: 'Pick any batch and see complete history — received, putaway, picked, adjusted. Full audit trail with timestamps and operators.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Trace movement history',
      nigeriaNote: 'Full traceability required for pharmaceutical recalls'
    },
    {
      id: 'wh-audit-5',
      stepNumber: 5,
      title: 'Variance Analysis',
      description: 'Review inventory adjustments',
      narrative: 'Why was inventory adjusted? Damage? Theft? Short-ship? Every adjustment has a reason code and approver. Pattern analysis reveals issues.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Analyze inventory variances',
      nigeriaNote: 'Shrinkage control critical for high-value pharma'
    },
    {
      id: 'wh-audit-6',
      stepNumber: 6,
      title: 'Commerce Boundary Check',
      description: 'Verify inventory vs. financial records',
      narrative: 'Warehouse tracks physical inventory. Commerce tracks value and ownership. Audit the boundary — quantity facts flow to Commerce for valuation.',
      suite: 'Advanced Warehouse',
      route: '/warehouse-demo',
      actionHint: 'Verify Commerce boundary',
      nigeriaNote: 'Inventory valuation handled by Commerce Suite'
    }
  ]
}

// ============================================================================
// STORYLINE 39: PARK ADMINISTRATOR (PARKHUB SUITE)
// ============================================================================

export const parkAdminStoryline: Storyline = {
  id: 'parkAdmin',
  name: 'Park Administrator',
  description: 'Manage transport companies, set commissions, view park analytics',
  persona: 'Motor Park Owner, Park Manager, or Terminal Administrator',
  durationMinutes: 12,
  suites: ['ParkHub'],
  steps: [
    {
      id: 'ph-admin-1',
      stepNumber: 1,
      title: 'Park Dashboard',
      description: 'View park operations at a glance',
      narrative: 'Your dashboard shows all transport companies operating from Jibowu Motor Park. View today\'s tickets, revenue, active trips, and pending approvals.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View park dashboard',
      nigeriaNote: 'Jibowu is one of Lagos\' busiest motor parks'
    },
    {
      id: 'ph-admin-2',
      stepNumber: 2,
      title: 'Transport Companies',
      description: 'Manage operators in your park',
      narrative: 'ABC Transport, Peace Mass Transit, GUO Transport — see all operators. Approve new companies, suspend non-compliant ones, adjust commission rates.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View transport companies',
      nigeriaNote: 'Major Nigerian transport companies operate nationwide'
    },
    {
      id: 'ph-admin-3',
      stepNumber: 3,
      title: 'Commission Management',
      description: 'Configure park-level commission',
      narrative: 'Set commission rates per company or park-wide. Standard 10% commission on ticket sales. View commission earnings and settlement history.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Manage commissions',
      nigeriaNote: 'Commission is the primary revenue model for motor parks'
    },
    {
      id: 'ph-admin-4',
      stepNumber: 4,
      title: 'Active Trips',
      description: 'Monitor trips in real-time',
      narrative: 'See which trips are boarding, departed, or in transit. Track passenger counts, driver assignments, and estimated arrivals.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Monitor active trips',
      nigeriaNote: 'Real-time tracking improves passenger confidence'
    },
    {
      id: 'ph-admin-5',
      stepNumber: 5,
      title: 'Revenue Analytics',
      description: 'View park financial performance',
      narrative: 'Today\'s revenue, weekly trends, top-performing routes, commission breakdown by company. Data-driven decisions for park operations.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View revenue analytics',
      nigeriaNote: 'Analytics help optimize park operations'
    },
    {
      id: 'ph-admin-6',
      stepNumber: 6,
      title: 'MVM Architecture',
      description: 'Understand the platform architecture',
      narrative: 'ParkHub is a configuration of MVM (Multi-Vendor Marketplace). Transport companies are vendors, routes are products, tickets are orders. No new database tables needed.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'See MVM architecture',
      nigeriaNote: 'Capability composition reduces complexity'
    }
  ]
}

// ============================================================================
// STORYLINE 40: TRANSPORT OPERATOR (PARKHUB SUITE)
// ============================================================================

export const operatorStoryline: Storyline = {
  id: 'operator',
  name: 'Transport Operator',
  description: 'Manage routes, drivers, view tickets and earnings',
  persona: 'Transport Company Owner, Fleet Manager, or Operations Manager',
  durationMinutes: 10,
  suites: ['ParkHub'],
  steps: [
    {
      id: 'ph-op-1',
      stepNumber: 1,
      title: 'Operator Dashboard',
      description: 'View your company operations',
      narrative: 'ABC Transport dashboard: 8 routes, 15 drivers, 45 tickets today, ₦202,500 revenue. Commission paid: ₦20,250 (10%).',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View operator dashboard',
      nigeriaNote: 'ABC Transport is a leading Nigerian transport company'
    },
    {
      id: 'ph-op-2',
      stepNumber: 2,
      title: 'Route Management',
      description: 'Manage your routes and schedules',
      narrative: 'Lagos-Abuja Express at 06:00 (₦15,000), Lagos-Ibadan at 07:30 (₦4,500). Add new routes, adjust prices, set departure times.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Manage routes',
      nigeriaNote: 'Lagos-Abuja is the busiest interstate route'
    },
    {
      id: 'ph-op-3',
      stepNumber: 3,
      title: 'Driver Management',
      description: 'Manage your driver fleet',
      narrative: 'Chukwu Emmanuel, Adebayo Kunle — your drivers. View license status, trip history, performance ratings. Assign drivers to upcoming trips.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Manage drivers',
      nigeriaNote: 'Driver licensing is strictly regulated in Nigeria'
    },
    {
      id: 'ph-op-4',
      stepNumber: 4,
      title: 'Today\'s Trips',
      description: 'Monitor your active trips',
      narrative: 'Lagos-Abuja: IN_TRANSIT (65% complete), Lagos-Ibadan: BOARDING (8/14 passengers). Real-time status from your drivers.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Monitor trips',
      nigeriaNote: 'Trip tracking builds passenger trust'
    },
    {
      id: 'ph-op-5',
      stepNumber: 5,
      title: 'Ticket Sales',
      description: 'View your ticket sales',
      narrative: 'See all tickets sold for your routes. Online bookings vs. walk-in sales. Track seat availability per departure.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View ticket sales',
      nigeriaNote: 'Mix of online and walk-in bookings is typical'
    },
    {
      id: 'ph-op-6',
      stepNumber: 6,
      title: 'Earnings & Settlement',
      description: 'View your earnings after commission',
      narrative: 'Gross revenue: ₦202,500. Park commission (10%): ₦20,250. Net earnings: ₦182,250. View settlement history and pending payouts.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View earnings',
      nigeriaNote: 'Transparent commission builds operator trust'
    }
  ]
}

// ============================================================================
// STORYLINE 41: PARK AGENT / POS (PARKHUB SUITE)
// ============================================================================

export const parkAgentStoryline: Storyline = {
  id: 'parkAgent',
  name: 'Park Agent (POS)',
  description: 'Sell tickets at counter, process walk-in passengers',
  persona: 'Park Ticket Agent, Counter Staff, or Booking Clerk',
  durationMinutes: 8,
  suites: ['ParkHub'],
  steps: [
    {
      id: 'ph-agent-1',
      stepNumber: 1,
      title: 'POS Interface',
      description: 'Quick ticket sales interface',
      narrative: 'Grid of available routes with prices and seat counts. Tap to add to cart. Designed for speed — handle peak hour rush.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View POS interface',
      nigeriaNote: 'Peak hours at motor parks are intense'
    },
    {
      id: 'ph-agent-2',
      stepNumber: 2,
      title: 'Select Route',
      description: 'Add tickets to cart',
      narrative: 'Lagos → Abuja (₦15,000, 12 seats available). Tap to add. Multiple passengers? Add quantity. Cross-company booking supported.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Select route',
      nigeriaNote: 'Agents often book for entire families'
    },
    {
      id: 'ph-agent-3',
      stepNumber: 3,
      title: 'Passenger Details',
      description: 'Capture passenger information',
      narrative: 'Name and phone number (optional but recommended). For manifest and emergency contact. Quick entry for walk-in passengers.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Enter passenger details',
      nigeriaNote: 'Passenger manifests are security requirements'
    },
    {
      id: 'ph-agent-4',
      stepNumber: 4,
      title: 'Payment',
      description: 'Process payment',
      narrative: 'Cash, card, bank transfer, or USSD. Cash is most common at motor parks. Confirm payment before issuing ticket.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Process payment',
      nigeriaNote: 'Cash still dominates at Nigerian motor parks'
    },
    {
      id: 'ph-agent-5',
      stepNumber: 5,
      title: 'Issue Ticket',
      description: 'Complete sale and print ticket',
      narrative: 'Ticket #TKT-001 issued. Seat A3 assigned. Print ticket or send to passenger\'s phone. Next customer!',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Issue ticket',
      nigeriaNote: 'SMS tickets reduce paper and fraud'
    },
    {
      id: 'ph-agent-6',
      stepNumber: 6,
      title: 'Offline Mode',
      description: 'Continue selling when offline',
      narrative: 'Network down? POS keeps working. Tickets queue for sync. No lost sales. Commission calculated when reconnected.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'See offline capability',
      nigeriaNote: 'Offline-first is essential for Nigerian infrastructure'
    }
  ]
}

// ============================================================================
// STORYLINE 42: PASSENGER (PARKHUB SUITE)
// ============================================================================

export const passengerStoryline: Storyline = {
  id: 'passenger',
  name: 'Passenger',
  description: 'Search routes, book tickets, track your trip',
  persona: 'Traveler, Commuter, or Long-Distance Passenger',
  durationMinutes: 8,
  suites: ['ParkHub'],
  steps: [
    {
      id: 'ph-pax-1',
      stepNumber: 1,
      title: 'Search Routes',
      description: 'Find available trips',
      narrative: 'Lagos to Abuja, tomorrow. Search shows all transport companies operating that route. Compare prices, departure times, bus types.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Search routes',
      nigeriaNote: 'Passengers compare across multiple companies'
    },
    {
      id: 'ph-pax-2',
      stepNumber: 2,
      title: 'Compare Options',
      description: 'Choose the best option',
      narrative: 'ABC Transport: LUXURY, ₦15,000, AC/WiFi/TV. Peace Mass: STANDARD, ₦12,000, AC only. GUO: ECONOMY, ₦10,000. Your choice.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Compare options',
      nigeriaNote: 'Bus types and amenities vary significantly'
    },
    {
      id: 'ph-pax-3',
      stepNumber: 3,
      title: 'Select Seat',
      description: 'Choose your preferred seat',
      narrative: 'View bus layout. Window or aisle? Front or back? Select your preferred seat. Seat A3 — confirmed.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Select seat',
      nigeriaNote: 'Seat selection is a premium feature'
    },
    {
      id: 'ph-pax-4',
      stepNumber: 4,
      title: 'Book & Pay',
      description: 'Complete your booking',
      narrative: 'Enter your details. Pay with card, transfer, or reserve for cash at park. Receive ticket confirmation instantly.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Book ticket',
      nigeriaNote: 'Online booking growing rapidly in Nigeria'
    },
    {
      id: 'ph-pax-5',
      stepNumber: 5,
      title: 'Receive Ticket',
      description: 'Get your digital ticket',
      narrative: 'Ticket #TKT-001 sent to your phone. QR code for boarding. Show at the park or share with someone picking up.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'View ticket',
      nigeriaNote: 'Digital tickets reduce fraud and queues'
    },
    {
      id: 'ph-pax-6',
      stepNumber: 6,
      title: 'Track Trip',
      description: 'Monitor your journey',
      narrative: 'Trip departed! Track in real-time. See progress on map. ETA updates as you travel. Share location with family.',
      suite: 'ParkHub',
      route: '/parkhub-demo',
      actionHint: 'Track trip',
      nigeriaNote: 'Trip tracking provides peace of mind for families'
    }
  ]
}

// ============================================================================
// STORYLINE 43: POLITICAL CANDIDATE (POLITICAL SUITE)
// ============================================================================

export const politicalCandidateStoryline: Storyline = {
  id: 'politicalCandidate',
  name: 'Candidate Journey',
  description: 'Campaign setup, messaging, volunteer coordination, fundraising facts',
  persona: 'Political Candidate, Aspirant, or Elected Official',
  durationMinutes: 12,
  suites: ['Political'],
  steps: [
    {
      id: 'pol-cand-1',
      stepNumber: 1,
      title: 'Campaign Dashboard',
      description: 'View your campaign at a glance',
      narrative: 'Your campaign for Lagos State House of Assembly, Surulere I. See registered volunteers, upcoming events, manifesto versions, and constituent petitions.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View campaign dashboard',
      nigeriaNote: 'State Assembly campaigns focus on constituency-level issues'
    },
    {
      id: 'pol-cand-2',
      stepNumber: 2,
      title: 'Party Context',
      description: 'Understand your party structure',
      narrative: 'Progressive People\'s Party (PPP) — from National Executive down to Ward 03 Unit. Your primary victory with 62.4% of votes establishes your mandate.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View party structure',
      nigeriaNote: 'Nigerian parties have hierarchical structures: National → State → LGA → Ward'
    },
    {
      id: 'pol-cand-3',
      stepNumber: 3,
      title: 'Campaign Events',
      description: 'Plan and track outreach',
      narrative: 'Town halls in Aguda, youth engagement forums, market women outreach. Track attendance, plan logistics, measure impact across wards.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View campaign events',
      nigeriaNote: 'Grassroots events are critical for Nigerian elections'
    },
    {
      id: 'pol-cand-4',
      stepNumber: 4,
      title: 'Volunteer Coordination',
      description: 'Manage your field team',
      narrative: '847 registered volunteers across wards. Ward coordinators, canvassers, youth mobilizers. Track assignments, activities, and performance.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View volunteer roster',
      nigeriaNote: 'Ward-level volunteers are the backbone of Nigerian campaigns'
    },
    {
      id: 'pol-cand-5',
      stepNumber: 5,
      title: 'Fundraising Facts',
      description: 'View donation and expense records (FACTS ONLY)',
      narrative: 'Donation facts from party members, business owners, and events. Expense facts for materials, logistics, and media. All disclosed, all compliant.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View fundraising facts',
      nigeriaNote: 'Campaign finance disclosure is mandatory under Electoral Act 2022'
    },
    {
      id: 'pol-cand-6',
      stepNumber: 6,
      title: 'Constituency Engagement',
      description: 'Connect with citizens post-election',
      narrative: 'Town halls, citizen petitions, project promises. Road rehabilitation requests, street light installations — track and respond to constituent needs.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View citizen engagement',
      nigeriaNote: 'Post-election engagement builds trust for re-election'
    },
    {
      id: 'pol-cand-7',
      stepNumber: 7,
      title: 'Commerce Boundary',
      description: 'Understand facts vs. financials',
      narrative: 'Political Suite records facts — donations, expenses, disclosures. Commerce handles payments, VAT, accounting. Clean boundary, compliant design.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'See Commerce boundary',
      nigeriaNote: 'Separation ensures regulatory compliance'
    }
  ]
}

// ============================================================================
// STORYLINE 44: PARTY OFFICIAL (POLITICAL SUITE)
// ============================================================================

export const partyOfficialStoryline: Storyline = {
  id: 'partyOfficial',
  name: 'Party Official Workflow',
  description: 'Membership, primaries, campaign oversight, disclosures',
  persona: 'Party Chairman, Secretary, or Electoral Committee Member',
  durationMinutes: 10,
  suites: ['Political'],
  steps: [
    {
      id: 'pol-party-1',
      stepNumber: 1,
      title: 'Party Structure',
      description: 'View your party hierarchy',
      narrative: 'PPP Surulere LGA Chapter — 8 officials, 2,340 members. See National, State, LGA, and Ward units. Your role in the party structure.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View party structure',
      nigeriaNote: 'Nigerian parties have constitutionally defined structures'
    },
    {
      id: 'pol-party-2',
      stepNumber: 2,
      title: 'Membership Registry',
      description: 'Manage party members',
      narrative: 'View members by ward, track dues status (facts only), manage registrations. 312 members in Ward 03 alone.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View membership',
      nigeriaNote: 'Membership registration drives are key party activities'
    },
    {
      id: 'pol-party-3',
      stepNumber: 3,
      title: 'Primary Elections',
      description: 'Conduct and certify primaries',
      narrative: 'PPP Primary Election for Surulere I — 1,999 votes cast, 85.4% turnout. Akinwale Adeyemi won with 62.4%. Results are append-only and certified.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View primary results',
      nigeriaNote: 'Primary elections are INEC-monitored under Electoral Act 2022'
    },
    {
      id: 'pol-party-4',
      stepNumber: 4,
      title: 'Campaign Oversight',
      description: 'Monitor campaign activities',
      narrative: 'Track all campaign events, volunteer activities, and expenditure facts. Ensure compliance with party guidelines and electoral law.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View campaign oversight',
      nigeriaNote: 'Party officials oversee candidate compliance'
    },
    {
      id: 'pol-party-5',
      stepNumber: 5,
      title: 'Disclosures & Compliance',
      description: 'Review financial disclosures',
      narrative: 'All donation and expense facts are disclosed. Campaign finance limits enforced. Ready for INEC audit at any time.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View disclosures',
      nigeriaNote: 'INEC requires campaign finance disclosure within 6 months'
    },
    {
      id: 'pol-party-6',
      stepNumber: 6,
      title: 'Audit Trail',
      description: 'View immutable party records',
      narrative: 'Every action logged — primary results, membership changes, financial disclosures. Append-only, court-ready evidence if needed.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View audit trail',
      nigeriaNote: 'Election petitions require documentary evidence'
    }
  ]
}

// ============================================================================
// STORYLINE 45: POLITICAL VOLUNTEER (POLITICAL SUITE)
// ============================================================================

export const politicalVolunteerStoryline: Storyline = {
  id: 'politicalVolunteer',
  name: 'Volunteer / Field Agent',
  description: 'Assignment, offline capture, activity logs, escalation',
  persona: 'Campaign Volunteer, Ward Coordinator, or Canvasser',
  durationMinutes: 8,
  suites: ['Political'],
  steps: [
    {
      id: 'pol-vol-1',
      stepNumber: 1,
      title: 'Your Assignment',
      description: 'View your ward and role',
      narrative: 'Ward Coordinator for Ward 03, Surulere LGA. Your team: 4 canvassers, 2 youth mobilizers. 12 activities logged this week.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View your assignment',
      nigeriaNote: 'Ward-level coordination is essential for grassroots campaigns'
    },
    {
      id: 'pol-vol-2',
      stepNumber: 2,
      title: 'Field Operations',
      description: 'Plan and execute outreach',
      narrative: 'Door-to-door canvassing, market visits, community meetings. Log each interaction, capture feedback, identify supporters.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View field operations',
      nigeriaNote: 'Personal contact drives voter turnout in Nigeria'
    },
    {
      id: 'pol-vol-3',
      stepNumber: 3,
      title: 'Offline Capture',
      description: 'Work without network',
      narrative: 'Network down? Keep logging activities. Data queues locally and syncs when connectivity returns. No lost work.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'See offline capability',
      nigeriaNote: 'Offline-first is essential for Nigerian field operations'
    },
    {
      id: 'pol-vol-4',
      stepNumber: 4,
      title: 'Activity Logs',
      description: 'Track your contributions',
      narrative: 'Every visit, every conversation, every event attendance logged. Your activity count visible to campaign leadership.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View activity logs',
      nigeriaNote: 'Activity tracking enables volunteer recognition'
    },
    {
      id: 'pol-vol-5',
      stepNumber: 5,
      title: 'Issue Escalation',
      description: 'Report concerns upward',
      narrative: 'Opposition activity? Community concern? Security issue? Escalate to ward coordinator or campaign manager immediately.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'Escalate issue',
      nigeriaNote: 'Real-time escalation improves campaign responsiveness'
    },
    {
      id: 'pol-vol-6',
      stepNumber: 6,
      title: 'Event Support',
      description: 'Assist at campaign events',
      narrative: 'Town Hall Meeting - Aguda: 245 attendees. Your role: registration desk. Log attendance, distribute materials, gather feedback.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View event support',
      nigeriaNote: 'Volunteers are the face of the campaign at events'
    }
  ]
}

// ============================================================================
// STORYLINE 46: POLITICAL REGULATOR / OBSERVER (POLITICAL SUITE)
// ============================================================================

export const politicalRegulatorStoryline: Storyline = {
  id: 'politicalRegulator',
  name: 'Regulator / Observer',
  description: 'Read-only access, audits, disclosures, evidence export',
  persona: 'INEC Official, Election Observer, or Compliance Auditor',
  durationMinutes: 8,
  suites: ['Political'],
  steps: [
    {
      id: 'pol-reg-1',
      stepNumber: 1,
      title: 'Audit Dashboard',
      description: 'Read-only oversight view',
      narrative: 'As a regulator or observer, you have read-only access to all disclosed political records. No write access, no interference.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View audit dashboard',
      nigeriaNote: 'INEC monitors party and campaign activities'
    },
    {
      id: 'pol-reg-2',
      stepNumber: 2,
      title: 'Financial Disclosures',
      description: 'Review campaign finance facts',
      narrative: 'All donation facts, expense facts, and disclosure timelines visible. Verify compliance with campaign finance limits.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View financial disclosures',
      nigeriaNote: 'Electoral Act 2022 sets campaign spending limits'
    },
    {
      id: 'pol-reg-3',
      stepNumber: 3,
      title: 'Primary Results',
      description: 'Verify election records',
      narrative: 'PPP Primary Election results: 1,999 votes, 85.4% turnout. Append-only records cannot be altered after certification.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'Verify primary results',
      nigeriaNote: 'Primary results are submitted to INEC'
    },
    {
      id: 'pol-reg-4',
      stepNumber: 4,
      title: 'Audit Logs',
      description: 'Review immutable action trail',
      narrative: 'Every donation recorded, every volunteer assigned, every manifesto published — timestamped and actor-attributed. Immutable by design.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'View audit logs',
      nigeriaNote: 'Audit trails support election petition evidence'
    },
    {
      id: 'pol-reg-5',
      stepNumber: 5,
      title: 'Evidence Export',
      description: 'Generate court-ready bundles',
      narrative: 'Export evidence bundles for tribunals or investigations. Cryptographically signed, tamper-evident, chain-of-custody preserved.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'Export evidence',
      nigeriaNote: 'Election tribunals require documentary evidence'
    },
    {
      id: 'pol-reg-6',
      stepNumber: 6,
      title: 'Compliance Report',
      description: 'Generate compliance summary',
      narrative: 'Campaign finance compliance: ✅. Disclosure timelines: ✅. Primary conduct: ✅. Ready for regulatory review.',
      suite: 'Political',
      route: '/political-demo',
      actionHint: 'Generate report',
      nigeriaNote: 'Post-election compliance reports are mandatory'
    }
  ]
}

// ============================================================================
// CHURCH SUITE STORYLINES (4 Storylines, 26 Total Steps)
// ============================================================================

// Storyline 47: Senior Pastor Journey
export const churchPastorStoryline: Storyline = {
  id: 'churchPastor',
  name: 'Senior Pastor Journey',
  description: 'Church overview, leadership, governance, and pastoral oversight',
  persona: 'Senior Pastor / Lead Minister',
  durationMinutes: 10,
  suites: ['Church'],
  steps: [
    {
      id: 'chu-pastor-1',
      stepNumber: 1,
      title: 'Church Overview',
      description: 'Your church at a glance',
      narrative: 'Good morning, Pastor. GraceLife Community Church has 2,847 members across 48 cell groups. 14 ministries are actively serving.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View church dashboard',
      nigeriaNote: 'Multi-parish churches need consolidated views'
    },
    {
      id: 'chu-pastor-2',
      stepNumber: 2,
      title: 'Church Structure',
      description: 'Hierarchy and jurisdictions',
      narrative: 'Your church spans Lagos Mainland Diocese with 2 parishes and 48 cell groups. Leadership is structured Church → Diocese → Parish → Cell.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View hierarchy',
      nigeriaNote: 'Nigerian mega-churches often have complex multi-level structures'
    },
    {
      id: 'chu-pastor-3',
      stepNumber: 3,
      title: 'Ministry Overview',
      description: 'Active departments and leadership',
      narrative: '14 active ministries, 312 volunteers. Choir has 65 members, Youth Ministry 234. Each has appointed heads with clear accountability.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Review ministries',
      nigeriaNote: 'Ministry heads report to pastoral leadership'
    },
    {
      id: 'chu-pastor-4',
      stepNumber: 4,
      title: 'Attendance Trends',
      description: 'Service participation',
      narrative: 'Sunday Second Service averages 890 attendance. Total weekly reach: 1,850. New converts this year: 127.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View trends',
      nigeriaNote: 'Multiple Sunday services are common in Nigerian churches'
    },
    {
      id: 'chu-pastor-5',
      stepNumber: 5,
      title: 'Pastoral Care',
      description: 'Confidential pastoral oversight',
      narrative: '⚠️ Pastoral notes are encrypted, access-logged, and never searchable. Only you and authorized pastors can access. No data shown in demo.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Pastoral confidentiality',
      nigeriaNote: 'Pastoral confidence is sacred and protected'
    },
    {
      id: 'chu-pastor-6',
      stepNumber: 6,
      title: 'Governance',
      description: 'Board resolutions and decisions',
      narrative: 'Board resolutions are append-only. Leadership changes are logged with full audit trail. Governance is transparent and accountable.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View governance',
      nigeriaNote: 'Trustee and board decisions require documentation'
    },
    {
      id: 'chu-pastor-7',
      stepNumber: 7,
      title: 'Financial Oversight',
      description: 'Giving facts and transparency',
      narrative: '⚠️ FACTS ONLY: You see giving patterns, not amounts. Commerce Suite handles all payments. No wallets, no receipts here.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View giving facts',
      nigeriaNote: 'Financial stewardship requires transparency'
    }
  ]
}

// Storyline 48: Church Administrator Workflow
export const churchAdminStoryline: Storyline = {
  id: 'churchAdmin',
  name: 'Church Administrator Workflow',
  description: 'Day-to-day church operations and reporting',
  persona: 'Church Admin / Secretary',
  durationMinutes: 10,
  suites: ['Church'],
  steps: [
    {
      id: 'chu-admin-1',
      stepNumber: 1,
      title: 'Member Registry',
      description: 'Membership management',
      narrative: 'Today\'s task: Register 3 new converts from Sunday\'s altar call. Member lifecycle: Visitor → New Convert → Member → Worker.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Register members',
      nigeriaNote: 'New converts need follow-up and discipleship'
    },
    {
      id: 'chu-admin-2',
      stepNumber: 2,
      title: 'Service Schedule',
      description: 'Weekly service management',
      narrative: '8 weekly services configured. Sunday First Service starts 7:00 AM. Midweek Service Wednesday 6:00 PM. Vigil Friday 10:00 PM.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Manage services',
      nigeriaNote: 'Nigerian churches often have multiple Sunday services'
    },
    {
      id: 'chu-admin-3',
      stepNumber: 3,
      title: 'Event Management',
      description: 'Programs and special events',
      narrative: 'Upcoming: Annual Thanksgiving (Jan 26), Youth Camp (Feb 14-16), Easter Convention (Apr 18-20). Registrations tracked.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Manage events',
      nigeriaNote: 'Special programs drive church engagement'
    },
    {
      id: 'chu-admin-4',
      stepNumber: 4,
      title: 'Attendance Logging',
      description: 'Service attendance records',
      narrative: 'Log attendance for each service. Aggregate stats auto-calculated. Cell group attendance also tracked for pastoral care.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Log attendance',
      nigeriaNote: 'Attendance tracking helps identify pastoral needs'
    },
    {
      id: 'chu-admin-5',
      stepNumber: 5,
      title: 'Giving Facts',
      description: 'Record giving declarations',
      narrative: '⚠️ FACTS ONLY: Record tithe, offering, seed facts. No amounts displayed. Commerce Suite handles actual collection.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Record giving',
      nigeriaNote: 'Cash-heavy giving reality requires careful tracking'
    },
    {
      id: 'chu-admin-6',
      stepNumber: 6,
      title: 'Expense Facts',
      description: 'Approved spending records',
      narrative: 'Record approved expenses: Sound equipment maintenance, Youth Camp deposit, Welfare support. All facts are append-only.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Record expenses',
      nigeriaNote: 'Financial accountability is essential'
    },
    {
      id: 'chu-admin-7',
      stepNumber: 7,
      title: 'Reports',
      description: 'Generate church reports',
      narrative: 'Membership reports, attendance summaries, ministry activity. Audit trail exportable for trustees and auditors.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Generate reports',
      nigeriaNote: 'CAC/NGO compliance may require regular reporting'
    }
  ]
}

// Storyline 49: Ministry Leader Operations
export const ministryLeaderStoryline: Storyline = {
  id: 'ministryLeader',
  name: 'Ministry Leader Operations',
  description: 'Department management and volunteer coordination',
  persona: 'Ministry Head / Volunteer Lead',
  durationMinutes: 8,
  suites: ['Church'],
  steps: [
    {
      id: 'chu-ministry-1',
      stepNumber: 1,
      title: 'Ministry Dashboard',
      description: 'Your department at a glance',
      narrative: 'Welcome, Choir Director. Your ministry has 65 members, 12 active volunteers this Sunday. Rehearsal scheduled Thursday 5 PM.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View ministry',
      nigeriaNote: 'Ministry heads coordinate department activities'
    },
    {
      id: 'chu-ministry-2',
      stepNumber: 2,
      title: 'Member Assignment',
      description: 'Manage ministry membership',
      narrative: 'Assign members to your ministry. Track training status. Certification records for specialized roles.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Manage members',
      nigeriaNote: 'Some ministries require specific training'
    },
    {
      id: 'chu-ministry-3',
      stepNumber: 3,
      title: 'Volunteer Roster',
      description: 'Schedule volunteer shifts',
      narrative: 'Create duty roster for Sunday services. Assign choir members to First, Second, Third services. Track attendance.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Schedule volunteers',
      nigeriaNote: 'Volunteer scheduling prevents burnout'
    },
    {
      id: 'chu-ministry-4',
      stepNumber: 4,
      title: 'Event Support',
      description: 'Ministry involvement in events',
      narrative: 'Youth Camp needs choir support. 8 members assigned. Transportation coordinated. Practice sessions scheduled.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Coordinate events',
      nigeriaNote: 'Cross-ministry coordination is common'
    },
    {
      id: 'chu-ministry-5',
      stepNumber: 5,
      title: 'Attendance Tracking',
      description: 'Ministry meeting attendance',
      narrative: 'Log rehearsal attendance. Track member participation. Identify members needing follow-up.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Track attendance',
      nigeriaNote: 'Consistent participation indicates engagement'
    },
    {
      id: 'chu-ministry-6',
      stepNumber: 6,
      title: 'Reports',
      description: 'Ministry activity reports',
      narrative: 'Generate ministry reports for pastoral leadership. Activity summary, volunteer hours, event participation.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'Generate reports',
      nigeriaNote: 'Ministry accountability to leadership'
    }
  ]
}

// Storyline 50: Member Experience
export const churchMemberStoryline: Storyline = {
  id: 'churchMember',
  name: 'Member Experience',
  description: 'Church member journey and engagement',
  persona: 'Church Member / Attendee',
  durationMinutes: 8,
  suites: ['Church'],
  steps: [
    {
      id: 'chu-member-1',
      stepNumber: 1,
      title: 'My Church',
      description: 'Your church home',
      narrative: 'Welcome to GraceLife Community Church. You\'re a member of Ikeja Central Parish, Harmony Cell group.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View profile',
      nigeriaNote: 'Cell groups provide pastoral care'
    },
    {
      id: 'chu-member-2',
      stepNumber: 2,
      title: 'Service Schedule',
      description: 'Upcoming services',
      narrative: 'Sunday services at 7:00 AM, 9:30 AM, 12:00 PM. Midweek Wednesday 6:00 PM. Choose your preferred service time.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View schedule',
      nigeriaNote: 'Multiple service options accommodate busy schedules'
    },
    {
      id: 'chu-member-3',
      stepNumber: 3,
      title: 'Cell Group',
      description: 'Fellowship and care',
      narrative: 'Harmony Cell meets Fridays at 6 PM. 24 members, including your family. Cell leader: Brother Emeka.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View cell group',
      nigeriaNote: 'Cell groups are the heartbeat of pastoral care'
    },
    {
      id: 'chu-member-4',
      stepNumber: 4,
      title: 'Giving',
      description: 'Your giving journey',
      narrative: '⚠️ FACTS ONLY: Your giving declarations are recorded. No amounts shown. Commerce Suite handles actual transactions.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View giving',
      nigeriaNote: 'Tithes and offerings are acts of worship'
    },
    {
      id: 'chu-member-5',
      stepNumber: 5,
      title: 'Events',
      description: 'Church programs',
      narrative: 'Upcoming: Annual Thanksgiving Jan 26. Youth Camp Feb 14-16 (your children can register). Easter Convention Apr 18-20.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View events',
      nigeriaNote: 'Church programs build community'
    },
    {
      id: 'chu-member-6',
      stepNumber: 6,
      title: 'Announcements',
      description: 'Stay informed',
      narrative: 'Latest announcements from Pastor Emmanuel. Service time changes, special prayers, community updates.',
      suite: 'Church',
      route: '/church-demo',
      actionHint: 'View announcements',
      nigeriaNote: 'Communication keeps the church family connected'
    }
  ]
}

// ============================================================================
// STORYLINE REGISTRY
// ============================================================================

export const storylines: Record<StorylineId, Storyline> = {
  retail: retailStoryline,
  marketplace: marketplaceStoryline,
  sme: smeStoryline,
  full: fullTourStoryline,
  cfo: cfoFinanceStoryline,
  regulator: regulatorAuditorStoryline,
  school: schoolOwnerStoryline,
  parent: parentGuardianStoryline,
  // Health Suite Storylines
  clinic: clinicOwnerStoryline,
  patient: healthPatientStoryline,
  healthRegulator: healthRegulatorStoryline,
  // Hospitality Suite Storylines
  hotelOwner: hotelOwnerStoryline,
  restaurantManager: restaurantManagerStoryline,
  hospitalityGuest: hospitalityGuestStoryline,
  // Civic / GovTech Suite Storylines
  civicCitizen: civicCitizenStoryline,
  civicAgencyStaff: civicAgencyStaffStoryline,
  civicRegulator: civicRegulatorStoryline,
  civicAuditor: civicAuditorStoryline,
  // Logistics Suite Storylines
  logisticsDispatcher: logisticsDispatcherStoryline,
  logisticsDriver: logisticsDriverStoryline,
  logisticsMerchant: logisticsMerchantStoryline,
  logisticsAuditor: logisticsAuditorStoryline,
  // Real Estate Suite Storylines
  propertyOwner: propertyOwnerStoryline,
  propertyManager: propertyManagerStoryline,
  tenant: tenantStoryline,
  realEstateAuditor: realEstateAuditorStoryline,
  // Project Management Suite Storylines
  projectOwner: projectOwnerStoryline,
  projectManager: projectManagerStoryline,
  teamMember: teamMemberStoryline,
  projectAuditor: projectAuditorStoryline,
  // Recruitment Suite Storylines
  recruiter: recruiterStoryline,
  hiringManager: hiringManagerStoryline,
  candidate: candidateStoryline,
  recruitmentAuditor: recruitmentAuditorStoryline,
  // Legal Practice Suite Storylines
  legalClient: legalClientStoryline,
  lawyer: lawyerStoryline,
  firmAdmin: firmAdminStoryline,
  legalAuditor: legalAuditorStoryline,
  // Advanced Warehouse Suite Storylines
  warehouseManager: warehouseManagerStoryline,
  receivingClerk: receivingClerkStoryline,
  picker: pickerStoryline,
  warehouseAuditor: warehouseAuditorStoryline,
  // ParkHub (Transport) Suite Storylines
  parkAdmin: parkAdminStoryline,
  operator: operatorStoryline,
  parkAgent: parkAgentStoryline,
  passenger: passengerStoryline,
  // Political Suite Storylines
  politicalCandidate: politicalCandidateStoryline,
  partyOfficial: partyOfficialStoryline,
  politicalVolunteer: politicalVolunteerStoryline,
  politicalRegulator: politicalRegulatorStoryline,
  // Church Suite Storylines
  churchPastor: churchPastorStoryline,
  churchAdmin: churchAdminStoryline,
  ministryLeader: ministryLeaderStoryline,
  churchMember: churchMemberStoryline
}

export function getStoryline(id: StorylineId): Storyline | null {
  return storylines[id] || null
}

export function getStorylineList(): Storyline[] {
  return Object.values(storylines)
}
