'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Calculator, DollarSign, ChevronDown, ChevronRight, AlertTriangle, Check, FileText } from 'lucide-react'

interface RegisterSummary {
  registerId: string
  locationId: string
  locationName: string
  shifts: Array<{
    shiftNumber: string
    status: string
    openedByName: string
    closedByName: string | null
    openedAt: string
    closedAt: string | null
    openingFloat: number
    expectedCash: number | null
    actualCash: number | null
    cashVariance: number | null
    varianceReason: string | null
    totalSales: number
    totalRefunds: number
    salesCount: number
    byPaymentMethod: Record<string, { count: number; total: number }>
  }>
  totals: {
    salesCount: number
    totalSales: number
    totalCash: number
    totalCard: number
    totalTransfer: number
    totalMobileMoney: number
    totalOther: number
    totalVariance: number
    openingFloat: number
    closingCash: number
    transfersIn: number
    transfersOut: number
  }
}

interface LocationSummary {
  locationId: string
  locationName: string
  registers: RegisterSummary[]
  totals: RegisterSummary['totals']
}

interface ReconciliationData {
  date: string
  tenantTotals: RegisterSummary['totals'] & {
    locationCount: number
    registerCount: number
    shiftCount: number
  }
  byLocation: LocationSummary[]
  reconciliationStatus: {
    total: number
    open: number
    closed: number
    reconciled: number
    withVariance: number
  }
  zReportLinks: Array<{
    shiftId: string
    shiftNumber: string
    closedAt: string
    variance: number
  }>
  unreconciledShifts: Array<{
    shiftId: string
    shiftNumber: string
    status: string
    closedAt: string
    closedByName: string
  }>
}

interface DailyReconciliationProps {
  locationId?: string
  onClose: () => void
  onViewZReport?: (shiftId: string) => void
}

export function DailyReconciliation({ locationId, onClose, onViewZReport }: DailyReconciliationProps) {
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [locationId, selectedDate])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ date: selectedDate })
      if (locationId) params.set('locationId', locationId)

      const response = await fetch(`/api/pos/daily-reconciliation?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result)
        if (result.byLocation.length === 1) {
          setExpandedLocations(new Set([result.byLocation[0].locationId]))
        }
      } else {
        setError(result.error || 'Failed to load reconciliation data')
      }
    } catch (err) {
      setError('Network error loading data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => 
    `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  const toggleLocation = (id: string) => {
    const next = new Set(expandedLocations)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedLocations(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            Daily Reconciliation
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
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
            <div className="text-center py-12 text-slate-500">Loading reconciliation data...</div>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-teal-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-teal-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Total Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-700">
                    {formatCurrency(data.tenantTotals.totalSales)}
                  </p>
                  <p className="text-xs text-teal-600 mt-1">
                    {data.tenantTotals.salesCount} transactions
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Shifts</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-700">
                    {data.tenantTotals.shiftCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.reconciliationStatus.reconciled} reconciled
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Cash Collected</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(data.tenantTotals.closingCash)}
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${
                  data.tenantTotals.totalVariance !== 0 ? 'bg-amber-50' : 'bg-green-50'
                }`}>
                  <div className={`flex items-center gap-2 mb-1 ${
                    data.tenantTotals.totalVariance !== 0 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Net Variance</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    data.tenantTotals.totalVariance !== 0 ? 'text-amber-700' : 'text-green-700'
                  }`}>
                    {formatCurrency(data.tenantTotals.totalVariance)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.reconciliationStatus.withVariance} with variance
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Payment Method Breakdown</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Cash</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(data.tenantTotals.totalCash)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Card</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(data.tenantTotals.totalCard)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Transfer</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(data.tenantTotals.totalTransfer)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Mobile Money</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(data.tenantTotals.totalMobileMoney)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Other</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(data.tenantTotals.totalOther)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  By Location
                </h3>
                <div className="space-y-3">
                  {data.byLocation.map((location) => (
                    <div key={location.locationId} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleLocation(location.locationId)}
                        className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedLocations.has(location.locationId) ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-medium">{location.locationName}</span>
                          <span className="text-sm text-slate-500">
                            ({location.registers.length} register{location.registers.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(location.totals.totalSales)}</p>
                          {location.totals.totalVariance !== 0 && (
                            <p className={`text-xs ${location.totals.totalVariance < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                              Variance: {formatCurrency(location.totals.totalVariance)}
                            </p>
                          )}
                        </div>
                      </button>

                      {expandedLocations.has(location.locationId) && (
                        <div className="p-4 border-t border-slate-200">
                          {location.registers.map((register) => (
                            <div key={register.registerId} className="mb-4 last:mb-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-700">
                                  Register: {register.registerId || 'Default'}
                                </span>
                                <span className="text-sm text-slate-500">
                                  {register.shifts.length} shift{register.shifts.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                {register.shifts.map((shift) => (
                                  <div
                                    key={shift.shiftNumber}
                                    className={`bg-white border rounded-lg p-3 ${
                                      shift.status === 'RECONCILED' 
                                        ? 'border-green-200' 
                                        : shift.status === 'CLOSED'
                                        ? 'border-amber-200'
                                        : 'border-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm">{shift.shiftNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          shift.status === 'RECONCILED'
                                            ? 'bg-green-100 text-green-700'
                                            : shift.status === 'CLOSED'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}>
                                          {shift.status}
                                        </span>
                                      </div>
                                      <span className="font-semibold">{formatCurrency(shift.totalSales)}</span>
                                    </div>
                                    
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <span className="text-slate-500">Open Float:</span>
                                        <span className="ml-1 font-medium">{formatCurrency(shift.openingFloat)}</span>
                                      </div>
                                      {shift.actualCash !== null && (
                                        <div>
                                          <span className="text-slate-500">Closing Cash:</span>
                                          <span className="ml-1 font-medium">{formatCurrency(shift.actualCash)}</span>
                                        </div>
                                      )}
                                      {shift.cashVariance !== null && shift.cashVariance !== 0 && (
                                        <div>
                                          <span className="text-slate-500">Variance:</span>
                                          <span className={`ml-1 font-medium ${shift.cashVariance < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {formatCurrency(shift.cashVariance)}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {Object.entries(shift.byPaymentMethod).map(([method, stats]) => (
                                        <span
                                          key={method}
                                          className="text-xs bg-slate-100 px-2 py-1 rounded"
                                        >
                                          {method}: {formatCurrency(stats.total)} ({stats.count})
                                        </span>
                                      ))}
                                    </div>

                                    {shift.status === 'RECONCILED' && onViewZReport && (
                                      <button
                                        onClick={() => {
                                          const zReport = data.zReportLinks.find(z => z.shiftNumber === shift.shiftNumber)
                                          if (zReport) onViewZReport(zReport.shiftId)
                                        }}
                                        className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        View Z Report
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {data.unreconciledShifts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pending Reconciliation ({data.unreconciledShifts.length})
                  </h3>
                  <div className="space-y-2">
                    {data.unreconciledShifts.map((shift) => (
                      <div key={shift.shiftId} className="bg-white rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm">{shift.shiftNumber}</span>
                          <span className="text-sm text-slate-500 ml-2">by {shift.closedByName}</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                          {shift.status}
                        </span>
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
