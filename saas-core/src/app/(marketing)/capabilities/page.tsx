/**
 * WebWaka Capabilities Page
 * Full showcase of ALL platform capabilities - these are EXISTING, not future features
 * Grouped into: Core Business, Growth & Operations, Platform & Ecosystem
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Zap,
  ShoppingCart, Store, Package, Calculator, Heart, Truck, Users,
  BarChart3, Megaphone, Building2, CreditCard, RefreshCw, Shield,
  Brain, Plug, Briefcase, Receipt, Target, Warehouse, FileText,
  TrendingUp, Settings, Lock, Wifi, Smartphone, Database
} from 'lucide-react'

export const metadata = {
  title: 'Capabilities — WebWaka Platform',
  description: 'Explore 18+ platform capabilities that power WebWaka. From POS and Inventory to AI & Automation, every capability is ready to activate based on your organizational needs.',
}

// All capabilities are EXISTING - grouped by category
const capabilityGroups = [
  {
    id: 'core-business',
    name: 'Core Business Capabilities',
    description: 'Essential modules for day-to-day business operations. These capabilities form the foundation of commerce and service delivery.',
    color: 'green',
    capabilities: [
      {
        key: 'pos',
        name: 'Point of Sale (POS)',
        icon: ShoppingCart,
        description: 'One-tap checkout, receipt printing, barcode scanning, and cash management. Works reliably offline with automatic sync.',
        highlights: ['Offline-first operation', 'Multi-payment methods', 'Real-time inventory sync', 'Receipt customization'],
      },
      {
        key: 'svm',
        name: 'Online Store (Single Vendor)',
        icon: Store,
        description: 'Launch your own branded storefront. Accept orders via web, WhatsApp, and social media with integrated payments.',
        highlights: ['Custom storefront', 'WhatsApp ordering', 'Payment links', 'Order tracking'],
      },
      {
        key: 'mvm',
        name: 'Multi-Vendor Marketplace',
        icon: Users,
        description: 'Run a marketplace with multiple vendors. Manage commissions, vendor payouts, and centralized catalog management.',
        highlights: ['Vendor onboarding', 'Commission rules', 'Payout management', 'Central catalog'],
      },
      {
        key: 'inventory',
        name: 'Inventory & Warehouse',
        icon: Warehouse,
        description: 'Multi-location stock tracking, transfer management, low-stock alerts, and batch/expiry tracking for complete inventory control.',
        highlights: ['Multi-warehouse', 'Stock transfers', 'Expiry tracking', 'Reorder intelligence'],
      },
      {
        key: 'accounting',
        name: 'Accounting & Finance',
        icon: Calculator,
        description: 'Double-entry bookkeeping, expense tracking, financial statements, and Nigeria VAT compliance built in.',
        highlights: ['Double-entry ledger', 'P&L statements', 'VAT calculations', 'Expense tracking'],
      },
      {
        key: 'crm',
        name: 'CRM & Customer Engagement',
        icon: Heart,
        description: 'Customer segmentation, loyalty programs, engagement tracking, and personalized marketing for Nigerian SMEs.',
        highlights: ['Customer profiles', 'Loyalty programs', 'Segmentation', 'Purchase history'],
      },
    ]
  },
  {
    id: 'growth-operations',
    name: 'Growth & Operations',
    description: 'Advanced capabilities that help organizations scale, automate, and optimize their operations.',
    color: 'blue',
    capabilities: [
      {
        key: 'logistics',
        name: 'Logistics & Delivery',
        icon: Truck,
        description: 'Fleet management, driver tracking, route optimization, and real-time delivery updates for your customers.',
        highlights: ['Fleet tracking', 'Driver app', 'Route planning', 'Proof of delivery'],
      },
      {
        key: 'hr_payroll',
        name: 'HR & Payroll',
        icon: Briefcase,
        description: 'Employee management, attendance tracking, leave management, and payroll processing with tax compliance.',
        highlights: ['Employee records', 'Payroll processing', 'Leave management', 'Tax deductions'],
      },
      {
        key: 'procurement',
        name: 'Procurement & Suppliers',
        icon: FileText,
        description: 'Purchase orders, supplier management, RFQ workflows, and contract tracking for efficient procurement.',
        highlights: ['Purchase orders', 'Supplier scorecards', 'RFQ management', 'Contract tracking'],
      },
      {
        key: 'analytics',
        name: 'Analytics & BI',
        icon: BarChart3,
        description: 'Nigeria-first business intelligence with dashboards, reports, trend analysis, and actionable insights.',
        highlights: ['Custom dashboards', 'Sales analytics', 'Trend forecasting', 'Export reports'],
      },
      {
        key: 'marketing',
        name: 'Marketing Automation',
        icon: Megaphone,
        description: 'SMS-first marketing automation with campaign management, templates, and event-driven triggers.',
        highlights: ['SMS campaigns', 'Email automation', 'Campaign templates', 'Event triggers'],
      },
      {
        key: 'b2b',
        name: 'B2B & Wholesale',
        icon: Building2,
        description: 'Bulk trading, credit terms, negotiated pricing, and distributor-to-retailer workflows for B2B commerce.',
        highlights: ['Tiered pricing', 'Credit management', 'Bulk orders', 'B2B catalogs'],
      },
    ]
  },
  {
    id: 'platform-ecosystem',
    name: 'Platform & Ecosystem',
    description: 'Foundational capabilities that power the entire WebWaka platform and enable ecosystem growth.',
    color: 'purple',
    capabilities: [
      {
        key: 'payments',
        name: 'Payments & Wallets',
        icon: CreditCard,
        description: 'Nigeria-first payment processing. Cash, cards, bank transfers, and mobile wallets with complete audit trails.',
        highlights: ['Multi-payment', 'Wallet system', 'Settlement tracking', 'Refund management'],
      },
      {
        key: 'subscriptions_billing',
        name: 'Subscription Extensions',
        icon: RefreshCw,
        description: 'Flexible subscription management with usage-based billing, bundles, add-ons, and grace period handling.',
        highlights: ['Recurring billing', 'Usage metering', 'Bundle pricing', 'Grace periods'],
      },
      {
        key: 'compliance_tax',
        name: 'Compliance & Tax (Nigeria)',
        icon: Shield,
        description: 'VAT compliance, withholding tax computation, FIRS reporting preparation, and audit-ready records.',
        highlights: ['VAT 7.5%', 'WHT computation', 'FIRS-ready', 'Audit trails'],
      },
      {
        key: 'ai_automation',
        name: 'AI & Automation',
        icon: Brain,
        description: 'Explainable AI insights, smart recommendations, and rule-based automation with human-in-the-loop controls.',
        highlights: ['Sales predictions', 'Smart reorders', 'Workflow automation', 'AI insights'],
      },
      {
        key: 'partner_reseller',
        name: 'Partner & Reseller',
        icon: Target,
        description: 'Digital Transformation Partner platform for reselling, onboarding, supporting clients, and earning commissions.',
        highlights: ['Partner portal', 'Referral tracking', 'Commission rules', 'Client management'],
      },
      {
        key: 'integrations_hub',
        name: 'Ecosystem & Integrations',
        icon: Plug,
        description: 'Connect with Nigerian payment providers, logistics APIs, accounting software, and custom integrations.',
        highlights: ['Paystack', 'Flutterwave', 'Webhook APIs', 'Custom integrations'],
      },
    ]
  }
]

const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string; gradient: string }> = {
  green: { bg: 'bg-green-600', bgLight: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-500 to-emerald-600' },
  blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-600' },
  purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500 to-violet-600' },
}

// Platform stats
const platformStats = [
  { value: '18+', label: 'Capabilities' },
  { value: '7', label: 'Industry Suites' },
  { value: '100%', label: 'Offline-Ready' },
  { value: '36', label: 'Nigerian States' },
]

export default function CapabilitiesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium mb-6">
              <Layers className="w-4 h-4" />
              Platform Capabilities
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              18+ Capabilities.
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Activate What You Need.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Every capability listed here is built, tested, and ready to deploy. Organizations activate only what they need, when they need it. No waiting, no roadmaps—just working software.
            </p>

            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-10">
              <Check className="w-4 h-4 text-green-400" />
              <span>All capabilities are production-ready and available for activation</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup-v2"
                className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                data-testid="capabilities-cta-get-started"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/suites"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
              >
                View Suites
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {platformStats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Capabilities Work */}
      <section className="py-16 bg-green-50 border-b border-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How Capabilities Work</h2>
            <p className="text-gray-600">
              WebWaka is a modular platform. Every organization starts with core infrastructure and activates additional capabilities based on their specific needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-green-200">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Your Suite</h3>
              <p className="text-gray-600 text-sm">Select Commerce, Education, Health, or any industry suite that fits your organization.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-green-200">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Activate Capabilities</h3>
              <p className="text-gray-600 text-sm">Turn on only the capabilities you need. Add more as your organization grows.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-green-200">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start Operating</h3>
              <p className="text-gray-600 text-sm">Each capability is immediately available. No setup delays, no waiting periods.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capability Groups */}
      {capabilityGroups.map((group) => {
        const colors = colorClasses[group.color]
        return (
          <section key={group.id} id={group.id} className="py-20 md:py-24 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Group Header */}
              <div className="mb-12">
                <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bgLight} rounded-full ${colors.text} text-sm font-semibold mb-4`}>
                  <Zap className="w-4 h-4" />
                  {group.name}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{group.name}</h2>
                <p className="text-lg text-gray-600 max-w-3xl">{group.description}</p>
              </div>

              {/* Capabilities Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.capabilities.map((capability) => (
                  <div 
                    key={capability.key}
                    className={`bg-white rounded-2xl p-6 border-2 ${colors.border} hover:shadow-xl transition-all`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bgLight} flex items-center justify-center flex-shrink-0`}>
                        <capability.icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{capability.name}</h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{capability.description}</p>
                    
                    <div className="space-y-2">
                      {capability.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-center gap-2 text-sm">
                          <Check className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                          <span className="text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* Core Platform Infrastructure */}
      <section className="py-20 md:py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-4">
              <Settings className="w-4 h-4" />
              Platform Foundation
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Every Capability Includes</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              All capabilities are built on WebWaka&apos;s core infrastructure, ensuring consistency, security, and reliability across your entire organization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, name: 'Enterprise Security', description: 'Bank-grade encryption, RBAC, audit logs' },
              { icon: Wifi, name: 'Offline-First', description: 'Works without internet, syncs when online' },
              { icon: Smartphone, name: 'Mobile-First', description: 'Optimized for phones and tablets' },
              { icon: Database, name: 'Multi-Tenant', description: 'Isolated data per organization' },
              { icon: Globe, name: 'Nigeria-First', description: 'Built for Nigerian business realities' },
              { icon: TrendingUp, name: 'Scalable', description: 'Grows with your organization' },
              { icon: RefreshCw, name: 'Real-Time Sync', description: 'Instant updates across devices' },
              { icon: Shield, name: 'Compliance Ready', description: 'VAT, FIRS, and regulatory support' },
            ].map((feature) => (
              <div key={feature.name} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <feature.icon className="w-6 h-6 text-green-400 mb-3" />
                <h4 className="font-semibold text-white mb-1">{feature.name}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suite Composition */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Suites Are Composed</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each WebWaka Suite is a pre-configured combination of capabilities tailored for a specific industry. You can always add more capabilities based on your needs.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Capability</th>
                  <th className="text-center py-4 px-2 font-semibold text-green-600">Commerce</th>
                  <th className="text-center py-4 px-2 font-semibold text-blue-600">Education</th>
                  <th className="text-center py-4 px-2 font-semibold text-red-600">Health</th>
                  <th className="text-center py-4 px-2 font-semibold text-purple-600">Civic</th>
                  <th className="text-center py-4 px-2 font-semibold text-amber-600">Hospitality</th>
                  <th className="text-center py-4 px-2 font-semibold text-orange-600">Logistics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'Point of Sale', commerce: true, education: false, health: true, civic: false, hospitality: true, logistics: false },
                  { name: 'Inventory', commerce: true, education: false, health: true, civic: false, hospitality: true, logistics: true },
                  { name: 'Accounting', commerce: true, education: true, health: true, civic: true, hospitality: true, logistics: true },
                  { name: 'CRM', commerce: true, education: true, health: true, civic: true, hospitality: true, logistics: true },
                  { name: 'Payments', commerce: true, education: true, health: true, civic: true, hospitality: true, logistics: true },
                  { name: 'Analytics', commerce: true, education: true, health: true, civic: true, hospitality: true, logistics: true },
                  { name: 'Online Store', commerce: true, education: false, health: false, civic: false, hospitality: true, logistics: false },
                  { name: 'Logistics', commerce: true, education: false, health: false, civic: false, hospitality: false, logistics: true },
                  { name: 'HR & Payroll', commerce: true, education: true, health: true, civic: false, hospitality: true, logistics: true },
                  { name: 'B2B/Wholesale', commerce: true, education: false, health: false, civic: false, hospitality: false, logistics: true },
                  { name: 'Marketing', commerce: true, education: true, health: true, civic: true, hospitality: true, logistics: true },
                  { name: 'Compliance', commerce: true, education: true, health: true, civic: true, hospitality: true, logistics: true },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{row.name}</td>
                    <td className="py-3 px-2 text-center">{row.commerce ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.education ? <Check className="w-5 h-5 text-blue-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.health ? <Check className="w-5 h-5 text-red-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.civic ? <Check className="w-5 h-5 text-purple-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.hospitality ? <Check className="w-5 h-5 text-amber-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.logistics ? <Check className="w-5 h-5 text-orange-500 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-center text-gray-500 text-sm mt-6">
            <Zap className="w-4 h-4 inline mr-1" />
            Additional capabilities can be activated for any suite based on organizational needs
          </p>
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            For Partners
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Sell Every Capability
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            As a WebWaka Partner, you can resell and deploy any combination of capabilities for your clients. 
            All 18+ capabilities are available in your portfolio—configure solutions that match each client&apos;s unique needs.
          </p>
          <Link 
            href="/partners"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
          >
            Become a Partner
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Explore?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            Start with the capabilities you need today. Add more as your organization grows. 
            No software bloat, no unused features—just what you need.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup-v2"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-green-500/30 hover:bg-green-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
