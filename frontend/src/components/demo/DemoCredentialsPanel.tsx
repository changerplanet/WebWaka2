'use client'

/**
 * Demo Credentials Panel
 * 
 * Displays demo account credentials for self-service login.
 * ONLY renders in demo mode contexts.
 * 
 * @module components/demo/DemoCredentialsPanel
 * @readonly - Credentials are display-only
 */

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, Shield, AlertTriangle } from 'lucide-react'
import { 
  DEMO_SUITES, 
  DEMO_PASSWORD, 
  PARTNER_CREDENTIALS,
  type DemoSuite,
  type DemoCredential 
} from '@/lib/demo/credentials'

interface DemoCredentialsPanelProps {
  /** Filter to show only specific suite */
  filterSuite?: string
  /** Compact mode for smaller spaces */
  compact?: boolean
  /** Show partner-level accounts */
  showPartnerAccounts?: boolean
}

export function DemoCredentialsPanel({ 
  filterSuite, 
  compact = false,
  showPartnerAccounts = false 
}: DemoCredentialsPanelProps) {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set())
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const suitesToShow = filterSuite 
    ? DEMO_SUITES.filter((s: any) => s.name.toLowerCase().includes(filterSuite.toLowerCase()))
    : DEMO_SUITES

  const toggleSuite = (suiteName: string) => {
    const next = new Set(expandedSuites)
    if (next.has(suiteName)) {
      next.delete(suiteName)
    } else {
      next.add(suiteName)
    }
    setExpandedSuites(next)
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

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className={`font-semibold text-slate-900 ${compact ? 'text-sm' : 'text-base'}`}>
            Demo Accounts
          </h3>
          <p className="text-xs text-slate-500">
            Use these credentials to explore
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Demo Only</strong> — Fictional data. No real users, payments, or production systems.
        </p>
      </div>

      {/* Password (shared) */}
      <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg mb-3">
        <div>
          <span className="text-xs text-slate-500 block">Password (all accounts)</span>
          <code className="text-sm font-mono text-slate-900">{DEMO_PASSWORD}</code>
        </div>
        <button
          onClick={() => copyToClipboard(DEMO_PASSWORD, 'password')}
          className="p-1.5 hover:bg-slate-100 rounded-md transition"
          title="Copy password"
        >
          {copiedPassword ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Partner Accounts (optional) */}
      {showPartnerAccounts && (
        <div className="mb-3">
          <button
            onClick={() => toggleSuite('partner')}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <span className="text-sm font-medium text-slate-700">Partner Accounts</span>
            {expandedSuites.has('partner') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedSuites.has('partner') && (
            <div className="mt-1 space-y-1 pl-2">
              {PARTNER_CREDENTIALS.map((cred) => (
                <CredentialItem 
                  key={cred.email} 
                  credential={cred} 
                  onCopy={copyToClipboard}
                  copiedEmail={copiedEmail}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suites */}
      <div className={`space-y-1 ${compact ? 'max-h-[300px]' : 'max-h-[400px]'} overflow-y-auto`}>
        {suitesToShow.map((suite) => (
          <SuiteSection
            key={suite.name}
            suite={suite}
            isExpanded={expandedSuites.has(suite.name)}
            onToggle={() => toggleSuite(suite.name)}
            onCopy={copyToClipboard}
            copiedEmail={copiedEmail}
            compact={compact}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          {DEMO_SUITES.length} suites • {DEMO_SUITES.reduce((acc: any, s: any) => acc + s.tenants.reduce((a, t) => a + t.credentials.length, 0), 0)} demo accounts
        </p>
      </div>
    </div>
  )
}

interface SuiteSectionProps {
  suite: DemoSuite
  isExpanded: boolean
  onToggle: () => void
  onCopy: (text: string, type: 'email' | 'password', email?: string) => void
  copiedEmail: string | null
  compact: boolean
}

function SuiteSection({ suite, isExpanded, onToggle, onCopy, copiedEmail, compact }: SuiteSectionProps) {
  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition"
      >
        <span className={`font-medium text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {suite.name}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2">
          {suite.tenants.map((tenant) => (
            <div key={tenant.slug} className="border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {tenant.name}
                </span>
                <span className="text-xs text-slate-400">
                  {tenant.location}
                </span>
              </div>
              <div className="space-y-1">
                {tenant.credentials.slice(0, compact ? 3 : undefined).map((cred) => (
                  <CredentialItem
                    key={cred.email}
                    credential={cred}
                    onCopy={onCopy}
                    copiedEmail={copiedEmail}
                    compact={compact}
                  />
                ))}
                {compact && tenant.credentials.length > 3 && (
                  <p className="text-xs text-slate-400 pl-2">
                    +{tenant.credentials.length - 3} more accounts
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface CredentialItemProps {
  credential: DemoCredential
  onCopy: (text: string, type: 'email' | 'password', email?: string) => void
  copiedEmail: string | null
  compact: boolean
}

function CredentialItem({ credential, onCopy, copiedEmail, compact }: CredentialItemProps) {
  const isCopied = copiedEmail === credential.email

  return (
    <div className={`flex items-center justify-between ${compact ? 'p-1.5' : 'p-2'} bg-slate-50 rounded-md group`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            {credential.role}
          </span>
        </div>
        <code className={`text-slate-600 font-mono block truncate ${compact ? 'text-xs' : 'text-xs'}`}>
          {credential.email}
        </code>
        {!compact && (
          <span className="text-xs text-slate-400">{credential.description}</span>
        )}
      </div>
      <button
        onClick={() => onCopy(credential.email, 'email', credential.email)}
        className="p-1.5 hover:bg-slate-200 rounded-md transition opacity-0 group-hover:opacity-100 flex-shrink-0"
        title="Copy email"
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>
    </div>
  )
}

export default DemoCredentialsPanel
