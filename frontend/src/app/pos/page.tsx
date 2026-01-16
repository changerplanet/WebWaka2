'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  POSProvider, 
  usePOS, 
  POSStatusBar, 
  ProductSearch, 
  POSCart, 
  PaymentScreen,
  LocationSelect,
  POSProduct,
  ShiftManagement,
  XZReport,
  Reconciliation,
  TransactionHistory,
  InventoryAdjustment,
  CashTransfer,
  SupervisorDashboard,
  DailyReconciliation
} from '@/components/pos'
import { usePOSRole } from './layout'
import { 
  ShoppingBag, 
  CreditCard, 
  Users, 
  RefreshCw,
  Package,
  Grid3X3,
  X,
  Clock,
  FileText,
  Calculator,
  History,
  Menu,
  Eye,
  ArrowRightLeft,
  PackageSearch,
  BarChart3
} from 'lucide-react'

// ============================================================================
// MAIN POS SCREEN
// ============================================================================

interface Shift {
  id: string
  shiftNumber: string
  registerId: string
  locationId: string
  status: string
  openedAt: string
  closedAt?: string
  openingFloat: number
  openedByName: string
}

interface Location {
  id: string
  name: string
}

function POSMainScreen() {
  const { activeTenantId } = useAuth()
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
  const [showMobileCart, setShowMobileCart] = useState(false)
  
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [showXReport, setShowXReport] = useState(false)
  const [showZReport, setShowZReport] = useState(false)
  const [showReconciliation, setShowReconciliation] = useState(false)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [showManagerMenu, setShowManagerMenu] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  
  const [showInventoryAdjustment, setShowInventoryAdjustment] = useState(false)
  const [showCashTransfer, setShowCashTransfer] = useState(false)
  const [showSupervisorDashboard, setShowSupervisorDashboard] = useState(false)
  const [showDailyReconciliation, setShowDailyReconciliation] = useState(false)
  
  const { posRole, hasPermission } = usePOSRole()
  const isSupervisorOrAbove = posRole === 'POS_SUPERVISOR' || posRole === 'POS_MANAGER'
  const isManager = posRole === 'POS_MANAGER'
  const hasZReport = currentShift?.status === 'RECONCILED'

  useEffect(() => {
    if (activeTenantId && locationId) {
      fetchCurrentShift()
      fetchLocations()
    }
  }, [activeTenantId, locationId])

  const fetchCurrentShift = async () => {
    try {
      const res = await fetch(`/api/pos/shifts?locationId=${locationId}&status=OPEN`)
      const data = await res.json()
      if (data.success && data.shifts.length > 0) {
        setCurrentShift(data.shifts[0])
      }
    } catch (err) {
      console.error('Failed to fetch shift:', err)
    }
  }

  const fetchLocations = async () => {
    try {
      const res = await fetch(`/api/commerce/pos/locations`)
      const data = await res.json()
      if (data.success) {
        setLocations(data.locations || [])
      }
    } catch (err) {
      setLocations([{ id: locationId!, name: 'Current Location' }])
    }
  }

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
                  ? 'bg-green-100 text-green-700' 
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

            <div className="flex-1" />

            <button
              onClick={() => setShowShiftModal(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentShift 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}
              data-testid="shift-btn"
            >
              <Clock className="w-4 h-4" />
              {currentShift ? currentShift.shiftNumber : 'Open Shift'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowManagerMenu(!showManagerMenu)}
                className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
                data-testid="manager-menu-btn"
              >
                <Menu className="w-4 h-4" />
              </button>
              
              {showManagerMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowManagerMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1 max-h-[80vh] overflow-y-auto">
                    <button
                      onClick={() => { setShowTransactionHistory(true); setShowManagerMenu(false) }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                    >
                      <History className="w-4 h-4 text-slate-500" />
                      Transaction History
                    </button>
                    {currentShift && (
                      <button
                        onClick={() => { setShowXReport(true); setShowManagerMenu(false) }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        X Report (Mid-Shift)
                      </button>
                    )}
                    {currentShift?.status === 'CLOSED' && (
                      <>
                        <button
                          onClick={() => { setShowZReport(true); setShowManagerMenu(false) }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <FileText className="w-4 h-4 text-amber-500" />
                          Z Report (Final)
                        </button>
                        <button
                          onClick={() => { setShowReconciliation(true); setShowManagerMenu(false) }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <Calculator className="w-4 h-4 text-emerald-500" />
                          Cash Reconciliation
                        </button>
                      </>
                    )}
                    
                    {/* POS-P5 Components - Supervisor+ Only */}
                    {isSupervisorOrAbove && (
                      <>
                        <div className="border-t border-slate-100 my-1" />
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">
                          Supervisor Tools
                        </div>
                        
                        {/* Supervisor Dashboard - Read-only, no state gate */}
                        <button
                          onClick={() => { setShowSupervisorDashboard(true); setShowManagerMenu(false) }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <Eye className="w-4 h-4 text-indigo-500" />
                          Supervisor Dashboard
                        </button>
                        
                        {/* Inventory Adjustment - Shift open or closed */}
                        <button
                          onClick={() => { setShowInventoryAdjustment(true); setShowManagerMenu(false) }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <PackageSearch className="w-4 h-4 text-amber-500" />
                          Inventory Adjustment
                        </button>
                        
                        {/* Cash Transfer - Shift must be open */}
                        {currentShift?.status === 'OPEN' && (
                          <button
                            onClick={() => { setShowCashTransfer(true); setShowManagerMenu(false) }}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                          >
                            <ArrowRightLeft className="w-4 h-4 text-purple-500" />
                            Cash Movement
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Daily Reconciliation - Manager Only, after Z-Report */}
                    {isManager && currentShift?.status === 'RECONCILED' && (
                      <>
                        <div className="border-t border-slate-100 my-1" />
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">
                          Manager Tools
                        </div>
                        <button
                          onClick={() => { setShowDailyReconciliation(true); setShowManagerMenu(false) }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <BarChart3 className="w-4 h-4 text-teal-500" />
                          Daily Reconciliation
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick product grid */}
          {showQuickGrid && (
            <div className="flex-1 overflow-y-auto" data-testid="product-grid">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-full" data-testid="products-loading">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
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

        {/* Right: Cart - Responsive drawer on mobile */}
        <div 
          className={`
            fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out
            md:relative md:inset-auto md:z-auto md:w-96 md:max-w-none md:transform-none
            ${showMobileCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
          data-testid="cart-panel"
        >
          {/* Mobile cart header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="font-semibold text-lg">Cart ({cart.items.length})</h2>
            <button
              onClick={() => setShowMobileCart(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <POSCart />
          </div>

          {/* Checkout button */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => setView('payment')}
              disabled={cart.items.length === 0}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3 touch-manipulation"
              data-testid="checkout-btn"
            >
              <CreditCard className="w-6 h-6" />
              Checkout ₦{cart.grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </button>
          </div>
        </div>
        
        {/* Mobile cart overlay */}
        {showMobileCart && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setShowMobileCart(false)}
          />
        )}
        
        {/* Mobile cart FAB */}
        <button
          onClick={() => setShowMobileCart(true)}
          className="fixed bottom-6 right-6 z-20 md:hidden w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation"
        >
          <ShoppingBag className="w-7 h-7" />
          {cart.items.length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {cart.items.length}
            </span>
          )}
        </button>
      </div>

      {showShiftModal && activeTenantId && (
        <ShiftManagement
          tenantId={activeTenantId}
          locations={locations.length > 0 ? locations : [{ id: locationId!, name: 'Current Location' }]}
          currentShift={currentShift}
          onShiftChange={(shift) => {
            setCurrentShift(shift)
            if (!shift) {
              fetchCurrentShift()
            }
          }}
          onClose={() => setShowShiftModal(false)}
        />
      )}

      {showXReport && currentShift && (
        <XZReport
          shiftId={currentShift.id}
          reportType="X"
          onClose={() => setShowXReport(false)}
        />
      )}

      {showZReport && currentShift && (
        <XZReport
          shiftId={currentShift.id}
          reportType="Z"
          onClose={() => setShowZReport(false)}
        />
      )}

      {showReconciliation && currentShift && (
        <Reconciliation
          shiftId={currentShift.id}
          onComplete={() => {
            setShowReconciliation(false)
            fetchCurrentShift()
          }}
          onClose={() => setShowReconciliation(false)}
        />
      )}

      {showTransactionHistory && activeTenantId && (
        <TransactionHistory
          tenantId={activeTenantId}
          locationId={locationId || undefined}
          onClose={() => setShowTransactionHistory(false)}
          currentShift={currentShift}
          posRole={posRole}
        />
      )}

      {/* POS-P5: Inventory Adjustment - Supervisor+ */}
      {showInventoryAdjustment && isSupervisorOrAbove && locationId && (
        <InventoryAdjustment
          locationId={locationId}
          shiftId={currentShift?.id}
          onClose={() => setShowInventoryAdjustment(false)}
        />
      )}

      {/* POS-P5: Cash Transfer - Supervisor+, shift open */}
      {showCashTransfer && isSupervisorOrAbove && locationId && currentShift?.status === 'OPEN' && (
        <CashTransfer
          locationId={locationId}
          currentShiftId={currentShift.id}
          onClose={() => setShowCashTransfer(false)}
        />
      )}

      {/* POS-P5: Supervisor Dashboard - Supervisor+, read-only */}
      {showSupervisorDashboard && isSupervisorOrAbove && (
        <SupervisorDashboard
          locationId={locationId || undefined}
          onClose={() => setShowSupervisorDashboard(false)}
        />
      )}

      {/* POS-P5: Daily Reconciliation - Manager only, after Z-Report */}
      {showDailyReconciliation && isManager && currentShift?.status === 'RECONCILED' && (
        <DailyReconciliation
          locationId={locationId || undefined}
          onClose={() => setShowDailyReconciliation(false)}
        />
      )}
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
      className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-green-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
      data-testid={`product-card-${product.productId}`}
    >
      {/* Product image placeholder */}
      <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-2">
        <Package className="w-8 h-8 text-slate-300" />
      </div>
      
      <p className="font-medium text-sm text-slate-900 truncate">{product.name}</p>
      <p className="text-xs text-slate-500 truncate">{product.sku}</p>
      
      <div className="mt-2 flex items-center justify-between">
        <span className="font-semibold text-green-600">${product.price.toFixed(2)}</span>
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
// POS PAGE CONTENT (uses AuthProvider context)
// ============================================================================

function POSPageContent() {
  const { activeTenantId, activeTenant, isLoading: authLoading } = useAuth()
  const [isSetupComplete, setIsSetupComplete] = useState(false)

  // Check for existing POS session
  useEffect(() => {
    if (activeTenantId) {
      const session = localStorage.getItem('pos_session')
      if (session) {
        try {
          const { locationId, staffId, tenantId: sessionTenant } = JSON.parse(session)
          // Only restore if session is for the same tenant
          if (locationId && staffId && sessionTenant === activeTenantId) {
            setIsSetupComplete(true)
          }
        } catch {
          // Invalid session
        }
      }
      
      // Sync tenant context to localStorage for backwards compatibility
      localStorage.setItem('webwaka_tenant_context', JSON.stringify({
        id: activeTenantId,
        name: activeTenant?.tenantName,
        slug: activeTenant?.tenantSlug
      }))
    }
  }, [activeTenantId, activeTenant])

  // Loading state is handled by the layout
  if (authLoading) {
    return null
  }

  // This shouldn't happen as layout handles it, but just in case
  if (!activeTenantId) {
    return null
  }

  return (
    <POSProvider tenantId={activeTenantId}>
      {isSetupComplete ? (
        <POSMainScreen />
      ) : (
        <LocationSelect onComplete={() => setIsSetupComplete(true)} />
      )}
    </POSProvider>
  )
}

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function POSPage() {
  // The AuthProvider is in the layout, so we can use useAuth here
  return <POSPageContent />
}
