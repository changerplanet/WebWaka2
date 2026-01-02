'use client'

import { useState, useEffect } from 'react'
import { 
  POSProvider, 
  usePOS, 
  POSStatusBar, 
  ProductSearch, 
  POSCart, 
  PaymentScreen,
  LocationSelect,
  POSProduct
} from '@/components/pos'
import { 
  ShoppingBag, 
  CreditCard, 
  Users, 
  RefreshCw,
  Package,
  Grid3X3
} from 'lucide-react'

// ============================================================================
// MAIN POS SCREEN
// ============================================================================

function POSMainScreen() {
  const { 
    cart, 
    locationId, 
    staffId, 
    products, 
    isLoadingProducts,
    refreshProducts,
    addToCart,
    isOnline
  } = usePOS()
  
  const [view, setView] = useState<'sale' | 'payment'>('sale')
  const [showQuickGrid, setShowQuickGrid] = useState(true)

  // Load products on mount
  useEffect(() => {
    if (locationId) {
      refreshProducts()
    }
  }, [locationId])

  const handlePaymentComplete = () => {
    setView('sale')
  }

  if (view === 'payment') {
    return (
      <PaymentScreen 
        onComplete={handlePaymentComplete}
        onCancel={() => setView('sale')}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100" data-testid="pos-main-screen">
      {/* Status bar */}
      <POSStatusBar />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search bar */}
          <div className="mb-4">
            <ProductSearch />
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowQuickGrid(!showQuickGrid)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showQuickGrid 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              data-testid="toggle-quick-items-btn"
            >
              <Grid3X3 className="w-4 h-4" />
              Quick Items
            </button>
            
            <button
              onClick={refreshProducts}
              disabled={isLoadingProducts || !isOnline}
              className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              data-testid="sync-products-btn"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              Sync Products
            </button>

            <button 
              className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
              data-testid="customer-btn"
            >
              <Users className="w-4 h-4" />
              Customer
            </button>
          </div>

          {/* Quick product grid */}
          {showQuickGrid && (
            <div className="flex-1 overflow-y-auto" data-testid="product-grid">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-full" data-testid="products-loading">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Loading products...</p>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center h-full" data-testid="no-products">
                  <div className="text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No products available</p>
                    <p className="text-sm text-slate-400">Use the search bar to find products</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {products.slice(0, 20).map((product) => (
                    <QuickProductCard 
                      key={`${product.productId}-${product.variantId || ''}`}
                      product={product}
                      onSelect={() => addToCart(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col" data-testid="cart-panel">
          <div className="flex-1 overflow-hidden">
            <POSCart />
          </div>

          {/* Checkout button */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => setView('payment')}
              disabled={cart.items.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3 touch-manipulation"
              data-testid="checkout-btn"
            >
              <CreditCard className="w-6 h-6" />
              Checkout ${cart.grandTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// QUICK PRODUCT CARD
// ============================================================================

interface QuickProductCardProps {
  product: POSProduct
  onSelect: () => void
}

function QuickProductCard({ product, onSelect }: QuickProductCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={product.trackInventory && !product.isInStock}
      className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-indigo-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
      data-testid={`product-card-${product.productId}`}
    >
      {/* Product image placeholder */}
      <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-2">
        <Package className="w-8 h-8 text-slate-300" />
      </div>
      
      <p className="font-medium text-sm text-slate-900 truncate">{product.name}</p>
      <p className="text-xs text-slate-500 truncate">{product.sku}</p>
      
      <div className="mt-2 flex items-center justify-between">
        <span className="font-semibold text-indigo-600">${product.price.toFixed(2)}</span>
        {product.trackInventory && (
          <span className={`text-xs ${product.isInStock ? 'text-emerald-600' : 'text-red-500'}`}>
            {product.quantityAvailable}
          </span>
        )}
      </div>
    </button>
  )
}

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function POSPage() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [tenantId, setTenantId] = useState<string>('demo-tenant')

  // Check for stored session
  useEffect(() => {
    const session = localStorage.getItem('pos_session')
    if (session) {
      const { locationId, staffId } = JSON.parse(session)
      if (locationId && staffId) {
        setIsSetupComplete(true)
      }
    }
  }, [])

  return (
    <POSProvider tenantId={tenantId}>
      {isSetupComplete ? (
        <POSMainScreen />
      ) : (
        <LocationSelect onComplete={() => setIsSetupComplete(true)} />
      )}
    </POSProvider>
  )
}
