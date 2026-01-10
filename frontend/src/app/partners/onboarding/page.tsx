'use client'

/**
 * Partner Onboarding Checklist - Guidance Only
 * 
 * Informational checklist to help partners understand how to operate within WebWaka.
 * NO STATE PERSISTENCE. NO COMPLETION TRACKING. NO SYSTEM ACTIONS.
 * 
 * @route /partners/onboarding
 * @phase P2 - Partner Onboarding Checklist
 */

import {
  Shield,
  CheckSquare,
  BookOpen,
  Globe,
  Users,
  AlertTriangle,
  Phone,
  FileText,
  Lock,
  Eye,
  Layers,
  Building2,
  ArrowRight,
  Info,
  Scale,
  Handshake,
} from 'lucide-react'

// =============================================================================
// SECTION COMPONENT
// =============================================================================

function ChecklistSection({
  icon: Icon,
  title,
  description,
  items,
  notice,
}: {
  icon: React.ElementType
  title: string
  description: string
  items: Array<{ text: string; subtext?: string }>
  notice?: { type: 'info' | 'warning'; text: string }
}) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      
      {/* Checklist Items */}
      <div className="p-6">
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded border-2 border-slate-300 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-slate-700">{item.text}</span>
                {item.subtext && (
                  <p className="text-xs text-slate-500 mt-1">{item.subtext}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        {notice && (
          <div className={`mt-6 flex items-start gap-3 rounded-lg p-4 ${
            notice.type === 'warning' 
              ? 'bg-amber-50 border border-amber-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            {notice.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${notice.type === 'warning' ? 'text-amber-800' : 'text-blue-800'}`}>
              {notice.text}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PartnerOnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
              <Handshake className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Partner Onboarding Checklist</h1>
              <p className="text-slate-500">Guidance for operating within WebWaka</p>
            </div>
          </div>
          
          {/* Guidance Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-900">Guidance Only</div>
                <p className="text-sm text-blue-700 mt-1">
                  This checklist provides guidance for understanding WebWaka partner expectations. 
                  It does not track completion, trigger system actions, or grant access. 
                  All partner activation requires manual platform approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Section 1: Governance Overview */}
        <ChecklistSection
          icon={Shield}
          title="1. Governance Overview"
          description="Understand WebWaka's governance model before proceeding"
          items={[
            {
              text: "Review v2-FREEZE discipline documentation",
              subtext: "All 14 verticals are locked. Business logic cannot be modified or customized.",
            },
            {
              text: "Understand Commerce Boundary separation",
              subtext: "Verticals record facts. Commerce module handles financial execution. No exceptions.",
            },
            {
              text: "Acknowledge append-only data discipline",
              subtext: "Financial facts, audit logs, and compliance records cannot be modified or deleted.",
            },
            {
              text: "Review tenant isolation guarantees",
              subtext: "Each tenant's data is strictly isolated. Cross-tenant access is architecturally prevented.",
            },
            {
              text: "Read the governance pages on the public website",
              subtext: "/governance, /trust, /for-regulators, /for-enterprises",
            },
            {
              text: "Accept that customization requests will not be honored",
              subtext: "WebWaka is governed, not customizable. Partner-specific modifications are not available.",
            },
          ]}
          notice={{
            type: 'warning',
            text: "Partners who do not align with WebWaka governance philosophy should not proceed. This is intentional filtering, not a barrier to fix.",
          }}
        />
        
        {/* Section 2: Demo Preparation */}
        <ChecklistSection
          icon={Eye}
          title="2. Demo Preparation"
          description="Prepare to demonstrate WebWaka to your prospects"
          items={[
            {
              text: "Access the Demo Credentials Panel on the login page",
              subtext: "Visit /login?demo=true to see available demo accounts for all 14 verticals.",
            },
            {
              text: "Review the Demo Credentials Portal",
              subtext: "Visit /demo/credentials?demo=true for a complete listing of all demo accounts and roles.",
            },
            {
              text: "Study the Sales Demo Playbooks",
              subtext: "Visit /demo/playbooks?demo=true for structured scripts to guide prospect demonstrations.",
            },
            {
              text: "Practice with Guided Demo Mode",
              subtext: "Visit /demo/guided?demo=true to understand the UI hint system available during demos.",
            },
            {
              text: "Identify which verticals are relevant to your market",
              subtext: "Focus demo preparation on verticals you intend to sell (e.g., Commerce, Education, Health).",
            },
            {
              text: "Understand demo data is fictional but realistic",
              subtext: "Demo tenants contain pre-seeded Nigerian data. This is not real customer data.",
            },
            {
              text: "Know the demo password",
              subtext: "All demo accounts use the shared password: Demo2026!",
            },
          ]}
          notice={{
            type: 'info',
            text: "Demo environments are fully functional but isolated. Demo data cannot migrate to production. Demo and production are architecturally separate.",
          }}
        />
        
        {/* Section 3: Domain Readiness */}
        <ChecklistSection
          icon={Globe}
          title="3. Domain Readiness"
          description="Prepare for domain configuration and white-label deployment"
          items={[
            {
              text: "Understand domain lifecycle states",
              subtext: "Domains progress through PENDING → ACTIVE → (possibly SUSPENDED). Each state has specific behaviors.",
            },
            {
              text: "Prepare DNS access for custom domains",
              subtext: "You will need to add CNAME or TXT records for domain verification.",
            },
            {
              text: "Identify domains you plan to use",
              subtext: "Custom domains (partner.yourcompany.com) or subdomains (tenant.webwaka.com).",
            },
            {
              text: "Understand multi-suite domain capabilities",
              subtext: "A single domain can serve multiple suites. You must declare enabled suites upfront.",
            },
            {
              text: "Review domain governance implications",
              subtext: "Visit /partners/admin to see how domain status is monitored (read-only).",
            },
            {
              text: "Accept that domain changes require platform approval",
              subtext: "Partners cannot self-service domain configuration. All changes go through governance review.",
            },
          ]}
          notice={{
            type: 'warning',
            text: "Domain activation is not instant. PENDING state is enforced until verification is complete. Do not promise immediate domain activation to clients.",
          }}
        />
        
        {/* Section 4: Client Engagement Rules */}
        <ChecklistSection
          icon={Users}
          title="4. Client Engagement Rules"
          description="How to properly engage and onboard your clients"
          items={[
            {
              text: "Set clear expectations about governance constraints",
              subtext: "Clients must understand that WebWaka behavior is locked. No custom features per client.",
            },
            {
              text: "Do not promise features that do not exist",
              subtext: "Only commit to capabilities that are currently implemented and frozen.",
            },
            {
              text: "Explain the Commerce Boundary to clients",
              subtext: "Clients should understand that verticals record facts, not process payments directly.",
            },
            {
              text: "Communicate audit and compliance posture",
              subtext: "WebWaka is audit-first. All actions are logged. This is a feature, not a limitation.",
            },
            {
              text: "Be transparent about demo vs production separation",
              subtext: "Demo data does not convert to production. Clients start fresh after evaluation.",
            },
            {
              text: "Do not bypass platform governance",
              subtext: "If a client needs something WebWaka doesn't provide, they may not be the right fit.",
            },
            {
              text: "Document client vertical and suite requirements",
              subtext: "Know which suites each client needs before requesting tenant provisioning.",
            },
          ]}
          notice={{
            type: 'info',
            text: "Quality over volume. WebWaka's partner model filters for governance-aligned clients. Churn from misaligned expectations is preventable.",
          }}
        />
        
        {/* Section 5: Escalation & Approval Paths */}
        <ChecklistSection
          icon={Scale}
          title="5. Escalation & Approval Paths"
          description="How to request changes, report issues, and get support"
          items={[
            {
              text: "Understand that all partner actions require platform approval",
              subtext: "Tenant creation, domain activation, and configuration changes are not self-service.",
            },
            {
              text: "Know how to request tenant provisioning",
              subtext: "Contact your WebWaka representative with: client name, vertical(s), domain preference, user roles.",
            },
            {
              text: "Know how to request domain activation",
              subtext: "Submit domain verification evidence. Platform reviews and activates upon approval.",
            },
            {
              text: "Know how to report issues",
              subtext: "Document the issue clearly: tenant, user, action attempted, expected vs actual behavior.",
            },
            {
              text: "Understand suspension and governance actions",
              subtext: "If a domain or tenant is suspended, contact platform support immediately. Do not attempt workarounds.",
            },
            {
              text: "Do not escalate governance constraints as bugs",
              subtext: "Locked behavior is intentional. Governance limitations are not issues to be fixed.",
            },
            {
              text: "Know your WebWaka partner contact",
              subtext: "Establish a clear communication channel with your assigned platform representative.",
            },
          ]}
          notice={{
            type: 'warning',
            text: "There is no self-service partner portal for production changes. This is by design. Manual approval ensures governance integrity.",
          }}
        />
        
        {/* Final Guidance */}
        <div className="bg-slate-100 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Governance Acknowledgment</h3>
              <p className="text-sm text-slate-600 mb-4">
                By proceeding as a WebWaka partner, you acknowledge that:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>WebWaka operates under v2-FREEZE discipline with locked business logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>Partner-specific customizations are not available and will not be developed</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>All production changes require platform approval through governance review</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>Demo environments are for evaluation only and do not convert to production</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>You will communicate governance constraints honestly to your clients</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Checklist Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-900">This Checklist Does Not:</div>
            <ul className="text-sm text-amber-700 mt-2 space-y-1">
              <li>• Track or store your completion progress</li>
              <li>• Grant access or permissions of any kind</li>
              <li>• Trigger any system actions or workflows</li>
              <li>• Constitute a binding agreement or contract</li>
              <li>• Replace formal partner onboarding communication</li>
            </ul>
            <p className="text-sm text-amber-700 mt-3">
              This is informational guidance only. Partner activation requires direct coordination 
              with your WebWaka representative.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-400">
            WebWaka Partner Onboarding Checklist • Guidance Only • No System Actions
          </p>
        </div>
      </div>
    </div>
  )
}
