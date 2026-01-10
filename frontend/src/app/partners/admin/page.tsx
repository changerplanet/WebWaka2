'use client'

/**
 * Partner Admin Page - Read-Only
 * 
 * Partner-visible, read-only admin UI.
 * NO MUTATIONS. NO FORMS. NO API CALLS.
 * 
 * @route /partners/admin
 * @phase Partner Domain Governance Layer
 */

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  Building2,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  Layers,
} from 'lucide-react'
import {
  getDomainsForPartner,
  getLifecycleStateDisplay,
  type DomainConfig,
  type DomainLifecycleState,
} from '@/lib/domains/registry'

// =============================================================================
// DEMO PARTNER DATA (READ-ONLY)
// =============================================================================

const DEMO_PARTNER = {
  name: 'WebWaka Demo Partner',
  slug: 'webwaka-demo-partner',
  status: 'ACTIVE' as const,
  type: 'INTEGRATOR' as const,
  verified: true,
  createdAt: '2026-01-01T00:00:00Z',
}

// =============================================================================
// LIFECYCLE STATE BADGE COMPONENT
// =============================================================================

function LifecycleStateBadge({ state }: { state: DomainLifecycleState }) {
  const display = getLifecycleStateDisplay(state)
  
  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  }
  
  const icons = {
    green: CheckCircle2,
    amber: Clock,
    red: XCircle,
  }
  const IconComponent = icons[display.color as keyof typeof icons]
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[display.color as keyof typeof colorClasses]}`}>
      {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
      {display.label}
    </span>
  )
}

// =============================================================================
// DOMAIN ROW COMPONENT
// =============================================================================

function DomainRow({ domain }: { domain: DomainConfig }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-900">{domain.domain}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <LifecycleStateBadge state={domain.lifecycle_state} />
      </td>
      <td className="px-4 py-3">
        <span className="text-slate-600 text-sm">{domain.tenant_slug}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {domain.enabled_suites.map((suite) => (
            <span
              key={suite}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                suite === domain.primary_suite
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {suite === domain.primary_suite && <span className="mr-1">★</span>}
              {suite}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        {domain.regulator_mode ? (
          <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
            <Eye className="w-3.5 h-3.5" />
            Regulator
          </span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {domain.last_verified ? (
          <span className="text-slate-500 text-sm">
            {new Date(domain.last_verified).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        )}
      </td>
    </tr>
  )
}

// =============================================================================
// MAIN PAGE CONTENT
// =============================================================================

function PartnerAdminContent() {
  const searchParams = useSearchParams()
  const isDemoMode = searchParams.get('demo') === 'true'
  
  // Get domains for demo partner (read-only)
  const domains = getDomainsForPartner(DEMO_PARTNER.slug)
  
  // Count by lifecycle state
  const activeDomains = domains.filter((d: any) => d.lifecycle_state === 'ACTIVE').length
  const pendingDomains = domains.filter((d: any) => d.lifecycle_state === 'PENDING').length
  const suspendedDomains = domains.filter((d: any) => d.lifecycle_state === 'SUSPENDED').length
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Partner Administration</h1>
                <p className="text-sm text-slate-500">Read-only domain governance view</p>
              </div>
            </div>
            
            {isDemoMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                <Eye className="w-4 h-4" />
                Demo Mode
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Partner Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">{DEMO_PARTNER.name}</h2>
              <p className="text-sm text-slate-500">Partner Slug: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{DEMO_PARTNER.slug}</code></p>
            </div>
            <div className="flex items-center gap-2">
              {DEMO_PARTNER.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {DEMO_PARTNER.type}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {DEMO_PARTNER.status}
              </span>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeDomains}</div>
              <div className="text-sm text-slate-500">Active Domains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingDomains}</div>
              <div className="text-sm text-slate-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{suspendedDomains}</div>
              <div className="text-sm text-slate-500">Suspended</div>
            </div>
          </div>
        </div>
        
        {/* Domains Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-900">Domain Registry</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">All domains associated with this partner</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Enabled Suites</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Regulator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Verified</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <DomainRow key={domain.domain} domain={domain} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Governance Notices */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-900">Governance Notice</div>
              <p className="text-sm text-blue-700 mt-1">
                Domains are governed by WebWaka FREEZE rules. Domain lifecycle changes, 
                suite enablement, and regulator access are controlled by platform governance.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-900">Read-Only Access</div>
              <p className="text-sm text-amber-700 mt-1">
                This is a read-only view. Changes to domain configuration require platform approval 
                and are subject to governance review. Contact your WebWaka representative for modifications.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-700">Lifecycle State Definitions</div>
              <ul className="text-sm text-slate-600 mt-2 space-y-1">
                <li><strong>Active:</strong> Domain is live and resolves normally</li>
                <li><strong>Pending:</strong> Domain activation is in progress</li>
                <li><strong>Suspended:</strong> Domain access has been suspended pending review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-400">
            WebWaka Partner Administration • Read-Only View • All changes logged
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PAGE EXPORT WITH SUSPENSE
// =============================================================================

export default function PartnerAdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading partner administration...</div>
      </div>
    }>
      <PartnerAdminContent />
    </Suspense>
  )
}
