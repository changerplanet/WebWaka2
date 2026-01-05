/**
 * WebWaka Solutions Page
 * All solutions are available - deployment varies by organization
 * No "Coming Soon" labels
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Globe, Layers, Zap,
  Store, GraduationCap, Heart, Landmark, Hotel, Truck, Users,
  ShoppingCart, Utensils, Building, Warehouse
} from 'lucide-react'

export const metadata = {
  title: 'Solutions — WebWaka Platform',
  description: 'Discover WebWaka solutions for retail, wholesale, restaurants, schools, clinics, community organizations, and more. All solutions are built on the same powerful platform.',
}

// All solutions are available - deployment scope depends on client needs
const solutions = [
  // Commerce Suite Solutions
  {
    id: 'retail',
    name: 'Retail Shops',
    icon: ShoppingCart,
    suite: 'Commerce Suite',
    suiteColor: 'green',
    description: 'From corner shops to chain stores, manage sales, inventory, and customers with ease.',
    features: ['Point of Sale', 'Inventory tracking', 'Customer loyalty', 'Sales reports'],
  },
  {
    id: 'supermarket',
    name: 'Supermarkets',
    icon: Store,
    suite: 'Commerce Suite',
    suiteColor: 'green',
    description: 'Handle high-volume retail with barcode scanning, multi-location inventory, and fast checkout.',
    features: ['Fast checkout', 'Multi-location', 'Stock alerts', 'Supplier management'],
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Cafes',
    icon: Utensils,
    suite: 'Commerce Suite',
    suiteColor: 'green',
    description: 'Table management, kitchen orders, and delivery — all in one system.',
    features: ['Table service', 'Kitchen display', 'Delivery management', 'Menu management'],
  },
  {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    icon: Warehouse,
    suite: 'Commerce Suite',
    suiteColor: 'green',
    description: 'B2B sales, bulk pricing, credit management, and large-order workflows.',
    features: ['B2B pricing', 'Credit sales', 'Bulk orders', 'Route planning'],
  },
  {
    id: 'marketplace',
    name: 'Marketplaces',
    icon: Users,
    suite: 'Commerce Suite',
    suiteColor: 'green',
    description: 'Run multi-vendor platforms for malls, plazas, and trade associations.',
    features: ['Multi-vendor', 'Commission management', 'Vendor payouts', 'Central catalog'],
  },
  {
    id: 'online-store',
    name: 'Online Sellers',
    icon: Globe,
    suite: 'Commerce Suite',
    suiteColor: 'green',
    description: 'Sell on WhatsApp, web, and social media with integrated inventory and payments.',
    features: ['Online storefront', 'WhatsApp ordering', 'Payment links', 'Delivery tracking'],
  },
  
  // Education Suite Solutions
  {
    id: 'school',
    name: 'Schools & Academies',
    icon: GraduationCap,
    suite: 'Education Suite',
    suiteColor: 'blue',
    description: 'Complete school management from attendance to fee collection and parent communication.',
    features: ['Attendance', 'Grading', 'Fee management', 'Parent portal'],
  },
  {
    id: 'tutorial',
    name: 'Tutorial Centers',
    icon: GraduationCap,
    suite: 'Education Suite',
    suiteColor: 'blue',
    description: 'Manage classes, schedules, and student progress for extra-curricular learning.',
    features: ['Class scheduling', 'Progress tracking', 'Payment handling', 'Student records'],
  },
  
  // Health Suite Solutions
  {
    id: 'clinic',
    name: 'Clinics & Hospitals',
    icon: Heart,
    suite: 'Health Suite',
    suiteColor: 'red',
    description: 'Patient management, appointments, and medical records made simple and secure.',
    features: ['Patient records', 'Appointments', 'Billing', 'Prescriptions'],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacies',
    icon: Heart,
    suite: 'Health Suite',
    suiteColor: 'red',
    description: 'Medication sales, inventory control, expiry tracking, and prescription management.',
    features: ['Medication POS', 'Expiry tracking', 'Prescription log', 'Supplier orders'],
  },
  
  // Civic Suite Solutions
  {
    id: 'association',
    name: 'Trade Associations',
    icon: Landmark,
    suite: 'Civic Suite',
    suiteColor: 'purple',
    description: 'Manage member dues, meetings, elections, and collective projects transparently.',
    features: ['Member management', 'Dues tracking', 'Voting', 'Project finance'],
  },
  {
    id: 'community',
    name: 'Community Groups',
    icon: Users,
    suite: 'Civic Suite',
    suiteColor: 'purple',
    description: 'Coordinate community activities, contributions, and communication effectively.',
    features: ['Member directory', 'Contributions', 'Announcements', 'Event planning'],
  },
  
  // Hospitality Suite Solutions
  {
    id: 'hotel',
    name: 'Hotels & Guest Houses',
    icon: Hotel,
    suite: 'Hospitality Suite',
    suiteColor: 'amber',
    description: 'Room bookings, guest management, housekeeping, and facility operations.',
    features: ['Room booking', 'Guest check-in', 'Housekeeping', 'Restaurant POS'],
  },
  {
    id: 'event-center',
    name: 'Event Centers',
    icon: Building,
    suite: 'Hospitality Suite',
    suiteColor: 'amber',
    description: 'Venue booking, event management, vendor coordination, and billing.',
    features: ['Venue booking', 'Event calendar', 'Vendor management', 'Invoicing'],
  },
  
  // Logistics Suite Solutions
  {
    id: 'logistics',
    name: 'Logistics Companies',
    icon: Truck,
    suite: 'Logistics Suite',
    suiteColor: 'orange',
    description: 'Fleet management, driver tracking, route optimization, and proof of delivery.',
    features: ['Fleet tracking', 'Driver app', 'Route planning', 'Proof of delivery'],
  },
]

const suiteColors: Record<string, { bg: string; bgLight: string; text: string }> = {
  green: { bg: 'bg-green-600', bgLight: 'bg-green-50', text: 'text-green-600' },
  blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600' },
  red: { bg: 'bg-red-600', bgLight: 'bg-red-50', text: 'text-red-600' },
  purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600' },
  orange: { bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-600' },
}

// Group solutions by suite
const suiteGroups = [
  { name: 'Commerce Suite', color: 'green', solutions: solutions.filter(s => s.suite === 'Commerce Suite') },
  { name: 'Education Suite', color: 'blue', solutions: solutions.filter(s => s.suite === 'Education Suite') },
  { name: 'Health Suite', color: 'red', solutions: solutions.filter(s => s.suite === 'Health Suite') },
  { name: 'Civic Suite', color: 'purple', solutions: solutions.filter(s => s.suite === 'Civic Suite') },
  { name: 'Hospitality Suite', color: 'amber', solutions: solutions.filter(s => s.suite === 'Hospitality Suite') },
  { name: 'Logistics Suite', color: 'orange', solutions: solutions.filter(s => s.suite === 'Logistics Suite') },
]

export default function SolutionsPage() {
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
              WebWaka Solutions
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Solutions for
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Every Organization
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Find the solution that fits your organization. Each is built on WebWaka&apos;s modular platform and configured based on your specific industry needs.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions by Suite */}
      {suiteGroups.map((group) => {
        const colors = suiteColors[group.color]
        return (
          <section key={group.name} className={`py-16 ${group.color === 'green' ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-10">
                <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bgLight} rounded-full ${colors.text} text-sm font-medium mb-4`}>
                  {group.name}
                </div>
                <p className="text-gray-600">
                  Solutions powered by the {group.name}, configured and deployed based on your organizational requirements.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.solutions.map((solution) => (
                  <div 
                    key={solution.id}
                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bgLight} flex items-center justify-center`}>
                        <solution.icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{solution.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{solution.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {solution.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className={`w-4 h-4 ${colors.text}`} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Link 
                      href="/signup-v2"
                      className={`inline-flex items-center gap-2 ${colors.text} font-semibold hover:opacity-80 transition-colors`}
                      data-testid={`solution-cta-${solution.id}`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* Partner Deployment */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Partner-Led Deployment
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Every Solution, Delivered Through Partners
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            All WebWaka solutions are configured and deployed through our certified partner network. 
            Partners provide local support, training, and ongoing assistance specific to your industry and location.
          </p>
          <Link 
            href="/partners"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
          >
            Find a Partner Near You
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Don&apos;t See Your Exact Use Case?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-10">
            WebWaka is a modular platform. Contact us to discuss how we can configure a solution that fits your specific organizational needs.
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
              Discuss Your Needs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
