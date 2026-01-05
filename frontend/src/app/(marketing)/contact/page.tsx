/**
 * WebWaka Contact Page
 * 
 * POSITIONING: Partner-First Contact
 * Primary focus on Partner inquiries. End-users are directed to find a Partner.
 */

import Link from 'next/link'
import { 
  ArrowRight, Globe, Phone, Mail, MessageCircle, MapPin,
  Clock, Users
} from 'lucide-react'

export const metadata = {
  title: 'Contact — WebWaka Platform',
  description: 'Get in touch with the WebWaka team. Partner inquiries, support, and general questions.',
}

const contactMethods = [
  {
    icon: Mail,
    title: 'Partner Inquiries',
    description: 'Interested in becoming a Partner?',
    value: 'partners@webwaka.com',
    href: 'mailto:partners@webwaka.com',
  },
  {
    icon: Phone,
    title: 'Phone',
    description: 'Speak with our team',
    value: '+234 800 000 0000',
    href: 'tel:+2348000000000',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Quick questions',
    value: '+234 800 000 0000',
    href: 'https://wa.me/2348000000000',
  },
]

const departments = [
  {
    name: 'Partner Program',
    email: 'partners@webwaka.com',
    description: 'Becoming a Partner, Partner certification, business inquiries',
  },
  {
    name: 'Partner Support',
    email: 'support@webwaka.com',
    description: 'Technical support for existing Partners',
  },
  {
    name: 'General Inquiries',
    email: 'hello@webwaka.com',
    description: 'Press, media, and general questions',
  },
]

export default function ContactPage() {
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
              <MessageCircle className="w-4 h-4" />
              Get in Touch
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Let&apos;s
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Connect
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Interested in becoming a WebWaka Partner? Have questions about the platform? We&apos;re here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method) => (
              <a 
                key={method.title}
                href={method.href}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                <p className="text-gray-500 text-sm mb-2">{method.description}</p>
                <p className="text-emerald-600 font-medium">{method.value}</p>
              </a>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-white"
                  >
                    <option value="">Select a subject</option>
                    <option value="partnership">Becoming a Partner</option>
                    <option value="partner-support">Partner Support</option>
                    <option value="platform-question">Platform Questions</option>
                    <option value="media">Press / Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  Send Message
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Departments & Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact by Department</h2>
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div 
                      key={dept.name}
                      className="bg-white rounded-xl p-4 border border-gray-100"
                    >
                      <h3 className="font-bold text-gray-900">{dept.name}</h3>
                      <p className="text-gray-500 text-sm mb-2">{dept.description}</p>
                      <a 
                        href={`mailto:${dept.email}`}
                        className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                      >
                        {dept.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Office Location</h3>
                <div className="flex items-start gap-3 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Lagos, Nigeria</p>
                    <p className="text-sm text-gray-500">West Africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Monday - Friday</p>
                    <p className="text-sm text-gray-500">9:00 AM - 6:00 PM WAT</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Ready to Become a Partner?</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Skip the form and start your Partner application directly.
                    </p>
                    <Link 
                      href="/partners/get-started"
                      className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                    >
                      Apply Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Looking for a WebWaka Solution?</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      WebWaka platforms are delivered by certified Partners in your area. Contact us to be connected with a Partner.
                    </p>
                    <p className="text-gray-500 text-sm">
                      Email: <a href="mailto:hello@webwaka.com" className="text-emerald-600 hover:underline">hello@webwaka.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Build Your Platform Business?
          </h2>
          <p className="text-gray-400 mb-8">
            Join the WebWaka Partner network and start building recurring revenue.
          </p>
          <Link 
            href="/partners/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all"
          >
            Become a Partner
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
