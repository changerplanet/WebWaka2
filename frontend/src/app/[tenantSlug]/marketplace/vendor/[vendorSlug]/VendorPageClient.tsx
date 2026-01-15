'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, Search, Menu, Star, Award, Shield, Package, MapPin, ChevronLeft, ShoppingCart } from 'lucide-react'
import type { MarketplaceVendor, MarketplaceProduct } from '@/lib/marketplace/marketplace-resolver'

interface VendorPageClientProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
  vendor: MarketplaceVendor
  initialProducts: MarketplaceProduct[]
  totalProducts: number
}

function VendorTrustBadge({ scoreBand, averageRating, totalRatings }: { 
  scoreBand: string
  averageRating: number | null
  totalRatings: number 
}) {
  const config: Record<string, { icon: typeof Star; color: string; bgColor: string; label: string }> = {
    EXCELLENT: {
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      label: 'Top Rated Seller'
    },
    GOOD: {
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      label: 'Trusted Seller'
    },
    NEW: {
      icon: Star,
      color: 'text-slate-500',
      bgColor: 'bg-slate-50 border-slate-200',
      label: 'New Seller'
    }
  }

  const badge = config[scoreBand] || config.NEW
  const Icon = badge.icon

  if (scoreBand === 'NEEDS_ATTENTION') return null

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 ${badge.bgColor} border rounded-full`}>
      <Icon className={`w-5 h-5 ${badge.color}`} />
      <span className={`font-medium ${badge.color}`}>{badge.label}</span>
      {averageRating !== null && totalRatings > 0 && (
        <>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-medium text-slate-700">{averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({totalRatings} reviews)</span>
          </div>
        </>
      )}
    </div>
  )
}

function ProductCard({ product, tenantSlug }: { product: MarketplaceProduct; tenantSlug: string }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <Link 
      href={`/${tenantSlug}/marketplace/product/${product.slug}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
    >
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-slate-300" />
          </div>
        )}
        
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            SALE
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-slate-900 group-hover:text-green-600 transition-colors line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-600">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        
        <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </Link>
  )
}

function VendorHeader({ 
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

          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  )
}

function VendorFooter({ tenantName }: { tenantName: string }) {
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

export default function VendorPageClient({
  tenantId,
  tenantSlug,
  tenantName,
  appName,
  logoUrl,
  primaryColor,
  vendor,
  initialProducts,
  totalProducts
}: VendorPageClientProps) {
  const [products] = useState(initialProducts)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <VendorHeader 
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        appName={appName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href={`/${tenantSlug}/marketplace`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>

        <div className="h-40 md:h-56 bg-gradient-to-br from-slate-200 to-slate-300 relative">
          {vendor.banner && (
            <img 
              src={vendor.banner} 
              alt={vendor.name} 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                {vendor.logo ? (
                  <img 
                    src={vendor.logo} 
                    alt={vendor.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-600 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {vendor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{vendor.name}</h1>
                  {vendor.isVerified && (
                    <Shield className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                
                {vendor.description && (
                  <p className="text-slate-600 mb-4 max-w-2xl">{vendor.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                  {vendor.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {vendor.city}{vendor.state ? `, ${vendor.state}` : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
                  </span>
                </div>
                
                <VendorTrustBadge 
                  scoreBand={vendor.scoreBand}
                  averageRating={vendor.averageRating}
                  totalRatings={vendor.totalRatings}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Products</h2>
          
          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No products yet</h3>
              <p className="text-slate-600">
                This vendor hasn't listed any products yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} tenantSlug={tenantSlug} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <VendorFooter tenantName={tenantName} />
    </div>
  )
}
