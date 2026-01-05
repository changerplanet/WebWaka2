/**
 * Marketing Layout
 * WebWaka Platform - Digital Infrastructure for African Organizations
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Globe, Menu, X, Phone, Mail } from 'lucide-react'

const navLinks = [
  { href: '/platform', label: 'Platform' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/suites', label: 'Suites' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/partners', label: 'Partners' },
  { href: '/about', label: 'About' },
]

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-2 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p>Digital Infrastructure for African Organizations</p>
          <div className="flex items-center gap-4">
            <a href="tel:+2348000000000" className="flex items-center gap-1 hover:text-green-400 transition-colors">
              <Phone className="w-3 h-3" />
              +234 800 000 0000
            </a>
            <a href="mailto:hello@webwaka.com" className="flex items-center gap-1 hover:text-green-400 transition-colors">
              <Mail className="w-3 h-3" />
              hello@webwaka.com
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">WebWaka</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-gray-600 hover:text-green-600 font-medium transition-colors"
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/login-v2" 
                className="px-4 py-2 text-gray-700 font-medium hover:text-green-600 transition-colors"
                data-testid="nav-login"
              >
                Log in
              </Link>
              <Link 
                href="/signup-v2" 
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                data-testid="nav-get-started"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link
                  href="/login-v2"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-center"
                >
                  Log in
                </Link>
                <Link
                  href="/signup-v2"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Company */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">WebWaka</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Digital infrastructure for African organizations.
              </p>
              <p className="text-gray-500 text-xs">
                Powered by HandyLife Digital
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/platform" className="hover:text-green-400 transition-colors">Overview</Link></li>
                <li><Link href="/capabilities" className="hover:text-green-400 transition-colors">Capabilities</Link></li>
                <li><Link href="/suites" className="hover:text-green-400 transition-colors">Suites</Link></li>
                <li><Link href="/solutions" className="hover:text-green-400 transition-colors">Solutions</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="/partners" className="hover:text-green-400 transition-colors">Partners</Link></li>
                <li><Link href="/impact" className="hover:text-green-400 transition-colors">Impact</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
                <li><Link href="/login-v2" className="hover:text-green-400 transition-colors">Log In</Link></li>
                <li><Link href="/signup-v2" className="hover:text-green-400 transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Get in Touch</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <a href="mailto:hello@webwaka.com" className="hover:text-green-400 transition-colors">
                    hello@webwaka.com
                  </a>
                </li>
                <li>
                  <a href="tel:+2348000000000" className="hover:text-green-400 transition-colors">
                    +234 800 000 0000
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/2348000000000" className="hover:text-green-400 transition-colors">
                    WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} WebWaka. Powered by HandyLife Digital. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <Link href="/privacy" className="hover:text-green-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-green-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
