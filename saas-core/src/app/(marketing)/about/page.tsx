/**
 * About Page
 * Mission-driven story for Nigerian market
 */

import Link from 'next/link'
import { Target, Heart, Globe, Users, ArrowRight, Zap, Shield } from 'lucide-react'

export const metadata = {
  title: 'About - eMarketWaka',
  description: 'Learn about eMarketWaka and our mission to help Nigerian businesses grow with simple technology.',
}

const values = [
  {
    icon: Target,
    title: 'Simplicity First',
    desc: 'Technology should be easy to use. We build tools that work for everyone, not just tech experts.',
  },
  {
    icon: Heart,
    title: 'Customer Success',
    desc: 'Your success is our success. Every feature we build starts with one question: will this help our users grow?',
  },
  {
    icon: Globe,
    title: 'Built for Nigeria',
    desc: 'We understand Nigerian business realities. Offline mode, multiple payment options, local support.',
  },
  {
    icon: Shield,
    title: 'Reliability',
    desc: 'Your business depends on us. We take that seriously. Secure, stable, and always improving.',
  },
]

const stats = [
  { value: '5,000+', label: 'Businesses Using eMarketWaka' },
  { value: '36', label: 'States Covered' },
  { value: '₦1B+', label: 'In Transactions Processed' },
  { value: '24/7', label: 'Support Available' },
]

const timeline = [
  {
    year: '2023',
    title: 'The Beginning',
    desc: 'Started with a simple question: why is business software so hard to use?',
  },
  {
    year: '2024',
    title: 'First 1,000 Businesses',
    desc: 'Launched in Lagos and quickly expanded across Nigeria as word spread.',
  },
  {
    year: '2025',
    title: 'Growing Together',
    desc: 'Now serving thousands of businesses and building the future of Nigerian commerce.',
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Helping Nigerian Businesses
            <br />
            <span className="text-green-400">Grow & Thrive</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            We believe every business, no matter how small, deserves powerful tools to succeed.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              eMarketWaka was born from a simple observation: Nigerian businesses deserve better tools. 
              We saw shop owners tracking sales in exercise books, market traders struggling with unreliable 
              apps, and supermarkets paying too much for complicated systems.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              So we built something different. A platform that works the way Nigerian businesses actually 
              work — offline when network fails, simple enough for anyone to use, and affordable enough 
              for even the smallest shop.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Today, thousands of businesses across Nigeria use eMarketWaka to manage their daily operations. 
              From market traders in Mile 12 to supermarkets in Abuja, from restaurants in Port Harcourt to 
              phone shops in Kano — we are proud to serve them all.
            </p>
            <p className="text-gray-900 text-lg leading-relaxed font-semibold">
              Our mission is simple: make it easy for every Nigerian business to grow with technology.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-green-100 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What We Believe
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Journey
          </h2>
          
          <div className="space-y-8">
            {timeline.map((item, idx) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-sm">
                    {item.year}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-green-200 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Built by People Who Care
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Our team is made up of people who've run businesses, worked in markets, and understand 
            the daily challenges Nigerian businesses face. We're not just building software — 
            we are building tools for our own community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
            >
              Get in Touch
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-green-200 hover:text-green-600 transition-all"
            >
              Join as Partner
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Join thousands of Nigerian businesses using eMarketWaka. Start free today.
          </p>
          <Link 
            href="/login?signup=true"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg"
            data-testid="about-cta"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
