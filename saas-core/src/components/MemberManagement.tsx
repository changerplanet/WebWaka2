'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Shield, User, MoreVertical, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'

interface Member {
  id: string
  role: 'TENANT_ADMIN' | 'TENANT_USER'
  isActive: boolean
  joinedAt: string
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
    globalRole: string
    lastLoginAt: string | null
  }
}

interface MemberManagementProps {
  tenantSlug: string
  currentUserId: string
}

export function MemberManagement({ tenantSlug, currentUserId }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'TENANT_ADMIN' | 'TENANT_USER'>('TENANT_USER')
  const [inviting, setInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  useEffect(() => {
    fetchMembers()
  }, [tenantSlug])
  
  async function fetchMembers() {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/members`)
      const data = await res.json()
      
      if (data.success) {
        setMembers(data.members)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleInvite() {
    if (!inviteEmail) return
    
    setInviting(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMembers([data.membership, ...members])
        setInviteEmail('')
        setShowInvite(false)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to add member')
    } finally {
      setInviting(false)
    }
  }
  
  async function handleRoleChange(memberId: string, newRole: 'TENANT_ADMIN' | 'TENANT_USER') {
    setActionLoading(memberId)
    setError(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMembers(members.map(m => m.id === memberId ? data.member : m))
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }
  
  async function handleRemove(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    setActionLoading(memberId)
    setError(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/members/${memberId}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMembers(members.filter(m => m.id !== memberId))
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to remove member')
    } finally {
      setActionLoading(null)
    }
  }
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }
  
  const admins = members.filter(m => m.role === 'TENANT_ADMIN')
  const users = members.filter(m => m.role === 'TENANT_USER')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
            <p className="text-sm text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
        
        {/* Invite Form */}
        {showInvite && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-3">Add a New Member</h3>
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TENANT_USER">Member</option>
                <option value="TENANT_ADMIN">Admin</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Members List */}
        <div className="space-y-6">
          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admins ({admins.length})
              </h3>
              <div className="space-y-2">
                {admins.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isCurrentUser={member.user.id === currentUserId}
                    loading={actionLoading === member.id}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Users */}
          {users.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Members ({users.length})
              </h3>
              <div className="space-y-2">
                {users.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isCurrentUser={member.user.id === currentUserId}
                    loading={actionLoading === member.id}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Role Explanation */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-medium text-slate-900 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Admin
            </div>
            <ul className="space-y-1 text-slate-600">
              <li>• Manage team members</li>
              <li>• Configure settings & branding</li>
              <li>• Add custom domains</li>
              <li>• View all data</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              Member
            </div>
            <ul className="space-y-1 text-slate-600">
              <li>• Access workspace</li>
              <li>• View own data</li>
              <li>• Use core features</li>
              <li>• Update own profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  isCurrentUser,
  loading,
  onRoleChange,
  onRemove
}: {
  member: Member
  isCurrentUser: boolean
  loading: boolean
  onRoleChange: (id: string, role: 'TENANT_ADMIN' | 'TENANT_USER') => void
  onRemove: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-slate-900 flex items-center gap-2">
            {member.user.name || member.user.email}
            {isCurrentUser && <span className="text-xs text-slate-500">(you)</span>}
            {member.user.globalRole === 'SUPER_ADMIN' && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                Super Admin
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500">{member.user.email}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded-full ${
          member.role === 'TENANT_ADMIN' 
            ? 'bg-amber-100 text-amber-700' 
            : 'bg-slate-200 text-slate-700'
        }`}>
          {member.role === 'TENANT_ADMIN' ? 'Admin' : 'Member'}
        </span>
        
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  {member.role === 'TENANT_USER' ? (
                    <button
                      onClick={() => { onRoleChange(member.id, 'TENANT_ADMIN'); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowUp className="w-4 h-4" />
                      Make Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => { onRoleChange(member.id, 'TENANT_USER'); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowDown className="w-4 h-4" />
                      Remove Admin
                    </button>
                  )}
                  <button
                    onClick={() => { onRemove(member.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Member
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
