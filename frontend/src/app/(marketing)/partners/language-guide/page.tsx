/**
 * Partner Language Guide
 * 
 * P2-C Partner Activation
 * 
 * PURPOSE: How partners must describe WebWaka. Approved phrases,
 * forbidden phrases, required disclaimers, demo usage rules.
 * 
 * This protects the platform legally and reputationally.
 */

import Link from 'next/link'
import { 
  ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle,
  MessageSquare, FileText, Eye
} from 'lucide-react'

export const metadata = {
  title: 'Language Guide — WebWaka Partners',
  description: 'How to describe WebWaka correctly. Approved and forbidden phrases, required disclaimers.',
}

const approvedPhrases = [
  '"WebWaka is platform infrastructure for digital transformation."',
  '"WebWaka provides 14 industry-specific suite configurations."',
  '"Partners configure and support WebWaka platforms for clients."',
  '"WebWaka follows a governance-first architecture."',
  '"Financial execution flows through the Commerce Suite."',
  '"Suite behavior is stable under FREEZE discipline."',
  '"WebWaka is designed with Nigerian regulatory awareness."',
  '"We are a WebWaka implementation partner."',
]

const forbiddenPhrases = [
  '"WebWaka is the best/leading/top platform..." (superlatives without evidence)',
  '"WebWaka can do anything you need" (over-promising)',
  '"We are certified WebWaka partners" (no certification exists)',
  '"WebWaka guarantees compliance" (compliance is client responsibility)',
  '"WebWaka processes payments" (Commerce Suite integrates with processors)',
  '"We can customize WebWaka for you" (core behavior is FROZEN)',
  '"Coming soon: [feature]" (roadmap speculation)',
  '"WebWaka is better than [competitor]" (competitive claims)',
]

const requiredDisclaimers = [
  {
    context: 'When discussing compliance',
    disclaimer: '"WebWaka provides infrastructure that supports compliance. Actual compliance is the responsibility of each organization. WebWaka does not provide legal or regulatory advice."',
  },
  {
    context: 'When discussing payments',
    disclaimer: '"Payment processing is handled by integrated payment providers via the Commerce Suite. WebWaka is not a payment processor."',
  },
  {
    context: 'When discussing partner status',
    disclaimer: '"Partner status indicates a business relationship with WebWaka. It does not constitute certification, endorsement, or warranty."',
  },
  {
    context: 'When discussing uptime',
    disclaimer: '"WebWaka targets 99.9% uptime. Actual availability may vary. Service level commitments are specified in partner agreements."',
  },
]

const demoUsageRules = [
  {
    allowed: true,
    rule: 'Show demos to prospective clients to illustrate capabilities',
  },
  {
    allowed: true,
    rule: 'Use demo data (not real client data) for presentations',
  },
  {
    allowed: true,
    rule: 'Explain that demos represent production-ready functionality',
  },
  {
    allowed: false,
    rule: 'Claim demo features are "customized for this client"',
  },
  {
    allowed: false,
    rule: 'Imply capabilities exist that are marked PLANNED',
  },
  {
    allowed: false,
    rule: 'Use demos to misrepresent pricing or terms',
  },
  {
    allowed: false,
    rule: 'Record/share demos without context about demo status',
  },
]

export default function LanguageGuidePage() {
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
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Language Guide</h1>
              <p className="text-slate-400">How to describe WebWaka correctly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="py-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 text-sm">
              <strong>Misrepresentation of WebWaka capabilities may result in partnership termination.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Approved vs Forbidden */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Approved Phrases */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Approved Phrases
              </h2>
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                <ul className="space-y-3">
                  {approvedPhrases.map((phrase, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700 italic">{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Forbidden Phrases */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Forbidden Phrases
              </h2>
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <ul className="space-y-3">
                  {forbiddenPhrases.map((phrase, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700 italic">{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Required Disclaimers */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Required Disclaimers
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            When discussing these topics, partners must include the following disclaimers:
          </p>

          <div className="space-y-4">
            {requiredDisclaimers.map((d, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-medium mb-2">{d.context}</p>
                <p className="text-sm text-gray-700 italic bg-slate-50 p-3 rounded-lg">
                  {d.disclaimer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Usage Rules */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-600" />
            Demo Usage Rules
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <h3 className="font-semibold text-gray-900 mb-3">Allowed</h3>
              <ul className="space-y-2">
                {demoUsageRules.filter((r: any) => r.allowed).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {r.rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 rounded-xl p-5 border border-red-200">
              <h3 className="font-semibold text-gray-900 mb-3">Not Allowed</h3>
              <ul className="space-y-2">
                {demoUsageRules.filter((r: any) => !r.allowed).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {r.rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-12 md:py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Why Language Matters</h2>
          <p className="text-slate-300 text-sm mb-6">
            Consistent, accurate language protects everyone:
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-white text-sm mb-1">Clients</h3>
              <p className="text-slate-400 text-xs">Make informed decisions based on accurate information.</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-white text-sm mb-1">Partners</h3>
              <p className="text-slate-400 text-xs">Avoid liability from over-promising or misrepresentation.</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-white text-sm mb-1">Platform</h3>
              <p className="text-slate-400 text-xs">Maintains trust and governance integrity.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
