'use client'

/**
 * INSTANCE-AWARE SIDEBAR (Phase 2.1)
 * 
 * Dashboard sidebar that filters navigation based on active instance's suiteKeys.
 * Uses the navigation-service for filtering logic.
 * 
 * PHASE 2 BOUNDARIES:
 * - VISIBILITY filtering only
 * - RBAC remains tenant-wide
 * - Capability activation still checked globally
 * 
 * HARDENING: Now dynamically includes all capabilities from registry
 */

import { useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  LayoutDashboard, Users, ShoppingCart, Store, Warehouse, Calculator, 
  Heart, CreditCard, Handshake, Receipt, Plug, Truck, Briefcase, 
  Megaphone, Shield, Brain, RefreshCw, Settings, Bell, Package, 
  Activity, Building2, LogOut, Layers, GraduationCap, Bed, Stethoscope,
  UserCheck, Calendar, FileText
} from 'lucide-react'
import { InstanceSwitcher } from './InstanceSwitcher'

// Icon mapping for navigation items - extended to include all domains
const ICON_MAP: Record<string, any> = {
  dashboard: LayoutDashboard,
  users: Users,
  pos: ShoppingCart,
  svm: Store,
  mvm: Store,
  inventory: Warehouse,
  accounting: Calculator,
  crm: Heart,
  logistics: Truck,
  hr_payroll: Briefcase,
  procurement: Package,
  analytics: Activity,
  marketing: Megaphone,
  b2b: Building2,
  payments: CreditCard,
  subscriptions_billing: RefreshCw,
  compliance_tax: Shield,
  ai_automation: Brain,
  partner: Handshake,
  billing: Receipt,
  integrations_hub: Plug,
  capabilities: Package,
  notifications: Bell,
  settings: Settings,
  // Education domain
  school_attendance: UserCheck,
  school_grading: GraduationCap,
  // Hospitality domain
  hotel_rooms: Bed,
  hotel_reservations: Calendar,
  // Healthcare domain
  patient_records: FileText,
  appointment_scheduling: Calendar,
  // Default for unknown capabilities
  default: Package,
}

// Navigation item definition
interface NavItem {
  key: string
  label: string
  href: string | null
  capability?: string
  adminOnly?: boolean
  active?: boolean
}

interface InstanceAwareSidebarProps {
  tenantSlug: string
  activeCapabilities: Set<string>
  currentPath?: string
  branding: {
    appName: string
    primaryColor: string
    secondaryColor: string
  }
  user: {
    email?: string
    name?: string | null
    globalRole?: string
    memberships?: { tenantSlug: string; role: string }[]
  } | null
  onLogout: () => void
}

