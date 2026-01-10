'use client'

/**
 * Platform App Layout (FOUNDATION)
 * 
 * Canonical layout wrapper for all governed pages.
 * 
 * Features:
 * - Role Banner (always visible on governed pages)
 * - PlatformRoleProvider integration
 * - Consistent structure across all areas
 * 
 * Usage:
 * ```tsx
 * <AppLayout>
 *   <YourPageContent />
 * </AppLayout>
 * ```
 * 
 * @module components/layout/AppLayout
 * @foundation Phase 3.4
 */

import React, { ReactNode } from 'react'
import { PlatformRoleProvider, usePlatformRole } from '@/lib/auth/role-context'
import { RoleBanner } from './RoleBanner'
import { Loader2 } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface AppLayoutProps {
  /** Page content */
  children: ReactNode
  /** Hide the role banner (only for auth pages) */
  hideBanner?: boolean
  /** Show compact banner */
  compactBanner?: boolean
  /** Show governance notice in banner */
  showGovernanceNotice?: boolean
  /** Custom loading component */
  loadingComponent?: ReactNode
  /** Page background class */
  backgroundClass?: string
}

interface LayoutContentProps extends Omit<AppLayoutProps, 'children'> {
  children: ReactNode
}

// ============================================================================
// LAYOUT CONTENT (INNER)
// ============================================================================

function LayoutContent({ 
  children, 
  hideBanner = false,
  compactBanner = false,
  showGovernanceNotice = false,
  loadingComponent,
  backgroundClass = 'bg-slate-50'
}: LayoutContentProps) {
  const { isLoading, isAuthenticated } = usePlatformRole()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen ${backgroundClass} flex items-center justify-center`}>
        {loadingComponent || (
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen ${backgroundClass}`} data-testid="app-layout">
      {/* Role Banner - Always visible unless explicitly hidden */}
      {!hideBanner && isAuthenticated && (
        <RoleBanner 
          compact={compactBanner}
          showCapabilityTier={true}
          showGovernanceNotice={showGovernanceNotice}
        />
      )}
      
      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  )
}

// ============================================================================
// APP LAYOUT (MAIN EXPORT)
// ============================================================================

/**
 * AppLayout - Canonical layout for all governed pages
 * 
 * Wraps content with PlatformRoleProvider and RoleBanner.
 * Same layout for demo and production users.
 */
export function AppLayout(props: AppLayoutProps) {
  return (
    <PlatformRoleProvider>
      <LayoutContent {...props} />
    </PlatformRoleProvider>
  )
}

// ============================================================================
// SPECIALIZED LAYOUTS
// ============================================================================

/**
 * AdminLayout - For admin/settings pages
 * Shows governance notice in banner
 */
export function AdminLayout({ children, ...props }: AppLayoutProps) {
  return (
    <AppLayout showGovernanceNotice {...props}>
      {children}
    </AppLayout>
  )
}

/**
 * DashboardLayout - For main dashboard pages
 * Standard layout with full banner
 */
export function DashboardLayout({ children, ...props }: AppLayoutProps) {
  return (
    <AppLayout {...props}>
      {children}
    </AppLayout>
  )
}

/**
 * AuthLayout - For login/signup pages
 * Hides the role banner
 */
export function AuthLayout({ children, ...props }: AppLayoutProps) {
  return (
    <AppLayout hideBanner {...props}>
      {children}
    </AppLayout>
  )
}

/**
 * MobileLayout - For mobile-optimized pages
 * Uses compact banner
 */
export function MobileLayout({ children, ...props }: AppLayoutProps) {
  return (
    <AppLayout compactBanner {...props}>
      {children}
    </AppLayout>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AppLayout
