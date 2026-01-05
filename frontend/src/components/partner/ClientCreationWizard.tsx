'use client'

/**
 * PHASE 4A: Client Creation Wizard
 * 
 * Step-by-step wizard for Partners to create client platforms.
 * 
 * STEPS:
 * 1. Basic Info - Name, slug
 * 2. Admin Setup - Admin email, name
 * 3. Branding - Colors, logo (optional)
 * 4. Capabilities - What modules to request
 * 5. Review & Create
 */

import { useState } from 'react'
import { 
  Building2, User, Palette, Package, Check, ChevronRight, 
  ChevronLeft, Loader2, AlertCircle, Copy, ExternalLink 
} from 'lucide-react'

interface ClientCreationWizardProps {
  onComplete?: (result: any) => void
  onCancel?: () => void
}

interface FormData {
  // Step 1: Basic
  name: string
  slug: string
  
  // Step 2: Admin
  adminEmail: string
  adminName: string
  adminPhone: string
  
  // Step 3: Branding
  appName: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string
  
  // Step 4: Capabilities
  requestedCapabilities: string[]
  
  // Notes
  notes: string
}

const INITIAL_DATA: FormData = {
  name: '',
  slug: '',
  adminEmail: '',
  adminName: '',
  adminPhone: '',
  appName: '',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  logoUrl: '',
  requestedCapabilities: [],
  notes: '',
}

const CAPABILITY_OPTIONS = [
  { key: 'pos', name: 'Point of Sale', description: 'In-store sales and payments', category: 'Commerce' },
  { key: 'svm', name: 'Online Store', description: 'E-commerce storefront', category: 'Commerce' },
  { key: 'inventory', name: 'Inventory', description: 'Stock management', category: 'Operations' },
  { key: 'accounting', name: 'Accounting', description: 'Financial tracking', category: 'Operations' },
  { key: 'crm', name: 'CRM', description: 'Customer management', category: 'Operations' },
  { key: 'hr_payroll', name: 'HR & Payroll', description: 'Staff management', category: 'Operations' },
  { key: 'analytics', name: 'Analytics', description: 'Business insights', category: 'Growth' },
  { key: 'marketing', name: 'Marketing', description: 'Campaigns & promotions', category: 'Growth' },
  { key: 'payments', name: 'Payments', description: 'Payment processing', category: 'Platform' },
]

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Building2 },
  { id: 2, name: 'Admin Setup', icon: User },
  { id: 3, name: 'Branding', icon: Palette },
  { id: 4, name: 'Capabilities', icon: Package },
  { id: 5, name: 'Review', icon: Check },
]

