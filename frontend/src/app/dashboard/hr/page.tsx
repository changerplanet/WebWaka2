'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Users, 
  UserPlus,
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  FileText,
  Award,
  Building2,
  CheckCircle
} from 'lucide-react'

interface HRStats {
  totalEmployees: number
  activeEmployees: number
  onLeave: number
  pendingApprovals: number
  openPositions: number
  payrollDue: string
}

interface EmployeeSummary {
  id: string
  name: string
  email: string
  department: string
  position: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'
  joinDate: string
}

export default function HRDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<HRStats | null>(null)
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchHRData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchHRData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        totalEmployees: 0,
        activeEmployees: 0,
        onLeave: 0,
        pendingApprovals: 0,
        openPositions: 0,
        payrollDue: 'Not set'
      })
      setEmployees([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch HR data:', err)
      setError('Failed to load HR data. Make sure the HR module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-700'
      case 'TERMINATED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="hr-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading HR dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="hr-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load HR</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchHRData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="hr-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">HR & Payroll</h1>
                  <p className="text-sm text-slate-500">People Management</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchHRData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              data-testid="refresh-dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="total-employees-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Employees</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.totalEmployees || 0}</p>
            <p className="text-xs text-slate-400 mt-1">{stats?.activeEmployees || 0} active</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="on-leave-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">On Leave</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.onLeave || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="pending-approvals-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Pending Approvals</p>
            <p className="text-2xl font-bold text-orange-600">{stats?.pendingApprovals || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="open-positions-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Open Positions</p>
            <p className="text-2xl font-bold text-green-600">{stats?.openPositions || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Employees */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="employees-list">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Team Members</h2>
                <a 
                  href={`/dashboard/hr/employees?tenant=${tenantSlug}`}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <div key={employee.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">{employee.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{employee.name}</p>
                          <p className="text-sm text-slate-500">{employee.position} • {employee.department}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(employee.status)}`}>
                        {employee.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No employees added yet</p>
                  <a 
                    href={`/dashboard/hr/employees/new?tenant=${tenantSlug}`}
                    className="text-sm text-purple-600 hover:text-purple-700 mt-2 inline-block"
                  >
                    Add your first employee →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="payroll-card">
              <h2 className="font-semibold text-slate-800 mb-4">Payroll Status</h2>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Next Payroll</p>
                  <p className="font-semibold text-slate-800">{stats?.payrollDue || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: UserPlus, label: 'Add Employee', href: `/dashboard/hr/employees/new?tenant=${tenantSlug}` },
                  { icon: Calendar, label: 'Leave Requests', href: `/dashboard/hr/leave?tenant=${tenantSlug}` },
                  { icon: DollarSign, label: 'Run Payroll', href: `/dashboard/hr/payroll?tenant=${tenantSlug}` },
                  { icon: Briefcase, label: 'Job Postings', href: `/dashboard/hr/jobs?tenant=${tenantSlug}` },
                  { icon: Award, label: 'Performance', href: `/dashboard/hr/performance?tenant=${tenantSlug}` },
                  { icon: Building2, label: 'Departments', href: `/dashboard/hr/departments?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-purple-600" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
