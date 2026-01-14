'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Store, Briefcase, Users, Settings, AlertTriangle, ArrowRight, 
  MessageCircle, Play, ChevronRight, Handshake, Building2, Calendar
} from 'lucide-react'
import { demoTenants } from '@/lib/marketing/suites-data'
import { DemoTenantCard } from '@/components/marketing/DemoTenantCard'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'all' as const, label: 'All Demos', icon: null },
  { id: 'commerce' as const, label: 'Commerce', icon: Store },
  { id: 'service' as const, label: 'Service', icon: Briefcase },
  { id: 'community' as const, label: 'Community', icon: Users },
  { id: 'operations' as const, label: 'Operations', icon: Settings },
]

const quickStartRoles = [
  { role: 'A retail business owner', demo: 'Lagos Retail Store', slug: 'demo-retail-store', startPoint: 'POS Dashboard' },
  { role: 'A school administrator', demo: 'Bright Future Academy', slug: 'demo-school', startPoint: 'Student List' },
  { role: 'A clinic manager', demo: 'HealthFirst Clinic', slug: 'demo-clinic', startPoint: 'Patient Records' },
  { role: 'A church administrator', demo: 'GraceLife Community Church', slug: 'demo-church', startPoint: 'Member Directory' },
  { role: 'A property manager', demo: 'Lagos Property Managers', slug: 'demo-real-estate', startPoint: 'Property List' },
  { role: 'A hotel manager', demo: 'PalmView Suites Lagos', slug: 'demo-hotel', startPoint: 'Reservations' },
  { role: 'A campaign coordinator', demo: 'Lagos Campaign HQ', slug: 'demo-political', startPoint: 'Volunteer List' },
]

