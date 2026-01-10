/**
 * Partner Extension Map
 * 
 * P2-C Partner Activation
 * 
 * PURPOSE: Visual map showing where partners can extend and where they cannot.
 * Core platform (LOCKED), Vertical facts layer (EXTENSIBLE), Commerce (EXTERNAL),
 * UI/workflows (PARTNER-EXTENDABLE).
 */

import Link from 'next/link'
import { 
  ArrowLeft, Lock, Unlock, Shield, Layers, Database,
  Wallet, Layout, Code, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'

export const metadata = {
  title: 'Extension Map — WebWaka Partners',
  description: 'Where partners can extend WebWaka and where they cannot. Visual architecture guide.',
}

const layers = [
  {
    name: 'Core Platform',
    status: 'LOCKED',
    icon: Lock,
    color: 'red',
    description: 'Database schema, authentication, multi-tenancy, security',
    partnerAccess: 'None',
    examples: ['User authentication', 'Organization isolation', 'Permission system', 'Audit logging'],
    why: 'Core platform integrity must be preserved for all clients.',
  },
  {
    name: 'Suite Capabilities',
    status: 'FROZEN',
    icon: Shield,
    color: 'blue',
    description: '14 v2-FROZEN vertical suite behaviors and APIs',
    partnerAccess: 'Read-only via APIs',
    examples: ['Education grading logic', 'Health prescription rules', 'Church safeguards', 'Commerce checkout'],
    why: 'Suite behavior must be predictable for clients and regulators.',
  },
  {
    name: 'Vertical Facts Layer',
    status: 'EXTENSIBLE',
    icon: Database,
    color: 'emerald',
    description: 'Facts emitted by verticals (fees, charges, donations, etc.)',
    partnerAccess: 'Subscribe via webhooks, query via APIs',
    examples: ['Fee fact notifications', 'Donation summaries', 'Attendance aggregates', 'Transaction events'],
    why: 'Partners can build on facts without affecting core behavior.',
  },
  {
    name: 'Commerce Execution',
    status: 'EXTERNAL',
    icon: Wallet,
    color: 'purple',
    description: 'Payment processing, invoicing, settlements',
    partnerAccess: 'Integration via Commerce APIs',
    examples: ['Payment gateway integration', 'Invoice generation', 'Settlement reporting', 'VAT calculation'],
    why: 'Financial execution is centralized for audit safety.',
  },
  {
    name: 'UI & Workflows',
    status: 'PARTNER-EXTENDABLE',
    icon: Layout,
    color: 'teal',
    description: 'Custom dashboards, reports, client-facing interfaces',
    partnerAccess: 'Build custom UIs consuming APIs',
    examples: ['Custom dashboards', 'Branded reports', 'Client portals', 'Mobile apps'],
    why: 'Partners can differentiate through UI without affecting data integrity.',
  },
]

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  LOCKED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  FROZEN: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  EXTENSIBLE: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  EXTERNAL: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'PARTNER-EXTENDABLE': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
}

const extensionRules = [
  { allowed: true, rule: 'Build custom UIs that consume WebWaka APIs' },
  { allowed: true, rule: 'Subscribe to webhook events for facts' },
  { allowed: true, rule: 'Integrate payment providers via Commerce APIs' },
  { allowed: true, rule: 'Create custom reports from exported data' },
  { allowed: true, rule: 'Build mobile apps using API endpoints' },
  { allowed: false, rule: 'Modify v2-FROZEN suite behavior' },
  { allowed: false, rule: 'Access database directly' },
  { allowed: false, rule: 'Bypass Commerce Boundary for payments' },
  { allowed: false, rule: 'Disable safeguards or audit logging' },
  { allowed: false, rule: 'Create new capabilities without governance' },
]

export default function ExtensionMapPage() {
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
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Extension Map</h1>
              <p className="text-slate-400">Where partners can extend WebWaka</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Map */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Platform Architecture Layers</h2>
            <p className="text-gray-600 text-sm">
              Each layer has different extension rules. Partners must respect these boundaries.
            </p>
          </div>

          {/* Layers Stack */}
          <div className="space-y-4">
            {layers.map((layer, index) => {
              const colors = statusColors[layer.status]
              return (
                <div 
                  key={layer.name}
                  className={`rounded-xl border-2 ${colors.border} overflow-hidden`}
                >
                  <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <layer.icon className={`w-5 h-5 ${colors.text}`} />
                      <span className="font-semibold text-gray-900">{layer.name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                      {layer.status}
                    </span>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-sm text-gray-600 mb-3">{layer.description}</p>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">Partner Access</p>
                        <p className="text-sm text-gray-900">{layer.partnerAccess}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">Examples</p>
                        <div className="flex flex-wrap gap-1">
                          {layer.examples.slice(0, 3).map((ex) => (
                            <span key={ex} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">Why This Boundary</p>
                        <p className="text-xs text-gray-600">{layer.why}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Extension Rules */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Extension Rules Summary</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Partners CAN
              </h3>
              <ul className="space-y-2">
                {extensionRules.filter((r: any) => r.allowed).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {r.rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Partners CANNOT
              </h3>
              <ul className="space-y-2">
                {extensionRules.filter((r: any) => !r.allowed).map((r, i) => (
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

      {/* API Access Note */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">API Access is Governed</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Access to WebWaka APIs requires partner authentication. API usage is logged and audited. Misuse of APIs (attempting to bypass boundaries) may result in access revocation.
                </p>
                <p className="text-xs text-gray-500">
                  Partners are responsible for implementing secure API consumption practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
