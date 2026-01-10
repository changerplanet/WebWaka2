'use client'

/**
 * Guided Demo Mode Preview Page
 * 
 * Demonstrates the Guided Demo Mode features.
 * Shows how hints work without actual automation.
 * 
 * @route /demo/guided
 * @access Demo mode only
 */

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Lightbulb,
  ArrowLeft,
  Shield,
  Eye,
  BookOpen,
  Lock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { GuidedDemoProvider, useGuidedDemo, DEMO_HINTS } from '@/lib/demo/guided'
import { DemoHintBanner, DemoHintCallout } from '@/components/demo/DemoHintBanner'
import { GuidedDemoHints } from '@/components/demo/GuidedDemoController'

export default function GuidedDemoPreview() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <GuidedDemoContent />
    </Suspense>
  )
}

function GuidedDemoContent() {
  const searchParams = useSearchParams()
  const demoParam = searchParams.get('demo')
  const isDemo = demoParam === 'true'
  
  // Access denied view
  if (!isDemo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 mb-6">
            Guided demo mode is only available in demo context.
          </p>
          <Link
            href="/demo/guided?demo=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Shield className="w-4 h-4" />
            Enter Demo Mode
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <GuidedDemoProvider initialEnabled={true}>
      <GuidedDemoPreviewContent />
    </GuidedDemoProvider>
  )
}

function GuidedDemoPreviewContent() {
  const { isGuidedMode, toggleGuidedMode, dismissHint, resetDismissedHints, dismissedHints } = useGuidedDemo()
  const [selectedPage, setSelectedPage] = useState('dashboard')
  
  const pageOptions = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'pos', label: 'Point of Sale', icon: BookOpen },
    { id: 'accounting', label: 'Accounting', icon: BookOpen },
    { id: 'school', label: 'School', icon: BookOpen },
    { id: 'clinic', label: 'Clinic', icon: BookOpen },
    { id: 'church', label: 'Church', icon: BookOpen },
    { id: 'political', label: 'Political', icon: BookOpen },
    { id: 'audit', label: 'Audit View', icon: Eye },
  ]
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/demo/playbooks?demo=true" 
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Back to playbooks"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  <h1 className="text-xl font-bold text-slate-900">Guided Demo Mode</h1>
                </div>
                <p className="text-sm text-slate-500">UI hints for first-time demo users</p>
              </div>
            </div>
            
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
              DEMO MODE
            </span>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What is Guided Demo Mode?</h2>
          <p className="text-slate-600 mb-4">
            Guided Demo Mode provides contextual hints to help first-time demo users understand what they're seeing.
            It does <strong>NOT</strong> automate anything — it simply highlights important features and explains governance concepts.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                What It Does
              </h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Shows contextual hints and tips</li>
                <li>• Highlights governance features</li>
                <li>• Explains audit capabilities</li>
                <li>• Reduces verbal explanation burden</li>
                <li>• All hints are dismissible</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                What It Does NOT Do
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• NO auto-clicking or navigation</li>
                <li>• NO form auto-filling</li>
                <li>• NO simulated actions</li>
                <li>• NO backend triggers</li>
                <li>• NO "smart" automation</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Try It Out</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Dismissed: {dismissedHints.size}
              </span>
              {dismissedHints.size > 0 && (
                <button
                  onClick={resetDismissedHints}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Reset
                </button>
              )}
              <button
                onClick={toggleGuidedMode}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isGuidedMode 
                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isGuidedMode ? 'Hints On' : 'Hints Off'}
              </button>
            </div>
          </div>
          
          {/* Page Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {pageOptions.map(page => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedPage === page.id
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
          
          {/* Hint Preview */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-sm text-slate-500 mb-3">
              Hints for: <strong>{pageOptions.find((p: any) => p.id === selectedPage)?.label}</strong>
            </p>
            
            {isGuidedMode ? (
              <GuidedDemoHints pageId={selectedPage} />
            ) : (
              <p className="text-sm text-slate-400 italic">
                Enable guided mode to see hints
              </p>
            )}
          </div>
        </div>
        
        {/* Hint Categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Hint Categories</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <BookOpen className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-800">Workflow</p>
                <p className="text-sm text-emerald-700">Explains what the page does and how to use it</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <Shield className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800">Governance</p>
                <p className="text-sm text-slate-700">Highlights FREEZE rules, boundaries, and locked behaviors</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Eye className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Audit</p>
                <p className="text-sm text-amber-700">Points out audit trails, logging, and compliance features</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Navigation</p>
                <p className="text-sm text-blue-700">General tips for navigating the interface</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* How to Use */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How to Activate</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-slate-900">URL Parameter</p>
                <p className="text-sm text-slate-600">
                  Add <code className="bg-slate-100 px-1.5 py-0.5 rounded">?guidedDemo=true</code> to any demo URL
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-slate-900">Floating Button</p>
                <p className="text-sm text-slate-600">
                  Click the "Guided Mode" button in the bottom-right corner of demo pages
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-slate-900">Dismiss or Reset</p>
                <p className="text-sm text-slate-600">
                  Dismiss individual hints or reset all dismissed hints at any time
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Available Pages */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pages with Guided Hints</h2>
          
          <div className="grid md:grid-cols-2 gap-2">
            {Object.keys(DEMO_HINTS).filter((k: any) => k !== 'governance').map(pageId => (
              <div 
                key={pageId}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700 capitalize">{pageId}</span>
                  <span className="text-xs text-slate-500">
                    ({DEMO_HINTS[pageId]?.length || 0} hints)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Visual Guidance Only</p>
            <p className="text-sm text-amber-700">
              Guided Demo Mode provides visual hints and explanations only. It does not automate 
              any actions, fill forms, or navigate for you. All interactions remain manual.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-500 text-center">
            WebWaka Guided Demo Mode • Visual Hints Only • No Automation
          </p>
        </div>
      </footer>
    </div>
  )
}
