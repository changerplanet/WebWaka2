'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, Search, Menu, Star, Award, Shield, Package, MapPin } from 'lucide-react'
import type { MarketplaceVendor } from '@/lib/marketplace/marketplace-resolver'

interface MarketplaceClientProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
  initialVendors: MarketplaceVendor[]
  totalVendors: number
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

function VendorCard({ vendor, tenantSlug }: { vendor: MarketplaceVendor; tenantSlug: string }) {
  return (
    <Link 
      href={`/${tenantSlug}/marketplace/vendor/${vendor.slug}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
    >
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative">
        {vendor.banner ? (
          <img 
            src={vendor.banner} 
            alt={vendor.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-12 h-12 text-slate-300" />
          </div>
        )}
        
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden">
            {vendor.logo ? (
              <img 
                src={vendor.logo} 
                alt={vendor.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {vendor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-8 pb-4 px-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors truncate">
            {vendor.name}
          </h3>
          {vendor.isVerified && (
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-3 min-h-[2.5rem]">
          {vendor.description || 'Quality products and services'}
        </p>
        
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {vendor.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {vendor.city}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {vendor.totalProducts} products
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <VendorTrustBadge scoreBand={vendor.scoreBand} />
          
          {vendor.averageRating !== null && vendor.totalRatings > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-medium text-slate-700">{vendor.averageRating.toFixed(1)}</span>
              <span className="text-slate-400">({vendor.totalRatings})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function MarketplaceHeader({ 
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
                placeholder="Search vendors..."
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

function MarketplaceFooter({ tenantName }: { tenantName: string }) {
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

export default function MarketplaceClient({
  tenantId,
  tenantSlug,
  tenantName,
  appName,
  logoUrl,
  primaryColor,
  initialVendors,
  totalVendors
}: MarketplaceClientProps) {
  const [vendors] = useState(initialVendors)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader 
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        appName={appName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />
      
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Browse Vendors
            </h1>
            <p className="text-slate-600">
              {totalVendors} trusted {totalVendors === 1 ? 'vendor' : 'vendors'} selling quality products
            </p>
          </div>

          {vendors.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No vendors yet</h3>
              <p className="text-slate-600">
                This marketplace doesn't have any active vendors at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vendors.map(vendor => (
                <VendorCard key={vendor.id} vendor={vendor} tenantSlug={tenantSlug} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <MarketplaceFooter tenantName={tenantName} />
    </div>
  )
}
