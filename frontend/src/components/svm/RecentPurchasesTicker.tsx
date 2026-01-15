/**
 * Recent Purchases Ticker Component (Wave G3)
 * 
 * Displays privacy-safe, throttled recent purchase activity.
 * Shows real purchase data with anonymized customer info.
 * 
 * Constraints:
 * - NO fake purchases
 * - NO dark patterns
 * - Throttled to prevent spam
 * - Privacy-safe (no customer names/emails)
 * 
 * @module components/svm/RecentPurchasesTicker
 */

'use client'

import { useState, useEffect } from 'react'

interface RecentPurchase {
  productName: string
  city: string | null
  timeAgo: string
}

interface RecentPurchasesTickerProps {
  tenantId: string
  position?: 'bottom-left' | 'bottom-right'
  autoHide?: boolean
  autoHideDelay?: number
  maxItems?: number
  isDemo?: boolean
}

export function RecentPurchasesTicker({
  tenantId,
  position = 'bottom-left',
  autoHide = true,
  autoHideDelay = 5000,
  maxItems = 3,
  isDemo = false
}: RecentPurchasesTickerProps) {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        const response = await fetch(
          `/api/svm/social-proof?tenantId=${tenantId}&type=store-activity`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }
        
        const data = await response.json()
        if (data.success && data.recentPurchases?.length > 0) {
          setPurchases(data.recentPurchases.slice(0, maxItems))
          setVisible(true)
        }
      } catch (error) {
        console.warn('[RecentPurchasesTicker] Failed to fetch activity:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecentActivity()
  }, [tenantId, maxItems])
  
  useEffect(() => {
    if (purchases.length <= 1 || !visible) return
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % purchases.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [purchases.length, visible])
  
  useEffect(() => {
    if (!autoHide || !visible) return
    
    const timeout = setTimeout(() => {
      setVisible(false)
    }, autoHideDelay)
    
    return () => clearTimeout(timeout)
  }, [autoHide, autoHideDelay, visible])
  
  if (loading || purchases.length === 0 || !visible) {
    return null
  }
  
  const currentPurchase = purchases[currentIndex]
  const positionClasses = position === 'bottom-left' 
    ? 'left-4' 
    : 'right-4'
  
  return (
    <div
      className={`fixed bottom-4 ${positionClasses} z-50 animate-fade-in-up`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentPurchase.productName}
            </p>
            <p className="text-xs text-gray-500">
              {currentPurchase.city && (
                <span>Purchased in {currentPurchase.city} </span>
              )}
              <span className="text-gray-400">{currentPurchase.timeAgo}</span>
            </p>
            {isDemo && (
              <p className="text-xs text-amber-600 mt-1">Demo data</p>
            )}
          </div>
          
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
        
        {purchases.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {purchases.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function PurchaseCountBadge({
  count,
  label = 'bought today',
  isDemo = false
}: {
  count: number
  label?: string
  isDemo?: boolean
}) {
  if (count === 0) return null
  
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
      <svg 
        className="w-4 h-4 text-gray-500" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
        />
      </svg>
      <span className="text-sm text-gray-700">
        <span className="font-medium">{count}</span> {label}
      </span>
      {isDemo && (
        <span className="text-xs text-amber-600">(Demo)</span>
      )}
    </div>
  )
}
