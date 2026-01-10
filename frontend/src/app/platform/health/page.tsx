'use client'

/**
 * Platform Health Dashboard - Read-Only
 * 
 * High-level, regulator-safe visibility into platform health and governance posture.
 * NO CONTROLS. NO SECRETS. NO TENANT-LEVEL PRIVATE DATA.
 * 
 * @route /platform/health
 * @phase P1 - Operational Health Dashboard
 */

import {
  Shield,
  CheckCircle2,
  Clock,
  Globe,
  Users,
  Lock,
  FileCheck,
  AlertTriangle,
  Building2,
  Layers,
  Database,
  Eye,
} from 'lucide-react'
import { DOMAIN_REGISTRY, getLifecycleStateDisplay } from '@/lib/domains/registry'

// =============================================================================
// PLATFORM CONSTANTS (Static assertions)
// =============================================================================

const PLATFORM_INFO = {
  version: '2.0.0',
  environment: 'demo',
  lastDeploy: '2026-01-09T00:00:00Z',
  buildId: 'webwaka-v2-frozen',
}

const GOVERNANCE_ASSERTIONS = {
  v2FrozenVerticals: 14,
  commerceBoundaryEnforced: true,
  appendOnlyDiscipline: true,
  auditLoggingEnabled: true,
  tenantIsolationActive: true,
}

const DEMO_STATUS = {
  demoPartnerActive: true,
  demoPartnerName: 'WebWaka Demo Partner',
  demoTenantCount: 14,
  demoCertified: true,
  demoCredentialsAvailable: true,
  demoPlaybooksAvailable: true,
  guidedDemoModeAvailable: true,
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function StatusBadge({ status, label }: { status: 'healthy' | 'warning' | 'error'; label: string }) {
  const styles = {
    healthy: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
  }
  
  const icons = {
    healthy: CheckCircle2,
    warning: AlertTriangle,
    error: AlertTriangle,
  }
  
  const Icon = icons[status]
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  sublabel 
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  sublabel?: string 
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sublabel && <div className="text-xs text-slate-400 mt-1">{sublabel}</div>}
    </div>
  )
}

