/**
 * Pricing Page
 * Transparent pricing for all solutions
 */

import Link from 'next/link'
import { Check, HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'Pricing - eMarketWaka',
  description: 'Simple, transparent pricing for businesses of all sizes.',
}

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    price: 'Free',
    period: 'forever',
    highlight: false,
    features: [
      '1 Location',
      '1 Staff Account',
      'Basic POS Features',
      '100 Products',
      'Email Support',
      'Basic Reports',
    ],
    cta: 'Get Started Free',
    href: '/login?signup=true&plan=starter',
  },
  {
    name: 'Business',
    description: 'For growing businesses that need more',
    price: '$29',
    period: '/month',
    highlight: true,
    features: [
      'Up to 3 Locations',
      '10 Staff Accounts',
      'Full POS + Online Store',
      'Unlimited Products',
      'Priority Support',
      'Advanced Analytics',
      'Custom Domain',
      'Inventory Alerts',
    ],
    cta: 'Start Free Trial',
    href: '/login?signup=true&plan=business',
  },
  {
    name: 'Enterprise',
    description: 'For large businesses and marketplaces',
    price: 'Custom',
    period: '',
    highlight: false,
    features: [
      'Unlimited Locations',
      'Unlimited Staff',
      'POS + Store + Marketplace',
      'Multi-Vendor Support',
      'Dedicated Support',
      'Custom Integrations',
      'White-Label Branding',
      'SLA Guarantee',
    ],
    cta: 'Contact Sales',
    href: '/contact?plan=enterprise',
  },
]

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, mobile money (M-Pesa, MTN, Airtel), and bank transfers for annual plans.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel anytime with no questions asked. We\'ll even help you export your data.',
  },
  {
    q: 'Do you offer discounts for NGOs?',
    a: 'Yes! We offer 50% off for registered non-profits and educational institutions. Contact us to apply.',
  },
  {
    q: 'What\'s included in the Enterprise plan?',
    a: 'Enterprise includes everything plus dedicated support, custom integrations, white-label options, and SLA guarantees.',
  },
]

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Transparent
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Pricing</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            No hidden fees. No surprises. Just honest pricing that scales with your business.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 -mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/25 scale-105' 
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                
                <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 ${plan.highlight ? 'text-indigo-100' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
                
                <div className="mt-6 mb-8">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlight ? 'text-indigo-200' : 'text-slate-500'}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-indigo-200' : 'text-green-500'}`} />
                      <span className={plan.highlight ? 'text-indigo-100' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${
                    plan.highlight 
                      ? 'bg-white text-indigo-600 hover:shadow-lg' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                  data-testid={`pricing-${plan.name.toLowerCase()}-cta`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                    <p className="text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Our team is here to help you find the right plan for your business.
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
          >
            Talk to Sales
          </Link>
        </div>
      </section>
    </div>
  )
}
