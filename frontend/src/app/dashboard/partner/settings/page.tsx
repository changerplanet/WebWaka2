'use client'

/**
 * Partner Settings Page
 * 
 * UI Completeness - No new capabilities.
 * Allows partners to manage their profile, branding defaults, and support info.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, User, Palette, Phone, Mail, 
  Building2, Globe, Bell, CreditCard, Loader2, Check
} from 'lucide-react'

interface PartnerSettings {
  // Profile
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  
  // Branding Defaults
  defaultPrimaryColor: string
  defaultSecondaryColor: string
  defaultLogoUrl: string
  
  // Support Contact Info
  supportEmail: string
  supportPhone: string
  supportWhatsApp: string
  
  // Notification Preferences
  emailNotifications: boolean
  smsNotifications: boolean
  newClientAlerts: boolean
  renewalReminders: boolean
  
  // Read-only Wholesale Info
  wholesalePlan: string
  wholesalePlanDetails: string
}

export default function PartnerSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'support' | 'notifications' | 'plan'>('profile')
  const [settings, setSettings] = useState<PartnerSettings>({
    businessName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    defaultPrimaryColor: '#10B981',
    defaultSecondaryColor: '#059669',
    defaultLogoUrl: '',
    supportEmail: '',
    supportPhone: '',
    supportWhatsApp: '',
    emailNotifications: true,
    smsNotifications: false,
    newClientAlerts: true,
    renewalReminders: true,
    wholesalePlan: 'Standard Partner',
    wholesalePlanDetails: 'Access to all suites and capabilities with standard wholesale pricing.',
  })
  
  useEffect(() => {
    fetchSettings()
  }, [])
  
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/partner/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const response = await fetch('/api/partner/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const updateSetting = (key: keyof PartnerSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'support', label: 'Support', icon: Phone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'plan', label: 'Plan', icon: CreditCard },
  ] as const
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/partner"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Partner Settings</h1>
                <p className="text-sm text-gray-500">Manage your partner profile and preferences</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Profile</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Your business information displayed to clients and WebWaka.
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={settings.businessName}
                          onChange={(e) => updateSetting('businessName', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="Your Business Name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={settings.contactName}
                          onChange={(e) => updateSetting('contactName', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="Your Name"
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => updateSetting('contactEmail', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={settings.contactPhone}
                            onChange={(e) => updateSetting('contactPhone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="+234 800 000 0000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Branding Tab */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Branding</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Default colors and logo for new client platforms. Can be overridden per instance.
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.defaultPrimaryColor}
                            onChange={(e) => updateSetting('defaultPrimaryColor', e.target.value)}
                            className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.defaultPrimaryColor}
                            onChange={(e) => updateSetting('defaultPrimaryColor', e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secondary Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.defaultSecondaryColor}
                            onChange={(e) => updateSetting('defaultSecondaryColor', e.target.value)}
                            className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.defaultSecondaryColor}
                            onChange={(e) => updateSetting('defaultSecondaryColor', e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Logo URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={settings.defaultLogoUrl}
                          onChange={(e) => updateSetting('defaultLogoUrl', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a URL to your default logo. Recommended size: 200x60px
                      </p>
                    </div>
                    
                    {/* Preview */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
                      <div 
                        className="p-4 rounded-lg text-white"
                        style={{ backgroundColor: settings.defaultPrimaryColor }}
                      >
                        <p className="font-semibold">Primary Color Preview</p>
                        <p className="text-sm opacity-80">This is how your primary color looks</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Support Tab */}
              {activeTab === 'support' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Contact Info</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Contact information shown to your clients for support requests.
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Support Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={settings.supportEmail}
                          onChange={(e) => updateSetting('supportEmail', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="support@yourbusiness.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Support Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={settings.supportPhone}
                          onChange={(e) => updateSetting('supportPhone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Support
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={settings.supportWhatsApp}
                          onChange={(e) => updateSetting('supportWhatsApp', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Clients can click to open WhatsApp chat directly
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Choose how you want to be notified about important events.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">New Client Alerts</p>
                        <p className="text-sm text-gray-500">Get notified when new clients sign up</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.newClientAlerts}
                        onChange={(e) => updateSetting('newClientAlerts', e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">Renewal Reminders</p>
                        <p className="text-sm text-gray-500">Reminders before client subscriptions renew</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.renewalReminders}
                        onChange={(e) => updateSetting('renewalReminders', e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>
              )}
              
              {/* Plan Tab (Read-only) */}
              {activeTab === 'plan' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Wholesale Plan</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Your current WebWaka wholesale plan. Contact us to upgrade.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{settings.wholesalePlan}</h3>
                        <p className="text-gray-600 mt-1">{settings.wholesalePlanDetails}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-emerald-100">
                      <p className="text-sm text-gray-500 mb-4">Plan Benefits:</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Access to all 7 industry suites
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-600" />
                          18+ capabilities available
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Unlimited client platforms
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-600" />
                          White-label branding
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Partner support
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mt-6">
                      <Link
                        href="/contact"
                        className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                      >
                        Contact us to upgrade →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
