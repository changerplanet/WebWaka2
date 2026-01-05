/**
 * WebWaka Partners Page
 * Partner program overview and signup
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Users, Zap,
  Briefcase, Laptop, Building, Award, TrendingUp, Shield,
  Phone, Mail
} from 'lucide-react'

export const metadata = {
  title: 'Partners — WebWaka Platform',
  description: 'Become a WebWaka Digital Transformation Partner (DTP). Resell, onboard, and support organizations in your community while earning commissions.',
}

const partnerTypes = [
  {
    id: 'reseller',
    name: 'Resellers',
    icon: TrendingUp,
    description: 'Sell WebWaka subscriptions to businesses in your network. Earn recurring commissions on every sale.',
    idealFor: ['Sales professionals', 'Business consultants', 'Entrepreneurs'],
    benefits: ['Recurring commissions', 'Sales materials', 'Lead support'],
  },
  {
    id: 'ict-vendor',
    name: 'ICT Vendors',
    icon: Laptop,
    description: 'Bundle WebWaka with your hardware and services. Provide complete business solutions.',
    idealFor: ['POS hardware vendors', 'IT service providers', 'Tech retailers'],
    benefits: ['Integration support', 'Technical training', 'Co-marketing'],
  },
  {
    id: 'consultant',
    name: 'Consultants',
    icon: Briefcase,
    description: 'Help businesses implement and optimize WebWaka. Provide advisory and support services.',
    idealFor: ['Business consultants', 'Accountants', 'Digital agencies'],
    benefits: ['Implementation fees', 'Ongoing support revenue', 'Certification'],
  },
  {
    id: 'agency',
    name: 'Agencies',
    icon: Building,
    description: 'Large-scale deployments and enterprise implementations. Strategic partnerships.',
    idealFor: ['Digital transformation agencies', 'System integrators', 'Enterprise consultants'],
    benefits: ['Enterprise deals', 'Priority support', 'Custom development'],
  },
]

const partnerBenefits = [
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description: 'Earn commissions on every subscription, every month, for the lifetime of the customer.',
  },
  {
    icon: Award,
    title: 'Training & Certification',
    description: 'Get certified on WebWaka products. Stand out as an authorized partner.',
  },
  {
    icon: Shield,
    title: 'Dedicated Support',
    description: 'Priority access to our partner support team. We succeed when you succeed.',
  },
  {
    icon: Zap,
    title: 'Marketing Resources',
    description: 'Access sales materials, case studies, and co-marketing opportunities.',
  },
]

const howItWorks = [
  { step: 1, title: 'Apply', description: 'Fill out the partner application form' },
  { step: 2, title: 'Get Verified', description: 'Our team reviews and approves your application' },
  { step: 3, title: 'Get Trained', description: 'Complete partner training and certification' },
  { step: 4, title: 'Start Earning', description: 'Begin referring clients and earning commissions' },
]

export default function PartnersPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Partner Program
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Grow With
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                WebWaka
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Join our network of Digital Transformation Partners. Help organizations in your community go digital while building a sustainable business.
            </p>

            <Link 
              href="/signup-v2?intent=become_partner"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-green-500/30"
              data-testid="partner-cta-apply"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Partner Types
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the partnership model that fits your business. Each type offers unique opportunities and benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {partnerTypes.map((type) => (
              <div 
                key={type.id}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{type.name}</h3>
                    <p className="text-gray-600 mt-1">{type.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Ideal for:</p>
                    <div className="flex flex-wrap gap-2">
                      {type.idealFor.map((item) => (
                        <span key={item} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Benefits:</p>
                    <div className="space-y-1">
                      {type.benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We invest in our partners&apos; success. Here&apos;s what you get when you join the WebWaka partner network.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerBenefits.map((benefit) => (
              <div 
                key={benefit.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Getting started as a WebWaka partner is simple. Here&apos;s the process.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="text-center relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Ready to Partner?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join our growing network of partners across Nigeria. Whether you&apos;re an individual or an organization, there&apos;s a partnership model for you.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <a href="tel:+2348000000000" className="text-gray-700 hover:text-green-600">
                    +234 800 000 0000
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <a href="mailto:partners@webwaka.com" className="text-gray-700 hover:text-green-600">
                    partners@webwaka.com
                  </a>
                </div>
              </div>

              <Link 
                href="/signup-v2?intent=become_partner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                data-testid="partner-cta-bottom"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-green-800 font-semibold">100+ Partners</p>
                  <p className="text-green-600 text-sm">Across Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Your Partnership Journey
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            Join the WebWaka partner network today. No upfront costs, no commitments — just opportunity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup-v2?intent=become_partner"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-green-500/30 hover:bg-green-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Contact Partner Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
