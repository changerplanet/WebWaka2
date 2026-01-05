'use client'

/**
 * PHASE 4B: Partner Staff Management
 * 
 * Manage partner team members:
 * - Add/remove staff
 * - Assign roles (Owner, Admin, Sales, Support)
 * - Client visibility scoping
 */

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Shield,
  ShieldCheck,
  UserCircle,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface StaffMember {
  id: string
  userId: string
  role: string
  displayName: string | null
  department: string | null
  assignedTenantIds: string[]
  isActive: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  }
  permissions: {
    canManageStaff: boolean
    canManageClients: boolean
    canManagePackages: boolean
    canViewEarnings: boolean
    canCreateClients: boolean
    canSuspendClients: boolean
    canViewAllClients: boolean
  }
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  PARTNER_OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
  PARTNER_ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  PARTNER_SALES: { label: 'Sales', color: 'bg-emerald-100 text-emerald-700' },
  PARTNER_SUPPORT: { label: 'Support', color: 'bg-amber-100 text-amber-700' },
  PARTNER_STAFF: { label: 'Staff', color: 'bg-slate-100 text-slate-700' },
}

export default function PartnerStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    try {
      setLoading(true)
      const res = await fetch('/api/partner/staff?includeInactive=true')
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to load staff')
        return
      }

      setStaff(data.staff)
    } catch (err) {
      setError('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(member: StaffMember) {
    if (!confirm(`Are you sure you want to remove "${member.user.name || member.user.email}"?`)) return

    try {
      const res = await fetch(`/api/partner/staff/${member.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        fetchStaff()
      } else {
        alert(data.error || 'Failed to remove staff member')
      }
    } catch (err) {
      console.error('Failed to remove staff:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Required</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href="/dashboard/partner" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="staff-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard/partner/saas"
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-600" />
                  Team Management
                </h1>
                <p className="text-slate-600 text-sm mt-1">Manage your sales and support staff</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              data-testid="add-staff-btn"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Legend */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Role Permissions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">Owner</span>
              <p className="text-slate-500 mt-1">Full access</p>
            </div>
            <div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Admin</span>
              <p className="text-slate-500 mt-1">Manage clients & staff</p>
            </div>
            <div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Sales</span>
              <p className="text-slate-500 mt-1">Create clients</p>
            </div>
            <div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">Support</span>
              <p className="text-slate-500 mt-1">View assigned clients</p>
            </div>
            <div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">Staff</span>
              <p className="text-slate-500 mt-1">View earnings</p>
            </div>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No team members yet</h2>
            <p className="text-slate-600 mb-6">Add your first team member to start delegating work</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add First Staff
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staff.map((member) => (
                  <tr key={member.id} className={!member.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {member.displayName || member.user.name || 'Unnamed'}
                          </p>
                          <p className="text-sm text-slate-500">{member.user.email || member.user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ROLE_LABELS[member.role]?.color || 'bg-slate-100 text-slate-700'
                      }`}>
                        {ROLE_LABELS[member.role]?.label || member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.department || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {member.isActive ? (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <XCircle className="w-4 h-4" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingStaff(member)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                        {member.role !== 'PARTNER_OWNER' && (
                          <button
                            onClick={() => handleRemove(member)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingStaff) && (
        <StaffModal
          staff={editingStaff}
          onClose={() => {
            setShowAddModal(false)
            setEditingStaff(null)
          }}
          onSave={() => {
            setShowAddModal(false)
            setEditingStaff(null)
            fetchStaff()
          }}
        />
      )}
    </div>
  )
}

interface StaffModalProps {
  staff: StaffMember | null
  onClose: () => void
  onSave: () => void
}

function StaffModal({ staff, onClose, onSave }: StaffModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    userId: '',
    role: staff?.role || 'PARTNER_STAFF',
    displayName: staff?.displayName || '',
    department: staff?.department || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = staff
        ? `/api/partner/staff/${staff.id}`
        : '/api/partner/staff'
      const method = staff ? 'PATCH' : 'POST'

      const body = staff
        ? {
            role: form.role,
            displayName: form.displayName || null,
            department: form.department || null,
          }
        : {
            userId: form.userId,
            role: form.role,
            displayName: form.displayName || null,
            department: form.department || null,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to save')
        return
      }

      onSave()
    } catch (err) {
      setError('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {staff ? 'Edit Staff' : 'Add Staff'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!staff && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User ID *
              </label>
              <input
                type="text"
                required
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="User UUID"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter the user's ID to add them to your team
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="PARTNER_ADMIN">Admin</option>
              <option value="PARTNER_SALES">Sales</option>
              <option value="PARTNER_SUPPORT">Support</option>
              <option value="PARTNER_STAFF">Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Sales, Support, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : staff ? 'Update' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
