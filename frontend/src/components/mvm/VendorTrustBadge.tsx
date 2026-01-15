'use client'

import { Star, Award, Shield, Clock } from 'lucide-react'

export type ScoreBand = 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEW'

interface VendorTrustBadgeProps {
  scoreBand: ScoreBand
  averageRating: number
  totalRatings: number
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

const badgeConfig: Record<ScoreBand, { 
  icon: typeof Star
  color: string
  bgColor: string
  label: string
}> = {
  EXCELLENT: {
    icon: Award,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    label: 'Top Rated'
  },
  GOOD: {
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    label: 'Trusted Seller'
  },
  NEEDS_ATTENTION: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    label: ''
  },
  NEW: {
    icon: Star,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50 border-slate-200',
    label: 'New Seller'
  }
}

export function VendorTrustBadge({ 
  scoreBand, 
  averageRating, 
  totalRatings,
  size = 'md',
  showDetails = true 
}: VendorTrustBadgeProps) {
  const config = badgeConfig[scoreBand] || badgeConfig.NEW
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const starSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  if (!config.label && scoreBand === 'NEEDS_ATTENTION') {
    return null
  }

  return (
    <div 
      className={`inline-flex items-center ${sizeClasses[size]} ${config.bgColor} border rounded-full font-medium`}
      data-testid="vendor-trust-badge"
    >
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      
      {config.label && (
        <span className={config.color}>{config.label}</span>
      )}
      
      {showDetails && totalRatings > 0 && (
        <>
          <span className="text-slate-400 mx-0.5">|</span>
          <div className="flex items-center gap-0.5">
            <Star className={`${starSizes[size]} text-amber-400 fill-amber-400`} />
            <span className="text-slate-700">{averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({totalRatings})</span>
          </div>
        </>
      )}
    </div>
  )
}

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export function StarRating({ rating, size = 'md', showValue = false }: StarRatingProps) {
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  return (
    <div className="flex items-center gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSizes[size]} ${
            star <= rating 
              ? 'text-amber-400 fill-amber-400' 
              : 'text-slate-200'
          }`}
        />
      ))}
      {showValue && (
        <span className={`ml-1 ${textSizes[size]} text-slate-600`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
