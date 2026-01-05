/**
 * WebWaka Partner Playbook Page
 * 
 * Educational, sales-enabling, trust-building content for Partners.
 * This is the authoritative guide for how Partners sell and operate WebWaka.
 * 
 * Key Principle: WebWaka is infrastructure Partners build on, not an app to resell.
 */

import Link from 'next/link'
import { 
  BookOpen, Target, Users, Zap, DollarSign, HeadphonesIcon,
  Palette, MessageCircle, Trophy, Star, ArrowRight,
  CheckCircle, XCircle, Lightbulb, AlertCircle, Shield,
  Building2, Laptop, Briefcase, Globe, TrendingUp, ChevronRight
} from 'lucide-react'

export const metadata = {
  title: 'Partner Playbook — WebWaka Platform',
  description: 'The complete guide to building your SaaS business on WebWaka. Learn how to sell, onboard clients, and grow recurring revenue as a WebWaka Partner.',
}

export default function PartnerPlaybookPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            PARTNER PLAYBOOK
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Build Your Own SaaS Business<br />
            <span className="text-emerald-400">on WebWaka</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8">
            The complete guide to selling, onboarding, and growing with WebWaka. 
            This playbook will help you understand what you're selling, how to sell it, 
            and how to build long-term recurring revenue.
          </p>
          <div className="flex flex-wrap gap-4">
            <a 
              href="#core-message" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition"
            >
              Start Reading <ArrowRight className="w-4 h-4" />
            </a>
            <Link 
              href="/partners/get-started"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-4 overflow-x-auto text-sm">
            <a href="#core-message" className="text-slate-600 hover:text-emerald-600 whitespace-nowrap">Core Message</a>
            <a href="#partner-roles" className="text-slate-600 hover:text-emerald-600 whitespace-nowrap">Roles & Powers</a>
            <a href="#how-to-sell" className="text-slate-600 hover:text-emerald-600 whitespace-nowrap">How to Sell</a>
            <a href="#onboarding" className="text-slate-600 hover:text-emerald-600 whitespace-nowrap">Onboarding</a>
            <a href="#revenue" className="text-slate-600 hover:text-emerald-600 whitespace-nowrap">Revenue</a>
            <a href="#golden-rules" className="text-slate-600 hover:text-emerald-600 whitespace-nowrap">Golden Rules</a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Section 1: Purpose */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Purpose of This Playbook</h2>
          </div>
          <p className="text-lg text-slate-600 mb-6">
            This playbook exists to help Partners build successful, sustainable SaaS businesses on WebWaka infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Understand what WebWaka really is',
              'Know what you are selling (and what you are not)',
              'Confidently onboard clients',
              'Package, price, and expand accounts',
              'Avoid selling confusion or scope creep',
              'Build a long-term SaaS business, not one-off projects',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Core Message */}
        <section id="core-message" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">The Core Message</h2>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">NON-NEGOTIABLE</span>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white mb-8">
            <p className="text-2xl font-bold mb-4">
              WebWaka is not an app you resell.
            </p>
            <p className="text-2xl font-bold text-emerald-200">
              WebWaka is the infrastructure you build your own platforms on.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-emerald-200 bg-emerald-50 rounded-xl">
              <h3 className="font-bold text-emerald-800 mb-2">Partners ARE</h3>
              <p className="text-emerald-700 text-lg font-medium">Platform Operators</p>
              <p className="text-emerald-600 text-sm mt-2">You build and run your own SaaS business</p>
            </div>
            <div className="p-6 border-2 border-slate-200 bg-slate-50 rounded-xl">
              <h3 className="font-bold text-slate-600 mb-2">Partners are NOT</h3>
              <p className="text-slate-800 text-lg font-medium">Agents or Resellers</p>
              <p className="text-slate-500 text-sm mt-2">You're not selling someone else's product</p>
            </div>
          </div>
        </section>

        {/* Section 3: Who This Is For */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Who This Is For</h2>
          </div>
          
          <h3 className="font-semibold text-slate-800 mb-4">Eligible Partner Types</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: Building2, name: 'Digital Agencies' },
              { icon: Laptop, name: 'IT Consultants' },
              { icon: Users, name: 'Field Agents & MSME Enablers' },
              { icon: Globe, name: 'NGOs & Development Organizations' },
              { icon: Building2, name: 'Government System Integrators' },
              { icon: Briefcase, name: 'Industry Associations' },
              { icon: Zap, name: 'Youth-Led Tech Businesses' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <item.icon className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
          
          <h3 className="font-semibold text-slate-800 mb-4">Who This Is NOT For</h3>
          <div className="space-y-2">
            {[
              'End users looking for a ready-made app',
              'Individual shop owners (unless becoming Partners)',
              'Freelancers looking for one-off gigs',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Partner Roles & Powers */}
        <section id="partner-roles" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Partner Roles & Powers</h2>
          </div>
          
          <h3 className="font-semibold text-slate-800 mb-4">As a WebWaka Partner, You Can:</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              'Create client organizations',
              'Launch multiple platforms per client',
              'Brand each platform under your own name',
              'Set your own pricing',
              'Bill your clients directly',
              'Earn recurring revenue',
              'Expand accounts without migrations',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-900 text-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">WebWaka's Role:</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-slate-300">
              <div>✓ Powers the infrastructure</div>
              <div>✓ Bills you wholesale</div>
              <div className="text-emerald-400 font-medium">✓ Never competes with you</div>
              <div className="text-emerald-400 font-medium">✓ Never takes your clients</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
              <Lightbulb className="w-4 h-4" />
              Key Rule
            </div>
            <p className="text-amber-700">
              Your clients are YOUR clients. WebWaka is the infrastructure provider—nothing more.
            </p>
          </div>
        </section>

        {/* Section 5: What You Are Selling */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">What You Are Selling</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-emerald-200 rounded-xl p-6">
              <h3 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> You ARE Selling
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-slate-800">Digital Transformation</strong>
                    <p className="text-sm text-slate-600">Helping organizations move from manual to digital</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-slate-800">Configured Platforms</strong>
                    <p className="text-sm text-slate-600">Tailored solutions built on WebWaka infrastructure</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-slate-800">Ongoing Support & Growth</strong>
                    <p className="text-sm text-slate-600">Long-term partnership, not a one-time sale</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="border-2 border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-500 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> You Are NOT Selling
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  A single app
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  A one-time website
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  A boxed product
                </li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <div className="flex items-center gap-2 text-emerald-800 font-medium mb-1">
              <Lightbulb className="w-4 h-4" />
              Partner Tip
            </div>
            <p className="text-emerald-700">
              Frame your offering as "your platform powered by enterprise infrastructure"—not "a WebWaka subscription."
            </p>
          </div>
        </section>

        {/* Section 6: How to Sell */}
        <section id="how-to-sell" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">How to Sell WebWaka</h2>
            <span className="text-sm text-slate-500">Step-by-Step Sales Flow</span>
          </div>
          
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="relative pl-8 border-l-2 border-emerald-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Identify the Client's Core Problem</h3>
              <div className="bg-slate-50 rounded-lg p-4 mb-3">
                <p className="font-medium text-slate-700 mb-2">Ask:</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• What are you currently doing manually?</li>
                  <li>• Where are you losing time or money?</li>
                  <li>• Who needs access to information?</li>
                  <li>• Do you operate in more than one area?</li>
                </ul>
              </div>
              <div className="text-red-600 text-sm font-medium">
                ⚠️ Avoid: Talking about features first. Lead with their pain, not your product.
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative pl-8 border-l-2 border-emerald-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Choose the FIRST Platform</h3>
              <p className="text-slate-600 mb-3">Not everything at once. Start with one:</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  'POS for a retail business',
                  'Marketplace for a market association',
                  'School system for an institution',
                  'Civic platform for an organization',
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <Lightbulb className="w-4 h-4" />
                  Key Rule: Start with one platform. Expand later.
                </div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative pl-8 border-l-2 border-emerald-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Explain Expansion</h3>
              <p className="text-slate-600 mb-3">This is the magic. Use this line:</p>
              <div className="bg-emerald-900 text-white rounded-xl p-6 mb-4">
                <p className="text-lg italic">
                  "We'll start with one platform. As you grow, we can add more platforms under the same system—without rebuilding anything."
                </p>
              </div>
              <p className="text-slate-600 text-sm">This sets up: <strong>Upsells</strong>, <strong>Long-term contracts</strong>, and <strong>Trust</strong></p>
            </div>
            
            {/* Step 4 */}
            <div className="relative pl-8">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Package Your Offer</h3>
              <p className="text-slate-600 mb-3">Partners decide:</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Setup fee', 'Monthly subscription', 'Support tier', 'Customization scope'].map((item, i) => (
                  <div key={i} className="p-3 bg-emerald-50 rounded-lg text-sm text-slate-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <Lightbulb className="w-4 h-4" />
                  WebWaka does NOT dictate retail pricing. You control your margins.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Onboarding */}
        <section id="onboarding" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Partner-Led Onboarding Process</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { step: 1, action: 'Create Client Organization', who: 'Partner' },
              { step: 2, action: 'Create first Platform Instance', who: 'Partner' },
              { step: 3, action: 'Assign domain & branding', who: 'Partner' },
              { step: 4, action: 'Activate required capabilities', who: 'Partner' },
              { step: 5, action: 'Invite client admins/users', who: 'Partner' },
              { step: 6, action: 'Train client team', who: 'Partner' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <div className="flex-1 font-medium text-slate-800">{item.action}</div>
                <div className="text-sm text-slate-500">{item.who}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <div className="flex items-center gap-2 text-emerald-800 font-medium mb-1">
              <Lightbulb className="w-4 h-4" />
              What This Means in Practice
            </div>
            <p className="text-emerald-700">
              The client never touches WebWaka directly. You are their provider.
            </p>
          </div>
        </section>

        {/* Section 8: Multi-Platform */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Multi-Platform Selling</h2>
          </div>
          
          <div className="bg-slate-900 text-white rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4 text-slate-300">Example: One Client, Three Platforms</h3>
            <div className="space-y-3">
              {[
                { platform: 'Retail POS', type: 'Commerce', pricing: 'Paid separately' },
                { platform: 'Online Store', type: 'Marketplace', pricing: 'Paid separately' },
                { platform: 'Accounting & Reporting', type: 'Back-office', pricing: 'Included or bundled' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <span className="font-medium">{item.platform}</span>
                    <span className="text-slate-400 text-sm ml-2">({item.type})</span>
                  </div>
                  <span className="text-emerald-400 text-sm">{item.pricing}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              'Each platform can be branded differently',
              'Each platform can be priced differently',
              'Each platform can grow independently',
            ].map((item, i) => (
              <div key={i} className="p-4 bg-emerald-50 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <div className="flex items-center gap-2 text-emerald-800 font-medium mb-1">
              <Lightbulb className="w-4 h-4" />
              Partner Tip
            </div>
            <p className="text-emerald-700">
              This is how Partners increase lifetime value. Don't sell one platform—sell a growth path.
            </p>
          </div>
        </section>

        {/* Section 9: Revenue */}
        <section id="revenue" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">How Partners Make Money</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { name: 'Setup & Onboarding Fees', desc: 'One-time implementation charges' },
              { name: 'Monthly Subscriptions', desc: 'Recurring platform fees (your pricing)' },
              { name: 'Platform Expansions', desc: 'Adding new platforms to existing clients' },
              { name: 'Custom Integrations', desc: 'Technical work beyond standard setup' },
              { name: 'Training & Support', desc: 'Ongoing client enablement' },
              { name: 'White-Label Offerings', desc: 'Fully branded solutions' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-1">{item.name}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-emerald-600 text-white rounded-xl p-6 text-center">
            <p className="text-2xl font-bold mb-2">Recurring revenue &gt; One-off projects</p>
            <p className="text-emerald-200">Build a portfolio of clients paying monthly, not a pipeline of projects that end.</p>
          </div>
        </section>

        {/* Section 10: Support Model */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Support & Responsibility Model</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-emerald-200 rounded-xl p-6">
              <h3 className="font-bold text-emerald-700 mb-4">Partner Handles</h3>
              <ul className="space-y-2">
                {['Client onboarding', 'First-line support', 'Configuration', 'Training'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-2 border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-700 mb-4">WebWaka Handles</h3>
              <ul className="space-y-2">
                {['Platform uptime', 'Security', 'Core updates', 'Infrastructure scaling'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <div className="flex items-center gap-2 text-emerald-800 font-medium mb-1">
              <Lightbulb className="w-4 h-4" />
              What This Means in Practice
            </div>
            <p className="text-emerald-700">
              Clean separation. You own the client relationship; we own the technology.
            </p>
          </div>
        </section>

        {/* Section 11: Branding */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Branding & White-Label Rules</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-emerald-200 rounded-xl p-6">
              <h3 className="font-bold text-emerald-700 mb-4">Clients See</h3>
              <ul className="space-y-2">
                {['Partner brand', 'Partner domain', 'Partner support contact'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-2 border-red-200 rounded-xl p-6">
              <h3 className="font-bold text-red-700 mb-4">Clients Do NOT See</h3>
              <ul className="space-y-2">
                {['WebWaka pricing', 'WebWaka sales CTAs', 'Other partners'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700">
                    <XCircle className="w-4 h-4 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
              <Lightbulb className="w-4 h-4" />
              Key Rule
            </div>
            <p className="text-amber-700">
              This protects your business. Your clients see YOU as the platform provider.
            </p>
          </div>
        </section>

        {/* Section 12: Objections */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Common Objections & Answers</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: '"Can we start small?"', a: 'Yes. One platform. Expand later.' },
              { q: '"What if we change direction?"', a: 'Add or remove platforms without migration.' },
              { q: '"Is this only for commerce?"', a: 'No. Education, health, civic, logistics, and more.' },
              { q: '"Who owns the data?"', a: 'Your client. Managed by you.' },
              { q: '"What if we outgrow this?"', a: "The infrastructure scales. You don't migrate." },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-800 mb-1">{item.q}</p>
                <p className="text-emerald-700 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 13: Success */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">What Success Looks Like</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { metric: 'Active Clients', value: '5–10' },
              { metric: 'Platforms per Client', value: '1–3' },
              { metric: 'Revenue Model', value: 'Monthly recurring' },
              { metric: 'Local Reputation', value: 'Strong, trusted provider' },
              { metric: 'Growth Pattern', value: 'Expansion without burnout' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-emerald-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-600 mb-1">{item.value}</p>
                <p className="text-sm text-slate-600">{item.metric}</p>
              </div>
            ))}
          </div>
          
          <p className="text-slate-600 text-center italic">
            Success is not about volume—it's about sustainable, recurring relationships.
          </p>
        </section>

        {/* Section 14: Golden Rules */}
        <section id="golden-rules" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Partner Golden Rules</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { num: 1, rule: "Don't oversell features", desc: 'Solve problems, don\'t demo capabilities' },
              { num: 2, rule: 'Start with one platform', desc: 'Expansion is always possible' },
              { num: 3, rule: 'Price for sustainability', desc: 'Your business needs margins' },
              { num: 4, rule: 'Educate clients early', desc: 'Set expectations from day one' },
              { num: 5, rule: 'Think in years, not projects', desc: 'Build recurring revenue' },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-lg">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.num}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{item.rule}</p>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 15: One-Line Pitch */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">One-Line Partner Pitch</h2>
            <span className="text-sm text-slate-500">Memorize this</span>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white text-center">
            <p className="text-2xl font-bold leading-relaxed">
              "We help organizations build and grow their own digital platforms—powered by WebWaka."
            </p>
          </div>
          
          <p className="text-center text-slate-600 mt-4">
            Use it in every conversation. It positions you as the builder, WebWaka as the infrastructure.
          </p>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Build Your SaaS Business?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Join the WebWaka Partner Program and start building recurring revenue with your own platform business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition"
            >
              Become a WebWaka Partner <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
            >
              Talk to Our Partner Team
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <p>WebWaka Partner Playbook v1.0 — Training-ready, Sales-ready, Policy-aligned</p>
      </footer>
    </div>
  )
}
