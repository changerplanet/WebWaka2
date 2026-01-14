'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  ArrowRight, Check, X, Users, MessageCircle,
  Briefcase, Laptop, Building, Lightbulb, Target,
  ChevronDown, DollarSign, Layers, HeadphonesIcon, Globe,
  ClipboardCheck, Phone, UserCheck, GraduationCap, Rocket
} from 'lucide-react'

const partnerDoes = [
  { area: 'Sales', role: 'Find and close clients in your market' },
  { area: 'Configuration', role: 'Set up client accounts with the right suites' },
  { area: 'Training', role: 'Teach clients how to use their platform' },
  { area: 'Support', role: 'Answer questions and solve problems' },
  { area: 'Billing', role: 'Invoice clients and collect payment' },
  { area: 'Relationship', role: 'Be the face your clients know and trust' },
]

const webwakaDoes = [
  { area: 'Platform', role: 'Build and maintain all software' },
  { area: 'Infrastructure', role: 'Handle hosting, security, uptime' },
  { area: 'Updates', role: 'Add new features and improvements' },
  { area: 'Training', role: 'Provide partner training and certification' },
  { area: 'Support', role: 'Give you the resources to support clients' },
  { area: 'Tools', role: 'Sites & Funnels, demo portal, partner dashboard' },
]

const revenueStreams = [
  {
    title: 'Setup Fees',
    description: 'Charge clients for initial configuration, data migration, and training. You set the price based on complexity and client size.',
    icon: ClipboardCheck,
  },
  {
    title: 'Monthly Fees',
    description: 'Charge clients a monthly subscription for access to their platform. You set the price. Typical range: ₦25,000 - ₦250,000/month depending on suite and business size.',
    icon: DollarSign,
  },
  {
    title: 'Sites & Funnels',
    description: 'Build websites and funnels for clients. Charge setup fees plus monthly maintenance. This is pure margin.',
    icon: Layers,
  },
  {
    title: 'Add-On Services',
    description: 'Offer consulting, training, customization, and support packages. Some partners charge for WhatsApp priority support.',
    icon: HeadphonesIcon,
  },
]

const revenueExamples = [
  { scenario: '10 small clients × ₦30,000', monthly: '₦300,000/month' },
  { scenario: '20 clients × ₦50,000', monthly: '₦1,000,000/month' },
  { scenario: '5 enterprise clients × ₦200,000', monthly: '₦1,000,000/month' },
]

const partnerProfiles = [
  {
    id: 'agency',
    title: 'Digital Agencies',
    icon: Building,
    background: "You run a web design, digital marketing, or software agency.",
    whyWebwaka: "You're tired of building custom software from scratch for every client. WebWaka gives you a complete platform to deploy, so you can focus on client relationships and marketing.",
    opportunity: "Combine Sites & Funnels with vertical suites to become a full-service digital transformation partner.",
  },
  {
    id: 'ict',
    title: 'ICT Vendors',
    icon: Laptop,
    background: "You sell hardware, networking equipment, or IT services.",
    whyWebwaka: "Your clients ask about software, but you've never had a good answer. WebWaka lets you add software to your offering without hiring developers.",
    opportunity: "Bundle WebWaka with hardware sales. Every POS system sold is a potential Commerce Suite client.",
  },
  {
    id: 'consultant',
    title: 'Business Consultants',
    icon: Briefcase,
    background: "You advise businesses on operations, strategy, or finance.",
    whyWebwaka: "Consulting advice is valuable, but implementation is where the money is. WebWaka lets you implement your recommendations with real tools.",
    opportunity: "Position yourself as a digital transformation consultant, not just an advisor.",
  },
  {
    id: 'specialist',
    title: 'Industry Specialists',
    icon: Target,
    background: "You have deep expertise in a specific industry—healthcare, education, hospitality, faith organizations.",
    whyWebwaka: "Your industry knowledge is your advantage. WebWaka gives you the platform to serve your industry at scale.",
    opportunity: "Become THE technology partner for your industry in your region.",
  },
  {
    id: 'entrepreneur',
    title: 'Entrepreneurs',
    icon: Lightbulb,
    background: "You see opportunity in the Nigerian SME market and want to build a business.",
    whyWebwaka: "You don't have to be technical. You don't have to build software. You need sales skills and persistence.",
    opportunity: "Start a SaaS business with minimal capital and maximum flexibility.",
  },
]

