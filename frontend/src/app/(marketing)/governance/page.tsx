/**
 * WebWaka Governance Page
 * 
 * PURPOSE: Establish trust foundation. Explain why FREEZE exists,
 * how WebWaka governs change, and why this platform is regulator-safe.
 * 
 * This page reframes everything else on the site.
 * 
 * POSITIONING: Governance as Architecture, not afterthought.
 */

import Link from 'next/link'
import { 
  ArrowRight, Shield, Lock, FileCheck, Scale, Eye,
  Database, CheckCircle, AlertTriangle, Building2,
  Landmark, BookOpen, Users, Wallet
} from 'lucide-react'

export const metadata = {
  title: 'Governance — WebWaka Platform',
  description: 'Governance as architecture, not afterthought. Learn how WebWaka ensures audit-readiness, commerce isolation, and regulator-friendly design.',
}

const governancePillars = [
  {
    icon: Lock,
    title: 'Commerce Boundary',
    description: 'Verticals emit facts. Commerce handles money. One clean financial layer for auditors.',
    href: '/governance/commerce-boundary',
  },
  {
    icon: Database,
    title: 'Audit-First Design',
    description: 'Append-only records. Cryptographic integrity. Immutable audit trails.',
    href: '/governance/audit-first',
  },
  {
    icon: Landmark,
    title: 'Nigeria-First Compliance',
    description: 'CAC, FIRS, sector-specific regulations. Jurisdiction-aware from day one.',
    href: '/governance/nigeria-first',
  },
]

const freezeRules = [
  { allowed: true, item: 'Bug fixes (with explicit approval)' },
  { allowed: true, item: 'Security patches' },
  { allowed: true, item: 'Documentation corrections' },
  { allowed: true, item: 'Additive features (new version)' },
  { allowed: false, item: 'Schema changes to frozen tables' },
  { allowed: false, item: 'API contract modifications' },
  { allowed: false, item: 'Capability removals' },
  { allowed: false, item: 'Commerce boundary violations' },
]

const safeguards = [
  {
    icon: Users,
    title: 'Minors Safeguarding',
    description: 'Contact information for minors is protected. Guardian linkage enforced. Restricted access by default.',
  },
  {
    icon: Lock,
    title: 'Pastoral Confidentiality',
    description: 'Sensitive pastoral notes are encrypted, non-searchable, and access-logged. Confession-level privacy.',
  },
  {
    icon: Wallet,
    title: 'Financial Integrity',
    description: 'Giving records are append-only. No modifications. No deletions. Cryptographic evidence bundles.',
  },
  {
    icon: Eye,
    title: 'Regulator Access Logging',
    description: 'Every external inspection is logged with timestamp, IP, user-agent, and purpose. Full transparency.',
  },
]

