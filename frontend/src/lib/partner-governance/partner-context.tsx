'use client'

/**
 * Partner Context Provider
 * 
 * Provides resolved partner capabilities and entitlements to all
 * Partner Admin Portal components. Capability resolution is cached
 * and refreshed on mount.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  PartnerCapabilities,
  PartnerEntitlement,
  PricingModel,
  PricingAssignment,
  resolvePartnerCapabilities,
  getActivePricingModels,
  getActiveAssignmentForTarget,
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  DEFAULT_PARTNER_CAPABILITIES,
} from '@/lib/partner-governance'

// Partner profile (would come from auth/session in production)
export interface PartnerProfile {
  id: string
  name: string
  email: string
  typeId: string
  categoryId: string
  overrides?: Partial<PartnerCapabilities>
}

// Context value
export interface PartnerContextValue {
  // Loading state
  loading: boolean
  error: string | null
  
  // Partner data
  partner: PartnerProfile | null
  
  // Resolved capabilities
  capabilities: PartnerCapabilities
  
  // Entitlement summary
  entitlement: PartnerEntitlement | null
  
  // Available pricing models (based on capabilities)
  availablePricingModels: PricingModel[]
  
  // Current partner pricing assignment
  currentPricingAssignment: PricingAssignment | null
  
  // Client counts
  clientCount: number
  activeTrialCount: number
  
  // Capability checks (convenience methods)
  can: (capability: keyof PartnerCapabilities) => boolean
  canWithinLimit: (capability: keyof PartnerCapabilities, currentCount: number) => boolean
  
  // Refresh data
  refresh: () => Promise<void>
}

// Default context value
const defaultContextValue: PartnerContextValue = {
  loading: true,
  error: null,
  partner: null,
  capabilities: DEFAULT_PARTNER_CAPABILITIES,
  entitlement: null,
  availablePricingModels: [],
  currentPricingAssignment: null,
  clientCount: 0,
  activeTrialCount: 0,
  can: () => false,
  canWithinLimit: () => false,
  refresh: async () => {},
}

// Create context
const PartnerContext = createContext<PartnerContextValue>(defaultContextValue)

// Demo partner data (in production, this would come from auth/session)
const DEMO_PARTNER: PartnerProfile = {
  id: 'partner-001',
  name: 'Acme Solutions',
  email: 'admin@acme-solutions.com',
  typeId: 'reseller',
  categoryId: 'strategic',
  overrides: undefined,
}

// Demo client/trial counts (in production, would come from database)
const DEMO_CLIENT_COUNT = 12
const DEMO_TRIAL_COUNT = 3

interface PartnerProviderProps {
  children: ReactNode
  // Optional: Override demo partner for testing
  demoPartner?: PartnerProfile
}

export function PartnerProvider({ children, demoPartner }: PartnerProviderProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [capabilities, setCapabilities] = useState<PartnerCapabilities>(DEFAULT_PARTNER_CAPABILITIES)
  const [entitlement, setEntitlement] = useState<PartnerEntitlement | null>(null)
  const [availablePricingModels, setAvailablePricingModels] = useState<PricingModel[]>([])
  const [currentPricingAssignment, setCurrentPricingAssignment] = useState<PricingAssignment | null>(null)
  const [clientCount, setClientCount] = useState(0)
  const [activeTrialCount, setActiveTrialCount] = useState(0)

  // Load partner data and resolve capabilities
  const loadPartnerData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use demo partner or provided override
      const partnerData = demoPartner || DEMO_PARTNER
      setPartner(partnerData)

      // Resolve capabilities based on type + category + overrides
      const resolvedCapabilities = resolvePartnerCapabilities(
        partnerData.typeId,
        partnerData.categoryId,
        partnerData.overrides
      )
      setCapabilities(resolvedCapabilities)

      // Get available pricing models based on capabilities
      const models = getActivePricingModels().filter((m: any) => {
        if (m.type === 'custom' && !resolvedCapabilities.canCreatePricingModels) {
          return false
        }
        return true
      })
      setAvailablePricingModels(models)

      // Get current pricing assignment
      const assignment = getActiveAssignmentForTarget('partner', partnerData.id)
      setCurrentPricingAssignment(assignment || null)

      // Set client/trial counts (demo data)
      setClientCount(DEMO_CLIENT_COUNT)
      setActiveTrialCount(DEMO_TRIAL_COUNT)

      // Build entitlement summary
      const entitlementData: PartnerEntitlement = {
        partnerId: partnerData.id,
        partnerName: partnerData.name,
        partnerType: partnerData.typeId,
        partnerCategory: partnerData.categoryId,
        effectiveCapabilities: resolvedCapabilities,
        availablePricingModels: models.map((m: any) => m.id),
        currentPricingAssignment: assignment || null,
        clientCount: DEMO_CLIENT_COUNT,
        activeTrialCount: DEMO_TRIAL_COUNT,
        computedAt: new Date().toISOString(),
      }
      setEntitlement(entitlementData)

    } catch (err) {
      console.error('Failed to load partner data:', err)
      setError('Failed to load partner data')
    } finally {
      setLoading(false)
    }
  }, [demoPartner])

  // Load on mount
  useEffect(() => {
    loadPartnerData()
  }, [loadPartnerData])

  // Capability check helper
  const can = useCallback((capability: keyof PartnerCapabilities): boolean => {
    const value = capabilities[capability]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    if (Array.isArray(value)) return value.length > 0
    return false
  }, [capabilities])

  // Capability check with limit helper
  const canWithinLimit = useCallback((capability: keyof PartnerCapabilities, currentCount: number): boolean => {
    if (!can(capability)) return false
    
    // Check specific limits
    if (capability === 'canCreateClients') {
      if (capabilities.maxClients === null) return true // unlimited
      return currentCount < capabilities.maxClients
    }
    if (capability === 'canOfferTrials') {
      if (capabilities.maxConcurrentTrials === null) return true // unlimited
      return currentCount < capabilities.maxConcurrentTrials
    }
    if (capability === 'canManageDomains') {
      if (capabilities.maxDomains === null) return true // unlimited
      return currentCount < capabilities.maxDomains
    }
    
    return true
  }, [capabilities, can])

  const contextValue: PartnerContextValue = {
    loading,
    error,
    partner,
    capabilities,
    entitlement,
    availablePricingModels,
    currentPricingAssignment,
    clientCount,
    activeTrialCount,
    can,
    canWithinLimit,
    refresh: loadPartnerData,
  }

  return (
    <PartnerContext.Provider value={contextValue}>
      {children}
    </PartnerContext.Provider>
  )
}

// Hook to use partner context
export function usePartner() {
  const context = useContext(PartnerContext)
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider')
  }
  return context
}

// Hook to check specific capability
export function useCapability(capability: keyof PartnerCapabilities): boolean {
  const { can } = usePartner()
  return can(capability)
}

// Hook to check capability with limit
export function useCapabilityWithLimit(
  capability: keyof PartnerCapabilities,
  currentCount: number
): { allowed: boolean; atLimit: boolean } {
  const { can, canWithinLimit } = usePartner()
  const hasCapability = can(capability)
  const withinLimit = canWithinLimit(capability, currentCount)
  return {
    allowed: hasCapability && withinLimit,
    atLimit: hasCapability && !withinLimit,
  }
}
