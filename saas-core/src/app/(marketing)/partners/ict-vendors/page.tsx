/**
 * ICT Vendors Partner Landing Page
 * For POS vendors and system integrators - hardware + software opportunity
 */

import Link from 'next/link'
import { 
  ArrowRight, Check, Monitor, Wallet, BookOpen, 
  Users, TrendingUp, ShoppingCart, Store, Package,
  Calculator, Cpu, Printer, HardDrive, Wifi
} from 'lucide-react'

export const metadata = {
  title: 'ICT Vendor Partners - WebWaka',
  description: 'Partner with WebWaka as an ICT vendor. Bundle our software with your hardware. POS terminals, printers, and business systems.',
}

const hardwareSoftwareBundle = [
  { hardware: 'POS Terminals', software: 'WebWaka POS', icon: Monitor },
  { hardware: 'Receipt Printers', software: 'Receipt Module', icon: Printer },
  { hardware: 'Barcode Scanners', software: 'Inventory Module', icon: HardDrive },
  { hardware: 'Network Equipment', software: 'Multi-Location Sync', icon: Wifi },
]

const benefits = [
  { icon: Wallet, title: 'Bundle & Earn', desc: 'Sell hardware + software together. Earn on both the equipment and the subscription.' },
  { icon: Cpu, title: 'Pre-Configured Systems', desc: 'Get devices pre-loaded with WebWaka. Ready to deploy out of the box.' },
  { icon: Users, title: 'Technical Training', desc: 'Deep technical training on setup, configuration, and troubleshooting.' },
  { icon: TrendingUp, title: 'Recurring Revenue', desc: 'Hardware is one-time. Software subscription is recurring. Build long-term income.' },
]

const whoIsThisFor = [
  'POS terminal vendors and distributors',
  'Computer and IT equipment retailers',
  'System integrators and installers',
  'Business equipment suppliers',
  'Tech solution providers',
  'Hardware distributors looking to add software',
]

const bundleExamples = [
  {
    name: 'Retail Starter Bundle',
    hardware: ['POS Terminal', 'Receipt Printer'],
    software: ['POS Module', 'Inventory Module'],
  },
  {
    name: 'Restaurant Bundle',
    hardware: ['POS Terminal', 'Kitchen Display', 'Printer'],
    software: ['POS Module', 'Order Management', 'Logistics'],
  },
  {
    name: 'Supermarket Bundle',
    hardware: ['Multiple POS Terminals', 'Barcode Scanners', 'Label Printers'],
    software: ['POS Module', 'Inventory', 'Accounting', 'Analytics'],
  },
]

export default function IctVendorsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
                <Monitor className="w-4 h-4" />
                ICT Vendor Partner Program
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Hardware + Software
                <br />
                <span className="text-green-400">Complete Solutions</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                Bundle WebWaka with your POS terminals, printers, and equipment. Sell complete business solutions, not just hardware.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/contact?type=partner&partner_type=ict-vendor"
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  data-testid="ict-vendor-apply-cta"
                >
                  Become an ICT Vendor Partner
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8">
                <p className="text-gray-400 text-sm mb-6">Hardware + Software Bundles</p>
                <div className="space-y-4">
                  {hardwareSoftwareBundle.map((item) => (
                    <div key={item.hardware} className="flex items-center gap-4 bg-white/10 rounded-lg p-3">
                      <item.icon className="w-6 h-6 text-green-400" />
                      <div className="flex-1">
                        <p className="text-white text-sm">{item.hardware}</p>
                        <p className="text-gray-400 text-xs">+ {item.software}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Opportunity */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Stop Selling Just Hardware
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Your customers buy POS terminals. But a terminal without software is just a fancy calculator. Bundle WebWaka and give them a complete solution.
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-4">The Problem</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Customer buys hardware but does not know what software to use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>They end up with pirated or unreliable software</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>You only earn once — on the hardware sale</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">The Solution</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Sell hardware + software as a complete package</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Professional software that works offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Recurring commission on software subscriptions</span>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-6">This Is For You If:</h3>
              <ul className="space-y-4">
                {whoIsThisFor.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Examples */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Example Bundles You Can Sell
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {bundleExamples.map((bundle) => (
              <div key={bundle.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">{bundle.name}</h3>
                
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">HARDWARE</p>
                  <div className="flex flex-wrap gap-2">
                    {bundle.hardware.map((item) => (
                      <span key={item} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">SOFTWARE</p>
                  <div className="flex flex-wrap gap-2">
                    {bundle.software.map((item) => (
                      <span key={item} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            ICT Vendor Partner Benefits
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Partner & Train</h3>
              <p className="text-gray-600 text-sm">
                Get technical training on installation and configuration. Learn how to bundle effectively.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Bundle & Sell</h3>
              <p className="text-gray-600 text-sm">
                Create hardware + software packages. Sell complete solutions to businesses.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Earn Recurring</h3>
              <p className="text-gray-600 text-sm">
                Earn on hardware sales plus recurring commission on software subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Sell Complete Solutions?
          </h2>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Add software to your hardware business. Build recurring revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact?type=partner&partner_type=ict-vendor"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/partners"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-all"
            >
              Back to Partners
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
