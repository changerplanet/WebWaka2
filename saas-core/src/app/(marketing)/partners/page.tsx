/**
 * Partners Page
 * Digital transformation partner program for Nigerian market
 */

import Link from 'next/link'
import { 
  Handshake, TrendingUp, Users, Award, ArrowRight, Check,
  Wallet, HeadphonesIcon, BookOpen, Zap
} from 'lucide-react'

export const metadata = {
  title: 'Partners - eMarketWaka',
  description: 'Become an eMarketWaka partner. Earn by helping Nigerian businesses go digital.',
}

const benefits = [
  {
    icon: Wallet,
    title: 'Earn on Every Sale',
    desc: 'Get up to 30% commission on every customer you bring. Paid monthly to your bank account.',
  },
  {
    icon: BookOpen,
    title: 'Training & Support',
    desc: 'Free training on the platform. We help you become an expert so you can help your customers.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Support',
    desc: 'Get priority support and a direct line to our team when your customers need help.',
  },
  {
    icon: Award,
    title: 'Grow With Us',
    desc: 'Unlock higher commissions and exclusive perks as you bring more businesses on board.',
  },
]

const partnerTypes = [
  {
    title: 'Referral Partner',
    desc: 'Know a business that needs eMarketWaka? Refer them and earn when they sign up.',
    commission: 'Up to 20%',
    ideal: ['Business consultants', 'Accountants', 'Community leaders', 'Tech enthusiasts'],
    effort: 'Low commitment',
  },
  {
    title: 'Reseller Partner',
    desc: 'Sell eMarketWaka directly to businesses. Get training, marketing materials, and dedicated support.',
    commission: 'Up to 30%',
    ideal: ['IT service providers', 'POS vendors', 'Software agencies', 'Distributors'],
    effort: 'Active selling',
  },
  {
    title: 'Implementation Partner',
    desc: 'Help businesses set up and customize eMarketWaka. Provide training and ongoing support.',
    commission: 'Project fees + commission',
    ideal: ['IT consultants', 'System integrators', 'Business consultants', 'Agencies'],
    effort: 'Full service',
  },
]

const steps = [
  { 
    step: '1', 
    title: 'Apply', 
    desc: 'Fill out the simple application form. Tell us about yourself and your network.' 
  },
  { 
    step: '2', 
    title: 'Get Approved', 
    desc: 'We review your application within 48 hours. Most partners are approved quickly.' 
  },
  { 
    step: '3', 
    title: 'Get Trained', 
    desc: 'Complete our free partner training. Learn how to demo and sell eMarketWaka.' 
  },
  { 
    step: '4', 
    title: 'Start Earning', 
    desc: 'Share your unique link or code. Earn commission on every customer that signs up.' 
  },
]

export default function PartnersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
            <Handshake className="w-4 h-4" />
            Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Earn by Helping Businesses
            <br />
            <span className="text-green-400">Go Digital</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Join our partner network and earn recurring commission by helping Nigerian businesses grow with eMarketWaka.
          </p>
          <Link 
            href="/contact?type=partner"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg"
            data-testid="partner-apply-cta"
          >
            Apply to Partner Program
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Partner With eMarketWaka?
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

      {/* Partner Types */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Choose Your Partner Type
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Whether you want to simply refer businesses or actively sell, there is a partner program for you.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {partnerTypes.map((type) => (
              <div key={type.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-4">
                  {type.effort}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-gray-600 mb-6 text-sm">{type.desc}</p>
                
                <div className="mb-6">
                  <span className="text-sm text-gray-500">Commission</span>
                  <p className="text-2xl font-bold text-green-600">{type.commission}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Best For</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {type.ideal.map((item) => (
                      <span key={item} className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
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
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How to Become a Partner
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, idx) => (
              <div key={item.step} className="text-center relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <p className="text-xl md:text-2xl text-gray-700 italic mb-6">
              "I've helped over 50 businesses in my area switch to eMarketWaka. The commission is good, but the real reward is seeing their businesses grow."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Partner in Lagos</p>
                <p className="text-gray-600 text-sm">Reseller Partner since 2024</p>
              </div>
            </div>
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
            Join hundreds of partners helping Nigerian businesses go digital.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact?type=partner"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-600 font-bold rounded-lg text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Have Questions? Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
