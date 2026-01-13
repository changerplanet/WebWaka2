'use client'

/**
 * Demo Credentials Portal
 * 
 * Central canonical page for all demo credentials.
 * READ-ONLY access to demo account information.
 * 
 * @route /demo/credentials
 * @access Demo mode only
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle,
  Search,
  Building2,
  Users,
  Key,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { 
  DEMO_SUITES, 
  DEMO_PASSWORD, 
  PARTNER_CREDENTIALS,
  type DemoSuite,
  type DemoTenant,
  type DemoCredential,
  isDemoTenant
} from '@/lib/demo/credentials'

// Suite badge colors
const SUITE_COLORS: Record<string, string> = {
  'Commerce': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Education': 'bg-blue-100 text-blue-800 border-blue-200',
  'Health': 'bg-red-100 text-red-800 border-red-200',
  'Hospitality': 'bg-purple-100 text-purple-800 border-purple-200',
  'Civic / GovTech': 'bg-slate-100 text-slate-800 border-slate-200',
  'Logistics': 'bg-orange-100 text-orange-800 border-orange-200',
  'Real Estate': 'bg-amber-100 text-amber-800 border-amber-200',
  'Recruitment': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Project Management': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Legal Practice': 'bg-gray-100 text-gray-800 border-gray-200',
  'Warehouse': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'ParkHub (Transport)': 'bg-teal-100 text-teal-800 border-teal-200',
  'Political': 'bg-rose-100 text-rose-800 border-rose-200',
  'Church': 'bg-violet-100 text-violet-800 border-violet-200',
}

export default function DemoCredentialsPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <DemoCredentialsContent />
    </Suspense>
  )
}

function DemoCredentialsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set(['Commerce']))
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPartner, setShowPartner] = useState(false)
  
  // Demo mode detection
  const demoParam = searchParams.get('demo')
  const isDemo = demoParam === 'true'
  
  // Redirect if not in demo mode (for security)
  useEffect(() => {
    if (!isDemo) {
      // Show access denied instead of redirecting
    }
  }, [isDemo])
  
  // Filter suites based on search
  const filteredSuites = DEMO_SUITES.filter(suite => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      suite.name.toLowerCase().includes(query) ||
      suite.tenants.some((t: any) => 
        t.name.toLowerCase().includes(query) ||
        t.credentials.some((c: any) => 
          c.role.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
        )
      )
    )
  })
  
  const toggleSuite = (suiteName: string) => {
    const next = new Set(expandedSuites)
    if (next.has(suiteName)) {
      next.delete(suiteName)
    } else {
      next.add(suiteName)
    }
    setExpandedSuites(next)
  }
  
  const expandAll = () => {
    setExpandedSuites(new Set(DEMO_SUITES.map((s: any) => s.name)))
  }
  
  const collapseAll = () => {
    setExpandedSuites(new Set())
  }
  
  const copyToClipboard = async (text: string, type: 'email' | 'password', email?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'email' && email) {
        setCopiedEmail(email)
        setTimeout(() => setCopiedEmail(null), 2000)
      } else {
        setCopiedPassword(true)
        setTimeout(() => setCopiedPassword(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  // Stats
  const totalCredentials = DEMO_SUITES.reduce(
    (acc, s) => acc + s.tenants.reduce((a, t) => a + t.credentials.length, 0), 
    0
  )
  const totalTenants = DEMO_SUITES.reduce((acc: any, s: any) => acc + s.tenants.length, 0)
  
  // Access denied view
  if (!isDemo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 mb-6">
            This page is only available in demo mode. Demo credentials are not exposed in production contexts.
          </p>
          <Link
            href="/demo/credentials?demo=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Shield className="w-4 h-4" />
            Enter Demo Mode
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/?demo=true" 
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Back to home"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <h1 className="text-xl font-bold text-slate-900">Demo Credentials Portal</h1>
                </div>
                <p className="text-sm text-slate-500">Read-only access to all demo accounts</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                DEMO MODE
              </span>
              <Link
                href="/login?demo=true"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Demo Credentials Only</p>
            <p className="text-sm text-amber-700">
              These credentials access fictional demo data only. No real users, payments, or production systems are involved. 
              All demo data is isolated and non-sensitive.
            </p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{DEMO_SUITES.length}</p>
                <p className="text-sm text-slate-500">Suites</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalTenants}</p>
                <p className="text-sm text-slate-500">Demo Tenants</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalCredentials}</p>
                <p className="text-sm text-slate-500">Demo Accounts</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">1</p>
                <p className="text-sm text-slate-500">Shared Password</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Password Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-500">Universal Password (All Demo Accounts)</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-slate-900">
                    {showPassword ? (DEMO_PASSWORD || 'Not configured') : '••••••••'}
                  </code>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:bg-slate-100 rounded transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              disabled={!DEMO_PASSWORD}
              onClick={() => DEMO_PASSWORD && copyToClipboard(DEMO_PASSWORD, 'password')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${DEMO_PASSWORD ? 'bg-slate-100 hover:bg-slate-200' : 'bg-slate-50 cursor-not-allowed opacity-50'}`}
            >
              {copiedPassword ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-600 font-medium">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search suites, tenants, roles, or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Collapse All
            </button>
          </div>
        </div>
        
        {/* Partner Accounts Section */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
          <button
            onClick={() => setShowPartner(!showPartner)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded">
                PARTNER
              </span>
              <span className="font-semibold text-slate-900">Partner-Level Accounts</span>
              <span className="text-sm text-slate-500">
                ({PARTNER_CREDENTIALS.length} accounts)
              </span>
            </div>
            {showPartner ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {showPartner && (
            <div className="border-t border-slate-200 p-4">
              <p className="text-sm text-slate-600 mb-4">
                These accounts access the Demo Partner dashboard. Use them to explore partner-level features.
              </p>
              <div className="grid gap-2">
                {PARTNER_CREDENTIALS.map((cred) => (
                  <CredentialRow
                    key={cred.email}
                    credential={cred}
                    suiteName="Partner"
                    tenantName="WebWaka Demo Partner"
                    onCopy={copyToClipboard}
                    copiedEmail={copiedEmail}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Suite Sections */}
        <div className="space-y-4">
          {filteredSuites.map((suite) => (
            <SuiteSection
              key={suite.name}
              suite={suite}
              isExpanded={expandedSuites.has(suite.name)}
              onToggle={() => toggleSuite(suite.name)}
              onCopy={copyToClipboard}
              copiedEmail={copiedEmail}
            />
          ))}
        </div>
        
        {filteredSuites.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No results found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
        
        {/* Footer Notes */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• All demo accounts use the same password: <code className="bg-white px-1 rounded">{DEMO_PASSWORD || 'Not configured'}</code></li>
            <li>• Login URL: <code className="bg-white px-1 rounded">/login?demo=true</code></li>
            <li>• All demo tenants are linked to the Demo Partner Account</li>
            <li>• All suites are activated and non-expiring</li>
            <li>• Auditor roles have read-only access for compliance demonstrations</li>
          </ul>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-500 text-center">
            WebWaka Demo Credentials Portal • Read-Only Access • No Production Data
          </p>
        </div>
      </footer>
    </div>
  )
}

// Suite Section Component
interface SuiteSectionProps {
  suite: DemoSuite
  isExpanded: boolean
  onToggle: () => void
  onCopy: (text: string, type: 'email' | 'password', email?: string) => void
  copiedEmail: string | null
}

function SuiteSection({ suite, isExpanded, onToggle, onCopy, copiedEmail }: SuiteSectionProps) {
  const badgeColor = SUITE_COLORS[suite.name] || 'bg-slate-100 text-slate-800 border-slate-200'
  const totalCreds = suite.tenants.reduce((acc: any, t: any) => acc + t.credentials.length, 0)
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded border ${badgeColor}`}>
            {suite.name}
          </span>
          <span className="text-sm text-slate-500">
            {suite.tenants.length} tenant{suite.tenants.length > 1 ? 's' : ''} • {totalCreds} accounts
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-200">
          {suite.tenants.map((tenant) => (
            <TenantSection
              key={tenant.slug}
              tenant={tenant}
              suiteName={suite.name}
              onCopy={onCopy}
              copiedEmail={copiedEmail}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Tenant Section Component
interface TenantSectionProps {
  tenant: DemoTenant
  suiteName: string
  onCopy: (text: string, type: 'email' | 'password', email?: string) => void
  copiedEmail: string | null
}

function TenantSection({ tenant, suiteName, onCopy, copiedEmail }: TenantSectionProps) {
  return (
    <div className="p-4 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-slate-900">{tenant.name}</h4>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{tenant.location}</span>
            <span>•</span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{tenant.slug}</code>
          </div>
        </div>
        <Link
          href={`/login?tenant=${tenant.slug}&demo=true`}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          Login
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="grid gap-2">
        {tenant.credentials.map((cred) => (
          <CredentialRow
            key={cred.email}
            credential={cred}
            suiteName={suiteName}
            tenantName={tenant.name}
            onCopy={onCopy}
            copiedEmail={copiedEmail}
          />
        ))}
      </div>
    </div>
  )
}

// Credential Row Component
interface CredentialRowProps {
  credential: DemoCredential
  suiteName: string
  tenantName: string
  onCopy: (text: string, type: 'email' | 'password', email?: string) => void
  copiedEmail: string | null
}

function CredentialRow({ credential, suiteName, tenantName, onCopy, copiedEmail }: CredentialRowProps) {
  const isCopied = copiedEmail === credential.email
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-slate-900 text-sm">{credential.role}</span>
          {credential.role.toLowerCase().includes('auditor') && (
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded">
              Read-only
            </span>
          )}
        </div>
        <code className="text-sm text-slate-600 font-mono">{credential.email}</code>
        <p className="text-xs text-slate-500 mt-0.5">{credential.description}</p>
      </div>
      <button
        onClick={() => onCopy(credential.email, 'email', credential.email)}
        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-lg transition flex items-center gap-1.5 flex-shrink-0 ml-4"
      >
        {isCopied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-600 font-medium">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Copy</span>
          </>
        )}
      </button>
    </div>
  )
}
