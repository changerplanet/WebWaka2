'use client'

/**
 * Guided Demo Controller
 * 
 * Main component for managing guided demo mode UI.
 * Displays hints, banners, and the control toggle.
 * 
 * NO AUTOMATION - visual guidance only.
 * 
 * @module components/demo/GuidedDemoController
 */

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { 
  Lightbulb, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Eye, 
  BookOpen,
  HelpCircle,
  RotateCcw
} from 'lucide-react'
import { 
  GuidedDemoProvider, 
  useGuidedDemo, 
  useGuidedDemoOptional,
  type DemoHint,
  DEMO_HINTS
} from '@/lib/demo/guided'
import { DemoHintBanner, DemoHintCallout } from './DemoHintBanner'

// ============================================================================
// GUIDED DEMO WRAPPER
// ============================================================================

interface GuidedDemoWrapperProps {
  children: React.ReactNode
}

export function GuidedDemoWrapper({ children }: GuidedDemoWrapperProps) {
  const searchParams = useSearchParams()
  const guidedParam = searchParams.get('guidedDemo')
  const demoParam = searchParams.get('demo')
  
  // Only enable guided mode if explicitly requested or in demo mode
  const initialEnabled = guidedParam === 'true'
  const isInDemoContext = demoParam === 'true' || guidedParam === 'true'
  
  if (!isInDemoContext) {
    return <>{children}</>
  }
  
  return (
    <GuidedDemoProvider initialEnabled={initialEnabled}>
      {children}
      <GuidedDemoFloatingControl />
    </GuidedDemoProvider>
  )
}

// ============================================================================
// FLOATING CONTROL BUTTON
// ============================================================================

function GuidedDemoFloatingControl() {
  const { 
    isGuidedMode, 
    toggleGuidedMode, 
    activeHints,
    dismissedHints,
    resetDismissedHints
  } = useGuidedDemo()
  
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mb-2 bg-white rounded-xl shadow-2xl border border-slate-200 w-72 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-slate-900">Guided Demo Mode</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          <div className="p-3 space-y-3">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Show hints</span>
              <button
                onClick={toggleGuidedMode}
                className={`relative w-10 h-5 rounded-full transition ${
                  isGuidedMode ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isGuidedMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            {/* Stats */}
            <div className="text-xs text-slate-500">
              <p>Active hints: {activeHints.length}</p>
              <p>Dismissed: {dismissedHints.size}</p>
            </div>
            
            {/* Reset */}
            {dismissedHints.size > 0 && (
              <button
                onClick={resetDismissedHints}
                className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <RotateCcw className="w-3 h-3" />
                Reset dismissed hints
              </button>
            )}
            
            {/* Info */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Guided mode shows contextual hints to help navigate the demo. 
                No automation — just visual guidance.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition ${
          isGuidedMode 
            ? 'bg-amber-500 text-white hover:bg-amber-600' 
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        <Lightbulb className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isGuidedMode ? 'Guided Mode On' : 'Guided Mode'}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

// ============================================================================
// HINT CONTAINER (For pages to use)
// ============================================================================

interface GuidedDemoHintsProps {
  pageId: string
  className?: string
}

export function GuidedDemoHints({ pageId, className = '' }: GuidedDemoHintsProps) {
  const context = useGuidedDemoOptional()
  
  useEffect(() => {
    if (context) {
      context.setCurrentPage(pageId)
    }
  }, [pageId, context])
  
  if (!context || !context.isGuidedMode) {
    return null
  }
  
  const hints = context.getHintsForPage(pageId)
  
  if (hints.length === 0) {
    return null
  }
  
  // Separate hints by type
  const bannerHints = hints.filter((h: any) => h.type === 'banner')
  const calloutHints = hints.filter((h: any) => h.type === 'callout' || h.type === 'tip')
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Banner hints at top */}
      {bannerHints.map(hint => (
        <DemoHintBanner
          key={hint.id}
          hint={hint}
          onDismiss={() => context.dismissHint(hint.id)}
        />
      ))}
      
      {/* Callout hints inline */}
      {calloutHints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {calloutHints.map(hint => (
            <DemoHintCallout
              key={hint.id}
              hint={hint}
              onDismiss={() => context.dismissHint(hint.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// INLINE HINT (For specific elements)
// ============================================================================

interface InlineDemoHintProps {
  hintId: string
  children: React.ReactNode
}

export function InlineDemoHint({ hintId, children }: InlineDemoHintProps) {
  const context = useGuidedDemoOptional()
  const [isVisible, setIsVisible] = useState(true)
  
  if (!context || !context.isGuidedMode || context.dismissedHints.has(hintId)) {
    return <>{children}</>
  }
  
  // Find the hint
  const allHints = Object.values(DEMO_HINTS).flat()
  const hint = allHints.find((h: any) => h.id === hintId)
  
  if (!hint || !isVisible) {
    return <>{children}</>
  }
  
  const getCategoryColor = () => {
    switch (hint.category) {
      case 'governance': return 'ring-slate-400'
      case 'audit': return 'ring-amber-400'
      case 'workflow': return 'ring-emerald-400'
      default: return 'ring-blue-400'
    }
  }
  
  return (
    <div className={`relative ring-2 ${getCategoryColor()} ring-offset-2 rounded-lg`}>
      {children}
      
      {/* Floating hint */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className="relative group">
          <button
            onClick={() => {
              setIsVisible(false)
              context.dismissHint(hintId)
            }}
            className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-600 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 w-56 opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <div className="bg-slate-900 text-white text-xs rounded-lg p-2 shadow-lg">
              <p className="font-medium">{hint.title}</p>
              <p className="text-slate-300 mt-1">{hint.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export { GuidedDemoProvider, useGuidedDemo, useGuidedDemoOptional } from '@/lib/demo/guided'
