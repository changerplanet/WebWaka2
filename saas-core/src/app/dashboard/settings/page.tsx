'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Settings, Users, Globe, Palette, ArrowLeft, Save, Loader2, Shield, User } from 'lucide-react'
import { MemberManagement } from '@/components/MemberManagement'
import { DomainManagement } from '@/components/DomainManagement'
import { BrandingSettings } from '@/components/BrandingSettings'

interface SessionUser {
  id: string
  email: string
  name: string | null
  globalRole: string
  memberships: { tenantId: string; tenantSlug: string; role: string }[]
}

interface TenantSettings {
  id: string
  name: string
  slug: string
  status: string
  branding: {
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
  domains: any[]
  memberCount: number
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [user, setUser] = useState<SessionUser | null>(null)
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'domains' | 'branding'>('general')
  const [userRole, setUserRole] = useState<'TENANT_ADMIN' | 'TENANT_USER' | null>(null)
  
  useEffect(() => {
    if (tenantSlug) {
      fetchData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])
  
  async function fetchData() {
    try {
      // Fetch session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated) {
        router.push(`/login?redirect=/dashboard/settings?tenant=${tenantSlug}`)
        return
      }
      
      setUser(sessionData.user)
      
      // Check user role
      const membership = sessionData.user.memberships.find(
        (m: any) => m.tenantSlug === tenantSlug
      )
      
      const isSuperAdmin = sessionData.user.globalRole === 'SUPER_ADMIN'
      const isAdmin = membership?.role === 'TENANT_ADMIN' || isSuperAdmin
      
      if (!isAdmin) {
        setError('Access denied. Only Tenant Admins can access settings.')
        setLoading(false)
        return
      }
      
      setUserRole(isSuperAdmin ? 'TENANT_ADMIN' : membership?.role)
      
      // Fetch settings
      const settingsRes = await fetch(`/api/tenants/${tenantSlug}/settings`)
      const settingsData = await settingsRes.json()
      
      if (!settingsData.success) {
        setError(settingsData.error || 'Failed to load settings')
      } else {
        setSettings(settingsData.tenant)
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href={`/dashboard?tenant=${tenantSlug}`} className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }
  
  if (!settings) return null
  
  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'branding', label: 'Branding', icon: Palette },
  ]
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href={`/dashboard?tenant=${tenantSlug}`}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-500">{settings.branding.appName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="w-4 h-4" />
              <span>Tenant Admin</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <nav className="w-64 flex-shrink-0">
            <ul className="space-y-1">
              {tabs.map(tab => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Content */}
          <main className="flex-1">
            {activeTab === 'general' && (
              <GeneralSettings settings={settings} tenantSlug={tenantSlug!} onUpdate={setSettings} />
            )}
            {activeTab === 'members' && (
              <MemberManagement tenantSlug={tenantSlug!} currentUserId={user?.id || ''} />
            )}
            {activeTab === 'domains' && (
              <DomainManagement tenantSlug={tenantSlug!} />
            )}
            {activeTab === 'branding' && (
              <BrandingSettings 
                settings={settings} 
                tenantSlug={tenantSlug!} 
                onUpdate={(branding) => setSettings(prev => prev ? { ...prev, branding } : null)} 
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

// General Settings Component
function GeneralSettings({ settings, tenantSlug, onUpdate }: {
  settings: TenantSettings
  tenantSlug: string
  onUpdate: (settings: TenantSettings) => void
}) {
  const [name, setName] = useState(settings.name)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  async function handleSave() {
    setSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      
      const data = await res.json()
      
      if (data.success) {
        onUpdate({ ...settings, name })
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">General Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Subdomain
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={settings.slug}
              disabled
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
            <span className="text-slate-500">.saascore.com</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Subdomain cannot be changed after creation</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <div className={`px-4 py-2 rounded-lg ${
              settings.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
              settings.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700' :
              'bg-slate-50 text-slate-700'
            }`}>
              {settings.status}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Members
            </label>
            <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-700">
              {settings.memberCount} member{settings.memberCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
