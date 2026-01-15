'use client'

import Link from 'next/link'
import { Bus, MapPin, Star, Shield, ArrowLeft, Users, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParkHubOperator } from '@/lib/parkhub/parkhub-resolver'

interface OperatorsListClientProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  operators: ParkHubOperator[]
  isDemo: boolean
}

function formatRating(rating: number | null): string {
  if (rating === null) return 'New'
  return rating.toFixed(1)
}

export default function OperatorsListClient({
  tenant,
  operators,
  isDemo
}: OperatorsListClientProps) {
  const tenantSlug = tenant.slug || tenant.id
  const tenantName = tenant.name || 'Transport Hub'

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
                <p className="text-green-100 text-sm">Transport Operators</p>
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
            Transport Operators
          </h2>
          <p className="text-gray-600">
            {operators.length} verified operators available
          </p>
        </div>

        {operators.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Operators Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Transport operators will appear here once they register.
            </p>
            <Link href={`/${tenantSlug}/parkhub`}>
              <Button variant="outline">Back to ParkHub</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operators.map((operator) => (
              <Link
                key={operator.id}
                href={`/${tenantSlug}/parkhub/operator/${operator.slug}`}
                className="block"
              >
                <div className="bg-white rounded-xl border hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {operator.logo ? (
                        <img 
                          src={operator.logo} 
                          alt={operator.name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <Bus className="w-8 h-8 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {operator.name}
                        </h3>
                        {operator.isVerified && (
                          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>{formatRating(operator.averageRating)}</span>
                        {operator.totalRatings > 0 && (
                          <span className="text-gray-400">
                            ({operator.totalRatings})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {operator.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {operator.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Route className="w-4 h-4" />
                      <span>{operator.activeRoutesCount} routes</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Bus className="w-4 h-4" />
                      <span>{operator.activeTripsCount} trips</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/${tenantSlug}/parkhub/routes`}>
            <Button variant="outline" className="gap-2">
              <MapPin className="w-4 h-4" />
              Browse All Routes
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
