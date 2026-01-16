'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, ShoppingCart, AlertTriangle, Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react'
import { VendorGroupedCartSection } from './VendorGroupedCartSection'
import type { MvmCart, CartConflict } from '@/lib/mvm/cart'

interface MultiVendorCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  tenantSlug: string
  isDemo?: boolean
}

export function MultiVendorCartDrawer({
  isOpen,
  onClose,
  tenantSlug,
  isDemo = false
}: MultiVendorCartDrawerProps) {
  const [cart, setCart] = useState<MvmCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [conflicts, setConflicts] = useState<CartConflict[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchCart = useCallback(async () => {
    if (!isOnline) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/mvm/cart?tenantSlug=${tenantSlug}`)
      const data = await response.json()
      
      if (data.success) {
        setCart(data.cart)
      } else {
        setError(data.error || 'Failed to load cart')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug, isOnline])

  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen, fetchCart])

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!isOnline) {
      setError('You are offline. Changes will sync when online.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/mvm/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, itemId, quantity })
      })
      const data = await response.json()
      
      if (data.success) {
        setCart(data.cart)
        setError(null)
      } else {
        setError(data.error || 'Failed to update quantity')
      }
    } catch (err) {
      setError('Failed to update quantity')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!isOnline) {
      setError('You are offline. Changes will sync when online.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/mvm/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, itemId })
      })
      const data = await response.json()
      
      if (data.success) {
        setCart(data.cart)
        setError(null)
      } else {
        setError(data.error || 'Failed to remove item')
      }
    } catch (err) {
      setError('Failed to remove item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearVendor = async (vendorId: string) => {
    if (!isOnline) {
      setError('You are offline. Changes will sync when online.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/mvm/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, vendorId })
      })
      const data = await response.json()
      
      if (data.success) {
        setCart(data.cart)
        setError(null)
      } else {
        setError(data.error || 'Failed to clear vendor items')
      }
    } catch (err) {
      setError('Failed to clear vendor items')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrepareCheckout = async () => {
    if (!isOnline) {
      setError('You must be online to proceed to checkout')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/mvm/cart/prepare-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug })
      })
      const data = await response.json()
      
      if (data.success) {
        setCart(data.cart)
        setConflicts(data.conflicts || [])
        
        if (data.readyForCheckout) {
          setError(null)
        } else if (data.hasBlockingConflicts) {
          setError('Some items need attention before checkout')
        }
      } else {
        setError(data.error || 'Failed to prepare checkout')
      }
    } catch (err) {
      setError('Failed to prepare checkout')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Your Cart</h2>
            {cart && cart.totalItems > 0 && (
              <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {cart.totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600">Offline - Cart saved locally</span>
              </>
            )}
          </div>
          <button
            onClick={fetchCart}
            disabled={isLoading || !isOnline}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isDemo && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              Demo Mode - This cart contains sample data
            </p>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Some items need attention:
            </p>
            <ul className="text-xs text-amber-700 space-y-1">
              {conflicts.slice(0, 3).map((conflict, idx) => (
                <li key={idx}>{conflict.message}</li>
              ))}
              {conflicts.length > 3 && (
                <li>...and {conflicts.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && !cart ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : !cart || cart.vendorGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-700">Your cart is empty</h3>
              <p className="text-sm text-slate-500 mt-1">
                Browse the marketplace and add items from multiple vendors
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
                <p className="text-sm text-blue-700">
                  Items from {cart.vendorGroups.length} vendor{cart.vendorGroups.length > 1 ? 's' : ''} will be checked out together
                </p>
              </div>
              
              {cart.vendorGroups.map((group) => (
                <VendorGroupedCartSection
                  key={group.vendorId}
                  vendorGroup={group}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearVendor={handleClearVendor}
                  isLoading={isLoading}
                />
              ))}
            </>
          )}
        </div>

        {cart && cart.totalItems > 0 && (
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Total ({cart.totalItems} items)</span>
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(cart.totalAmount)}
              </span>
            </div>
            <button
              onClick={handlePrepareCheckout}
              disabled={isLoading || !isOnline}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </button>
            <p className="text-xs text-center text-slate-500 mt-2">
              Checkout coming in Wave K.2
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultiVendorCartDrawer
