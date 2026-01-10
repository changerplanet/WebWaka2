'use client'

/**
 * Demo Mode Context Provider
 * 
 * Provides demo state management for Partner Demo Mode.
 * URL is the single source of truth (stateless by default).
 * 
 * @module lib/demo/context
 * @phase Phase 2 Track A
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  DemoMode,
  DemoState,
  DemoContextValue,
  DemoStep,
  StorylineId,
  Storyline
} from './types'
import { getStoryline } from './storylines'

// ============================================================================
// CONTEXT
// ============================================================================

const DemoContext = createContext<DemoContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface DemoModeProviderProps {
  children: React.ReactNode
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Parse URL params (source of truth)
  const mode = (searchParams.get('mode') as DemoMode) || 'live'
  const storylineId = searchParams.get('storyline') as StorylineId | null
  const stepParam = searchParams.get('step')
  const currentStep = stepParam ? parseInt(stepParam, 10) : null

  // Derive state from URL
  const state: DemoState = useMemo(() => ({
    mode,
    storyline: storylineId,
    currentStep: mode === 'partner' && storylineId ? (currentStep || 1) : null,
    isActive: mode === 'partner'
  }), [mode, storylineId, currentStep])

  // Get current storyline
  const getCurrentStoryline = useCallback((): Storyline | null => {
    if (!storylineId) return null
    return getStoryline(storylineId)
  }, [storylineId])

  // Get current step
  const getCurrentStep = useCallback((): DemoStep | null => {
    const storyline = getCurrentStoryline()
    if (!storyline || !state.currentStep) return null
    return storyline.steps.find((s: any) => s.stepNumber === state.currentStep) || null
  }, [getCurrentStoryline, state.currentStep])

  // Get total steps
  const getTotalSteps = useCallback((): number => {
    const storyline = getCurrentStoryline()
    return storyline?.steps.length || 0
  }, [getCurrentStoryline])

  // Navigation helpers
  const buildUrl = useCallback((params: {
    mode?: DemoMode
    storyline?: StorylineId | null
    step?: number | null
    path?: string
  }) => {
    const url = new URLSearchParams()
    
    const newMode = params.mode ?? mode
    if (newMode !== 'live') {
      url.set('mode', newMode)
    }
    
    const newStoryline = params.storyline !== undefined ? params.storyline : storylineId
    if (newStoryline) {
      url.set('storyline', newStoryline)
    }
    
    const newStep = params.step !== undefined ? params.step : currentStep
    if (newStep && newMode === 'partner') {
      url.set('step', String(newStep))
    }
    
    const basePath = params.path ?? pathname
    const queryString = url.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
  }, [mode, storylineId, currentStep, pathname])

  // Navigate to next step
  const nextStep = useCallback(() => {
    const storyline = getCurrentStoryline()
    if (!storyline || !state.currentStep) return
    
    const nextStepNum = state.currentStep + 1
    if (nextStepNum > storyline.steps.length) return
    
    const nextStepData = storyline.steps.find((s: any) => s.stepNumber === nextStepNum)
    if (!nextStepData) return
    
    router.push(buildUrl({ step: nextStepNum, path: nextStepData.route }))
  }, [getCurrentStoryline, state.currentStep, router, buildUrl])

  // Navigate to previous step
  const prevStep = useCallback(() => {
    const storyline = getCurrentStoryline()
    if (!storyline || !state.currentStep) return
    
    const prevStepNum = state.currentStep - 1
    if (prevStepNum < 1) return
    
    const prevStepData = storyline.steps.find((s: any) => s.stepNumber === prevStepNum)
    if (!prevStepData) return
    
    router.push(buildUrl({ step: prevStepNum, path: prevStepData.route }))
  }, [getCurrentStoryline, state.currentStep, router, buildUrl])

  // Jump to specific step
  const goToStep = useCallback((step: number) => {
    const storyline = getCurrentStoryline()
    if (!storyline) return
    
    if (step < 1 || step > storyline.steps.length) return
    
    const stepData = storyline.steps.find((s: any) => s.stepNumber === step)
    if (!stepData) return
    
    router.push(buildUrl({ step, path: stepData.route }))
  }, [getCurrentStoryline, router, buildUrl])

  // Start a storyline
  const startStoryline = useCallback((id: StorylineId) => {
    const storyline = getStoryline(id)
    if (!storyline || storyline.steps.length === 0) return
    
    const firstStep = storyline.steps[0]
    router.push(buildUrl({
      mode: 'partner',
      storyline: id,
      step: 1,
      path: firstStep.route
    }))
  }, [router, buildUrl])

  // Exit demo mode
  const exitDemo = useCallback(() => {
    router.push('/commerce-demo')
  }, [router])

  // Toggle between live and partner mode
  const toggleMode = useCallback(() => {
    const newMode = mode === 'live' ? 'partner' : 'live'
    if (newMode === 'live') {
      router.push(buildUrl({ mode: 'live', storyline: null, step: null }))
    } else {
      router.push(buildUrl({ mode: 'partner' }))
    }
  }, [mode, router, buildUrl])

  // Check if on first step
  const isFirstStep = useCallback((): boolean => {
    return state.currentStep === 1
  }, [state.currentStep])

  // Check if on last step
  const isLastStep = useCallback((): boolean => {
    const total = getTotalSteps()
    return state.currentStep === total
  }, [state.currentStep, getTotalSteps])

  // Context value
  const value: DemoContextValue = useMemo(() => ({
    ...state,
    nextStep,
    prevStep,
    goToStep,
    startStoryline,
    exitDemo,
    toggleMode,
    getCurrentStep,
    getCurrentStoryline,
    getTotalSteps,
    isFirstStep,
    isLastStep
  }), [
    state,
    nextStep,
    prevStep,
    goToStep,
    startStoryline,
    exitDemo,
    toggleMode,
    getCurrentStep,
    getCurrentStoryline,
    getTotalSteps,
    isFirstStep,
    isLastStep
  ])

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useDemoMode(): DemoContextValue {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider')
  }
  return context
}

// Optional hook that doesn't throw (for components that may be outside provider)
export function useDemoModeOptional(): DemoContextValue | null {
  return useContext(DemoContext)
}
