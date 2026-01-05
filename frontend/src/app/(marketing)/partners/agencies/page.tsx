/**
 * Agencies Partner Landing Page
 * For agencies managing multiple clients - scalability and portfolio growth
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Building, Wallet, BookOpen, 
  Users, TrendingUp, ShoppingCart, Store, Package,
  Calculator, PieChart, Layers, BarChart3
} from 'lucide-react'

export const metadata = {
  title: 'Agency Partners - WebWaka',
  description: 'Partner with WebWaka as an agency. Manage multiple client accounts and grow your portfolio with our 15+ business modules.',
}

const benefits = [
  { icon: Wallet, title: 'Volume Commissions', desc: 'Higher rates as you bring more clients. Scale your earnings with your portfolio.' },
  { icon: Layers, title: 'Multi-Client Dashboard', desc: 'Manage all your clients from one view. Track performance across accounts.' },
  { icon: Users, title: 'White-Label Options', desc: 'Offer WebWaka under your brand. Build your service offering.' },
  { icon: BarChart3, title: 'Portfolio Analytics', desc: 'See how all your clients are performing. Identify growth opportunities.' },
]

const clientTypes = [
  { title: 'Retail Chains', desc: 'Multi-location shops needing centralized management' },
  { title: 'Restaurant Groups', desc: 'Multiple outlets with shared inventory and reporting' },
  { title: 'Franchises', desc: 'Franchise networks needing consistent systems' },
  { title: 'SME Portfolios', desc: 'Multiple small businesses under your management' },
]

const whoIsThisFor = [
  'Digital agencies with SME clients',
  'Web development agencies adding business tools',
  'Marketing agencies expanding services',
  'Business service firms with client portfolios',
  'IT managed service providers',
  'Consulting firms with multiple engagements',
]

const agencyAdvantages = [
  { title: '15+ Modules', desc: 'Full suite of tools to offer your clients' },
  { title: 'Scalable Pricing', desc: 'Volume discounts as you grow' },
  { title: 'Co-Branding', desc: 'White-label and co-branding available' },
  { title: 'API Access', desc: 'Integrate with your existing systems' },
]

export default function AgenciesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
                <Building className="w-4 h-4" />
                Agency Partner Program
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Grow Your Agency
                <br />
                <span className="text-green-400">with Business Tools</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                Add powerful business management tools to your service offering. Manage multiple clients, earn on every subscription.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/contact?type=partner&partner_type=agency"
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  data-testid="agency-apply-cta"
                >
                  Become an Agency Partner
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8">
                <p className="text-gray-400 text-sm mb-6">Agency Advantages</p>
                <div className="space-y-4">
                  {agencyAdvantages.map((adv) => (
                    <div key={adv.title} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">{adv.title}</p>
                        <p className="text-gray-400 text-sm">{adv.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for Growing Agencies
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You already serve multiple clients. Now offer them business management tools and create a new revenue stream — without building from scratch.
              </p>
              <ul className="space-y-4">
                {whoIsThisFor.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-bold text-gray-900 mb-6">Client Types You Can Serve</h3>
              <div className="grid grid-cols-2 gap-4">
                {clientTypes.map((type) => (
                  <div key={type.title} className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{type.title}</h4>
                    <p className="text-gray-600 text-sm">{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Agency Partner Benefits
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            How Agency Partnership Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Partner & Train</h3>
              <p className="text-gray-600 text-sm">
                Get certified on all modules. Learn how to position and implement for clients.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Onboard Clients</h3>
              <p className="text-gray-600 text-sm">
                Add WebWaka to your service offering. Implement for existing and new clients.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Scale & Earn</h3>
              <p className="text-gray-600 text-sm">
                Grow your portfolio. Higher volumes unlock better commission rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Volume-Based Commission
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm mb-2">1-10 Clients</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">20%</p>
              <p className="text-gray-600 text-sm">Commission</p>
            </div>
            <div className="bg-green-600 rounded-2xl p-6 shadow-lg text-white">
              <p className="text-green-100 text-sm mb-2">11-50 Clients</p>
              <p className="text-3xl font-bold mb-2">25%</p>
              <p className="text-green-100 text-sm">Commission</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-500 text-sm mb-2">50+ Clients</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">30%</p>
              <p className="text-gray-600 text-sm">Commission</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Expand Your Agency Services
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Add business management tools to your portfolio. Scale your revenue with your clients.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact?type=partner&partner_type=agency"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Back to Partners
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
