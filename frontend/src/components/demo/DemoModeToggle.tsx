'use client'

/**
 * Demo Mode Toggle Component
 * 
 * Simple toggle between Live Mode and Guided Demo Mode.
 * 
 * @module components/demo/DemoModeToggle
 * @phase Phase 2 Track A
 */

import React from 'react'
import { Play, Eye } from 'lucide-react'
import { DemoMode } from '@/lib/demo/types'

interface DemoModeToggleProps {
  mode: DemoMode
  onToggle: () => void
}

export function DemoModeToggle({ mode, onToggle }: DemoModeToggleProps) {
  return (
    <div 
      className="inline-flex items-center p-1 bg-gray-100 rounded-lg"
      data-testid="demo-mode-toggle"
    >
      <button
        onClick={mode === 'partner' ? onToggle : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === 'live'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        data-testid="demo-mode-live-btn"
      >
        <Eye className="w-4 h-4" />
        Live Mode
      </button>
      <button
        onClick={mode === 'live' ? onToggle : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === 'partner'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        data-testid="demo-mode-partner-btn"
      >
        <Play className="w-4 h-4" />
        Guided Demo
      </button>
    </div>
  )
}
