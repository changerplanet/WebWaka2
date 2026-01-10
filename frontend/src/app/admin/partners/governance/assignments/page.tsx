'use client'

/**
 * SUPER ADMIN - PRICING ASSIGNMENTS
 * 
 * Manage pricing assignments to partners.
 * View and assign pricing models to partners (governance only).
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Plus, Check, X, AlertTriangle,
  Building2, DollarSign, Calendar, Info, Loader2
} from 'lucide-react'
import {
  PricingAssignment,
  PricingModel,
  PRICING_MODELS,
  getActivePricingModels,
  addPricingAssignment,
  auditPricingAssigned,
} from '@/lib/partner-governance'
import { v4 as uuidv4 } from 'uuid'

// Demo partners for assignment (in production, would come from database)
const DEMO_PARTNERS = [
  { id: 'partner-001', name: 'Acme Solutions', type: 'reseller', category: 'strategic' },
  { id: 'partner-002', name: 'GovTech Partners', type: 'government-partner', category: 'strategic' },
  { id: 'partner-003', name: 'Faith First', type: 'faith-partner', category: 'standard' },
  { id: 'partner-004', name: 'NewCo Pilot', type: 'reseller', category: 'pilot' },
  { id: 'partner-005', name: 'EduPartners', type: 'education-partner', category: 'standard' },
]

export default function PricingAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<PricingAssignment[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const pricingModels = getActivePricingModels()

  const getModelById = (id: string): PricingModel | undefined => {
    return PRICING_MODELS.find((m: any) => m.id === id)
  }

  const getPartnerById = (id: string) => {
    return DEMO_PARTNERS.find((p: any) => p.id === id)
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/admin/partners/governance')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-governance"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Governance
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pricing Assignments</h1>
                <p className="text-slate-400">Assign pricing models to partners</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-xl transition"
              data-testid="create-assignment-btn"
            >
              <Plus className="w-5 h-5" />
              New Assignment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Notice */}
        <div className="mb-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-cyan-400">Pricing Assignments</h3>
              <p className="text-sm text-cyan-200/80 mt-1">
                Assign pricing models to partners to define their pricing structure.
                Assignments are governance facts - they define <strong>what would be charged</strong>, not actual billing.
              </p>
            </div>
          </div>
        </div>

        {/* Partners with Available Assignments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Partners</h2>
          
          {DEMO_PARTNERS.map((partner) => {
            const currentAssignment = assignments.find(
              a => a.targetType === 'partner' && a.targetId === partner.id && a.status === 'active'
            )
            const assignedModel = currentAssignment ? getModelById(currentAssignment.pricingModelId) : null

            return (
              <div key={partner.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{partner.name}</h3>
                      <p className="text-sm text-slate-400">
                        {partner.type} • {partner.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {currentAssignment ? (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                            {assignedModel?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Assigned {new Date(currentAssignment.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded text-sm">
                        No pricing assigned
                      </span>
                    )}
                  </div>
                </div>

                {currentAssignment && assignedModel && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Model Type</p>
                        <p className="text-white capitalize">{assignedModel.type}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Currency</p>
                        <p className="text-white">{assignedModel.currency}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Billing Period</p>
                        <p className="text-white capitalize">{assignedModel.billingPeriod}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Status</p>
                        <p className="text-green-400 capitalize">{currentAssignment.status}</p>
                      </div>
                    </div>
                    
                    {currentAssignment.overrides?.discountPercent && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Discount Applied:</span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                          {currentAssignment.overrides.discountPercent}% off
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Available Pricing Models Reference */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-semibold mb-4">Available Pricing Models</h3>
          <div className="grid grid-cols-3 gap-4">
            {pricingModels.map((model) => (
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
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(assignment) => {
            setAssignments(prev => [...prev, assignment])
            setShowCreateModal(false)
          }}
          partners={DEMO_PARTNERS}
          pricingModels={pricingModels}
        />
      )}
    </div>
  )
}

function CreateAssignmentModal({
  onClose,
  onCreated,
  partners,
  pricingModels,
}: {
  onClose: () => void
  onCreated: (assignment: PricingAssignment) => void
  partners: typeof DEMO_PARTNERS
  pricingModels: PricingModel[]
}) {
  const [form, setForm] = useState({
    partnerId: '',
    pricingModelId: '',
    discountPercent: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!form.partnerId || !form.pricingModelId) return

    setLoading(true)

    const assignment: PricingAssignment = {
      id: uuidv4(),
      targetType: 'partner',
      targetId: form.partnerId,
      pricingModelId: form.pricingModelId,
      overrides: form.discountPercent > 0 ? { discountPercent: form.discountPercent } : undefined,
      effectiveFrom: new Date(form.effectiveFrom).toISOString(),
      effectiveUntil: null,
      status: 'active',
      assignedAt: new Date().toISOString(),
      assignedBy: 'super-admin',
      approvalRequired: false,
      approvedAt: new Date().toISOString(),
      approvedBy: 'super-admin',
    }

    // Add to store
    addPricingAssignment(assignment)

    // Audit log
    auditPricingAssigned(
      'super-admin',
      'admin@webwaka.com',
      'super-admin',
      form.partnerId,
      undefined,
      form.pricingModelId,
      assignment
    )

    setTimeout(() => {
      setLoading(false)
      onCreated(assignment)
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">New Pricing Assignment</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Partner Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Partner *</label>
            <select
              value={form.partnerId}
              onChange={(e) => setForm(prev => ({ ...prev, partnerId: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select a partner...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Pricing Model Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pricing Model *</label>
            <select
              value={form.pricingModelId}
              onChange={(e) => setForm(prev => ({ ...prev, pricingModelId: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select a pricing model...</option>
              {pricingModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
              ))}
            </select>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discountPercent}
              onChange={(e) => setForm(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Optional: Apply a discount to this assignment</p>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Effective From</label>
            <input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => setForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-200/80">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              This is a governance action. The assignment will be logged and audited.
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
              disabled={loading || !form.partnerId || !form.pricingModelId}
              className="flex-1 px-4 py-3 bg-cyan-500 rounded-xl hover:bg-cyan-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
