'use client'

/**
 * PLATFORM INSTANCE ADMIN PAGE (Phase 2.1)
 * 
 * Full admin interface for creating and managing platform instances.
 * 
 * FEATURES:
 * - List all instances with status
 * - Create new instance
 * - Edit instance (name, slug, suiteKeys, branding)
 * - Domain mapping view
 * - Deactivate/reactivate
 * 
 * PHASE 2 BOUNDARIES:
 * - No per-instance billing
 * - No per-instance permissions
 * - Visibility filtering only
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Layers, Plus, Settings, Trash2, Check, X, AlertCircle, Loader2,
  ChevronRight, Eye, Globe, Palette, Save, RotateCcw, Building2
} from 'lucide-react'
import { InstanceBrandingPreview } from './InstanceBrandingPreview'
import { DomainInstanceMapping } from './DomainInstanceMapping'

// Capability registry (should match backend)
const CAPABILITY_REGISTRY = [
  { key: 'pos', name: 'POS', category: 'Commerce' },
  { key: 'svm', name: 'Storefront', category: 'Commerce' },
  { key: 'mvm', name: 'Marketplace', category: 'Commerce' },
  { key: 'inventory', name: 'Inventory', category: 'Operations' },
  { key: 'accounting', name: 'Accounting', category: 'Operations' },
  { key: 'crm', name: 'CRM', category: 'Operations' },
  { key: 'logistics', name: 'Logistics', category: 'Operations' },
  { key: 'hr_payroll', name: 'HR & Payroll', category: 'Operations' },
  { key: 'procurement', name: 'Procurement', category: 'Operations' },
  { key: 'analytics', name: 'Analytics', category: 'Growth' },
  { key: 'marketing', name: 'Marketing', category: 'Growth' },
  { key: 'b2b', name: 'B2B & Wholesale', category: 'Growth' },
  { key: 'payments', name: 'Payments', category: 'Platform' },
  { key: 'subscriptions_billing', name: 'Subscriptions', category: 'Platform' },
  { key: 'compliance_tax', name: 'Compliance', category: 'Platform' },
  { key: 'ai_automation', name: 'AI & Automation', category: 'Platform' },
  { key: 'integrations_hub', name: 'Integrations', category: 'Platform' },
]

interface PlatformInstance {
  id: string
  name: string
  slug: string
  description: string | null
  suiteKeys: string[]
  displayName: string | null
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

interface TenantBranding {
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}

interface InstanceAdminPageProps {
  tenantSlug: string
  tenantBranding: TenantBranding
  activeCapabilities: string[]
}

type ViewMode = 'list' | 'create' | 'edit' | 'domains'

export function InstanceAdminPage({ 
  tenantSlug, 
  tenantBranding,
  activeCapabilities 
}: InstanceAdminPageProps) {
  const [instances, setInstances] = useState<PlatformInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedInstance, setSelectedInstance] = useState<PlatformInstance | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch(`/api/platform-instances?tenantId=${tenantSlug}`)
      const data = await res.json()
      
      if (data.instances) {
        setInstances(data.instances)
      } else {
        setError(data.error || 'Failed to load instances')
      }
    } catch (err) {
      setError('Failed to load instances')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  function handleEdit(instance: PlatformInstance) {
    setSelectedInstance(instance)
    setViewMode('edit')
  }

  function handleCreate() {
    setSelectedInstance(null)
    setViewMode('create')
  }

  function handleBack() {
    setViewMode('list')
    setSelectedInstance(null)
    setMessage(null)
  }

  async function handleSave(data: Partial<PlatformInstance>) {
    const isCreate = !selectedInstance
    const url = isCreate 
      ? `/api/platform-instances`
      : `/api/platform-instances/${selectedInstance.id}`
    
    try {
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenantSlug })
      })
      
      const result = await res.json()
      
      if (result.success || result.instance) {
        setMessage({ type: 'success', text: isCreate ? 'Instance created!' : 'Instance updated!' })
        await fetchInstances()
        setTimeout(() => {
          handleBack()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save instance' })
    }
  }

  async function handleToggleActive(instance: PlatformInstance) {
    if (instance.isDefault) {
      setMessage({ type: 'error', text: 'Cannot deactivate the default instance' })
      return
    }

    try {
      const res = await fetch(`/api/platform-instances/${instance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !instance.isActive, tenantSlug })
      })
      
      const result = await res.json()
      
      if (result.success || result.instance) {
        await fetchInstances()
        setMessage({ 
          type: 'success', 
          text: instance.isActive ? 'Instance deactivated' : 'Instance reactivated' 
        })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update instance' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="instance-admin-page">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6" />
                Platform Instances
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage multiple branded platforms within your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('domains')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                <Globe className="w-4 h-4" />
                Domain Mapping
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                data-testid="create-instance-btn"
              >
                <Plus className="w-4 h-4" />
                New Instance
              </button>
            </div>
          </div>

          {/* Instances Grid */}
          <div className="grid gap-4">
            {instances.map(instance => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                tenantBranding={tenantBranding}
                onEdit={() => handleEdit(instance)}
                onToggleActive={() => handleToggleActive(instance)}
              />
            ))}

            {instances.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Layers className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No instances yet</h3>
                <p className="text-slate-500 mb-4">Create your first platform instance to get started</p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Instance
                </button>
              </div>
            )}
          </div>

          {/* Help Card */}
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="font-medium text-slate-900 mb-2">About Platform Instances</h3>
            <p className="text-sm text-slate-600 mb-4">
              Platform instances let you create distinct branded experiences for different audiences or use cases,
              all within the same organization. Each instance can have its own:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Custom domain and branding</li>
              <li>Filtered set of visible capabilities</li>
              <li>Navigation context</li>
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              <strong>Note:</strong> Users, billing, and data remain shared across all instances.
            </p>
          </div>
        </>
      )}

      {/* Create/Edit View */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <InstanceEditor
          instance={selectedInstance}
          tenantBranding={tenantBranding}
          activeCapabilities={activeCapabilities}
          onSave={handleSave}
          onCancel={handleBack}
          message={message}
        />
      )}

      {/* Domains View */}
      {viewMode === 'domains' && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              ← Back to Instances
            </button>
          </div>
          <DomainInstanceMapping
            tenantSlug={tenantSlug}
            instances={instances}
            onMappingChange={fetchInstances}
          />
        </>
      )}
    </div>
  )
}

