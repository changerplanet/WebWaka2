/**
 * WebWaka Partners Page
 * 
 * POSITIONING: Partner Program Overview
 * Main landing for the Partner program. Directs to specific Partner types
 * and the Playbook for detailed information.
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Users, Zap,
  Briefcase, Laptop, Building, Award, TrendingUp, Shield,
  BookOpen
} from 'lucide-react'

export const metadata = {
  title: 'Partner Program — WebWaka Platform',
  description: 'Become a WebWaka Partner. Build your own SaaS business by deploying and operating platforms for your clients.',
}

const partnerTypes = [
  {
    id: 'reseller',
    name: 'Resellers',
    icon: TrendingUp,
    description: 'Individuals and small teams who connect organizations with WebWaka solutions and provide ongoing support.',
    idealFor: ['Sales professionals', 'Business consultants', 'Entrepreneurs'],
    benefits: ['Recurring commissions', 'Sales materials', 'Lead support'],
    href: '/partners/resellers',
  },
  {
    id: 'ict-vendor',
    name: 'ICT Vendors',
    icon: Laptop,
    description: 'Technology providers who bundle WebWaka with hardware and IT services for complete business solutions.',
    idealFor: ['POS hardware vendors', 'IT service providers', 'Tech retailers'],
    benefits: ['Integration support', 'Technical training', 'Co-marketing'],
    href: '/partners/ict-vendors',
  },
  {
    id: 'consultant',
    name: 'Consultants',
    icon: Briefcase,
    description: 'Business consultants who implement and optimize WebWaka platforms for their clients.',
    idealFor: ['Business consultants', 'Accountants', 'Digital strategists'],
    benefits: ['Implementation fees', 'Ongoing support revenue', 'Certification'],
    href: '/partners/consultants',
  },
  {
    id: 'agency',
    name: 'Agencies',
    icon: Building,
    description: 'Digital transformation agencies handling large-scale deployments and enterprise implementations.',
    idealFor: ['Digital agencies', 'System integrators', 'Enterprise consultants'],
    benefits: ['Enterprise deals', 'Priority support', 'Custom development'],
    href: '/partners/agencies',
  },
]

const partnerBenefits = [
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description: 'Build monthly recurring income from client subscriptions you control.',
  },
  {
    icon: Award,
    title: 'Training & Certification',
    description: 'Get certified on WebWaka. Access comprehensive training and resources.',
  },
  {
    icon: Shield,
    title: 'White-Label Ready',
    description: 'Your brand, your pricing. Clients see you as the platform provider.',
  },
  {
    icon: Zap,
    title: 'Enterprise Infrastructure',
    description: 'We handle uptime, security, and scaling. You focus on clients.',
  },
]

const howItWorks = [
  { step: 1, title: 'Apply', description: 'Fill out the Partner application form' },
  { step: 2, title: 'Get Approved', description: 'Our team reviews and approves your application' },
  { step: 3, title: 'Get Trained', description: 'Complete Partner training and certification' },
  { step: 4, title: 'Start Building', description: 'Create and operate platforms for your clients' },
]

export default function PartnersPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Partner Program
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Build Your Own
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                SaaS Business
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              WebWaka Partners build and operate platforms for their clients. White-label ready, multi-industry, with your own pricing and branding.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/partners/get-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30"
                data-testid="partner-cta-apply"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/partners/playbook"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-lg transition-all"
                data-testid="partner-playbook-link"
              >
                <BookOpen className="w-5 h-5" />
                Read the Playbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Message */}
      <section className="py-8 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 text-center">
            <Globe className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800">
              <strong>Partner-First Model:</strong> WebWaka doesn&apos;t sell directly to end users. Partners create, operate, and support client platforms.
            </p>
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
              Choose the partnership model that fits your business. Each type offers unique opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {partnerTypes.map((type) => (
              <div 
                key={type.id}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-emerald-600" />
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
                          <Check className="w-4 h-4 text-emerald-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link 
                    href={type.href}
                    className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                  >
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
              Why Partner With WebWaka
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Build a sustainable business with enterprise-grade infrastructure behind you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerBenefits.map((benefit) => (
              <div 
                key={benefit.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-emerald-600" />
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
              Getting started as a WebWaka Partner is straightforward.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="text-center relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Playbook CTA */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-2">The Complete Partner Guide</h3>
              <p className="text-emerald-100">Everything you need to know about building a business on WebWaka.</p>
            </div>
            <Link 
              href="/partners/playbook"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg transition-all hover:bg-emerald-50 flex-shrink-0"
            >
              <BookOpen className="w-5 h-5" />
              Read the Playbook
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-gray-900 to-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Join the WebWaka Partner network. Build your own platform business with no upfront costs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Talk to Partner Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
