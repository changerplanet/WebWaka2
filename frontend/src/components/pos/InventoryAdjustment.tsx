'use client'

import { useState, useEffect } from 'react'
import { X, Package, AlertTriangle, Plus, Minus, Check, Shield, ClipboardList } from 'lucide-react'

interface VarianceItem {
  productId: string
  variantId: string | null
  productName: string
  sku: string | null
  totalSold: number
  currentStock: number
  adjustments: Array<{
    id: string
    adjustmentNumber: string
    adjustmentType: string
    quantityChange: number
    reason: string
    performedAt: string
    approvedByName: string
  }>
}

interface AdjustmentFormData {
  productId: string
  variantId: string | null
  productName: string
  sku: string | null
  quantityBefore: number
  quantityAfter: number
  adjustmentType: string
  reason: string
  notes: string
}

const ADJUSTMENT_TYPES = [
  { value: 'ADJUST_UP', label: 'Adjust Up', icon: Plus, color: 'text-green-600' },
  { value: 'ADJUST_DOWN', label: 'Adjust Down', icon: Minus, color: 'text-red-600' },
  { value: 'DAMAGE', label: 'Damaged Goods', icon: AlertTriangle, color: 'text-amber-600' },
  { value: 'THEFT', label: 'Theft/Shrinkage', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'COUNTING_ERROR', label: 'Counting Error', icon: ClipboardList, color: 'text-blue-600' },
  { value: 'SYSTEM_ERROR', label: 'System Error', icon: AlertTriangle, color: 'text-purple-600' },
]

interface InventoryAdjustmentProps {
  locationId: string
  shiftId?: string
  registerId?: string
  onClose: () => void
}

export function InventoryAdjustment({ locationId, shiftId, registerId, onClose }: InventoryAdjustmentProps) {
  const [varianceItems, setVarianceItems] = useState<VarianceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<VarianceItem | null>(null)
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [formData, setFormData] = useState<AdjustmentFormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSupervisorApproval, setShowSupervisorApproval] = useState(false)
  const [supervisorPin, setSupervisorPin] = useState('')

  useEffect(() => {
    fetchVariance()
  }, [locationId, shiftId])

  async function fetchVariance() {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (shiftId) params.set('shiftId', shiftId)
      if (locationId) params.set('locationId', locationId)
      if (registerId) params.set('registerId', registerId)

      const response = await fetch(`/api/pos/adjustments/variance?${params}`)
      const data = await response.json()

      if (data.success) {
        setVarianceItems(data.varianceItems || [])
      } else {
        setError(data.error || 'Failed to load variance data')
      }
    } catch (err) {
      setError('Network error loading variance data')
    } finally {
      setIsLoading(false)
    }
  }

  function startAdjustment(item: VarianceItem) {
    setSelectedItem(item)
    setFormData({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantityBefore: item.currentStock,
      quantityAfter: item.currentStock,
      adjustmentType: 'COUNTING_ERROR',
      reason: '',
      notes: '',
    })
    setShowAdjustmentForm(true)
  }

  async function submitAdjustment() {
    if (!formData || !formData.reason.trim()) {
      setError('Please provide a reason for the adjustment')
      return
    }

    if (formData.quantityBefore === formData.quantityAfter) {
      setError('Quantity must change for an adjustment')
      return
    }

    setShowSupervisorApproval(true)
  }

  async function confirmAdjustment() {
    if (!formData) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/pos/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          registerId,
          shiftId,
          productId: formData.productId,
          variantId: formData.variantId,
          productName: formData.productName,
          sku: formData.sku,
          quantityBefore: formData.quantityBefore,
          quantityAfter: formData.quantityAfter,
          adjustmentType: formData.adjustmentType,
          reason: formData.reason,
          notes: formData.notes,
          supervisorApproval: {
            pin: supervisorPin,
            approvedAt: new Date().toISOString(),
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowAdjustmentForm(false)
        setShowSupervisorApproval(false)
        setFormData(null)
        setSelectedItem(null)
        setSupervisorPin('')
        fetchVariance()
      } else {
        setError(data.error || 'Failed to create adjustment')
      }
    } catch (err) {
      setError('Network error creating adjustment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Inventory Variance & Adjustments
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading variance data...</div>
          ) : varianceItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No inventory to review</p>
              <p className="text-sm text-slate-400 mt-1">Products sold during this shift will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {varianceItems.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || ''}`}
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{item.productName}</h3>
                      {item.sku && <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-slate-600">
                          Sold: <strong className="text-slate-900">{item.totalSold}</strong>
                        </span>
                        <span className="text-slate-600">
                          Current Stock: <strong className="text-slate-900">{item.currentStock}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => startAdjustment(item)}
                      className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                    >
                      Adjust
                    </button>
                  </div>

                  {item.adjustments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Previous Adjustments:</p>
                      <div className="space-y-1">
                        {item.adjustments.map((adj) => (
                          <div key={adj.id} className="text-xs bg-slate-50 rounded px-2 py-1 flex items-center justify-between">
                            <span className="text-slate-600">
                              {adj.adjustmentType.replace('_', ' ')} ({adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange})
                            </span>
                            <span className="text-slate-400">
                              by {adj.approvedByName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showAdjustmentForm && formData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="font-bold text-lg mb-4">Adjust: {formData.productName}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ADJUSTMENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, adjustmentType: type.value })}
                        className={`p-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
                          formData.adjustmentType === type.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <type.icon className={`w-4 h-4 ${type.color}`} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Before</label>
                    <input
                      type="number"
                      value={formData.quantityBefore}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">After</label>
                    <input
                      type="number"
                      value={formData.quantityAfter}
                      onChange={(e) => setFormData({ ...formData, quantityAfter: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Required)</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Explain the adjustment..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowAdjustmentForm(false); setFormData(null) }}
                    className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAdjustment}
                    className="flex-1 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium"
                  >
                    Submit Adjustment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSupervisorApproval && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold">Supervisor Approval</h3>
                  <p className="text-sm text-slate-500">Required for inventory adjustments</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor PIN</label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="Enter 4+ digit PIN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center text-xl tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSupervisorApproval(false); setSupervisorPin('') }}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdjustment}
                  disabled={supervisorPin.length < 4 || isSubmitting}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : (
                    <>
                      <Check className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
