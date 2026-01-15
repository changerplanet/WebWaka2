'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react'
import { useMVM } from './MVMProvider'
import { VendorTrustBadge, StarRating, ScoreBand } from './VendorTrustBadge'

interface RatingSummary {
  vendorId: string
  totalRatings: number
  averageRating: number
  rating1Count: number
  rating2Count: number
  rating3Count: number
  rating4Count: number
  rating5Count: number
  scoreBand: ScoreBand
  recentOrdersTotal: number
  recentOrdersOnTime: number
  recentOrdersCancelled: number
}

interface Rating {
  id: string
  rating: number
  comment?: string | null
  customerName?: string | null
  isVerifiedPurchase: boolean
  createdAt: string
}

export function VendorRatingsOverview() {
  const { vendor, tenantId } = useMVM()
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [recentRatings, setRecentRatings] = useState<Rating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (vendor?.id && tenantId) {
      loadData()
    }
  }, [vendor?.id, tenantId])

  const loadData = async () => {
    if (!vendor?.id || !tenantId) return

    setIsLoading(true)
    setError(null)

    try {
      const [summaryRes, ratingsRes] = await Promise.all([
        fetch(`/api/mvm/vendor-ratings/summary?tenantId=${tenantId}&vendorId=${vendor.id}`),
        fetch(`/api/mvm/vendor-ratings?tenantId=${tenantId}&vendorId=${vendor.id}&page=1&pageSize=5`)
      ])

      const summaryData = await summaryRes.json()
      const ratingsData = await ratingsRes.json()

      if (!summaryRes.ok || !ratingsRes.ok) {
        throw new Error('Failed to load ratings')
      }

      setSummary(summaryData)
      setRecentRatings(ratingsData.ratings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="vendor-ratings-overview">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Ratings</h1>
          <p className="text-slate-500">See how your customers rate your service</p>
        </div>
        {summary && (
          <VendorTrustBadge
            scoreBand={summary.scoreBand}
            averageRating={summary.averageRating}
            totalRatings={summary.totalRatings}
            size="lg"
          />
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-medium text-slate-700">Average Rating</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {summary?.averageRating.toFixed(1) || '0.0'}
            </span>
            <span className="text-slate-400 mb-1">/ 5.0</span>
          </div>
          {summary && <StarRating rating={Math.round(summary.averageRating)} size="md" />}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-slate-700">Total Reviews</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {summary?.totalRatings || 0}
            </span>
            <span className="text-slate-400 mb-1">reviews</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-slate-700">Score Band</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-slate-900 capitalize">
              {summary?.scoreBand.toLowerCase().replace('_', ' ') || 'New'}
            </span>
          </div>
        </div>
      </div>

      {summary && summary.totalRatings > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Rating Breakdown</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary[`rating${stars}Count` as keyof RatingSummary] as number
              const percentage = summary.totalRatings > 0 ? (count / summary.totalRatings) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-slate-600">{stars}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Recent Reviews</h2>
        {recentRatings.length > 0 ? (
          <div className="space-y-4">
            {recentRatings.map((rating) => (
              <div key={rating.id} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {rating.customerName || 'Anonymous'}
                    </span>
                    <StarRating rating={rating.rating} size="sm" />
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-slate-600">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No reviews yet. Deliver great service to get your first rating!</p>
        )}
      </div>
    </div>
  )
}
