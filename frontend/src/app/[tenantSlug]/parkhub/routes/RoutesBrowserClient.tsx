'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Bus, MapPin, ArrowLeft, ArrowRight, Clock, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ParkHubRoute } from '@/lib/parkhub/parkhub-resolver'

interface RouteWithOperator extends ParkHubRoute {
  operatorName: string
  operatorSlug: string
}

interface RoutesBrowserClientProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  routes: RouteWithOperator[]
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

export default function RoutesBrowserClient({
  tenant,
  routes,
  isDemo
}: RoutesBrowserClientProps) {
  const tenantSlug = tenant.slug || tenant.id
  const tenantName = tenant.name || 'Transport Hub'
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null)

  const uniqueOrigins = useMemo(() => {
    const origins = [...new Set(routes.map(r => r.origin))]
    return origins.sort()
  }, [routes])

  const filteredRoutes = useMemo(() => {
    let filtered = routes

    if (selectedOrigin) {
      filtered = filtered.filter(r => r.origin === selectedOrigin)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.origin.toLowerCase().includes(query) ||
        r.destination.toLowerCase().includes(query) ||
        r.operatorName.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [routes, selectedOrigin, searchQuery])

  const groupedRoutes = useMemo(() => {
    const grouped: Record<string, RouteWithOperator[]> = {}
    filteredRoutes.forEach(route => {
      const key = `${route.origin} → ${route.destination}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(route)
    })
    return grouped
  }, [filteredRoutes])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/${tenantSlug}/parkhub`} className="hover:opacity-80">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">{tenantName}</h1>
                <p className="text-green-100 text-sm">Browse Routes</p>
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            All Routes
          </h2>
          <p className="text-gray-600">
            {routes.length} routes available
          </p>
        </div>

        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search routes or operators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedOrigin === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOrigin(null)}
              >
                All Origins
              </Button>
              {uniqueOrigins.slice(0, 5).map((origin) => (
                <Button
                  key={origin}
                  variant={selectedOrigin === origin ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOrigin(origin)}
                >
                  {origin.split('(')[0].trim()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filteredRoutes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Routes Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedOrigin
                ? 'Try adjusting your search or filters'
                : 'Routes will appear here once operators add them'
              }
            </p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setSelectedOrigin(null); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRoutes).map(([routeKey, routeGroup]) => (
              <div key={routeKey} className="bg-white rounded-xl border overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">{routeGroup[0].origin}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <MapPin className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-900">{routeGroup[0].destination}</span>
                    {routeGroup[0].estimatedDurationMinutes && (
                      <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(routeGroup[0].estimatedDurationMinutes)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y">
                  {routeGroup.map((route) => (
                    <div key={route.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Bus className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <Link
                            href={`/${tenantSlug}/parkhub/operator/${route.operatorSlug}`}
                            className="font-medium text-gray-900 hover:text-green-600"
                          >
                            {route.operatorName}
                          </Link>
                          {route.shortName && (
                            <div className="text-sm text-gray-500">
                              Route: {route.shortName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(route.basePrice)}
                          </div>
                          {route.distanceKm && (
                            <div className="text-sm text-gray-500">
                              {route.distanceKm} km
                            </div>
                          )}
                        </div>
                        <Link href="/parkhub/booking">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Book
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/${tenantSlug}/parkhub/operators`}>
            <Button variant="outline" className="gap-2">
              <Bus className="w-4 h-4" />
              View All Operators
            </Button>
          </Link>
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
