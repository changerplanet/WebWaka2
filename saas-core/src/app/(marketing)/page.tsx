/**
 * Marketing Home Page
 * Nigerian-business focused landing page
 */

import Link from 'next/link'
import { 
  ShoppingCart, Store, Users, ArrowRight, Check, 
  Wifi, WifiOff, Smartphone, Globe, Receipt, TrendingUp,
  Shield, Zap, Clock
} from 'lucide-react'

export const metadata = {
  title: 'eMarketWaka - Your Business, Simplified',
  description: 'Manage your shop, sales, and customers in one place. POS, Online Store & Marketplace for Nigerian businesses.',
}

const features = [
  {
    icon: ShoppingCart,
    title: 'POS & Shop Management',
    description: 'Sell in your shop with one-tap checkout. Track inventory, manage staff, and see your sales in real-time.',
  },
  {
    icon: Store,
    title: 'Online Store',
    description: 'Sell on WhatsApp and online. Share your store link with customers and receive orders directly.',
  },
  {
    icon: Users,
    title: 'Marketplace',
    description: 'Run your own marketplace with multiple vendors. Perfect for malls, plazas, and trade associations.',
  },
]

const benefits = [
  { icon: WifiOff, text: 'Works offline — even when network is bad' },
  { icon: Smartphone, text: 'Works on any phone or tablet' },
  { icon: Shield, text: 'Your data is safe and secure' },
  { icon: Clock, text: 'Get started in 5 minutes' },
]

const industries = [
  { name: 'Retail Shops', icon: ShoppingCart },
  { name: 'Supermarkets', icon: Store },
  { name: 'Restaurants', icon: Receipt },
  { name: 'Market Traders', icon: TrendingUp },
]

export default function MarketingHomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm mb-6">
              <Shield className="w-4 h-4" />
              Built for Nigerian Businesses
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Manage Your Shop,
              <br />
              <span className="text-amber-300">Sales & Customers</span>
              <br />
              in One Place
            </h1>

            <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-8">
              Sell in your shop, on WhatsApp, and online. Works offline — even when network is bad.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link 
                href="/login?signup=true"
                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                data-testid="hero-cta-primary"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/features"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
                data-testid="hero-cta-secondary"
              >
                See All Features
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-green-100 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-amber-400" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-amber-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-amber-400" />
                Setup in 5 minutes
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you have a small shop or a big supermarket, eMarketWaka has the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Nigerian Businesses Choose eMarketWaka
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We understand the challenges of running a business in Nigeria. That's why we built eMarketWaka to work for you, not against you.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit.text} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{benefit.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link 
                  href="/features"
                  className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
                >
                  See all features
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-green-800 font-semibold">Simple. Fast. Reliable.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Businesses Like Yours
            </h2>
            <p className="text-lg text-gray-600">
              From market traders to supermarkets, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {industries.map((industry) => (
              <Link
                key={industry.name}
                href="/solutions"
                className="bg-gray-50 hover:bg-green-50 rounded-xl p-6 text-center transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-green-100 flex items-center justify-center mx-auto mb-3 transition-colors shadow-sm">
                  <industry.icon className="w-6 h-6 text-gray-600 group-hover:text-green-600 transition-colors" />
                </div>
                <p className="font-medium text-gray-900">{industry.name}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/solutions"
              className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
            >
              See all solutions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">5,000+</div>
              <p className="text-gray-400">Businesses</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">36</div>
              <p className="text-gray-400">States in Nigeria</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">₦1B+</div>
              <p className="text-gray-400">Transactions</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <p className="text-gray-400">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Join thousands of Nigerian businesses using eMarketWaka. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?signup=true"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg"
              data-testid="cta-get-started"
            >
              Get Started Free
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
