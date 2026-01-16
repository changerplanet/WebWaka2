'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutTemplate, Search, Filter, Eye, Copy, Loader2, ChevronRight,
  Layers, FileText, Grid3X3, List, AlertTriangle, CheckCircle, X
} from 'lucide-react'

interface Template {
  id: string
  name: string
  slug: string
  description?: string
  previewImageUrl?: string
  thumbnailUrl?: string
  templateType: 'SITE_TEMPLATE' | 'FUNNEL_TEMPLATE' | 'PAGE_TEMPLATE'
  industry?: string
  useCase?: string
  category?: { id: string; name: string; slug: string }
  pageCount: number
  version: string
  isDemo: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  templateCount: number
}

const templateTypeLabels = {
  SITE_TEMPLATE: 'Site Template',
  FUNNEL_TEMPLATE: 'Funnel Template',
  PAGE_TEMPLATE: 'Page Template',
}

const templateTypeIcons = {
  SITE_TEMPLATE: Layers,
  FUNNEL_TEMPLATE: ChevronRight,
  PAGE_TEMPLATE: FileText,
}

export default function PartnerTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneSuccess, setCloneSuccess] = useState<{ type: string; name: string; slug: string } | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (typeFilter) params.set('templateType', typeFilter)

      const res = await fetch(`/api/partner/templates?${params}`)
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
  }, [searchQuery, categoryFilter, typeFilter])

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

  async function handleClone(formData: { name: string; slug: string }) {
    if (!selectedTemplate) return

    setCloneLoading(true)
    try {
      const action = selectedTemplate.templateType === 'SITE_TEMPLATE' ? 'cloneSite' : 'cloneFunnel'
      const body: Record<string, unknown> = {
        action,
        templateId: selectedTemplate.id,
      }

      if (action === 'cloneSite') {
        body.siteName = formData.name
        body.siteSlug = formData.slug
      } else {
        body.funnelName = formData.name
        body.funnelSlug = formData.slug
      }

      const res = await fetch('/api/partner/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success) {
        setCloneSuccess({
          type: action === 'cloneSite' ? 'Site' : 'Funnel',
          name: formData.name,
          slug: formData.slug,
        })
        setShowCloneModal(false)
      } else {
        alert(data.error || 'Failed to clone template')
      }
    } catch (err) {
      alert('Failed to clone template')
    } finally {
      setCloneLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <LayoutTemplate className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Gallery</h1>
            <p className="text-gray-500 text-sm">Browse and clone templates for your clients</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.templateCount})
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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

      {cloneSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>{cloneSuccess.type} "{cloneSuccess.name}" created successfully!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(cloneSuccess.type === 'Site' ? '/partner-portal/sites' : '/partner-portal/funnels')}
              className="text-sm text-green-600 hover:text-green-700 underline"
            >
              View {cloneSuccess.type}
            </button>
            <button onClick={() => setCloneSuccess(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <LayoutTemplate className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No templates available</p>
          <p className="text-gray-400 text-sm mt-1">Templates will appear here once published by the platform</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const TypeIcon = templateTypeIcons[template.templateType]
            return (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {template.thumbnailUrl ? (
                    <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <TypeIcon className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.category && (
                        <p className="text-xs text-gray-500">{template.category.name}</p>
                      )}
                    </div>
                    {template.isDemo && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Demo</span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <TypeIcon className="h-3 w-3" />
                      {templateTypeLabels[template.templateType]}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {template.templateType !== 'PAGE_TEMPLATE' && (
                        <button
                          onClick={() => { setSelectedTemplate(template); setShowCloneModal(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          <Copy className="h-4 w-4" />
                          Clone
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pages</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => {
                const TypeIcon = templateTypeIcons[template.templateType]
                return (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <TypeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{template.description}</div>
                          )}
                        </div>
                        {template.isDemo && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Demo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <TypeIcon className="h-4 w-4" />
                        {templateTypeLabels[template.templateType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {template.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {template.pageCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {template.templateType !== 'PAGE_TEMPLATE' && (
                          <button
                            onClick={() => { setSelectedTemplate(template); setShowCloneModal(true); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            <Copy className="h-4 w-4" />
                            Clone
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedTemplate && !showCloneModal && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onClone={() => setShowCloneModal(true)}
        />
      )}

      {showCloneModal && selectedTemplate && (
        <CloneTemplateModal
          template={selectedTemplate}
          onClose={() => { setShowCloneModal(false); setSelectedTemplate(null); }}
          onClone={handleClone}
          isLoading={cloneLoading}
        />
      )}
    </div>
  )
}

function TemplatePreviewModal({
  template,
  onClose,
  onClone,
}: {
  template: Template
  onClose: () => void
  onClone: () => void
}) {
  const TypeIcon = templateTypeIcons[template.templateType]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
          {template.previewImageUrl || template.thumbnailUrl ? (
            <img
              src={template.previewImageUrl || template.thumbnailUrl}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <TypeIcon className="h-16 w-16 text-gray-300" />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  <TypeIcon className="h-3 w-3" />
                  {templateTypeLabels[template.templateType]}
                </span>
                {template.category && (
                  <span className="text-xs text-gray-500">{template.category.name}</span>
                )}
                {template.isDemo && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Demo</span>
                )}
              </div>
            </div>
          </div>

          {template.description && (
            <p className="text-gray-600 mb-4">{template.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {template.industry && (
              <div>
                <span className="text-xs text-gray-500">Industry</span>
                <p className="text-sm font-medium text-gray-900 capitalize">{template.industry}</p>
              </div>
            )}
            {template.useCase && (
              <div>
                <span className="text-xs text-gray-500">Use Case</span>
                <p className="text-sm font-medium text-gray-900 capitalize">{template.useCase.replace(/_/g, ' ')}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500">Pages</span>
              <p className="text-sm font-medium text-gray-900">{template.pageCount}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Version</span>
              <p className="text-sm font-medium text-gray-900">{template.version}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            {template.templateType !== 'PAGE_TEMPLATE' && (
              <button
                onClick={onClone}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Copy className="h-4 w-4" />
                Clone Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CloneTemplateModal({
  template,
  onClose,
  onClone,
  isLoading,
}: {
  template: Template
  onClose: () => void
  onClone: (data: { name: string; slug: string }) => void
  isLoading: boolean
}) {
  const isSite = template.templateType === 'SITE_TEMPLATE'
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onClone(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Clone {isSite ? 'Site' : 'Funnel'} Template
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Create a new {isSite ? 'site' : 'funnel'} from "{template.name}"
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isSite ? 'Site' : 'Funnel'} Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`My ${isSite ? 'Site' : 'Funnel'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isSite ? 'Site' : 'Funnel'} Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder={`my-${isSite ? 'site' : 'funnel'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (lowercase, no spaces)</p>
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create {isSite ? 'Site' : 'Funnel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
