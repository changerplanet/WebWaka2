/**
 * FREEZE Registry Page
 * 
 * P2-B Trust Amplification
 * 
 * PURPOSE: Verifiable, canonical list of all v2-FROZEN verticals.
 * TONE: Factual, institutional, auditable.
 * 
 * This page provides evidence that claims match reality.
 */

import Link from 'next/link'
import { 
  Lock, ArrowLeft, CheckCircle, Calendar, Shield,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck,
  Building, Briefcase, FolderKanban, Scale, Warehouse, Car,
  Vote, Church
} from 'lucide-react'

export const metadata = {
  title: 'FREEZE Registry — WebWaka Governance',
  description: 'Canonical list of all v2-FROZEN verticals on the WebWaka platform. Verifiable and auditable.',
}

const frozenVerticals = [
  {
    id: 'commerce',
    name: 'Commerce Suite',
    icon: Store,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'Constitutional Foundation',
    demo: '/commerce-demo',
    backendStatus: 'Production',
  },
  {
    id: 'education',
    name: 'Education Suite',
    icon: GraduationCap,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/education-demo',
    backendStatus: 'Production',
  },
  {
    id: 'health',
    name: 'Health Suite',
    icon: Heart,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/health-demo',
    backendStatus: 'Production',
  },
  {
    id: 'hospitality',
    name: 'Hospitality Suite',
    icon: Hotel,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/hospitality-demo',
    backendStatus: 'Production',
  },
  {
    id: 'civic',
    name: 'Civic / GovTech Suite',
    icon: Landmark,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/civic-demo',
    backendStatus: 'Production',
  },
  {
    id: 'logistics',
    name: 'Logistics Suite',
    icon: Truck,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/logistics-demo',
    backendStatus: 'Production',
  },
  {
    id: 'real-estate',
    name: 'Real Estate Suite',
    icon: Building,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/real-estate-demo',
    backendStatus: 'Production',
  },
  {
    id: 'recruitment',
    name: 'Recruitment Suite',
    icon: Briefcase,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/recruitment-demo',
    backendStatus: 'Production',
  },
  {
    id: 'project-management',
    name: 'Project Management Suite',
    icon: FolderKanban,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/project-demo',
    backendStatus: 'Production',
  },
  {
    id: 'legal-practice',
    name: 'Legal Practice Suite',
    icon: Scale,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/legal-demo',
    backendStatus: 'Production',
  },
  {
    id: 'warehouse',
    name: 'Advanced Warehouse Suite',
    icon: Warehouse,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/warehouse-demo',
    backendStatus: 'Production',
  },
  {
    id: 'parkhub',
    name: 'ParkHub (Transport) Suite',
    icon: Car,
    version: 'v2.0',
    frozenDate: '2025-12-15',
    classification: 'External Vertical',
    demo: '/parkhub-demo',
    backendStatus: 'Production',
  },
  {
    id: 'political',
    name: 'Political Suite',
    icon: Vote,
    version: 'v2.0',
    frozenDate: '2026-01-05',
    classification: 'External Vertical',
    demo: '/political-demo',
    backendStatus: 'Production',
  },
  {
    id: 'church',
    name: 'Church Suite',
    icon: Church,
    version: 'v2.0',
    frozenDate: '2026-01-08',
    classification: 'External Vertical',
    demo: '/church-demo',
    backendStatus: 'Production',
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

export default function FreezeRegistryPage() {
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
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">FREEZE Registry</h1>
              <p className="text-slate-400">Canonical list of v2-FROZEN verticals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explanation */}
      <section className="py-6 bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-blue-800 text-sm text-center">
            <strong>What FREEZE means:</strong> Interface contracts are locked. Partners and clients can depend on stability. Changes require new governance.
          </p>
        </div>
      </section>

      {/* Registry Table */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">v2-FROZEN Verticals ({frozenVerticals.length})</h2>
            <span className="text-sm text-gray-500">Last updated: January 8, 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Suite</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Frozen Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Classification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Backend</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Demo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frozenVerticals.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <v.icon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-gray-900">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {v.version}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.frozenDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.classification}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        {v.backendStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={v.demo} className="text-sm text-blue-600 hover:underline">
                        View Demo
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FREEZE Rules */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">FREEZE Rules</h2>
              <p className="text-gray-600 text-sm mb-6">
                Once a suite is v2-FROZEN, these rules govern what changes are permitted.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="space-y-3">
                  {freezeRules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {rule.allowed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${rule.allowed ? 'text-gray-700' : 'text-red-700'}`}>
                        {rule.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Why FREEZE Matters</h2>
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">For Partners</h3>
                  <p className="text-gray-600 text-xs">Integrations and training materials remain valid. No surprise changes.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">For Clients</h3>
                  <p className="text-gray-600 text-xs">Workflows and processes remain stable. Business continuity protected.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">For Regulators</h3>
                  <p className="text-gray-600 text-xs">Predictable audit surface. Known behavior. Documented interfaces.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">Verify This Registry</h2>
            <p className="text-gray-600 text-sm mb-6">
              This registry reflects the actual state of the platform. You can verify any entry by:
            </p>
            <div className="bg-slate-50 rounded-xl p-5 text-left">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Visiting the demo link and inspecting capabilities
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Checking API responses for version headers
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Requesting documentation from your Partner
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
