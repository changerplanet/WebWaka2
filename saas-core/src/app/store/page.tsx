'use client'

import { useState } from 'react'
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
// STOREFRONT HEADER
// ============================================================================

function StoreHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">DemoStore</span>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">DemoStore</span>
            </div>
            <p className="text-slate-400 text-sm">
              Your one-stop shop for premium products. Quality guaranteed.
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
          <p>© 2026 DemoStore. SVM Module Demo. All rights reserved.</p>
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
  return (
    <SVMProvider tenantId="demo-tenant">
      <StorefrontContent />
    </SVMProvider>
  )
}