const notForList = [
  {
    title: "You want software for your own business",
    description: "We don't sell direct. If you just need software for your shop or clinic, ask a partner to help you—or become a partner yourself.",
  },
  {
    title: "You want to build custom software",
    description: "WebWaka is a platform, not a framework. You configure and deploy, you don't code.",
  },
  {
    title: "You're looking for a quick flip",
    description: "This is a business you build over time. It requires sales effort, client management, and persistence.",
  },
  {
    title: "You're not willing to learn",
    description: "Partners need to understand the platform well enough to configure it and train clients. We provide training, but you have to show up.",
  },
  {
    title: "You're outside Nigeria/Africa",
    description: "Our platform is built for Nigerian business context. Currency, payments, regulations, examples—all Nigerian. If you're serving other markets, this isn't the right fit.",
  },
]

const onboardingSteps = [
  {
    step: 1,
    title: 'Apply',
    description: 'Fill out the partner application. Tell us about your business, your target market, and your goals.',
    icon: ClipboardCheck,
  },
  {
    step: 2,
    title: 'Conversation',
    description: "We'll schedule a call to discuss fit, answer questions, and explain the program in detail. No commitment required.",
    icon: Phone,
  },
  {
    step: 3,
    title: 'Approval',
    description: "If we're a good fit, we'll approve your application and set up your partner account.",
    icon: UserCheck,
  },
  {
    step: 4,
    title: 'Training',
    description: 'Complete partner training to understand the platform, the suites, and how to serve clients effectively.',
    icon: GraduationCap,
  },
  {
    step: 5,
    title: 'Launch',
    description: "Start finding and closing clients. We'll support you with resources, demo access, and ongoing training.",
    icon: Rocket,
  },
]

