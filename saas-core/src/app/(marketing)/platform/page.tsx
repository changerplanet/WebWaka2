/**
 * WebWaka Platform Page
 * Core platform capabilities, technology, and architecture
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Shield, Zap,
  Wifi, WifiOff, Smartphone, Lock, Clock, Server,
  Database, Cloud, RefreshCw, Settings, Users, BarChart3
} from 'lucide-react'

export const metadata = {
  title: 'Platform — WebWaka',
  description: 'Discover the WebWaka Platform: modular, offline-first, mobile-first digital infrastructure designed for African organizations.',
}

const coreCapabilities = [
  {
    icon: Layers,
    title: 'Modular Architecture',
    description: 'Activate only what you need. Add capabilities as you grow. No bloated software, no unused features.',
  },
  {
    icon: WifiOff,
    title: 'Offline-First Design',
    description: 'Works reliably even with poor or no internet connection. Sync automatically when you are back online.',
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
    description: 'Manage multiple locations, branches, or organizations from a single platform with isolated data.',
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
      { icon: Layers, name: 'Extensible', description: 'Build custom modules on our platform' },
    ]
  },
]

const suiteIntegration = [
  'User & access management across all suites',
  'Unified billing and subscription handling',
  'Cross-suite analytics and reporting',
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              WebWaka Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Built Different.
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Built for Africa.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              A modular, offline-first platform designed from the ground up for the unique challenges and opportunities of operating in Africa.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup-v2"
                className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                data-testid="platform-cta-get-started"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/suites"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
              >
                Explore Suites
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
              Every WebWaka suite is built on these foundational capabilities, ensuring consistency, reliability, and security across your entire organization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreCapabilities.map((capability) => (
              <div 
                key={capability.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <capability.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{capability.title}</h3>
                <p className="text-gray-600">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How WebWaka Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get up and running in minutes. Grow at your own pace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sign Up</h3>
              <p className="text-gray-600">
                Create your account with just your phone number. No credit card, no commitment.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Your Suite</h3>
              <p className="text-gray-600">
                Select the suite that fits your organization. Activate only the capabilities you need.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Start Operating</h3>
              <p className="text-gray-600">
                Begin using WebWaka immediately. Add more capabilities as your needs evolve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Suite Integration */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                One Platform. Unified Experience.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                All WebWaka suites share common infrastructure, ensuring seamless data flow and consistent user experience across your entire organization.
              </p>

              <div className="space-y-4">
                {suiteIntegration.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <Link 
                  href="/capabilities"
                  className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
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
                  { name: 'Education', icon: '🎓', active: false },
                  { name: 'Health', icon: '❤️', active: false },
                  { name: 'Civic', icon: '🏛️', active: false },
                  { name: 'Hospitality', icon: '🏨', active: false },
                  { name: 'Logistics', icon: '🚚', active: false },
                ].map((suite) => (
                  <div 
                    key={suite.name}
                    className={`rounded-xl p-4 text-center ${
                      suite.active 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">{suite.icon}</div>
                    <p className={`text-sm font-medium ${suite.active ? 'text-green-400' : 'text-gray-400'}`}>
                      {suite.name}
                    </p>
                    {suite.active && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/30 rounded text-xs text-green-300">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">WebWaka Platform Core</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Technology
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built on modern, scalable infrastructure trusted by organizations of all sizes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {technicalFeatures.map((section) => (
              <div key={section.category} className="bg-white rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{section.category}</h3>
                <div className="space-y-6">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-gray-600" />
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
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            Join thousands of organizations across Africa using WebWaka. 
            Start free, grow at your own pace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup-v2"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-green-500/30 hover:bg-green-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
