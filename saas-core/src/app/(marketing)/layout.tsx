/**
 * Marketing Layout
 * Shared layout for all marketing pages (separate from app)
 */

import Link from 'next/link'
import { Building2, Menu, X } from 'lucide-react'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">eMarketWaka</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/solutions" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Solutions
              </Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/partners" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Partners
              </Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                About
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/login" 
                className="px-4 py-2 text-slate-700 font-medium hover:text-slate-900 transition-colors"
              >
                Log in
              </Link>
              <Link 
                href="/login?signup=true" 
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-slate-600" data-testid="mobile-menu-btn">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">eMarketWaka</span>
              </div>
              <p className="text-slate-400 text-sm">
                Complete commerce platform for African businesses.
              </p>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/solutions#pos" className="hover:text-white transition-colors">Point of Sale</Link></li>
                <li><Link href="/solutions#store" className="hover:text-white transition-colors">Online Store</Link></li>
                <li><Link href="/solutions#marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/partners" className="hover:text-white transition-colors">Partners</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} eMarketWaka. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="mailto:hello@emarketwaka.com" className="hover:text-white transition-colors text-sm">
                hello@emarketwaka.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
