/**
 * WebWaka Suites Page
 * 
 * POSITIONING: Partner-Delivered Platform Configurations
 * Suites are NOT products to sell. They are platform configurations that Partners
 * activate and deliver to their clients based on organizational needs.
 * 
 * All suites are ACTIVE and AVAILABLE. No "coming soon" language.
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck,
  ShoppingCart, Package, Users, BookOpen, Activity, Pill,
  Building, Wallet, UtensilsCrossed, Bed, Warehouse, Navigation
} from 'lucide-react'

export const metadata = {
  title: 'Industry Suites — WebWaka Platform',
  description: 'Multi-industry platform configurations that Partners deploy for their clients. Commerce, Education, Health, Civic, Hospitality, and Logistics suites available.',
}

const suites = [
  {
    id: 'commerce',
    name: 'Commerce Suite',
    tagline: 'For retail, wholesale, and marketplace operations',
    icon: Store,
    color: 'emerald',
    description: 'Complete commerce infrastructure for Partners to deploy to retail businesses, wholesalers, and marketplace operators.',
    capabilities: [
      { icon: ShoppingCart, name: 'Point of Sale', desc: 'Fast, offline-capable transactions' },
      { icon: Package, name: 'Inventory Management', desc: 'Stock tracking, alerts, multi-location' },
      { icon: Store, name: 'Online Store', desc: 'E-commerce storefronts' },
      { icon: Users, name: 'Customer Management', desc: 'CRM, loyalty, engagement' },
    ],
    useCases: ['Retail shops', 'Supermarkets', 'Wholesalers', 'Online stores', 'Marketplaces'],
  },
  {
    id: 'education',
    name: 'Education Suite',
    tagline: 'For schools, training centers, and educational institutions',
    icon: GraduationCap,
    color: 'blue',
    description: 'Comprehensive school management infrastructure for Partners serving educational institutions of all sizes.',
    capabilities: [
      { icon: Users, name: 'Student Management', desc: 'Enrollment, records, attendance' },
      { icon: BookOpen, name: 'Academic Management', desc: 'Classes, grading, assessments' },
      { icon: Wallet, name: 'Fee Management', desc: 'Billing, payments, statements' },
      { icon: Users, name: 'Staff Management', desc: 'HR, payroll, performance' },
    ],
    useCases: ['Primary schools', 'Secondary schools', 'Universities', 'Training centers', 'Tutoring services'],
  },
  {
    id: 'health',
    name: 'Health Suite',
    tagline: 'For clinics, pharmacies, and healthcare providers',
    icon: Heart,
    color: 'red',
    description: 'Healthcare management infrastructure for Partners serving medical facilities and pharmacies.',
    capabilities: [
      { icon: Users, name: 'Patient Records', desc: 'EHR, history, appointments' },
      { icon: Activity, name: 'Clinical Management', desc: 'Consultations, diagnoses, treatments' },
      { icon: Pill, name: 'Pharmacy Management', desc: 'Inventory, dispensing, prescriptions' },
      { icon: Wallet, name: 'Billing & Insurance', desc: 'Invoicing, HMO integration' },
    ],
    useCases: ['Clinics', 'Hospitals', 'Pharmacies', 'Diagnostic centers', 'Specialist practices'],
  },
  {
    id: 'civic',
    name: 'Civic Suite',
    tagline: 'For associations, cooperatives, and community organizations',
    icon: Landmark,
    color: 'purple',
    description: 'Community finance and membership infrastructure for Partners serving associations, cooperatives, and civic groups.',
    capabilities: [
      { icon: Users, name: 'Member Management', desc: 'Registration, profiles, groups' },
      { icon: Wallet, name: 'Financial Services', desc: 'Savings, loans, contributions' },
      { icon: Building, name: 'Organization Management', desc: 'Governance, meetings, voting' },
      { icon: Activity, name: 'Activity Tracking', desc: 'Events, projects, reporting' },
    ],
    useCases: ['Cooperatives', 'Trade associations', 'Alumni groups', 'Religious organizations', 'Community unions'],
  },
  {
    id: 'hospitality',
    name: 'Hospitality Suite',
    tagline: 'For hotels, restaurants, and event venues',
    icon: Hotel,
    color: 'amber',
    description: 'Hospitality management infrastructure for Partners serving hotels, restaurants, and event businesses.',
    capabilities: [
      { icon: Bed, name: 'Reservations', desc: 'Booking, availability, rooms' },
      { icon: UtensilsCrossed, name: 'F&B Management', desc: 'Orders, kitchen, service' },
      { icon: Users, name: 'Guest Management', desc: 'Check-in, profiles, preferences' },
      { icon: Wallet, name: 'Revenue Management', desc: 'Pricing, billing, reporting' },
    ],
    useCases: ['Hotels', 'Restaurants', 'Event centers', 'Bars & lounges', 'Resorts'],
  },
  {
    id: 'logistics',
    name: 'Logistics Suite',
    tagline: 'For delivery, fleet, and warehouse operations',
    icon: Truck,
    color: 'orange',
    description: 'Logistics and supply chain infrastructure for Partners serving delivery, transport, and warehousing businesses.',
    capabilities: [
      { icon: Navigation, name: 'Fleet Management', desc: 'Vehicles, drivers, routes' },
      { icon: Package, name: 'Delivery Management', desc: 'Orders, tracking, POD' },
      { icon: Warehouse, name: 'Warehouse Management', desc: 'Inventory, picking, shipping' },
      { icon: Activity, name: 'Operations Analytics', desc: 'Performance, costs, optimization' },
    ],
    useCases: ['Delivery companies', 'Transport fleets', 'Warehouses', 'Fulfillment centers', '3PL providers'],
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-100' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-100' },
  red: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-100' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-100' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-100' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-100' },
}

export default function SuitesPage() {
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
              <Layers className="w-4 h-4" />
              Industry Suites
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Multi-Industry
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Platform Configurations
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Every suite is active and configurable. Partners select, configure, and deliver the right combination for each client&apos;s organizational needs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/partners/get-started"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                data-testid="suites-cta-become-partner"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/capabilities"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all backdrop-blur-sm"
              >
                View All Capabilities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-8 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 text-center">
            <Globe className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800">
              <strong>Partner-Delivered:</strong> All suites are configured and deployed by WebWaka Partners for their clients. 
              <Link href="/partners" className="ml-2 underline hover:no-underline">
                Learn about becoming a Partner →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Suites Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Available Industry Suites
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each suite comes with pre-configured capabilities optimized for specific industries. Partners can further customize based on client requirements.
            </p>
          </div>

          <div className="space-y-16">
            {suites.map((suite, index) => {
              const colors = colorClasses[suite.color]
              return (
                <div 
                  key={suite.id}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.light} ${colors.text} text-sm font-medium mb-4`}>
                      <suite.icon className="w-4 h-4" />
                      {suite.name}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      {suite.tagline}
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      {suite.description}
                    </p>

                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-500 mb-3">Ideal for:</p>
                      <div className="flex flex-wrap gap-2">
                        {suite.useCases.map((useCase) => (
                          <span 
                            key={useCase}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Available for Partner deployment</span>
                    </div>
                  </div>

                  <div className={`bg-gray-50 rounded-2xl p-6 border border-gray-100 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <h4 className="font-semibold text-gray-900 mb-4">Included Capabilities</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {suite.capabilities.map((cap) => (
                        <div 
                          key={cap.name}
                          className="bg-white rounded-xl p-4 border border-gray-100"
                        >
                          <div className={`w-10 h-10 rounded-lg ${colors.light} flex items-center justify-center mb-3`}>
                            <cap.icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">{cap.name}</h5>
                          <p className="text-gray-600 text-xs">{cap.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Partners Deploy Suites
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              WebWaka Partners configure and deliver suite-based platforms to their clients.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Select Suite', desc: 'Partner chooses the primary suite for client industry' },
              { step: 2, title: 'Configure Capabilities', desc: 'Activate additional capabilities as needed' },
              { step: 3, title: 'Brand & Customize', desc: 'Apply client branding and configurations' },
              { step: 4, title: 'Deploy & Support', desc: 'Launch platform and provide ongoing support' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Deliver Industry Solutions?
          </h2>
          <p className="text-lg md:text-xl text-emerald-100 mb-10">
            Join the WebWaka Partner network. Deploy industry-specific platforms for your clients with white-label branding and your own pricing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners/get-started"
              className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-700 font-bold rounded-lg text-lg transition-all shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners/playbook"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Read the Playbook
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
