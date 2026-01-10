'use client'

/**
 * Sales Demo Playbooks
 * 
 * Structured, repeatable demo scripts for sales, partners, and founders.
 * Each playbook follows: Role → Problem → Storyline → Demo Steps → Outcome → What NOT to claim
 * 
 * @route /demo/playbooks
 * @access Demo mode only
 */

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  ArrowLeft,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Play,
  BookOpen,
  Building2,
  Lock,
  Loader2,
  ExternalLink,
  Lightbulb,
  Ban
} from 'lucide-react'

// ============================================================================
// PLAYBOOK DATA
// ============================================================================

interface PlaybookStep {
  step: number
  action: string
  where: string
  expected: string
  tip?: string
}

interface Playbook {
  id: string
  title: string
  subtitle: string
  targetAudience: string[]
  problemStatement: string
  recommendedTenant: {
    name: string
    slug: string
  }
  loginRole: {
    role: string
    email: string
  }
  linkedStorylines: string[]
  duration: string
  steps: PlaybookStep[]
  ahaWhatMoments: string[]
  whatIsDemoOnly: string[]
  whatIsNotImplemented: string[]
  whatIsGovernedFrozen: string[]
  disclaimers: string[]
  badgeColor: string
}

const PLAYBOOKS: Playbook[] = [
  // =========================================================================
  // PLAYBOOK 1: POLITICAL CAMPAIGN
  // =========================================================================
  {
    id: 'political',
    title: 'Political Campaign Demo',
    subtitle: 'Campaign finance & volunteer coordination',
    targetAudience: [
      'Political party officials',
      'Campaign managers',
      'Electoral compliance officers',
      'Political consultants'
    ],
    problemStatement: 'Nigerian political campaigns struggle with transparent donation tracking, volunteer coordination, and compliance with INEC regulations. Manual processes lead to audit failures and reputational risk.',
    recommendedTenant: {
      name: 'Lagos Campaign HQ',
      slug: 'demo-political'
    },
    loginRole: {
      role: 'Campaign Manager',
      email: 'manager@demo-political.demo'
    },
    linkedStorylines: ['politicalManager', 'politicalAuditor'],
    duration: '12-15 minutes',
    steps: [
      { step: 1, action: 'View Campaign Dashboard', where: 'Dashboard', expected: 'See donation summary, volunteer counts, event calendar', tip: 'Point out the real-time donation ticker' },
      { step: 2, action: 'Navigate to Donations', where: 'Finance > Donations', expected: 'See categorized donation list with source tracking', tip: 'Emphasize audit trail per donation' },
      { step: 3, action: 'Show Donation Disclosure', where: 'Finance > Compliance', expected: 'See INEC-ready disclosure reports', tip: 'This is the "aha" moment for compliance officers' },
      { step: 4, action: 'Open Volunteer Registry', where: 'People > Volunteers', expected: 'See volunteer database with assignment status', tip: 'Show how volunteers are tracked by LGA' },
      { step: 5, action: 'View Event Coordination', where: 'Events > Rallies', expected: 'See scheduled events with volunteer assignments', tip: 'Mention the attendance tracking capability' },
      { step: 6, action: 'Switch to Auditor Role', where: 'Login as auditor@demo-political.demo', expected: 'See read-only compliance dashboard', tip: 'Show what INEC observers would see' },
    ],
    ahaWhatMoments: [
      'Real-time donation tracking with automatic categorization',
      'INEC-compliant disclosure reports generated automatically',
      'Volunteer assignments visible by Local Government Area',
      'Auditor view shows everything but can change nothing'
    ],
    whatIsDemoOnly: [
      'All campaign names, donations, and volunteers are fictional',
      'No real INEC submissions occur',
      'Financial data is simulated Nigerian Naira amounts',
      'No actual bank integrations in demo'
    ],
    whatIsNotImplemented: [
      'Direct INEC portal submission (requires INEC API access)',
      'Bulk SMS to volunteers (requires Termii/SMS gateway)',
      'Payment gateway for online donations (Commerce Boundary)'
    ],
    whatIsGovernedFrozen: [
      'Donation audit trail is append-only (cannot be deleted)',
      'Compliance reports are timestamped and immutable',
      'All financial entries follow double-entry accounting',
      'Suite is v2-FROZEN — behavior is locked'
    ],
    disclaimers: [
      'WebWaka does not endorse any political party or candidate',
      'Demo data is non-partisan and fictional',
      'Actual INEC compliance requires legal review'
    ],
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
  },

  // =========================================================================
  // PLAYBOOK 2: CHURCH ADMINISTRATION
  // =========================================================================
  {
    id: 'church',
    title: 'Church Administration Demo',
    subtitle: 'Membership, giving, & ministry management',
    targetAudience: [
      'Senior pastors',
      'Church administrators',
      'Finance secretaries',
      'Denominational oversight'
    ],
    problemStatement: 'Churches in Nigeria face challenges tracking membership, managing tithes/offerings transparently, coordinating ministries, and maintaining trust with congregants about financial stewardship.',
    recommendedTenant: {
      name: 'GraceLife Community Church',
      slug: 'demo-church'
    },
    loginRole: {
      role: 'Church Admin',
      email: 'admin@demo-church.demo'
    },
    linkedStorylines: ['churchPastor', 'churchMember', 'churchAuditor'],
    duration: '10-12 minutes',
    steps: [
      { step: 1, action: 'View Church Dashboard', where: 'Dashboard', expected: 'See membership count, giving summary, upcoming services', tip: 'Highlight the attendance trends' },
      { step: 2, action: 'Open Membership Registry', where: 'People > Members', expected: 'See member profiles with family units', tip: 'Show the family grouping feature' },
      { step: 3, action: 'Navigate to Giving Records', where: 'Finance > Giving', expected: 'See tithe/offering records by member', tip: 'This is sensitive — emphasize privacy controls' },
      { step: 4, action: 'Show Ministry Groups', where: 'Ministries > Groups', expected: 'See ministry teams with leaders', tip: 'Point out the communication features' },
      { step: 5, action: 'View Service Attendance', where: 'Services > Attendance', expected: 'See service-by-service attendance records', tip: 'Mention the first-timer tracking' },
      { step: 6, action: 'Open Financial Reports', where: 'Finance > Reports', expected: 'See income/expense summary', tip: 'Show the audit-ready export' },
    ],
    ahaWhatMoments: [
      'Member giving history tracked transparently',
      'Ministry coordination simplified',
      'Attendance trends help with planning',
      'Financial reports ready for church board'
    ],
    whatIsDemoOnly: [
      'All member names and giving amounts are fictional',
      'Church name "GraceLife Community Church" is fictional',
      'No real bank transfers or payment processing',
      'Attendance data is simulated'
    ],
    whatIsNotImplemented: [
      'Online giving portal (Commerce Boundary)',
      'SMS/Email to members (requires external gateway)',
      'Live streaming integration'
    ],
    whatIsGovernedFrozen: [
      'All giving records are append-only (audit trail)',
      'Member data is privacy-protected',
      'Financial entries follow accounting standards',
      'Suite is v2-FROZEN — behavior is locked'
    ],
    disclaimers: [
      'WebWaka is non-denominational and serves all church types',
      'Demo does not represent any real church',
      'Actual implementation requires data migration planning'
    ],
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200'
  },

  // =========================================================================
  // PLAYBOOK 3: SCHOOL ADMINISTRATION
  // =========================================================================
  {
    id: 'school',
    title: 'School Administration Demo',
    subtitle: 'Attendance, grading, & fee management',
    targetAudience: [
      'School proprietors',
      'Principals',
      'Education investors',
      'School administrators'
    ],
    problemStatement: 'Nigerian schools struggle with accurate attendance tracking, transparent grade management, fee collection, and parent communication. Paper-based systems lead to disputes and inefficiency.',
    recommendedTenant: {
      name: 'Bright Future Academy',
      slug: 'demo-school'
    },
    loginRole: {
      role: 'Principal',
      email: 'principal@demo-school.demo'
    },
    linkedStorylines: ['school', 'parent'],
    duration: '10-12 minutes',
    steps: [
      { step: 1, action: 'View School Dashboard', where: 'Dashboard', expected: 'See enrollment, attendance rate, fee collection status', tip: 'Point out the term-based summary' },
      { step: 2, action: 'Open Class List', where: 'Academics > Classes', expected: 'See classes with student counts', tip: 'Show how classes are organized by arm' },
      { step: 3, action: 'View Attendance Register', where: 'Attendance > Daily', expected: 'See today\'s attendance by class', tip: 'Emphasize the real-time nature' },
      { step: 4, action: 'Navigate to Grade Book', where: 'Academics > Grades', expected: 'See subject grades by student', tip: 'Show the CA + Exam breakdown' },
      { step: 5, action: 'Check Fee Status', where: 'Finance > Fees', expected: 'See fee payment status by student', tip: 'Point out outstanding balances' },
      { step: 6, action: 'Switch to Parent View', where: 'Login as parent@demo-school.demo', expected: 'See child-specific dashboard', tip: 'Show what parents see about their ward' },
    ],
    ahaWhatMoments: [
      'Real-time attendance visible to proprietor',
      'Grade transparency reduces disputes',
      'Fee tracking eliminates cash handling issues',
      'Parent portal builds trust'
    ],
    whatIsDemoOnly: [
      'All student names and grades are fictional',
      'School "Bright Future Academy" is fictional',
      'Fee amounts are sample Nigerian Naira figures',
      'Attendance data is simulated'
    ],
    whatIsNotImplemented: [
      'Online fee payment (Commerce Boundary)',
      'Parent SMS notifications (requires SMS gateway)',
      'Result slip printing (requires template configuration)'
    ],
    whatIsGovernedFrozen: [
      'Grade entries are audited and traceable',
      'Attendance records cannot be backdated without audit',
      'Fee transactions follow accounting rules',
      'Suite is v2-FROZEN — behavior is locked'
    ],
    disclaimers: [
      'Demo does not represent any real school',
      'Actual implementation requires term/session setup',
      'Grade calculations follow Nigerian education standards'
    ],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },

  // =========================================================================
  // PLAYBOOK 4: CLINIC ADMINISTRATION
  // =========================================================================
  {
    id: 'clinic',
    title: 'Clinic Administration Demo',
    subtitle: 'Patient records & appointment scheduling',
    targetAudience: [
      'Clinic owners',
      'Medical directors',
      'Healthcare investors',
      'Health administrators'
    ],
    problemStatement: 'Nigerian clinics face challenges with patient record management, appointment scheduling, and maintaining NHIA/HMO compliance. Manual processes lead to lost records and revenue leakage.',
    recommendedTenant: {
      name: 'HealthFirst Clinic',
      slug: 'demo-clinic'
    },
    loginRole: {
      role: 'Clinic Admin',
      email: 'admin@demo-clinic.demo'
    },
    linkedStorylines: ['clinic', 'patient', 'healthRegulator'],
    duration: '10-12 minutes',
    steps: [
      { step: 1, action: 'View Clinic Dashboard', where: 'Dashboard', expected: 'See patient count, appointments today, revenue summary', tip: 'Point out the appointment queue' },
      { step: 2, action: 'Open Patient Registry', where: 'Patients > All', expected: 'See patient list with last visit date', tip: 'Show the patient search feature' },
      { step: 3, action: 'View Patient Record', where: 'Click any patient', expected: 'See medical history, visits, prescriptions', tip: 'Emphasize the privacy of medical data' },
      { step: 4, action: 'Check Appointment Schedule', where: 'Appointments > Today', expected: 'See scheduled appointments with status', tip: 'Show the check-in workflow' },
      { step: 5, action: 'Navigate to Billing', where: 'Finance > Invoices', expected: 'See patient invoices and payment status', tip: 'Point out HMO tagging' },
      { step: 6, action: 'Switch to Patient View', where: 'Login as patient@demo-clinic.demo', expected: 'See patient portal with limited view', tip: 'Show what patients can see' },
    ],
    ahaWhatMoments: [
      'Patient history always accessible',
      'Appointment scheduling reduces wait times',
      'Billing transparency builds trust',
      'HMO tracking simplifies reimbursement'
    ],
    whatIsDemoOnly: [
      'All patient names and medical data are fictional',
      'Clinic "HealthFirst Clinic" is fictional',
      'No real medical advice or diagnoses',
      'Prescription data is simulated'
    ],
    whatIsNotImplemented: [
      'NHIA/HMO portal integration (requires API access)',
      'Online appointment booking (Commerce Boundary)',
      'Lab result integration (requires LIS interface)'
    ],
    whatIsGovernedFrozen: [
      'Patient records are protected and access-logged',
      'Medical history is append-only',
      'All access is audited for compliance',
      'Suite is v2-FROZEN — behavior is locked'
    ],
    disclaimers: [
      'Demo does not provide medical advice',
      'All medical data is fictional and for demonstration only',
      'HIPAA/NDPR compliance requires proper configuration'
    ],
    badgeColor: 'bg-red-100 text-red-800 border-red-200'
  },

  // =========================================================================
  // PLAYBOOK 5: COMMERCE MERCHANT
  // =========================================================================
  {
    id: 'commerce',
    title: 'Commerce Merchant Demo',
    subtitle: 'POS, inventory, & accounting',
    targetAudience: [
      'Retail business owners',
      'Wholesale distributors',
      'Business consultants',
      'Finance managers'
    ],
    problemStatement: 'Nigerian merchants struggle with inventory accuracy, cash reconciliation, and maintaining proper accounting records. Manual processes lead to stock discrepancies and tax compliance issues.',
    recommendedTenant: {
      name: 'Lagos Retail Store',
      slug: 'demo-retail-store'
    },
    loginRole: {
      role: 'Store Owner',
      email: 'owner@demo-retail-store.demo'
    },
    linkedStorylines: ['retail', 'cfo', 'regulator'],
    duration: '12-15 minutes',
    steps: [
      { step: 1, action: 'View Business Dashboard', where: 'Dashboard', expected: 'See sales summary, inventory alerts, cash position', tip: 'Point out the daily sales ticker' },
      { step: 2, action: 'Open POS Interface', where: 'Sales > POS', expected: 'See point-of-sale with product catalog', tip: 'Show how easy it is to ring up a sale' },
      { step: 3, action: 'Check Inventory Levels', where: 'Inventory > Stock', expected: 'See real-time stock with reorder alerts', tip: 'Emphasize the multi-location support' },
      { step: 4, action: 'View Sales Reports', where: 'Reports > Sales', expected: 'See sales by product, period, staff', tip: 'Show the export to Excel feature' },
      { step: 5, action: 'Navigate to Accounting', where: 'Finance > Journal', expected: 'See auto-generated journal entries', tip: 'This is the "aha" moment for accountants' },
      { step: 6, action: 'Check VAT Report', where: 'Finance > Tax > VAT', expected: 'See VAT collected and payable', tip: 'Point out FIRS compliance readiness' },
    ],
    ahaWhatMoments: [
      'Every sale automatically updates inventory',
      'Journal entries created without manual input',
      'VAT tracked automatically at 7.5%',
      'Multi-location stock visibility'
    ],
    whatIsDemoOnly: [
      'All products and sales are fictional',
      'Store "Lagos Retail Store" is fictional',
      'Prices are sample Nigerian Naira amounts',
      'No real transactions occur'
    ],
    whatIsNotImplemented: [
      'Payment terminal integration (requires hardware)',
      'Online store (Commerce Boundary for execution)',
      'Automated bank reconciliation (requires bank API)'
    ],
    whatIsGovernedFrozen: [
      'All transactions create audit entries',
      'Journal entries are immutable once posted',
      'VAT calculations follow FIRS rules',
      'Suite is v2-FROZEN — behavior is locked'
    ],
    disclaimers: [
      'Demo does not process real payments',
      'Tax calculations are illustrative only',
      'Actual FIRS compliance requires professional review'
    ],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },

  // =========================================================================
  // PLAYBOOK 6: REGULATOR / AUDITOR
  // =========================================================================
  {
    id: 'regulator',
    title: 'Regulator & Auditor Demo',
    subtitle: 'Compliance oversight & audit trails',
    targetAudience: [
      'Regulatory officers',
      'External auditors',
      'Compliance consultants',
      'Governance professionals'
    ],
    problemStatement: 'Regulators and auditors need read-only access to verify compliance without disrupting operations. Traditional systems either grant too much access or require manual data exports.',
    recommendedTenant: {
      name: 'Lagos State Lands Bureau',
      slug: 'demo-civic'
    },
    loginRole: {
      role: 'Auditor',
      email: 'auditor@demo-civic.demo'
    },
    linkedStorylines: ['civicAuditor', 'regulator'],
    duration: '8-10 minutes',
    steps: [
      { step: 1, action: 'Login as Auditor', where: 'Login page', expected: 'See audit-specific dashboard', tip: 'Note the read-only badge on all screens' },
      { step: 2, action: 'View Audit Trail', where: 'Audit > Activity Log', expected: 'See chronological activity log', tip: 'Show the filter by action type' },
      { step: 3, action: 'Check Transaction Records', where: 'Finance > Transactions', expected: 'See all transactions (read-only)', tip: 'Emphasize you cannot modify anything' },
      { step: 4, action: 'Verify Compliance Reports', where: 'Compliance > Reports', expected: 'See pre-generated compliance reports', tip: 'Show the timestamp verification' },
      { step: 5, action: 'Attempt to Edit', where: 'Any record', expected: 'See "Read-only access" message', tip: 'This proves the access control' },
      { step: 6, action: 'Export Audit Package', where: 'Audit > Export', expected: 'See export options for audit evidence', tip: 'Show the tamper-evident export' },
    ],
    ahaWhatMoments: [
      'Complete visibility without edit capability',
      'Every action is logged and timestamped',
      'Reports are pre-generated and immutable',
      'Audit evidence is tamper-evident'
    ],
    whatIsDemoOnly: [
      'All audit data is fictional',
      'Agency "Lagos State Lands Bureau" is fictional',
      'No real regulatory submissions occur',
      'Activity logs are simulated'
    ],
    whatIsNotImplemented: [
      'Direct regulatory portal submission',
      'Digital signature verification',
      'Real-time regulatory alerts'
    ],
    whatIsGovernedFrozen: [
      'Auditor role cannot modify any data',
      'All records are append-only',
      'Timestamps are server-generated (non-editable)',
      'Export includes integrity checksums'
    ],
    disclaimers: [
      'Demo auditor role is for illustration only',
      'Actual regulatory compliance varies by jurisdiction',
      'Audit access requires proper authorization in production'
    ],
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SalesDemoPlaybooks() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <PlaybooksContent />
    </Suspense>
  )
}

