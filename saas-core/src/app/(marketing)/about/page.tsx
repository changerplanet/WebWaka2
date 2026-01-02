/**
 * About Page
 * Company story and mission
 */

import Link from 'next/link'
import { Target, Heart, Globe, Users, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'About - eMarketWaka',
  description: 'Learn about eMarketWaka and our mission to empower African businesses.',
}

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    desc: 'We exist to empower African businesses with technology that was previously only available to large corporations.',
  },
  {
    icon: Heart,
    title: 'Customer First',
    desc: 'Every decision we make starts with one question: how does this help our merchants succeed?',
  },
  {
    icon: Globe,
    title: 'Built for Africa',
    desc: 'We understand the unique challenges of doing business in Africa and build solutions that work here.',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'We believe in the power of community and building together with our merchants and partners.',
  },
]

const stats = [
  { value: '10,000+', label: 'Merchants' },
  { value: '25+', label: 'Countries' },
  { value: '$50M+', label: 'Transactions Processed' },
  { value: '99.9%', label: 'Uptime' },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Empowering African
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Commerce</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            We're building the commerce infrastructure that Africa deserves.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              eMarketWaka was born from a simple observation: while global commerce platforms were thriving, 
              African businesses were left with tools that didn't understand their reality.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              From unreliable internet connections to diverse payment methods like mobile money, 
              from multi-currency challenges to unique market dynamics — we saw an opportunity 
              to build something better.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Today, eMarketWaka powers thousands of businesses across Africa — from small 
              roadside shops to large marketplace operators. We provide the same powerful 
              commerce tools that global enterprises enjoy, but designed specifically for 
              African businesses.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed">
              Our mission is simple: <strong>make it easy for anyone in Africa to sell anything, 
              anywhere.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Our Values
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Built by a Passionate Team
          </h2>
          <p className="text-lg text-slate-600 mb-10">
            Our team spans multiple countries across Africa, bringing together diverse 
            perspectives and deep understanding of local markets. We're engineers, 
            designers, and business experts united by a common goal.
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
          >
            Join Our Team
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join thousands of merchants across Africa using eMarketWaka.
          </p>
          <Link 
            href="/login?signup=true"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition-all"
            data-testid="about-cta"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
