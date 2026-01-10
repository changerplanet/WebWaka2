/**
 * Demo Mode Types
 * 
 * Type definitions for the Partner Demo Mode system.
 * URL-driven state, stateless by default.
 * 
 * @module lib/demo/types
 * @phase Phase 2 Track A
 */

// ============================================================================
// DEMO MODE
// ============================================================================

export type DemoMode = 'live' | 'partner'

export type StorylineId = 'retail' | 'marketplace' | 'sme' | 'full' | 'cfo' | 'regulator' | 'school' | 'parent' | 'clinic' | 'patient' | 'healthRegulator' | 'hotelOwner' | 'restaurantManager' | 'hospitalityGuest' | 'civicCitizen' | 'civicAgencyStaff' | 'civicRegulator' | 'civicAuditor' | 'logisticsDispatcher' | 'logisticsDriver' | 'logisticsMerchant' | 'logisticsAuditor' | 'propertyOwner' | 'propertyManager' | 'tenant' | 'realEstateAuditor' | 'projectOwner' | 'projectManager' | 'teamMember' | 'projectAuditor' | 'recruiter' | 'hiringManager' | 'candidate' | 'recruitmentAuditor' | 'legalClient' | 'lawyer' | 'firmAdmin' | 'legalAuditor' | 'warehouseManager' | 'receivingClerk' | 'picker' | 'warehouseAuditor' | 'parkAdmin' | 'operator' | 'parkAgent' | 'passenger' | 'politicalCandidate' | 'partyOfficial' | 'politicalVolunteer' | 'politicalRegulator' | 'churchPastor' | 'churchAdmin' | 'ministryLeader' | 'churchMember'

// ============================================================================
// STORYLINE CONFIGURATION
// ============================================================================

export interface DemoStep {
  /** Unique step identifier */
  id: string
  
  /** Step number in sequence (1-based) */
  stepNumber: number
  
  /** Short title for progress bar */
  title: string
  
  /** What the user is seeing */
  description: string
  
  /** Why this matters (value proposition) */
  narrative: string
  
  /** Suite this step belongs to */
  suite: string
  
  /** Route to navigate to for this step */
  route: string
  
  /** CSS selector for element to highlight (optional) */
  highlightSelector?: string
  
  /** Position of tooltip relative to highlighted element */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  
  /** Action hint text (e.g., "Click here to...") */
  actionHint?: string
  
  /** Nigeria-first context note (optional) */
  nigeriaNote?: string
}

export interface Storyline {
  /** Unique storyline identifier */
  id: StorylineId
  
  /** Display name */
  name: string
  
  /** Short description */
  description: string
  
  /** Target persona */
  persona: string
  
  /** Estimated duration in minutes */
  durationMinutes: number
  
  /** Suites covered in this storyline */
  suites: string[]
  
  /** Ordered list of steps */
  steps: DemoStep[]
}

// ============================================================================
// DEMO STATE (URL-driven)
// ============================================================================

export interface DemoState {
  /** Current demo mode */
  mode: DemoMode
  
  /** Active storyline (null if not in guided mode) */
  storyline: StorylineId | null
  
  /** Current step number (1-based, null if not in guided mode) */
  currentStep: number | null
  
  /** Whether demo mode UI is visible */
  isActive: boolean
}

export interface DemoContextValue extends DemoState {
  /** Navigate to next step */
  nextStep: () => void
  
  /** Navigate to previous step */
  prevStep: () => void
  
  /** Jump to specific step */
  goToStep: (step: number) => void
  
  /** Start a storyline */
  startStoryline: (id: StorylineId) => void
  
  /** Exit demo mode */
  exitDemo: () => void
  
  /** Toggle between live and partner mode */
  toggleMode: () => void
  
  /** Get current step data */
  getCurrentStep: () => DemoStep | null
  
  /** Get current storyline data */
  getCurrentStoryline: () => Storyline | null
  
  /** Get total steps in current storyline */
  getTotalSteps: () => number
  
  /** Check if on first step */
  isFirstStep: () => boolean
  
  /** Check if on last step */
  isLastStep: () => boolean
}

// ============================================================================
// TOOLTIP & UI COMPONENTS
// ============================================================================

export interface TooltipProps {
  /** Step data to display */
  step: DemoStep
  
  /** Current step number */
  currentStep: number
  
  /** Total steps in storyline */
  totalSteps: number
  
  /** Callback for next button */
  onNext: () => void
  
  /** Callback for back button */
  onBack: () => void
  
  /** Callback for exit button */
  onExit: () => void
  
  /** Whether this is the first step */
  isFirst: boolean
  
  /** Whether this is the last step */
  isLast: boolean
}

export interface ProgressBarProps {
  /** Current step number (1-based) */
  currentStep: number
  
  /** Total steps */
  totalSteps: number
  
  /** Current step title */
  currentTitle: string
  
  /** Storyline name */
  storylineName: string
}

export interface HighlightProps {
  /** CSS selector to highlight */
  selector: string
  
  /** Whether highlight is active */
  isActive: boolean
}

// ============================================================================
// URL PARAMETERS
// ============================================================================

export interface DemoUrlParams {
  mode?: DemoMode
  storyline?: StorylineId
  step?: string // Will be parsed to number
}

export function parseDemoParams(searchParams: URLSearchParams): DemoUrlParams {
  return {
    mode: (searchParams.get('mode') as DemoMode) || undefined,
    storyline: (searchParams.get('storyline') as StorylineId) || undefined,
    step: searchParams.get('step') || undefined
  }
}

export function buildDemoUrl(
  basePath: string,
  params: Partial<DemoUrlParams>
): string {
  const url = new URL(basePath, 'http://localhost')
  
  if (params.mode) url.searchParams.set('mode', params.mode)
  if (params.storyline) url.searchParams.set('storyline', params.storyline)
  if (params.step) url.searchParams.set('step', params.step)
  
  return `${url.pathname}${url.search}`
}
