'use client'

import Link from 'next/link'
import { 
  SVMProvider, 
  useSVM,
  ProductDetail,
  CartDrawer,
  MiniCart,
} from '@/components/svm'
import { OfflineCartIndicator } from '@/components/svm/OfflineCartIndicator'
import { RecentPurchasesTicker } from '@/components/svm/RecentPurchasesTicker'
import { useOfflineCart } from '@/hooks/useOfflineCart'
import { Store, User, Search, Menu, ChevronLeft } from 'lucide-react'

interface ProductPageClientProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
  appName: string
  logoUrl: string | null
  primaryColor: string
  productId: string
  productName: string
}

function OfflineCartWrapper() {
  const { tenantId, sessionId } = useSVM()
  const { statusSignal, conflicts, restoreCart } = useOfflineCart({
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

function ProductHeader({ 
  tenantSlug, 
  tenantName, 
  appName, 
  logoUrl,
  primaryColor,
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
            <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
          </div>
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
          <p>© {new Date().getFullYear()} {tenantName}. Powered by WebWaka.</p>
        </div>
      </div>
    </footer>
  )
}

function ProductPageContent({ 
  tenantId,
  tenantSlug,
  tenantName,
  appName,
  logoUrl,
  primaryColor,
  productId,
}: Omit<ProductPageClientProps, 'productName'>) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ProductHeader 
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        appName={appName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />
      
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link 
            href={`/${tenantSlug}/store`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Store
          </Link>
          
          <ProductDetail 
            productId={productId} 
            onBack={() => window.history.back()} 
          />
        </div>
      </main>
      
      <ProductFooter tenantName={tenantName} />
      
      <CartDrawer onCheckout={() => {
        window.location.href = `/${tenantSlug}/store?checkout=true`
      }} />
      
      <OfflineCartWrapper />
      
      <RecentPurchasesTicker tenantId={tenantId} position="bottom-right" />
    </div>
  )
}

export default function ProductPageClient(props: ProductPageClientProps) {
  return (
    <SVMProvider tenantId={props.tenantId}>
      <ProductPageContent 
        tenantId={props.tenantId}
        tenantSlug={props.tenantSlug}
        tenantName={props.tenantName}
        appName={props.appName}
        logoUrl={props.logoUrl}
        primaryColor={props.primaryColor}
        productId={props.productId}
      />
    </SVMProvider>
  )
}