function AssertionRow({ 
  label, 
  value, 
  verified 
}: { 
  label: string
  value: string
  verified: boolean 
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">{value}</span>
        {verified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PlatformHealthPage() {
  // Calculate domain metrics from registry
  const totalDomains = DOMAIN_REGISTRY.length
  const activeDomains = DOMAIN_REGISTRY.filter((d: any) => d.lifecycle_state === 'ACTIVE').length
  const pendingDomains = DOMAIN_REGISTRY.filter((d: any) => d.lifecycle_state === 'PENDING').length
  const suspendedDomains = DOMAIN_REGISTRY.filter((d: any) => d.lifecycle_state === 'SUSPENDED').length
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Platform Health</h1>
                <p className="text-sm text-slate-500">Governance and operational status</p>
              </div>
            </div>
            <StatusBadge status="healthy" label="All Systems Operational" />
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Section 1: Platform Status */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" />
            Platform Status
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Build Version</div>
                <div className="text-lg font-mono font-medium text-slate-900">{PLATFORM_INFO.version}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Environment</div>
                <div className="text-lg font-medium text-slate-900 capitalize">{PLATFORM_INFO.environment}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Last Deploy</div>
                <div className="text-lg font-medium text-slate-900">
                  {new Date(PLATFORM_INFO.lastDeploy).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 2: Governance Health */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-500" />
            Governance Health
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <MetricCard
                icon={Layers}
                label="v2-FROZEN Verticals"
                value={GOVERNANCE_ASSERTIONS.v2FrozenVerticals}
                sublabel="Locked & certified"
              />
              <MetricCard
                icon={Shield}
                label="Commerce Boundary"
                value="Enforced"
                sublabel="Facts vs execution"
              />
              <MetricCard
                icon={Database}
                label="Append-Only"
                value="Active"
                sublabel="Financial facts"
              />
              <MetricCard
                icon={FileCheck}
                label="Audit Logging"
                value="Enabled"
                sublabel="All mutations"
              />
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              <div className="text-sm font-medium text-slate-700 mb-3">Governance Assertions</div>
              <div className="space-y-0">
                <AssertionRow 
                  label="v2-FROZEN Vertical Count" 
                  value={`${GOVERNANCE_ASSERTIONS.v2FrozenVerticals} verticals`} 
                  verified={true} 
                />
                <AssertionRow 
                  label="Commerce Boundary Enforcement" 
                  value={GOVERNANCE_ASSERTIONS.commerceBoundaryEnforced ? 'Active' : 'Inactive'} 
                  verified={GOVERNANCE_ASSERTIONS.commerceBoundaryEnforced} 
                />
                <AssertionRow 
                  label="Append-Only Discipline" 
                  value={GOVERNANCE_ASSERTIONS.appendOnlyDiscipline ? 'Enforced' : 'Not Enforced'} 
                  verified={GOVERNANCE_ASSERTIONS.appendOnlyDiscipline} 
                />
                <AssertionRow 
                  label="Tenant Isolation" 
                  value={GOVERNANCE_ASSERTIONS.tenantIsolationActive ? 'Active' : 'Inactive'} 
                  verified={GOVERNANCE_ASSERTIONS.tenantIsolationActive} 
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 3: Domain Health */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-500" />
            Domain Health
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                icon={Globe}
                label="Total Domains"
                value={totalDomains}
                sublabel="In registry"
              />
              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-green-700">Active</span>
                </div>
                <div className="text-2xl font-bold text-green-700">{activeDomains}</div>
              </div>
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-amber-700">Pending</span>
                </div>
                <div className="text-2xl font-bold text-amber-700">{pendingDomains}</div>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-red-700">Suspended</span>
                </div>
                <div className="text-2xl font-bold text-red-700">{suspendedDomains}</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 4: Demo Health */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-500" />
            Demo Health
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <div className="text-lg font-medium text-slate-900">{DEMO_STATUS.demoPartnerName}</div>
                <div className="text-sm text-slate-500">Demo Partner Account</div>
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {DEMO_STATUS.demoCertified && (
                  <StatusBadge status="healthy" label="Certified" />
                )}
                {DEMO_STATUS.demoPartnerActive && (
                  <StatusBadge status="healthy" label="Active" />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Demo Tenants"
                value={DEMO_STATUS.demoTenantCount}
                sublabel="Pre-seeded"
              />
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm text-slate-500">Credentials</span>
                </div>
                <div className="text-lg font-medium text-slate-900">
                  {DEMO_STATUS.demoCredentialsAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm text-slate-500">Playbooks</span>
                </div>
                <div className="text-lg font-medium text-slate-900">
                  {DEMO_STATUS.demoPlaybooksAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm text-slate-500">Guided Mode</span>
                </div>
                <div className="text-lg font-medium text-slate-900">
                  {DEMO_STATUS.guidedDemoModeAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 5: Explicit Limitations */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-slate-500" />
            Dashboard Limitations
          </h2>
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
            <div className="text-sm font-medium text-amber-900 mb-3">This dashboard does NOT provide:</div>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Real-time metrics or live data feeds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Tenant-specific private data or PII</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Operational controls, toggles, or configuration options</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>API credentials, secrets, or authentication tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Performance metrics, latency data, or error rates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Automated alerting or monitoring integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Historical trends or time-series analysis</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-xs text-amber-700">
                This dashboard provides static governance assertions and high-level status indicators only. 
                For operational monitoring, contact your platform administrator.
              </p>
            </div>
          </div>
        </section>
        
        {/* Governance Footer */}
        <div className="flex items-start gap-3 bg-slate-100 rounded-lg p-4">
          <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-slate-700">Governance Notice</div>
            <p className="text-sm text-slate-600 mt-1">
              All values on this page represent static governance assertions. WebWaka operates under 
              v2-FREEZE discipline where business logic is locked and cannot be silently modified. 
              This dashboard is read-only and does not provide operational control.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-400">
            WebWaka Platform Health Dashboard • Read-Only • v{PLATFORM_INFO.version}
          </p>
        </div>
      </div>
    </div>
  )
}
