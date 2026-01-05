/**
 * WebWaka About Page
 * Company story, mission, and team
 */

import Link from 'next/link'
import { 
  ArrowRight, Globe, Heart, Users, Target, Lightbulb,
  Shield, Zap, MapPin
} from 'lucide-react'

export const metadata = {
  title: 'About — WebWaka Platform',
  description: 'Learn about WebWaka and HandyLife Digital. Our mission is to build inclusive digital infrastructure for African organizations.',
}

const values = [
  {
    icon: Target,
    title: 'Accessibility First',
    description: 'We build tools that work for everyone, regardless of technical background, infrastructure limitations, or budget constraints.',
  },
  {
    icon: Heart,
    title: 'Community Focused',
    description: 'Our success is measured by the impact we have on communities. Every feature we build serves a real need.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We earn trust through transparency. Your data is yours. Our pricing is clear. Our roadmap is open.',
  },
  {
    icon: Lightbulb,
    title: 'Continuous Innovation',
    description: 'We are constantly learning, iterating, and improving. Feedback from our users shapes our product.',
  },
]

const timeline = [
  { year: '2020', title: 'HandyLife Digital Founded', description: 'Started with a mission to bridge the digital divide in Africa.' },
  { year: '2021', title: 'WebWaka Commerce Suite', description: 'Launched our first product — POS and inventory for Nigerian businesses.' },
  { year: '2022', title: 'Multi-Module Platform', description: 'Expanded to 15+ business modules including accounting, CRM, and logistics.' },
  { year: '2023', title: 'Partner Network', description: 'Built a network of Digital Transformation Partners across Nigeria.' },
  { year: '2024', title: 'Multi-Industry Vision', description: 'Announced expansion beyond commerce to Education, Health, Civic, and more.' },
  { year: '2025', title: 'WebWaka Platform', description: 'Rebranded as a horizontal platform serving multiple industries across Africa.' },
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Our Story
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Building Digital
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Infrastructure for Africa
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              WebWaka is powered by HandyLife Digital, a social enterprise committed to making digital tools accessible to every organization in Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                We believe every organization — from the smallest shop to the largest institution — deserves access to powerful digital tools. Our mission is to build that bridge.
              </p>
              <p className="text-gray-600 mb-6">
                Too often, digital transformation is out of reach for African businesses and organizations. Complex software, unreliable infrastructure, and high costs create barriers that exclude millions from the digital economy.
              </p>
              <p className="text-gray-600">
                WebWaka changes that. We build modular, offline-first tools that work in the real conditions of African markets. Tools that are simple enough for anyone to use, yet powerful enough to transform how organizations operate.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">HandyLife Digital</h3>
                <p className="text-green-600 font-medium mb-4">Technology for Social Impact</p>
                <p className="text-gray-600 text-sm">
                  A social enterprise building digital infrastructure for African communities.
                </p>
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
              These principles guide everything we do — from product decisions to partner relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value) => (
              <div 
                key={value.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From a simple idea to a platform serving organizations across Africa.
            </p>
          </div>

          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {item.year}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Based in Nigeria, Serving Africa
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our headquarters are in Nigeria, at the heart of Africa&apos;s largest economy. We understand the market because we are part of it.
              </p>
              <p className="text-gray-600 mb-8">
                Our team includes engineers, designers, and business experts who have lived the challenges of operating in African markets. This first-hand experience shapes every feature we build.
              </p>

              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-green-800 font-semibold">Growing Team</p>
                  <p className="text-green-600 text-sm">Building for Africa</p>
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
            Join Our Journey
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            Whether as a user, partner, or team member — there&apos;s a place for you in the WebWaka story.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup-v2"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners"
              className="w-full sm:w-auto px-8 py-4 bg-green-500/30 hover:bg-green-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
