/**
 * WebWaka Platform Page
 * 
 * POSITIONING: Partner-First Platform Infrastructure
 * This page explains what Partners build on - the core platform capabilities.
 * All CTAs direct to Partner funnel. No end-user signup.
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Shield, Zap,
  Wifi, WifiOff, Smartphone, Lock, Server,
  Database, Cloud, RefreshCw, Settings, Users
} from 'lucide-react'

export const metadata = {
  title: 'Platform — WebWaka',
  description: 'Discover the WebWaka Platform: modular, offline-first, multi-tenant infrastructure that Partners use to build and operate custom platforms for their clients.',
}

const coreCapabilities = [
  {
    icon: Layers,
    title: 'Modular Architecture',
    description: 'Partners activate only the capabilities each client needs. No bloated software, no unused features.',
  },
  {
    icon: WifiOff,
    title: 'Offline-First Design',
    description: 'Works reliably even with poor or no internet connection. Sync automatically when back online.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Experience',
    description: 'Designed for phones and tablets first. Works on any device, any screen size.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, role-based access control, and audit logging for complete peace of mind.',
  },
  {
    icon: Globe,
    title: 'Multi-Tenant Platform',
    description: 'Partners manage multiple client organizations from a single dashboard with isolated data.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Sync',
    description: 'Changes reflect instantly across all devices. Conflict resolution ensures data integrity.',
  },
]

const technicalFeatures = [
  {
    category: 'Infrastructure',
    items: [
      { icon: Cloud, name: 'Cloud-Native', description: 'Scalable, reliable cloud infrastructure' },
      { icon: Database, name: 'Secure Database', description: 'PostgreSQL with encryption at rest' },
      { icon: Server, name: '99.9% Uptime', description: 'High availability architecture' },
    ]
  },
  {
    category: 'Integration',
    items: [
      { icon: Settings, name: 'API Access', description: 'RESTful APIs for custom integrations' },
      { icon: RefreshCw, name: 'Webhooks', description: 'Real-time event notifications' },
      { icon: Layers, name: 'Extensible', description: 'Build custom modules on the platform' },
    ]
  },
]

const platformIntegration = [
  'User & access management across all capabilities',
  'Unified billing and subscription handling',
  'Cross-capability analytics and reporting',
  'Shared customer and contact database',
  'Integrated payment processing (Nigeria-first)',
  'Single sign-on (SSO) for all modules',
  '18+ capabilities ready to activate',
  'AI & Automation built-in',
]

export default function PlatformPage() {
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
              <Zap className="w-4 h-4" />
              WebWaka Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Infrastructure for
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Partner-Built Platforms
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              A modular, offline-first platform designed from the ground up for Partners to build, configure, and operate custom solutions for their clients.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                data-testid="platform-cta-become-partner"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/capabilities"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
              >
                Explore Capabilities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Platform Capabilities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every platform instance Partners create is built on these foundational capabilities, ensuring consistency, reliability, and security for their clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreCapabilities.map((capability) => (
              <div 
                key={capability.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <capability.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{capability.title}</h3>
                <p className="text-gray-600">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Partners Use It */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Partners Use WebWaka
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Partners create, configure, and operate client platforms on WebWaka infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Client Organization</h3>
              <p className="text-gray-600">
                Partners onboard a new client by creating their organization in the WebWaka Partner dashboard.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-emerald-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Configure Platform Instance</h3>
              <p className="text-gray-600">
                Select suite, activate capabilities, set up branding, and configure the platform for the client&apos;s needs.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-emerald-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Operate & Support</h3>
              <p className="text-gray-600">
                Partners own the client relationship, provide support, and manage billing. WebWaka handles infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integration */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                One Platform. Unified Experience.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                All capabilities share common infrastructure, ensuring seamless data flow and consistent user experience across every platform instance Partners create.
              </p>

              <div className="space-y-4">
                {platformIntegration.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <Link 
                  href="/capabilities"
                  className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Explore all 18+ capabilities
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <br />
                <Link 
                  href="/suites"
                  className="inline-flex items-center gap-2 text-gray-600 font-semibold hover:text-gray-800 transition-colors"
                >
                  View industry suites
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Commerce', icon: '🛒', active: true },
                  { name: 'Education', icon: '🎓', active: true },
                  { name: 'Health', icon: '❤️', active: true },
                  { name: 'Civic', icon: '🏛️', active: true },
                  { name: 'Hospitality', icon: '🏨', active: true },
                  { name: 'Logistics', icon: '🚚', active: true },
                ].map((suite) => (
                  <div 
                    key={suite.name}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                  >
                    <span className="text-3xl mb-2 block">{suite.icon}</span>
                    <span className="text-white font-medium text-sm">{suite.name}</span>
                    <span className="block text-emerald-400 text-xs mt-1">Available</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-center mt-6 text-sm">
                All suites configurable by Partners for their clients
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Infrastructure
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              WebWaka handles the hard stuff so Partners can focus on clients. Security, uptime, scaling — we&apos;ve got it covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {technicalFeatures.map((category) => (
              <div key={category.category} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{category.category}</h3>
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Build Your Platform Business on WebWaka
          </h2>
          <p className="text-lg md:text-xl text-emerald-100 mb-10">
            Join the Partner network. Create custom platforms for your clients with enterprise-grade infrastructure, white-label branding, and your own pricing.
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
