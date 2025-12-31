'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Users, Settings, LayoutDashboard, LogOut, ChevronRight, Activity, TrendingUp, Bell, UserCircle } from 'lucide-react'
import { OfflineStatusBar } from '@/components/OfflineStatus'

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

interface SessionUser {
  id: string
  email: string
  name: string | null
  globalRole: string
  memberships: { tenantId: string; tenantSlug: string; role: string }[]
}

export default function TenantDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tenantSlug = searchParams.get('tenant')

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (tenantSlug) {
      fetchTenant(tenantSlug)
    } else {
      setLoading(false)
      setError('No tenant specified. Use ?tenant=slug to view a tenant dashboard.')
    }
  }, [tenantSlug])

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.authenticated && data.user) {
        setUser(data.user)
      }
    } catch (err) {
      console.error('Failed to fetch session:', err)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
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
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Tenant Dashboard</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href="/" className="text-indigo-600 hover:text-indigo-700">← Back to Home</a>
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

  return (
    <div className="min-h-screen bg-slate-50" style={{ '--primary': branding.primaryColor, '--secondary': branding.secondaryColor } as React.CSSProperties}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 text-white shadow-xl" style={{ backgroundColor: branding.primaryColor }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              {branding.appName.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-lg">{branding.appName}</h1>
              <p className="text-xs text-white/70">{tenant.slug}.saascore.com</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: true },
              { icon: Users, label: 'Users' },
              { icon: Activity, label: 'Analytics' },
              { icon: Bell, label: 'Notifications' },
              { icon: Settings, label: 'Settings' },
            ].map((item, i) => (
              <li key={i}>
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  item.active ? 'bg-white/20' : 'hover:bg-white/10'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
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
              <p><span className="text-white/60">Subdomain:</span> {tenant.slug}.saascore.com</p>
              {tenant.customDomain && (
                <p><span className="text-white/60">Custom Domain:</span> {tenant.customDomain}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
