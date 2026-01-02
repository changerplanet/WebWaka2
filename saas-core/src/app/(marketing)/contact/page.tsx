/**
 * Contact Page
 * Contact form and information
 */

'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react'

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    type: 'general',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('submitting')
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setFormState('success')
    setFormData({ name: '', email: '', company: '', type: 'general', message: '' })
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get in
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Touch</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email</h3>
                    <p className="text-slate-600">hello@emarketwaka.com</p>
                    <p className="text-slate-600">support@emarketwaka.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Phone</h3>
                    <p className="text-slate-600">+254 700 000 000</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Office</h3>
                    <p className="text-slate-600">Nairobi, Kenya</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-slate-50 rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-2">Business Hours</h3>
                <p className="text-slate-600">Monday - Friday: 8am - 6pm EAT</p>
                <p className="text-slate-600">Saturday: 9am - 1pm EAT</p>
                <p className="text-slate-600">Sunday: Closed</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                {formState === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-slate-600 mb-6">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setFormState('idle')}
                      className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="John Doe"
                          data-testid="contact-name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="john@example.com"
                          data-testid="contact-email"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Your Company"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Inquiry Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="sales">Sales</option>
                          <option value="support">Support</option>
                          <option value="partner">Partnership</option>
                          <option value="press">Press</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        placeholder="How can we help you?"
                        data-testid="contact-message"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                      data-testid="contact-submit"
                    >
                      {formState === 'submitting' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
