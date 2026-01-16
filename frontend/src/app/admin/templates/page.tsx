'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutTemplate, Plus, Search, Filter, MoreVertical, Eye, Pencil,
  Trash2, Check, X, Loader2, ChevronRight, Globe, EyeOff, Archive,
  FileText, Layers, AlertTriangle
} from 'lucide-react'

interface Template {
  id: string
  name: string
  slug: string
  description: string | null
  templateType: 'SITE_TEMPLATE' | 'FUNNEL_TEMPLATE' | 'PAGE_TEMPLATE'
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED'
  industry: string | null
  useCase: string | null
  isDemo: boolean
  partnerVisible: boolean
  createdAt: string
  updatedAt: string
  category: { id: string; name: string; slug: string } | null
  _count: { pages: number }
}

interface Category {
  id: string
  name: string
  slug: string
}

const templateTypeLabels = {
  SITE_TEMPLATE: 'Site',
  FUNNEL_TEMPLATE: 'Funnel',
  PAGE_TEMPLATE: 'Page',
}

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  DEPRECATED: 'bg-gray-100 text-gray-800',
}

export default function AdminTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('templateType', typeFilter)

      const res = await fetch(`/api/admin/templates?${params}`)
      const data = await res.json()

      if (data.success) {
        setTemplates(data.templates)
      } else {
        setError(data.error || 'Failed to fetch templates')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, typeFilter])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/partner/templates/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchTemplates])

  async function handleAction(templateId: string, action: string) {
    setActionLoading(templateId)
    setShowActionsMenu(null)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, templateId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchTemplates()
      } else {
        alert(data.error || `Failed to ${action} template`)
      }
    } catch (err) {
      alert(`Failed to ${action} template`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreateTemplate(formData: {
    name: string
    slug: string
    description: string
    categoryId: string
    templateType: string
    industry: string
    useCase: string
    isDemo: boolean
    partnerVisible: boolean
  }) {
    setActionLoading('create')
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...formData }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateModal(false)
        fetchTemplates()
      } else {
        alert(data.error || 'Failed to create template')
      }
    } catch (err) {
      alert('Failed to create template')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUpdateTemplate(templateId: string, updates: Record<string, unknown>) {
    setActionLoading(templateId)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', templateId, ...updates }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTemplate(null)
        fetchTemplates()
      } else {
        alert(data.error || 'Failed to update template')
      }
    } catch (err) {
      alert('Failed to update template')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <LayoutTemplate className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
            <p className="text-gray-500 text-sm">Create and manage Sites & Funnels templates</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="DEPRECATED">Deprecated</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="SITE_TEMPLATE">Site Templates</option>
            <option value="FUNNEL_TEMPLATE">Funnel Templates</option>
            <option value="PAGE_TEMPLATE">Page Templates</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <LayoutTemplate className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No templates found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.slug}</div>
                      {template.description && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{template.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {template.templateType === 'SITE_TEMPLATE' && <Layers className="h-3 w-3" />}
                      {template.templateType === 'FUNNEL_TEMPLATE' && <ChevronRight className="h-3 w-3" />}
                      {template.templateType === 'PAGE_TEMPLATE' && <FileText className="h-3 w-3" />}
                      {templateTypeLabels[template.templateType]}
                    </span>
                    {template._count.pages > 0 && (
                      <span className="ml-2 text-xs text-gray-400">{template._count.pages} pages</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[template.status]}`}>
                      {template.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {template.partnerVisible ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Globe className="h-3 w-3" /> Partner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      )}
                      {template.isDemo && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Demo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {template.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      {actionLoading === template.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === template.id ? null : template.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>
                      )}
                      {showActionsMenu === template.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => { setSelectedTemplate(template); setShowActionsMenu(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Edit Metadata
                          </button>
                          {template.status === 'DRAFT' && (
                            <button
                              onClick={() => handleAction(template.id, 'publish')}
                              className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" /> Publish
                            </button>
                          )}
                          {template.status === 'PUBLISHED' && (
                            <>
                              <button
                                onClick={() => handleAction(template.id, 'unpublish')}
                                className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
                              >
                                <EyeOff className="h-4 w-4" /> Unpublish
                              </button>
                              <button
                                onClick={() => handleAction(template.id, 'deprecate')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Archive className="h-4 w-4" /> Deprecate
                              </button>
                            </>
                          )}
                          {template.status === 'DRAFT' && (
                            <button
                              onClick={() => { if (confirm('Delete this template?')) handleAction(template.id, 'delete'); }}
                              className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateTemplateModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTemplate}
          isLoading={actionLoading === 'create'}
        />
      )}

      {selectedTemplate && (
        <EditTemplateModal
          template={selectedTemplate}
          categories={categories}
          onClose={() => setSelectedTemplate(null)}
          onUpdate={handleUpdateTemplate}
          isLoading={actionLoading === selectedTemplate.id}
        />
      )}
    </div>
  )
}

function CreateTemplateModal({
  categories,
  onClose,
  onCreate,
  isLoading,
}: {
  categories: Category[]
  onClose: () => void
  onCreate: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: categories[0]?.id || '',
    templateType: 'PAGE_TEMPLATE',
    industry: '',
    useCase: '',
    isDemo: false,
    partnerVisible: true,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Template</h2>
          <p className="text-gray-500 text-sm mt-1">Templates are created by Super Admin only</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Type *</label>
              <select
                value={formData.templateType}
                onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PAGE_TEMPLATE">Page Template</option>
                <option value="SITE_TEMPLATE">Site Template</option>
                <option value="FUNNEL_TEMPLATE">Funnel Template</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., healthcare, retail"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Use Case</label>
              <input
                type="text"
                value={formData.useCase}
                onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                placeholder="e.g., lead_generation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.partnerVisible}
                onChange={(e) => setFormData({ ...formData, partnerVisible: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Visible to Partners</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDemo}
                onChange={(e) => setFormData({ ...formData, isDemo: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Demo Only</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTemplateModal({
  template,
  categories,
  onClose,
  onUpdate,
  isLoading,
}: {
  template: Template
  categories: Category[]
  onClose: () => void
  onUpdate: (id: string, data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    industry: template.industry || '',
    useCase: template.useCase || '',
    isDemo: template.isDemo,
    partnerVisible: template.partnerVisible,
  })

  const isPublished = template.status === 'PUBLISHED'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onUpdate(template.id, formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Template</h2>
          <p className="text-gray-500 text-sm mt-1">{template.name}</p>
          {isPublished && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              Published templates have limited editable fields
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isPublished && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use Case</label>
                  <input
                    type="text"
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.partnerVisible}
                onChange={(e) => setFormData({ ...formData, partnerVisible: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Visible to Partners</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDemo}
                onChange={(e) => setFormData({ ...formData, isDemo: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Demo Only</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
