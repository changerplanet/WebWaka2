'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageCircle, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { VendorTrustBadge, StarRating, ScoreBand } from './VendorTrustBadge'

interface Rating {
  id: string
  vendorId: string
  rating: number
  comment?: string | null
  customerName?: string | null
  isVerifiedPurchase: boolean
  createdAt: string
}

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
}

interface VendorRatingsDisplayProps {
  tenantId: string
  vendorId: string
  vendorName: string
}

export function VendorRatingsDisplay({ tenantId, vendorId, vendorName }: VendorRatingsDisplayProps) {
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRatings()
  }, [tenantId, vendorId])

  const loadRatings = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const [summaryRes, ratingsRes] = await Promise.all([
        fetch(`/api/mvm/vendor-ratings/summary?tenantId=${tenantId}&vendorId=${vendorId}`),
        fetch(`/api/mvm/vendor-ratings?tenantId=${tenantId}&vendorId=${vendorId}&page=${pageNum}&pageSize=10`)
      ])

      const summaryData = await summaryRes.json()
      const ratingsData = await ratingsRes.json()

      if (!summaryRes.ok || !ratingsRes.ok) {
        throw new Error('Failed to load ratings')
      }

      setSummary(summaryData)
      setRatings(append ? [...ratings, ...ratingsData.ratings] : ratingsData.ratings)
      setPage(pageNum)
      setHasMore(ratingsData.page < ratingsData.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    loadRatings(page + 1, true)
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
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="vendor-ratings-display">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
            <p className="text-slate-500">{vendorName}</p>
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

        {summary && summary.totalRatings > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <div className="text-5xl font-bold text-slate-900 mb-2">
                {summary.averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(summary.averageRating)} size="lg" />
              <p className="mt-2 text-sm text-slate-500">
                Based on {summary.totalRatings} {summary.totalRatings === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary[`rating${stars}Count` as keyof RatingSummary] as number
                const percentage = summary.totalRatings > 0 ? (count / summary.totalRatings) * 100 : 0
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 w-12">{stars} star</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-10 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No reviews yet</p>
          </div>
        )}
      </div>

      {ratings.length > 0 && (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
              data-testid="rating-item"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {rating.customerName || 'Anonymous'}
                    </span>
                    {rating.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                        <ThumbsUp className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <StarRating rating={rating.rating} size="sm" />
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </span>
              </div>
              {rating.comment && (
                <p className="text-slate-600 text-sm mt-2">{rating.comment}</p>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoadingMore ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Load More Reviews
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
