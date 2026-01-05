/**
 * Consultants Partner Landing Page
 * For business advisors helping SMEs modernize operations
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Briefcase, Wallet, BookOpen, 
  Users, TrendingUp, ShoppingCart, Store, Package,
  Calculator, PieChart, Target, Award
} from 'lucide-react'

export const metadata = {
  title: 'Consultant Partners - WebWaka',
  description: 'Partner with WebWaka as a business consultant. Help Nigerian SMEs modernize their operations and earn recurring commissions.',
}

const modules = [
  { name: 'POS & Sales', icon: ShoppingCart },
  { name: 'Inventory', icon: Package },
  { name: 'Accounting', icon: Calculator },
  { name: 'Analytics', icon: PieChart },
]

const benefits = [
  { icon: Wallet, title: 'Project Fees + Commission', desc: 'Charge for your consulting services plus earn commission on subscriptions.' },
  { icon: BookOpen, title: 'Expert Training', desc: 'Deep training on all modules. Become a certified business advisor.' },
  { icon: Users, title: 'Client Resources', desc: 'Get presentation decks, ROI calculators, and case studies.' },
  { icon: Award, title: 'Premium Support', desc: 'Direct line to our team. Priority response for your clients.' },
]

const howYouHelp = [
  {
    title: 'Assess',
    desc: 'Evaluate the business needs. Identify pain points in sales, inventory, accounting.',
  },
  {
    title: 'Recommend',
    desc: 'Suggest the right combination of modules. Not everyone needs everything.',
  },
  {
    title: 'Implement',
    desc: 'Help set up the system. Configure it for their specific business.',
  },
  {
    title: 'Train',
    desc: 'Train the owner and staff. Make sure they can use it effectively.',
  },
]

const whoIsThisFor = [
  'Business consultants advising SMEs',
  'Accountants helping clients modernize',
  'Management consultants',
  'Business coaches and mentors',
  'Professionals with SME client networks',
  'Advisory firms focused on small business',
]

export default function ConsultantsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
                <Briefcase className="w-4 h-4" />
                Consultant Partner Program
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Help SMEs
                <br />
                <span className="text-green-400">Modernize Operations</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                You advise businesses. Now you can offer them the tools to actually implement your recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/contact?type=partner&partner_type=consultant"
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  data-testid="consultant-apply-cta"
                >
                  Become a Consultant Partner
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8">
                <p className="text-gray-400 text-sm mb-4">You can recommend:</p>
                <div className="grid grid-cols-2 gap-4">
                  {modules.map((mod) => (
                    <div key={mod.name} className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                      <mod.icon className="w-5 h-5 text-green-400" />
                      <span className="text-white text-sm">{mod.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-4">+ 11 more modules</p>
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
                Built for Business Advisors
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You already advise businesses on how to improve. Now give them the actual tools to do it — and earn commission while helping them succeed.
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
              <h3 className="font-bold text-gray-900 mb-4">Common Client Situations</h3>
              <div className="space-y-4 text-gray-600">
                <p>"My client has no idea how much profit they are making."</p>
                <p>"They track inventory in their head — always running out of stock."</p>
                <p>"Staff steal because there is no proper system."</p>
                <p>"They want to sell online but do not know how."</p>
                <p className="font-medium text-gray-900 pt-4">WebWaka solves these problems. You implement it.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How You Help */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How You Help Clients
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {howYouHelp.map((step, idx) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Consultant Partner Benefits
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

      {/* Earning Model */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            How You Earn
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Consulting Fees</h3>
              <p className="text-gray-600 mb-4">Charge your clients for assessment, implementation, and training. Set your own rates.</p>
              <p className="text-2xl font-bold text-gray-900">Your Rate</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Recurring Commission</h3>
              <p className="text-gray-600 mb-4">Earn commission on every module your client subscribes to. Paid monthly.</p>
              <p className="text-2xl font-bold text-green-600">Up to 25%</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Add WebWaka to Your Services
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Help your clients implement real change. Earn while you do it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact?type=partner&partner_type=consultant"
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
