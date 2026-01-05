/**
 * WebWaka Suites Page
 * All suites are available platform configurations - no "Coming Soon" labels
 * Deployment varies by organization, not availability
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Zap,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck, Users,
  ShoppingCart, Package, Calculator, BarChart3, Megaphone, 
  CreditCard, UserCheck, ClipboardList, Building
} from 'lucide-react'

export const metadata = {
  title: 'Suites — WebWaka Platform',
  description: 'Explore WebWaka Suites: Commerce, Education, Health, Civic, Hospitality, Logistics, and Community. All suites are built on the same powerful platform and configured based on your organizational needs.',
}

// All suites are available - deployment scope depends on client needs
const suites = [
  {
    id: 'commerce',
    name: 'Commerce Suite',
    tagline: 'Sell Anywhere, Manage Everything',
    icon: Store,
    color: 'green',
    description: 'Complete business management for retail, wholesale, and e-commerce operations. From single shops to multi-vendor marketplaces, the Commerce Suite provides all the tools needed to sell, track, and grow.',
    capabilities: [
      { icon: ShoppingCart, name: 'Point of Sale (POS)', description: 'One-tap checkout, works offline' },
      { icon: Package, name: 'Inventory Management', description: 'Multi-location stock tracking' },
      { icon: Store, name: 'Online Store', description: 'Sell on web & WhatsApp' },
      { icon: Users, name: 'Marketplace', description: 'Multi-vendor platform' },
      { icon: Calculator, name: 'Accounting', description: 'Double-entry bookkeeping' },
      { icon: UserCheck, name: 'CRM', description: 'Customer segmentation & loyalty' },
      { icon: Truck, name: 'Logistics', description: 'Delivery management' },
      { icon: BarChart3, name: 'Analytics', description: 'Business intelligence' },
    ],
    targetAudience: ['Retail shops', 'Supermarkets', 'Wholesale distributors', 'Online sellers', 'Marketplace operators'],
    deploymentNote: 'Configured based on business size and operational complexity. Partners assist with setup and training.',
  },
  {
    id: 'education',
    name: 'Education Suite',
    tagline: 'Empowering African Education',
    icon: GraduationCap,
    color: 'blue',
    description: 'Comprehensive school management and learning administration tools. Simplify attendance, grading, fee collection, and parent communication across primary schools, secondary schools, and vocational training centers.',
    capabilities: [
      { icon: ClipboardList, name: 'Attendance Tracking', description: 'Digital roll call & reports' },
      { icon: BarChart3, name: 'Grading System', description: 'Automated grade computation' },
      { icon: CreditCard, name: 'Fee Management', description: 'Invoicing, payments & receipts' },
      { icon: Users, name: 'Student Records', description: 'Comprehensive profiles & history' },
      { icon: Megaphone, name: 'Parent Communication', description: 'SMS & portal notifications' },
      { icon: UserCheck, name: 'Staff Management', description: 'Teacher records & payroll' },
    ],
    targetAudience: ['Primary schools', 'Secondary schools', 'Tutorial centers', 'Vocational training', 'Educational NGOs'],
    deploymentNote: 'Customized per institution size. Rollout typically includes staff training and data migration support.',
  },
  {
    id: 'health',
    name: 'Health Suite',
    tagline: 'Better Care, Better Records',
    icon: Heart,
    color: 'red',
    description: 'Healthcare practice management and patient care tools designed for clinics, pharmacies, and diagnostic labs. Maintain secure patient records, manage appointments, and streamline pharmacy operations.',
    capabilities: [
      { icon: UserCheck, name: 'Patient Records', description: 'Secure medical histories' },
      { icon: ClipboardList, name: 'Appointment Scheduling', description: 'Easy booking management' },
      { icon: ShoppingCart, name: 'Pharmacy POS', description: 'Medication sales & tracking' },
      { icon: BarChart3, name: 'Lab Management', description: 'Test results & reporting' },
      { icon: CreditCard, name: 'Billing & Insurance', description: 'Patient billing & HMO claims' },
      { icon: Package, name: 'Drug Inventory', description: 'Expiry tracking & reorder alerts' },
    ],
    targetAudience: ['Clinics', 'Pharmacies', 'Diagnostic labs', 'Private hospitals', 'Health NGOs'],
    deploymentNote: 'Configured for healthcare compliance requirements. Includes data security protocols and staff training.',
  },
  {
    id: 'civic',
    name: 'Civic Suite',
    tagline: 'Transparent, Accountable, Connected',
    icon: Landmark,
    color: 'purple',
    description: 'Tools for community organizations, associations, and local governance bodies. Manage member contributions, track community projects, and enable transparent financial reporting.',
    capabilities: [
      { icon: CreditCard, name: 'Contribution Tracking', description: 'Dues, levies & donations' },
      { icon: Users, name: 'Member Management', description: 'Registration & directories' },
      { icon: ClipboardList, name: 'Meeting Management', description: 'Attendance & minutes' },
      { icon: BarChart3, name: 'Financial Reports', description: 'Transparent accounting' },
      { icon: Building, name: 'Project Tracking', description: 'Community initiatives' },
      { icon: Megaphone, name: 'Communication', description: 'Announcements & voting' },
    ],
    targetAudience: ['Trade associations', 'Market unions', 'Religious organizations', 'Town unions', 'Cooperative societies'],
    deploymentNote: 'Configured per organization structure. Often deployed through community leaders or association executives.',
  },
  {
    id: 'hospitality',
    name: 'Hospitality Suite',
    tagline: 'Exceptional Guest Experiences',
    icon: Hotel,
    color: 'amber',
    description: 'Hotel, restaurant, and event management tools. Manage reservations, rooms, tables, and events while delivering memorable experiences to your guests.',
    capabilities: [
      { icon: Hotel, name: 'Room Management', description: 'Availability & housekeeping' },
      { icon: ClipboardList, name: 'Reservations', description: 'Online & walk-in bookings' },
      { icon: ShoppingCart, name: 'Restaurant POS', description: 'Table service & orders' },
      { icon: Building, name: 'Event Booking', description: 'Conference & event spaces' },
      { icon: CreditCard, name: 'Guest Billing', description: 'Invoicing & payments' },
      { icon: BarChart3, name: 'Occupancy Reports', description: 'Performance analytics' },
    ],
    targetAudience: ['Hotels', 'Guest houses', 'Restaurants', 'Event centers', 'Resorts'],
    deploymentNote: 'Tailored to property size and service offerings. Includes POS hardware integration where needed.',
  },
  {
    id: 'logistics',
    name: 'Logistics Suite',
    tagline: 'Move Faster, Deliver Better',
    icon: Truck,
    color: 'orange',
    description: 'Fleet management and delivery operations platform. Track vehicles, manage drivers, optimize routes, and ensure timely deliveries across your network.',
    capabilities: [
      { icon: Truck, name: 'Fleet Management', description: 'Vehicle & driver tracking' },
      { icon: Users, name: 'Driver App', description: 'Mobile delivery management' },
      { icon: BarChart3, name: 'Route Optimization', description: 'Efficient delivery routes' },
      { icon: Package, name: 'Order Fulfillment', description: 'End-to-end tracking' },
      { icon: CreditCard, name: 'Cost Management', description: 'Fuel & maintenance tracking' },
      { icon: ClipboardList, name: 'Proof of Delivery', description: 'Digital signatures & photos' },
    ],
    targetAudience: ['Logistics companies', 'Delivery services', 'E-commerce fulfillment', 'Distribution networks'],
    deploymentNote: 'Scaled to fleet size. Includes driver onboarding and mobile app setup.',
  },
  {
    id: 'community',
    name: 'Community Suite',
    tagline: 'Connected Communities',
    icon: Users,
    color: 'teal',
    description: 'Residential and neighborhood community management tools. Coordinate facilities, collect dues, communicate with residents, and manage shared resources.',
    capabilities: [
      { icon: Users, name: 'Resident Management', description: 'Household records' },
      { icon: ClipboardList, name: 'Facility Booking', description: 'Shared amenities' },
      { icon: CreditCard, name: 'Dues Collection', description: 'Service charge tracking' },
      { icon: Megaphone, name: 'Announcements', description: 'Community notifications' },
      { icon: Building, name: 'Visitor Management', description: 'Gate access control' },
      { icon: BarChart3, name: 'Expense Tracking', description: 'Maintenance & utilities' },
    ],
    targetAudience: ['Residential estates', 'Apartment complexes', 'Gated communities', 'Cooperative housing'],
    deploymentNote: 'Configured per community size. Estate managers typically lead deployment.',
  },
]

const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  green: { bg: 'bg-green-600', bgLight: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  red: { bg: 'bg-red-600', bgLight: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  orange: { bg: 'bg-orange-600', bgLight: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  teal: { bg: 'bg-teal-600', bgLight: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium mb-6">
              <Layers className="w-4 h-4" />
              WebWaka Suites
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              One Platform,
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Many Industries
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Every suite is built on the same powerful WebWaka platform. Choose the configuration that fits your organization. Deployment scope and customization are handled through our partner network.
            </p>

            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Zap className="w-4 h-4 text-green-400" />
              <span>Organizations activate only the modules they need</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Model Explanation */}
      <section className="py-12 bg-green-50 border-b border-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">How WebWaka Suites Work</h2>
          <p className="text-gray-600">
            All suites share the same core platform infrastructure — user management, payments, analytics, and offline capability. 
            Each suite adds industry-specific modules that are <strong>configured based on your organizational needs</strong> and 
            <strong> delivered through our certified partner network</strong>. Deployment scope depends on which modules you activate.
          </p>
        </div>
      </section>

      {/* Suites Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {suites.map((suite, index) => {
              const colors = colorClasses[suite.color]
              const isEven = index % 2 === 0
              
              return (
                <div 
                  key={suite.id}
                  id={suite.id}
                  className={`grid lg:grid-cols-2 gap-12 items-start ${!isEven ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Content */}
                  <div className={!isEven ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bgLight} flex items-center justify-center`}>
                        <suite.icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{suite.name}</h2>
                    <p className={`text-lg font-medium ${colors.text} mb-4`}>{suite.tagline}</p>
                    <p className="text-gray-600 mb-6">{suite.description}</p>

                    {/* Target Audience */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">Ideal for:</p>
                      <div className="flex flex-wrap gap-2">
                        {suite.targetAudience.map((audience) => (
                          <span key={audience} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {audience}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Deployment Note */}
                    <div className={`p-4 rounded-lg ${colors.bgLight} border ${colors.border} mb-6`}>
                      <p className={`text-sm ${colors.text}`}>
                        <strong>Deployment:</strong> {suite.deploymentNote}
                      </p>
                    </div>

                    <Link 
                      href="/signup-v2"
                      className={`inline-flex items-center gap-2 px-6 py-3 ${colors.bg} hover:opacity-90 text-white font-semibold rounded-lg transition-all`}
                      data-testid={`suite-cta-${suite.id}`}
                    >
                      Get Started with {suite.name.replace(' Suite', '')}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Capabilities Card */}
                  <div className={`bg-gray-50 rounded-2xl p-8 border ${colors.border} ${!isEven ? 'lg:order-1' : ''}`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Included Capabilities</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {suite.capabilities.map((capability) => (
                        <div key={capability.name} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${colors.bgLight} flex items-center justify-center flex-shrink-0`}>
                            <capability.icon className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{capability.name}</p>
                            <p className="text-gray-500 text-xs">{capability.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${colors.text}`} />
                      Activate only the modules your organization needs
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Partner Delivery Model */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Partner-Led Deployment
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Delivered Through Our Partner Network
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            WebWaka suites are configured, customized, and deployed through our certified Digital Transformation Partners. 
            They provide local support, training, and ongoing assistance tailored to your organization&apos;s specific needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/partners"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
            >
              Find a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/signup-v2?intent=become_partner"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
            >
              Become a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Choose Your Suite?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            Every suite is available and ready to deploy. Connect with us to discuss your organization&apos;s specific needs and get started with the right configuration.
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
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-green-500/30 hover:bg-green-500/40 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
