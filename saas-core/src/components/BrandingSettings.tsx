'use client'

import { useState } from 'react'
import { Palette, Save, Loader2, Upload, Eye, RotateCcw } from 'lucide-react'

interface BrandingConfig {
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}

interface TenantSettingsPartial {
  id: string
  name: string
  slug: string
  branding: BrandingConfig
}

interface BrandingSettingsProps {
  settings: TenantSettingsPartial
  tenantSlug: string
  onUpdate: (branding: BrandingConfig) => void
}

export function BrandingSettings({ settings, tenantSlug, onUpdate }: BrandingSettingsProps) {
  const [appName, setAppName] = useState(settings.branding.appName)
  const [primaryColor, setPrimaryColor] = useState(settings.branding.primaryColor)
  const [secondaryColor, setSecondaryColor] = useState(settings.branding.secondaryColor)
  const [logoUrl, setLogoUrl] = useState(settings.branding.logoUrl || '')
  const [faviconUrl, setFaviconUrl] = useState(settings.branding.faviconUrl || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const DEFAULT_PRIMARY = '#6366f1'
  const DEFAULT_SECONDARY = '#8b5cf6'
  
  async function handleSave() {
    setSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || null,
          faviconUrl: faviconUrl || null
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        onUpdate({
          ...settings,
          branding: { appName, primaryColor, secondaryColor, logoUrl: logoUrl || null, faviconUrl: faviconUrl || null }
        })
        setMessage({ type: 'success', text: 'Branding saved! Changes will appear on next page load.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save branding' })
    } finally {
      setSaving(false)
    }
  }
  
  function resetToDefaults() {
    setPrimaryColor(DEFAULT_PRIMARY)
    setSecondaryColor(DEFAULT_SECONDARY)
  }
  
  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Branding</h2>
            <p className="text-sm text-slate-500">Customize how your workspace looks</p>
          </div>
        </div>
        
        {message && (
          <div className={`mb-6 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-6">
          {/* App Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              App Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="Your App Name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">Displayed in the sidebar, browser tab, and PWA</p>
          </div>
          
          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Brand Colors
              </label>
              <button
                onClick={resetToDefaults}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to defaults
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Logo URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">Square image, min 512x512px recommended</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Favicon URL
              </label>
              <input
                type="url"
                value={faviconUrl}
                onChange={e => setFaviconUrl(e.target.value)}
                placeholder="https://example.com/favicon.ico"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">Browser tab icon, .ico or .png</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Branding
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-slate-500" />
          <h3 className="font-medium text-slate-900">Preview</h3>
        </div>
        
        {/* Sidebar Preview */}
        <div className="rounded-lg overflow-hidden border border-slate-200">
          <div className="flex">
            {/* Mini Sidebar */}
            <div 
              className="w-16 h-40 flex flex-col items-center py-4 gap-4"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
                {appName.charAt(0)}
              </div>
              <div className="space-y-2">
                <div className="w-6 h-6 rounded-lg bg-white/20" />
                <div className="w-6 h-6 rounded-lg bg-white/10" />
                <div className="w-6 h-6 rounded-lg bg-white/10" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 bg-slate-50">
              <h4 className="font-semibold text-slate-900 mb-1">{appName}</h4>
              <p className="text-sm text-slate-500 mb-4">Dashboard Preview</p>
              
              {/* Stats Preview */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-3 rounded-lg">
                    <div 
                      className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                    <div className="h-2 bg-slate-200 rounded w-12 mb-1" />
                    <div className="h-2 bg-slate-100 rounded w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* PWA Icon Preview */}
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-2">PWA Icon</p>
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {appName.charAt(0)}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">App Label</p>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-xl mx-auto mb-1 flex items-center justify-center text-white font-bold shadow"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {appName.charAt(0)}
              </div>
              <span className="text-xs text-slate-700">{appName.substring(0, 10)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