export default function GovernancePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Platform Governance
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Governance as
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Architecture
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              At WebWaka, governance is not a compliance checkbox. It is infrastructure design. Every platform instance, every transaction, every record is built on a foundation of audit-readiness, commerce isolation, and jurisdictional awareness.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/commerce-demo?quickstart=regulator"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Regulator Demo
              </Link>
              <Link 
                href="/partners/playbook"
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
              >
                Partner Playbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Statement */}
      <section className="py-8 md:py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <blockquote className="text-center">
            <p className="text-lg md:text-xl text-slate-700 font-medium italic">
              "No gap between engineering truth and public narrative."
            </p>
            <footer className="mt-3 text-sm text-slate-500">
              — Platform Standardisation v2
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Three Governance Pillars
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Every platform instance on WebWaka is built on these non-negotiable foundations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {governancePillars.map((pillar) => (
              <Link
                key={pillar.title}
                href={pillar.href}
                className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <pillar.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{pillar.description}</p>
                <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  Learn more
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FREEZE Discipline */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
                <Lock className="w-4 h-4" />
                FREEZE Discipline
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Why v2-FROZEN Matters
              </h2>
              <p className="text-base text-gray-600 mb-6">
                When we say a suite is FROZEN, we mean the interface contract is locked. Partners can depend on stability. Clients can depend on consistency. Regulators can depend on predictability.
              </p>
              <p className="text-base text-gray-600 mb-6">
                FREEZE does not mean abandoned. It means mature. Changes are additive, versioned, and governed. We do not break what works.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <p className="text-emerald-800 text-sm font-medium">
                  📊 Current Status: 14 v2-FROZEN verticals operational
                </p>
              </div>
              <Link 
                href="/governance/freeze-registry"
                className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
              >
                View FREEZE Registry
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">FREEZE Rules</h3>
              <div className="space-y-3">
                {freezeRules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {rule.allowed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${rule.allowed ? 'text-gray-700' : 'text-red-700'}`}>
                      {rule.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commerce Boundary */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
              <Wallet className="w-4 h-4" />
              Commerce Boundary
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              One Layer for Money
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              In WebWaka, money flows through one place: the Commerce Suite. Industry verticals emit "facts" about what happened. They never touch payment processing, wallet management, or accounting.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-center">
              {/* Left: Verticals */}
              <div className="space-y-3">
                <h4 className="text-emerald-400 font-semibold text-sm uppercase tracking-wide mb-4">Verticals (Facts Only)</h4>
                {['Education', 'Health', 'Church', 'Logistics'].map((v) => (
                  <div key={v} className="bg-white/10 rounded-lg px-4 py-2 text-sm">
                    {v} Suite → Emits Facts
                  </div>
                ))}
              </div>

              {/* Middle: Arrow */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="hidden md:flex flex-col items-center">
                  <ArrowRight className="w-8 h-8 text-emerald-400" />
                  <span className="text-xs text-gray-400 mt-2">Facts flow</span>
                </div>
                <div className="md:hidden">
                  <ArrowRight className="w-6 h-6 text-emerald-400 rotate-90" />
                </div>
              </div>

              {/* Right: Commerce */}
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 md:p-6">
                <h4 className="text-emerald-400 font-semibold mb-3">Commerce Suite</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✓ Payment processing</li>
                  <li>✓ Wallet management</li>
                  <li>✓ Invoice generation</li>
                  <li>✓ Accounting journals</li>
                  <li>✓ VAT calculation</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm">
                <strong className="text-white">Result:</strong> Auditors see one clean financial layer. No shadow ledgers in Education. No rogue payment flows in Logistics. One truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safeguards */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Absolute Safeguards
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              High-trust verticals require high-trust infrastructure. These safeguards are non-negotiable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {safeguards.map((safeguard) => (
              <div 
                key={safeguard.title}
                className="bg-white rounded-xl p-6 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <safeguard.icon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{safeguard.title}</h3>
                <p className="text-gray-600 text-sm">{safeguard.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Regulators */}
      <section className="py-12 md:py-20 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              For Regulators
            </h2>
            <p className="text-base text-emerald-100 max-w-2xl mx-auto">
              WebWaka is designed with regulators in mind. We do not make it hard to regulate. We make it easy.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: 'Access Logging', desc: 'Every external inspection logged with timestamp, IP, and purpose' },
              { title: 'Transparency Reports', desc: 'Publishable compliance summaries per organization' },
              { title: 'Commerce Isolation', desc: 'All financial activity in one auditable layer' },
              { title: 'Jurisdictional Awareness', desc: 'Nigeria-first defaults (CAC, FIRS, sector regulations)' },
              { title: 'No Hidden Data', desc: 'Append-only architecture means complete audit trails' },
              { title: 'Evidence Bundles', desc: 'Cryptographically sealed, verifiable integrity' },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5">
                <h4 className="font-semibold text-white mb-2 text-sm">{item.title}</h4>
                <p className="text-emerald-100 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              href="/commerce-demo?quickstart=regulator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-all"
            >
              <Eye className="w-4 h-4" />
              Experience Regulator View
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-gray-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Build on Trusted Infrastructure
          </h2>
          <p className="text-base text-gray-300 mb-8">
            Join the Partner network. Deploy platforms that are audit-ready from day one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/suites"
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
            >
              View All 14 Suites
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
