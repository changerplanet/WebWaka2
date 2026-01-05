'use client'

import { useState, useEffect } from 'react'
import { 
  MVMProvider,
  VendorDashboard,
  VendorOrdersView,
  VendorProductsView,
  VendorEarningsView,
  VendorProfile
} from '@/components/mvm'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  User,
  Menu,
  X,
  Store,
  ChevronRight,
  LogOut
} from 'lucide-react'

// ============================================================================
// SIDEBAR
// ============================================================================

type View = 'dashboard' | 'orders' | 'products' | 'earnings' | 'profile'

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  isOpen: boolean
  onClose: () => void
}

function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const navItems: { key: View; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'earnings', label: 'Earnings', icon: DollarSign },
    { key: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 z-50
        transform transition-transform lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Vendor Portal</p>
                  <p className="text-xs text-slate-400">WebWaka</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.key
              
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onViewChange(item.key)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  data-testid={`nav-${item.key}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ============================================================================
// HEADER
// ============================================================================

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </div>
    </header>
  )
}

// ============================================================================
// MAIN PORTAL
// ============================================================================

function VendorPortalContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const titles: Record<View, string> = {
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    earnings: 'Earnings',
    profile: 'Profile'
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          title={titles[currentView]}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-6">
          {currentView === 'dashboard' && <VendorDashboard />}
          {currentView === 'orders' && <VendorOrdersView />}
          {currentView === 'products' && <VendorProductsView />}
          {currentView === 'earnings' && <VendorEarningsView />}
          {currentView === 'profile' && <VendorProfile />}
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <p className="text-center text-sm text-slate-500">
            © 2025 WebWaka Vendor Portal. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function VendorPortalPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check URL query params
    const params = new URLSearchParams(window.location.search)
    const urlTenant = params.get('tenant')
    const urlVendor = params.get('vendor')
    
    if (urlTenant) setTenantId(urlTenant)
    if (urlVendor) setVendorId(urlVendor)

    // Check localStorage for session
    const storedContext = localStorage.getItem('webwaka_tenant_context')
    const vendorSession = localStorage.getItem('webwaka_vendor_session')
    
    if (storedContext && !urlTenant) {
      try {
        const { id } = JSON.parse(storedContext)
        if (id) setTenantId(id)
      } catch {}
    }
    
    if (vendorSession && !urlVendor) {
      try {
        const { vendorId: vid } = JSON.parse(vendorSession)
        if (vid) setVendorId(vid)
      } catch {}
    }
    
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading vendor portal...</p>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800 p-8 rounded-xl max-w-md">
          <Store className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-4">Vendor Portal</h1>
          <p className="text-slate-400 mb-6">Please log in to access your vendor dashboard.</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    )
  }

  return (
    <MVMProvider tenantId={tenantId} initialVendorId={vendorId || undefined}>
      <VendorPortalContent />
    </MVMProvider>
  )
}
