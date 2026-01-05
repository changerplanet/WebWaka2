'use client'

import { useState, useEffect } from 'react'
import { 
  SVMProvider, 
  ProductGrid, 
  ProductDetail,
  CartDrawer,
  MiniCart,
  CheckoutPage,
  OrderConfirmation,
  SVMProduct
} from '@/components/svm'
import { Store, ShoppingBag, User, Search, Menu, X } from 'lucide-react'

// ============================================================================
// TENANT CONTEXT LOADER
// ============================================================================

function useTenantContext() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check URL query param first
    const params = new URLSearchParams(window.location.search)
    const urlTenant = params.get('tenant')
    if (urlTenant) {
      setTenantId(urlTenant)
      setIsLoading(false)
      return
    }

    // Check localStorage
    const storedContext = localStorage.getItem('webwaka_tenant_context')
    if (storedContext) {
      try {
        const { id } = JSON.parse(storedContext)
        if (id) setTenantId(id)
      } catch {
        // Invalid JSON
      }
    }
    setIsLoading(false)
  }, [])

  return { tenantId, isLoading }
}

// ============================================================================
// STOREFRONT HEADER
// ============================================================================

function StoreHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">WebWaka Store</span>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <User className="w-6 h-6 text-slate-700" />
            </button>
            <MiniCart />
            <button 
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={onMenuClick}
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// STOREFRONT FOOTER
// ============================================================================

function StoreFooter() {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">WebWaka</span>
            </div>
            <p className="text-slate-400 text-sm">
              Your one-stop shop for quality products. Built for Nigerian businesses.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">All Products</a></li>
              <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sale</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
          <p>© 2025 WebWaka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// MAIN STORE PAGE
// ============================================================================

type PageView = 'products' | 'product-detail' | 'checkout' | 'confirmation'

function StorefrontContent() {
  const [currentView, setCurrentView] = useState<PageView>('products')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const handleSelectProduct = (product: SVMProduct) => {
    setSelectedProductId(product.id)
    setCurrentView('product-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToProducts = () => {
    setSelectedProductId(null)
    setCurrentView('products')
  }

  const handleGoToCheckout = () => {
    setCurrentView('checkout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOrderComplete = () => {
    setCurrentView('confirmation')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContinueShopping = () => {
    setCurrentView('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StoreHeader />
      
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {currentView === 'products' && (
          <ProductGrid onSelectProduct={handleSelectProduct} />
        )}
        
        {currentView === 'product-detail' && selectedProductId && (
          <ProductDetail 
            productId={selectedProductId} 
            onBack={handleBackToProducts} 
          />
        )}
        
        {currentView === 'checkout' && (
          <CheckoutPage 
            onBack={() => setCurrentView('products')}
            onComplete={handleOrderComplete}
          />
        )}
        
        {currentView === 'confirmation' && (
          <OrderConfirmation onContinueShopping={handleContinueShopping} />
        )}
      </main>
      
      <StoreFooter />
      
      <CartDrawer onCheckout={handleGoToCheckout} />
    </div>
  )
}

export default function StorePage() {
  const { tenantId, isLoading } = useTenantContext()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading store...</p>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <Store className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-4">Store Not Found</h1>
          <p className="text-slate-600 mb-6">This store link is invalid or the business is not available.</p>
          <a 
            href="/home" 
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <SVMProvider tenantId={tenantId}>
      <StorefrontContent />
    </SVMProvider>
  )
}
