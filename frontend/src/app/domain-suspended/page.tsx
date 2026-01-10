'use client'

/**
 * Domain Suspended Page
 * 
 * Displayed when a domain is in SUSPENDED lifecycle state.
 * Neutral, governance-worded, non-accusatory.
 * 
 * @route /domain-suspended
 * @phase Partner Domain Governance Layer
 */

import { ShieldOff, AlertTriangle, Mail, FileText } from 'lucide-react'

export default function DomainSuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-slate-500" />
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Domain Access Suspended
          </h1>
          
          {/* Description */}
          <p className="text-slate-600 mb-6">
            Access to this domain has been temporarily suspended pending review. 
            This is a governance action to ensure platform integrity.
          </p>
          
          {/* Information Box */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm font-medium text-slate-700 mb-3">What This Means</div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>The domain is temporarily inaccessible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Your data remains secure and intact</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>A review process is underway</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>No automated actions are being taken</span>
              </li>
            </ul>
          </div>
          
          {/* Governance Notice */}
          <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4 text-left mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-900">Governance Action</div>
              <p className="text-sm text-amber-700 mt-1">
                Domain suspensions are governance actions subject to WebWaka platform 
                policies. All suspension events are logged for transparency.
              </p>
            </div>
          </div>
          
          {/* Resolution Steps */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm font-medium text-slate-700 mb-3">Resolution Steps</div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-slate-600">1</span>
                </div>
                <span className="text-sm text-slate-600">Contact your partner administrator</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-slate-600">2</span>
                </div>
                <span className="text-sm text-slate-600">Review the suspension notice</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-slate-600">3</span>
                </div>
                <span className="text-sm text-slate-600">Submit resolution documentation</span>
              </div>
            </div>
          </div>
          
          {/* Contact Options */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Mail className="w-4 h-4" />
              <span>Contact your partner administrator</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>Review governance policies</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          WebWaka Domain Governance • All actions logged
        </p>
      </div>
    </div>
  )
}
