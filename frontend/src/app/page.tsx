/**
 * WebWaka Homepage
 * 
 * POSITIONING: Partner-First Platform Infrastructure
 * WebWaka is infrastructure that Partners build on, not an app to sell to end users.
 * 
 * PRIMARY AUDIENCE: Partners (agencies, consultants, IT vendors)
 * SECONDARY: Organizations seeking digital transformation (directed to Partners)
 * 
 * Phase 4 Alignment: Partner-as-Platform Operator
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Shield, Zap,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck, Users,
  Wifi, Smartphone, Lock, Building2, Phone, Mail, 
  Package, Briefcase, TrendingUp, Target, Sparkles
} from 'lucide-react'

export const metadata = {
  title: 'WebWaka — Platform Infrastructure for Digital Transformation Partners',
  description: 'Build and operate your own SaaS platforms on WebWaka infrastructure. Multi-industry, multi-tenant, white-label ready. Powered by HandyLife Digital.',
}

// All suites are ACTIVE and AVAILABLE - configured by Partners for their clients
const suites = [
  {
    id: 'commerce',
    name: 'Commerce Suite',
    icon: Store,
    description: 'POS, inventory, marketplace, online store',
  },
  {
    id: 'education',
    name: 'Education Suite',
    icon: GraduationCap,
    description: 'School management, grading, fees, LMS',
  },
  {
    id: 'health',
    name: 'Health Suite',
    icon: Heart,
    description: 'Clinic, pharmacy, patient records, billing',
  },
  {
    id: 'civic',
    name: 'Civic Suite',
    icon: Landmark,
    description: 'Community finance, cooperatives, associations',
  },
  {
    id: 'hospitality',
    name: 'Hospitality Suite',
    icon: Hotel,
    description: 'Hotels, restaurants, events, reservations',
  },
  {
    id: 'logistics',
    name: 'Logistics Suite',
    icon: Truck,
    description: 'Fleet, delivery, warehousing, fulfillment',
  },
]

const platformFeatures = [
  { icon: Wifi, title: 'Offline-First', description: 'Works reliably even with poor connectivity' },
  { icon: Smartphone, title: 'Mobile-First', description: 'Designed for phones, tablets, and any device' },
  { icon: Shield, title: 'Multi-Tenant', description: 'Isolated data, shared infrastructure' },
  { icon: Layers, title: 'Capability-Based', description: 'Activate only what each client needs' },
]

const partnerBenefits = [
  { icon: Building2, title: 'Build Your Own SaaS', description: 'Create branded platforms for your clients' },
  { icon: TrendingUp, title: 'Recurring Revenue', description: 'Monthly subscriptions, not one-off projects' },
  { icon: Target, title: 'Own Your Clients', description: 'Your brand, your pricing, your relationship' },
  { icon: Zap, title: 'Enterprise Infrastructure', description: 'We handle uptime, security, and scaling' },
]

const stats = [
  { value: '7', label: 'Industry Suites' },
  { value: '18+', label: 'Core Capabilities' },
  { value: '∞', label: 'Platform Instances' },
  { value: '99.9%', label: 'Infrastructure Uptime' },
]

const navLinks = [
  { href: '/platform', label: 'Platform' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/suites', label: 'Suites' },
  { href: '/partners', label: 'Partners' },
  { href: '/partners/playbook', label: 'Playbook' },
  { href: '/about', label: 'About' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar - Partner Focus */}
      <div className="bg-slate-900 text-white text-sm py-2 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-slate-300">Platform Infrastructure for Digital Transformation Partners</p>
          <div className="flex items-center gap-4">
            <Link href="/partners/playbook" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Read the Partner Playbook →
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">WebWaka</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons - PARTNER ONLY */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/login-v2" 
                className="px-4 py-2 text-slate-700 font-medium hover:text-emerald-600 transition-colors"
                data-testid="nav-login"
              >
                Partner Login
              </Link>
              <Link 
                href="/partners/get-started" 
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all"
                data-testid="nav-become-partner"
              >
                Become a Partner
              </Link>
            </div>

            {/* Mobile CTA */}
            <Link 
              href="/partners/get-started"
              className="md:hidden px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - PLATFORM FIRST, PARTNER AUDIENCE */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Platform Infrastructure for Partners
            </div>

            {/* Main Headline - PLATFORM FIRST */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Build Your Own SaaS Platforms
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                on WebWaka Infrastructure
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
              WebWaka is the platform you build on, not an app you resell. 
              Multi-industry, white-label, and ready for you to configure, brand, and deliver to your clients.
            </p>

            {/* CTA Buttons - PARTNER ONLY */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                data-testid="hero-cta-become-partner"
              >
                Become a WebWaka Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/platform"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
                data-testid="hero-cta-explore"
              >
                Explore the Platform
              </Link>
            </div>

            {/* Partner Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                White-label ready
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                Multi-industry by design
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                You own your clients
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* What is WebWaka Section - NEW MANDATORY */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
                <Globe className="w-4 h-4" />
                What is WebWaka?
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                The Platform for Building Platforms
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                WebWaka is digital infrastructure that Partners use to create, configure, and operate 
                custom platforms for their clients. It's not an app you resell—it's the foundation 
                you build your SaaS business on.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Capability-Based Architecture</h4>
                    <p className="text-slate-600 text-sm">Activate only what each client needs. POS, inventory, CRM, HR—mix and match from 18+ capabilities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Offline-First, Mobile-First</h4>
                    <p className="text-slate-600 text-sm">Built for African realities. Works even when network is unreliable.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Multi-Industry by Design</h4>
                    <p className="text-slate-600 text-sm">Commerce, education, health, civic, hospitality, logistics—one platform, many industries.</p>
                  </div>
                </div>
              </div>

              <Link 
                href="/platform"
                className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                Learn more about the platform
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-emerald-900 rounded-2xl p-8 shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                {platformFeatures.map((feature) => (
                  <div key={feature.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <feature.icon className="w-8 h-8 text-emerald-400 mb-3" />
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suites Section - ALL ACTIVE, PARTNER-DELIVERED */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-slate-700 text-sm font-medium mb-4 shadow-sm">
              <Layers className="w-4 h-4" />
              Industry Suites
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Multi-Industry Platform Configurations
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Every suite is <strong>active and configurable</strong>. Partners select, configure, and deliver 
              the right combination for each client's organizational needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {suites.map((suite) => (
              <div 
                key={suite.id}
                className="relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <suite.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{suite.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{suite.description}</p>
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Available for configuration
                </div>
              </div>
            ))}
          </div>

          <div className="text-center bg-white rounded-xl p-6 border border-slate-200 max-w-2xl mx-auto">
            <p className="text-slate-600 mb-0">
              <strong className="text-slate-800">Configured based on organizational needs.</strong>
              <br />
              <span className="text-sm">Delivered by certified WebWaka Partners.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Partner Model Section - MANDATORY */}
      <section className="py-20 md:py-28 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-emerald-100 text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              The WebWaka Partner Model
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Partners Are Platform Operators
            </h2>
            <p className="text-lg text-emerald-100 max-w-3xl mx-auto">
              WebWaka doesn't sell directly to end users. Partners create and operate client platforms.
              Partners own branding, pricing, and support. WebWaka provides infrastructure only.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {partnerBenefits.map((benefit) => (
              <div key={benefit.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <benefit.icon className="w-10 h-10 text-emerald-300 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-emerald-100 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Partners Create</h4>
                <p className="text-slate-600 text-sm">Client organizations and platform instances</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Partners Own</h4>
                <p className="text-slate-600 text-sm">Branding, pricing, and client relationships</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">WebWaka Provides</h4>
                <p className="text-slate-600 text-sm">Infrastructure, security, and uptime</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link 
              href="/partners/playbook"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-lg text-lg transition-all hover:bg-emerald-50"
              data-testid="cta-read-playbook"
            >
              Read the Partner Playbook
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <p className="text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Impact Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
                <Globe className="w-4 h-4" />
                Social Impact
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Digital Transformation for All
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                WebWaka is powered by <strong>HandyLife Digital</strong>, a social enterprise committed to 
                building inclusive digital infrastructure across Africa. When you partner with WebWaka, 
                you're part of something bigger.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Job Creation</h4>
                    <p className="text-slate-600 text-sm">Every Partner creates jobs—for themselves and their communities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Local Empowerment</h4>
                    <p className="text-slate-600 text-sm">Partners serve their own communities with deep local knowledge</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Economic Inclusion</h4>
                    <p className="text-slate-600 text-sm">Bringing enterprise-grade tools to every organization, not just the largest</p>
                  </div>
                </div>
              </div>

              <Link 
                href="/impact"
                className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Learn about our impact
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">HandyLife Digital</h3>
                <p className="text-slate-600 mb-6">Building Africa's digital infrastructure, one partner at a time.</p>
                <div className="text-left bg-white rounded-xl p-6 border border-purple-100">
                  <p className="text-slate-600 italic">
                    "We believe every African organization deserves access to world-class digital tools. 
                    By empowering Partners, we scale impact across the continent."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - PARTNER ONLY */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 to-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build Your SaaS Business?
          </h2>
          <p className="text-lg md:text-xl text-slate-300 mb-10">
            Join the WebWaka Partner network. Build branded platforms, set your own pricing, 
            and create recurring revenue with enterprise-grade infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              data-testid="cta-final-become-partner"
            >
              Become a WebWaka Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - PARTNER ALIGNED */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Company */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">WebWaka</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Platform infrastructure for digital transformation partners.
              </p>
              <p className="text-slate-500 text-xs">
                Powered by HandyLife Digital
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/platform" className="hover:text-emerald-400 transition-colors">Overview</Link></li>
                <li><Link href="/capabilities" className="hover:text-emerald-400 transition-colors">Capabilities</Link></li>
                <li><Link href="/suites" className="hover:text-emerald-400 transition-colors">Industry Suites</Link></li>
              </ul>
            </div>

            {/* Partners */}
            <div>
              <h4 className="font-semibold mb-4">Partners</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/partners" className="hover:text-emerald-400 transition-colors">Partner Program</Link></li>
                <li><Link href="/partners/playbook" className="hover:text-emerald-400 transition-colors">Partner Playbook</Link></li>
                <li><Link href="/partners/get-started" className="hover:text-emerald-400 transition-colors">Become a Partner</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link href="/impact" className="hover:text-emerald-400 transition-colors">Social Impact</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/login-v2" className="hover:text-emerald-400 transition-colors">Partner Login</Link></li>
                <li>
                  <a href="mailto:partners@webwaka.com" className="hover:text-emerald-400 transition-colors">
                    partners@webwaka.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} WebWaka. Powered by HandyLife Digital. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