export function ClientCreationWizard({ onComplete, onCancel }: ClientCreationWizardProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
    
    setData({ ...data, name, slug })
  }
  
  // Toggle capability
  const toggleCapability = (key: string) => {
    const caps = data.requestedCapabilities.includes(key)
      ? data.requestedCapabilities.filter(c => c !== key)
      : [...data.requestedCapabilities, key]
    
    setData({ ...data, requestedCapabilities: caps })
  }
  
  // Validate step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!data.name.trim()) newErrors.name = 'Business name is required'
      if (!data.slug.trim()) newErrors.slug = 'Slug is required'
      else if (!/^[a-z0-9-]+$/.test(data.slug)) {
        newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    }
    
    if (step === 2) {
      if (!data.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail)) {
        newErrors.adminEmail = 'Invalid email format'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Navigate steps
  const nextStep = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, 5))
    }
  }
  
  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1))
  }
  
  // Submit
  const handleSubmit = async () => {
    setSubmitting(true)
    setErrors({})
    
    try {
      const res = await fetch('/api/partner/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          adminEmail: data.adminEmail,
          adminName: data.adminName || null,
          adminPhone: data.adminPhone || null,
          branding: {
            appName: data.appName || data.name,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            logoUrl: data.logoUrl || null,
          },
          requestedCapabilities: data.requestedCapabilities,
          notes: data.notes || null,
        }),
      })
      
      const json = await res.json()
      
      if (json.success) {
        setResult(json)
        setStep(6) // Success step
        onComplete?.(json)
      } else {
        setErrors({ submit: json.error || 'Failed to create client' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto" data-testid="client-creation-wizard">
      {/* Progress Steps */}
      {step <= 5 && (
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s.id 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > s.id ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              {STEPS[step - 1]?.name || 'Complete'}
            </h2>
          </div>
        </div>
      )}
      
      {/* Form Content */}
      <div className="p-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Acme Stores"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                data-testid="input-name"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Platform URL *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={data.slug}
                  onChange={e => setData({ ...data, slug: e.target.value.toLowerCase() })}
                  placeholder="acme-stores"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  data-testid="input-slug"
                />
                <span className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-500 text-sm">
                  .webwaka.com
                </span>
              </div>
              {errors.slug && (
                <p className="text-red-600 text-sm mt-1">{errors.slug}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Step 2: Admin Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Admin Email *
              </label>
              <input
                type="email"
                value={data.adminEmail}
                onChange={e => setData({ ...data, adminEmail: e.target.value })}
                placeholder="admin@acme.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                data-testid="input-admin-email"
              />
              {errors.adminEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.adminEmail}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                An invitation will be sent to this email
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Admin Name
              </label>
              <input
                type="text"
                value={data.adminName}
                onChange={e => setData({ ...data, adminName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Admin Phone
              </label>
              <input
                type="tel"
                value={data.adminPhone}
                onChange={e => setData({ ...data, adminPhone: e.target.value })}
                placeholder="+234 803 123 4567"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}
        
        {/* Step 3: Branding */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={data.appName}
                onChange={e => setData({ ...data, appName: e.target.value })}
                placeholder={data.name || 'Platform Name'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-slate-500 mt-1">
                Leave empty to use business name
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
                    value={data.primaryColor}
                    onChange={e => setData({ ...data, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.primaryColor}
                    onChange={e => setData({ ...data, primaryColor: e.target.value })}
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
                    value={data.secondaryColor}
                    onChange={e => setData({ ...data, secondaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.secondaryColor}
                    onChange={e => setData({ ...data, secondaryColor: e.target.value })}
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
                value={data.logoUrl}
                onChange={e => setData({ ...data, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {/* Preview */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Preview</p>
              <div 
                className="h-20 rounded-lg flex items-center px-6"
                style={{ 
                  background: `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor})` 
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {(data.appName || data.name || 'A').charAt(0)}
                </div>
                <span className="ml-3 text-white font-semibold text-lg">
                  {data.appName || data.name || 'Platform Name'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Capabilities */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Select the capabilities this client will need. These are recommendations only - 
              capabilities can be activated later.
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {CAPABILITY_OPTIONS.map(cap => (
                <label
                  key={cap.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    data.requestedCapabilities.includes(cap.key)
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={data.requestedCapabilities.includes(cap.key)}
                    onChange={() => toggleCapability(cap.key)}
                    className="w-4 h-4 text-green-600 rounded border-slate-300"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{cap.name}</p>
                    <p className="text-sm text-slate-500">{cap.description}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {cap.category}
                  </span>
                </label>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={data.notes}
                onChange={e => setData({ ...data, notes: e.target.value })}
                placeholder="Any additional notes about this client..."
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}
        
        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Business Name</span>
                <span className="font-medium text-slate-900">{data.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Platform URL</span>
                <span className="font-medium text-slate-900">{data.slug}.webwaka.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Admin Email</span>
                <span className="font-medium text-slate-900">{data.adminEmail}</span>
              </div>
              {data.adminName && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Admin Name</span>
                  <span className="font-medium text-slate-900">{data.adminName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Capabilities</span>
                <span className="font-medium text-slate-900">
                  {data.requestedCapabilities.length || 'None'} selected
                </span>
              </div>
            </div>
            
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </div>
            )}
          </div>
        )}
        
        {/* Step 6: Success */}
        {step === 6 && result && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Client Platform Created!
            </h3>
            <p className="text-slate-600 mb-6">
              {result.tenant?.name} is ready. Send the invitation link to the admin.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4 text-left space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Platform URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white border border-slate-200 rounded text-sm">
                    {result.tenant?.slug}.webwaka.com
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`${result.tenant?.slug}.webwaka.com`)}
                    className="p-2 hover:bg-slate-200 rounded"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
              
              {result.invitationUrl && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Invitation Link</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white border border-slate-200 rounded text-sm truncate">
                      {result.invitationUrl}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(result.invitationUrl)}
                      className="p-2 hover:bg-slate-200 rounded"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Back to Clients
              </button>
              <a
                href={`/dashboard?tenant=${result.tenant?.slug}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                Open Platform
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      {step <= 5 && (
        <div className="border-t border-slate-200 p-6 flex justify-between">
          <button
            onClick={step === 1 ? onCancel : prevStep}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              data-testid="submit-create-client"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Client
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
