/**
 * Nigeria-First Design Deep Dive
 * 
 * Explains jurisdictional awareness and Nigeria-specific design decisions.
 */

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Landmark, Globe, Building2, Wallet, Shield, Smartphone } from 'lucide-react'

export const metadata = {
  title: 'Nigeria-First Design — WebWaka Governance',
  description: 'Built for Nigerian realities: NGN currency, VAT compliance, offline-first, mobile-first.',
}

const nigeriaDefaults = [
  { category: 'Currency', value: 'Nigerian Naira (NGN)', note: 'Kobo precision for accounting' },
  { category: 'Tax Rate', value: '7.5% VAT', note: 'FIRS-compliant calculation' },
  { category: 'Payment Methods', value: 'Bank Transfer, POS, USSD, Mobile Money', note: 'Cash-friendly operations' },
  { category: 'Phone Format', value: '+234 / 080/081/090/070/091', note: 'Nigerian mobile validation' },
  { category: 'Timezone', value: 'WAT (UTC+1)', note: 'Display in West Africa Time' },
  { category: 'Address Format', value: 'State, LGA, Landmark', note: 'Nigerian addressing conventions' },
]

const regulatoryContext = [
  { regulator: 'CAC', full: 'Corporate Affairs Commission', scope: 'Company registration, annual returns' },
  { regulator: 'FIRS', full: 'Federal Inland Revenue Service', scope: 'VAT, corporate tax, tax exemption' },
  { regulator: 'CBN', full: 'Central Bank of Nigeria', scope: 'Payment processing, fintech licensing' },
  { regulator: 'Sector', full: 'Sector-Specific Regulators', scope: 'Education, Health, Charity commissions' },
]

export default function NigeriaFirstPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-900 via-slate-900 to-gray-900 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/governance" className="inline-flex items-center gap-2 text-emerald-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Governance
          </Link>
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-300 text-sm font-medium mb-4">
              <Landmark className="w-4 h-4" />
              Nigeria-First Design
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for African Realities
            </h1>
            <p className="text-base text-gray-300">
              WebWaka is not global software adapted for Nigeria. It is Nigerian infrastructure designed for Nigerian organizations, with awareness of Nigerian regulations, payment methods, and operating conditions.
            </p>
          </div>
        </div>
      </section>

      {/* Why Nigeria-First */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Nigeria-First?</h2>
              <p className="text-gray-600 mb-4">
                Global SaaS platforms treat Africa as an afterthought—dollar pricing, US tax assumptions, always-online requirements. They fail organizations that operate in Nigerian realities.
              </p>
              <p className="text-gray-600 mb-4">
                WebWaka is different. Every default, every assumption, every design decision starts with Nigeria:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Offline-first:</strong> Works without internet, syncs when connected</span>
                </li>
                <li className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Mobile-first:</strong> Designed for phones, not desktops</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Cash-aware:</strong> Bank transfer verification, POS support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Regulation-aware:</strong> CAC, FIRS, sector compliance</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Nigeria Defaults
              </h3>
              <div className="space-y-3">
                {nigeriaDefaults.map((item) => (
                  <div key={item.category} className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.category}</p>
                      <p className="text-xs text-gray-500">{item.note}</p>
                    </div>
                    <span className="text-sm text-emerald-700 font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Context */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Regulatory Awareness</h2>
          <p className="text-gray-600 mb-8 text-sm max-w-3xl">
            WebWaka is designed with Nigerian regulators in mind. We understand the compliance landscape and build accordingly.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regulatoryContext.map((reg) => (
              <div key={reg.regulator} className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="text-2xl font-bold text-emerald-600 mb-1">{reg.regulator}</div>
                <div className="text-xs text-gray-500 mb-2">{reg.full}</div>
                <p className="text-xs text-gray-600">{reg.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Realities */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Built for Real Conditions</h2>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Unreliable Internet',
                solution: 'Offline-first architecture with background sync',
                icon: Globe,
              },
              {
                title: 'Power Outages',
                solution: 'Mobile-first design, low battery consumption',
                icon: Smartphone,
              },
              {
                title: 'Cash Economy',
                solution: 'Bank transfer verification, POS integration, COD support',
                icon: Wallet,
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-gray-600 text-xs">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Infrastructure for Nigeria</h2>
          <p className="text-emerald-100 mb-6 text-sm">
            Join the Partner network building Nigeria's digital infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/suites"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-all"
            >
              View All 14 Suites
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
