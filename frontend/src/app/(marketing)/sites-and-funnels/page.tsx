/**
 * WebWaka Sites & Funnels Page
 * 
 * POSITIONING: Partner Growth Engine
 * Position Sites & Funnels as a major competitive advantage for partners.
 * Target: Digital agencies, marketing consultants, partners seeking differentiation.
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, X, Globe, Layout, Target, FileText,
  Zap, Sparkles, BarChart3, Users, Link2, DollarSign,
  Smartphone, MessageCircle, Palette, Building
} from 'lucide-react'

const oldWayItems = [
  'Client asks for a website',
  'You spend 2-4 weeks building it',
  'You charge a one-time fee',
  'Client needs changes, you do more work for free',
  'You move to the next project, start from zero',
]

const newWayItems = [
  'Client asks for a website',
  'You clone an industry template',
  'You customize with their branding and content',
  'You deploy to their domain',
  'You charge setup + monthly maintenance',
  'AI helps generate content',
  'Analytics show you what\'s working',
  'Client succeeds, you get referrals',
]

const siteCapabilities = [
  { title: 'Professional layouts and design', icon: Layout },
  { title: 'Mobile-responsive by default', icon: Smartphone },
  { title: 'SEO basics built in', icon: BarChart3 },
  { title: 'Contact forms and lead capture', icon: FileText },
  { title: 'Custom domain support', icon: Globe },
  { title: 'Your client\'s branding, not ours', icon: Palette },
]

const industryTemplates = [
  'Clinics and healthcare',
  'Schools and training centers',
  'Churches and faith organizations',
  'Hotels and hospitality',
  'Retail and e-commerce',
  'Professional services',
]

const funnelCapabilities = [
  { title: 'Landing page → Lead capture → Thank you', icon: Target },
  { title: 'Webinar registration flows', icon: Users },
  { title: 'Course enrollment funnels', icon: FileText },
  { title: 'Booking and appointment funnels', icon: Layout },
  { title: 'Donation and giving campaigns', icon: DollarSign },
]

const funnelFeatures = [
  'Step-by-step page flows',
  'Form integration at each step',
  'Goal tracking and analytics',
  'UTM parameter support',
  'Mobile-optimized by default',
]

const aiContentSteps = [
  { step: 1, title: 'Select a section', description: 'Choose hero, about, services, or any other section' },
  { step: 2, title: 'Tell the AI about the client', description: 'Describe the client\'s business and goals' },
  { step: 3, title: 'AI generates content options', description: 'Get multiple headline and copy variations' },
  { step: 4, title: 'Pick and customize', description: 'Choose the best option and refine as needed' },
  { step: 5, title: 'Done in minutes', description: 'Not hours—deliver 5 websites in the time it used to take to build one' },
]

const aiContentTypes = [
  { type: 'Headlines', description: 'Compelling, industry-appropriate headlines' },
  { type: 'Body copy', description: 'Professional paragraphs that sound human' },
  { type: 'Call-to-action text', description: 'Action-oriented button copy' },
  { type: 'SEO meta descriptions', description: 'Search-optimized page descriptions' },
]

const suiteIntegrations = [
  { siteType: 'Clinic website', suite: 'Health Suite', action: 'Appointment form creates patient record' },
  { siteType: 'School website', suite: 'Education Suite', action: 'Inquiry form creates prospective student' },
  { siteType: 'Church website', suite: 'Church Suite', action: 'First-time guest form creates member record' },
  { siteType: 'Hotel website', suite: 'Hospitality Suite', action: 'Booking form creates reservation' },
  { siteType: 'E-commerce site', suite: 'Commerce Suite', action: 'Products sync, orders flow through' },
]

const comparisonFeatures = [
  { feature: 'Industry Templates', webwaka: 'Nigeria-specific', gohighlevel: 'Generic', wix: 'Generic' },
  { feature: 'Funnel Builder', webwaka: true, gohighlevel: true, wix: 'Limited' },
  { feature: 'Suite Integration', webwaka: 'Native', gohighlevel: 'API only', wix: false },
  { feature: 'AI Content', webwaka: 'Built-in', gohighlevel: 'Add-on', wix: 'Limited' },
  { feature: 'White Label', webwaka: 'Complete', gohighlevel: 'Partial', wix: false },
  { feature: 'Naira Billing', webwaka: 'Native', gohighlevel: 'USD only', wix: 'USD only' },
  { feature: 'Nigerian Context', webwaka: 'Built-in', gohighlevel: false, wix: false },
  { feature: 'Offline Mode', webwaka: 'Supported', gohighlevel: false, wix: false },
]

const idealUsers = [
  {
    title: 'Digital Agencies',
    description: 'You already build websites. Now you can build them faster, with better tools, and create recurring revenue instead of one-time projects.',
    icon: Building,
  },
  {
    title: 'Marketing Consultants',
    description: 'You advise clients on marketing. Now you can implement landing pages and funnels to prove your recommendations work.',
    icon: BarChart3,
  },
  {
    title: 'Business Coaches',
    description: 'You help clients grow. Now you can give them the digital presence to support that growth.',
    icon: Users,
  },
  {
    title: 'WebWaka Partners (Any Type)',
    description: 'Every partner benefits from Sites & Funnels. Even if you focus on a specific suite, the ability to build client websites accelerates everything.',
    icon: Zap,
  },
]

export default function SitesAndFunnelsPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-6 border border-white/30">
              <Zap className="w-4 h-4" />
              PARTNER GROWTH ENGINE
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Launch Client Websites and Funnels in
              <br />
              <span className="text-emerald-200">
                Hours, Not Weeks
              </span>
            </h1>

            <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
              Most partners spend months building client websites. WebWaka Sites & Funnels lets you deploy professional, industry-specific sites and conversion funnels the same day you close the deal.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/demo"
                className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-emerald-50 flex items-center justify-center gap-2"
                data-testid="sites-funnels-cta-demo"
              >
                See How It Works
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="https://wa.me/2349135003000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-semibold rounded-lg text-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Old Way vs New Way */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stop Trading Hours for Money
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              This is how you build a sustainable business, not a freelancing hamster wheel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">The Old Way</h3>
              </div>
              <div className="space-y-4">
                {oldWayItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* New Way */}
            <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">The WebWaka Way</h3>
              </div>
              <div className="space-y-4">
                {newWayItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What You Can Build */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Sites. Conversion Funnels. Industry Templates.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Complete Websites */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <Layout className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Websites</h3>
              <p className="text-gray-600 mb-6">Multi-page business websites with everything your clients need:</p>
              <div className="space-y-3">
                {siteCapabilities.map((cap, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{cap.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Funnels */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Conversion Funnels</h3>
              <p className="text-gray-600 mb-6">Goal-oriented page sequences:</p>
              <div className="space-y-3 mb-6">
                {funnelCapabilities.map((cap, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{cap.title}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-500 mb-3">Funnel Features:</p>
              <div className="space-y-2">
                {funnelFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Templates */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Industry Templates</h3>
              <p className="text-gray-600 mb-6">Purpose-built templates for:</p>
              <div className="space-y-3">
                {industryTemplates.map((template, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{template}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-medium">And more</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-6 italic">
                Not generic templates. Industry-specific layouts with the right sections, terminology, and calls to action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: AI-Powered Content */}
      <section className="py-20 md:py-28 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Don&apos;t Stare at a Blank Page
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The hardest part of building a client website isn&apos;t the design. It&apos;s the content. WebWaka includes AI-powered content generation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* AI Content Types */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">What AI Generates For You</h3>
              <div className="space-y-4">
                {aiContentTypes.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.type}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 mt-6 text-center font-medium">
                You review and approve everything. The AI drafts, you decide.
              </p>
            </div>

            {/* How It Works Steps */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">How It Works</h3>
              <div className="space-y-4">
                {aiContentSteps.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-emerald-800 font-semibold text-center">
                  This is how you deliver 5 websites in the time it used to take to build one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Suite Integration */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <Link2 className="w-4 h-4" />
              Native Integration
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Websites That Connect to Real Business Systems
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              This is what separates WebWaka Sites & Funnels from Wix, Squarespace, or even GoHighLevel.
            </p>
          </div>

          {/* Integration Table - Desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Site Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Connected Suite</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">What Happens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suiteIntegrations.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.siteType}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        {item.suite}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Integration Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {suiteIntegrations.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{item.siteType}</h4>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-3">
                  {item.suite}
                </span>
                <p className="text-gray-600 text-sm">{item.action}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-700 font-medium">
              The website isn&apos;t just a brochure. It&apos;s the front door to your client&apos;s entire operation.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Domain and Branding */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Your Client&apos;s Brand. Their Domain. Zero WebWaka Branding.</h3>
              <p className="text-emerald-100">Custom domains, client logos, SSL certificates handled automatically. Your clients never know WebWaka exists.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white">
                <Check className="w-4 h-4" />
                <span className="text-sm">Custom Domain</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white">
                <Check className="w-4 h-4" />
                <span className="text-sm">SSL Included</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white">
                <Check className="w-4 h-4" />
                <span className="text-sm">White Label</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Comparison Table */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Sites & Funnels Compares
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              GoHighLevel is powerful, but it&apos;s American software adapted for global use. WebWaka is Nigerian-built, Naira-native, and designed for how your clients actually do business.
            </p>
          </div>

          {/* Comparison Table - Desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-700">WebWaka Sites & Funnels</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">GoHighLevel</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Wix/Squarespace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonFeatures.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof item.webwaka === 'boolean' ? (
                        item.webwaka ? (
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-emerald-600 font-medium">{item.webwaka}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof item.gohighlevel === 'boolean' ? (
                        item.gohighlevel ? (
                          <Check className="w-5 h-5 text-gray-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{item.gohighlevel}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof item.wix === 'boolean' ? (
                        item.wix ? (
                          <Check className="w-5 h-5 text-gray-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-600">{item.wix}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comparison Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {comparisonFeatures.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">{item.feature}</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-1">WebWaka</p>
                    {typeof item.webwaka === 'boolean' ? (
                      item.webwaka ? (
                        <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-emerald-600 font-medium text-xs">{item.webwaka}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-1">GoHighLevel</p>
                    {typeof item.gohighlevel === 'boolean' ? (
                      item.gohighlevel ? (
                        <Check className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-600 text-xs">{item.gohighlevel}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-1">Wix</p>
                    {typeof item.wix === 'boolean' ? (
                      item.wix ? (
                        <Check className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-600 text-xs">{item.wix}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Revenue Model */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How You Make Money
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sites & Funnels creates multiple revenue streams for your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Setup Fees */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Setup Fees</h3>
              <p className="text-gray-600 mb-4">
                Charge for initial site creation, customization, and deployment.
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                ₦150,000 - ₦500,000
              </p>
              <p className="text-gray-500 text-sm">per site</p>
            </div>

            {/* Monthly Maintenance */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Monthly Maintenance</h3>
              <p className="text-gray-600 mb-4">
                Charge for hosting, updates, and ongoing support.
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                ₦20,000 - ₦75,000
              </p>
              <p className="text-gray-500 text-sm">per month</p>
            </div>

            {/* Suite Cross-Sell */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <Link2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Suite Cross-Sell</h3>
              <p className="text-gray-600 mb-4">
                Every site is an opportunity to sell the connected suite.
              </p>
              <p className="text-gray-700 text-sm">
                Build a clinic website → sell Health Suite<br />
                Build a church website → sell Church Suite
              </p>
            </div>
          </div>

          {/* The Math */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">The Math</h3>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-bold text-emerald-600">10</p>
                <p className="text-gray-600">clients</p>
              </div>
              <div className="text-2xl text-gray-400">×</div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-emerald-600">₦30,000</p>
                <p className="text-gray-600">/month</p>
              </div>
              <div className="text-2xl text-gray-400">=</div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-amber-600">₦300,000</p>
                <p className="text-gray-600">monthly recurring revenue</p>
              </div>
            </div>
            <p className="text-center text-gray-700 mt-6 font-medium">
              Plus setup fees, plus suite revenue, plus referrals. This is a business, not a gig.
            </p>
          </div>
        </div>
      </section>

      {/* Section 8: Who This Is For */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sites & Funnels Works Best For
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {idealUsers.map((user) => (
              <div 
                key={user.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <user.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{user.title}</h3>
                <p className="text-gray-600 text-sm">{user.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to See Sites & Funnels in Action?
          </h2>
          <p className="text-lg md:text-xl text-emerald-100 mb-10">
            We&apos;ll walk you through the template library, the AI content tools, and the deployment workflow. See how fast you can build something real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-emerald-50 flex items-center justify-center gap-2"
              data-testid="sites-funnels-cta-request-demo"
            >
              Request a Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Become a Partner
            </Link>
          </div>
          <div className="mt-8">
            <Link 
              href="https://wa.me/2349135003000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-200 hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Or chat with us on WhatsApp</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
