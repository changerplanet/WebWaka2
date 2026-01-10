'use client'

/**
 * Demo Mode Banner Component
 * 
 * Persistent banner indicating Partner Demo Mode is active.
 * Always visible, provides single escape hatch.
 * 
 * @module components/demo/DemoModeBanner
 * @phase Phase 2 Track A
 */

import React from 'react'
import { Play, X, Eye } from 'lucide-react'

interface DemoModeBannerProps {
  storylineName: string
  currentStep: number
  totalSteps: number
  onExit: () => void
}

export function DemoModeBanner({
  storylineName,
  currentStep,
  totalSteps,
  onExit
}: DemoModeBannerProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
      data-testid="demo-mode-banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Mode indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Partner Demo Mode</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-emerald-100">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{storylineName}</span>
            </div>
          </div>

          {/* Center: Progress */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-emerald-100 whitespace-nowrap">
              {currentStep}/{totalSteps}
            </span>
          </div>

          {/* Right: Exit button */}
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            data-testid="demo-exit-banner-btn"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Demo</span>
          </button>
        </div>
      </div>
    </div>
  )
}
