'use client'

/**
 * Commerce Rules Engine — Demo Page
 * 
 * Showcases all rule categories:
 * - Commission Rules (Partner)
 * - Pricing Rules (B2B)
 * - Promotion Rules (SVM)
 * - Inventory Rules (Reorder)
 * - Discount Rules (Billing)
 * 
 * @module app/commerce-rules-demo
 * @canonical PC-SCP Phase S5
 * @phase Phase 2 Track A (S3) - DemoModeProvider integrated
 */

import { useState, Suspense } from 'react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay, DemoGate } from '@/components/demo'
import {
  Percent,
  DollarSign,
  Tag,
  Package,
  Gift,
  Calculator,
  ChevronRight,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  Users,
  ShoppingCart,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface RuleCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  examples: RuleExample[]
}

interface RuleExample {
  name: string
  scenario: string
  input: Record<string, string | number>
  output: Record<string, string | number>
}

// ============================================================================
// DEMO DATA
// ============================================================================

const RULE_CATEGORIES: RuleCategory[] = [
  {
    id: 'commission',
    name: 'Commission Rules',
    description: 'Partner commission calculation (percentage, fixed, tiered, hybrid)',
    icon: Percent,
    color: 'blue',
    examples: [
      {
        name: 'Percentage Commission',
        scenario: 'Partner earns 5% on all sales',
        input: { saleAmount: 100000, rate: '5%' },
        output: { commission: 5000, effectiveRate: '5%' }
      },
      {
        name: 'Tiered Commission',
        scenario: 'Rate increases with volume',
        input: { saleAmount: 500000, tiers: '5%→7.5%→10%' },
        output: { commission: 42500, effectiveRate: '8.5%' }
      },
      {
        name: 'Hybrid Commission',
        scenario: 'Fixed base + percentage',
        input: { saleAmount: 200000, fixed: 2000, rate: '3%' },
        output: { commission: 8000, effectiveRate: '4%' }
      }
    ]
  },
  {
    id: 'pricing',
    name: 'Pricing Rules',
    description: 'B2B wholesale pricing, volume tiers, customer-specific prices',
    icon: DollarSign,
    color: 'green',
    examples: [
      {
        name: 'Volume Discount',
        scenario: 'Price drops with quantity',
        input: { quantity: 50, basePrice: '₦10,000' },
        output: { unitPrice: '₦9,500', discount: '5%', tier: 'WHOLESALE' }
      },
      {
        name: 'Customer Tier Pricing',
        scenario: 'VIP customers get special rates',
        input: { customer: 'VIP', quantity: 10 },
        output: { unitPrice: '₦8,500', discount: '15%', tier: 'VIP' }
      },
      {
        name: 'Bulk Order',
        scenario: 'Large orders unlock best price',
        input: { quantity: 100, basePrice: '₦10,000' },
        output: { unitPrice: '₦9,000', discount: '10%', tier: 'BULK' }
      }
    ]
  },
  {
    id: 'promotions',
    name: 'Promotion Rules',
    description: 'Coupons, flash sales, buy-x-get-y, automatic discounts',
    icon: Tag,
    color: 'purple',
    examples: [
      {
        name: 'Coupon Code',
        scenario: 'Customer enters SAVE20 at checkout',
        input: { code: 'SAVE20', cartTotal: '₦150,000' },
        output: { discount: '₦30,000', newTotal: '₦120,000', type: 'COUPON' }
      },
      {
        name: 'Flash Sale',
        scenario: 'Time-limited 30% off',
        input: { item: 'Electronics', normalPrice: '₦50,000' },
        output: { salePrice: '₦35,000', savings: '₦15,000', endsIn: '2h 30m' }
      },
      {
        name: 'Buy 2 Get 1 Free',
        scenario: 'Quantity-based offer',
        input: { items: 3, unitPrice: '₦5,000' },
        output: { paid: 2, free: 1, total: '₦10,000', saved: '₦5,000' }
      }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Rules',
    description: 'Reorder thresholds, safety stock, auto-replenishment',
    icon: Package,
    color: 'orange',
    examples: [
      {
        name: 'Low Stock Alert',
        scenario: 'Stock below minimum threshold',
        input: { currentStock: 45, minThreshold: 50 },
        output: { status: 'REORDER', suggestedQty: 200, urgency: 'NORMAL' }
      },
      {
        name: 'Critical Stock',
        scenario: 'Below safety stock level',
        input: { currentStock: 15, safetyStock: 25 },
        output: { status: 'URGENT', suggestedQty: 200, urgency: 'HIGH' }
      },
      {
        name: 'Adequate Stock',
        scenario: 'Stock levels healthy',
        input: { currentStock: 150, minThreshold: 50 },
        output: { status: 'OK', daysOfStock: 15, nextReview: '7 days' }
      }
    ]
  },
  {
    id: 'discounts',
    name: 'Discount Rules',
    description: 'Billing-side discounts, subscription promos, first-time offers',
    icon: Gift,
    color: 'pink',
    examples: [
      {
        name: 'Welcome Discount',
        scenario: 'New customer 20% off first order',
        input: { code: 'WELCOME20', orderTotal: '₦100,000', isNewCustomer: 'Yes' },
        output: { discount: '₦20,000', finalTotal: '₦80,000', type: 'PERCENTAGE' }
      },
      {
        name: 'Fixed Amount Off',
        scenario: '₦5,000 off orders above ₦25,000',
        input: { code: 'SAVE5000', orderTotal: '₦50,000' },
        output: { discount: '₦5,000', finalTotal: '₦45,000', type: 'FIXED' }
      },
      {
        name: 'Invalid Code',
        scenario: 'Code doesn\'t meet requirements',
        input: { code: 'WELCOME20', orderTotal: '₦30,000', minRequired: '₦50,000' },
        output: { valid: 'No', reason: 'Minimum order ₦50,000 required' }
      }
    ]
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; text: string; border: string; light: string }> = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
    green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
    pink: { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-200', light: 'bg-pink-50' }
  }
  return colors[color] || colors.blue
}

// ============================================================================
// COMPONENTS
// ============================================================================

function RuleCategoryCard({ 
  category, 
  isSelected, 
  onSelect 
}: { 
  category: RuleCategory
  isSelected: boolean
  onSelect: () => void 
}) {
  const Icon = category.icon
  const colors = getColorClasses(category.color)

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected 
          ? `${colors.border} ${colors.light}` 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.light}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
        </div>
        {isSelected && (
          <CheckCircle className={`w-5 h-5 ${colors.text}`} />
        )}
      </div>
    </button>
  )
}

