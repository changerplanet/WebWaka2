'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Shield, 
  FileCheck,
  Receipt,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  Building2,
  DollarSign,
  BarChart3
} from 'lucide-react'

interface ComplianceStats {
  vatDue: string
  withholdingTaxDue: string
  nextFilingDate: string
  pendingReturns: number
  completedFilings: number
  complianceScore: string
}

interface FilingItem {
  id: string
  type: 'VAT' | 'WHT' | 'CIT' | 'PAYE'
  period: string
  dueDate: string
  status: 'PENDING' | 'FILED' | 'OVERDUE' | 'PAID'
  amount: string
}

export default function ComplianceDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [filings, setFilings] = useState<FilingItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchComplianceData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchComplianceData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        vatDue: '₦0',
        withholdingTaxDue: '₦0',
        nextFilingDate: 'Not set',
        pendingReturns: 0,
        completedFilings: 0,
        complianceScore: '100%'
      })
      setFilings([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch compliance data:', err)
      setError('Failed to load compliance data. Make sure the compliance module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700'
      case 'FILED': return 'bg-blue-100 text-blue-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'OVERDUE': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FILED': return <FileCheck className="w-4 h-4 text-blue-500" />
      case 'OVERDUE': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="compliance-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading compliance dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="compliance-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Compliance</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchComplianceData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="compliance-dashboard">
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
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">Compliance & Tax</h1>
                  <p className="text-sm text-slate-500">Nigeria-first Compliance</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchComplianceData}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="vat-due-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                VAT 7.5%
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">VAT Due</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.vatDue || '₦0'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="wht-due-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">WHT Due</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.withholdingTaxDue || '₦0'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="pending-returns-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Pending Returns</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingReturns || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="compliance-score-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Compliance Score</p>
            <p className="text-2xl font-bold text-green-600">{stats?.complianceScore || '100%'}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tax Filings */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="filings-list">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Tax Filings</h2>
                <a 
                  href={`/dashboard/compliance/filings?tenant=${tenantSlug}`}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {filings.length > 0 ? (
                filings.map((filing) => (
                  <div key={filing.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getStatusIcon(filing.status)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{filing.type} Return</p>
                          <p className="text-sm text-slate-500">{filing.period}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">{filing.amount}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(filing.status)}`}>
                          {filing.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No tax filings yet</p>
                  <p className="text-sm text-slate-400 mt-1">Tax obligations will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="next-filing-card">
              <h2 className="font-semibold text-slate-800 mb-4">Next Filing Due</h2>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                <Calendar className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-slate-600">Due Date</p>
                  <p className="font-semibold text-slate-800">{stats?.nextFilingDate || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Receipt, label: 'File VAT Return', href: `/dashboard/compliance/vat?tenant=${tenantSlug}` },
                  { icon: FileText, label: 'WHT Filing', href: `/dashboard/compliance/wht?tenant=${tenantSlug}` },
                  { icon: Building2, label: 'FIRS Portal', href: `/dashboard/compliance/firs?tenant=${tenantSlug}` },
                  { icon: FileCheck, label: 'TCC Request', href: `/dashboard/compliance/tcc?tenant=${tenantSlug}` },
                  { icon: BarChart3, label: 'Tax Reports', href: `/dashboard/compliance/reports?tenant=${tenantSlug}` },
                  { icon: Calendar, label: 'Filing Calendar', href: `/dashboard/compliance/calendar?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Nigeria Tax Info */}
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6" data-testid="nigeria-tax-info">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">Nigeria Tax Compliance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-emerald-700 font-medium">VAT Rate</p>
                  <p className="text-emerald-600">7.5%</p>
                </div>
                <div>
                  <p className="text-emerald-700 font-medium">WHT Rate</p>
                  <p className="text-emerald-600">5-10%</p>
                </div>
                <div>
                  <p className="text-emerald-700 font-medium">CIT Rate</p>
                  <p className="text-emerald-600">30%</p>
                </div>
                <div>
                  <p className="text-emerald-700 font-medium">Filing</p>
                  <p className="text-emerald-600">Monthly/Annual</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
