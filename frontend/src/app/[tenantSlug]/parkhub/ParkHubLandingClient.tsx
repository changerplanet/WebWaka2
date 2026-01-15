'use client'

import Link from 'next/link'
import { Bus, MapPin, Users, ArrowRight, Clock, Shield, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ParkHubLandingClientProps {
  tenant: {
    id: string
    name: string | null
    slug: string | null
  }
  operatorCount: number
  activeRoutesCount: number
  activeTripsCount: number
  isDemo: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

export default function ParkHubLandingClient({
  tenant,
  operatorCount,
  activeRoutesCount,
  activeTripsCount,
  isDemo
}: ParkHubLandingClientProps) {
  const tenantSlug = tenant.slug || tenant.id
  const tenantName = tenant.name || 'Transport Hub'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bus className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">{tenantName}</h1>
                <p className="text-green-100 text-sm">Transport Marketplace</p>
              </div>
            </div>
            {isDemo && (
              <span className="bg-yellow-500 text-yellow-900 text-xs font-medium px-2 py-1 rounded">
                DEMO
              </span>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Book Your Trip Today
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Compare transport operators, find the best routes, and book your tickets 
              with trusted operators across Nigeria.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${tenantSlug}/parkhub/routes`}>
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 w-full sm:w-auto">
                  <MapPin className="w-5 h-5 mr-2" />
                  Browse Routes
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={`/${tenantSlug}/parkhub/operators`}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  <Users className="w-5 h-5 mr-2" />
                  View Operators
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-green-50 border border-green-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {formatNumber(operatorCount)}
                </div>
                <div className="text-gray-600">Transport Operators</div>
              </div>

              <div className="text-center p-6 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {formatNumber(activeRoutesCount)}
                </div>
                <div className="text-gray-600">Active Routes</div>
              </div>

              <div className="text-center p-6 rounded-xl bg-purple-50 border border-purple-100">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  {formatNumber(activeTripsCount)}
                </div>
                <div className="text-gray-600">Available Trips</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Book With Us?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Verified Operators</h4>
                  <p className="text-gray-600 text-sm">
                    All transport operators are verified and licensed for your safety.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Customer Ratings</h4>
                  <p className="text-gray-600 text-sm">
                    Read reviews and ratings from real passengers before booking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Real-time Updates</h4>
                  <p className="text-gray-600 text-sm">
                    Get live updates on trip status, departure times, and seat availability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-green-700 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Travel?</h3>
            <p className="text-green-100 mb-6">
              Find the best routes and book your ticket in minutes.
            </p>
            <Link href={`/${tenantSlug}/parkhub/routes`}>
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                Search Routes Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            Powered by ParkHub - Nigeria&apos;s Transport Marketplace
          </p>
        </div>
      </footer>
    </div>
  )
}
