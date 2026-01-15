/**
 * Social Proof Badge Component (Wave G3)
 * 
 * Displays popularity badges and purchase counts on product cards.
 * All data derived from real purchases - no fake signals.
 * 
 * @module components/svm/SocialProofBadge
 */

'use client'

import { type ProductSocialProof, type PopularityBadge } from '@/lib/svm/social-proof-service'

interface SocialProofBadgeProps {
  socialProof: ProductSocialProof
  variant?: 'compact' | 'full'
  showDemoLabel?: boolean
}

const BADGE_STYLES: Record<NonNullable<PopularityBadge>, { bg: string; text: string; label: string }> = {
  BESTSELLER: {
    bg: 'bg-amber-500',
    text: 'text-white',
    label: 'Bestseller'
  },
  TRENDING: {
    bg: 'bg-rose-500',
    text: 'text-white',
    label: 'Trending'
  },
  POPULAR: {
    bg: 'bg-blue-500',
    text: 'text-white',
    label: 'Popular'
  }
}

export function SocialProofBadge({
  socialProof,
  variant = 'compact',
  showDemoLabel = true
}: SocialProofBadgeProps) {
  const { popularityBadge, purchasesToday, purchasesThisWeek, popularInCities, isDemo } = socialProof
  
  if (!popularityBadge && purchasesToday === 0 && popularInCities.length === 0) {
    return null
  }
  
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1">
        {popularityBadge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLES[popularityBadge].bg} ${BADGE_STYLES[popularityBadge].text}`}
          >
            {BADGE_STYLES[popularityBadge].label}
            {isDemo && showDemoLabel && (
              <span className="ml-1 opacity-70">(Demo)</span>
            )}
          </span>
        )}
        
        {purchasesToday > 0 && !popularityBadge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {purchasesToday} bought today
          </span>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {popularityBadge && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${BADGE_STYLES[popularityBadge].bg} ${BADGE_STYLES[popularityBadge].text}`}
          >
            {BADGE_STYLES[popularityBadge].label}
          </span>
          {isDemo && showDemoLabel && (
            <span className="text-xs text-gray-400">(Demo data)</span>
          )}
        </div>
      )}
      
      {purchasesToday > 0 && (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{purchasesToday}</span> people bought this today
        </p>
      )}
      
      {purchasesThisWeek > purchasesToday && (
        <p className="text-sm text-gray-500">
          {purchasesThisWeek} sold this week
        </p>
      )}
      
      {popularInCities.length > 0 && (
        <p className="text-sm text-gray-500">
          Popular in {popularInCities.join(', ')}
        </p>
      )}
    </div>
  )
}

export function PopularityIcon({ badge }: { badge: PopularityBadge }) {
  if (!badge) return null
  
  const iconClass = 'w-4 h-4'
  
  switch (badge) {
    case 'BESTSELLER':
      return (
        <svg className={`${iconClass} text-amber-500`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    case 'TRENDING':
      return (
        <svg className={`${iconClass} text-rose-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
      )
    case 'POPULAR':
      return (
        <svg className={`${iconClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      )
    default:
      return null
  }
}
