/**
 * Suite Deep-Dive Page Template
 * 
 * STRICT TEMPLATE — No custom storytelling.
 * Consistency = Trust.
 * 
 * Every suite page follows the same structure:
 * 1. What this suite governs
 * 2. Who it's for
 * 3. What is LIVE vs DEMO vs PLANNED
 * 4. Commerce Boundary callout
 * 5. Governance & audit posture
 * 6. Link to demo
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, ArrowRight, Lock, Shield, Wallet, Eye,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck,
  Building, Briefcase, FolderKanban, Scale, Warehouse, Car,
  Vote, Church, Check, X, Clock
} from 'lucide-react'

// Suite data — single source of truth
const suiteData: Record<string, {
  name: string
  tagline: string
  icon: any
  color: string
  demo: string
  governs: string
  audience: string[]
  capabilities: { name: string; status: 'LIVE' | 'DEMO' | 'PLANNED' }[]
  commerceBoundary: { emits: string[]; doesNot: string[] }
  governancePosture: { safeguards: string[]; auditFeatures: string[] }
  nigeriaContext: string[]
}> = {
  'commerce': {
    name: 'Commerce Suite',
    tagline: 'The constitutional foundation',
    icon: Store,
    color: 'emerald',
    demo: '/commerce-demo',
    governs: 'All financial execution across the platform. Commerce is the ONLY suite that touches money. Every other vertical emits facts that Commerce processes.',
    audience: ['Retail businesses', 'Wholesalers', 'Marketplaces', 'E-commerce operators', 'POS vendors'],
    capabilities: [
      { name: 'Point of Sale (POS)', status: 'LIVE' },
      { name: 'Inventory Management', status: 'LIVE' },
      { name: 'Payment Processing', status: 'LIVE' },
      { name: 'Invoice & Billing', status: 'LIVE' },
      { name: 'Accounting Journals', status: 'LIVE' },
      { name: 'VAT Calculation (7.5%)', status: 'LIVE' },
      { name: 'Multi-location Support', status: 'LIVE' },
      { name: 'Customer Management', status: 'LIVE' },
      { name: 'Marketplace Operations', status: 'DEMO' },
      { name: 'B2B Wholesale', status: 'DEMO' },
    ],
    commerceBoundary: {
      emits: ['N/A — Commerce IS the execution layer'],
      doesNot: ['N/A — Commerce handles all financial execution'],
    },
    governancePosture: {
      safeguards: ['All transactions logged', 'Immutable journal entries', 'VAT audit trail', 'Receipt generation required'],
      auditFeatures: ['Transaction history (append-only)', 'Settlement reconciliation', 'Tax reporting', 'Commission tracking'],
    },
    nigeriaContext: ['NGN currency default', '7.5% VAT calculation', 'Bank transfer verification', 'POS integration', 'USSD payment support'],
  },
  'education': {
    name: 'Education Suite',
    tagline: 'Schools & training centers',
    icon: GraduationCap,
    color: 'blue',
    demo: '/education-demo',
    governs: 'Student lifecycle, academic records, fee tracking, and institutional operations. Does NOT process payments.',
    audience: ['Primary schools', 'Secondary schools', 'Universities', 'Training centers', 'Tutoring services'],
    capabilities: [
      { name: 'Student Enrollment', status: 'LIVE' },
      { name: 'Class Management', status: 'LIVE' },
      { name: 'Attendance Tracking', status: 'LIVE' },
      { name: 'Grading & Assessments', status: 'LIVE' },
      { name: 'Report Cards', status: 'LIVE' },
      { name: 'Fee Schedule Management', status: 'LIVE' },
      { name: 'Parent Portal', status: 'DEMO' },
      { name: 'Staff Management', status: 'DEMO' },
      { name: 'Timetable Scheduling', status: 'DEMO' },
      { name: 'Library Management', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Fee facts (amount owed, due date)', 'Payment status facts', 'Scholarship facts'],
      doesNot: ['Process payments', 'Generate receipts', 'Handle refunds', 'Manage wallets'],
    },
    governancePosture: {
      safeguards: ['Student data protection', 'Minor safeguards enforced', 'Guardian verification required', 'Academic records immutable'],
      auditFeatures: ['Enrollment history', 'Grade change logs', 'Attendance records', 'Fee fact audit trail'],
    },
    nigeriaContext: ['WAEC/NECO grading scales', 'Three-term academic year', 'NGN fee structures', 'State/Federal curriculum support'],
  },
  'health': {
    name: 'Health Suite',
    tagline: 'Clinics & healthcare providers',
    icon: Heart,
    color: 'red',
    demo: '/health-demo',
    governs: 'Patient records, clinical workflows, pharmacy operations, and appointment scheduling. Does NOT process payments or insurance claims.',
    audience: ['Clinics', 'Hospitals', 'Pharmacies', 'Diagnostic centers', 'Specialist practices'],
    capabilities: [
      { name: 'Patient Registration', status: 'LIVE' },
      { name: 'Appointment Scheduling', status: 'LIVE' },
      { name: 'Consultation Records', status: 'LIVE' },
      { name: 'Prescription Management', status: 'LIVE' },
      { name: 'Pharmacy Dispensing', status: 'LIVE' },
      { name: 'Inventory (Medical)', status: 'LIVE' },
      { name: 'Lab Results Integration', status: 'DEMO' },
      { name: 'HMO Integration', status: 'DEMO' },
      { name: 'Telemedicine', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Consultation charge facts', 'Prescription cost facts', 'Lab fee facts'],
      doesNot: ['Process payments', 'Handle HMO claims', 'Generate invoices', 'Manage patient wallets'],
    },
    governancePosture: {
      safeguards: ['Patient confidentiality (HIPAA-aligned)', 'Prescription audit trail', 'Controlled substance logging', 'Access control per role'],
      auditFeatures: ['Consultation history', 'Prescription logs', 'Dispensing records', 'Access audit trail'],
    },
    nigeriaContext: ['NHIS/HMO awareness', 'Nigerian drug formulary', 'NAFDAC compliance', 'State licensing requirements'],
  },
  'hospitality': {
    name: 'Hospitality Suite',
    tagline: 'Hotels, restaurants & venues',
    icon: Hotel,
    color: 'amber',
    demo: '/hospitality-demo',
    governs: 'Reservations, room management, F&B operations, and guest services. Does NOT process payments.',
    audience: ['Hotels', 'Restaurants', 'Event centers', 'Bars & lounges', 'Resorts'],
    capabilities: [
      { name: 'Room Reservations', status: 'LIVE' },
      { name: 'Room Status Management', status: 'LIVE' },
      { name: 'Guest Check-in/out', status: 'LIVE' },
      { name: 'Housekeeping Management', status: 'LIVE' },
      { name: 'F&B POS', status: 'LIVE' },
      { name: 'Guest Folio Management', status: 'LIVE' },
      { name: 'Event Booking', status: 'DEMO' },
      { name: 'Channel Manager', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Room charge facts', 'F&B charge facts', 'Service charge facts', 'Folio line items'],
      doesNot: ['Process payments', 'Generate tax invoices', 'Handle deposits', 'Manage guest wallets'],
    },
    governancePosture: {
      safeguards: ['Guest data privacy', 'Reservation integrity', 'No-show policies enforced', 'Service charge transparency'],
      auditFeatures: ['Reservation history', 'Room status logs', 'Folio audit trail', 'Housekeeping records'],
    },
    nigeriaContext: ['NGN pricing', 'Tourism levy awareness', 'Local payment methods', 'Guest registration requirements'],
  },
  'civic': {
    name: 'Civic / GovTech Suite',
    tagline: 'Associations & community organizations',
    icon: Landmark,
    color: 'purple',
    demo: '/civic-demo',
    governs: 'Constituent management, dues tracking, service delivery, and community governance. Does NOT process payments.',
    audience: ['Cooperatives', 'Trade associations', 'Alumni groups', 'Community unions', 'Local government'],
    capabilities: [
      { name: 'Constituent Registry', status: 'LIVE' },
      { name: 'Membership Management', status: 'LIVE' },
      { name: 'Dues Tracking', status: 'LIVE' },
      { name: 'Service Requests', status: 'LIVE' },
      { name: 'Certificate Generation', status: 'LIVE' },
      { name: 'Voting & Elections', status: 'DEMO' },
      { name: 'Project Tracking', status: 'DEMO' },
      { name: 'Budget Transparency', status: 'DEMO' },
    ],
    commerceBoundary: {
      emits: ['Dues facts', 'Levy facts', 'Fine facts', 'Contribution facts'],
      doesNot: ['Process payments', 'Manage savings accounts', 'Handle loans', 'Generate receipts'],
    },
    governancePosture: {
      safeguards: ['Constituent data protection', 'Voting integrity', 'Certificate authenticity', 'Access by jurisdiction'],
      auditFeatures: ['Dues payment history', 'Election records', 'Service request logs', 'Certificate issuance trail'],
    },
    nigeriaContext: ['LGA/State structure', 'Community development levies', 'Cooperative regulations', 'Traditional governance awareness'],
  },
  'logistics': {
    name: 'Logistics Suite',
    tagline: 'Delivery, fleet & dispatch',
    icon: Truck,
    color: 'orange',
    demo: '/logistics-demo',
    governs: 'Fleet operations, job dispatch, driver management, and delivery tracking. Does NOT process payments.',
    audience: ['Delivery companies', 'Transport fleets', 'Courier services', 'Fulfillment centers', '3PL providers'],
    capabilities: [
      { name: 'Fleet Management', status: 'LIVE' },
      { name: 'Driver Management', status: 'LIVE' },
      { name: 'Job Dispatch', status: 'LIVE' },
      { name: 'Real-time Tracking', status: 'LIVE' },
      { name: 'Proof of Delivery', status: 'LIVE' },
      { name: 'Route Optimization', status: 'DEMO' },
      { name: 'Driver Settlements', status: 'DEMO' },
      { name: 'Fuel Management', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Delivery fee facts', 'COD collection facts', 'Driver earning facts'],
      doesNot: ['Process payments', 'Handle COD remittance', 'Pay drivers', 'Manage fuel cards'],
    },
    governancePosture: {
      safeguards: ['Driver verification', 'Vehicle documentation', 'POD requirements', 'GPS audit trail'],
      auditFeatures: ['Job history', 'Delivery timestamps', 'Driver performance', 'Vehicle utilization'],
    },
    nigeriaContext: ['Lagos/Abuja zones', 'State-specific regulations', 'FRSC compliance', 'Local courier networks'],
  },
  'real-estate': {
    name: 'Real Estate Suite',
    tagline: 'Property management',
    icon: Building,
    color: 'teal',
    demo: '/real-estate-demo',
    governs: 'Property listings, lease management, rent tracking, and maintenance operations. Does NOT process payments.',
    audience: ['Property managers', 'Landlords', 'Real estate agencies', 'Facility managers', 'Housing estates'],
    capabilities: [
      { name: 'Property Registry', status: 'LIVE' },
      { name: 'Unit Management', status: 'LIVE' },
      { name: 'Lease Management', status: 'LIVE' },
      { name: 'Rent Schedules', status: 'LIVE' },
      { name: 'Tenant Management', status: 'LIVE' },
      { name: 'Maintenance Requests', status: 'LIVE' },
      { name: 'Inspection Scheduling', status: 'DEMO' },
      { name: 'Vendor Management', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Rent due facts', 'Service charge facts', 'Maintenance cost facts'],
      doesNot: ['Collect rent', 'Issue receipts', 'Handle security deposits', 'Pay vendors'],
    },
    governancePosture: {
      safeguards: ['Tenant data protection', 'Lease document integrity', 'Maintenance accountability', 'Access control per property'],
      auditFeatures: ['Rent payment history', 'Lease modification logs', 'Maintenance records', 'Inspection reports'],
    },
    nigeriaContext: ['Nigerian tenancy laws', 'State-specific regulations', 'Caution fee conventions', 'Agent commission norms'],
  },
  'recruitment': {
    name: 'Recruitment Suite',
    tagline: 'Hiring & onboarding',
    icon: Briefcase,
    color: 'indigo',
    demo: '/recruitment-demo',
    governs: 'Job postings, applicant tracking, interview scheduling, and onboarding workflows. Does NOT process payments.',
    audience: ['HR departments', 'Recruitment agencies', 'Staffing firms', 'Corporate recruiters', 'Headhunters'],
    capabilities: [
      { name: 'Job Postings', status: 'LIVE' },
      { name: 'Applicant Tracking', status: 'LIVE' },
      { name: 'Resume Parsing', status: 'LIVE' },
      { name: 'Interview Scheduling', status: 'LIVE' },
      { name: 'Offer Management', status: 'LIVE' },
      { name: 'Onboarding Workflows', status: 'DEMO' },
      { name: 'Background Checks', status: 'PLANNED' },
      { name: 'Skill Assessments', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Placement fee facts', 'Agency commission facts'],
      doesNot: ['Process placement fees', 'Pay referral bonuses', 'Handle salary advances'],
    },
    governancePosture: {
      safeguards: ['Candidate data privacy', 'Equal opportunity compliance', 'Interview record integrity', 'Offer documentation'],
      auditFeatures: ['Application history', 'Interview logs', 'Hiring decisions', 'Onboarding progress'],
    },
    nigeriaContext: ['Nigerian labor laws', 'NYSC status handling', 'Local qualification recognition', 'State of origin awareness'],
  },
  'project-management': {
    name: 'Project Management Suite',
    tagline: 'Project lifecycle tracking',
    icon: FolderKanban,
    color: 'cyan',
    demo: '/project-demo',
    governs: 'Project planning, task management, resource allocation, and progress tracking. Does NOT process payments.',
    audience: ['Project managers', 'Construction firms', 'Consultancies', 'NGOs', 'Government agencies'],
    capabilities: [
      { name: 'Project Creation', status: 'LIVE' },
      { name: 'Task Management', status: 'LIVE' },
      { name: 'Milestone Tracking', status: 'LIVE' },
      { name: 'Resource Allocation', status: 'LIVE' },
      { name: 'Time Tracking', status: 'LIVE' },
      { name: 'Gantt Charts', status: 'DEMO' },
      { name: 'Budget Tracking', status: 'DEMO' },
      { name: 'Risk Management', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Project expense facts', 'Contractor payment facts', 'Budget variance facts'],
      doesNot: ['Process payments', 'Pay contractors', 'Handle project financing'],
    },
    governancePosture: {
      safeguards: ['Project data access control', 'Milestone sign-off requirements', 'Change request documentation'],
      auditFeatures: ['Task completion logs', 'Time entry records', 'Budget vs actual', 'Approval history'],
    },
    nigeriaContext: ['Public procurement awareness', 'BPP compliance', 'Due process requirements', 'Local contractor management'],
  },
  'legal-practice': {
    name: 'Legal Practice Suite',
    tagline: 'Law firms & chambers',
    icon: Scale,
    color: 'slate',
    demo: '/legal-demo',
    governs: 'Matter management, time tracking, client records, and court deadline management. Does NOT process payments.',
    audience: ['Law firms', 'Barristers chambers', 'Legal departments', 'Notaries', 'IP practitioners'],
    capabilities: [
      { name: 'Matter Management', status: 'LIVE' },
      { name: 'Client Records', status: 'LIVE' },
      { name: 'Time & Billing Entries', status: 'LIVE' },
      { name: 'Court Deadlines', status: 'LIVE' },
      { name: 'Document Management', status: 'LIVE' },
      { name: 'Retainer Tracking', status: 'DEMO' },
      { name: 'Conflict Checking', status: 'DEMO' },
      { name: 'Trust Accounting', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Billable time facts', 'Retainer draw facts', 'Expense facts'],
      doesNot: ['Generate invoices', 'Process retainer payments', 'Handle trust accounts'],
    },
    governancePosture: {
      safeguards: ['Attorney-client privilege', 'Conflict of interest checks', 'Matter confidentiality', 'Document retention policies'],
      auditFeatures: ['Time entry logs', 'Matter access history', 'Document audit trail', 'Deadline compliance'],
    },
    nigeriaContext: ['NBA/LPDC awareness', 'Nigerian court systems', 'State High Court rules', 'Legal year calendar'],
  },
  'warehouse': {
    name: 'Advanced Warehouse Suite',
    tagline: 'WMS & fulfillment',
    icon: Warehouse,
    color: 'stone',
    demo: '/warehouse-demo',
    governs: 'Warehouse locations, inventory movement, picking/packing, and shipping operations. Does NOT process payments.',
    audience: ['Warehouses', 'Distribution centers', 'Fulfillment centers', '3PL operators', 'Cold storage'],
    capabilities: [
      { name: 'Location Management', status: 'LIVE' },
      { name: 'Inventory Tracking', status: 'LIVE' },
      { name: 'Receiving Operations', status: 'LIVE' },
      { name: 'Pick & Pack', status: 'LIVE' },
      { name: 'Shipping Management', status: 'LIVE' },
      { name: 'Cycle Counting', status: 'DEMO' },
      { name: 'Cross-docking', status: 'PLANNED' },
      { name: 'Cold Chain Monitoring', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Storage fee facts', 'Handling fee facts', 'Fulfillment cost facts'],
      doesNot: ['Invoice clients', 'Process storage payments', 'Handle COD'],
    },
    governancePosture: {
      safeguards: ['Inventory accuracy requirements', 'Lot/batch traceability', 'Expiry management', 'Damage documentation'],
      auditFeatures: ['Movement history', 'Inventory adjustments', 'Picking accuracy', 'Shipping records'],
    },
    nigeriaContext: ['NAFDAC storage requirements', 'SON compliance', 'Free trade zone awareness', 'Port clearance integration'],
  },
  'parkhub': {
    name: 'ParkHub (Transport) Suite',
    tagline: 'Motor parks & transit',
    icon: Car,
    color: 'yellow',
    demo: '/parkhub-demo',
    governs: 'Motor park operations, route management, ticket sales tracking, and trip management. Does NOT process payments.',
    audience: ['Motor parks', 'Transport unions', 'Bus companies', 'Interstate operators', 'Booking agents'],
    capabilities: [
      { name: 'Park Management', status: 'LIVE' },
      { name: 'Route Configuration', status: 'LIVE' },
      { name: 'Operator Management', status: 'LIVE' },
      { name: 'Trip Scheduling', status: 'LIVE' },
      { name: 'Ticket Tracking', status: 'LIVE' },
      { name: 'Agent POS', status: 'LIVE' },
      { name: 'Passenger Manifest', status: 'DEMO' },
      { name: 'Vehicle Tracking', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Ticket sale facts', 'Levy facts', 'Agent commission facts'],
      doesNot: ['Process payments', 'Handle agent settlements', 'Pay operators'],
    },
    governancePosture: {
      safeguards: ['Passenger data privacy', 'Manifest requirements', 'Operator verification', 'Route safety compliance'],
      auditFeatures: ['Ticket history', 'Trip records', 'Agent transactions', 'Operator performance'],
    },
    nigeriaContext: ['NURTW/RTEAN awareness', 'State transport regulations', 'Interstate permit requirements', 'Park levy structures'],
  },
  'political': {
    name: 'Political Suite',
    tagline: 'Campaigns & party operations',
    icon: Vote,
    color: 'rose',
    demo: '/political-demo',
    governs: 'Campaign management, supporter registry, volunteer coordination, and donation tracking. Does NOT process payments.',
    audience: ['Political parties', 'Campaign organizations', 'Candidates', 'Political consultants', 'PACs'],
    capabilities: [
      { name: 'Campaign Management', status: 'LIVE' },
      { name: 'Supporter Registry', status: 'LIVE' },
      { name: 'Volunteer Coordination', status: 'LIVE' },
      { name: 'Event Management', status: 'LIVE' },
      { name: 'Donation Tracking', status: 'LIVE' },
      { name: 'Canvassing Tools', status: 'DEMO' },
      { name: 'Polling Integration', status: 'PLANNED' },
      { name: 'Media Management', status: 'PLANNED' },
    ],
    commerceBoundary: {
      emits: ['Donation facts', 'Pledge facts', 'Expense facts'],
      doesNot: ['Process donations', 'Issue receipts', 'Handle campaign financing'],
    },
    governancePosture: {
      safeguards: ['Supporter data privacy', 'Donation source verification', 'Expense documentation', 'Campaign finance compliance'],
      auditFeatures: ['Donation history', 'Expense records', 'Volunteer activity', 'Event attendance'],
    },
    nigeriaContext: ['INEC regulations', 'Electoral Act compliance', 'Campaign finance limits', 'Party registration requirements'],
  },
  'church': {
    name: 'Church Suite',
    tagline: 'Faith organizations',
    icon: Church,
    color: 'violet',
    demo: '/church-demo',
    governs: 'Church registry, member management, ministry operations, giving tracking, and governance records. Does NOT process payments.',
    audience: ['Churches', 'Denominations', 'Dioceses', 'Parishes', 'Faith-based NGOs'],
    capabilities: [
      { name: 'Church Registry', status: 'LIVE' },
      { name: 'Member Management', status: 'LIVE' },
      { name: 'Ministry Management', status: 'LIVE' },
      { name: 'Service Scheduling', status: 'LIVE' },
      { name: 'Attendance (Aggregated)', status: 'LIVE' },
      { name: 'Giving Facts (Tithes/Offerings)', status: 'LIVE' },
      { name: 'Governance Records', status: 'LIVE' },
      { name: 'Evidence Bundles', status: 'LIVE' },
      { name: 'Cell Group Management', status: 'DEMO' },
      { name: 'Pastoral Care Notes', status: 'DEMO' },
    ],
    commerceBoundary: {
      emits: ['Tithe facts', 'Offering facts', 'Pledge facts', 'Expense facts'],
      doesNot: ['Process payments', 'Generate receipts', 'Handle bank accounts', 'Manage church wallets'],
    },
    governancePosture: {
      safeguards: ['Minors safeguarding (contact protected)', 'Pastoral confidentiality (encrypted)', 'Guardian linkage required', 'Giving anonymity option'],
      auditFeatures: ['Giving history (append-only)', 'Governance records (immutable)', 'Evidence bundles (sealed)', 'Regulator access logs'],
    },
    nigeriaContext: ['CAC registration', 'Charity commission awareness', 'Denominational structures', 'Nigerian church calendar'],
  },
}

const colorClasses: Record<string, { bg: string; text: string; light: string; border: string }> = {
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-100', border: 'border-emerald-200' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-100', border: 'border-blue-200' },
  red: { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-100', border: 'border-purple-200' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-600', light: 'bg-amber-100', border: 'border-amber-200' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-600', light: 'bg-orange-100', border: 'border-orange-200' },
  teal: { bg: 'bg-teal-600', text: 'text-teal-600', light: 'bg-teal-100', border: 'border-teal-200' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-100', border: 'border-indigo-200' },
  cyan: { bg: 'bg-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-100', border: 'border-cyan-200' },
  slate: { bg: 'bg-slate-600', text: 'text-slate-600', light: 'bg-slate-100', border: 'border-slate-200' },
  stone: { bg: 'bg-stone-600', text: 'text-stone-600', light: 'bg-stone-100', border: 'border-stone-200' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', light: 'bg-rose-100', border: 'border-rose-200' },
  violet: { bg: 'bg-violet-600', text: 'text-violet-600', light: 'bg-violet-100', border: 'border-violet-200' },
}

export async function generateStaticParams() {
  return Object.keys(suiteData).map((suite) => ({ suite }))
}

export async function generateMetadata({ params }: { params: { suite: string } }) {
  const suite = suiteData[params.suite]
  if (!suite) return { title: 'Suite Not Found — WebWaka' }
  return {
    title: `${suite.name} — WebWaka Platform`,
    description: suite.governs,
  }
}

export default function SuiteDeepDivePage({ params }: { params: { suite: string } }) {
  const suite = suiteData[params.suite]
  if (!suite) notFound()

  const colors = colorClasses[suite.color]
  const Icon = suite.icon

  const liveCount = suite.capabilities.filter((c: any) => c.status === 'LIVE').length
  const demoCount = suite.capabilities.filter((c: any) => c.status === 'DEMO').length
  const plannedCount = suite.capabilities.filter((c: any) => c.status === 'PLANNED').length

  return (
    <div>
      {/* Hero */}
      <section className={`bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 py-12 md:py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/suites" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to All Suites
          </Link>
          
          <div className="flex items-start gap-4 md:gap-6">
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl ${colors.light} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-7 h-7 md:w-8 md:h-8 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{suite.name}</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                  <Lock className="w-3 h-3" />
                  v2-FROZEN
                </span>
              </div>
              <p className="text-gray-400">{suite.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: What This Suite Governs */}
      <section className="py-8 md:py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">What This Suite Governs</h2>
          <p className="text-gray-600">{suite.governs}</p>
        </div>
      </section>

      {/* Section 2: Who It's For */}
      <section className="py-8 md:py-12 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Who It's For</h2>
          <div className="flex flex-wrap gap-2">
            {suite.audience.map((a) => (
              <span key={a} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Capability Status (LIVE / DEMO / PLANNED) */}
      <section className="py-8 md:py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Capabilities</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> LIVE ({liveCount})</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-500" /> DEMO ({demoCount})</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> PLANNED ({plannedCount})</span>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suite.capabilities.map((cap) => (
              <div 
                key={cap.name}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  cap.status === 'LIVE' ? 'bg-emerald-50 border-emerald-200' :
                  cap.status === 'DEMO' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <span className="text-sm text-gray-800">{cap.name}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  cap.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' :
                  cap.status === 'DEMO' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {cap.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Commerce Boundary */}
      <section className="py-8 md:py-12 bg-purple-50 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Commerce Boundary</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                This Suite EMITS (Facts Only)
              </h3>
              <ul className="space-y-2">
                {suite.commerceBoundary.emits.map((e, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-red-200">
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <X className="w-4 h-4" />
                This Suite Does NOT
              </h3>
              <ul className="space-y-2">
                {suite.commerceBoundary.doesNot.map((d, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/governance/commerce-boundary" className="text-sm text-purple-600 hover:underline">
              Learn more about Commerce Boundary →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Governance & Audit Posture */}
      <section className="py-8 md:py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold text-gray-900">Governance & Audit Posture</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Safeguards</h3>
              <ul className="space-y-2">
                {suite.governancePosture.safeguards.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Features</h3>
              <ul className="space-y-2">
                {suite.governancePosture.auditFeatures.map((a, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <Eye className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Nigeria Context */}
      <section className="py-8 md:py-12 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nigeria-First Context</h2>
          <div className="flex flex-wrap gap-2">
            {suite.nigeriaContext.map((n, i) => (
              <span key={i} className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 text-sm rounded-lg">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className={`py-12 md:py-16 ${colors.bg}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Experience {suite.name}</h2>
          <p className="text-white/80 mb-6 text-sm">
            See this suite in action with guided storylines. No signup required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={suite.demo}
              className="w-full sm:w-auto px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              Enter Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-all"
            >
              Deploy This Suite
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
