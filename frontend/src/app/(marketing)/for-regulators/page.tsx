/**
 * For Regulators Page
 * 
 * P2-B Trust Amplification
 * 
 * PURPOSE: Clear entry point for regulators, auditors, and compliance officers.
 * TONE: Institutional, calm, verifiable, non-promotional.
 * 
 * This page reduces perceived risk by making governance legible.
 */

import Link from 'next/link'
import { 
  Shield, Eye, Database, Lock, FileCheck, Scale,
  CheckCircle, ArrowRight, Landmark, ClipboardCheck,
  FileText, Users, Building2
} from 'lucide-react'

export const metadata = {
  title: 'For Regulators — WebWaka Platform',
  description: 'How WebWaka supports regulatory oversight. Audit-first design, append-only records, and transparent access logging.',
}

const auditCapabilities = [
  {
    title: 'Append-Only Records',
    description: 'Critical records (financial facts, governance decisions, evidence bundles) cannot be modified or deleted after creation.',
    verifiable: 'Inspect any record for createdAt timestamp and absence of updatedAt on protected tables.',
  },
  {
    title: 'Regulator Access Logging',
    description: 'Every external inspection is logged with timestamp, IP address, user-agent, access type, and stated purpose.',
    verifiable: 'Request access log export for any organization.',
  },
  {
    title: 'Evidence Bundle Integrity',
    description: 'Evidence bundles are sealed with SHA-256 cryptographic hashes. Tampering is detectable.',
    verifiable: 'Call verifyIntegrity endpoint on any sealed bundle.',
  },
  {
    title: 'Commerce Boundary Isolation',
    description: 'All financial execution flows through Commerce Suite. Vertical suites emit facts only.',
    verifiable: 'Inspect any vertical API response for _commerce_boundary: FACTS_ONLY marker.',
  },
]

const transparencyFeatures = [
  {
    feature: 'Transparency Reports',
    description: 'Organizations can publish periodic transparency reports covering membership, finances, and governance.',
    status: 'LIVE',
  },
  {
    feature: 'Compliance Records',
    description: 'Track regulatory compliance status, due dates, and evidence of compliance.',
    status: 'LIVE',
  },
  {
    feature: 'Governance Records',
    description: 'Board resolutions, policy changes, and voting records are immutable once approved.',
    status: 'LIVE',
  },
  {
    feature: 'Financial Disclosures',
    description: 'Aggregated financial summaries without individual donor/contributor exposure.',
    status: 'LIVE',
  },
]

const regulatoryContext = [
  { regulator: 'CAC', scope: 'Company registration, annual returns, beneficial ownership' },
  { regulator: 'FIRS', scope: 'VAT calculation (7.5%), tax exemption status, corporate tax' },
  { regulator: 'CBN', scope: 'Payment processing awareness (Commerce Suite only)' },
  { regulator: 'Sector', scope: 'Education, Health, Charity commission requirements' },
]

export default function ForRegulatorsPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-slate-900 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-sm font-medium mb-6">
              <Landmark className="w-4 h-4" />
              For Regulators & Auditors
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Designed for Oversight
            </h1>

            <p className="text-lg text-slate-300 mb-6">
              WebWaka is built with regulatory scrutiny in mind. Our architecture makes compliance verification straightforward, not adversarial.
            </p>

            <p className="text-slate-400 mb-8">
              This page explains how WebWaka supports regulatory oversight and what you can verify independently.
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
                href="/governance/freeze-registry"
                className="px-5 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                FREEZE Registry
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principle */}
      <section className="py-6 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800">
              <strong>Core Principle:</strong> WebWaka does not make regulatory compliance harder. It makes it architecturally easier.
            </p>
          </div>
        </div>
      </section>

      {/* What You Can Verify */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">What You Can Verify</h2>
            <p className="text-gray-600">
              These claims are verifiable through platform inspection, not marketing assertion.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {auditCapabilities.map((cap) => (
              <div key={cap.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900">{cap.title}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">{cap.description}</p>
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase font-medium mb-1">How to Verify</p>
                  <p className="text-sm text-gray-700">{cap.verifiable}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Features */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Transparency Features</h2>
            <p className="text-gray-600">
              Built-in features that support regulatory transparency requirements.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-slate-200">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Feature</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transparencyFeatures.map((f) => (
                  <tr key={f.feature}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.feature}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{f.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Nigerian Regulatory Context */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Nigerian Regulatory Awareness</h2>
            <p className="text-gray-600">
              WebWaka is designed with awareness of Nigerian regulatory requirements.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regulatoryContext.map((reg) => (
              <div key={reg.regulator} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-lg font-bold text-slate-700 mb-1">{reg.regulator}</div>
                <p className="text-xs text-gray-600">{reg.scope}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> WebWaka provides infrastructure that supports compliance. Actual compliance is the responsibility of each organization using the platform. WebWaka does not provide legal or regulatory advice.
            </p>
          </div>
        </div>
      </section>

      {/* How to Request Access */}
      <section className="py-12 md:py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Regulator Inquiries</h2>
            <p className="text-slate-300 mb-6">
              For formal regulatory inquiries, inspection requests, or compliance verification:
            </p>
            <div className="bg-slate-800 rounded-xl p-6">
              <p className="text-slate-300 text-sm mb-4">
                Contact the organization directly through their registered contact information, or reach HandyLife Digital (WebWaka operator) for platform-level inquiries.
              </p>
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-all"
              >
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Documentation</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/governance" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Shield className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Governance Overview</h3>
              <p className="text-sm text-gray-600">How WebWaka governs change</p>
            </Link>
            <Link href="/governance/freeze-registry" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Lock className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">FREEZE Registry</h3>
              <p className="text-sm text-gray-600">List of frozen verticals</p>
            </Link>
            <Link href="/governance/commerce-boundary" className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Scale className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Commerce Boundary</h3>
              <p className="text-sm text-gray-600">Facts vs. execution</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
