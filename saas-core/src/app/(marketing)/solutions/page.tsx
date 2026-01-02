/**
 * Solutions Page
 * Industry-focused solutions for Nigerian businesses
 */

import Link from 'next/link'
import { 
  ShoppingCart, Store, UtensilsCrossed, Warehouse, Package,
  ArrowRight, Check, Building2, Users
} from 'lucide-react'

export const metadata = {
  title: 'Solutions - eMarketWaka',
  description: 'Business solutions for retail shops, supermarkets, restaurants, market traders, and distributors in Nigeria.',
}

const solutions = [
  {
    id: 'retail',
    icon: ShoppingCart,
    title: 'Retail Shops',
    subtitle: 'For small and medium shops',
    description: 'Whether you run a provision store, phone shop, or boutique, eMarketWaka helps you track sales, manage stock, and grow your business.',
    color: 'bg-green-600',
    benefits: [
      'Track every sale automatically',
      'Know when stock is running low',
      'Send receipts via WhatsApp',
      'See your profit at a glance',
      'Works offline — no network needed',
      'Accept card and transfer payments',
    ],
    useCases: ['Provision stores', 'Phone shops', 'Boutiques', 'Electronics shops'],
  },
  {
    id: 'supermarket',
    icon: Store,
    title: 'Supermarkets',
    subtitle: 'For larger retail operations',
    description: 'Manage multiple checkout points, track inventory across categories, and get detailed reports to run your supermarket efficiently.',
    color: 'bg-amber-500',
    benefits: [
      'Multiple checkout terminals',
      'Barcode scanning support',
      'Category-based inventory',
      'Staff accounts with permissions',
      'Daily and monthly reports',
      'Customer loyalty features',
    ],
    useCases: ['Mini marts', 'Supermarkets', 'Department stores', 'Wholesale shops'],
  },
  {
    id: 'restaurant',
    icon: UtensilsCrossed,
    title: 'Restaurants & Cafes',
    subtitle: 'For food and beverage businesses',
    description: 'Take orders, manage your kitchen, and serve customers faster. Perfect for restaurants, cafes, fast food joints, and bars.',
    color: 'bg-orange-500',
    benefits: [
      'Easy order taking',
      'Table management',
      'Kitchen display system',
      'Split bills and combine orders',
      'Menu with photos and prices',
      'Delivery order management',
    ],
    useCases: ['Restaurants', 'Fast food', 'Cafes', 'Bars', 'Lounges'],
  },
  {
    id: 'market',
    icon: Package,
    title: 'Market Traders',
    subtitle: 'For market and roadside sellers',
    description: 'Simple tools for traders who sell in markets, on the roadside, or from home. Track your sales and stock on your phone.',
    color: 'bg-blue-600',
    benefits: [
      'Works on basic smartphones',
      'Simple one-screen interface',
      'Track daily sales easily',
      'Calculate profit automatically',
      'WhatsApp receipt sharing',
      'No internet required',
    ],
    useCases: ['Market stalls', 'Roadside shops', 'Home businesses', 'Hawkers'],
  },
  {
    id: 'distributor',
    icon: Warehouse,
    title: 'Distributors',
    subtitle: 'For wholesale and distribution',
    description: 'Manage your customers, track credit sales, and keep your distribution business organized with powerful B2B features.',
    color: 'bg-purple-600',
    benefits: [
      'Customer account management',
      'Credit sales and tracking',
      'Bulk order processing',
      'Delivery route planning',
      'Invoice generation',
      'Outstanding payment alerts',
    ],
    useCases: ['Wholesalers', 'Distributors', 'Suppliers', 'Agents'],
  },
  {
    id: 'plaza',
    icon: Building2,
    title: 'Malls & Plazas',
    subtitle: 'For multi-vendor locations',
    description: 'Run a marketplace for all the shops in your mall or plaza. Each vendor gets their own account while you manage the platform.',
    color: 'bg-gray-800',
    benefits: [
      'Multiple vendor accounts',
      'Commission on every sale',
      'Centralized reporting',
      'Vendor performance tracking',
      'Shared customer base',
      'Your brand, your platform',
    ],
    useCases: ['Shopping malls', 'Plazas', 'Trade associations', 'Cooperatives'],
  },
]

export default function SolutionsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Solutions for
            <br />
            <span className="text-green-400">Every Business</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            From small shops to large supermarkets, find the right solution for your business.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16 md:space-y-24">
            {solutions.map((solution, idx) => (
              <div 
                key={solution.id}
                id={solution.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Content */}
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 ${solution.color} bg-opacity-10 rounded-full mb-6`}>
                    <solution.icon className={`w-5 h-5 ${solution.color.replace('bg-', 'text-')}`} />
                    <span className={`text-sm font-medium ${solution.color.replace('bg-', 'text-')}`}>{solution.subtitle}</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {solution.title}
                  </h2>
                  
                  <p className="text-lg text-gray-600 mb-6">
                    {solution.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {solution.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-500 mb-2">PERFECT FOR</p>
                    <div className="flex flex-wrap gap-2">
                      {solution.useCases.map((useCase) => (
                        <span 
                          key={useCase}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/login?signup=true"
                    className={`inline-flex items-center gap-2 px-6 py-3 ${solution.color} text-white font-semibold rounded-lg hover:opacity-90 transition-all`}
                    data-testid={`${solution.id}-cta`}
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Visual */}
                <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className={`aspect-[4/3] rounded-2xl ${solution.color} p-1`}>
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                      <solution.icon className="w-24 h-24 text-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Not Sure Which Solution is Right for You?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Talk to us. We'll help you find the best fit for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-600 font-bold rounded-lg text-lg hover:bg-gray-50 transition-all"
            >
              Talk to Sales
            </Link>
            <Link 
              href="/login?signup=true"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
