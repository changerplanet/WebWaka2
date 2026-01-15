'use client'

import { useState, useEffect } from 'react'
import { 
  Award, 
  Shield, 
  AlertTriangle, 
  Users, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  Star,
  Filter
} from 'lucide-react'
import { VendorTrustBadge, ScoreBand } from './VendorTrustBadge'

interface VendorQuality {
  id: string
  name: string
  slug: string
  averageRating: number
  totalRatings: number
  scoreBand: ScoreBand
  recentOrdersOnTime: number
  recentOrdersCancelled: number
}

interface QualitySummary {
  excellent: number
  good: number
  needsAttention: number
  new: number
}

interface AdminVendorQualityProps {
  tenantId: string
}

export function AdminVendorQuality({ tenantId }: AdminVendorQualityProps) {
  const [vendors, setVendors] = useState<VendorQuality[]>([])
  const [summary, setSummary] = useState<QualitySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ScoreBand | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    loadData()
  }, [tenantId, filter])

  const loadData = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        tenantId,
        page: pageNum.toString(),
        pageSize: '20'
      })
      
      if (filter !== 'ALL') {
        params.append('scoreBand', filter)
      }

      const response = await fetch(`/api/mvm/vendor-ratings/admin?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load data')
      }

      setVendors(append ? [...vendors, ...data.vendors] : data.vendors)
      setSummary(data.summary)
      setPage(pageNum)
      setHasMore(data.vendors.length === 20)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    loadData(page + 1, true)
  }

  const bandColors: Record<ScoreBand, string> = {
    EXCELLENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    GOOD: 'bg-blue-100 text-blue-700 border-blue-200',
    NEEDS_ATTENTION: 'bg-amber-100 text-amber-700 border-amber-200',
    NEW: 'bg-slate-100 text-slate-700 border-slate-200'
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
          onClick={() => loadData()}
          className="mt-4 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="admin-vendor-quality">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Quality Overview</h1>
          <p className="text-slate-500">Monitor vendor performance and ratings</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Excellent</span>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{summary.excellent}</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Good</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{summary.good}</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">Needs Attention</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">{summary.needsAttention}</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">New</span>
            </div>
            <span className="text-2xl font-bold text-slate-600">{summary.new}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Vendors</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ScoreBand | 'ALL')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Vendors</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="NEEDS_ATTENTION">Needs Attention</option>
              <option value="NEW">New</option>
            </select>
          </div>
        </div>

        {vendors.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900">{vendor.name}</h3>
                      <p className="text-sm text-slate-500">/{vendor.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-slate-900">
                          {vendor.averageRating.toFixed(1)}
                        </span>
                        <span className="text-slate-400">({vendor.totalRatings})</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${bandColors[vendor.scoreBand]}`}>
                      {vendor.scoreBand.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            No vendors found matching the filter
          </div>
        )}

        {hasMore && (
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load More
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
