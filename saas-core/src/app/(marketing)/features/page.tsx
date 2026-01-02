/**
 * Features Page
 * Nigerian-business focused features showcase
 */

import Link from 'next/link'
import { 
  ShoppingCart, Store, Users, Smartphone, WifiOff, 
  BarChart3, Receipt, Package, Truck, Bell, Lock,
  CreditCard, Clock, Globe, Wallet, Settings, Zap,
  ArrowRight, Check
} from 'lucide-react'

export const metadata = {
  title: 'Features - eMarketWaka',
  description: 'All the features you need to run your business. POS, Online Store & Marketplace for Nigerian businesses.',
}

const featureCategories = [
  {
    id: 'pos',
    title: 'POS & Business Management',
    subtitle: 'Sell in your shop with one-tap checkout',
    icon: ShoppingCart,
    color: 'bg-green-600',
    features: [
      { 
        icon: Smartphone, 
        title: 'Works on Any Device', 
        desc: 'Use your phone, tablet, or computer. No special equipment needed.' 
      },
      { 
        icon: WifiOff, 
        title: 'Works Offline', 
        desc: 'Keep selling when network is bad. Your data syncs when you are back online.' 
      },
      { 
        icon: Receipt, 
        title: 'Fast Checkout', 
        desc: 'Serve customers faster with one-tap sales. Print or send receipts via WhatsApp.' 
      },
      { 
        icon: Package, 
        title: 'Stock Management', 
        desc: 'Know what you have, what's selling, and when to restock.' 
      },
      { 
        icon: CreditCard, 
        title: 'Multiple Payments', 
        desc: 'Accept cash, card, bank transfer, or mobile money.' 
      },
      { 
        icon: BarChart3, 
        title: 'Sales Reports', 
        desc: 'See your daily, weekly, and monthly sales at a glance.' 
      },
    ],
  },
  {
    id: 'store',
    title: 'Online Store',
    subtitle: 'Sell on WhatsApp and online',
    icon: Store,
    color: 'bg-amber-500',
    features: [
      { 
        icon: Globe, 
        title: 'Your Own Website', 
        desc: 'Get a professional store website. Share the link with your customers.' 
      },
      { 
        icon: Smartphone, 
        title: 'WhatsApp Orders', 
        desc: 'Customers can browse and order directly to your WhatsApp.' 
      },
      { 
        icon: Package, 
        title: 'Product Catalog', 
        desc: 'Add products with photos, prices, and variants (sizes, colors).' 
      },
      { 
        icon: Bell, 
        title: 'Order Alerts', 
        desc: 'Get notified instantly when a customer places an order.' 
      },
      { 
        icon: Truck, 
        title: 'Delivery Options', 
        desc: 'Set up delivery zones and fees. Offer pickup or delivery.' 
      },
      { 
        icon: Lock, 
        title: 'Secure Payments', 
        desc: 'Accept payments online with bank cards and transfers.' 
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    subtitle: 'Run your own marketplace with multiple vendors',
    icon: Users,
    color: 'bg-gray-800',
    features: [
      { 
        icon: Users, 
        title: 'Multiple Vendors', 
        desc: 'Let vendors sell on your platform. Perfect for malls and plazas.' 
      },
      { 
        icon: Wallet, 
        title: 'Vendor Payments', 
        desc: 'Track vendor sales and earnings. Easy payouts.' 
      },
      { 
        icon: Settings, 
        title: 'Commission Control', 
        desc: 'Set your commission percentage. You earn on every sale.' 
      },
      { 
        icon: BarChart3, 
        title: 'Platform Analytics', 
        desc: 'See all sales across vendors. Know what's working.' 
      },
      { 
        icon: Globe, 
        title: 'Your Brand', 
        desc: 'Use your own name, logo, and colors. It's your marketplace.' 
      },
      { 
        icon: Zap, 
        title: 'Easy Onboarding', 
        desc: 'Vendors can sign up and start selling in minutes.' 
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Need
            <br />
            <span className="text-green-400">to Grow Your Business</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Simple tools that work for Nigerian businesses. No complicated setup. No hidden fees.
          </p>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {featureCategories.map((category, idx) => (
            <div 
              key={category.id} 
              id={category.id}
              className={`${idx > 0 ? 'mt-20 pt-20 border-t border-gray-200' : ''}`}
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{category.title}</h2>
                  <p className="text-gray-600">{category.subtitle}</p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature) => (
                  <div 
                    key={feature.title}
                    className="bg-white rounded-xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Offline Mode Highlight */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
                <WifiOff className="w-4 h-4" />
                Works Offline
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Keep Selling When Network is Bad
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                We know network can be unreliable in Nigeria. That's why eMarketWaka works offline. Make sales, update stock, and manage your business — even without internet.
              </p>
              <ul className="space-y-3">
                {[
                  'Process sales without internet',
                  'Data syncs automatically when you are online',
                  'Never lose a sale due to network issues',
                  'Works on 2G, 3G, 4G, and WiFi',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <WifiOff className="w-20 h-20 text-green-600 mx-auto mb-4" />
                  <p className="text-green-800 font-semibold text-lg">No network? No problem.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Try These Features?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Start free. No credit card required. Setup takes just 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?signup=true"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
              data-testid="features-cta"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
