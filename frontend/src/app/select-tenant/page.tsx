'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronRight, Loader2, LogOut } from 'lucide-react'

interface Membership {
  tenantId: string
  tenantName: string
  tenantSlug: string
  role: string
}

interface User {
  id: string
  email: string
  name: string | null
  globalRole: string
  memberships: Membership[]
}

export default function SelectTenantPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  
  useEffect(() => {
    fetchSession()
  }, [])
  
  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (data.authenticated && data.user) {
        setUser(data.user)
        
        // If only one tenant, auto-select it
        if (data.user.memberships.length === 1) {
          await selectTenant(data.user.memberships[0].tenantSlug)
        }
      } else {
        router.push('/login')
      }
    } catch (err) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }
  
  async function selectTenant(slug: string) {
    setSelecting(slug)
    router.push(`/dashboard?tenant=${slug}`)
  }
  
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }
  
  if (!user) return null
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Select Workspace</h1>
          <p className="text-slate-500 mt-1">Choose which workspace to access</p>
        </div>
        
        {/* User info */}
        <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900">{user.name || user.email}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tenant List */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {user.memberships.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No workspaces yet</h3>
              <p className="text-slate-500">You don't have access to any workspaces.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {user.memberships.map((membership) => (
                <button
                  key={membership.tenantId}
                  onClick={() => selectTenant(membership.tenantSlug)}
                  disabled={selecting !== null}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                      {membership.tenantName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{membership.tenantName}</p>
                      <p className="text-sm text-slate-500">
                        {membership.role === 'TENANT_ADMIN' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                  {selecting === membership.tenantSlug ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Super Admin option */}
        {user.globalRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => router.push('/')}
            className="w-full mt-4 p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            Super Admin Dashboard
          </button>
        )}
      </div>
    </div>
  )
}
