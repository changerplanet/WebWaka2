/**
 * Guided Demo Mode - Context & Provider
 * 
 * Provides UI hints for demo users without automation.
 * Visual guidance only - no auto-clicks, no auto-navigation.
 * 
 * @module lib/demo/guided
 * @access Demo mode only
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface DemoHint {
  id: string
  title: string
  description: string
  target?: string // CSS selector or element ID
  position?: 'top' | 'bottom' | 'left' | 'right'
  type: 'tip' | 'highlight' | 'banner' | 'callout'
  category: 'navigation' | 'governance' | 'workflow' | 'audit'
  dismissible?: boolean
  persistent?: boolean // If true, hint stays even after dismissal
}

export interface GuidedDemoContextType {
  isGuidedMode: boolean
  enableGuidedMode: () => void
  disableGuidedMode: () => void
  toggleGuidedMode: () => void
  
  // Hint management
  activeHints: DemoHint[]
  dismissedHints: Set<string>
  dismissHint: (hintId: string) => void
  resetDismissedHints: () => void
  
  // Current context
  currentPage: string | null
  setCurrentPage: (page: string) => void
  
  // Get hints for current page
  getHintsForPage: (page: string) => DemoHint[]
}

// ============================================================================
// HINT DATABASE
// ============================================================================

export const DEMO_HINTS: Record<string, DemoHint[]> = {
  // Dashboard hints
  'dashboard': [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      description: 'This is your central command center. Key metrics, alerts, and actions are all visible here.',
      type: 'banner',
      category: 'navigation',
      dismissible: true
    },
    {
      id: 'dashboard-audit-badge',
      title: 'Audit Trail Active',
      description: 'Every action on this platform is logged. Look for the audit icon to see activity history.',
      type: 'callout',
      category: 'audit',
      dismissible: true
    }
  ],
  
  // Commerce / POS hints
  'pos': [
    {
      id: 'pos-intro',
      title: 'Point of Sale',
      description: 'This is where daily sales transactions happen. Every sale automatically updates inventory and accounting.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'pos-audit',
      title: 'Transaction Audit',
      description: 'All POS transactions create immutable audit entries. Sales cannot be deleted, only voided with reason.',
      type: 'callout',
      category: 'audit',
      dismissible: true
    }
  ],
  
  // Inventory hints
  'inventory': [
    {
      id: 'inventory-intro',
      title: 'Real-Time Inventory',
      description: 'Stock levels update automatically with each sale. No manual stock counts needed.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'inventory-governance',
      title: 'Stock Movements Tracked',
      description: 'Every stock adjustment requires a reason and is permanently logged.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ],
  
  // Accounting hints
  'accounting': [
    {
      id: 'accounting-intro',
      title: 'Automatic Journal Entries',
      description: 'Every transaction automatically creates double-entry journal entries. No manual bookkeeping.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'accounting-frozen',
      title: 'v2-FROZEN Accounting Rules',
      description: 'Accounting behavior is locked. Journal entries follow Nigerian GAAP standards and cannot be customized.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ],
  
  // Education / School hints
  'school': [
    {
      id: 'school-intro',
      title: 'School Management',
      description: 'Attendance, grades, and fees are tracked in one place. Parents can see their ward\'s progress.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'school-grades-audit',
      title: 'Grade Audit Trail',
      description: 'All grade entries are timestamped and attributed. Changes are logged, not overwritten.',
      type: 'callout',
      category: 'audit',
      dismissible: true
    }
  ],
  
  // Health / Clinic hints
  'clinic': [
    {
      id: 'clinic-intro',
      title: 'Patient Records',
      description: 'Medical history, appointments, and billing in one secure system. Access is strictly controlled.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'clinic-privacy',
      title: 'Privacy Protected',
      description: 'Patient data access is logged. Every view, edit, and export is recorded for NDPR compliance.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ],
  
  // Church hints
  'church': [
    {
      id: 'church-intro',
      title: 'Church Management',
      description: 'Membership, giving, and ministry coordination. Financial transparency builds congregational trust.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'church-giving-audit',
      title: 'Giving Records',
      description: 'All giving entries are append-only. Records cannot be deleted, ensuring accountability.',
      type: 'callout',
      category: 'audit',
      dismissible: true
    }
  ],
  
  // Political hints
  'political': [
    {
      id: 'political-intro',
      title: 'Campaign Management',
      description: 'Track donations, volunteers, and events. INEC-compliant disclosure reports generated automatically.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'political-compliance',
      title: 'Regulatory Compliance',
      description: 'Donation records are immutable. Compliance reports are timestamped for regulatory submission.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ],
  
  // Civic / GovTech hints
  'civic': [
    {
      id: 'civic-intro',
      title: 'Civic Service Delivery',
      description: 'Track cases, inspections, and citizen requests. Every action is auditable.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'civic-foi',
      title: 'FOI-Ready',
      description: 'All records are structured for Freedom of Information requests. Nothing is hidden.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ],
  
  // Audit / Compliance view hints
  'audit': [
    {
      id: 'audit-intro',
      title: 'Audit View',
      description: 'This is a read-only view. You can see everything but cannot modify any data.',
      type: 'banner',
      category: 'audit',
      dismissible: true
    },
    {
      id: 'audit-readonly',
      title: 'Read-Only Access',
      description: 'Auditor roles have full visibility but zero write permissions. This is governance by design.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    },
    {
      id: 'audit-export',
      title: 'Tamper-Evident Export',
      description: 'Audit exports include integrity checksums. Any modification to exported data is detectable.',
      type: 'tip',
      category: 'audit',
      dismissible: true
    }
  ],
  
  // Finance / Reports hints
  'finance': [
    {
      id: 'finance-intro',
      title: 'Financial Reports',
      description: 'All reports are generated from the immutable ledger. Numbers cannot be "adjusted" after the fact.',
      type: 'banner',
      category: 'workflow',
      dismissible: true
    },
    {
      id: 'finance-vat',
      title: 'VAT Tracking',
      description: 'VAT at 7.5% is automatically calculated and tracked. FIRS-ready reports available.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ],
  
  // Generic governance hints (can appear anywhere)
  'governance': [
    {
      id: 'governance-frozen',
      title: 'v2-FROZEN Suite',
      description: 'This suite\'s behavior is locked. What you see is what you get — no hidden customizations.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    },
    {
      id: 'governance-commerce-boundary',
      title: 'Commerce Boundary',
      description: 'WebWaka enables governance, not payment execution. Actual payments happen through external gateways.',
      type: 'callout',
      category: 'governance',
      dismissible: true
    }
  ]
}

// ============================================================================
// CONTEXT
// ============================================================================

const GuidedDemoContext = createContext<GuidedDemoContextType | null>(null)

export function useGuidedDemo(): GuidedDemoContextType {
  const context = useContext(GuidedDemoContext)
  if (!context) {
    throw new Error('useGuidedDemo must be used within GuidedDemoProvider')
  }
  return context
}

export function useGuidedDemoOptional(): GuidedDemoContextType | null {
  return useContext(GuidedDemoContext)
}

// ============================================================================
// PROVIDER
// ============================================================================

interface GuidedDemoProviderProps {
  children: ReactNode
  initialEnabled?: boolean
}

export function GuidedDemoProvider({ children, initialEnabled = false }: GuidedDemoProviderProps) {
  const [isGuidedMode, setIsGuidedMode] = useState(initialEnabled)
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState<string | null>(null)
  
  const enableGuidedMode = useCallback(() => setIsGuidedMode(true), [])
  const disableGuidedMode = useCallback(() => setIsGuidedMode(false), [])
  const toggleGuidedMode = useCallback(() => setIsGuidedMode((prev: any) => !prev), [])
  
  const dismissHint = useCallback((hintId: string) => {
    setDismissedHints((prev: any) => new Set([...prev, hintId]))
  }, [])
  
  const resetDismissedHints = useCallback(() => {
    setDismissedHints(new Set())
  }, [])
  
  const getHintsForPage = useCallback((page: string): DemoHint[] => {
    if (!isGuidedMode) return []
    
    const pageHints = DEMO_HINTS[page] || []
    const governanceHints = DEMO_HINTS['governance'] || []
    
    // Combine page-specific and governance hints
    const allHints = [...pageHints]
    
    // Add one governance hint if page has governance-related content
    if (pageHints.length > 0 && governanceHints.length > 0) {
      allHints.push(governanceHints[0])
    }
    
    // Filter out dismissed hints
    return allHints.filter(hint => !dismissedHints.has(hint.id))
  }, [isGuidedMode, dismissedHints])
  
  const activeHints = currentPage ? getHintsForPage(currentPage) : []
  
  return (
    <GuidedDemoContext.Provider
      value={{
        isGuidedMode,
        enableGuidedMode,
        disableGuidedMode,
        toggleGuidedMode,
        activeHints,
        dismissedHints,
        dismissHint,
        resetDismissedHints,
        currentPage,
        setCurrentPage,
        getHintsForPage
      }}
    >
      {children}
    </GuidedDemoContext.Provider>
  )
}
