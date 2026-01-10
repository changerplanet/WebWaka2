'use client'

/**
 * Quick Start Banner Component
 * 
 * Shows context banner when demo is started via ?quickstart= parameter.
 * Role-specific messaging with copy link and escape controls.
 * 
 * @module components/demo/QuickStartBanner
 * @phase Phase 3.1 S2
 */

import { useEffect, useState, useCallback } from 'react'
import { X, Shuffle, Link2, Check, Calculator, Shield, Briefcase, TrendingUp, Store, Building2, Users, Landmark, Scale, FileSearch, Truck, MapPin, Package, ClipboardCheck, Home, Key, UserCircle, FileSpreadsheet, FolderKanban, Target, UserCog, BarChart2, UserPlus, UserCheck, FileUser, Clipboard, Warehouse, ScanLine, PackageCheck, ClipboardList } from 'lucide-react'
import { QuickStartConfig, QuickStartRole } from '@/lib/demo/quickstart'

interface QuickStartBannerProps {
  config: QuickStartConfig
  onSwitchRole: () => void
  onDismiss: () => void
}

// ============================================================================
// ROLE-SPECIFIC MESSAGING (S2 Polish)
// ============================================================================

interface RoleMessaging {
  icon: React.ComponentType<{ className?: string }>
  tagline: string
  gradient: string
}

const ROLE_MESSAGING: Record<string, RoleMessaging> = {
  'CFO / Finance': {
    icon: Calculator,
    tagline: 'See how every transaction flows to the ledger',
    gradient: 'from-cyan-600 to-blue-600'
  },
  'Regulator / Auditor': {
    icon: Shield,
    tagline: 'Verify audit trails and compliance controls',
    gradient: 'from-rose-600 to-pink-600'
  },
  'Investor': {
    icon: TrendingUp,
    tagline: 'Explore the full platform capability',
    gradient: 'from-violet-600 to-indigo-600'
  },
  'Partner': {
    icon: Briefcase,
    tagline: 'Discover what you can offer your clients',
    gradient: 'from-emerald-600 to-teal-600'
  },
  'Founder / SME Owner': {
    icon: Building2,
    tagline: 'Run your business from invoice to accounting',
    gradient: 'from-amber-600 to-orange-600'
  },
  'Retail Business': {
    icon: Store,
    tagline: 'Point-of-sale, inventory, and payments made simple',
    gradient: 'from-emerald-600 to-teal-600'
  },
  'Marketplace Operator': {
    icon: Building2,
    tagline: 'Manage vendors, commissions, and settlements',
    gradient: 'from-purple-600 to-violet-600'
  },
  'School Owner': {
    icon: Building2,
    tagline: 'From enrollment to accounting, without chaos',
    gradient: 'from-emerald-600 to-green-600'
  },
  'Parent / Guardian': {
    icon: Shield,
    tagline: 'Know what you owe and what your child achieved',
    gradient: 'from-blue-600 to-indigo-600'
  },
  // Civic / GovTech Suite roles
  'Citizen': {
    icon: Users,
    tagline: 'Track your application from submission to approval',
    gradient: 'from-emerald-600 to-teal-600'
  },
  'Agency Staff': {
    icon: Landmark,
    tagline: 'Process cases with full accountability and SLA tracking',
    gradient: 'from-violet-600 to-purple-600'
  },
  'Civic Regulator': {
    icon: Scale,
    tagline: 'Monitor agency performance and compliance',
    gradient: 'from-rose-600 to-pink-600'
  },
  'Auditor': {
    icon: FileSearch,
    tagline: 'Reconstruct decisions and verify integrity',
    gradient: 'from-amber-600 to-orange-600'
  },
  // Logistics Suite roles
  'Dispatcher': {
    icon: MapPin,
    tagline: 'Assign jobs, track deliveries, manage drivers',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Driver / Rider': {
    icon: Truck,
    tagline: 'Accept jobs, deliver, and capture proof',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Merchant / Shipper': {
    icon: Package,
    tagline: 'Ship goods and track deliveries in real-time',
    gradient: 'from-orange-600 to-amber-600'
  },
  'Logistics Auditor': {
    icon: ClipboardCheck,
    tagline: 'Verify deliveries, reconcile fees, audit operations',
    gradient: 'from-purple-600 to-violet-600'
  },
  // Real Estate Suite roles
  'Property Owner': {
    icon: Home,
    tagline: 'Manage your portfolio and track rental income',
    gradient: 'from-emerald-600 to-teal-600'
  },
  'Property Manager': {
    icon: Key,
    tagline: 'Handle tenants, maintenance, and collections',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Tenant': {
    icon: UserCircle,
    tagline: 'View lease terms and track your payments',
    gradient: 'from-orange-600 to-amber-600'
  },
  'Real Estate Auditor': {
    icon: FileSpreadsheet,
    tagline: 'Verify leases and reconcile rent payments',
    gradient: 'from-purple-600 to-violet-600'
  },
  // Project Management Suite roles
  'Project Owner': {
    icon: Target,
    tagline: 'Monitor project health and control costs',
    gradient: 'from-indigo-600 to-blue-600'
  },
  'Project Manager': {
    icon: FolderKanban,
    tagline: 'Plan, execute, and deliver projects on time',
    gradient: 'from-teal-600 to-emerald-600'
  },
  'Team Member': {
    icon: UserCog,
    tagline: 'Complete tasks and track your progress',
    gradient: 'from-orange-600 to-amber-600'
  },
  'Project Auditor': {
    icon: BarChart2,
    tagline: 'Audit costs and verify Commerce boundary',
    gradient: 'from-purple-600 to-violet-600'
  },
  // Recruitment Suite roles
  'Recruiter': {
    icon: UserPlus,
    tagline: 'Source candidates, manage pipeline, close placements',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Hiring Manager': {
    icon: UserCheck,
    tagline: 'Review candidates, interview, approve offers',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Candidate': {
    icon: Briefcase,
    tagline: 'Apply for roles, track progress, receive offers',
    gradient: 'from-orange-600 to-amber-600'
  },
  'Recruitment Auditor': {
    icon: Clipboard,
    tagline: 'Audit placements, verify fees, check Commerce handoff',
    gradient: 'from-purple-600 to-violet-600'
  },
  // Legal Practice Suite roles
  'Client': {
    icon: UserCircle,
    tagline: 'Track your matters, view billing, monitor deadlines',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Lawyer': {
    icon: Scale,
    tagline: 'Manage cases, track time, handle filings',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Firm Admin': {
    icon: Briefcase,
    tagline: 'Oversee practice, manage team, track retainers',
    gradient: 'from-purple-600 to-violet-600'
  },
  'Legal Auditor': {
    icon: ClipboardCheck,
    tagline: 'Verify fees, audit compliance, check Commerce boundary',
    gradient: 'from-orange-600 to-amber-600'
  },
  // Advanced Warehouse Suite roles
  'Warehouse Manager': {
    icon: Warehouse,
    tagline: 'Oversee zones, bins, and warehouse operations',
    gradient: 'from-amber-600 to-orange-600'
  },
  'Receiving Clerk': {
    icon: Truck,
    tagline: 'Process inbound shipments, verify batches',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Picker / Packer': {
    icon: PackageCheck,
    tagline: 'Execute pick lists, pack orders for dispatch',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Warehouse Auditor': {
    icon: ClipboardList,
    tagline: 'Audit inventory, verify batches, check Commerce boundary',
    gradient: 'from-purple-600 to-violet-600'
  },
  // ParkHub (Transport) Suite roles
  'Park Administrator': {
    icon: Building2,
    tagline: 'Manage transport companies, set commissions, view analytics',
    gradient: 'from-purple-600 to-indigo-600'
  },
  'Transport Operator': {
    icon: Truck,
    tagline: 'Manage routes, drivers, view tickets and earnings',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Park Agent (POS)': {
    icon: ClipboardCheck,
    tagline: 'Sell tickets at counter, process walk-in passengers',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Passenger': {
    icon: UserCircle,
    tagline: 'Search routes, book tickets, track your trip',
    gradient: 'from-amber-600 to-orange-600'
  },
  // Political Suite roles
  'Political Candidate': {
    icon: UserCircle,
    tagline: 'Campaign overview, manifesto, constituency engagements',
    gradient: 'from-purple-600 to-indigo-600'
  },
  'Party Official': {
    icon: Building2,
    tagline: 'Party operations, primaries, membership registry',
    gradient: 'from-blue-600 to-indigo-600'
  },
  'Volunteer': {
    icon: Users,
    tagline: 'Field operations, canvassing, activity reports',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Regulator / Observer': {
    icon: Shield,
    tagline: 'Audit logs, disclosures, compliance verification',
    gradient: 'from-amber-600 to-orange-600'
  },
  // Church Suite roles
  'Senior Pastor': {
    icon: UserCircle,
    tagline: 'Church overview, leadership, governance, pastoral care',
    gradient: 'from-purple-600 to-indigo-600'
  },
  'Church Admin': {
    icon: Building2,
    tagline: 'Members, services, events, reports, giving facts',
    gradient: 'from-blue-600 to-slate-600'
  },
  'Ministry Leader': {
    icon: Users,
    tagline: 'Department operations, volunteers, events, attendance',
    gradient: 'from-green-600 to-emerald-600'
  },
  'Church Member': {
    icon: Users,
    tagline: 'Services, cell groups, giving, engagement',
    gradient: 'from-amber-600 to-yellow-600'
  }
}

