/**
 * WebWaka Impact Page
 * Social impact, HandyLife Digital mission, and community focus
 */

import Link from 'next/link'
import { 
  ArrowRight, Globe, Heart, Users, Lightbulb, Target,
  Wifi, GraduationCap, Store, Landmark, Shield, Zap
} from 'lucide-react'

export const metadata = {
  title: 'Impact — WebWaka Platform',
  description: 'WebWaka is powered by HandyLife Digital, a social enterprise committed to building inclusive digital infrastructure for African communities.',
}

const impactAreas = [
  {
    icon: Users,
    title: 'Economic Inclusion',
    description: 'Enabling informal businesses to access digital tools traditionally reserved for large enterprises. No one is left behind.',
  },
  {
    icon: GraduationCap,
    title: 'Digital Literacy',
    description: 'Building tools that are simple enough for anyone to use, while providing pathways to deeper digital skills.',
  },
  {
    icon: Wifi,
    title: 'Connectivity Bridge',
    description: 'Offline-first design ensures that unreliable internet does not prevent anyone from running their organization.',
  },
  {
    icon: Shield,
    title: 'Data Sovereignty',
    description: 'African data stays in Africa. We prioritize local data centers and compliance with regional regulations.',
  },
]

const missionPillars = [
  {
    title: 'Accessibility',
    description: 'Tools that work for everyone, regardless of technical background or infrastructure limitations.',
    icon: Target,
  },
  {
    title: 'Sustainability',
    description: 'Building for the long term with business models that support continuous improvement.',
    icon: Lightbulb,
  },
  {
    title: 'Community',
    description: 'Partnering with local organizations, DTPs, and communities to extend our reach.',
    icon: Heart,
  },
]

const industries = [
  { name: 'Commerce', icon: Store, description: 'Shops, markets, retailers' },
  { name: 'Education', icon: GraduationCap, description: 'Schools, training centers' },
  { name: 'Health', icon: Heart, description: 'Clinics, pharmacies' },
  { name: 'Civic', icon: Landmark, description: 'Community organizations' },
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
              Powered by HandyLife Digital
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Technology for
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Social Impact
              </span>
            </h1>

            <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto mb-10">
              WebWaka is more than a platform. It is a commitment to building inclusive digital infrastructure that empowers African communities to thrive.
            </p>
          </div>
        </div>
      </section>

      {/* HandyLife Digital Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
                <Globe className="w-4 h-4" />
                Our Parent Organization
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                HandyLife Digital
              </h2>
              
              <p className="text-lg text-gray-600 mb-6">
                HandyLife Digital is a social enterprise dedicated to building digital infrastructure for African communities. We believe that technology should be a bridge, not a barrier.
              </p>
              
              <p className="text-gray-600 mb-8">
                Through WebWaka, we are creating modular, accessible tools that enable organizations of all sizes — from small shops to large institutions — to digitize their operations without requiring expensive consultants or complex implementations.
              </p>

              <div className="space-y-4">
                {missionPillars.map((pillar) => (
                  <div key={pillar.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <pillar.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{pillar.title}</h4>
                      <p className="text-gray-600 text-sm">{pillar.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">HandyLife Digital</h3>
                <p className="text-purple-600 font-medium mb-4">Technology for Social Impact</p>
                <p className="text-gray-600 text-sm">
                  Building digital infrastructure for African communities since 2020.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact Areas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature we build, every decision we make, is guided by our commitment to creating positive impact in African communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {impactAreas.map((area) => (
              <div 
                key={area.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                  <area.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{area.title}</h3>
                <p className="text-gray-600">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Serving Every Sector
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From commerce to civic organizations, we are building tools that serve the full spectrum of African society.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry) => (
              <div 
                key={industry.name}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-purple-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <industry.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{industry.name}</h3>
                <p className="text-gray-600 text-sm">{industry.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/suites"
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Explore all suites
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
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">7+</div>
              <p className="text-purple-300">Industry Suites</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">36</div>
              <p className="text-purple-300">Nigerian States</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100+</div>
              <p className="text-purple-300">Partner DTPs</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">∞</div>
              <p className="text-purple-300">Possibilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner With Us */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Join Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Whether you are an organization looking for digital tools, a partner wanting to extend our reach, or a developer interested in building on our platform — there is a place for you in the WebWaka community.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Become a Digital Transformation Partner (DTP)</p>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Build on the WebWaka platform</p>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">Support our social impact initiatives</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/partners"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                >
                  Become a Partner
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-purple-800 font-semibold">Building Together</p>
                  <p className="text-purple-600 text-sm">For African Communities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Be Part of the Change
          </h2>
          <p className="text-lg md:text-xl text-purple-100 mb-10">
            Every organization that joins WebWaka contributes to our mission of digital inclusion. 
            Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup-v2"
              className="w-full sm:w-auto px-8 py-4 bg-white text-purple-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/about"
              className="w-full sm:w-auto px-8 py-4 bg-purple-500/30 hover:bg-purple-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
