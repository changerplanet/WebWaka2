'use client'

/**
 * Domain Pending Activation Page
 * 
 * Displayed when a domain is in PENDING lifecycle state.
 * Neutral, governance-worded, non-accusatory.
 * 
 * @route /domain-pending
 * @phase Partner Domain Governance Layer
 */

import { Clock, Shield, Mail } from 'lucide-react'

export default function DomainPendingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Domain Activation Pending
          </h1>
          
          {/* Description */}
          <p className="text-slate-600 mb-6">
            This domain is currently being activated. The activation process ensures 
            proper governance and security configuration.
          </p>
          
          {/* Status Timeline */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm font-medium text-slate-700 mb-3">Activation Status</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Domain registered</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Partner verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">Configuration in progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <span className="text-sm text-slate-400">Final verification</span>
              </div>
            </div>
          </div>
          
          {/* Governance Notice */}
          <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 text-left mb-6">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-900">Governance Notice</div>
              <p className="text-sm text-blue-700 mt-1">
                All WebWaka domains follow strict activation governance. This ensures 
                proper tenant isolation and security compliance.
              </p>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Mail className="w-4 h-4" />
            <span>Contact your partner administrator for updates</span>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          WebWaka Domain Governance
        </p>
      </div>
    </div>
  )
}