// Default fallback
const DEFAULT_MESSAGING: RoleMessaging = {
  icon: Briefcase,
  tagline: 'Guided demo experience',
  gradient: 'from-violet-600 to-indigo-600'
}

export function QuickStartBanner({ config, onSwitchRole, onDismiss }: QuickStartBannerProps) {
  const [copied, setCopied] = useState(false)
  
  // Get role-specific messaging
  const messaging = ROLE_MESSAGING[config.roleLabel] || DEFAULT_MESSAGING
  const RoleIcon = messaging.icon

  // Handle copy demo link
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  // Handle keyboard escape (S2 Micro-UX)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss])

  return (
    <div 
      className={`bg-gradient-to-r ${messaging.gradient} text-white px-4 py-3`}
      data-testid="quickstart-banner"
      role="banner"
      aria-label={`Viewing as ${config.roleLabel}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Role Context with Icon */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <RoleIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Viewing as <span className="font-bold">{config.roleLabel}</span>
            </p>
            <p className="text-xs text-white/80">
              {messaging.tagline}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Copy Demo Link (S2 Enhancement) */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            data-testid="quickstart-copy-link"
            aria-label={copied ? 'Link copied' : 'Copy demo link'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>

          {/* Switch Role */}
          <button
            onClick={onSwitchRole}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            data-testid="quickstart-switch-role"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>

          {/* Exit Demo */}
          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Exit demo (Esc)"
            title="Exit demo (Esc)"
            data-testid="quickstart-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
