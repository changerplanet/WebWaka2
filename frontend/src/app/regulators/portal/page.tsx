'use client'

/**
 * Regulator Access Portal - Read-Only, Invite-Only
 * 
 * Provides regulators with confidence and verification clarity.
 * NO LIVE DATA. NO OPERATIONS. NO PII.
 * 
 * @route /regulators/portal
 * @phase P3 - Regulator Access Portal
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Shield,
  Lock,
  FileCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Scale,
  BookOpen,
  Building2,
  Database,
  Layers,
  FileText,
  Clock,
  Ban,
  Info,
  ExternalLink,
} from 'lucide-react'

// =============================================================================
// ACCESS GATE COMPONENT
// =============================================================================

function AccessGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const hasAccess = searchParams.get('demo') === 'true' || searchParams.get('regulator') === 'true'
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-slate-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Access Restricted
            </h1>
            <p className="text-slate-600 mb-6">
              This portal is available to authorized regulators and auditors only. 
              Access requires invitation from WebWaka governance team.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left mb-6">
              <div className="text-sm font-medium text-slate-700 mb-2">To Request Access:</div>
              <ol className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">1.</span>
                  <span>Contact WebWaka through official regulatory channels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">2.</span>
                  <span>Provide regulatory authority credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">3.</span>
                  <span>Specify scope and purpose of access request</span>
                </li>
              </ol>
            </div>
            <p className="text-xs text-slate-400">
              WebWaka Regulator Portal • Invite-Only Access
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  )
}

function GuaranteeRow({
  label,
  value,
  verified,
}: {
  label: string
  value: string
  verified: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">{value}</span>
        {verified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PORTAL CONTENT
// =============================================================================

function RegulatorPortalContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Regulator Access Portal</h1>
              <p className="text-slate-300">Verification and governance transparency</p>
            </div>
          </div>
          
          {/* Portal Purpose Banner */}
          <div className="bg-white/10 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">Verification, Not Operations</div>
                <p className="text-sm text-slate-300 mt-1">
                  This portal provides verification and governance transparency. It does not provide 
                  operational access, data modification capabilities, or real-time monitoring. 
                  All information is read-only and for verification purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Section 1: Platform Overview */}
        <SectionCard icon={Building2} title="1. Platform Overview">
          <div className="space-y-6">
            {/* What WebWaka Is */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                What WebWaka Is
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>A governance-first, multi-tenant platform for Nigerian SMEs and institutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>14 v2-FROZEN verticals with locked, auditable business logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>Partner-distributed platform (not direct consumer sales)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>Audit-first architecture with append-only financial records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>Commerce Boundary enforcement separating facts from execution</span>
                </li>
              </ul>
            </div>
            
            {/* What WebWaka Is NOT */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                What WebWaka Is NOT
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>NOT a payment processor or money transmitter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>NOT an election management or voter registration system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>NOT a medical diagnosis or treatment recommendation system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>NOT a religious doctrine or theological guidance system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>NOT affiliated with INEC, CBN, or any government regulatory body</span>
                </li>
              </ul>
            </div>
            
            {/* Verticals Table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">v2-FROZEN Verticals</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  'Commerce', 'Education', 'Health', 'Hospitality',
                  'Civic/GovTech', 'Logistics', 'Real Estate', 'Recruitment',
                  'Project Mgmt', 'Legal', 'Warehouse', 'ParkHub',
                  'Political', 'Church'
                ].map((vertical) => (
                  <div key={vertical} className="bg-slate-50 rounded px-3 py-2 text-sm text-slate-700">
                    {vertical}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
        
        {/* Section 2: Governance Guarantees */}
        <SectionCard icon={Shield} title="2. Governance Guarantees">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              The following governance guarantees are architecturally enforced, not policy-based. 
              They cannot be circumvented by configuration, user action, or partner request.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <GuaranteeRow
                label="v2-FREEZE Discipline"
                value="14 verticals locked"
                verified={true}
              />
              <GuaranteeRow
                label="Business Logic Immutability"
                value="Enforced"
                verified={true}
              />
              <GuaranteeRow
                label="Commerce Boundary Separation"
                value="Facts vs Execution"
                verified={true}
              />
              <GuaranteeRow
                label="Append-Only Financial Records"
                value="Active"
                verified={true}
              />
              <GuaranteeRow
                label="Tenant Data Isolation"
                value="Architecturally Enforced"
                verified={true}
              />
              <GuaranteeRow
                label="Audit Logging"
                value="All Mutations Logged"
                verified={true}
              />
              <GuaranteeRow
                label="Cross-Tenant Access"
                value="Prevented"
                verified={true}
              />
              <GuaranteeRow
                label="Silent Schema Changes"
                value="Blocked"
                verified={true}
              />
            </div>
            
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                These guarantees are enforced at the code, middleware, and database levels. 
                Verification of enforcement is available through audit log analysis and 
                architecture review.
              </p>
            </div>
          </div>
        </SectionCard>
        
        {/* Section 3: Verification Artifacts */}
        <SectionCard icon={FileCheck} title="3. Verification Artifacts">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              The following artifacts are available for regulatory verification. 
              Access to specific artifacts requires formal request through governance channels.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Architecture Documentation */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-900">Architecture Documentation</div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• System architecture diagrams</li>
                  <li>• Data flow documentation</li>
                  <li>• Tenant isolation design</li>
                  <li>• Commerce Boundary specification</li>
                </ul>
              </div>
              
              {/* Governance Records */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-900">Governance Records</div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• FREEZE discipline documentation</li>
                  <li>• Version control history</li>
                  <li>• Change approval records</li>
                  <li>• Governance policy documents</li>
                </ul>
              </div>
              
              {/* Audit Capabilities */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-900">Audit Capabilities</div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Audit log export (static bundles)</li>
                  <li>• Tenant activity summaries</li>
                  <li>• Compliance snapshots</li>
                  <li>• Integrity verification hashes</li>
                </ul>
              </div>
              
              {/* Compliance Documentation */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-900">Compliance Documentation</div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• NDPR compliance posture</li>
                  <li>• Data handling procedures</li>
                  <li>• Security controls documentation</li>
                  <li>• Incident response procedures</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-amber-900">Artifact Access</div>
                <p className="text-sm text-amber-700 mt-1">
                  Verification artifacts are provided upon formal regulatory request. 
                  Access is logged, time-limited, and scoped to the specific verification purpose.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
        
        {/* Section 4: Evidence Access Explanation */}
        <SectionCard icon={Eye} title="4. Evidence Access Explanation">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              WebWaka provides structured evidence access for regulatory verification. 
              This access model prioritizes transparency while protecting tenant privacy 
              and maintaining audit integrity.
            </p>
            
            {/* Access Model */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Access Model</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">1</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Formal Request</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Regulator submits access request specifying scope, purpose, and timeframe.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">2</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Governance Review</div>
                    <p className="text-xs text-slate-600 mt-1">
                      WebWaka governance team reviews request and prepares scoped evidence bundle.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">3</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Evidence Delivery</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Static evidence bundle delivered with integrity verification and access logging.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-slate-600">4</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Tenant Notification</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Affected tenants are notified of regulator access (where legally permissible).
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* What Regulators CAN / CANNOT Access */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Regulators CAN Access
                </h4>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• Governance documentation</li>
                  <li>• Architecture specifications</li>
                  <li>• Anonymized audit summaries</li>
                  <li>• Compliance posture reports</li>
                  <li>• Static evidence bundles</li>
                  <li>• Integrity verification data</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 mb-3 flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Regulators CANNOT Access
                </h4>
                <ul className="text-xs text-red-800 space-y-1">
                  <li>• Real-time operational data</li>
                  <li>• Live system access</li>
                  <li>• Raw PII without specific scope</li>
                  <li>• Data modification capabilities</li>
                  <li>• Enforcement or suspension tools</li>
                  <li>• Cross-tenant data views</li>
                </ul>
              </div>
            </div>
          </div>
        </SectionCard>
        
        {/* Portal Limitations */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-900">Portal Limitations</div>
              <p className="text-sm text-amber-700 mt-2 mb-4">
                This portal provides verification and transparency information only. It does not:
              </p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Provide real-time access to tenant data or operations</li>
                <li>• Enable data modification, enforcement, or suspension actions</li>
                <li>• Replace formal regulatory engagement through official channels</li>
                <li>• Grant access to PII, credentials, or authentication secrets</li>
                <li>• Provide live monitoring or surveillance capabilities</li>
                <li>• Constitute legal or compliance certification</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-slate-100 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Formal Regulatory Engagement</h3>
              <p className="text-sm text-slate-600 mb-4">
                For formal regulatory inquiries, verification requests, or compliance assessments, 
                please contact WebWaka through official regulatory channels.
              </p>
              <div className="text-sm text-slate-600">
                <p>All regulatory engagement is:</p>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Logged with full audit trail</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Scoped to specific verification purpose</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Time-limited and access-controlled</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Transparent to affected parties where legally permissible</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-400">
            WebWaka Regulator Access Portal • Verification, Not Operations • Read-Only Access
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function RegulatorPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading portal...</div>
      </div>
    }>
      <AccessGate>
        <RegulatorPortalContent />
      </AccessGate>
    </Suspense>
  )
}