export default function DemoPortalPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'commerce' | 'service' | 'community' | 'operations'>('all')

  const filteredTenants = activeCategory === 'all' 
    ? demoTenants 
    : demoTenants.filter(t => t.category === activeCategory)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-base font-medium mb-6">
              <Play className="w-4 h-4" />
              Demo Portal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              See WebWaka Working.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                No Signup Required.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              16 demo businesses. 20+ industry suites. Real workflows with Nigerian data. 
              Explore on your own or request a guided walkthrough.
            </p>

            <a 
              href="#demo-selector"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30"
            >
              Choose a Demo
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* What Is The Demo Portal */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Real Platforms. Real Data. Real Workflows.
            </h2>
            <p className="text-base md:text-lg text-gray-700 mb-8">
              We&apos;ve built 16 complete demo businesses to show you exactly how WebWaka works in the real world.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-left">
                <p className="text-base font-semibold text-gray-900 mb-1">Real data</p>
                <p className="text-sm text-gray-600">Nigerian names, Lagos addresses, Naira amounts</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-left">
                <p className="text-base font-semibold text-gray-900 mb-1">Complete workflows</p>
                <p className="text-sm text-gray-600">Not just screenshots, actual working systems</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-left">
                <p className="text-base font-semibold text-gray-900 mb-1">Multiple user roles</p>
                <p className="text-sm text-gray-600">See the platform from different perspectives</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-left">
                <p className="text-base font-semibold text-gray-900 mb-1">Industry context</p>
                <p className="text-sm text-gray-600">Each demo reflects how that industry operates</p>
              </div>
            </div>

            <p className="text-base font-medium text-gray-900 mt-8">
              This is not a marketing video. This is the actual platform.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Mode Warning */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Before You Dive In</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-base font-semibold text-gray-800 mb-2">What You&apos;ll See</p>
                    <ul className="text-base text-gray-700 space-y-1">
                      <li>• Fully functional interfaces</li>
                      <li>• Pre-populated with demo data</li>
                      <li>• Nigerian business context throughout</li>
                      <li>• Real workflows you can click through</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-800 mb-2">What You Won&apos;t See</p>
                    <ul className="text-base text-gray-700 space-y-1">
                      <li>• Your own data (this is demo only)</li>
                      <li>• Payment processing (demo mode)</li>
                      <li>• Customization options (for partners)</li>
                    </ul>
                  </div>
                </div>
                <p className="text-base text-gray-700 mt-4">
                  Every demo has a clear <span className="font-semibold text-amber-700">DEMO MODE</span> indicator so you always know you&apos;re in a demo environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Filter Tabs */}
      <section id="demo-selector" className="py-8 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
            Choose Your Industry
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-medium transition-all',
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {cat.icon && <cat.icon className="w-4 h-4" />}
                {cat.label}
                {cat.id !== 'all' && (
                  <span className="text-sm opacity-75">
                    ({demoTenants.filter(t => t.category === cat.id).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Tenant Cards */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTenants.map((tenant) => (
              <DemoTenantCard
                key={tenant.slug}
                name={tenant.name}
                slug={tenant.slug}
                industry={tenant.industry}
                category={tenant.category}
                stats={tenant.stats}
                href={`/demo/${tenant.slug}`}
              />
            ))}
          </div>
          {filteredTenants.length === 0 && (
            <p className="text-center text-gray-500 text-lg py-12">
              No demos available in this category yet.
            </p>
          )}
        </div>
      </section>

      {/* Quick Start by Role */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Jump In By Role
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Don&apos;t know where to start? Pick a role that matches what you want to see:
            </p>
          </div>

          {/* Mobile: Stacked Cards */}
          <div className="block lg:hidden space-y-3">
            {quickStartRoles.map((item) => (
              <Link 
                key={item.slug}
                href={`/demo/${item.slug}`}
                className="block bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
              >
                <p className="text-base font-medium text-gray-900 mb-1">{item.role}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.demo}</span>
                  <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    {item.startPoint}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-base font-semibold text-gray-700">I Am...</th>
                  <th className="text-left px-6 py-4 text-base font-semibold text-gray-700">Recommended Demo</th>
                  <th className="text-left px-6 py-4 text-base font-semibold text-gray-700">Start Here</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quickStartRoles.map((item, idx) => (
                  <tr key={item.slug} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-base text-gray-900">{item.role}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{item.demo}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{item.startPoint}</td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/demo/${item.slug}`}
                        className="inline-flex items-center gap-1 text-base font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Go
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Want a Personal Tour */}
      <section className="py-12 md:py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Want a Personal Tour?
            </h2>
            <p className="text-base md:text-lg text-gray-700 mb-6">
              The demo portal is great for exploration, but some features are easier to understand with guidance.
            </p>
            
            <div className="bg-white rounded-xl p-6 border border-emerald-200 mb-8 text-left">
              <p className="text-base font-semibold text-gray-900 mb-3">Request a guided walkthrough if:</p>
              <ul className="text-base text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  You want to see a specific workflow end-to-end
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  You have questions about how a feature works
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  You&apos;re evaluating WebWaka for partnership
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  You want to see Sites & Funnels in action
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
              <p className="text-base font-semibold text-gray-900 mb-4">How It Works</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-base mx-auto mb-2">1</div>
                  <p className="text-sm text-gray-700">Request via WhatsApp or form</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-base mx-auto mb-2">2</div>
                  <p className="text-sm text-gray-700">We schedule 30-45 min session</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-base mx-auto mb-2">3</div>
                  <p className="text-sm text-gray-700">We walk through the platform live</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-base mx-auto mb-2">4</div>
                  <p className="text-sm text-gray-700">You ask questions, we answer</p>
                </div>
              </div>
            </div>

            <Link
              href="https://wa.me/2348000000000?text=I%20would%20like%20to%20request%20a%20guided%20walkthrough%20of%20WebWaka"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-lg text-lg transition-all shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Request Guided Walkthrough
            </Link>
          </div>
        </div>
      </section>

      {/* What's Next */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            What&apos;s Next?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Partnership Path */}
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Interested in Partnership?</h3>
              </div>
              <p className="text-base text-gray-700 mb-6">
                The demo shows what your clients would use. As a partner, you&apos;d have access to configuration tools, Sites & Funnels, and the ability to create your own client accounts.
              </p>
              <Link
                href="/partners/get-started"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-base transition-all"
              >
                Apply to Become a Partner
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Business Owner Path */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Evaluating for Your Business?</h3>
              </div>
              <p className="text-base text-gray-700 mb-6">
                We don&apos;t sell direct to businesses. If you want WebWaka for your school, clinic, or shop, you&apos;ll work with a partner who serves your industry and region.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg text-base transition-all"
              >
                Connect Me With a Partner
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <p className="text-base text-gray-500 text-center mt-8">
            Just exploring? No problem. Explore as much as you want. Come back anytime.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Explore?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Pick a demo business above, or let us show you around.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#demo-selector"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              Enter Demo Portal
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link 
              href="https://wa.me/2348000000000"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
