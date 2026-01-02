/**
 * Features Page
 * Showcase all platform features
 */

import { 
  ShoppingCart, Store, Users, CreditCard, BarChart3, Shield,
  Smartphone, Globe, Palette, Zap, Clock, HeadphonesIcon,
  Package, Truck, Receipt, Wallet, Bell, Lock
} from 'lucide-react'

export const metadata = {
  title: 'Features - eMarketWaka',
  description: 'Discover all the powerful features of eMarketWaka commerce platform.',
}

const features = [
  {
    category: 'Point of Sale',
    icon: ShoppingCart,
    color: 'from-blue-500 to-cyan-500',
    items: [
      { icon: Smartphone, title: 'Touch-First Interface', desc: 'Designed for tablets and touchscreens' },
      { icon: Receipt, title: 'Fast Checkout', desc: 'Process sales in seconds' },
      { icon: CreditCard, title: 'Multiple Payment Methods', desc: 'Cash, card, mobile money' },
      { icon: Clock, title: 'Offline Mode', desc: 'Keep selling when internet is down' },
    ]
  },
  {
    category: 'Online Store',
    icon: Store,
    color: 'from-purple-500 to-pink-500',
    items: [
      { icon: Globe, title: 'Beautiful Storefront', desc: 'Professional e-commerce website' },
      { icon: Package, title: 'Product Management', desc: 'Variants, inventory, pricing' },
      { icon: Truck, title: 'Shipping Zones', desc: 'Flexible delivery options' },
      { icon: Bell, title: 'Order Notifications', desc: 'Real-time order alerts' },
    ]
  },
  {
    category: 'Marketplace',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    items: [
      { icon: Users, title: 'Multi-Vendor', desc: 'Unlimited vendors on one platform' },
      { icon: Wallet, title: 'Vendor Wallets', desc: 'Automatic earnings tracking' },
      { icon: BarChart3, title: 'Commission Management', desc: 'Flexible fee structures' },
      { icon: CreditCard, title: 'Vendor Payouts', desc: 'Streamlined payments' },
    ]
  },
  {
    category: 'Platform',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    items: [
      { icon: Palette, title: 'White-Label', desc: 'Your brand, your domain' },
      { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security' },
      { icon: BarChart3, title: 'Analytics', desc: 'Insights that drive growth' },
      { icon: HeadphonesIcon, title: 'Support', desc: 'Help when you need it' },
    ]
  },
]

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Sell More</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Powerful features designed for African businesses. From your first sale to your millionth.
          </p>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {features.map((category, idx) => (
            <div key={category.category} className={`${idx > 0 ? 'mt-24' : ''}`}>
              <div className="flex items-center gap-4 mb-12">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{category.category}</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((feature) => (
                  <div 
                    key={feature.title}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} bg-opacity-10 flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join thousands of merchants using eMarketWaka to grow their sales.
          </p>
          <a 
            href="/login?signup=true"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition-all"
            data-testid="features-cta"
          >
            Start Free Trial
          </a>
        </div>
      </section>
    </div>
  )
}
