'use client'

/**
 * PARTNER ADMIN - TRIAL MANAGEMENT
 * 
 * Grant and manage client trials within capability limits.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock, ArrowLeft, Plus, Check, X, Loader2, 
  Building2, AlertTriangle, Calendar, Play, Pause
} from 'lucide-react'
import { usePartner } from '@/lib/partner-governance/partner-context'
import { CapabilityGuard, CapabilityRequired, LimitWarning } from '@/lib/partner-governance/capability-guard'
import { createGovernanceAuditEvent, TrialStatus } from '@/lib/partner-governance'
import { v4 as uuidv4 } from 'uuid'

// Demo trial data
interface Trial {
  id: string
  clientId: string
  clientName: string
  allowedSuites: string[]
  startDate: string
  endDate: string
  durationDays: number
  status: TrialStatus
  createdAt: string
}

const DEMO_TRIALS: Trial[] = [
  {
    id: 'trial-001',
    clientId: 'client-002',
    clientName: 'EduFirst School',
    allowedSuites: ['education'],
    startDate: '2026-01-01',
    endDate: '2026-01-15',
    durationDays: 14,
    status: 'active',
    createdAt: '2026-01-01',
  },
  {
    id: 'trial-002',
    clientId: 'client-004',
    clientName: 'RetailMax Store',
    allowedSuites: ['commerce', 'inventory'],
    startDate: '2025-12-15',
    endDate: '2025-12-29',
    durationDays: 14,
    status: 'expired',
    createdAt: '2025-12-15',
  },
  {
    id: 'trial-003',
    clientId: 'client-006',
    clientName: 'NewCo Startup',
    allowedSuites: ['commerce'],
    startDate: '2026-01-05',
    endDate: '2026-01-19',
    durationDays: 14,
    status: 'active',
    createdAt: '2026-01-05',
  },
]

// Clients without trials
const DEMO_CLIENTS_FOR_TRIAL = [
  { id: 'client-007', name: 'FutureTech Inc' },
  { id: 'client-008', name: 'GreenLeaf Farms' },
  { id: 'client-009', name: 'Metro Logistics' },
]

export default function TrialManagementPage() {
  const router = useRouter()
  const {
    partner,
    capabilities,
    can,
    canWithinLimit,
    activeTrialCount,
  } = usePartner()
  
  const [trials, setTrials] = useState<Trial[]>(DEMO_TRIALS)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const activeTrials = trials.filter((t: any) => t.status === 'active')
  const canCreateMore = canWithinLimit('canOfferTrials', activeTrials.length)

  const handleCreateTrial = (trialData: {
    clientId: string
    clientName: string
    suites: string[]
    durationDays: number
  }) => {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + trialData.durationDays * 24 * 60 * 60 * 1000)
    
    const trial: Trial = {
      id: uuidv4(),
      clientId: trialData.clientId,
      clientName: trialData.clientName,
      allowedSuites: trialData.suites,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      durationDays: trialData.durationDays,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    }
    
    setTrials(prev => [...prev, trial])
    
    // Audit event
    createGovernanceAuditEvent({
      action: 'pricing.assigned', // Using existing action type for trial
      actorId: partner?.id || 'unknown',
      actorType: 'partner-admin',
      actorEmail: partner?.email || 'unknown',
      scope: { 
        partnerId: partner?.id, 
        clientId: trialData.clientId,
        trialId: trial.id,
      },
      changeType: 'create',
      newValue: { 
        type: 'trial',
        durationDays: trialData.durationDays,
        suites: trialData.suites,
        startDate: trial.startDate,
        endDate: trial.endDate,
      },
    })
    
    setShowCreateModal(false)
  }

  const handleCancelTrial = (trialId: string) => {
    setTrials(prev => prev.map((t: any) => 
      t.id === trialId ? { ...t, status: 'cancelled' as TrialStatus } : t
    ))
    
    // Audit event
    createGovernanceAuditEvent({
      action: 'pricing.assignment.revoked',
      actorId: partner?.id || 'unknown',
      actorType: 'partner-admin',
      actorEmail: partner?.email || 'unknown',
      scope: { partnerId: partner?.id, trialId },
      changeType: 'revoke',
      previousValue: { status: 'active' },
      newValue: { status: 'cancelled' },
      reason: 'Partner cancelled trial',
    })
  }

  const getStatusColor = (status: TrialStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-amber-500/20 text-amber-400'
      case 'expired': return 'bg-slate-500/20 text-slate-400'
      case 'converted': return 'bg-blue-500/20 text-blue-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Trial Management</h1>
                <p className="text-slate-400">Grant and manage client trials</p>
              </div>
            </div>

            {/* Create Button */}
            <CapabilityGuard capability="canOfferTrials" currentCount={activeTrials.length} mode="disable">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!canCreateMore}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl transition"
                data-testid="create-trial-btn"
              >
                <Plus className="w-5 h-5" />
                Grant Trial
              </button>
            </CapabilityGuard>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <CapabilityRequired
          capability="canOfferTrials"
          title="Trial Management Not Available"
          description="Your account does not have permission to offer trials."
        >
          {/* Limit Warning */}
          <LimitWarning capability="canOfferTrials" currentCount={activeTrials.length} />

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6 mt-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Active Trials</p>
              <p className="text-2xl font-bold text-green-400">
                {activeTrials.length}
                {capabilities.maxConcurrentTrials !== null && (
                  <span className="text-sm text-slate-500 ml-1">/ {capabilities.maxConcurrentTrials}</span>
                )}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Expired</p>
              <p className="text-2xl font-bold text-slate-400">
                {trials.filter((t: any) => t.status === 'expired').length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Converted</p>
              <p className="text-2xl font-bold text-blue-400">
                {trials.filter((t: any) => t.status === 'converted').length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Max Trial Days</p>
              <p className="text-2xl font-bold">{capabilities.maxTrialDays}</p>
            </div>
          </div>

          {/* Trials List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Client</th>
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Suites</th>
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Duration</th>
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Period</th>
                  <th className="text-center py-4 px-5 text-sm text-slate-400">Status</th>
                  <th className="text-right py-4 px-5 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((trial) => (
                  <tr key={trial.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-medium">{trial.clientName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex gap-1">
                        {trial.allowedSuites.map(suite => (
                          <span key={suite} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs capitalize">
                            {suite}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-slate-300">{trial.durationDays} days</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-sm">
                        <p className="text-slate-300">{trial.startDate}</p>
                        <p className="text-slate-500">to {trial.endDate}</p>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(trial.status)}`}>
                        {trial.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {trial.status === 'active' && (
                        <button
                          onClick={() => handleCancelTrial(trial.id)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {trials.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No trials found</p>
              </div>
            )}
          </div>
        </CapabilityRequired>
      </div>

      {/* Create Trial Modal */}
      {showCreateModal && (
        <CreateTrialModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateTrial}
          allowedSuites={capabilities.allowedSuites}
          maxDays={capabilities.maxTrialDays}
          availableClients={DEMO_CLIENTS_FOR_TRIAL}
        />
      )}
    </div>
  )
}