// Instance Card Component
function InstanceCard({ 
  instance, 
  tenantBranding,
  onEdit, 
  onToggleActive 
}: {
  instance: PlatformInstance
  tenantBranding: TenantBranding
  onEdit: () => void
  onToggleActive: () => void
}) {
  const primaryColor = instance.primaryColor || tenantBranding.primaryColor
  const displayName = instance.displayName || instance.name

  return (
    <div 
      className={`bg-white rounded-xl border p-6 transition ${
        instance.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60'
      }`}
      data-testid={`instance-card-${instance.slug}`}
    >
      <div className="flex items-start gap-4">
        {/* Color Badge */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {displayName.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{displayName}</h3>
            {instance.isDefault && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                Default
              </span>
            )}
            {!instance.isActive && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-2">
            Slug: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{instance.slug}</code>
          </p>
          <p className="text-sm text-slate-600">
            {instance.suiteKeys.length === 0 
              ? 'All capabilities visible' 
              : `${instance.suiteKeys.length} capabilities configured`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Edit instance"
            data-testid={`edit-instance-${instance.slug}`}
          >
            <Settings className="w-5 h-5 text-slate-500" />
          </button>
          {!instance.isDefault && (
            <button
              onClick={onToggleActive}
              className={`p-2 rounded-lg transition ${
                instance.isActive 
                  ? 'hover:bg-red-50 text-slate-500 hover:text-red-600' 
                  : 'hover:bg-green-50 text-slate-500 hover:text-green-600'
              }`}
              title={instance.isActive ? 'Deactivate' : 'Reactivate'}
            >
              {instance.isActive ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
      </div>
    </div>
  )
}

// Instance Editor Component
function InstanceEditor({
  instance,
  tenantBranding,
  activeCapabilities,
  onSave,
  onCancel,
  message
}: {
  instance: PlatformInstance | null
  tenantBranding: TenantBranding
  activeCapabilities: string[]
  onSave: (data: Partial<PlatformInstance>) => void
  onCancel: () => void
  message: { type: 'success' | 'error'; text: string } | null
}) {
  const isCreate = !instance
  
  const [name, setName] = useState(instance?.name || '')
  const [slug, setSlug] = useState(instance?.slug || '')
  const [description, setDescription] = useState(instance?.description || '')
  const [suiteKeys, setSuiteKeys] = useState<string[]>(instance?.suiteKeys || [])
  const [displayName, setDisplayName] = useState(instance?.displayName || '')
  const [primaryColor, setPrimaryColor] = useState(instance?.primaryColor || '')
  const [secondaryColor, setSecondaryColor] = useState(instance?.secondaryColor || '')
  const [logoUrl, setLogoUrl] = useState(instance?.logoUrl || '')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Phase 14B: Derive-initial-value pattern - slug intentionally excluded to prevent overwriting user edits
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isCreate && name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [name, isCreate])

  function handleSuiteToggle(key: string) {
    setSuiteKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  function handleSelectAll() {
    setSuiteKeys(activeCapabilities)
  }

  function handleSelectNone() {
    setSuiteKeys([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    await onSave({
      name,
      slug,
      description: description || null,
      suiteKeys,
      displayName: displayName || null,
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
      logoUrl: logoUrl || null,
    })
    
    setSaving(false)
  }

  // Group capabilities by category
  const capabilitiesByCategory = CAPABILITY_REGISTRY.reduce((acc, cap) => {
    if (!acc[cap.category]) acc[cap.category] = []
    acc[cap.category].push(cap)
    return acc
  }, {} as Record<string, typeof CAPABILITY_REGISTRY>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold text-slate-900">
            {isCreate ? 'Create Platform Instance' : `Edit: ${instance.name}`}
          </h2>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Instance Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Commerce Hub"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="instance-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="commerce-hub"
                  required
                  disabled={!isCreate && instance?.isDefault}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-50 disabled:text-slate-500"
                  data-testid="instance-slug-input"
                />
                <p className="text-xs text-slate-500 mt-1">URL-safe identifier (lowercase, no spaces)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description for admin reference"
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Capabilities Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Visible Capabilities</h3>
                <p className="text-sm text-slate-500">Select which capabilities users see in this instance</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Clear All
                </button>
              </div>
            </div>

            {suiteKeys.length === 0 && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <strong>All capabilities visible.</strong> Leave empty to show all active capabilities.
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(capabilitiesByCategory).map(([category, caps]) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {caps.map(cap => {
                      const isActive = activeCapabilities.includes(cap.key)
                      const isSelected = suiteKeys.includes(cap.key)
                      
                      return (
                        <label
                          key={cap.key}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-slate-200 hover:border-slate-300'
                          } ${!isActive ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSuiteToggle(cap.key)}
                            disabled={!isActive}
                            className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">{cap.name}</span>
                          {!isActive && (
                            <span className="text-xs text-slate-400">(inactive)</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branding Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-slate-900">Instance Branding</h3>
              <span className="text-xs text-slate-500">(Optional overrides)</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={tenantBranding.appName}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to use tenant name: {tenantBranding.appName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor || tenantBranding.primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      placeholder={tenantBranding.primaryColor}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={secondaryColor || tenantBranding.secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      placeholder={tenantBranding.secondaryColor}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {(primaryColor || secondaryColor || displayName || logoUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryColor('')
                    setSecondaryColor('')
                    setDisplayName('')
                    setLogoUrl('')
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear all overrides (use tenant branding)
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name || !slug}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              data-testid="save-instance-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isCreate ? 'Create Instance' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 h-fit">
            <InstanceBrandingPreview
              instanceBranding={{
                displayName: displayName || null,
                logoUrl: logoUrl || null,
                faviconUrl: null,
                primaryColor: primaryColor || null,
                secondaryColor: secondaryColor || null,
              }}
              tenantBranding={tenantBranding}
              instanceName={name || 'New Instance'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
