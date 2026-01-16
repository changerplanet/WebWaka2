'use client'

/**
 * Unified Commerce Demo Portal
 * 
 * Single landing page showcasing all 8 FROZEN Commerce Suites.
 * Links to individual demo pages for partners and investors.
 * Supports Partner Demo Mode with guided storylines.
 * Supports Quick Start via ?quickstart= parameter (Phase 3.1).
 * 
 * @module app/commerce-demo
 * @canonical PC-SCP Complete
 * @phase Phase 2 Track A + Phase 3.1
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Store,
  Building2,
  Package,
  CreditCard,
  Receipt,
  Calculator,
  Cog,
  ChevronRight,
  CheckCircle,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Layers,
  Play
} from 'lucide-react'
import { DemoModeProvider, useDemoMode, getStorylineList, resolveQuickStart, QuickStartConfig } from '@/lib/demo'
import { DemoModeToggle, StorylineSelector, DemoOverlay, QuickStartBanner, DemoGate } from '@/components/demo'

// ============================================================================
// TYPES
// ============================================================================

interface CommerceSuite {
  id: string
  name: string
  description: string
  highlights: string[]
  route: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  status: 'FROZEN' | 'BETA'
}

// ============================================================================
// ALL 8 FROZEN COMMERCE SUITES
// ============================================================================

const COMMERCE_SUITES: CommerceSuite[] = [
  {
    id: 'pos',
    name: 'POS & Retail Operations',
    description: 'Point-of-sale transactions, cash management, and in-store retail workflows',
    highlights: [
      'Multi-tender payments (Cash, Card, Transfer)',
      'Shift management & cash reconciliation',
      'Receipt generation & reprinting',
      'Offline-capable transactions'
    ],
    route: '/pos-demo',
    icon: ShoppingCart,
    color: 'emerald',
    status: 'FROZEN'
  },
  {
    id: 'svm',
    name: 'Single Vendor Marketplace',
    description: 'Online storefront for single merchants with catalog, cart, and checkout',
    highlights: [
      'Product catalog management',
      'Shopping cart & checkout flow',
      'Order tracking & fulfillment',
      'Customer accounts & wishlists'
    ],
    route: '/svm-demo',
    icon: Store,
    color: 'blue',
    status: 'FROZEN'
  },
  {
    id: 'mvm',
    name: 'Multi-Vendor Marketplace',
    description: 'Platform connecting multiple vendors with shared infrastructure',
    highlights: [
      'Vendor onboarding & management',
      'Commission calculation',
      'Split payments & settlements',
      'Vendor performance analytics'
    ],
    route: '/mvm-demo',
    icon: Building2,
    color: 'indigo',
    status: 'FROZEN'
  },
  {
    id: 'inventory',
    name: 'Inventory & Stock Control',
    description: 'Stock tracking, reorder management, and warehouse operations',
    highlights: [
      'Real-time stock levels',
      'Low stock alerts & reorder points',
      'Multi-location inventory',
      'Stock adjustments & transfers'
    ],
    route: '/inventory-demo',
    icon: Package,
    color: 'amber',
    status: 'FROZEN'
  },
  {
    id: 'payments',
    name: 'Payments & Collections',
    description: 'Nigeria-first payment processing with bank transfer, POD, and mobile money',
    highlights: [
      'Bank Transfer with proof upload',
      'Pay-on-Delivery (state restrictions)',
      'Mobile Money (OPay, PalmPay)',
      'Partial payment tracking'
    ],
    route: '/payments-demo',
    icon: CreditCard,
    color: 'teal',
    status: 'FROZEN'
  },
  {
    id: 'billing',
    name: 'Billing & Subscriptions',
    description: 'Invoice creation, payment recording, credit notes, and VAT calculations',
    highlights: [
      'Invoice lifecycle management',
      'Nigerian 7.5% VAT calculation',
      'Credit notes & applications',
      'Aging reports & collections'
    ],
    route: '/billing-demo',
    icon: Receipt,
    color: 'violet',
    status: 'FROZEN'
  },
  {
    id: 'accounting',
    name: 'Accounting (Light)',
    description: 'Double-entry bookkeeping with Nigeria SME chart of accounts',
    highlights: [
      'Nigeria SME Chart of Accounts',
      'Journal entries (auto & manual)',
      'Trial balance & VAT summary',
      'Cash & bank reconciliation'
    ],
    route: '/accounting-demo',
    icon: Calculator,
    color: 'cyan',
    status: 'FROZEN'
  },
  {
    id: 'rules',
    name: 'Commerce Rules Engine',
    description: 'Configuration-driven business logic for commissions, pricing, and promotions',
    highlights: [
      'Commission rules (%, fixed, tiered)',
      'B2B pricing & volume discounts',
      'Promotion & coupon engine',
      'Inventory reorder rules'
    ],
    route: '/commerce-rules-demo',
    icon: Cog,
    color: 'rose',
    status: 'FROZEN'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getColorClasses(color: string) {
  const colors: Record<string, { 
    bg: string
    bgLight: string
    text: string
    border: string
    gradient: string
  }> = {
    emerald: {
      bg: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    blue: {
      bg: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600'
    },
    indigo: {
      bg: 'bg-indigo-600',
      bgLight: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    amber: {
      bg: 'bg-amber-600',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      gradient: 'from-amber-500 to-amber-600'
    },
    teal: {
      bg: 'bg-teal-600',
      bgLight: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200',
      gradient: 'from-teal-500 to-teal-600'
    },
    violet: {
      bg: 'bg-violet-600',
      bgLight: 'bg-violet-50',
      text: 'text-violet-600',
      border: 'border-violet-200',
      gradient: 'from-violet-500 to-violet-600'
    },
    cyan: {
      bg: 'bg-cyan-600',
      bgLight: 'bg-cyan-50',
      text: 'text-cyan-600',
      border: 'border-cyan-200',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    rose: {
      bg: 'bg-rose-600',
      bgLight: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
      gradient: 'from-rose-500 to-rose-600'
    }
  }
  return colors[color] || colors.blue
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SuiteCard({ suite }: { suite: CommerceSuite }) {
  const Icon = suite.icon
  const colors = getColorClasses(suite.color)

  return (
    <Link
      href={suite.route}
      className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
      data-testid={`suite-card-${suite.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.bgLight}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            {suite.status}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-gray-700">
        {suite.name}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {suite.description}
      </p>

      <div className="space-y-2 mb-4">
        {suite.highlights.slice(0, 3).map((highlight, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
            <ChevronRight className={`w-4 h-4 ${colors.text}`} />
            <span>{highlight}</span>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-2 text-sm font-medium ${colors.text} group-hover:gap-3 transition-all`}>
        <span>View Demo</span>
        <ExternalLink className="w-4 h-4" />
      </div>
    </Link>
  )
}

function StatCard({ 
  value, 
  label, 
  icon: Icon 
}: { 
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
      <Icon className="w-6 h-6 text-white/70 mx-auto mb-2" />
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/70">{label}</p>
    </div>
  )
}

// ============================================================================
// PARTNER DEMO MODE SECTION (With Quick Start Support)
// ============================================================================

function PartnerDemoSection() {
  const demo = useDemoMode()
  const router = useRouter()
  const searchParams = useSearchParams()
  const storylines = getStorylineList()
  
  // Quick Start state
  const [quickStartConfig, setQuickStartConfig] = useState<QuickStartConfig | null>(null)
  const [hasProcessedQuickStart, setHasProcessedQuickStart] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Mark as client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Process ?quickstart= parameter on mount (client-side only)
  useEffect(() => {
    if (!isClient || hasProcessedQuickStart) return
    
    const quickstartParam = searchParams.get('quickstart')
    const result = resolveQuickStart(quickstartParam)
    
    if (result.isActive && result.config) {
      setQuickStartConfig(result.config)
      // Auto-start the storyline
      demo.startStoryline(result.config.storylineId)
    }
    
    setHasProcessedQuickStart(true)
  }, [searchParams, demo, hasProcessedQuickStart, isClient])

  // Handle "Switch Role" - return to storyline selector
  const handleSwitchRole = () => {
    setQuickStartConfig(null)
    // Clear quickstart param and go to partner mode selector
    router.push('/commerce-demo?mode=partner')
  }

  // Handle "Dismiss" - exit demo mode entirely
  const handleDismiss = () => {
    setQuickStartConfig(null)
    demo.exitDemo()
  }

  // Show Quick Start Banner if active and in demo mode
  if (quickStartConfig && demo.mode === 'partner' && demo.storyline) {
    return (
      <div className="mb-12">
        <QuickStartBanner 
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismiss}
        />
      </div>
    )
  }

  // If in partner mode but no storyline selected, show selector
  if (demo.mode === 'partner' && !demo.storyline) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 mb-12 border border-emerald-100">
        <StorylineSelector
          storylines={storylines}
          onSelect={demo.startStoryline}
        />
      </div>
    )
  }

  // Default: Show demo mode toggle and CTA
  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-8 mb-12 border border-gray-200">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Play className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Partner Demo Mode</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Take a guided tour through the platform. Perfect for partners, investors, 
            and anyone who wants to understand the full commerce stack.
          </p>
          <div className="flex flex-wrap gap-2">
            {storylines.map((s: any) => (
              <span 
                key={s.id}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
              >
                {s.name} ({s.durationMinutes} min)
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <DemoModeToggle mode={demo.mode} onToggle={demo.toggleMode} />
          <p className="text-xs text-gray-400">Toggle to start guided demo</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT (Without Suspense boundary issues)
// ============================================================================

function CommerceDemoContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Overlay (Banner + Tooltip when active) */}
      <DemoOverlay />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <span>WebWaka Platform</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Commerce Suite</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Commerce Suite
              </h1>
              <p className="text-lg text-slate-300 mb-6">
                A complete, Nigeria-first commerce platform. 8 integrated suites covering 
                POS, marketplaces, inventory, payments, billing, accounting, and business rules.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  8 Suites FROZEN
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Demo Mode
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  <Globe className="w-4 h-4" />
                  Nigeria-First
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard value="8" label="Suites" icon={Layers} />
              <StatCard value="40+" label="API Endpoints" icon={Zap} />
              <StatCard value="NGN" label="Currency" icon={TrendingUp} />
              <StatCard value="7.5%" label="VAT Ready" icon={Receipt} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Partner Demo Mode Section */}
        <PartnerDemoSection />

        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Explore All Commerce Suites
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Each suite is fully functional with Nigeria-first defaults, demo data, and 
            capability-guarded APIs. Click any card to explore the interactive demo.
          </p>
        </div>

        {/* Suite Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="suite-grid">
          {COMMERCE_SUITES.map(suite => (
            <SuiteCard key={suite.id} suite={suite} />
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Nigeria-First Design</h3>
            <p className="text-sm text-gray-500">
              Built for Nigerian commerce: NGN currency, 7.5% VAT, bank transfers, 
              mobile money, and state-specific logistics rules.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Capability Guards</h3>
            <p className="text-sm text-gray-500">
              Every API route is protected with session-based capability checks. 
              Role-based access control built into every endpoint.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Integrated Stack</h3>
            <p className="text-sm text-gray-500">
              All 8 suites share a common data model, authentication layer, and 
              event bus for seamless cross-suite operations.
            </p>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="mt-16 bg-slate-900 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6 text-center">Commerce Suite Architecture</h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-emerald-400 mb-3">Storefront Layer</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• POS & Retail</li>
                <li>• Single Vendor (SVM)</li>
                <li>• Multi-Vendor (MVM)</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-blue-400 mb-3">Operations Layer</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Inventory Control</li>
                <li>• Payments & Collections</li>
                <li>• Order Fulfillment</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-violet-400 mb-3">Finance Layer</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Billing & Invoicing</li>
                <li>• Accounting</li>
                <li>• VAT Compliance</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-rose-400 mb-3">Logic Layer</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Rules Engine</li>
                <li>• Commission Calc</li>
                <li>• Pricing Rules</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Commerce Suite v1.0 • Platform Canonicalization Complete • 
            <span className="text-green-600 font-medium"> All 8 Suites FROZEN</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function CommerceDemoPortal() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
        <DemoModeProvider>
          <CommerceDemoContent />
        </DemoModeProvider>
      </Suspense>
    </DemoGate>
  )
}