function PlaybooksContent() {
  const searchParams = useSearchParams()
  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null)
  
  // Demo mode detection
  const demoParam = searchParams.get('demo')
  const isDemo = demoParam === 'true'
  
  // Access denied view
  if (!isDemo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 mb-6">
            Demo playbooks are only available in demo mode.
          </p>
          <Link
            href="/demo/playbooks?demo=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Shield className="w-4 h-4" />
            Enter Demo Mode
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/demo/credentials?demo=true" 
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Back to credentials"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                  <h1 className="text-xl font-bold text-slate-900">Sales Demo Playbooks</h1>
                </div>
                <p className="text-sm text-slate-500">Structured scripts for repeatable demos</p>
              </div>
            </div>
            
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
              DEMO MODE
            </span>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro */}
        <div className="mb-8">
          <p className="text-slate-600 mb-4">
            These playbooks provide structured, repeatable demo scripts for sales teams, partners, and founders.
            Each playbook follows a consistent format: <strong>Role → Problem → Steps → Outcome → Disclaimers</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              8-15 min each
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              6 playbooks
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Governance-first
            </span>
          </div>
        </div>
        
        {/* Playbook Cards */}
        <div className="space-y-4">
          {PLAYBOOKS.map((playbook) => (
            <PlaybookCard
              key={playbook.id}
              playbook={playbook}
              isExpanded={expandedPlaybook === playbook.id}
              onToggle={() => setExpandedPlaybook(
                expandedPlaybook === playbook.id ? null : playbook.id
              )}
            />
          ))}
        </div>
        
        {/* Footer Notes */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Important Notes for Demo Presenters
          </h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Always clarify that demo data is fictional and for illustration only</li>
            <li>• Do not promise features that are listed as "Not Implemented"</li>
            <li>• Emphasize governance and audit capabilities when relevant</li>
            <li>• Remember: WebWaka does not execute commerce — it enables governance</li>
            <li>• All suites are v2-FROZEN — behavior is locked and predictable</li>
          </ul>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-500 text-center">
            WebWaka Sales Demo Playbooks • Governance-First • No Roadmap Promises
          </p>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// PLAYBOOK CARD COMPONENT
// ============================================================================

interface PlaybookCardProps {
  playbook: Playbook
  isExpanded: boolean
  onToggle: () => void
}

function PlaybookCard({ playbook, isExpanded, onToggle }: PlaybookCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded border ${playbook.badgeColor}`}>
            {playbook.title.split(' ')[0]}
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">{playbook.title}</h3>
            <p className="text-sm text-slate-500">{playbook.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 hidden sm:block">{playbook.duration}</span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-6">
          {/* Target Audience & Problem */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Target Audience
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                {playbook.targetAudience.map((audience, i) => (
                  <li key={i}>• {audience}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Problem Statement
              </h4>
              <p className="text-sm text-slate-600">{playbook.problemStatement}</p>
            </div>
          </div>
          
          {/* Login Info */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-emerald-800">Recommended Login</p>
                <p className="text-sm text-emerald-700">
                  <strong>{playbook.loginRole.role}</strong> at {playbook.recommendedTenant.name}
                </p>
                <code className="text-xs text-emerald-600">{playbook.loginRole.email}</code>
              </div>
              <Link
                href={`/login?tenant=${playbook.recommendedTenant.slug}&demo=true`}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition flex items-center gap-1.5 w-fit"
              >
                <Play className="w-4 h-4" />
                Start Demo
              </Link>
            </div>
          </div>
          
          {/* Demo Steps */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              Demo Steps
            </h4>
            <div className="space-y-2">
              {playbook.steps.map((step) => (
                <div key={step.step} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{step.action}</p>
                    <p className="text-xs text-slate-500">{step.where}</p>
                    <p className="text-sm text-slate-600 mt-1">{step.expected}</p>
                    {step.tip && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {step.tip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* "Aha" Moments */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Expected "Aha" Moments
            </h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {playbook.ahaWhatMoments.map((moment, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {moment}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Disclaimers Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Demo Only */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                What is Demo-Only
              </h4>
              <ul className="text-xs text-amber-700 space-y-1">
                {playbook.whatIsDemoOnly.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            
            {/* Not Implemented */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1.5">
                <Ban className="w-4 h-4" />
                NOT Implemented
              </h4>
              <ul className="text-xs text-red-700 space-y-1">
                {playbook.whatIsNotImplemented.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Governed / Frozen */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Governed & FROZEN
            </h4>
            <ul className="text-xs text-slate-700 space-y-1">
              {playbook.whatIsGovernedFrozen.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          
          {/* Final Disclaimers */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-slate-500" />
              What NOT to Claim
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              {playbook.disclaimers.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          
          {/* Linked Storylines */}
          <div className="text-xs text-slate-500">
            <span className="font-medium">Linked S5 Storylines:</span>{' '}
            {playbook.linkedStorylines.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}
