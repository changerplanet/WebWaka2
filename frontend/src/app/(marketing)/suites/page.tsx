'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Layers, Store, Briefcase, Users, Settings } from 'lucide-react'
import { suites, suitesByCategory, categoryLabels } from '@/lib/marketing/suites-data'
import { SuiteCard } from '@/components/marketing/SuiteCard'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'all' as const, label: 'All Suites', icon: Layers },
  { id: 'commerce' as const, label: 'Commerce', icon: Store },
  { id: 'service' as const, label: 'Service', icon: Briefcase },
  { id: 'community' as const, label: 'Community', icon: Users },
  { id: 'operations' as const, label: 'Operations', icon: Settings },
]

const categoryDescriptions: Record<string, string> = {
  commerce: 'For businesses that sell products and services',
  service: 'For businesses that deliver professional services',
  community: 'For organizations that bring people together',
  operations: 'For teams that manage internal processes',
}

export default function SuitesPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'commerce' | 'service' | 'community' | 'operations'>('all')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('commerce')

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  const filteredSuites = activeCategory === 'all' 
    ? suites 
    : suites.filter(s => s.category === activeCategory)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-base font-medium mb-6">
              <Layers className="w-4 h-4" />
              Industry Suites
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              20+ Industry Suites.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                One Platform.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Every suite is fully implemented with APIs, databases, interfaces, and Nigerian context. Pick your market. Configure. Deploy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/demo"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                data-testid="suites-cta-demo"
              >
                Enter Demo Portal
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
                data-testid="suites-cta-partner"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why So Many Suites */}
      <section className="py-12 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why So Many Suites?</h2>
            <p className="text-base text-gray-700 mb-6">
              Nigerian businesses are diverse. A school operates differently from a clinic. A church has different needs than a logistics company. Generic software forces businesses to adapt. WebWaka adapts to businesses.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg border border-emerald-200">
                <p className="text-base font-medium text-gray-900">Pre-configured workflows</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-emerald-200">
                <p className="text-base font-medium text-gray-900">Industry terminology</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-emerald-200">
                <p className="text-base font-medium text-gray-900">Relevant dashboards</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-emerald-200">
                <p className="text-base font-medium text-gray-900">Nigerian context</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <cat.icon className="w-4 h-4" />
                {cat.label}
                {cat.id !== 'all' && (
                  <span className="text-sm opacity-75">
                    ({suitesByCategory[cat.id]?.length || 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Suites Display */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeCategory === 'all' ? (
            /* Accordion layout for all categories */
            <div className="space-y-6">
              {(['commerce', 'service', 'community', 'operations'] as const).map((category) => {
                const categorySuites = suitesByCategory[category]
                const isExpanded = expandedCategory === category
                
                return (
                  <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          category === 'commerce' && 'bg-blue-100',
                          category === 'service' && 'bg-indigo-100',
                          category === 'community' && 'bg-pink-100',
                          category === 'operations' && 'bg-amber-100',
                        )}>
                          {category === 'commerce' && <Store className="w-6 h-6 text-blue-600" />}
                          {category === 'service' && <Briefcase className="w-6 h-6 text-indigo-600" />}
                          {category === 'community' && <Users className="w-6 h-6 text-pink-600" />}
                          {category === 'operations' && <Settings className="w-6 h-6 text-amber-600" />}
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-gray-900">
                            {categoryLabels[category]}
                          </h3>
                          <p className="text-base text-gray-600">
                            {categoryDescriptions[category]} • {categorySuites.length} suites
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        'w-6 h-6 text-gray-500 transition-transform',
                        isExpanded && 'rotate-180'
                      )} />
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 md:p-6 pt-0 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {categorySuites.map((suite) => (
                            <SuiteCard
                              key={suite.id}
                              id={suite.id}
                              name={suite.name}
                              description={suite.description}
                              icon={suite.icon}
                              category={suite.category}
                              demoStrength={suite.demoStrength}
                              href={`/suites/${suite.id}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* Grid layout for filtered category */
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {categoryLabels[activeCategory]}
                </h2>
                <p className="text-base text-gray-600">
                  {categoryDescriptions[activeCategory]}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredSuites.map((suite) => (
                  <SuiteCard
                    key={suite.id}
                    id={suite.id}
                    name={suite.name}
                    description={suite.description}
                    icon={suite.icon}
                    category={suite.category}
                    demoStrength={suite.demoStrength}
                    href={`/suites/${suite.id}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">20+</div>
              <div className="text-base text-gray-600">Industry Suites</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">16</div>
              <div className="text-base text-gray-600">Demo Businesses</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">4</div>
              <div className="text-base text-gray-600">Categories</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">100%</div>
              <div className="text-base text-gray-600">Nigerian Context</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Access Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              See Every Suite in Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              We&apos;ve built 16 demo businesses with real data. Schools with students, clinics with patients, churches with members. No signup required.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-lg transition-all"
            >
              Enter Demo Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Pick Your Market?
          </h2>
          <p className="text-lg md:text-xl text-emerald-100 mb-10">
            Choose the suites that match your expertise. We&apos;ll help you get started with training, configuration, and your first clients.
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
              href="https://wa.me/2349135003000"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Chat on WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