function CreateTrialModal({
  onClose,
  onCreated,
  allowedSuites,
  maxDays,
  availableClients,
}: {
  onClose: () => void
  onCreated: (data: { clientId: string; clientName: string; suites: string[]; durationDays: number }) => void
  allowedSuites: string[]
  maxDays: number
  availableClients: { id: string; name: string }[]
}) {
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedSuites, setSelectedSuites] = useState<string[]>([])
  const [duration, setDuration] = useState(14)
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    const client = availableClients.find((c: any) => c.id === selectedClient)
    if (!client || selectedSuites.length === 0) return
    
    setLoading(true)
    setTimeout(() => {
      onCreated({
        clientId: client.id,
        clientName: client.name,
        suites: selectedSuites,
        durationDays: Math.min(duration, maxDays),
      })
      setLoading(false)
    }, 500)
  }

  const toggleSuite = (suite: string) => {
    setSelectedSuites(prev => 
      prev.includes(suite) ? prev.filter((s: any) => s !== suite) : [...prev, suite]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Grant Trial</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Client *</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">Select a client...</option>
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Duration (max: {maxDays} days)
            </label>
            <input
              type="number"
              min="1"
              max={maxDays}
              value={duration}
              onChange={(e) => setDuration(Math.min(parseInt(e.target.value) || 1, maxDays))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Suite Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Trial Suites *</label>
            <div className="flex flex-wrap gap-2">
              {allowedSuites.map(suite => (
                <button
                  key={suite}
                  type="button"
                  onClick={() => toggleSuite(suite)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedSuites.includes(suite)
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-slate-700 text-slate-400 border border-transparent'
                  }`}
                >
                  {suite}
                </button>
              ))}
            </div>
          </div>

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
              disabled={loading || !selectedClient || selectedSuites.length === 0}
              className="flex-1 px-4 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {loading ? 'Granting...' : 'Grant Trial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
