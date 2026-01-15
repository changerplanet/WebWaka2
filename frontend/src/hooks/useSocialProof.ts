/**
 * Social Proof Hook (Wave G3)
 * 
 * React hook for fetching and managing social proof data.
 * Handles caching, loading states, and error recovery.
 * 
 * @module hooks/useSocialProof
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { type ProductSocialProof } from '@/lib/svm/social-proof-service'

interface UseSocialProofOptions {
  tenantId: string
  productId?: string
  productIds?: string[]
  enabled?: boolean
  cacheTimeMs?: number
}

interface UseSocialProofResult {
  socialProof: ProductSocialProof | null
  batchSocialProof: Map<string, ProductSocialProof>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isDemo: boolean
}

const cache = new Map<string, { data: ProductSocialProof; timestamp: number }>()
const DEFAULT_CACHE_TIME = 5 * 60 * 1000

export function useSocialProof({
  tenantId,
  productId,
  productIds,
  enabled = true,
  cacheTimeMs = DEFAULT_CACHE_TIME
}: UseSocialProofOptions): UseSocialProofResult {
  const [socialProof, setSocialProof] = useState<ProductSocialProof | null>(null)
  const [batchSocialProof, setBatchSocialProof] = useState<Map<string, ProductSocialProof>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const fetchSingleProduct = useCallback(async () => {
    if (!productId || !tenantId) return
    
    const cacheKey = `${tenantId}:${productId}`
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cacheTimeMs) {
      setSocialProof(cached.data)
      setIsDemo(cached.data.isDemo)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      
      const response = await fetch(
        `/api/svm/social-proof?tenantId=${tenantId}&productId=${productId}`,
        { signal: abortControllerRef.current.signal }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch social proof')
      }
      
      const data = await response.json()
      
      if (data.success && data.socialProof) {
        setSocialProof(data.socialProof)
        setIsDemo(data.socialProof.isDemo)
        cache.set(cacheKey, {
          data: data.socialProof,
          timestamp: Date.now()
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [tenantId, productId, cacheTimeMs])
  
  const fetchBatchProducts = useCallback(async () => {
    if (!productIds || productIds.length === 0 || !tenantId) return
    
    const uncachedIds: string[] = []
    const cachedResults = new Map<string, ProductSocialProof>()
    
    for (const id of productIds) {
      const cacheKey = `${tenantId}:${id}`
      const cached = cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < cacheTimeMs) {
        cachedResults.set(id, cached.data)
      } else {
        uncachedIds.push(id)
      }
    }
    
    if (uncachedIds.length === 0) {
      setBatchSocialProof(cachedResults)
      if (cachedResults.size > 0) {
        setIsDemo(Array.from(cachedResults.values())[0].isDemo)
      }
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      
      const response = await fetch('/api/svm/social-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, productIds: uncachedIds }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch batch social proof')
      }
      
      const data = await response.json()
      
      if (data.success && data.socialProof) {
        const fetchedResults = data.socialProof as Record<string, ProductSocialProof>
        
        for (const [id, proof] of Object.entries(fetchedResults)) {
          const cacheKey = `${tenantId}:${id}`
          cache.set(cacheKey, { data: proof, timestamp: Date.now() })
          cachedResults.set(id, proof)
        }
        
        setBatchSocialProof(cachedResults)
        setIsDemo(data.isDemo || false)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [tenantId, productIds, cacheTimeMs])
  
  const refetch = useCallback(async () => {
    if (productId) {
      const cacheKey = `${tenantId}:${productId}`
      cache.delete(cacheKey)
    }
    
    if (productIds) {
      for (const id of productIds) {
        const cacheKey = `${tenantId}:${id}`
        cache.delete(cacheKey)
      }
    }
    
    if (productId) {
      await fetchSingleProduct()
    } else if (productIds) {
      await fetchBatchProducts()
    }
  }, [tenantId, productId, productIds, fetchSingleProduct, fetchBatchProducts])
  
  useEffect(() => {
    if (!enabled) return
    
    if (productId) {
      fetchSingleProduct()
    } else if (productIds && productIds.length > 0) {
      fetchBatchProducts()
    }
    
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [enabled, productId, productIds, fetchSingleProduct, fetchBatchProducts])
  
  return {
    socialProof,
    batchSocialProof,
    loading,
    error,
    refetch,
    isDemo
  }
}

export function clearSocialProofCache() {
  cache.clear()
}
