'use client'

import { useState } from 'react'
import { useMVM } from './MVMProvider'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react'

// ============================================================================
// VENDOR PROFILE
// ============================================================================

export function VendorProfile() {
  const { vendor, isLoadingVendor, updateVendorProfile } = useMVM()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    businessType: vendor?.businessType || '',
    description: vendor?.description || ''
  })

  // Update form when vendor changes
  useState(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone || '',
        businessType: vendor.businessType || '',
        description: vendor.description || ''
      })
    }
  })

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    
    const result = await updateVendorProfile(formData)
    
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' })
      setIsEditing(false)
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile' })
    }
    
    setIsSaving(false)
    
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000)
  }

  if (isLoadingVendor) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Unable to load profile</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <div className="space-y-6" data-testid="vendor-profile">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Profile</h1>
          <p className="text-slate-500">Manage your store information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            data-testid="edit-profile-btn"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
              data-testid="save-profile-btn"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          saveMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {saveMessage.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Store Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Store Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="input-name"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{vendor.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="input-email"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{vendor.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="+234 913 500 3000"
                    data-testid="input-phone"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{vendor.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Business Type
                </label>
                {isEditing ? (
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="input-businessType"
                  >
                    <option value="">Select type</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{vendor.businessType || 'Not specified'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Store Description
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none resize-none"
                    placeholder="Describe your store..."
                    data-testid="input-description"
                  />
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-900">{vendor.description || 'No description provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Account Status</h3>
            
            <div className={`p-4 rounded-xl border ${statusColors[vendor.status]}`}>
              <div className="flex items-center gap-3">
                {vendor.status === 'APPROVED' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
                <div>
                  <p className="font-semibold">{vendor.status.replace('_', ' ')}</p>
                  {vendor.isVerified && (
                    <p className="text-sm">Verified Seller</p>
                  )}
                </div>
              </div>
            </div>

            {vendor.status === 'PENDING_APPROVAL' && (
              <p className="text-sm text-slate-500 mt-3">
                Your account is under review. You'll be notified once approved.
              </p>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Store Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Sales</span>
                <span className="font-semibold text-slate-900">
                  ${vendor.totalSales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Orders</span>
                <span className="font-semibold text-slate-900">
                  {vendor.totalOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Reviews</span>
                <span className="font-semibold text-slate-900">
                  {vendor.reviewCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Commission Rate</span>
                <span className="font-semibold text-slate-900">
                  {vendor.commissionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Member since {new Date(vendor.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
