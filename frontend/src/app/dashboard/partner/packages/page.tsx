'use client'

/**
 * PHASE 4B: Partner Package Management
 * 
 * GoHighLevel-style package configuration:
 * - Create pricing packages
 * - Set monthly/yearly pricing
 * - Configure trial periods
 * - View margin calculations
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  X,
} from 'lucide-react'

interface PackageData {
  id: string
  name: string
  slug: string
  description: string | null
  includedInstances: number
  includedSuiteKeys: string[]
  priceMonthly: string
  priceYearly: string | null
  setupFee: string | null
  trialDays: number
  currency: string
  wholesaleCostMonthly: string | null
  features: Record<string, any> | null
  isActive: boolean
  isPublic: boolean
  sortOrder: number
  margin?: {
    margin: number
    marginPercent: number
  }
}

export default function PartnerPackagesPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    try {
      setLoading(true)
      const res = await fetch('/api/partner/packages?includeInactive=true')
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to load packages')
        return
      }

      setPackages(data.packages)
    } catch (err) {
      setError('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(pkg: PackageData) {
    if (!confirm(`Are you sure you want to archive "${pkg.name}"?`)) return

    try {
      const res = await fetch(`/api/partner/packages/${pkg.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchPackages()
      }
    } catch (err) {
      console.error('Failed to delete package:', err)
    }
  }

  const formatCurrency = (amount: string | number | null, currency = 'NGN') => {
    if (!amount) return '—'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(num)
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
    <div className="min-h-screen bg-slate-50" data-testid="packages-page">
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
                  <Package className="w-6 h-6 text-emerald-600" />
                  Pricing Packages
                </h1>
                <p className="text-slate-600 text-sm mt-1">Configure your client pricing plans</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              data-testid="create-package-btn"
            >
              <Plus className="w-4 h-4" />
              New Package
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {packages.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No packages yet</h2>
            <p className="text-slate-600 mb-6">Create your first pricing package to start selling to clients</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create First Package
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl shadow-sm border ${
                  pkg.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
                }`}
                data-testid={`package-${pkg.slug}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                        {!pkg.isActive && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                            Archived
                          </span>
                        )}
                        {pkg.isPublic ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-slate-600 text-sm mb-4">{pkg.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingPackage(pkg)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                        data-testid={`edit-${pkg.slug}`}
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        data-testid={`delete-${pkg.slug}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Monthly
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(pkg.priceMonthly, pkg.currency)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Yearly
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(pkg.priceYearly, pkg.currency)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        Trial
                      </div>
                      <p className="text-lg font-bold text-slate-900">{pkg.trialDays} days</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-emerald-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        Your Margin
                      </div>
                      <p className="text-lg font-bold text-emerald-700">
                        {pkg.margin ? `${pkg.margin.marginPercent}%` : '—'}
                      </p>
                    </div>
                  </div>

                  {pkg.setupFee && (
                    <div className="mt-4 text-sm text-slate-600">
                      Setup Fee: {formatCurrency(pkg.setupFee, pkg.currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPackage) && (
        <PackageModal
          pkg={editingPackage}
          onClose={() => {
            setShowCreateModal(false)
            setEditingPackage(null)
          }}
          onSave={() => {
            setShowCreateModal(false)
            setEditingPackage(null)
            fetchPackages()
          }}
        />
      )}
    </div>
  )
}

interface PackageModalProps {
  pkg: PackageData | null
  onClose: () => void
  onSave: () => void
}

function PackageModal({ pkg, onClose, onSave }: PackageModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    priceMonthly: pkg?.priceMonthly || '',
    priceYearly: pkg?.priceYearly || '',
    setupFee: pkg?.setupFee || '',
    trialDays: pkg?.trialDays?.toString() || '14',
    wholesaleCostMonthly: pkg?.wholesaleCostMonthly || '',
    isPublic: pkg?.isPublic ?? true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = pkg
        ? `/api/partner/packages/${pkg.id}`
        : '/api/partner/packages'
      const method = pkg ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          priceMonthly: parseFloat(form.priceMonthly),
          priceYearly: form.priceYearly ? parseFloat(form.priceYearly) : null,
          setupFee: form.setupFee ? parseFloat(form.setupFee) : null,
          trialDays: parseInt(form.trialDays),
          wholesaleCostMonthly: form.wholesaleCostMonthly
            ? parseFloat(form.wholesaleCostMonthly)
            : null,
          isPublic: form.isPublic,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to save package')
        return
      }

      onSave()
    } catch (err) {
      setError('Failed to save package')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {pkg ? 'Edit Package' : 'Create Package'}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Package Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Retail Starter"
              data-testid="package-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              placeholder="Brief description of what's included"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Monthly Price (NGN) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.priceMonthly}
                onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="50000"
                data-testid="price-monthly-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Yearly Price (NGN)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceYearly}
                onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="500000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Setup Fee (NGN)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.setupFee}
                onChange={(e) => setForm({ ...form, setupFee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Trial Days
              </label>
              <input
                type="number"
                min="0"
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="14"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Cost (Wholesale - Hidden from clients)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.wholesaleCostMonthly}
              onChange={(e) => setForm({ ...form, wholesaleCostMonthly: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="30000"
            />
            <p className="text-xs text-slate-500 mt-1">
              This is your cost from WebWaka. Your margin = Price - Cost
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isPublic" className="text-sm text-slate-700">
              Show on public pricing page
            </label>
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
              data-testid="save-package-btn"
            >
              {loading ? 'Saving...' : pkg ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
