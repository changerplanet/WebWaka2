/**
 * WebWaka Capabilities Page
 * 
 * POSITIONING: Partner-Configured Platform Capabilities
 * Capabilities are modular features that Partners activate for their clients.
 * All capabilities are ACTIVE and AVAILABLE. No "coming soon" language.
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Layers, Zap,
  ShoppingCart, Package, Users, CreditCard, BarChart3,
  FileText, Calendar, MessageSquare, Bell, Settings,
  Shield, Database, Cloud, Smartphone, Wifi, Globe,
  Bot, Sparkles
} from 'lucide-react'

export const metadata = {
  title: 'Capabilities — WebWaka Platform',
  description: 'Explore 18+ modular capabilities that Partners activate for their clients. POS, inventory, CRM, billing, analytics, and more.',
}

const capabilityCategories = [
  {
    name: 'Commerce & Sales',
    description: 'Transaction processing, inventory, and customer management',
    capabilities: [
      { icon: ShoppingCart, name: 'Point of Sale', description: 'Fast, offline-capable transaction processing with receipt printing and payment integration' },
      { icon: Package, name: 'Inventory Management', description: 'Stock tracking, low-stock alerts, multi-location inventory, and supplier management' },
      { icon: CreditCard, name: 'Payment Processing', description: 'Multiple payment methods, Nigeria-first integrations, and reconciliation' },
      { icon: Users, name: 'Customer Management', description: 'CRM, customer profiles, purchase history, and loyalty programs' },
    ],
  },
  {
    name: 'Operations & Management',
    description: 'Day-to-day operational tools for organizations',
    capabilities: [
      { icon: Calendar, name: 'Scheduling & Booking', description: 'Appointments, reservations, resource allocation, and calendar management' },
      { icon: FileText, name: 'Document Management', description: 'File storage, templates, digital signatures, and document workflows' },
      { icon: Users, name: 'Staff Management', description: 'Employee records, attendance, roles & permissions, and performance tracking' },
      { icon: Settings, name: 'Workflow Automation', description: 'Custom workflows, triggers, and automated task management' },
    ],
  },
  {
    name: 'Finance & Reporting',
    description: 'Financial management and business intelligence',
    capabilities: [
      { icon: CreditCard, name: 'Billing & Invoicing', description: 'Invoice generation, recurring billing, payment tracking, and statements' },
      { icon: BarChart3, name: 'Analytics & Reports', description: 'Real-time dashboards, custom reports, and business intelligence' },
      { icon: FileText, name: 'Accounting Integration', description: 'Journal entries, chart of accounts, and accounting software sync' },
      { icon: Database, name: 'Financial Records', description: 'Transaction history, audit trails, and compliance reporting' },
    ],
  },
  {
    name: 'Communication & Engagement',
    description: 'Customer and stakeholder communication tools',
    capabilities: [
      { icon: MessageSquare, name: 'Messaging', description: 'SMS, email, and in-app messaging for customers and staff' },
      { icon: Bell, name: 'Notifications', description: 'Push notifications, alerts, and automated reminders' },
      { icon: Globe, name: 'Online Presence', description: 'Web storefronts, landing pages, and online booking portals' },
      { icon: Users, name: 'Community Features', description: 'Member portals, forums, and engagement tools' },
    ],
  },
  {
    name: 'AI & Automation',
    description: 'Intelligent features powered by machine learning',
    capabilities: [
      { icon: Bot, name: 'AI Assistant', description: 'Intelligent chat support, query handling, and recommendations' },
      { icon: Sparkles, name: 'Smart Insights', description: 'Predictive analytics, trend detection, and automated suggestions' },
      { icon: Zap, name: 'Process Automation', description: 'Rule-based automation, smart routing, and workflow optimization' },
      { icon: BarChart3, name: 'Forecasting', description: 'Demand prediction, inventory optimization, and financial projections' },
    ],
  },
]

const platformFoundation = [
  { icon: Shield, name: 'Enterprise Security', description: 'Bank-grade encryption, RBAC, and audit logging' },
  { icon: Wifi, name: 'Offline-First', description: 'Works without internet, syncs when connected' },
  { icon: Smartphone, name: 'Mobile-First', description: 'Optimized for phones and tablets' },
  { icon: Cloud, name: 'Cloud Infrastructure', description: '99.9% uptime, automatic scaling' },
  { icon: Database, name: 'Data Isolation', description: 'Multi-tenant with complete data separation' },
  { icon: Layers, name: 'Modular Architecture', description: 'Activate only what you need' },
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Layers className="w-4 h-4" />
              Platform Capabilities
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              18+ Modular
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Capabilities
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Partners activate only the capabilities each client needs. No bloated software, no unused features—just the right tools for each organization.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                data-testid="capabilities-cta-become-partner"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/suites"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
              >
                View Industry Suites
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-8 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 text-center">
            <Globe className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800">
              <strong>Partner-Configured:</strong> All capabilities are activated and managed by WebWaka Partners for their clients. 
              <Link href="/partners" className="ml-2 underline hover:no-underline">
                Learn about becoming a Partner →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Platform Foundation */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built on Enterprise Foundation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every capability runs on WebWaka&apos;s enterprise-grade infrastructure, ensuring security, reliability, and performance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFoundation.map((item) => (
              <div 
                key={item.name}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capability Categories */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Capability Catalog
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              All capabilities are available for Partners to activate based on client needs. Mix and match across categories.
            </p>
          </div>

          <div className="space-y-16">
            {capabilityCategories.map((category) => (
              <div key={category.name}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.capabilities.map((cap) => (
                    <div 
                      key={cap.name}
                      className="bg-white rounded-xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                        <cap.icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">{cap.name}</h4>
                      <p className="text-gray-600 text-sm mb-4">{cap.description}</p>
                      <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Available</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Partners Use Capabilities */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Partners Configure, Clients Use
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                WebWaka Partners activate the right capabilities for each client. Clients see only what they need—a clean, focused experience tailored to their organization.
              </p>

              <div className="space-y-4">
                {[
                  'Select industry suite as starting point',
                  'Add or remove capabilities based on client needs',
                  'Configure settings and workflows',
                  'Apply client branding and customization',
                  'Deploy and provide ongoing support',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-sm font-bold">{i + 1}</span>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link 
                  href="/partners/playbook"
                  className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Learn more in the Partner Playbook
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8">
              <h4 className="text-white font-semibold mb-6">Example: Retail Client Configuration</h4>
              <div className="space-y-3">
                {[
                  { name: 'Point of Sale', active: true },
                  { name: 'Inventory Management', active: true },
                  { name: 'Customer Management', active: true },
                  { name: 'Payment Processing', active: true },
                  { name: 'Analytics & Reports', active: true },
                  { name: 'Staff Management', active: false },
                  { name: 'Scheduling & Booking', active: false },
                  { name: 'Document Management', active: false },
                ].map((cap) => (
                  <div 
                    key={cap.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      cap.active ? 'bg-emerald-500/20' : 'bg-white/5'
                    }`}
                  >
                    <span className={cap.active ? 'text-white' : 'text-gray-500'}>{cap.name}</span>
                    <span className={`text-sm ${cap.active ? 'text-emerald-400' : 'text-gray-600'}`}>
                      {cap.active ? 'Active' : 'Not needed'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-6 text-center">
                Partner activates only what the client needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Deliver Powerful Capabilities to Your Clients
          </h2>
          <p className="text-lg md:text-xl text-emerald-100 mb-10">
            Join the WebWaka Partner network. Configure and deploy enterprise-grade capabilities with your own branding and pricing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners/playbook"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Read the Playbook
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
