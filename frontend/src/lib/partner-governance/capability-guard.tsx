'use client'

/**
 * Capability Guard Component
 * 
 * Wrapper component that conditionally renders children based on
 * partner capabilities. Supports show/hide and enable/disable modes.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import React, { ReactNode } from 'react'
import { usePartner } from './partner-context'
import { PartnerCapabilities } from './types'
import { Lock, AlertTriangle } from 'lucide-react'

interface CapabilityGuardProps {
  // Required capability to render children
  capability: keyof PartnerCapabilities
  
  // Optional: Check if within limit (for maxClients, maxTrials, etc.)
  currentCount?: number
  
  // Behavior when capability is missing
  mode?: 'hide' | 'disable' | 'message'
  
  // Custom message when capability is missing
  fallbackMessage?: string
  
  // Children to render
  children: ReactNode
}

/**
 * CapabilityGuard
 * 
 * Wraps children and conditionally renders based on partner capabilities.
 * 
 * Modes:
 * - 'hide': Completely hide children when capability is missing
 * - 'disable': Render children with disabled state (via wrapper)
 * - 'message': Show a message explaining why feature is unavailable
 */
export function CapabilityGuard({
  capability,
  currentCount,
  mode = 'hide',
  fallbackMessage,
  children,
}: CapabilityGuardProps) {
  const { can, canWithinLimit, capabilities, loading } = usePartner()

  // Don't render anything while loading
  if (loading) return null

  // Check capability
  const hasCapability = can(capability)
  const withinLimit = currentCount !== undefined 
    ? canWithinLimit(capability, currentCount) 
    : true
  
  const isAllowed = hasCapability && withinLimit
  const isAtLimit = hasCapability && !withinLimit

  // If allowed, render children normally
  if (isAllowed) {
    return <>{children}</>
  }

  // Handle based on mode
  switch (mode) {
    case 'hide':
      return null

    case 'disable':
      return (
        <div className="opacity-50 pointer-events-none cursor-not-allowed">
          {children}
        </div>
      )

    case 'message':
      const message = fallbackMessage || getDefaultMessage(capability, isAtLimit, capabilities)
      return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            {isAtLimit ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            ) : (
              <Lock className="w-5 h-5 text-slate-500 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-slate-400">{message}</p>
              {isAtLimit && (
                <p className="text-xs text-slate-500 mt-1">
                  Contact your account manager to increase limits.
                </p>
              )}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

/**
 * Get default message for missing capability
 */
function getDefaultMessage(
  capability: keyof PartnerCapabilities,
  isAtLimit: boolean,
  capabilities: PartnerCapabilities
): string {
  if (isAtLimit) {
    switch (capability) {
      case 'canCreateClients':
        return `You have reached your client limit (${capabilities.maxClients} clients).`
      case 'canOfferTrials':
        return `You have reached your concurrent trial limit (${capabilities.maxConcurrentTrials} trials).`
      case 'canManageDomains':
        return `You have reached your domain limit (${capabilities.maxDomains} domains).`
      default:
        return 'You have reached the limit for this action.'
    }
  }

  switch (capability) {
    case 'canCreateClients':
      return 'Client creation is not enabled for your account.'
    case 'canSuspendClients':
      return 'Client suspension is not enabled for your account.'
    case 'canAssignPricing':
      return 'Pricing assignment is not enabled for your account.'
    case 'canCreatePricingModels':
      return 'Custom pricing model creation is not enabled for your account.'
    case 'canApplyDiscounts':
      return 'Discount application is not enabled for your account.'
    case 'canOfferTrials':
      return 'Trial offers are not enabled for your account.'
    case 'canManageDomains':
      return 'Domain management is not enabled for your account.'
    case 'canViewPricingFacts':
      return 'Pricing fact viewing is not enabled for your account.'
    case 'canExportReports':
      return 'Report export is not enabled for your account.'
    default:
      return 'This feature is not available for your account.'
  }
}

/**
 * Capability Badge
 * 
 * Shows a visual indicator of capability status
 */
interface CapabilityBadgeProps {
  capability: keyof PartnerCapabilities
  label?: string
  showValue?: boolean
}

export function CapabilityBadge({ capability, label, showValue = false }: CapabilityBadgeProps) {
  const { capabilities, can } = usePartner()
  
  const hasCapability = can(capability)
  const value = capabilities[capability]
  
  const displayLabel = label || formatCapabilityName(capability)
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
      hasCapability
        ? 'bg-green-500/20 text-green-400'
        : 'bg-slate-700 text-slate-400'
    }`}>
      {hasCapability ? (
        <span className="w-2 h-2 rounded-full bg-green-400" />
      ) : (
        <Lock className="w-3 h-3" />
      )}
      <span>{displayLabel}</span>
      {showValue && typeof value === 'number' && hasCapability && (
        <span className="text-xs opacity-70">
          ({value === null ? '∞' : value})
        </span>
      )}
    </div>
  )
}

/**
 * Format capability key to display name
 */
function formatCapabilityName(capability: keyof PartnerCapabilities): string {
  return capability
    .replace(/^can/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

/**
 * Capability Required Wrapper
 * 
 * HOC-style wrapper for entire pages/sections
 */
interface CapabilityRequiredProps {
  capability: keyof PartnerCapabilities
  children: ReactNode
  title?: string
  description?: string
}

export function CapabilityRequired({
  capability,
  children,
  title,
  description,
}: CapabilityRequiredProps) {
  const { can, loading } = usePartner()

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!can(capability)) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {title || 'Feature Not Available'}
          </h3>
          <p className="text-slate-400 text-sm">
            {description || getDefaultMessage(capability, false, {} as PartnerCapabilities)}
          </p>
          <p className="text-xs text-slate-500 mt-4">
            Contact your account manager to enable this feature.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Limit Warning Component
 * 
 * Shows a warning when approaching or at a limit
 */
interface LimitWarningProps {
  capability: 'canCreateClients' | 'canOfferTrials' | 'canManageDomains'
  currentCount: number
}

export function LimitWarning({ capability, currentCount }: LimitWarningProps) {
  const { capabilities, can } = usePartner()

  if (!can(capability)) return null

  let maxValue: number | null = null
  let label = ''

  switch (capability) {
    case 'canCreateClients':
      maxValue = capabilities.maxClients
      label = 'clients'
      break
    case 'canOfferTrials':
      maxValue = capabilities.maxConcurrentTrials
      label = 'active trials'
      break
    case 'canManageDomains':
      maxValue = capabilities.maxDomains
      label = 'domains'
      break
  }

  if (maxValue === null) return null // unlimited

  const remaining = maxValue - currentCount
  const percentage = (currentCount / maxValue) * 100

  if (percentage < 80) return null // No warning needed

  const isAtLimit = remaining <= 0
  const isNearLimit = remaining > 0 && remaining <= 2

  if (!isAtLimit && !isNearLimit) return null

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      isAtLimit
        ? 'bg-red-500/20 text-red-400'
        : 'bg-amber-500/20 text-amber-400'
    }`}>
      <AlertTriangle className="w-4 h-4" />
      <span>
        {isAtLimit
          ? `Limit reached: ${currentCount}/${maxValue} ${label}`
          : `${remaining} ${label} remaining (${currentCount}/${maxValue})`}
      </span>
    </div>
  )
}
