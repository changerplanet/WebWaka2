'use client'

/**
 * Derivation Notice Component
 * 
 * Mandatory notice indicating this is a derived view for demonstration.
 * Protects audit integrity.
 * 
 * @module components/convergence/DerivationNotice
 * @phase Phase 3 Track C
 */

import { Info, Shield } from 'lucide-react'

interface DerivationNoticeProps {
  variant?: 'default' | 'compact'
}

export function DerivationNotice({ variant = 'default' }: DerivationNoticeProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Derived view for demonstration</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl" data-testid="derivation-notice">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-blue-900">
          Derived view for demonstration
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Actual journal entries are recorded by the Accounting suite. 
          This preview shows what would be created.
        </p>
      </div>
    </div>
  )
}
