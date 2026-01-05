/**
 * WebWaka About Page
 * 
 * POSITIONING: Partner-First Platform Infrastructure
 * About HandyLife Digital and the WebWaka platform.
 * Emphasizes the Partner ecosystem and social impact mission.
 */

import Link from 'next/link'
import { 
  ArrowRight, Globe, Users, Target, Heart, Zap,
  Building2, TrendingUp, Shield, Sparkles
} from 'lucide-react'

export const metadata = {
  title: 'About Us — WebWaka Platform',
  description: 'Learn about WebWaka, powered by HandyLife Digital. Building Africa\'s digital infrastructure through a Partner-first ecosystem.',
}

const values = [
  {
    icon: Users,
    title: 'Partner-First',
    description: 'We build for Partners. Partners build for their clients. This creates jobs, transfers skills, and scales impact across communities.',
  },
  {
    icon: Globe,
    title: 'African Context',
    description: 'Designed for African realities—offline-first, mobile-first, and built to work in challenging infrastructure environments.',
  },
  {
    icon: Heart,
    title: 'Social Impact',
    description: 'Every organization on WebWaka contributes to digital inclusion. We measure success by lives improved, not just revenue.',
  },
  {
    icon: Shield,
    title: 'Enterprise Quality',
    description: 'World-class infrastructure for every organization, regardless of size. No compromises on security, reliability, or performance.',
  },
]

const timeline = [
  { year: '2023', event: 'HandyLife Digital founded with mission to democratize enterprise software' },
  { year: '2024', event: 'WebWaka platform launched with Partner-first model' },
  { year: '2025', event: 'Expanded to 7 industry suites, 18+ capabilities' },
  { year: 'Future', event: 'Scaling across Africa through Partner network' },
]

const team = [
  { role: 'Mission', description: 'Building digital infrastructure that serves every African organization through local Partners' },
  { role: 'Approach', description: 'Partner-operated, multi-tenant platform that creates entrepreneurs and transfers skills' },
  { role: 'Impact', description: 'Measuring success by organizations served, jobs created, and communities transformed' },
]

export default function AboutPage() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              About WebWaka
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Building Africa&apos;s
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Digital Infrastructure
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              WebWaka is Partner-first platform infrastructure, powered by HandyLife Digital. We enable local entrepreneurs to build and operate digital platforms for their communities.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
                <Target className="w-4 h-4" />
                Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Enterprise Software for Every Organization
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                We believe every African organization—from corner shops to cooperatives, clinics to schools—deserves access to world-class digital tools.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                But we also believe the best way to deliver this isn&apos;t through a centralized SaaS. It&apos;s through local Partners who understand their communities, speak their language, and can provide hands-on support.
              </p>
              <p className="text-lg text-gray-600">
                WebWaka provides the infrastructure. Partners provide the relationship. Together, we transform organizations.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">HandyLife Digital</h3>
                <p className="text-purple-600">The company behind WebWaka</p>
              </div>
              
              <div className="space-y-4">
                {team.map((item) => (
                  <div key={item.role} className="bg-white rounded-xl p-4 border border-purple-100">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.role}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide every decision we make at WebWaka.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value) => (
              <div 
                key={value.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Model Explanation */}
      <section className="py-20 md:py-28 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Partner-First?
            </h2>
            <p className="text-lg text-emerald-100 max-w-3xl mx-auto">
              We chose a Partner-first model intentionally. Here&apos;s why it matters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Job Creation</h3>
              <p className="text-emerald-100 text-sm">
                Every Partner is an entrepreneur. We don&apos;t just serve clients—we create business owners who employ others in their communities.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Skill Transfer</h3>
              <p className="text-emerald-100 text-sm">
                Partners learn to configure, deploy, and support enterprise software. These skills transfer to other opportunities.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Local Context</h3>
              <p className="text-emerald-100 text-sm">
                Partners understand their communities better than any centralized company could. They provide support in local languages, with local knowledge.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/partners/playbook"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg transition-all hover:bg-emerald-50"
            >
              Read the Partner Playbook
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={item.year} className="flex items-start gap-6">
                  <div className="w-20 flex-shrink-0">
                    <span className={`text-lg font-bold ${
                      index === timeline.length - 1 ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {item.year}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-600 mt-2 -ml-7 absolute" />
                    <p className="text-gray-600 pl-4 border-l-2 border-gray-200">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-gray-900 to-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join the WebWaka Partner Network
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Be part of the movement to transform African organizations. Build your own SaaS business on WebWaka infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
