'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Clock, DollarSign, Package, ArrowRightLeft, RefreshCw, Eye, TrendingDown, Users, MapPin } from 'lucide-react'

interface RiskIndicator {
  type: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  staffName?: string
}

interface OversightData {
  date: string
  openShifts: Array<{
    id: string
    shiftNumber: string
    registerId: string | null
    openedByName: string
    openedAt: string
    locationId: string
  }>
  summary: {
    totalSales: number
    totalSalesAmount: number
    totalVoids: number
    totalVoidedAmount: number
    totalRefunds: number
    totalDiscounts: number
    discountRate: number
    voidRate: number
    adjustmentCount: number
    transferCount: number
  }
  byPaymentMethod: Record<string, { count: number; total: number }>
  byStaff: Record<string, { count: number; total: number; voids: number; discounts: number }>
  riskIndicators: RiskIndicator[]
  recentVoids: Array<{
    saleNumber: string
    amount: number
    reason: string
    staffName: string
    saleDate: string
  }>
  recentAdjustments: Array<{
    adjustmentNumber: string
    adjustmentType: string
    productName: string
    quantityChange: number
    reason: string
    approvedByName: string
    performedAt: string
  }>
  recentTransfers: Array<{
    transferNumber: string
    transferType: string
    amount: number
    reason: string
    approvedByName: string
    initiatedAt: string
  }>
}

interface SupervisorDashboardProps {
  locationId?: string
  onClose: () => void
}

export function SupervisorDashboard({ locationId, onClose }: SupervisorDashboardProps) {
  const [data, setData] = useState<OversightData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    fetchData()
  }, [locationId, selectedDate])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ date: selectedDate })
      if (locationId) params.set('locationId', locationId)

      const response = await fetch(`/api/pos/oversight?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      setError('Network error loading dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => 
    `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200'
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            Supervisor Oversight Dashboard
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
            <button
              onClick={fetchData}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading oversight data...</div>
          ) : data ? (
            <div className="space-y-6">
              {data.riskIndicators.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Risk Indicators
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.riskIndicators.map((risk, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${getSeverityColor(risk.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-semibold uppercase">{risk.type.replace(/_/g, ' ')}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            risk.severity === 'HIGH' ? 'bg-red-200' : 'bg-amber-200'
                          }`}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{risk.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Total Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(data.summary.totalSalesAmount)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {data.summary.totalSales} transactions
                  </p>
                </div>

                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Voids</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {data.summary.totalVoids}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {data.summary.voidRate.toFixed(1)}% rate
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-medium">Adjustments</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {data.summary.adjustmentCount}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">today</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Transfers</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {data.summary.transferCount}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">cash movements</p>
                </div>
              </div>

              {data.openShifts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    Open Shifts ({data.openShifts.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {data.openShifts.map((shift) => (
                      <div key={shift.id} className="bg-white border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{shift.shiftNumber}</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">OPEN</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{shift.openedByName}</p>
                        <p className="text-xs text-slate-400">
                          Since {new Date(shift.openedAt).toLocaleTimeString('en-NG')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(data.byStaff).length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    By Staff
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-3 font-medium">Staff</th>
                          <th className="text-right p-3 font-medium">Sales</th>
                          <th className="text-right p-3 font-medium">Total</th>
                          <th className="text-right p-3 font-medium">Voids</th>
                          <th className="text-right p-3 font-medium">Discounts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.byStaff).map(([name, stats]) => (
                          <tr key={name} className="border-t border-slate-100">
                            <td className="p-3">{name}</td>
                            <td className="p-3 text-right">{stats.count}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(stats.total)}</td>
                            <td className={`p-3 text-right ${stats.voids > 3 ? 'text-red-600 font-medium' : ''}`}>
                              {stats.voids}
                            </td>
                            <td className="p-3 text-right">{formatCurrency(stats.discounts)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.recentVoids.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Recent Voids</h3>
                  <div className="space-y-2">
                    {data.recentVoids.map((v, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-slate-600">{v.saleNumber}</span>
                          <span className="font-medium text-red-700">{formatCurrency(v.amount)}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{v.reason || 'No reason provided'}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          By {v.staffName} at {new Date(v.saleDate).toLocaleTimeString('en-NG')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.recentAdjustments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Recent Inventory Adjustments</h3>
                  <div className="space-y-2">
                    {data.recentAdjustments.map((a, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{a.productName}</span>
                          <span className={`font-medium ${a.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {a.quantityChange > 0 ? '+' : ''}{a.quantityChange}
                          </span>
                        </div>
                        <p className="text-slate-600">{a.adjustmentType.replace(/_/g, ' ')} - {a.reason}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Approved by {a.approvedByName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  )
}
