/**
 * Partner Playbooks
 * 
 * P2-C Partner Activation
 * 
 * PURPOSE: Role-specific guidance for different partner types.
 * Each playbook answers: What you can build, what you cannot touch,
 * how FREEZE protects you, how Commerce Boundary protects you.
 */

import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, Shield, Lock, CheckCircle, XCircle,
  Building2, Heart, GraduationCap, Church, Vote, Wallet,
  Server, BarChart3, Scale, BookOpen
} from 'lucide-react'

export const metadata = {
  title: 'Partner Playbooks — WebWaka Platform',
  description: 'Role-specific guidance for WebWaka Partners. Implementation, Sector, Technology, and Advisory playbooks.',
}

const playbooks = [
  {
    id: 'implementation',
    title: 'Implementation Partners',
    icon: Building2,
    color: 'emerald',
    description: 'You configure, deploy, and support WebWaka platforms for clients.',
    canBuild: [
      'Configure suite capabilities per client',
      'Set up organizations and user accounts',
      'Create custom onboarding workflows',
      'Build training materials and documentation',
      'Provide first-line support',
      'Integrate with client systems via APIs',
    ],
    cannotTouch: [
      'Modify v2-FROZEN suite behavior',
      'Change Commerce Boundary logic',
      'Disable safeguards (minors, confidentiality)',
      'Access other partners\' client data',
      'Create new verticals or capabilities',
    ],
    freezeProtection: 'Your implementation work remains valid. Suite behavior will not change unexpectedly.',
    commerceProtection: 'Financial logic is centralized. You are not responsible for payment processing errors.',
  },
  {
    id: 'sector',
    title: 'Sector Specialists',
    icon: Heart,
    color: 'blue',
    description: 'You have deep expertise in specific industries and serve those markets.',
    sectors: [
      { name: 'Health', icon: Heart, suite: 'Health Suite' },
      { name: 'Education', icon: GraduationCap, suite: 'Education Suite' },
      { name: 'Church', icon: Church, suite: 'Church Suite' },
      { name: 'Political', icon: Vote, suite: 'Political Suite' },
    ],
    canBuild: [
      'Deep sector-specific configurations',
      'Industry compliance workflows',
      'Sector-appropriate training',
      'Market-specific pricing',
      'Regulatory guidance (not legal advice)',
    ],
    cannotTouch: [
      'Modify sector-specific safeguards',
      'Bypass minors protection (Church, Education)',
      'Access confidential records (pastoral, medical)',
      'Change financial fact structures',
    ],
    freezeProtection: 'Sector capabilities are stable. Your expertise investment is protected.',
    commerceProtection: 'Sector suites emit facts only. You are isolated from financial execution risk.',
  },
  {
    id: 'technology',
    title: 'Technology Partners',
    icon: Server,
    color: 'purple',
    description: 'You provide complementary services that integrate via defined APIs.',
    integrationTypes: [
      { type: 'Payments', note: 'Via Commerce Suite APIs only', icon: Wallet },
      { type: 'Infrastructure', note: 'Hosting, CDN, security', icon: Server },
      { type: 'Analytics', note: 'BI, reporting, dashboards', icon: BarChart3 },
    ],
    canBuild: [
      'API integrations with Commerce Suite',
      'Webhook consumers for events',
      'Analytics dashboards on exported data',
      'Infrastructure enhancements',
    ],
    cannotTouch: [
      'Direct database access',
      'Bypass Commerce Boundary for payments',
      'Modify core platform behavior',
      'Access data outside your integration scope',
    ],
    freezeProtection: 'API contracts are versioned and stable. Your integrations will not break.',
    commerceProtection: 'Payment integrations go through Commerce Suite. Liability is clearly bounded.',
  },
  {
    id: 'advisory',
    title: 'Advisory Partners',
    icon: Scale,
    color: 'slate',
    description: 'You advise organizations on digital transformation and recommend appropriate solutions.',
    canBuild: [
      'Digital transformation strategies',
      'Platform selection recommendations',
      'Change management programs',
      'Compliance readiness assessments',
      'Training and adoption support',
    ],
    cannotTouch: [
      'Make technical promises on behalf of WebWaka',
      'Guarantee specific outcomes',
      'Bypass governance for "special cases"',
      'Claim certification or endorsement',
    ],
    freezeProtection: 'Your recommendations are based on stable, documented capabilities.',
    commerceProtection: 'You can confidently recommend audit-safe financial architecture.',
  },
]

const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-100' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-100' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-100' },
  slate: { bg: 'bg-slate-600', text: 'text-slate-600', light: 'bg-slate-100' },
}

export default function PartnerPlaybooksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/partners/activate" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Activation
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Partner Playbooks</h1>
              <p className="text-slate-400">Role-specific guidance for governance-aligned partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Playbooks */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {playbooks.map((playbook) => {
              const colors = colorClasses[playbook.color]
              return (
                <div key={playbook.id} id={playbook.id} className="scroll-mt-24">
                  {/* Playbook Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl ${colors.light} flex items-center justify-center`}>
                      <playbook.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{playbook.title}</h2>
                      <p className="text-gray-600 text-sm">{playbook.description}</p>
                    </div>
                  </div>

                  {/* Sector Specialists - Show sectors */}
                  {playbook.sectors && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-3">Applicable Sectors:</p>
                      <div className="flex flex-wrap gap-2">
                        {playbook.sectors.map((s) => (
                          <span key={s.name} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg">
                            <s.icon className="w-3 h-3" />
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technology Partners - Show integration types */}
                  {playbook.integrationTypes && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-3">Integration Types:</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {playbook.integrationTypes.map((t) => (
                          <div key={t.type} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                              <t.icon className="w-4 h-4 text-slate-500" />
                              <span className="font-medium text-gray-900 text-sm">{t.type}</span>
                            </div>
                            <p className="text-xs text-gray-500">{t.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Can Build / Cannot Touch */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        What You Can Build
                      </h3>
                      <ul className="space-y-2">
                        {playbook.canBuild.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-3 h-3 text-emerald-500 mt-1 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        What You Cannot Touch
                      </h3>
                      <ul className="space-y-2">
                        {playbook.cannotTouch.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <XCircle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Protection */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900 text-sm">FREEZE Protection</span>
                      </div>
                      <p className="text-xs text-gray-600">{playbook.freezeProtection}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900 text-sm">Commerce Protection</span>
                      </div>
                      <p className="text-xs text-gray-600">{playbook.commerceProtection}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className="mt-12 border-slate-200" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Ready to Activate?</h2>
          <p className="text-slate-300 mb-6 text-sm">
            Return to the activation hub and complete your self-assessment.
          </p>
          <Link 
            href="/partners/activate#checklist"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-all"
          >
            Complete Self-Assessment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
