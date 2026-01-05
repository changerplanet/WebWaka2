/**
 * Partner Application / Get Started Page
 * 
 * POSITIONING: Partner-First Entry Point
 * This is the main landing page for prospective Partners to apply.
 * 
 * Note: This page is for people who want to BECOME Partners.
 * End-users seeking WebWaka services are directed to contact us to be matched with a Partner.
 */

import Link from 'next/link'
import { 
  ArrowRight, Users, Building2, Briefcase, 
  Check, Globe, Shield, TrendingUp, Zap, BookOpen,
  Laptop, Award
} from 'lucide-react'

export const metadata = {
  title: 'Become a WebWaka Partner',
  description: 'Apply to become a WebWaka Partner. Build your own SaaS business by deploying and operating platforms for your clients.',
}

const partnerTracks = [
  {
    id: 'reseller',
    name: 'Reseller',
    icon: TrendingUp,
    description: 'Individuals and small teams who connect organizations with WebWaka solutions',
    requirements: ['Sales experience helpful', 'Business network', 'Commitment to client success'],
    link: '/partners/resellers',
  },
  {
    id: 'ict-vendor',
    name: 'ICT Vendor',
    icon: Laptop,
    description: 'Technology providers who bundle WebWaka with hardware and IT services',
    requirements: ['Hardware/IT business', 'Technical team', 'Existing customer base'],
    link: '/partners/ict-vendors',
  },
  {
    id: 'consultant',
    name: 'Consultant',
    icon: Briefcase,
    description: 'Business consultants who implement and optimize WebWaka for clients',
    requirements: ['Consulting experience', 'Industry expertise', 'Project management skills'],
    link: '/partners/consultants',
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: Building2,
    description: 'Digital transformation agencies handling large-scale deployments',
    requirements: ['Established agency', 'Enterprise experience', 'Dedicated team'],
    link: '/partners/agencies',
  },
]

const benefits = [
  {
    icon: Shield,
    title: 'White-Label Ready',
    description: 'Your brand, your pricing. Clients see you as the platform provider.',
  },
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description: 'Build monthly recurring income from client subscriptions.',
  },
  {
    icon: Zap,
    title: 'Enterprise Infrastructure',
    description: 'We handle uptime, security, and scaling. You focus on clients.',
  },
  {
    icon: Award,
    title: 'Training & Certification',
    description: 'Comprehensive training program to ensure your success.',
  },
]

const applicationSteps = [
  { step: 1, title: 'Submit Application', description: 'Fill out the form below with your details' },
  { step: 2, title: 'Review', description: 'Our team reviews your application (24-48 hours)' },
  { step: 3, title: 'Onboarding Call', description: 'Meet with our Partner team to discuss your goals' },
  { step: 4, title: 'Training', description: 'Complete Partner certification training' },
  { step: 5, title: 'Launch', description: 'Start building and deploying client platforms' },
]

export default function GetStartedPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Partner Application
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Build Your Platform Business
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                on WebWaka Infrastructure
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Apply to become a WebWaka Partner. Create white-label platforms, set your own pricing, and build recurring revenue.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a 
                href="#application-form"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
              >
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link 
                href="/partners/playbook"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Read the Playbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-gray-50 rounded-xl p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Tracks */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Partner Track</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select the partnership model that fits your business and expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {partnerTracks.map((track) => (
              <div 
                key={track.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <track.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{track.name}</h3>
                    <p className="text-gray-600 text-sm">{track.description}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {track.requirements.map((req) => (
                      <li key={req} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href={track.link}
                  className="text-emerald-600 font-medium text-sm hover:text-emerald-700 flex items-center gap-1"
                >
                  Learn more <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Process</h2>
            <p className="text-gray-600">From application to launching your first client platform.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {applicationSteps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className="text-center w-40">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{step.step}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{step.title}</h4>
                  <p className="text-gray-500 text-xs">{step.description}</p>
                </div>
                {index < applicationSteps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partner Application</h2>
            <p className="text-gray-600">Fill out the form below to start your Partner journey.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div>
                <label htmlFor="partnerType" className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Track *
                </label>
                <select
                  id="partnerType"
                  name="partnerType"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-white"
                >
                  <option value="">Select a partner track</option>
                  <option value="reseller">Reseller</option>
                  <option value="ict-vendor">ICT Vendor</option>
                  <option value="consultant">Consultant</option>
                  <option value="agency">Agency</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location (City, State) *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="Lagos, Nigeria"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Relevant Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                  placeholder="Tell us about your background and why you want to become a WebWaka Partner"
                />
              </div>

              <div>
                <label htmlFor="clients" className="block text-sm font-medium text-gray-700 mb-1">
                  How many clients do you expect to onboard in the first 6 months?
                </label>
                <select
                  id="clients"
                  name="clients"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-white"
                >
                  <option value="">Select an estimate</option>
                  <option value="1-5">1-5 clients</option>
                  <option value="6-10">6-10 clients</option>
                  <option value="11-20">11-20 clients</option>
                  <option value="20+">20+ clients</option>
                </select>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  required
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Submit Application
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Already a Partner Note */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 mb-4">Already a Partner?</p>
          <Link 
            href="/login-v2"
            className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
          >
            Log in to your Partner Dashboard →
          </Link>
        </div>
      </section>
    </div>
  )
}
