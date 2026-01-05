/**
 * WebWaka Impact Page
 * 
 * POSITIONING: Partner-First Social Impact
 * WebWaka's social impact is delivered through Partners.
 * Partners create jobs, transfer skills, and serve their communities.
 */

import Link from 'next/link'
import { 
  ArrowRight, Globe, Users, Heart, Zap,
  Building2, TrendingUp, Target, Sparkles,
  GraduationCap, Store, Landmark, Briefcase
} from 'lucide-react'

export const metadata = {
  title: 'Impact — WebWaka Platform',
  description: 'How WebWaka creates impact through the Partner-first model. Job creation, skill transfer, and digital inclusion across Africa.',
}

const impactAreas = [
  {
    icon: Users,
    title: 'Job Creation',
    description: 'Every WebWaka Partner is an entrepreneur. Partners employ sales staff, support teams, and implementation specialists. One platform, many jobs.',
  },
  {
    icon: Sparkles,
    title: 'Skill Transfer',
    description: 'Partners learn to configure, deploy, and support enterprise software. These transferable skills create opportunities beyond WebWaka.',
  },
  {
    icon: Building2,
    title: 'Local Business Growth',
    description: 'Partners build sustainable businesses serving their communities. Recurring revenue from client subscriptions creates stable income.',
  },
  {
    icon: Target,
    title: 'Digital Inclusion',
    description: 'Through Partners, enterprise-grade tools reach organizations that would never access them directly—corner shops, community groups, local clinics.',
  },
]

const industries = [
  { icon: Store, name: 'Commerce', description: 'Retail shops, markets, wholesalers gaining digital tools' },
  { icon: GraduationCap, name: 'Education', description: 'Schools managing students, fees, and learning digitally' },
  { icon: Heart, name: 'Healthcare', description: 'Clinics and pharmacies with proper records and inventory' },
  { icon: Landmark, name: 'Civic', description: 'Cooperatives and associations with transparent finances' },
]

const partnerImpactModel = [
  { title: 'WebWaka Provides', items: ['Platform infrastructure', 'Training & certification', 'Partner support', 'Continuous updates'] },
  { title: 'Partners Create', items: ['Local jobs', 'Client relationships', 'Implementation expertise', 'Ongoing support'] },
  { title: 'Organizations Gain', items: ['Digital operations', 'Business insights', 'Efficiency improvements', 'Growth opportunities'] },
]

export default function ImpactPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-purple-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full text-purple-300 text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              Social Impact
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Impact Through
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Partners
              </span>
            </h1>

            <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto mb-10">
              WebWaka creates impact not by selling directly, but by enabling local entrepreneurs to build businesses that serve their communities.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Model */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Partner Impact Model
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our impact multiplies through Partners. We build once, Partners serve many.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {partnerImpactModel.map((column, index) => (
              <div key={column.title} className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  index === 0 ? 'bg-purple-100' : index === 1 ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    index === 0 ? 'text-purple-600' : index === 1 ? 'text-emerald-600' : 'text-blue-600'
                  }`}>{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{column.title}</h3>
                <ul className="space-y-2">
                  {column.items.map((item) => (
                    <li key={item} className="text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 rounded-full text-purple-800">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">1 Platform → Many Partners → Countless Organizations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How We Create Impact
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The Partner-first model creates multiple layers of impact across communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {impactAreas.map((area) => (
              <div 
                key={area.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                  <area.icon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{area.title}</h3>
                <p className="text-gray-600">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transforming Every Sector
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Partners deploy WebWaka across industries, bringing digital tools to organizations that need them most.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry) => (
              <div 
                key={industry.name}
                className="bg-purple-50 rounded-2xl p-6 text-center hover:bg-purple-100 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <industry.icon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{industry.name}</h3>
                <p className="text-gray-600 text-sm">{industry.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/suites"
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Explore all industry suites
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">7</div>
              <p className="text-purple-300">Industry Suites</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">18+</div>
              <p className="text-purple-300">Capabilities</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">∞</div>
              <p className="text-purple-300">Partner Potential</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">1</div>
              <p className="text-purple-300">Mission</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Success */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
                <Briefcase className="w-4 h-4" />
                Partner Success
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                When Partners Succeed, Communities Thrive
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our impact isn&apos;t measured just in platform metrics. It&apos;s measured in Partner businesses built, jobs created, and communities served.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Every Partner who builds a sustainable business on WebWaka is proof that the model works. They&apos;re not just resellers—they&apos;re platform operators building their own SaaS companies.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Partners set their own pricing and build margins</p>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Partners own client relationships completely</p>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Partners expand by adding more clients and services</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Become a Partner</h3>
                <p className="text-gray-600 mb-6">Build your own platform business and create impact in your community.</p>
                <Link 
                  href="/partners/get-started"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Be Part of the Impact
          </h2>
          <p className="text-lg md:text-xl text-purple-100 mb-10">
            Join the WebWaka Partner network. Build a business that transforms organizations in your community while creating sustainable income for yourself.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-white text-purple-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners/playbook"
              className="w-full sm:w-auto px-8 py-4 bg-purple-500/30 hover:bg-purple-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Read the Playbook
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
