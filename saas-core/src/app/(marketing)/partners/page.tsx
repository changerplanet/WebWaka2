/**
 * Partners Page
 * Partner program information
 */

import Link from 'next/link'
import { 
  Handshake, TrendingUp, Users, Award, ArrowRight, Check,
  Wallet, Globe, HeadphonesIcon, Zap
} from 'lucide-react'

export const metadata = {
  title: 'Partners - eMarketWaka',
  description: 'Join the eMarketWaka partner program and grow your business.',
}

const benefits = [
  {
    icon: Wallet,
    title: 'Recurring Revenue',
    desc: 'Earn up to 30% commission on every customer you refer, every month.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Support',
    desc: 'Access marketing materials, co-branded content, and sales enablement.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Support',
    desc: 'Get priority support and a dedicated partner success manager.',
  },
  {
    icon: Award,
    title: 'Partner Tiers',
    desc: 'Unlock higher commissions and perks as you grow with us.',
  },
]

const partnerTypes = [
  {
    title: 'Referral Partner',
    desc: 'Refer businesses to eMarketWaka and earn commissions.',
    commission: 'Up to 20%',
    ideal: ['Consultants', 'Freelancers', 'Influencers'],
  },
  {
    title: 'Reseller Partner',
    desc: 'Sell eMarketWaka directly to your customers with white-label options.',
    commission: 'Up to 30%',
    ideal: ['Agencies', 'Tech Companies', 'Distributors'],
  },
  {
    title: 'Integration Partner',
    desc: 'Build integrations and apps on the eMarketWaka platform.',
    commission: 'Revenue Share',
    ideal: ['Developers', 'SaaS Companies', 'Payment Providers'],
  },
]

export default function PartnersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm mb-6">
            <Handshake className="w-4 h-4" />
            Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Grow With
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> eMarketWaka</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Join our partner ecosystem and earn recurring revenue while helping businesses succeed.
          </p>
          <Link 
            href="/contact?type=partner"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:shadow-lg transition-all"
            data-testid="partner-apply-cta"
          >
            Apply to Partner Program
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Why Partner With Us?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Choose Your Path
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            We have partner programs for everyone — from individual consultants to enterprise resellers.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {partnerTypes.map((type) => (
              <div key={type.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{type.title}</h3>
                <p className="text-slate-600 mb-6">{type.desc}</p>
                
                <div className="mb-6">
                  <span className="text-sm text-slate-500">Commission</span>
                  <p className="text-2xl font-bold text-indigo-600">{type.commission}</p>
                </div>
                
                <div>
                  <span className="text-sm text-slate-500">Ideal For</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {type.ideal.map((item) => (
                      <span key={item} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Apply', desc: 'Fill out the partner application form and tell us about your business.' },
              { step: '2', title: 'Get Approved', desc: 'Our team reviews your application and sets you up for success.' },
              { step: '3', title: 'Start Earning', desc: 'Get your unique referral link and start earning commissions.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Partner?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join hundreds of partners earning with eMarketWaka.
          </p>
          <Link 
            href="/contact?type=partner"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
