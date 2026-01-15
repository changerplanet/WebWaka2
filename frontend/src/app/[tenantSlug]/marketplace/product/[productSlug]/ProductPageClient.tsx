'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, Menu, Star, Award, Shield, Package, ChevronLeft, ShoppingCart, Plus, Minus, Heart, Share2 } from 'lucide-react'
import type { MarketplaceVendor, MarketplaceProduct } from '@/lib/marketplace/marketplace-resolver'

interface ProductPageClientProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
  product: MarketplaceProduct
  vendor: MarketplaceVendor
}

function VendorTrustBadge({ scoreBand, size = 'sm' }: { scoreBand: string; size?: 'sm' | 'md' }) {
  const config: Record<string, { icon: typeof Star; color: string; bgColor: string; label: string }> = {
    EXCELLENT: {
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      label: 'Top Rated'
    },
    GOOD: {
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Trusted'
    },
    NEW: {
      icon: Star,
      color: 'text-slate-500',
      bgColor: 'bg-slate-50',
      label: 'New'
    }
  }

  const badge = config[scoreBand] || config.NEW
  const Icon = badge.icon
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  if (scoreBand === 'NEEDS_ATTENTION') return null

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} ${badge.bgColor} ${badge.color} rounded-full font-medium`}>
      <Icon className="w-3 h-3" />
      {badge.label}
    </span>
  )
}

function ProductHeader({ 
  tenantSlug, 
  tenantName, 
  appName, 
  logoUrl,
  primaryColor
}: { 
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${tenantSlug}/marketplace`} className="flex items-center gap-3">
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
            <div>
              <span className="font-bold text-lg text-slate-900">{appName || tenantName}</span>
              <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Marketplace
              </span>
            </div>
          </Link>

          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  )
}

function ProductFooter({ tenantName }: { tenantName: string }) {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} {tenantName} Marketplace. Powered by WebWaka.</p>
        </div>
      </div>
    </footer>
  )
}

export default function ProductPageClient({
  tenantId,
  tenantSlug,
  tenantName,
  appName,
  logoUrl,
  primaryColor,
  product,
  vendor
}: ProductPageClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsAddingToCart(false)
    alert(`Added ${quantity} x ${product.name} to cart`)
  }

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ProductHeader 
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        appName={appName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />
      
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link 
              href={`/${tenantSlug}/marketplace`}
              className="hover:text-slate-900 transition-colors"
            >
              Marketplace
            </Link>
            <span>/</span>
            <Link 
              href={`/${tenantSlug}/marketplace/vendor/${vendor.slug}`}
              className="hover:text-slate-900 transition-colors"
            >
              {vendor.name}
            </Link>
            <span>/</span>
            <span className="text-slate-900 truncate">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="aspect-square relative">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <Package className="w-24 h-24 text-slate-300" />
                  </div>
                )}
                
                {discount && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  {product.name}
                </h1>
                
                <Link 
                  href={`/${tenantSlug}/marketplace/vendor/${vendor.slug}`}
                  className="inline-flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-green-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {vendor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-slate-600 group-hover:text-green-600 transition-colors">
                    {vendor.name}
                  </span>
                  <VendorTrustBadge scoreBand={vendor.scoreBand} />
                </Link>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-green-600">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-xl text-slate-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {product.description && (
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600">{product.description}</p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  
                  <button className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Heart className="w-5 h-5 text-slate-400" />
                  </button>
                  
                  <button className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Share2 className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <Link
                href={`/${tenantSlug}/marketplace/vendor/${vendor.slug}`}
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-green-600 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {vendor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{vendor.name}</span>
                      {vendor.isVerified && <Shield className="w-4 h-4 text-blue-500" />}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {vendor.totalProducts} products
                      </span>
                      {vendor.averageRating !== null && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          {vendor.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <ProductFooter tenantName={tenantName} />
    </div>
  )
}
