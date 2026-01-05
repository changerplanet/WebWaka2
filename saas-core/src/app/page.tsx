/**
 * WebWaka Homepage
 * The primary entry point for the WebWaka Platform
 * 
 * Positioning: Multi-industry digital infrastructure for African organizations
 * NOT: A POS product, marketplace, or app
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Shield, Zap,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck, Users,
  Wifi, Smartphone, Lock, Clock, Phone, Mail, Menu, Package
} from 'lucide-react'

export const metadata = {
  title: 'WebWaka Platform — Digital Infrastructure for African Organizations',
  description: 'Empowering businesses, schools, clinics, and communities across Africa with modular digital solutions. Powered by HandyLife Digital.',
}

// Suites data - all suites are available platform configurations
const suites = [
  {
    id: 'commerce',
    name: 'Commerce Suite',
    icon: Store,
    description: 'POS, inventory, online store, marketplace',
    color: 'green',
  },
  {
    id: 'education',
    name: 'Education Suite',
    icon: GraduationCap,
    description: 'School management, grading, fees',
    color: 'blue',
  },
  {
    id: 'health',
    name: 'Health Suite',
    icon: Heart,
    description: 'Clinic, pharmacy, patient records',
    color: 'red',
  },
  {
    id: 'civic',
    name: 'Civic Suite',
    icon: Landmark,
    description: 'Community finance, member management',
    color: 'purple',
  },
  {
    id: 'hospitality',
    name: 'Hospitality Suite',
    icon: Hotel,
    description: 'Hotels, restaurants, events',
    color: 'amber',
  },
  {
    id: 'logistics',
    name: 'Logistics Suite',
    icon: Truck,
    description: 'Fleet, delivery, fulfillment',
    color: 'orange',
  },
]

const platformBenefits = [
  { icon: Wifi, title: 'Works Offline', description: 'Reliable even when network is poor' },
  { icon: Smartphone, title: 'Mobile-First', description: 'Designed for phones and tablets' },
  { icon: Lock, title: 'Secure & Private', description: 'Your data stays yours' },
  { icon: Clock, title: 'Quick Setup', description: 'Get started in minutes' },
]

const stats = [
  { value: '7', label: 'Industry Suites' },
  { value: '18+', label: 'Capabilities' },
  { value: '36', label: 'Nigerian States' },
  { value: '99.9%', label: 'Uptime' },
]

const navLinks = [
  { href: '/platform', label: 'Platform' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/suites', label: 'Suites' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/partners', label: 'Partners' },
  { href: '/about', label: 'About' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-2 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p>Digital Infrastructure for African Organizations</p>
          <div className="flex items-center gap-4">
            <a href="tel:+2348000000000" className="flex items-center gap-1 hover:text-green-400 transition-colors">
              <Phone className="w-3 h-3" />
              +234 800 000 0000
            </a>
            <a href="mailto:hello@webwaka.com" className="flex items-center gap-1 hover:text-green-400 transition-colors">
              <Mail className="w-3 h-3" />
              hello@webwaka.com
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">WebWaka</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-gray-600 hover:text-green-600 font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/login-v2" 
                className="px-4 py-2 text-gray-700 font-medium hover:text-green-600 transition-colors"
                data-testid="nav-login"
              >
                Log in
              </Link>
              <Link 
                href="/signup-v2" 
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                data-testid="nav-get-started"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile CTA */}
            <Link 
              href="/signup-v2"
              className="md:hidden px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium mb-8">
              <Globe className="w-4 h-4" />
              Powered by HandyLife Digital
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Digital Infrastructure for
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                African Organizations
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              One platform. Many industries. Build, manage, and grow your business, school, clinic, or community organization with modular digital tools designed for Africa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link 
                href="/signup-v2"
                className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                data-testid="hero-cta-get-started"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/platform"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
                data-testid="hero-cta-explore"
              >
                Explore Platform
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Activate only what you need
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

      {/* Suites Section - Equal First-Class Treatment */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium mb-4">
              <Layers className="w-4 h-4" />
              WebWaka Suites
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              One Platform, Many Industries
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the suite that fits your organization. Each suite is configured based on your needs and delivered through our partner network. Activate only what you need.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suites.map((suite) => (
              <div 
                key={suite.id}
                className="relative bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-green-300 transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-green-100">
                  <suite.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{suite.name}</h3>
                <p className="text-gray-600 text-sm">{suite.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              href="/suites"
              className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
            >
              Explore all suites
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for African Realities
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                WebWaka is designed from the ground up for the unique challenges and opportunities of operating in Africa. Offline-first, mobile-first, and always reliable.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {platformBenefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link 
                  href="/platform"
                  className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
                >
                  Learn more about the platform
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-semibold">WebWaka Platform</p>
                  <p className="text-gray-400 text-sm">Digital Infrastructure for Africa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner & Impact Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Partners Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Partner With Us</h3>
              <p className="text-gray-600 mb-6">
                Join our network of Digital Transformation Partners. Resell, onboard, and support organizations in your community while earning commissions.
              </p>
              <Link 
                href="/partners"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                data-testid="cta-become-partner"
              >
                Become a Partner
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Impact Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Social Impact</h3>
              <p className="text-gray-600 mb-6">
                WebWaka is powered by HandyLife Digital, a social enterprise committed to building inclusive digital infrastructure for African communities.
              </p>
              <Link 
                href="/impact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
              >
                Learn About Our Impact
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Highlight Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-4">
              <Layers className="w-4 h-4" />
              18+ Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Operate
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From point-of-sale to AI automation, every capability is built, tested, and ready to activate. No roadmaps, no waiting—just working software.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {[
              { icon: Store, label: 'POS & Retail' },
              { icon: Package, label: 'Inventory' },
              { icon: Users, label: 'CRM' },
              { icon: Truck, label: 'Logistics' },
              { icon: Shield, label: 'Compliance' },
              { icon: Zap, label: 'AI & Automation' },
            ].map((cap) => (
              <div key={cap.label} className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-green-300 hover:shadow-md transition-all">
                <cap.icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">{cap.label}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              'Accounting & Finance',
              'HR & Payroll', 
              'B2B & Wholesale',
              'Marketing Automation',
              'Payments & Wallets',
              'Procurement',
              'Analytics & BI',
              'Subscriptions',
              'Multi-Vendor Marketplace',
              'Online Store',
              'Partner Platform',
              'Integrations Hub',
            ].map((cap) => (
              <div key={cap} className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{cap}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link 
              href="/capabilities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
              data-testid="cta-explore-capabilities"
            >
              Explore All Capabilities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Organization?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            Join thousands of organizations across Africa using WebWaka. 
            Start with what you need. Grow at your own pace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup-v2"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
              data-testid="cta-final-get-started"
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Company */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">WebWaka</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Digital infrastructure for African organizations.
              </p>
              <p className="text-gray-500 text-xs">
                Powered by HandyLife Digital
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/platform" className="hover:text-green-400 transition-colors">Overview</Link></li>
                <li><Link href="/capabilities" className="hover:text-green-400 transition-colors">Capabilities</Link></li>
                <li><Link href="/suites" className="hover:text-green-400 transition-colors">Suites</Link></li>
                <li><Link href="/solutions" className="hover:text-green-400 transition-colors">Solutions</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="/partners" className="hover:text-green-400 transition-colors">Partners</Link></li>
                <li><Link href="/impact" className="hover:text-green-400 transition-colors">Impact</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
                <li><Link href="/login-v2" className="hover:text-green-400 transition-colors">Log In</Link></li>
                <li><Link href="/signup-v2" className="hover:text-green-400 transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Get in Touch</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <a href="mailto:hello@webwaka.com" className="hover:text-green-400 transition-colors">
                    hello@webwaka.com
                  </a>
                </li>
                <li>
                  <a href="tel:+2348000000000" className="hover:text-green-400 transition-colors">
                    +234 800 000 0000
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} WebWaka. Powered by HandyLife Digital. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <Link href="/privacy" className="hover:text-green-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-green-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
