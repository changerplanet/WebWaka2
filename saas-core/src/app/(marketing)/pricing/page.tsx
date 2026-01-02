/**
 * Pricing Page
 * Simple, transparent pricing for Nigerian businesses
 */

import Link from 'next/link'
import { Check, HelpCircle, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Pricing - eMarketWaka',
  description: 'Simple, affordable pricing for Nigerian businesses. Start free, grow as you scale.',
}

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small shops and market traders',
    price: 'Free',
    period: 'forever',
    highlight: false,
    features: [
      '1 shop location',
      '1 staff account',
      'Basic POS features',
      '100 products',
      'WhatsApp receipts',
      'Basic sales reports',
      'Offline mode',
      'Email support',
    ],
    limitations: [
      'No online store',
      'No multi-vendor',
    ],
    cta: 'Get Started Free',
    href: '/login?signup=true&plan=starter',
  },
  {
    name: 'Business',
    description: 'For growing businesses that need more',
    price: '₦15,000',
    period: '/month',
    highlight: true,
    features: [
      'Up to 3 shop locations',
      '10 staff accounts',
      'Full POS features',
      'Unlimited products',
      'Online store included',
      'WhatsApp ordering',
      'Advanced reports',
      'Stock alerts',
      'Priority support',
    ],
    limitations: [],
    cta: 'Start 14-Day Trial',
    href: '/login?signup=true&plan=business',
  },
  {
    name: 'Enterprise',
    description: 'For large businesses and marketplaces',
    price: 'Custom',
    period: '',
    highlight: false,
    features: [
      'Unlimited locations',
      'Unlimited staff',
      'Multi-vendor marketplace',
      'Your own branding',
      'Commission management',
      'Vendor payouts',
      'API access',
      'Dedicated support',
      'Custom features',
    ],
    limitations: [],
    cta: 'Contact Sales',
    href: '/contact?plan=enterprise',
  },
]

const faqs = [
  {
    q: 'Can I start for free?',
    a: 'Yes! The Starter plan is completely free forever. Perfect for testing eMarketWaka or running a small shop.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept bank transfer, card payments, and USSD. Pay monthly or save with annual billing.',
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: 'Yes, you can change your plan anytime. Upgrades take effect immediately, downgrades at the end of your billing cycle.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes! All paid plans come with a 14-day free trial. No payment required to start.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'You can cancel anytime. Your data stays safe and you can download it. We'll even help you migrate if needed.',
  },
  {
    q: 'Do you offer discounts?',
    a: 'Yes! Pay annually and save 20%. We also offer special rates for cooperatives and trade associations.',
  },
]

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Honest
            <br />
            <span className="text-green-400">Pricing</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Start free, grow as you scale. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 -mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-2xl p-6 md:p-8 ${
                  plan.highlight 
                    ? 'bg-green-600 text-white shadow-2xl shadow-green-600/30 scale-105 z-10' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                
                <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${plan.highlight ? 'text-green-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                
                <div className="mt-6 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlight ? 'text-green-200' : 'text-gray-500'}>
                    {plan.period}
                  </span>
                </div>

                <Link
                  href={plan.href}
                  className={`block w-full py-3 text-center font-semibold rounded-lg transition-all mb-6 ${
                    plan.highlight 
                      ? 'bg-white text-green-600 hover:bg-gray-50' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  data-testid={`pricing-${plan.name.toLowerCase()}-cta`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-green-200' : 'text-green-600'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-green-100' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 opacity-60">
                      <span className={`w-5 h-5 flex items-center justify-center text-sm ${plan.highlight ? 'text-green-200' : 'text-gray-400'}`}>
                        —
                      </span>
                      <span className={`text-sm ${plan.highlight ? 'text-green-200' : 'text-gray-400'}`}>
                        {limitation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Annual Savings */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Pay annually and <span className="font-semibold text-green-600">save 20%</span> on all plans
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Common Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-gray-600 text-sm">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Still Have Questions?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Our team is here to help you find the right plan for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
            >
              Talk to Sales
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login?signup=true"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-green-200 hover:text-green-600 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
