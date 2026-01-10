'use client'

/**
 * Storyline Selector Component
 * 
 * Allows users to choose a demo storyline before starting guided mode.
 * 
 * @module components/demo/StorylineSelector
 * @phase Phase 2 Track A
 */

import React from 'react'
import {
  ShoppingCart,
  Building2,
  Briefcase,
  Layers,
  Clock,
  ArrowRight,
  Calculator,
  Shield,
  AlertCircle
} from 'lucide-react'
import { Storyline, StorylineId } from '@/lib/demo/types'

interface StorylineSelectorProps {
  storylines: Storyline[]
  onSelect: (id: StorylineId) => void
}

// Default icon for unknown storylines
const DefaultIcon = Briefcase

const STORYLINE_ICONS: Partial<Record<StorylineId, React.ComponentType<{ className?: string }>>> = {
  retail: ShoppingCart,
  marketplace: Building2,
  sme: Briefcase,
  full: Layers,
  cfo: Calculator,
  regulator: Shield
}

// Default colors for unknown storylines
const DEFAULT_COLORS = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }

const STORYLINE_COLORS: Partial<Record<StorylineId, { bg: string; text: string; border: string }>> = {
  retail: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  marketplace: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  sme: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  full: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  cfo: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  regulator: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' }
}

export function StorylineSelector({ storylines, onSelect }: StorylineSelectorProps) {
  // Defensive check: ensure storylines is an array
  if (!storylines || !Array.isArray(storylines) || storylines.length === 0) {
    return (
      <div className="p-6 text-center" data-testid="storyline-selector-empty">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Storylines Available</h3>
        <p className="text-sm text-gray-500">
          Demo storylines are being prepared. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="storyline-selector">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Choose Your Demo Journey</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select a storyline that matches your interests
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {storylines.map((storyline) => {
          // Defensive checks for each storyline
          if (!storyline || !storyline.id) {
            return null
          }

          // Safe access to icon and colors with fallbacks
          const Icon = STORYLINE_ICONS[storyline.id] || DefaultIcon
          const colors = STORYLINE_COLORS[storyline.id] || DEFAULT_COLORS

          // Safe access to storyline properties
          const name = storyline.name || 'Unnamed Storyline'
          const description = storyline.description || 'Explore this demo storyline'
          const durationMinutes = storyline.durationMinutes || 10
          const steps = storyline.steps || []
          const suites = storyline.suites || []

          return (
            <button
              key={storyline.id}
              onClick={() => onSelect(storyline.id)}
              className={`group text-left p-5 rounded-xl border-2 ${colors.border} hover:shadow-lg transition-all duration-200`}
              data-testid={`storyline-${storyline.id}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    {description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {durationMinutes} min
                    </span>
                    <span>
                      {steps.length} steps
                    </span>
                    {suites.length > 0 && (
                      <span className="flex items-center gap-1 text-gray-300">
                        {suites.slice(0, 3).join(' → ')}
                        {suites.length > 3 && '...'}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ArrowRight className={`w-4 h-4 ${colors.text}`} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