const faqs = [
  {
    question: 'How much does it cost to become a partner?',
    answer: 'There is no upfront franchise fee. Partners pay WebWaka based on platform usage. Details are discussed during onboarding.',
  },
  {
    question: 'Do I need technical skills?',
    answer: "You don't need to code. You need to understand how to configure the platform and train clients. We provide training.",
  },
  {
    question: 'Can I focus on just one industry?',
    answer: "Absolutely. Many of our best partners specialize in one industry—schools, clinics, churches. Your expertise is your advantage.",
  },
  {
    question: 'How do I find clients?',
    answer: "That's your job—and your opportunity. We provide demo tools and marketing resources, but sales is your responsibility.",
  },
  {
    question: 'What if a client outgrows the platform?',
    answer: "WebWaka is built for scale. We have clients from single-location shops to multi-branch enterprises. You grow with them.",
  },
  {
    question: 'Can I hire staff?',
    answer: "Yes. Many partners build teams for sales, support, and account management. This is a real business.",
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-base md:text-lg font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="pb-5">
          <p className="text-base text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Partner Program
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Build a SaaS Business
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Without Building Software
              </span>
            </h1>

            <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              WebWaka provides the platform. You build the business. Your clients, your pricing, your brand.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-base transition-all shadow-lg shadow-emerald-500/30"
                data-testid="partner-cta-apply"
              >
                Apply to Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="https://wa.me/2349135003000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-lg text-base transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Have Questions? Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What is a WebWaka Partner Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-emerald-600 mb-6">
              We Don&apos;t Sell Software. We Enable Partners.
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              WebWaka is different from other software platforms. We don&apos;t sell directly to businesses. We don&apos;t compete with our partners. We don&apos;t take your clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">A WebWaka Partner is a business owner who:</h3>
              <ul className="space-y-3">
                {[
                  'Finds and closes clients who need business software',
                  'Configures WebWaka suites for those clients',
                  'Sets their own pricing and keeps the margin',
                  'Provides support and builds relationships',
                  'Earns recurring revenue month after month',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-base text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">WebWaka provides:</h3>
              <ul className="space-y-3">
                {[
                  '20+ fully-built industry suites',
                  'Sites & Funnels for building client websites',
                  'Infrastructure, hosting, and security',
                  'Training and certification',
                  'Partner support and resources',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-base text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-10 text-center">
            <p className="text-lg md:text-xl font-semibold text-gray-900 bg-gray-100 py-4 px-6 rounded-lg inline-block">
              You are not a reseller. You are a platform operator.
            </p>
          </div>
        </div>
      </section>

      {/* Why Partner Model Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Better for Clients. Better for You. Better for Nigeria.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">For Clients</h3>
              <p className="text-base text-gray-600">
                Nigerian businesses don&apos;t want to deal with a software company in Lagos (or abroad). They want a partner who understands their local context, speaks their language, and answers their calls. That&apos;s you.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">For Partners</h3>
              <p className="text-base text-gray-600">
                Instead of building software from scratch or reselling someone else&apos;s product at thin margins, you operate a complete platform. You set the price. You own the relationship. You build real equity.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">For Nigeria</h3>
              <p className="text-base text-gray-600">
                This model creates jobs. Thousands of partners across Nigeria, each building a sustainable business, each employing support staff, each contributing to the digital economy.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-base md:text-lg font-medium text-gray-700 italic">
              We could sell direct. We choose not to. This is intentional.
            </p>
          </div>
        </div>
      </section>

      {/* Responsibilities Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              What You Do. What We Do.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-emerald-600 py-4 px-6">
                <h3 className="text-lg font-bold text-white">Your Responsibilities</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {partnerDoes.map((item) => (
                  <div key={item.area} className="py-4 px-6 flex items-start gap-4">
                    <span className="font-semibold text-gray-900 w-28 flex-shrink-0">{item.area}</span>
                    <span className="text-base text-gray-600">{item.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-800 py-4 px-6">
                <h3 className="text-lg font-bold text-white">WebWaka&apos;s Responsibilities</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {webwakaDoes.map((item) => (
                  <div key={item.area} className="py-4 px-6 flex items-start gap-4">
                    <span className="font-semibold text-gray-900 w-28 flex-shrink-0">{item.area}</span>
                    <span className="text-base text-gray-600">{item.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Boundary Statement */}
          <div className="max-w-3xl mx-auto mt-10">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 py-5 px-6 rounded-r-lg">
              <p className="text-base md:text-lg font-semibold text-emerald-800">
                We never contact your clients directly. We never sell to them. We never compete with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Model Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              How You Make Money
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {revenueStreams.map((stream) => (
              <div key={stream.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <stream.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
                <p className="text-base text-gray-600">{stream.description}</p>
              </div>
            ))}
          </div>

          {/* Example Revenue */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">Example Revenue</h3>
              <div className="space-y-4">
                {revenueExamples.map((example, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-amber-200 last:border-b-0">
                    <span className="text-base text-gray-700">{example.scenario}</span>
                    <span className="text-lg font-bold text-emerald-600">{example.monthly}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-6 text-center font-medium">
                Plus setup fees, plus sites & funnels, plus add-on services.
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-base text-gray-600">
                Partners pay WebWaka a platform fee based on usage. This is significantly less than what you charge clients. <strong>The margin is yours.</strong>
              </p>
              <p className="text-sm text-gray-500 mt-2 italic">
                Specific pricing discussed during partner onboarding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Partner Profiles */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Who Thrives as a WebWaka Partner?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerProfiles.map((profile) => (
              <div 
                key={profile.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <profile.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{profile.title}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Background</p>
                    <p className="text-base text-gray-700">{profile.background}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Why WebWaka</p>
                    <p className="text-base text-gray-700">{profile.whyWebwaka}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 mb-1">Opportunity</p>
                    <p className="text-base text-gray-700">{profile.opportunity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is NOT For */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Be Honest With Yourself
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              This program is NOT for everyone. Here&apos;s who should not apply:
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {notForList.map((item, i) => (
              <div 
                key={i}
                className="bg-white rounded-xl p-5 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-base text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Onboarding */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Become a Partner
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Most partners are active within 2-4 weeks of application.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-6">
              {onboardingSteps.map((step, index) => (
                <div key={step.step} className="relative text-center">
                  {index < onboardingSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 z-0" />
                  )}
                  <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4 relative z-10">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                    Step {step.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 md:px-8">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 to-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
            Ready to Start?
          </h2>
          <p className="text-base md:text-xl text-gray-300 mb-4">
            Join the partners who are building sustainable businesses on WebWaka. Let&apos;s have a conversation about your market and how we can help.
          </p>
          <p className="text-sm text-gray-400 mb-10">
            No commitment to apply. No fee to start the conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-base transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Apply to Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="https://wa.me/2349135003000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-lg text-base transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
