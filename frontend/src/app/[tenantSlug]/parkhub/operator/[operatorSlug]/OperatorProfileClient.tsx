'use client'

import Link from 'next/link'
import { Bus, MapPin, Star, Shield, ArrowLeft, ArrowRight, Clock, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParkHubOperator, ParkHubRoute, ParkHubTrip } from '@/lib/parkhub/parkhub-resolver'

interface OperatorProfileClientProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  operator: ParkHubOperator
  routes: ParkHubRoute[]
  upcomingTrips: ParkHubTrip[]
  isDemo: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function formatTime(date: Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('en-NG', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-NG', { 
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

function formatRating(rating: number | null): string {
  if (rating === null) return 'New'
  return rating.toFixed(1)
}

export default function OperatorProfileClient({
  tenant,
  operator,
  routes,
  upcomingTrips,
  isDemo
}: OperatorProfileClientProps) {
  const tenantSlug = tenant.slug || tenant.id
  const tenantName = tenant.name || 'Transport Hub'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/${tenantSlug}/parkhub/operators`} className="hover:opacity-80">
                <ArrowLeft className="w-5 h-5" />
              </Link>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              {operator.logo ? (
                <img 
                  src={operator.logo} 
                  alt={operator.name}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <Bus className="w-12 h-12 text-green-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {operator.name}
                </h2>
                {operator.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{formatRating(operator.averageRating)}</span>
                {operator.totalRatings > 0 && (
                  <span className="text-gray-500">
                    ({operator.totalRatings} reviews)
                  </span>
                )}
              </div>

              {operator.description && (
                <p className="text-gray-600 mb-4">
                  {operator.description}
                </p>
              )}

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {operator.activeRoutesCount}
                  </div>
                  <div className="text-sm text-gray-500">Routes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {operator.activeTripsCount}
                  </div>
                  <div className="text-sm text-gray-500">Active Trips</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Routes Served
            </h3>
            
            {routes.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No active routes available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{route.origin}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="font-medium">{route.destination}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(route.basePrice)}
                        </div>
                        {route.estimatedDurationMinutes && (
                          <div className="text-sm text-gray-500 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatDuration(route.estimatedDurationMinutes)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Trips
            </h3>
            
            {upcomingTrips.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming trips scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trip.tripNumber}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        trip.status === 'BOARDING' 
                          ? 'bg-blue-100 text-blue-700'
                          : trip.status === 'READY_TO_DEPART'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {trip.scheduledDeparture && (
                          <>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(trip.scheduledDeparture)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(trip.scheduledDeparture)}
                            </span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {trip.availableSeats} seats
                        </span>
                      </div>
                      <div className="font-bold text-green-600">
                        {formatCurrency(trip.currentPrice)}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Link href="/parkhub/booking">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            Powered by ParkHub - Nigeria&apos;s Transport Marketplace
          </p>
        </div>
      </footer>
    </div>
  )
}
