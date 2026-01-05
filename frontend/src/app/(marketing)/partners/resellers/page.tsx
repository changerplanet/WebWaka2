/**
 * Resellers Partner Landing Page
 * For individuals and small teams earning by helping businesses go digital
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Users, Wallet, BookOpen, 
  Smartphone, TrendingUp, ShoppingCart, Store, Package,
  Calculator, Zap, Globe, Clock
} from 'lucide-react'

export const metadata = {
  title: 'Reseller Partners - WebWaka',
  description: 'Become an WebWaka reseller partner. Earn recurring commissions by helping Nigerian businesses go digital.',
}

const whatYouCanSell = [
  { name: 'POS System', icon: ShoppingCart, desc: 'Help shops sell faster' },
  { name: 'Online Store', icon: Store, desc: 'Get businesses online' },
  { name: 'Inventory', icon: Package, desc: 'Track stock and supplies' },
  { name: 'Accounting', icon: Calculator, desc: 'Manage money easily' },
]

const benefits = [
  { icon: Wallet, title: 'Up to 30% Commission', desc: 'Earn on every subscription. Income continues as long as the customer stays.' },
  { icon: BookOpen, title: 'Free Training', desc: 'Learn how to demo and sell. We make you an expert.' },
  { icon: Smartphone, title: 'Sales Tools', desc: 'Get marketing materials, demo accounts, and sales scripts.' },
  { icon: TrendingUp, title: 'Recurring Income', desc: 'Build passive income. Monthly payments for customers you bring.' },
]

const steps = [
  { num: '1', title: 'Apply Online', desc: 'Fill out a simple form. Takes less than 5 minutes.' },
  { num: '2', title: 'Get Approved', desc: 'Most applications approved within 48 hours.' },
  { num: '3', title: 'Complete Training', desc: 'Free online training. Learn at your own pace.' },
  { num: '4', title: 'Start Selling', desc: 'Get your unique link and start earning.' },
]

const whoIsThisFor = [
  'Tech-savvy individuals looking for extra income',
  'Business owners who know other business owners',
  'Students with connections to local shops',
  'Anyone who wants to help businesses go digital',
  'Side hustlers looking for recurring income',
  'People in communities with many small businesses',
]

export default function ResellersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                Reseller Partner Program
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Earn by Helping
                <br />
                <span className="text-amber-300">Nigerian Businesses</span>
                <br />
                Go Digital
              </h1>
              <p className="text-lg md:text-xl text-green-100 mb-8">
                No inventory. No upfront costs. Just connect businesses with the tools they need and earn recurring commission.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/contact?type=partner&partner_type=reseller"
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  data-testid="reseller-apply-cta"
                >
                  Become a Reseller
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="text-center">
                  <p className="text-green-100 text-sm mb-2">Commission Rate</p>
                  <p className="text-5xl font-bold text-white mb-4">Up to 30%</p>
                  <p className="text-green-100">on every subscription</p>
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
                Is This Right for You?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You do not need to be a tech expert. If you know business owners — shop owners, market traders, restaurant operators — you can help them and earn.
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
              <h3 className="font-bold text-gray-900 mb-4">Real Nigerian Business Context</h3>
              <div className="space-y-4 text-gray-600">
                <p>Think about the shops in your area:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The provision store still tracking sales in a notebook</li>
                  <li>The boutique owner who wants to sell on WhatsApp</li>
                  <li>The restaurant with no proper order system</li>
                  <li>The supermarket struggling with inventory</li>
                </ul>
                <p className="font-medium text-gray-900">These businesses need help going digital. You can be that help.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Sell */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You Will Sell
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              WebWaka has 15+ modules. Each module solves a real business problem. You help businesses pick what they need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatYouCanSell.map((item) => (
              <div key={item.name} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-gray-500 mt-8">
            + Logistics, CRM, Analytics, Marketing, HR, and more modules
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={step.num} className="text-center relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Partner Benefits
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
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

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Low barrier. No fees. Start earning as soon as you bring your first customer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact?type=partner&partner_type=reseller"
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
