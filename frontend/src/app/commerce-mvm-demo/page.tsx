'use client'

/**
 * MVM Demo Page - Lagos Digital Market
 * 
 * Interactive demo showcasing the Multi-Vendor Marketplace:
 * - Vendor Dashboard (seller view)
 * - Admin Dashboard (marketplace admin view)
 * 
 * @module app/commerce-mvm-demo
 * @canonical PC-SCP Phase S5
 * @phase Phase 2 Track A (S3) - DemoModeProvider integrated
 */

import { useState, useEffect, useCallback, Suspense } from 'react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay } from '@/components/demo'
import { 
  MVMProvider, 
  useMVM,
  VendorDashboard, 
  VendorOrdersView, 
  VendorProductsView, 
  VendorEarningsView, 
  VendorProfile,
  MVMAdminDashboard 
} from '@/components/mvm'
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react'

// ============================================================================
// NAV ITEMS
// ============================================================================

const vendorNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'profile', label: 'Profile', icon: User },
]

// Demo vendors from seeded data
const DEMO_VENDORS = [
  { email: 'adebayo@lagosdm.ng', name: 'Adebayo Electronics' },
  { email: 'nkechi@lagosdm.ng', name: 'Mama Nkechi Fashion' },
  { email: 'chukwu@lagosdm.ng', name: 'Chukwu Home Essentials' },
  { email: 'emeka@lagosdm.ng', name: 'Emeka Motors Accessories' },
]

// ============================================================================
// VENDOR CONTENT WRAPPER
// Fetches vendor ID by email and sets it in the context
// ============================================================================

function VendorContentWrapper({ 
  email,
  activeTab 
}: { 
  email: string
  activeTab: string
}) {
  const { setVendorId, vendorId, dashboard, isLoadingDashboard } = useMVM()
  const [isSearching, setIsSearching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)

  // Fetch vendor by email on mount/change
  useEffect(() => {
    // Reset if email changes
    if (currentEmail !== email) {
      setCurrentEmail(email)
      setIsSearching(true)
      setError(null)
    }
    
    async function loadVendor() {
      try {
        const res = await fetch(
          `/api/commerce/mvm/vendors?tenantId=demo-tenant-001&search=${encodeURIComponent(email)}`
        )
        const data = await res.json()
        
        if (data.success && data.data?.vendors?.length > 0) {
          const foundVendor = data.data.vendors.find((v: any) => v.email === email)
          if (foundVendor) {
            console.log('Found vendor:', foundVendor.id, foundVendor.name)
            setVendorId(foundVendor.id)
            setIsSearching(false)
          } else {
            setError('Vendor not found with this email')
            setIsSearching(false)
          }
        } else {
          setError(data.error || 'No vendors found')
          setIsSearching(false)
        }
      } catch (e) {
        console.error('Error loading vendor:', e)
        setError('Failed to load vendor')
        setIsSearching(false)
      }
    }
    
    if (currentEmail === email) {
      loadVendor()
    }
  }, [email, currentEmail, setVendorId])

  // Show loading while searching for vendor or loading dashboard
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-20" data-testid="vendor-searching">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
        <p className="text-slate-500">Finding vendor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20" data-testid="vendor-error">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 mb-2">{error}</p>
        <p className="text-sm text-slate-400">
          Make sure demo data is seeded: <code className="bg-slate-100 px-2 py-1 rounded text-xs">npx ts-node scripts/seed-mvm-demo.ts</code>
        </p>
      </div>
    )
  }

  // Wait for dashboard to load after setting vendor ID
  if (isLoadingDashboard || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20" data-testid="vendor-loading">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    )
  }

  // Render content based on active tab
  switch (activeTab) {
    case 'dashboard':
      return <VendorDashboard />
    case 'orders':
      return <VendorOrdersView />
    case 'products':
      return <VendorProductsView />
    case 'earnings':
      return <VendorEarningsView />
    case 'profile':
      return <VendorProfile />
    default:
      return <VendorDashboard />
  }
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function MVMDemoContent() {
  const [viewMode, setViewMode] = useState<'vendor' | 'admin'>('vendor')
  const [activeVendorTab, setActiveVendorTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedVendorEmail, setSelectedVendorEmail] = useState(DEMO_VENDORS[0].email)
  
  // Force re-render when vendor changes by using key
  const [vendorKey, setVendorKey] = useState(0)
  
  const handleVendorChange = (newEmail: string) => {
    setSelectedVendorEmail(newEmail)
    setVendorKey(prev => prev + 1)
    setActiveVendorTab('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="mvm-demo-page">
      {/* Demo Overlay */}
      <DemoOverlay />
      
      {/* Mode Switcher Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Store className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Lagos Digital Market</h1>
                  <p className="text-xs text-slate-500">Multi-Vendor Marketplace Demo</p>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('vendor')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'vendor'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="view-mode-vendor"
                >
                  <Store className="w-4 h-4 inline mr-2" />
                  Vendor View
                </button>
                <button
                  onClick={() => setViewMode('admin')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'admin'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="view-mode-admin"
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Admin View
                </button>
              </div>

              {/* Vendor Selector (only in vendor mode) */}
              {viewMode === 'vendor' && (
                <select
                  value={selectedVendorEmail}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  data-testid="vendor-selector"
                >
                  {DEMO_VENDORS.map((vendor) => (
                    <option key={vendor.email} value={vendor.email}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'admin' ? (
        /* Admin View */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MVMAdminDashboard />
        </div>
      ) : (
        /* Vendor View with Sidebar */
        <div className="flex">
          {/* Sidebar */}
          <div 
            className={`bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] transition-all duration-300 ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            <div className="p-4">
              {/* Collapse Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-end text-slate-400 hover:text-slate-600 mb-4"
                data-testid="toggle-sidebar"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>

              {/* Nav Items */}
              <nav className="space-y-1">
                {vendorNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveVendorTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        activeVendorTab === item.id
                          ? 'bg-green-50 text-green-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content Area - Key forces re-mount when vendor changes */}
          <div className="flex-1 p-8">
            <MVMProvider key={`vendor-${vendorKey}`} tenantId="demo-tenant-001">
              <VendorContentWrapper 
                email={selectedVendorEmail} 
                activeTab={activeVendorTab}
              />
            </MVMProvider>
          </div>
        </div>
      )}

      {/* Demo Info Footer */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <span className="text-slate-400">Demo Mode</span>
          <span className="mx-2">•</span>
          <span>Lagos Digital Market</span>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function MVMDemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <DemoModeProvider>
        <MVMDemoContent />
      </DemoModeProvider>
    </Suspense>
  )
}