function RuleExampleCard({ example, color }: { example: RuleExample; color: string }) {
  const [showResult, setShowResult] = useState(false)
  const colors = getColorClasses(color)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">{example.name}</h4>
          <button
            onClick={() => setShowResult(!showResult)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${colors.bg} text-white hover:opacity-90`}
          >
            <Play className="w-3 h-3" />
            {showResult ? 'Hide' : 'Run'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">{example.scenario}</p>
        
        {/* Input */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Input</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(example.input).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-gray-500">{key}:</span>{' '}
                <span className="font-mono font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        {showResult && (
          <div className={`${colors.light} rounded-lg p-3`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Result</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(example.output).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-600">{key}:</span>{' '}
                  <span className={`font-mono font-semibold ${colors.text}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const colors = getColorClasses(color)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.light}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function CommerceRulesDemoContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>('commission')
  
  const activeCategory = RULE_CATEGORIES.find((c: any) => c.id === selectedCategory)!

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Overlay */}
      <DemoOverlay />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Commerce Suite</span>
                <ChevronRight className="w-4 h-4" />
                <span>Rules Engine</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Commerce Rules Demo</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configuration-driven business logic • No code changes required
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard title="Rule Categories" value="5" icon={Layers} color="blue" />
          <StatCard title="Commission Types" value="4" icon={Percent} color="green" />
          <StatCard title="Pricing Tiers" value="3" icon={TrendingUp} color="purple" />
          <StatCard title="Promo Types" value="5" icon={Tag} color="orange" />
          <StatCard title="Auto-Triggers" value="3" icon={Zap} color="pink" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 mb-4">Rule Categories</h2>
            {RULE_CATEGORIES.map(category => (
              <RuleCategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onSelect={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>

          {/* Rule Examples */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {activeCategory.name} Examples
              </h2>
              <span className="text-sm text-gray-500">
                {activeCategory.examples.length} scenarios
              </span>
            </div>
            
            <div className="space-y-4">
              {activeCategory.examples.map((example, idx) => (
                <RuleExampleCard 
                  key={idx} 
                  example={example} 
                  color={activeCategory.color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Info Banners */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">How Rules Work</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Declarative:</strong> Rules are configuration, not code</li>
                  <li>• <strong>Composable:</strong> Combine multiple rules</li>
                  <li>• <strong>Auditable:</strong> Every decision is traceable</li>
                  <li>• <strong>Real-time:</strong> Changes apply immediately</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Nigeria-First Design</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>NGN Currency:</strong> All amounts in Naira</li>
                  <li>• <strong>Cash Discounts:</strong> Incentivize immediate payment</li>
                  <li>• <strong>Lead Time Buffer:</strong> Account for supply delays</li>
                  <li>• <strong>Mobile Money:</strong> OPay, PalmPay incentives</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="mt-6 bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-4">API Endpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-sm">
            <div>
              <span className="text-green-400">GET</span>{' '}
              <span className="text-gray-300">/api/commerce/rules</span>
            </div>
            <div>
              <span className="text-yellow-400">POST</span>{' '}
              <span className="text-gray-300">/api/commerce/rules/commission</span>
            </div>
            <div>
              <span className="text-yellow-400">POST</span>{' '}
              <span className="text-gray-300">/api/commerce/rules/pricing</span>
            </div>
            <div>
              <span className="text-green-400">GET</span>{' '}
              <span className="text-gray-300">/api/commerce/rules/promotions</span>
            </div>
            <div>
              <span className="text-yellow-400">POST</span>{' '}
              <span className="text-gray-300">/api/commerce/rules/inventory</span>
            </div>
            <div>
              <span className="text-yellow-400">POST</span>{' '}
              <span className="text-gray-300">/api/commerce/rules/discounts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function CommerceRulesDemoPage() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
        <DemoModeProvider>
          <CommerceRulesDemoContent />
        </DemoModeProvider>
      </Suspense>
    </DemoGate>
  )
}
