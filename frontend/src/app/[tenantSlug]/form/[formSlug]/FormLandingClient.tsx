'use client'

import { useState } from 'react'
import { PublicTenant, PublicForm } from '@/lib/sites-funnels/public-resolver'

interface Props {
  tenant: PublicTenant
  form: PublicForm
}

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  validation?: any
}

export function FormLandingClient({ tenant, form }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = form.schema as { fields?: FormField[] } | null
  const fields = schema?.fields || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/sites-funnels/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          data: formData,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to submit form')
      }

      setSubmitted(true)
      
      if (form.successRedirectUrl) {
        window.location.href = form.successRedirectUrl
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const renderField = (field: FormField) => {
    const commonClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <input
            type={field.type}
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
            className={commonClasses}
          />
        )
      
      case 'select':
        return (
          <select
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.id}
              required={field.required}
              checked={formData[field.id] || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor={field.id} className="text-gray-700">{field.placeholder || field.label}</label>
          </div>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={formData[field.id] === opt.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      
      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )
      
      default:
        return (
          <input
            type="text"
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">
            {form.successMessage || 'Your submission has been received. We\'ll be in touch soon.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header 
        className="py-4 px-4"
        style={{ backgroundColor: tenant.primaryColor || '#059669' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto" />
            )}
            <span className="text-white font-semibold">{tenant.name}</span>
          </div>
          
          {tenant.isDemo && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
              DEMO
            </span>
          )}
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-gray-600 mb-6">{form.description}</p>
            )}

            {form.paymentEnabled && form.paymentAmount && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 font-medium">
                  Payment Required: {form.paymentCurrency || 'NGN'} {form.paymentAmount.toLocaleString()}
                </p>
                {form.paymentDescription && (
                  <p className="text-amber-700 text-sm mt-1">{form.paymentDescription}</p>
                )}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.length > 0 ? (
                fields.map(field => (
                  <div key={field.id}>
                    <label 
                      htmlFor={field.id} 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>This form is being configured.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || fields.length === 0}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : (form.submitButtonText || 'Submit')}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center text-sm text-gray-500">
        <p>Powered by WebWaka</p>
      </footer>
    </div>
  )
}
