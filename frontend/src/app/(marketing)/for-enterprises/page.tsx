/**
 * For Enterprises Page
 * 
 * P2-B Trust Amplification
 * 
 * PURPOSE: Clear entry point for enterprises, procurement teams, and compliance officers.
 * TONE: Institutional, calm, procurement-friendly, risk-reducing.
 * 
 * This page speaks to legal, compliance, and procurement reviewers.
 */

import Link from 'next/link'
import { 
  Shield, Building2, Lock, CheckCircle, ArrowRight,
  FileCheck, Scale, Eye, Users, Server, Globe
} from 'lucide-react'

export const metadata = {
  title: 'For Enterprises — WebWaka Platform',
  description: 'Enterprise-grade infrastructure with governance guarantees. Reduce adoption risk with audit-first architecture.',
}

const riskReductions = [
  {
    risk: 'Vendor Lock-in',
    mitigation: 'Partner-operated model. Your Partner owns the relationship. Data export available.',
    icon: Users,
  },
  {
    risk: 'Platform Instability',
    mitigation: 'v2-FROZEN suites have locked interfaces. Changes are governed, versioned, and non-breaking.',
    icon: Lock,
  },
  {
    risk: 'Audit Failures',
    mitigation: 'Append-only records, immutable audit trails, and commerce boundary isolation by design.',
    icon: Eye,
  },
  {
    risk: 'Regulatory Non-Compliance',
    mitigation: 'Nigeria-first defaults (NGN, VAT, local regulations). Transparency reporting built-in.',
    icon: Scale,
  },
  {
    risk: 'Data Security',
    mitigation: 'Multi-tenant isolation, encrypted sensitive fields, access-controlled by role.',
    icon: Shield,
  },
  {
    risk: 'Operational Disruption',
    mitigation: 'Offline-first architecture. Works without internet, syncs when connected.',
    icon: Globe,
  },
]

const governanceGuarantees = [
  {
    guarantee: 'Interface Stability',
    description: 'v2-FROZEN means API contracts are locked. Your integrations will not break due to platform changes.',
  },
  {
    guarantee: 'Commerce Isolation',
    description: 'All financial execution flows through Commerce Suite. Vertical suites emit facts only. One auditable financial layer.',
  },
  {
    guarantee: 'Append-Only Audit',
    description: 'Critical records cannot be modified or deleted. Audit trails are immutable by architecture, not policy.',
  },
  {
    guarantee: 'Change Governance',
    description: 'Schema changes, capability removals, and boundary modifications require explicit governance approval.',
  },
]

const procurementFacts = [
  { label: 'Platform Operator', value: 'HandyLife Digital (Nigeria)' },
  { label: 'Delivery Model', value: 'Partner-operated (local support)' },
  { label: 'Data Jurisdiction', value: 'Nigeria-first (configurable)' },
  { label: 'v2-FROZEN Verticals', value: '14 production-ready suites' },
  { label: 'Governance Model', value: 'Platform Standardisation v2' },
  { label: 'Uptime Target', value: '99.9%' },
]

export default function ForEnterprisesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-slate-900 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              For Enterprises & Institutions
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Reduce Adoption Risk
            </h1>

            <p className="text-lg text-slate-300 mb-6">
              WebWaka is enterprise infrastructure with governance guarantees. Our architecture reduces risk by making stability, auditability, and compliance structural—not aspirational.
            </p>

            <p className="text-slate-400 mb-8">
              This page is for procurement teams, compliance officers, and technical evaluators.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link 
                href="/governance"
                className="px-5 py-2.5 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Governance Overview
              </Link>
              <Link 
                href="/suites"
                className="px-5 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                View 14 Suites
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Message */}
      <section className="py-6 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800">
              <strong>Core Principle:</strong> Governance is architecture, not policy. Stability is structural, not promised.
            </p>
          </div>
        </div>
      </section>

      {/* Risk Reduction */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How WebWaka Reduces Risk</h2>
            <p className="text-gray-600">
              Each risk is addressed by architecture, not just policy or promise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {riskReductions.map((item) => (
              <div key={item.risk} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Risk</p>
                    <p className="font-semibold text-gray-900">{item.risk}</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 uppercase font-medium mb-1">Mitigation</p>
                  <p className="text-sm text-gray-700">{item.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance Guarantees */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Governance Guarantees</h2>
            <p className="text-gray-600">
              These are architectural guarantees, verifiable through platform inspection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {governanceGuarantees.map((g) => (
              <div key={g.guarantee} className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{g.guarantee}</h3>
                    <p className="text-sm text-gray-600">{g.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Procurement Facts */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Procurement Reference</h2>
            <p className="text-gray-600">
              Key facts for procurement and vendor evaluation.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-slate-200">
                {procurementFacts.map((fact) => (
                  <tr key={fact.label}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-500 bg-slate-100 w-1/3">{fact.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{fact.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Partner Model Explanation */}
      <section className="py-12 md:py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Partner-Operated Model</h2>
            <p className="text-slate-300 mb-6">
              WebWaka does not sell directly to end organizations. Local Partners configure, deploy, and support platforms. This means:
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left mb-8">
              {[
                { title: 'Local Support', desc: 'Your Partner speaks your language and understands your context.' },
                { title: 'Relationship Ownership', desc: 'Your Partner owns the client relationship, not WebWaka.' },
                { title: 'Customized Pricing', desc: 'Partners set pricing appropriate for your market.' },
              ].map((item) => (
                <div key={item.title} className="bg-slate-800 rounded-xl p-4">
                  <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link 
              href="/partners"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-all"
            >
              Learn About Partners
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Documentation</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/for-regulators" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Scale className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">For Regulators</h3>
              <p className="text-sm text-gray-600">Audit and compliance features</p>
            </Link>
            <Link href="/governance/freeze-registry" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Lock className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">FREEZE Registry</h3>
              <p className="text-sm text-gray-600">Verifiable list of frozen suites</p>
            </Link>
            <Link href="/platform" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Server className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Platform Architecture</h3>
              <p className="text-sm text-gray-600">Why WebWaka is infrastructure</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
