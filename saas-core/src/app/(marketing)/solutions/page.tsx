/**
 * Solutions Page
 * POS, Online Store, Marketplace solutions
 */

import Link from 'next/link'
import { 
  ShoppingCart, Store, Users, ArrowRight, Check,
  Smartphone, Globe, CreditCard, BarChart3, Truck, Receipt
} from 'lucide-react'

export const metadata = {
  title: 'Solutions - eMarketWaka',
  description: 'POS, Online Store & Marketplace solutions for every business.',
}

const solutions = [
  {
    id: 'pos',
    icon: ShoppingCart,
    title: 'eMarketWaka POS',
    subtitle: 'Point of Sale System',
    description: 'A touch-first point of sale system designed for speed. Perfect for retail stores, restaurants, and service businesses.',
    color: 'from-blue-600 to-cyan-500',
    benefits: [
      'Fast checkout with touch interface',
      'Works offline - never miss a sale',
      'Multiple payment methods',
      'Real-time inventory tracking',
      'Staff management & permissions',
      'Daily sales reports',
    ],
    ideal: ['Retail Stores', 'Restaurants', 'Cafes', 'Service Businesses'],
    image: '/pos-preview.png',
  },
  {
    id: 'store',
    icon: Store,
    title: 'eMarketWaka Store',
    subtitle: 'Online Storefront',
    description: 'Launch your online store in minutes. Beautiful, mobile-first e-commerce that converts visitors into customers.',
    color: 'from-purple-600 to-pink-500',
    benefits: [
      'Professional storefront design',
      'Mobile-optimized checkout',
      'Product variants & options',
      'Flexible shipping zones',
      'Order management dashboard',
      'Customer accounts',
    ],
    ideal: ['E-commerce Businesses', 'Brands', 'Wholesalers', 'Manufacturers'],
    image: '/store-preview.png',
  },
  {
    id: 'marketplace',
    icon: Users,
    title: 'eMarketWaka Marketplace',
    subtitle: 'Multi-Vendor Platform',
    description: 'Build your own marketplace with multiple vendors. Earn commissions while vendors handle their own products.',
    color: 'from-orange-500 to-red-500',
    benefits: [
      'Unlimited vendors',
      'Automatic commission calculation',
      'Vendor wallets & payouts',
      'Vendor performance analytics',
      'Order routing & fulfillment',
      'Platform-level promotions',
    ],
    ideal: ['Marketplace Operators', 'Shopping Malls', 'Cooperatives', 'Trade Associations'],
    image: '/marketplace-preview.png',
  },
]

export default function SolutionsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            One Platform,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Three Solutions</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Whether you sell in-store, online, or want to build a marketplace — we've got you covered.
          </p>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {solutions.map((solution, idx) => (
            <div 
              key={solution.id}
              id={solution.id}
              className={`${idx > 0 ? 'mt-32 pt-16 border-t border-slate-200' : ''}`}
            >
              <div className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Content */}
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${solution.color} bg-opacity-10 mb-6`}>
                    <solution.icon className="w-5 h-5 text-slate-700" />
                    <span className="text-sm font-medium text-slate-700">{solution.subtitle}</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    {solution.title}
                  </h2>
                  
                  <p className="text-lg text-slate-600 mb-8">
                    {solution.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {solution.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${solution.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-slate-600">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-8">
                    <p className="text-sm font-medium text-slate-500 mb-3">IDEAL FOR</p>
                    <div className="flex flex-wrap gap-2">
                      {solution.ideal.map((item) => (
                        <span 
                          key={item}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/login?signup=true"
                    className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${solution.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all`}
                    data-testid={`${solution.id}-cta`}
                  >
                    Get Started with {solution.subtitle}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Visual */}
                <div className={`relative ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${solution.color} p-1`}>
                    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
                      <solution.icon className="w-24 h-24 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Choose the Right Solution
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-slate-500">POS</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-slate-500">Store</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-slate-500">Marketplace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'In-Store Sales', pos: true, store: false, marketplace: false },
                  { feature: 'Online Sales', pos: false, store: true, marketplace: true },
                  { feature: 'Product Management', pos: true, store: true, marketplace: true },
                  { feature: 'Inventory Tracking', pos: true, store: true, marketplace: true },
                  { feature: 'Multiple Vendors', pos: false, store: false, marketplace: true },
                  { feature: 'Vendor Payouts', pos: false, store: false, marketplace: true },
                  { feature: 'Commission System', pos: false, store: false, marketplace: true },
                  { feature: 'Offline Mode', pos: true, store: false, marketplace: false },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.pos ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.store ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.marketplace ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Not Sure Which Solution is Right?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Talk to our team. We'll help you find the perfect fit for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Contact Sales
            </Link>
            <Link 
              href="/login?signup=true"
              className="px-8 py-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