export function InstanceAwareSidebar({
  tenantSlug,
  activeCapabilities,
  currentPath = '',
  branding,
  user,
  onLogout
}: InstanceAwareSidebarProps) {
  const { activeInstance, availableInstances } = useAuth()
  
  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!user) return false
    if (user.globalRole === 'SUPER_ADMIN') return true
    return user.memberships?.some(
      m => m.tenantSlug === tenantSlug && m.role === 'TENANT_ADMIN'
    ) || false
  }, [user, tenantSlug])
  
  // Build navigation items - dynamically include all active capabilities
  const navItems: NavItem[] = useMemo(() => {
    // Core navigation items (always shown or admin-only)
    const coreItems: NavItem[] = [
      { key: 'dashboard', label: 'Dashboard', href: `/dashboard?tenant=${tenantSlug}` },
      { key: 'users', label: 'Users', href: null, adminOnly: true },
    ]
    
    // Static capability-based navigation items (main modules with known routes)
    const staticCapabilityItems: NavItem[] = [
      { key: 'pos', label: 'POS', href: `/pos?tenant=${tenantSlug}`, capability: 'pos' },
      { key: 'svm', label: 'Storefront', href: `/store?tenant=${tenantSlug}`, capability: 'svm' },
      { key: 'mvm', label: 'Marketplace', href: `/vendor?tenant=${tenantSlug}`, capability: 'mvm' },
      { key: 'inventory', label: 'Inventory', href: `/dashboard/inventory?tenant=${tenantSlug}`, capability: 'inventory' },
      { key: 'accounting', label: 'Accounting', href: `/dashboard/accounting?tenant=${tenantSlug}`, capability: 'accounting' },
      { key: 'crm', label: 'CRM', href: `/dashboard/crm?tenant=${tenantSlug}`, capability: 'crm' },
      { key: 'logistics', label: 'Logistics', href: `/dashboard/logistics?tenant=${tenantSlug}`, capability: 'logistics' },
      { key: 'hr_payroll', label: 'HR & Payroll', href: `/dashboard/hr?tenant=${tenantSlug}`, capability: 'hr_payroll' },
      { key: 'procurement', label: 'Procurement', href: `/dashboard/procurement?tenant=${tenantSlug}`, capability: 'procurement' },
      { key: 'analytics', label: 'Analytics', href: `/dashboard/analytics?tenant=${tenantSlug}`, capability: 'analytics' },
      { key: 'marketing', label: 'Marketing', href: `/dashboard/marketing?tenant=${tenantSlug}`, capability: 'marketing' },
      { key: 'b2b', label: 'B2B & Wholesale', href: `/dashboard/b2b?tenant=${tenantSlug}`, capability: 'b2b' },
      { key: 'payments', label: 'Payments', href: `/dashboard/payments?tenant=${tenantSlug}`, capability: 'payments' },
      { key: 'subscriptions_billing', label: 'Subscriptions', href: `/dashboard/subscriptions?tenant=${tenantSlug}`, capability: 'subscriptions_billing' },
      { key: 'compliance_tax', label: 'Compliance', href: `/dashboard/compliance?tenant=${tenantSlug}`, capability: 'compliance_tax' },
      { key: 'ai_automation', label: 'AI & Automation', href: `/dashboard/ai?tenant=${tenantSlug}`, capability: 'ai_automation' },
      // Education domain
      { key: 'school_attendance', label: 'Attendance', href: `/dashboard/attendance?tenant=${tenantSlug}`, capability: 'school_attendance' },
      { key: 'school_grading', label: 'Grading', href: `/dashboard/grading?tenant=${tenantSlug}`, capability: 'school_grading' },
      // Hospitality domain
      { key: 'hotel_rooms', label: 'Rooms', href: `/dashboard/rooms?tenant=${tenantSlug}`, capability: 'hotel_rooms' },
      { key: 'hotel_reservations', label: 'Reservations', href: `/dashboard/reservations?tenant=${tenantSlug}`, capability: 'hotel_reservations' },
      // Healthcare domain
      { key: 'patient_records', label: 'Patient Records', href: `/dashboard/patients?tenant=${tenantSlug}`, capability: 'patient_records' },
      { key: 'appointment_scheduling', label: 'Appointments', href: `/dashboard/appointments?tenant=${tenantSlug}`, capability: 'appointment_scheduling' },
    ]
    
    // Admin-only items
    const adminItems: NavItem[] = [
      { key: 'partner', label: 'Partners', href: `/dashboard/partner?tenant=${tenantSlug}`, adminOnly: true },
      { key: 'billing', label: 'Billing', href: `/dashboard/billing?tenant=${tenantSlug}`, adminOnly: true },
      { key: 'integrations_hub', label: 'Integrations', href: `/dashboard/integrations?tenant=${tenantSlug}`, capability: 'integrations_hub' },
      { key: 'capabilities', label: 'Capabilities', href: `/dashboard/capabilities?tenant=${tenantSlug}`, adminOnly: true },
      { key: 'notifications', label: 'Notifications', href: null },
      { key: 'settings', label: 'Settings', href: `/dashboard/settings?tenant=${tenantSlug}`, adminOnly: true },
    ]
    
    return [...coreItems, ...staticCapabilityItems, ...adminItems]
  }, [tenantSlug])
  
  // Filter navigation by instance suiteKeys and active capabilities
  const filteredNavItems = useMemo(() => {
    const instanceSuiteKeys = activeInstance?.suiteKeys || []
    const hasInstanceFilter = instanceSuiteKeys.length > 0
    
    return navItems.filter(item => {
      // Admin-only items - check role
      if (item.adminOnly && !isAdmin) {
        return false
      }
      
      // No capability required - always show
      if (!item.capability) {
        return true
      }
      
      // Check if capability is active at tenant level
      if (!activeCapabilities.has(item.capability)) {
        return false
      }
      
      // If instance has suite filter, check if capability is in suiteKeys
      if (hasInstanceFilter && !instanceSuiteKeys.includes(item.capability)) {
        return false
      }
      
      return true
    })
  }, [navItems, activeInstance, activeCapabilities, isAdmin])
  
  // Show multi-instance indicator
  const hasMultipleInstances = availableInstances && availableInstances.length > 1
  
  return (
    <aside 
      className="fixed left-0 top-0 h-full w-64 text-white shadow-xl flex flex-col"
      style={{ backgroundColor: branding.primaryColor }}
      data-testid="instance-aware-sidebar"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
            {branding.appName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{branding.appName}</h1>
            <p className="text-xs text-white/70 truncate">{tenantSlug}.webwaka.com</p>
          </div>
        </div>
        
        {/* Instance Switcher - only if multiple instances */}
        {hasMultipleInstances && (
          <div className="mt-4">
            <InstanceSwitcher />
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {filteredNavItems.map(item => {
            const Icon = ICON_MAP[item.key] || ICON_MAP.default
            const isActive = item.href && currentPath.includes(item.href.split('?')[0])
            
            return (
              <li key={item.key}>
                {item.href ? (
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                    data-testid={`nav-item-${item.key}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </a>
                ) : (
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
                    data-testid={`nav-item-${item.key}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        
        {/* Instance info badge */}
        {activeInstance && hasMultipleInstances && (
          <div className="mt-6 px-4">
            <div className="p-3 rounded-lg bg-white/10 text-xs">
              <div className="flex items-center gap-2 text-white/70 mb-1">
                <Layers className="w-3 h-3" />
                Active Instance
              </div>
              <p className="font-medium truncate">
                {activeInstance.displayName || activeInstance.name}
              </p>
              <p className="text-white/60 mt-0.5">
                {activeInstance.suiteKeys?.length === 0 
                  ? 'All capabilities' 
                  : `${activeInstance.suiteKeys?.length} capabilities`}
              </p>
            </div>
          </div>
        )}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
