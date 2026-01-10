'use client'

/**
 * Demo Tooltip Component
 * 
 * Non-invasive tooltip overlay for Partner Demo Mode.
 * Displays step information, navigation, and exit button.
 * 
 * @module components/demo/DemoTooltip
 * @phase Phase 2 Track A
 */

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Lightbulb,
  Flag
} from 'lucide-react'
import { DemoStep } from '@/lib/demo/types'

interface DemoTooltipProps {
  step: DemoStep
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  onExit: () => void
  isFirst: boolean
  isLast: boolean
}

export function DemoTooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onExit,
  isFirst,
  isLast
}: DemoTooltipProps) {
  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
      data-testid="demo-tooltip"
    >
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-slate-400 text-sm">{step.suite}</span>
          </div>
          <button
            onClick={onExit}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            title="Exit Demo Mode"
            data-testid="demo-exit-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-slate-400 text-sm">{step.description}</p>
            </div>
          </div>

          {/* Narrative */}
          <div className="flex items-start gap-3 mb-3 p-3 bg-slate-800/50 rounded-lg">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300">{step.narrative}</p>
          </div>

          {/* Nigeria Note (if present) */}
          {step.nigeriaNote && (
            <div className="flex items-start gap-3 mb-3 p-3 bg-emerald-900/30 border border-emerald-800/50 rounded-lg">
              <Flag className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-300">
                <span className="font-medium">Nigeria-First:</span> {step.nigeriaNote}
              </p>
            </div>
          )}

          {/* Action Hint (if present) */}
          {step.actionHint && (
            <p className="text-xs text-slate-500 mb-3">
              💡 {step.actionHint}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
          <button
            onClick={onBack}
            disabled={isFirst}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isFirst
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
            data-testid="demo-back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i + 1 === currentStep
                    ? 'bg-emerald-400'
                    : i + 1 < currentStep
                    ? 'bg-emerald-600'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={isLast ? onExit : onNext}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            data-testid="demo-next-btn"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
