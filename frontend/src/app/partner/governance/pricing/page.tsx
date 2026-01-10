'use client'

/**
 * PARTNER ADMIN - PRICING ASSIGNMENTS
 * 
 * Assign pricing models to clients within capability limits.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign, ArrowLeft, Plus, Check, X, Loader2, 
  Building2, AlertTriangle, Percent
} from 'lucide-react'
import { usePartner } from '@/lib/partner-governance/partner-context'
import { CapabilityGuard, CapabilityRequired } from '@/lib/partner-governance/capability-guard'
import {
  PricingAssignment,
  addPricingAssignment,
  auditPricingAssigned,
  auditDiscountApplied,
} from '@/lib/partner-governance'
import { v4 as uuidv4 } from 'uuid'

// Demo clients for assignment
const DEMO_CLIENTS = [
  { id: 'client-001', name: 'TechCorp Ltd', currentPricing: 'flat-basic' },
  { id: 'client-002', name: 'EduFirst School', currentPricing: null },
  { id: 'client-003', name: 'HealthPlus Clinic', currentPricing: 'per-suite-standard' },
  { id: 'client-004', name: 'RetailMax Store', currentPricing: null },
  { id: 'client-005', name: 'Sunrise Hotel', currentPricing: 'flat-professional' },
]

export default function PricingAssignmentsPage() {
  const router = useRouter()
  const {
    partner,
    capabilities,
    can,
    availablePricingModels,
  } = usePartner()
  
  const [clients, setClients] = useState(DEMO_CLIENTS)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const handleAssignPricing = (clientId: string, modelId: string, discount: number) => {
    // Update client
    setClients(prev => prev.map((c: any) => 
      c.id === clientId ? { ...c, currentPricing: modelId } : c
    ))

    // Create assignment
    const assignment: PricingAssignment = {
      id: uuidv4(),
      targetType: 'client',
      targetId: clientId,
      pricingModelId: modelId,
      overrides: discount > 0 ? { discountPercent: discount } : undefined,
      effectiveFrom: new Date().toISOString(),
      effectiveUntil: null,
      status: 'active',
      assignedAt: new Date().toISOString(),
      assignedBy: partner?.id || 'unknown',
      approvalRequired: false,
      approvedAt: new Date().toISOString(),
      approvedBy: partner?.id || 'unknown',
    }
    addPricingAssignment(assignment)

    // Audit events
    auditPricingAssigned(
      partner?.id || 'unknown',
      partner?.email || 'unknown',
      'partner-admin',
      partner?.id || 'unknown',
      clientId,
      modelId,
      assignment
    )

    if (discount > 0) {
      auditDiscountApplied(
        partner?.id || 'unknown',
        partner?.email || 'unknown',
        'partner-admin',
        partner?.id || 'unknown',
        clientId,
        discount,
        'Partner applied discount to client'
      )
    }

    setShowAssignModal(false)
    setSelectedClientId(null)
  }

  const openAssignModal = (clientId: string) => {
    setSelectedClientId(clientId)
    setShowAssignModal(true)
  }

  const getModelName = (modelId: string | null) => {
    if (!modelId) return 'None'
    const model = availablePricingModels.find((m: any) => m.id === modelId)
    return model?.name || modelId
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/partner/governance')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-governance"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Governance Portal
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pricing Assignments</h1>
              <p className="text-slate-400">Assign pricing models to your clients</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <CapabilityRequired
          capability="canAssignPricing"
          title="Pricing Assignment Not Available"
          description="Your account does not have permission to assign pricing to clients."
        >
          {/* Info Banner */}
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-400">Pricing Facts Only</h3>
                <p className="text-sm text-emerald-200/80 mt-1">
                  Pricing assignments define <strong>what would be charged</strong>. 
                  No actual billing or payment processing occurs here.
                  {can('canApplyDiscounts') && (
                    <span className="block mt-1">
                      You can apply discounts up to <strong>{capabilities.maxDiscountPercent}%</strong>.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Clients with Pricing</p>
              <p className="text-2xl font-bold text-green-400">
                {clients.filter((c: any) => c.currentPricing).length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Without Pricing</p>
              <p className="text-2xl font-bold text-amber-400">
                {clients.filter((c: any) => !c.currentPricing).length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Available Models</p>
              <p className="text-2xl font-bold">{availablePricingModels.length}</p>
            </div>
          </div>

          {/* Client Pricing Table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Client</th>
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Current Pricing</th>
                  <th className="text-right py-4 px-5 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {client.currentPricing ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                          {getModelName(client.currentPricing)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                          No pricing assigned
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => openAssignModal(client.id)}
                        className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition text-sm"
                      >
                        {client.currentPricing ? 'Change' : 'Assign'} Pricing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Available Models Reference */}
          <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4">Available Pricing Models</h3>
            <div className="grid grid-cols-3 gap-4">
              {availablePricingModels.map((model) => (
                <div key={model.id} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{model.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-xs capitalize">{model.type}</span>
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">{model.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CapabilityRequired>
      </div>

      {/* Assign Pricing Modal */}
      {showAssignModal && selectedClientId && (
        <AssignPricingModal
          clientId={selectedClientId}
          clientName={clients.find((c: any) => c.id === selectedClientId)?.name || ''}
          availableModels={availablePricingModels}
          canApplyDiscount={can('canApplyDiscounts')}
          maxDiscount={capabilities.maxDiscountPercent}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedClientId(null)
          }}
          onAssign={handleAssignPricing}
        />
      )}
    </div>
  )
}

function AssignPricingModal({
  clientId,
  clientName,
  availableModels,
  canApplyDiscount,
  maxDiscount,
  onClose,
  onAssign,
}: {
  clientId: string
  clientName: string
  availableModels: any[]
  canApplyDiscount: boolean
  maxDiscount: number
  onClose: () => void
  onAssign: (clientId: string, modelId: string, discount: number) => void
}) {
  const [selectedModel, setSelectedModel] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!selectedModel) return
    setLoading(true)
    setTimeout(() => {
      onAssign(clientId, selectedModel, discount)
      setLoading(false)
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Assign Pricing</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">Assign pricing to {clientName}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pricing Model *</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Select a pricing model...</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.type})
                </option>
              ))}
            </select>
          </div>

          {/* Discount */}
          {canApplyDiscount && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discount % (max: {maxDiscount}%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={maxDiscount}
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(parseInt(e.target.value) || 0, maxDiscount))}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                />
                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Optional: Apply a discount to this assignment</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-200/80">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              This action will be logged in the governance audit trail.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedModel}
              className="flex-1 px-4 py-3 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {loading ? 'Assigning...' : 'Assign Pricing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
