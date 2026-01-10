'use client'

/**
 * Demo Hint Banner
 * 
 * Top banner component for guided demo mode.
 * Provides contextual guidance without automation.
 * 
 * @module components/demo/DemoHintBanner
 */

import { useState } from 'react'
import { X, Lightbulb, Shield, Eye, BookOpen } from 'lucide-react'
import { type DemoHint } from '@/lib/demo/guided'

interface DemoHintBannerProps {
  hint: DemoHint
  onDismiss: () => void
}

export function DemoHintBanner({ hint, onDismiss }: DemoHintBannerProps) {
  const getCategoryIcon = () => {
    switch (hint.category) {
      case 'governance': return <Shield className="w-4 h-4" />
      case 'audit': return <Eye className="w-4 h-4" />
      case 'workflow': return <BookOpen className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }
  
  const getCategoryColor = () => {
    switch (hint.category) {
      case 'governance': return 'bg-slate-50 border-slate-200 text-slate-700'
      case 'audit': return 'bg-amber-50 border-amber-200 text-amber-700'
      case 'workflow': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
      default: return 'bg-blue-50 border-blue-200 text-blue-700'
    }
  }
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${getCategoryColor()}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getCategoryIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{hint.title}</p>
        <p className="text-xs mt-0.5 opacity-80">{hint.description}</p>
      </div>
      {hint.dismissible !== false && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition"
          title="Dismiss hint"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Demo Hint Callout
 * 
 * Inline callout for specific features or governance notes.
 */
interface DemoHintCalloutProps {
  hint: DemoHint
  onDismiss: () => void
}

export function DemoHintCallout({ hint, onDismiss }: DemoHintCalloutProps) {
  const getCategoryStyles = () => {
    switch (hint.category) {
      case 'governance': 
        return {
          bg: 'bg-slate-900',
          text: 'text-white',
          icon: <Shield className="w-3.5 h-3.5" />
        }
      case 'audit': 
        return {
          bg: 'bg-amber-600',
          text: 'text-white',
          icon: <Eye className="w-3.5 h-3.5" />
        }
      case 'workflow': 
        return {
          bg: 'bg-emerald-600',
          text: 'text-white',
          icon: <BookOpen className="w-3.5 h-3.5" />
        }
      default: 
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          icon: <Lightbulb className="w-3.5 h-3.5" />
        }
    }
  }
  
  const styles = getCategoryStyles()
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}>
      {styles.icon}
      <span>{hint.title}</span>
      {hint.dismissible !== false && (
        <button
          onClick={onDismiss}
          className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

/**
 * Demo Hint Tooltip
 * 
 * Small tooltip for quick tips.
 */
interface DemoHintTooltipProps {
  hint: DemoHint
  onDismiss: () => void
  children: React.ReactNode
}

export function DemoHintTooltip({ hint, onDismiss, children }: DemoHintTooltipProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  if (!isVisible) return <>{children}</>
  
  return (
    <div className="relative inline-block">
      {children}
      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64">
        <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{hint.title}</p>
              <p className="text-slate-300 mt-1">{hint.description}</p>
            </div>
          </div>
          {hint.dismissible !== false && (
            <button
              onClick={() => {
                setIsVisible(false)
                onDismiss()
              }}
              className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      </div>
    </div>
  )
}

export default DemoHintBanner
