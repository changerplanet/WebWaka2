'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  SVMProvider, 
  useSVM,
  ProductGrid, 
  ProductDetail,
  CartDrawer,
  MiniCart,
  CheckoutPage,
  OrderConfirmation,
  SVMProduct
} from '@/components/svm'
import { OfflineCartIndicator } from '@/components/svm/OfflineCartIndicator'
import { RecentPurchasesTicker } from '@/components/svm/RecentPurchasesTicker'
import { useOfflineCart } from '@/hooks/useOfflineCart'
import { Store, User, Search, Menu } from 'lucide-react'

interface StorefrontClientProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
}

type PageView = 'products' | 'product-detail' | 'checkout' | 'confirmation'

function OfflineCartWrapper() {
  const { tenantId, sessionId, cart } = useSVM()
  const { statusSignal, conflicts, restoreCart, resolveConflicts } = useOfflineCart({
    tenantId,
    sessionId,
    autoSave: true
  })

  if (statusSignal.status === 'synced' && conflicts.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40">
      <OfflineCartIndicator 
        statusSignal={statusSignal}
        conflicts={conflicts}
        onRestore={() => restoreCart([])}
        onDismiss={() => {}}
      />
    </div>
  )
}

function StorefrontHeader({ 
  tenantSlug, 
  tenantName, 
  appName, 
  logoUrl,
  primaryColor,
  onMenuClick 
}: { 
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
  onMenuClick?: () => void 
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${tenantSlug}/store`} className="flex items-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={tenantName} 
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-xl text-slate-900">{appName || tenantName}</span>
          </Link>

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

function StorefrontFooter({ tenantName }: { tenantName: string }) {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <span className="font-bold text-xl mb-4 block">{tenantName}</span>
            <p className="text-slate-400 text-sm">
              Quality products for Nigerian businesses.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">All Products</a></li>
              <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
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
          <p>© {new Date().getFullYear()} {tenantName}. Powered by WebWaka.</p>
        </div>
      </div>
    </footer>
  )
}

function StorefrontContent({ 
  tenantId,
  tenantSlug,
  tenantName,
  appName,
  logoUrl,
  primaryColor
}: StorefrontClientProps) {
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
      <StorefrontHeader 
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        appName={appName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />
      
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
      
      <StorefrontFooter tenantName={tenantName} />
      
      <CartDrawer onCheckout={handleGoToCheckout} />
      
      <OfflineCartWrapper />
      
      <RecentPurchasesTicker tenantId={tenantId} position="bottom-right" />
    </div>
  )
}

export default function StorefrontClient(props: StorefrontClientProps) {
  return (
    <SVMProvider tenantId={props.tenantId}>
      <StorefrontContent {...props} />
    </SVMProvider>
  )
}
