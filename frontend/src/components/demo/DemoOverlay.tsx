'use client'

/**
 * Demo Overlay Component
 * 
 * Main component that renders demo mode UI elements.
 * Combines banner, tooltip, and navigation in one place.
 * 
 * @module components/demo/DemoOverlay
 * @phase Phase 2 Track A
 */

import React from 'react'
import { useDemoModeOptional } from '@/lib/demo/context'
import { DemoModeBanner } from './DemoModeBanner'
import { DemoTooltip } from './DemoTooltip'

export function DemoOverlay() {
  const demo = useDemoModeOptional()

  // Not in demo context or not active
  if (!demo || !demo.isActive) return null

  const currentStep = demo.getCurrentStep()
  const storyline = demo.getCurrentStoryline()
  const totalSteps = demo.getTotalSteps()

  // No storyline selected yet
  if (!storyline || !currentStep) return null

  return (
    <>
      {/* Top Banner */}
      <DemoModeBanner
        storylineName={storyline.name}
        currentStep={demo.currentStep || 1}
        totalSteps={totalSteps}
        onExit={demo.exitDemo}
      />

      {/* Bottom Tooltip */}
      <DemoTooltip
        step={currentStep}
        currentStep={demo.currentStep || 1}
        totalSteps={totalSteps}
        onNext={demo.nextStep}
        onBack={demo.prevStep}
        onExit={demo.exitDemo}
        isFirst={demo.isFirstStep()}
        isLast={demo.isLastStep()}
      />

      {/* Padding for banner */}
      <div className="h-12" />
    </>
  )
}
