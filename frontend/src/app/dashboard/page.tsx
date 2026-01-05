'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Building2, Users, Settings, LayoutDashboard, LogOut, ChevronRight, Activity, TrendingUp, Bell, UserCircle, Package, ShoppingCart, Store, Warehouse, Calculator, Heart, CreditCard, Handshake, Receipt, Plug, Truck, Briefcase, Megaphone, Shield, Brain, RefreshCw, Layers } from 'lucide-react'
import { OfflineStatusBar } from '@/components/OfflineStatus'
import { InstanceSwitcher, InstanceIndicator } from '@/components/platform-instance'

interface TenantBranding {
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  customDomain: string | null
  branding: TenantBranding | null
}

export default function TenantDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, activeTenantId, activeTenant, activeInstance, availableInstances, isLoading: authLoading, logout } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCapabilities, setActiveCapabilities] = useState<Set<string>>(new Set())

  const tenantSlug = searchParams.get('tenant') || activeTenant?.tenantSlug

  // Fetch tenant and capabilities when tenant context is ready
  useEffect(() => {
    // If still loading auth, wait but not forever
    if (authLoading) {
      const timeout = setTimeout(() => {
        // After 3 seconds, try to fetch anyway if we have a tenant slug
        if (tenantSlug) {
          fetchTenant(tenantSlug)
        }
      }, 3000)
      return () => clearTimeout(timeout)
    }
    
    if (tenantSlug) {
      fetchTenant(tenantSlug)
      if (activeTenantId) {
        fetchActiveCapabilities()
      }
    } else if (!activeTenantId && !tenantSlug) {
      setLoading(false)
      setError('No tenant specified. Use ?tenant=slug to view a tenant dashboard.')
    }
  }, [tenantSlug, activeTenantId, authLoading])

  async function fetchActiveCapabilities() {
    // Only fetch if we have an active tenant in the session
    if (!activeTenantId) return
    
    try {
      const res = await fetch('/api/capabilities/tenant')
      if (res.ok) {
        const data = await res.json()
        const active = new Set<string>(
          data.capabilities
            ?.filter((c: { status: string }) => c.status === 'ACTIVE')
            ?.map((c: { key: string }) => c.key) || []
        )
        setActiveCapabilities(active)
      }
    } catch (err) {
      console.error('Failed to fetch capabilities:', err)
    }
  }

  async function handleLogout() {
    await logout()
  }

  async function fetchTenant(slug: string) {
    try {
      const res = await fetch(`/api/tenants/resolve?slug=${slug}`)
      const data = await res.json()
      if (data.success && data.tenant) {
        setTenant(data.tenant)
      } else {
        setError('Tenant not found')
      }
    } catch (err) {
      setError('Failed to load tenant')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Tenant Dashboard</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href="/" className="text-green-600 hover:text-green-700">← Back to Home</a>
        </div>
      </div>
    )
  }

  const branding = tenant.branding || {
    appName: tenant.name,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: null,
    faviconUrl: null
  }

  // Check if user has multiple instances
  const hasMultipleInstances = availableInstances && availableInstances.length > 1
  
  // Get instance suite keys for filtering
  const instanceSuiteKeys = activeInstance?.suiteKeys || []
  const hasInstanceFilter = instanceSuiteKeys.length > 0

  return (
    <div className="min-h-screen bg-slate-50" style={{ '--primary': branding.primaryColor, '--secondary': branding.secondaryColor } as React.CSSProperties}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 text-white shadow-xl flex flex-col" style={{ backgroundColor: branding.primaryColor }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              {branding.appName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate">{branding.appName}</h1>
              <p className="text-xs text-white/70 truncate">{tenant.slug}.webwaka.com</p>
            </div>
          </div>
          
          {/* Instance Switcher - Phase 2.1 */}
          {hasMultipleInstances && (
            <div className="mt-4">
              <InstanceSwitcher />
            </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: true, href: null },
              { icon: Users, label: 'Users', active: false, href: null },
              { icon: ShoppingCart, label: 'POS', active: false, href: `/pos?tenant=${tenant?.slug}`, capability: 'pos' },
              { icon: Store, label: 'Storefront', active: false, href: `/store?tenant=${tenant?.slug}`, capability: 'svm' },
              { icon: Store, label: 'Marketplace', active: false, href: `/vendor?tenant=${tenant?.slug}`, capability: 'mvm' },
              { icon: Warehouse, label: 'Inventory', active: false, href: `/dashboard/inventory?tenant=${tenant?.slug}`, capability: 'inventory' },
              { icon: Calculator, label: 'Accounting', active: false, href: `/dashboard/accounting?tenant=${tenant?.slug}`, capability: 'accounting' },
              { icon: Heart, label: 'CRM', active: false, href: `/dashboard/crm?tenant=${tenant?.slug}`, capability: 'crm' },
              { icon: Truck, label: 'Logistics', active: false, href: `/dashboard/logistics?tenant=${tenant?.slug}`, capability: 'logistics' },
              { icon: Briefcase, label: 'HR & Payroll', active: false, href: `/dashboard/hr?tenant=${tenant?.slug}`, capability: 'hr_payroll' },
              { icon: Package, label: 'Procurement', active: false, href: `/dashboard/procurement?tenant=${tenant?.slug}`, capability: 'procurement' },
              { icon: Activity, label: 'Analytics', active: false, href: `/dashboard/analytics?tenant=${tenant?.slug}`, capability: 'analytics' },
              { icon: Megaphone, label: 'Marketing', active: false, href: `/dashboard/marketing?tenant=${tenant?.slug}`, capability: 'marketing' },
              { icon: Building2, label: 'B2B & Wholesale', active: false, href: `/dashboard/b2b?tenant=${tenant?.slug}`, capability: 'b2b' },
              { icon: CreditCard, label: 'Payments', active: false, href: `/dashboard/payments?tenant=${tenant?.slug}`, capability: 'payments' },
              { icon: RefreshCw, label: 'Subscriptions', active: false, href: `/dashboard/subscriptions?tenant=${tenant?.slug}`, capability: 'subscriptions_billing' },
              { icon: Shield, label: 'Compliance', active: false, href: `/dashboard/compliance?tenant=${tenant?.slug}`, capability: 'compliance_tax' },
              { icon: Brain, label: 'AI & Automation', active: false, href: `/dashboard/ai?tenant=${tenant?.slug}`, capability: 'ai_automation' },
              { icon: Handshake, label: 'Partners', active: false, href: `/dashboard/partner?tenant=${tenant?.slug}`, adminOnly: true },
              { icon: Receipt, label: 'Billing', active: false, href: `/dashboard/billing?tenant=${tenant?.slug}`, adminOnly: true },
              { icon: Plug, label: 'Integrations', active: false, href: `/dashboard/integrations?tenant=${tenant?.slug}`, capability: 'integrations_hub' },
              { icon: Package, label: 'Capabilities', active: false, href: `/dashboard/capabilities?tenant=${tenant?.slug}`, adminOnly: true },
              { icon: Layers, label: 'Instances', active: false, href: `/dashboard/platform-instances?tenant=${tenant?.slug}`, adminOnly: true },
              { icon: Bell, label: 'Notifications', active: false, href: null },
              { icon: Settings, label: 'Settings', active: false, href: `/dashboard/settings?tenant=${tenant?.slug}`, adminOnly: true },
            ].filter(item => {
              // Filter admin-only items based on role
              if (item.adminOnly) {
                const isAdmin = user?.globalRole === 'SUPER_ADMIN' || 
                  user?.memberships?.some(m => m.tenantSlug === tenant?.slug && m.role === 'TENANT_ADMIN')
                return isAdmin
              }
              // Filter capability-based items based on active capabilities
              if ((item as { capability?: string }).capability) {
                const capKey = (item as { capability: string }).capability
                // Must be active at tenant level
                if (!activeCapabilities.has(capKey)) return false
                // Phase 2.1: If instance has suite filter, check if capability is in suiteKeys
                if (hasInstanceFilter && !instanceSuiteKeys.includes(capKey)) return false
                return true
              }
              return true
            }).map((item, i) => (
              <li key={i}>
                {item.href ? (
                  <a 
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      item.active ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </a>
                ) : (
                  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    item.active ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}>
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
          
          {/* Instance Info Badge - Phase 2.1 */}
          {activeInstance && hasMultipleInstances && (
            <div className="mt-6 p-3 rounded-lg bg-white/10 text-xs">
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
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome{user?.name ? `, ${user.name}` : ' back'}!
              </h1>
              <p className="text-slate-600 mt-1">Here's what's happening with {branding.appName} today.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Instance Indicator - Phase 2.1 */}
              {hasMultipleInstances && activeInstance && (
                <InstanceIndicator />
              )}
              <button className="p-2 rounded-xl hover:bg-slate-100 transition relative">
                <Bell className="w-6 h-6 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor }} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: branding.primaryColor }}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">{user?.name || user?.email || 'User'}</p>
                  <p className="text-slate-500">
                    {user?.globalRole === 'SUPER_ADMIN' ? 'Super Admin' : 
                     user?.memberships?.find(m => m.tenantSlug === tenant?.slug)?.role === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Member'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: '1,234', change: '+12%', icon: Users },
            { label: 'Active Sessions', value: '89', change: '+5%', icon: Activity },
            { label: 'Revenue', value: '$12.5k', change: '+18%', icon: TrendingUp },
            { label: 'Pending Actions', value: '23', change: '-3%', icon: Bell },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${branding.primaryColor}20` }}>
                  <stat.icon className="w-6 h-6" style={{ color: branding.primaryColor }} />
                </div>
                <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { user: 'John Doe', action: 'logged in', time: '2 min ago' },
                { user: 'Jane Smith', action: 'updated profile', time: '15 min ago' },
                { user: 'Bob Wilson', action: 'invited a new user', time: '1 hour ago' },
                { user: 'Alice Brown', action: 'exported report', time: '3 hours ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: branding.secondaryColor }}>
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: 'Invite User' },
                { icon: Settings, label: 'Settings' },
                { icon: Activity, label: 'View Reports' },
                { icon: Building2, label: 'Branding' },
              ].map((action, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${branding.primaryColor}10` }}>
                    <action.icon className="w-6 h-6" style={{ color: branding.primaryColor }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tenant Info Card */}
        <div className="mt-6 rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Tenant Information</h3>
              <p className="text-white/80 text-sm">This is your white-labeled workspace</p>
            </div>
            <div className="text-right text-sm">
              <p><span className="text-white/60">Subdomain:</span> {tenant.slug}.webwaka.com</p>
              {tenant.customDomain && (
                <p><span className="text-white/60">Custom Domain:</span> {tenant.customDomain}</p>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Offline Status Bar */}
      {tenant && <OfflineStatusBar tenantId={tenant.id} />}
    </div>
  )
}
