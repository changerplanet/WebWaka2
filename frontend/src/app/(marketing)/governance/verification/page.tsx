/**
 * Trust Verification Page
 * 
 * P2-B Trust Amplification
 * 
 * PURPOSE: Explain how to verify WebWaka claims independently.
 * TONE: Factual, empowering, non-defensive.
 * 
 * This page shows we welcome scrutiny.
 */

import Link from 'next/link'
import { 
  ArrowLeft, CheckCircle, Eye, Shield, Database,
  Code, FileText, Terminal, Lock
} from 'lucide-react'

export const metadata = {
  title: 'Trust Verification — WebWaka Governance',
  description: 'How to verify WebWaka claims independently. We welcome scrutiny.',
}

const verifiableClaims = [
  {
    claim: '14 v2-FROZEN External Verticals',
    verification: 'Visit /suites and click each demo link. Count the functional suites.',
    evidence: '/governance/freeze-registry',
  },
  {
    claim: 'Commerce Boundary Enforcement',
    verification: 'Call any vertical API endpoint. Check response for _commerce_boundary: FACTS_ONLY marker.',
    evidence: '/governance/commerce-boundary',
  },
  {
    claim: 'Append-Only Audit Records',
    verification: 'Attempt to DELETE or UPDATE an audit log record. Observe 403 FORBIDDEN response.',
    evidence: '/governance/audit-first',
  },
  {
    claim: 'Regulator Access Logging',
    verification: 'Request access log export for any organization. Verify timestamp, IP, and purpose fields.',
    evidence: '/for-regulators',
  },
  {
    claim: 'Evidence Bundle Integrity',
    verification: 'Call verifyIntegrity endpoint on a sealed bundle. Compare stored vs computed hash.',
    evidence: '/governance/audit-first',
  },
  {
    claim: 'Nigeria-First Defaults',
    verification: 'Create a transaction. Verify NGN currency and 7.5% VAT calculation.',
    evidence: '/governance/nigeria-first',
  },
]

const whatWeDoNotClaim = [
  'We do not claim to be a payment processor. Commerce Suite integrates with payment providers.',
  'We do not claim to provide legal advice. Compliance is the responsibility of each organization.',
  'We do not claim 100% uptime. Our target is 99.9% with transparent incident reporting.',
  'We do not claim Partners can build anything. Partner boundaries are explicitly documented.',
  'We do not claim features that are PLANNED. Only LIVE and DEMO features are in production.',
]

export default function VerificationPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/governance" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Governance
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Trust Verification</h1>
              <p className="text-slate-400">How to verify our claims independently</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principle */}
      <section className="py-6 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-emerald-800 text-sm text-center">
            <strong>Our Position:</strong> Trust is earned through verifiability, not claimed through marketing. We welcome scrutiny.
          </p>
        </div>
      </section>

      {/* Verifiable Claims */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Claims You Can Verify</h2>
            <p className="text-gray-600">
              Each of these claims can be independently verified through platform inspection.
            </p>
          </div>

          <div className="space-y-4">
            {verifiableClaims.map((item) => (
              <div key={item.claim} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">Claim</p>
                    <p className="font-semibold text-gray-900">{item.claim}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">How to Verify</p>
                    <p className="text-sm text-gray-700">{item.verification}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-1">Documentation</p>
                    <Link href={item.evidence} className="text-sm text-blue-600 hover:underline">
                      View evidence →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do NOT Claim */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">What We Do NOT Claim</h2>
            <p className="text-gray-600">
              Transparency includes being explicit about what we are not.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <ul className="space-y-3">
              {whatWeDoNotClaim.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How to Report Issues */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Eye className="w-8 h-8 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">Found a Discrepancy?</h2>
            <p className="text-gray-600 text-sm mb-6">
              If you find that any claim on this website does not match platform reality, we want to know.
            </p>
            <div className="bg-slate-50 rounded-xl p-5">
              <p className="text-sm text-gray-700 mb-4">
                Contact your Partner or reach HandyLife Digital directly. We take discrepancies between claims and reality seriously.
              </p>
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all"
              >
                Report a Discrepancy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Documentation</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/governance/freeze-registry" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Lock className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">FREEZE Registry</h3>
              <p className="text-sm text-gray-600">Canonical list of frozen suites</p>
            </Link>
            <Link href="/for-regulators" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Shield className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">For Regulators</h3>
              <p className="text-sm text-gray-600">Audit and compliance features</p>
            </Link>
            <Link href="/governance" className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 transition-all group">
              <Database className="w-5 h-5 text-slate-600 mb-2" />
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Governance Overview</h3>
              <p className="text-sm text-gray-600">How WebWaka governs change</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
