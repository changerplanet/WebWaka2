/**
 * Demo Module Barrel Export
 * 
 * @module lib/demo
 * @phase Phase 2 Track A + Phase 3.1
 */

// Types
export * from './types'

// Storylines
export * from './storylines'

// Quick Start (Phase 3.1)
export * from './quickstart'

// Credentials (Demo Partner Remediation)
export * from './credentials'

// Guided Demo Mode (Solution D)
export * from './guided'

// Context & Provider
export { DemoModeProvider, useDemoMode, useDemoModeOptional } from './context'
