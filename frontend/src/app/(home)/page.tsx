/**
 * WebWaka Homepage — Phase M2 Marketing Update
 * 
 * POSITIONING: Partner-First Platform Infrastructure
 * WebWaka is infrastructure that Partners build on, not an app to sell to end users.
 * 
 * PRIMARY AUDIENCE: Digital agencies, ICT vendors, business consultants, entrepreneurs
 * SECONDARY: Organizations seeking digital transformation (directed to Partners)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Shield, Zap,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck, Users,
  Wifi, Smartphone, Building2, ChevronDown, ChevronUp,
  Sparkles, Banknote, CreditCard, WifiOff, LayoutGrid,
  Briefcase, UserPlus, Lightbulb, ExternalLink
} from 'lucide-react'
import { suites as allSuites } from '@/lib/marketing/suites-data'
import { WhatsAppFAB } from '@/components/marketing/WhatsAppFAB'
import { StickyBottomBar } from '@/components/marketing/StickyBottomBar'

export default function HomePage() {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category)
  }

  const suiteCategories = [
    {
      id: 'commerce',
      name: 'Commerce Suites',
      description: 'POS systems, online stores, marketplaces, hospitality management, logistics and delivery. For businesses that sell.',
      icon: Store,
      suites: allSuites.filter(s => s.category === 'commerce'),
    },
    {
      id: 'service',
      name: 'Service Suites',
      description: 'Schools, clinics, law firms, recruitment agencies, property managers. For businesses that serve.',
      icon: Briefcase,
      suites: allSuites.filter(s => s.category === 'service'),
    },
    {
      id: 'community',
      name: 'Community Suites',
      description: 'Churches, political campaigns, associations, community organizations. For groups that gather.',
      icon: Users,
      suites: allSuites.filter(s => s.category === 'community'),
    },
    {
      id: 'operations',
      name: 'Operations Suites',
      description: 'Project management, HR, warehousing, procurement. For teams that execute.',
      icon: LayoutGrid,
      suites: allSuites.filter(s => s.category === 'operations'),
    },
  ]

  const stats = [
    { value: '20+', label: 'Industry Suites' },
    { value: '300+', label: 'Built-in Capabilities' },
    { value: '16', label: 'Demo Businesses' },
    { value: '₦0', label: 'Development Cost' },
  ]

  const partnerRoles = [
    { label: 'Find and close clients', webbwakaRole: 'Provide proven platform' },
    { label: 'Set your own pricing', webbwakaRole: 'Handle infrastructure' },
    { label: 'Deliver and support', webbwakaRole: 'Keep systems running' },
    { label: 'Build recurring revenue', webbwakaRole: 'Add new capabilities' },
  ]

  const nigeriaFirstFeatures = [
    { icon: Banknote, title: 'Naira-native', description: 'All pricing, invoicing, and reporting in ₦' },
    { icon: CreditCard, title: 'Local payments', description: 'Bank transfer, USSD, mobile money, POS' },
    { icon: Smartphone, title: 'Mobile-first', description: 'Designed for smartphone-primary users' },
    { icon: WifiOff, title: 'Offline-ready', description: 'Works when connectivity is poor' },
  ]

  const partnerProfiles = [
    { 
      icon: Building2, 
      title: 'Digital Agencies', 
      description: 'You already build solutions for clients. Now you can deliver complete business platforms without the development overhead.',
    },
    { 
      icon: Wifi, 
      title: 'ICT Vendors', 
      description: 'You sell hardware and networking. Add software to your offering and create recurring revenue from every client.',
    },
    { 
      icon: Lightbulb, 
      title: 'Business Consultants', 
      description: 'You advise businesses on operations. Now you can implement those recommendations with real tools.',
    },
    { 
      icon: UserPlus, 
      title: 'Entrepreneurs', 
      description: 'You see opportunity in the SME market. WebWaka lets you start a SaaS business without building software.',
    },
  ]

  const navLinks = [
    { href: '/platform', label: 'Platform' },
    { href: '/suites', label: 'Suites' },
    { href: '/sites-and-funnels', label: 'Sites & Funnels' },
    { href: '/demo', label: 'Demo' },
    { href: '/partners', label: 'Partners' },
    { href: '/about', label: 'About' },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top Bar - Partner Focus */}
      <div className="bg-slate-900 text-white text-base py-2 hidden sm:block">
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
                  className="text-slate-600 hover:text-emerald-600 font-medium transition-colors text-base"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/login-v2" 
                className="px-4 py-2 text-slate-700 font-medium hover:text-emerald-600 transition-colors text-base"
                data-testid="nav-login"
              >
                Partner Login
              </Link>
              <Link 
                href="/partners/get-started" 
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-base"
                data-testid="nav-become-partner"
              >
                Become a Partner
              </Link>
            </div>

            {/* Mobile CTA */}
            <Link 
              href="/partners/get-started"
              className="md:hidden px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-base"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-base font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Platform Infrastructure for Partners
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Build Your Own SaaS Business
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                on Africa&apos;s Most Complete Platform
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
              20+ industry suites. Proven infrastructure. Your clients, your pricing, your brand.
              Deploy complete business platforms in days, not months.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                data-testid="hero-cta-become-partner"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/demo"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
                data-testid="hero-cta-demo"
              >
                See It Working
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-base">
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

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* SECTION 1: THE PARTNER MODEL */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-base font-medium mb-4">
              <Users className="w-4 h-4" />
              The Partner Model
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              You Build the Business. We Provide the Platform.
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              WebWaka is not software you buy. It&apos;s infrastructure you build on.
              We never sell directly to businesses. Instead, we partner with digital agencies, 
              ICT vendors, consultants, and entrepreneurs who want to deliver complete business platforms to their clients.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-slate-700 text-center mb-8">
              You own the client relationship. You set the pricing. You provide the support. 
              We give you 20+ ready-to-deploy industry suites, a website and funnel builder, 
              and the infrastructure that makes it all work.
            </p>
            <p className="text-xl font-semibold text-emerald-600 text-center">
              Your clients see your brand. Not ours.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-0 md:gap-8">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-4 text-center md:text-left">Your Role</h4>
                <ul className="space-y-3">
                  {partnerRoles.map((role, index) => (
                    <li key={index} className="flex items-center gap-3 text-base text-slate-700">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {role.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 md:mt-0">
                <h4 className="text-base font-bold text-slate-900 mb-4 text-center md:text-left">WebWaka&apos;s Role</h4>
                <ul className="space-y-3">
                  {partnerRoles.map((role, index) => (
                    <li key={index} className="flex items-center gap-3 text-base text-slate-700">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {role.webbwakaRole}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PLATFORM STATS */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Everything Your Clients Need. Already Built.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <p className="text-slate-400 text-base">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-center text-base max-w-2xl mx-auto">
            Every suite comes with APIs, database schemas, user interfaces, and Nigerian context built in.
            No coding required. Configure. Deploy. Earn.
          </p>
        </div>
      </section>

      {/* SECTION 3: SUITE CATEGORIES */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-slate-700 text-base font-medium mb-4 shadow-sm">
              <Layers className="w-4 h-4" />
              Industry Suites
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              One Platform. Every Industry.
            </h2>
          </div>

          {/* Desktop: Cards Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {suiteCategories.map((category) => (
              <div 
                key={category.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-100">
                  <category.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{category.name}</h3>
                <p className="text-slate-600 text-base mb-4">{category.description}</p>
                <div className="text-base text-emerald-600 font-medium">
                  {category.suites.length} suites
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Accordion */}
          <div className="md:hidden space-y-3 mb-10">
            {suiteCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100">
                      <category.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{category.name}</h3>
                      <p className="text-base text-slate-500">{category.suites.length} suites</p>
                    </div>
                  </div>
                  {openCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {openCategory === category.id && (
                  <div className="px-4 pb-4">
                    <p className="text-base text-slate-600 mb-4">{category.description}</p>
                    <div className="space-y-2">
                      {category.suites.map((suite) => (
                        <div key={suite.id} className="flex items-center gap-2 text-base text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500" />
                          {suite.shortName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link 
              href="/suites"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-base"
            >
              Explore All Suites
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: SITES & FUNNELS HIGHLIGHT */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full text-amber-700 text-base font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                NEW CAPABILITY
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Build Websites and Funnels for Your Clients
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Most partners spend months building client websites. With WebWaka Sites &amp; Funnels, 
                you can launch professional websites and conversion funnels in hours.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Industry-specific templates ready to customize',
                  'AI-powered content generation',
                  'Built-in analytics and lead capture',
                  'Connect to any WebWaka suite',
                  'Your domain, your branding, your client',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-base text-slate-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="text-lg font-semibold text-slate-900 mb-8">
                This is what separates WebWaka from basic software reselling.
              </p>

              <Link 
                href="/sites-funnels-suite"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-base"
              >
                Learn About Sites &amp; Funnels
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Client Website</h4>
                    <p className="text-base text-slate-500">yourclients.com</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                  <div className="h-3 bg-slate-100 rounded-full w-4/5"></div>
                  <div className="h-3 bg-slate-100 rounded-full w-3/5"></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium text-base">
                <ExternalLink className="w-4 h-4" />
                Built with WebWaka Sites &amp; Funnels
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: NIGERIA-FIRST */}
      <section className="py-20 md:py-28 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-base font-medium mb-4">
              <Banknote className="w-4 h-4" />
              Nigeria-First
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Built for How Nigerians Do Business
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              WebWaka isn&apos;t adapted for Nigeria. It was built here.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {nigeriaFirstFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-100">
                  <feature.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-base">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto text-center">
            <p className="text-base text-slate-700">
              Nigerian examples. Lagos addresses. Local names. Real context.
              <br />
              <strong className="text-slate-900">No currency conversion headaches. No USD billing surprises. 
              Just software that works the way your clients expect.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: PARTNER PROFILES */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-base font-medium mb-4">
              <Users className="w-4 h-4" />
              Who This Is For
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Is WebWaka Right for You?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {partnerProfiles.map((profile) => (
              <div key={profile.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-100">
                  <profile.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{profile.title}</h3>
                <p className="text-slate-600 text-base">{profile.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-100 rounded-xl p-6 max-w-2xl mx-auto">
            <h4 className="font-bold text-slate-900 mb-3 text-base">Not For:</h4>
            <ul className="space-y-2 text-base text-slate-600">
              <li>• Businesses looking for software to use themselves (we don&apos;t sell direct)</li>
              <li>• Developers who want to build from scratch (we provide ready platforms)</li>
              <li>• Companies outside Nigeria/Africa (our context is local)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 7: DEMO ACCESS */}
      <section className="py-20 md:py-28 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            See It Working Before You Commit
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            We&apos;ve built 16 demo businesses across every industry. Schools with students. 
            Clinics with patients. Churches with members. Real data, real workflows, guided walkthroughs.
          </p>
          <p className="text-slate-400 mb-10 text-base">
            No signup required. Just click and explore.
          </p>
          <Link 
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all"
          >
            Enter Demo Portal
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build Your Platform Business?
          </h2>
          <p className="text-lg text-emerald-100 mb-10">
            Join the partners who are transforming Nigerian businesses with WebWaka. 
            We&apos;ll show you how it works and help you get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a 
              href="https://wa.me/2349135003000?text=Hello%2C%20I%20am%20interested%20in%20becoming%20a%20WebWaka%20Partner."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-lg text-lg transition-all flex items-center justify-center gap-2"
            >
              Chat on WhatsApp
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Apply to Partner
            </Link>
          </div>
          <p className="text-emerald-200 text-base">
            No commitment required. Start with a conversation.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Platform */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Platform</h4>
              <ul className="space-y-3 text-slate-400 text-base">
                <li><Link href="/platform" className="hover:text-emerald-400 transition-colors">Why WebWaka</Link></li>
                <li><Link href="/suites" className="hover:text-emerald-400 transition-colors">All Suites</Link></li>
                <li><Link href="/sites-funnels-suite" className="hover:text-emerald-400 transition-colors">Sites &amp; Funnels</Link></li>
                <li><Link href="/demo" className="hover:text-emerald-400 transition-colors">Demo Portal</Link></li>
              </ul>
            </div>

            {/* Partners */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Partners</h4>
              <ul className="space-y-3 text-slate-400 text-base">
                <li><Link href="/partners" className="hover:text-emerald-400 transition-colors">Partner Program</Link></li>
                <li><Link href="/partners/get-started" className="hover:text-emerald-400 transition-colors">Become a Partner</Link></li>
                <li><Link href="/partners/playbook" className="hover:text-emerald-400 transition-colors">Partner Resources</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Company</h4>
              <ul className="space-y-3 text-slate-400 text-base">
                <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Contact</h4>
              <ul className="space-y-3 text-slate-400 text-base">
                <li>
                  <a 
                    href="https://wa.me/2349135003000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    +234 913 500 3000
                  </a>
                </li>
                <li>
                  <a href="mailto:partners@webwaka.com" className="hover:text-emerald-400 transition-colors">
                    partners@webwaka.com
                  </a>
                </li>
                <li className="text-sm pt-2">
                  Millennium Builders Plaza,<br />
                  Herbert Macaulay Way,<br />
                  Central Business District, Abuja
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">WebWaka</span>
            </div>
            <p className="text-slate-400 text-base">
              © 2026 HandyLife Digital. Built in Lagos.
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <WhatsAppFAB />

      {/* Sticky Bottom Bar (Mobile) */}
      <StickyBottomBar 
        primaryLabel="Become a Partner"
        primaryHref="/partners/get-started"
        secondaryLabel="Enter Demo"
        secondaryHref="/demo"
      />
    </div>
  )
}
