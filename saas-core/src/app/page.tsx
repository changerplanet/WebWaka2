'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, Palette, Globe, Shield, Zap, Plus, ChevronRight, Check, X, Loader2 } from 'lucide-react'

interface TenantDomain {
  id: string
  domain: string
  type: 'SUBDOMAIN' | 'CUSTOM'
  status: 'PENDING' | 'VERIFIED' | 'FAILED'
  isPrimary: boolean
}

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  appName: string
  primaryColor: string
  secondaryColor: string
  domains: TenantDomain[]
  createdAt: string
  branding?: {
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
  } | null
  _count?: {
    users: number
  }
}

interface CreateTenantForm {
  name: string
  slug: string
  customDomain: string
  appName: string
  primaryColor: string
  secondaryColor: string
}

export default function HomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [form, setForm] = useState<CreateTenantForm>({
    name: '',
    slug: '',
    customDomain: '',
    appName: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6'
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  async function fetchTenants() {
    try {
      const res = await fetch('/api/tenants')
      const data = await res.json()
      if (data.success) {
        setTenants(data.tenants)
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSuccess(`Tenant "${data.tenant.name}" created successfully!`)
        setShowCreateModal(false)
        setForm({
          name: '',
          slug: '',
          customDomain: '',
          appName: '',
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6'
        })
        fetchTenants()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to create tenant')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function handleSlugChange(name: string) {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setForm(prev => ({ ...prev, name, slug, appName: name || prev.appName }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SaaS Core</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white/80 hover:text-white transition">Documentation</button>
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition">
                Super Admin
              </button>
            </div>
          </div>
        </nav>
        
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 text-sm mb-6">
            <Shield className="w-4 h-4" />
            Production-Grade Multi-Tenancy
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Multi-Tenant SaaS
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              Platform Core
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Strict tenant isolation, subdomain &amp; custom domain resolution,
            white-label branding, and role-based access control.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-white/90 transition shadow-lg shadow-indigo-900/30"
          >
            <Plus className="w-5 h-5" />
            Create New Tenant
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-6 -mt-10 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Globe, title: 'Domain Resolution', desc: 'Subdomain & custom domain tenant routing' },
            { icon: Palette, title: 'White-Label', desc: 'Full branding customization per tenant' },
            { icon: Shield, title: 'Strict Isolation', desc: 'No cross-tenant data access' },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="container mx-auto px-6 mt-8">
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              <X className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Tenants List */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Active Tenants</h2>
            <p className="text-slate-600 mt-1">Manage your multi-tenant organizations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Tenant
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No tenants yet</h3>
            <p className="text-slate-500 mb-6">Create your first tenant to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create First Tenant
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(tenant => (
              <div
                key={tenant.id}
                className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: tenant.branding?.primaryColor || '#6366f1' }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tenant.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {tenant.branding?.appName || tenant.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4">{tenant.name}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{tenant.slug}.saascore.com</span>
                  </div>
                  {tenant.customDomain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-600">{tenant.customDomain}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{tenant._count?.users || 0} users</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: tenant.branding?.primaryColor || '#6366f1' }}
                      title="Primary Color"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm -ml-2" 
                      style={{ backgroundColor: tenant.branding?.secondaryColor || '#8b5cf6' }}
                      title="Secondary Color"
                    />
                  </div>
                  <div className="flex-1" />
                  <a
                    href={`/?tenant=${tenant.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium group-hover:gap-2 transition-all"
                  >
                    View Tenant
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Architecture Info */}
      <section className="container mx-auto px-6 pb-16">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Architecture</h3>
              <ul className="space-y-3">
                {[
                  'Next.js App Router',
                  'PostgreSQL + Prisma ORM',
                  'Middleware-based tenant resolution',
                  'Role-based access (Super Admin, Tenant Admin, User)',
                  'Magic link passwordless auth',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Tenant Resolution</h3>
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Subdomain</p>
                  <code className="text-green-400">acme.saascore.com → tenant: acme</code>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Custom Domain</p>
                  <code className="text-green-400">app.acme.com → tenant: acme</code>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Query Param (Testing)</p>
                  <code className="text-green-400">?tenant=acme → tenant: acme</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create New Tenant</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateTenant} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => handleSlugChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="Acme Corporation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subdomain Slug *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-l-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="acme"
                  />
                  <span className="px-4 py-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 text-sm">
                    .saascore.com
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Domain (Optional)
                </label>
                <input
                  type="text"
                  value={form.customDomain}
                  onChange={e => setForm(prev => ({ ...prev, customDomain: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="app.acme.com"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-medium text-slate-900 mb-4">White-Label Branding</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      App Name
                    </label>
                    <input
                      type="text"
                      value={form.appName}
                      onChange={e => setForm(prev => ({ ...prev, appName: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="Acme App"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.primaryColor}
                          onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-12 h-12 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={form.primaryColor}
                          onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.secondaryColor}
                          onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-12 h-12 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={form.secondaryColor}
                          onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Tenant
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          <p>SaaS Core — Production-grade multi-tenant platform</p>
        </div>
      </footer>
    </div>
  )
}
