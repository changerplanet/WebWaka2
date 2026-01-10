'use client'

/**
 * Inventory & Stock Control Suite — Demo Page
 * 
 * Comprehensive demo showcasing:
 * - Warehouses & Zones
 * - Stock Levels & Movements
 * - Transfers
 * - Reorder Suggestions
 * - Audits
 * 
 * Nigeria-first: NGN currency, Nigerian locations
 * 
 * @module app/inventory-demo
 * @canonical PC-SCP Phase S5
 * @phase Phase 2 Track A (S3) - DemoModeProvider integrated
 */

import { useState, useEffect, useCallback, Suspense } from 'react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay } from '@/components/demo'
import {
  Warehouse,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MapPin,
  Boxes,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Truck,
  BarChart3,
  Bell,
  Loader2,
  Filter,
  Calendar
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface WarehouseSummary {
  id: string
  name: string
  code: string
  city: string
  state: string
  isActive: boolean
  zoneCount?: number
  productCount?: number
}

interface StockAlert {
  productId: string
  productName: string
  sku: string
  currentQty: number
  reorderPoint: number
  status: 'LOW' | 'OUT' | 'EXPIRING'
  warehouseName?: string
}

interface TransferSummary {
  id: string
  transferNumber: string
  fromWarehouse: string
  toWarehouse: string
  itemCount: number
  status: string
  createdAt: string
}

interface ReorderSuggestion {
  id: string
  productName: string
  sku: string
  currentQty: number
  suggestedQty: number
  supplier?: string
  status: string
}

interface AuditSummary {
  id: string
  auditNumber: string
  warehouseName: string
  status: string
  itemCount: number
  varianceCount: number
  createdAt: string
}

// ============================================================================
// API CONFIG
// ============================================================================

const API_BASE = '/api/inventory'

// ============================================================================
// DEMO DATA (Nigerian Context)
// ============================================================================

const DEMO_WAREHOUSES: WarehouseSummary[] = [
  { id: 'wh-lagos-main', name: 'Lagos Main Warehouse', code: 'WH-LAG-01', city: 'Victoria Island', state: 'Lagos', isActive: true, zoneCount: 8, productCount: 1250 },
  { id: 'wh-ibadan', name: 'Ibadan Regional Depot', code: 'WH-IBD-01', city: 'Dugbe', state: 'Oyo', isActive: true, zoneCount: 5, productCount: 680 },
  { id: 'wh-abuja', name: 'Abuja Distribution Center', code: 'WH-ABJ-01', city: 'Garki', state: 'FCT', isActive: true, zoneCount: 6, productCount: 920 },
  { id: 'wh-port-harcourt', name: 'Port Harcourt Depot', code: 'WH-PHC-01', city: 'Trans Amadi', state: 'Rivers', isActive: true, zoneCount: 4, productCount: 450 },
]

const DEMO_ALERTS: StockAlert[] = [
  { productId: 'p1', productName: 'Indomie Noodles (Carton)', sku: 'IND-NLD-001', currentQty: 45, reorderPoint: 100, status: 'LOW', warehouseName: 'Lagos Main' },
  { productId: 'p2', productName: 'Peak Milk 400g', sku: 'PEK-MLK-400', currentQty: 0, reorderPoint: 50, status: 'OUT', warehouseName: 'Ibadan Depot' },
  { productId: 'p3', productName: 'Golden Penny Flour 50kg', sku: 'GPF-50KG', currentQty: 28, reorderPoint: 40, status: 'LOW', warehouseName: 'Abuja DC' },
  { productId: 'p4', productName: 'Dangote Sugar 50kg', sku: 'DNG-SUG-50', currentQty: 12, reorderPoint: 30, status: 'LOW', warehouseName: 'Lagos Main' },
  { productId: 'p5', productName: 'Power Oil 5L', sku: 'PWR-OIL-5L', currentQty: 0, reorderPoint: 25, status: 'OUT', warehouseName: 'Port Harcourt' },
]

const DEMO_TRANSFERS: TransferSummary[] = [
  { id: 'tr1', transferNumber: 'TRF-2026-0045', fromWarehouse: 'Lagos Main', toWarehouse: 'Ibadan Depot', itemCount: 12, status: 'IN_TRANSIT', createdAt: '2026-01-06T08:30:00Z' },
  { id: 'tr2', transferNumber: 'TRF-2026-0044', fromWarehouse: 'Abuja DC', toWarehouse: 'Lagos Main', itemCount: 8, status: 'PENDING_APPROVAL', createdAt: '2026-01-05T14:20:00Z' },
  { id: 'tr3', transferNumber: 'TRF-2026-0043', fromWarehouse: 'Lagos Main', toWarehouse: 'Port Harcourt', itemCount: 15, status: 'RECEIVED', createdAt: '2026-01-04T09:15:00Z' },
]

const DEMO_REORDERS: ReorderSuggestion[] = [
  { id: 'ro1', productName: 'Indomie Noodles (Carton)', sku: 'IND-NLD-001', currentQty: 45, suggestedQty: 200, supplier: 'Dufil Prima Foods', status: 'PENDING' },
  { id: 'ro2', productName: 'Peak Milk 400g', sku: 'PEK-MLK-400', currentQty: 0, suggestedQty: 150, supplier: 'FrieslandCampina WAMCO', status: 'PENDING' },
  { id: 'ro3', productName: 'Golden Penny Flour 50kg', sku: 'GPF-50KG', currentQty: 28, suggestedQty: 100, supplier: 'Flour Mills of Nigeria', status: 'APPROVED' },
]

const DEMO_AUDITS: AuditSummary[] = [
  { id: 'au1', auditNumber: 'AUD-2026-0012', warehouseName: 'Lagos Main Warehouse', status: 'IN_PROGRESS', itemCount: 150, varianceCount: 8, createdAt: '2026-01-06T07:00:00Z' },
  { id: 'au2', auditNumber: 'AUD-2026-0011', warehouseName: 'Ibadan Regional Depot', status: 'COMPLETED', itemCount: 85, varianceCount: 3, createdAt: '2026-01-03T08:00:00Z' },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ============================================================================
// STATUS BADGES
// ============================================================================

function TransferStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700' },
    PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700' },
    APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    IN_TRANSIT: { bg: 'bg-purple-100', text: 'text-purple-700' },
    RECEIVED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  }
  const { bg, text } = config[status] || config.DRAFT
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function AuditStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    SCHEDULED: { bg: 'bg-slate-100', text: 'text-slate-700' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
    PENDING_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-700' },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  }
  const { bg, text } = config[status] || config.SCHEDULED
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function StockAlertBadge({ status }: { status: 'LOW' | 'OUT' | 'EXPIRING' }) {
  const config = {
    LOW: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Low Stock' },
    OUT: { bg: 'bg-red-100', text: 'text-red-700', label: 'Out of Stock' },
    EXPIRING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Expiring Soon' },
  }
  const { bg, text, label } = config[status]
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

// ============================================================================
// METRIC CARD
// ============================================================================

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBg, 
  iconColor,
  subValue,
  trend
}: { 
  title: string
  value: string | number
  icon: any
  iconBg: string
  iconColor: string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function InventoryDemoContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'warehouses' | 'transfers' | 'reorders' | 'audits'>('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Demo metrics
  const metrics = {
    totalWarehouses: DEMO_WAREHOUSES.length,
    totalProducts: 3300,
    lowStockAlerts: DEMO_ALERTS.filter((a: any) => a.status === 'LOW').length,
    outOfStockAlerts: DEMO_ALERTS.filter((a: any) => a.status === 'OUT').length,
    pendingTransfers: DEMO_TRANSFERS.filter((t: any) => t.status === 'PENDING_APPROVAL' || t.status === 'IN_TRANSIT').length,
    pendingReorders: DEMO_REORDERS.filter((r: any) => r.status === 'PENDING').length,
    activeAudits: DEMO_AUDITS.filter((a: any) => a.status === 'IN_PROGRESS').length,
    totalInventoryValue: 245680000 // ₦245.68M
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="inventory-demo-page">
      {/* Demo Overlay */}
      <DemoOverlay />
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Inventory & Stock Control</h1>
                  <p className="text-xs text-slate-500">Nigeria Operations Demo</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                Demo Mode
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {(['overview', 'warehouses', 'transfers', 'reorders', 'audits'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                data-testid={`tab-${tab}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Warehouses"
                value={metrics.totalWarehouses}
                icon={Warehouse}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                subValue="Active locations"
              />
              <MetricCard
                title="Total Products"
                value={metrics.totalProducts.toLocaleString()}
                icon={Package}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                subValue="Across all locations"
              />
              <MetricCard
                title="Inventory Value"
                value={formatCurrency(metrics.totalInventoryValue)}
                icon={TrendingUp}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                trend="up"
              />
              <MetricCard
                title="Stock Alerts"
                value={metrics.lowStockAlerts + metrics.outOfStockAlerts}
                icon={AlertTriangle}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                subValue={`${metrics.outOfStockAlerts} out of stock`}
              />
            </div>

            {/* Stock Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <h2 className="font-semibold text-slate-900">Stock Alerts</h2>
                  </div>
                  <span className="text-sm text-slate-500">{DEMO_ALERTS.length} items need attention</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {DEMO_ALERTS.map((alert) => (
                  <div key={alert.productId} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.status === 'OUT' ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                          <Package className={`w-5 h-5 ${
                            alert.status === 'OUT' ? 'text-red-600' : 'text-amber-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{alert.productName}</p>
                          <p className="text-sm text-slate-500">
                            SKU: {alert.sku} • {alert.warehouseName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          alert.currentQty === 0 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {alert.currentQty} units
                        </p>
                        <StockAlertBadge status={alert.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pending Transfers */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">Active Transfers</h3>
                </div>
                <p className="text-3xl font-bold text-purple-600">{metrics.pendingTransfers}</p>
                <p className="text-sm text-slate-500 mt-1">Transfers in progress</p>
              </div>

              {/* Reorder Suggestions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Reorder Suggestions</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600">{metrics.pendingReorders}</p>
                <p className="text-sm text-slate-500 mt-1">Pending approval</p>
              </div>

              {/* Active Audits */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900">Active Audits</h3>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{metrics.activeAudits}</p>
                <p className="text-sm text-slate-500 mt-1">In progress</p>
              </div>
            </div>
          </div>
        )}

        {/* Warehouses Tab */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Warehouses</h2>
              <span className="text-sm text-slate-500">{DEMO_WAREHOUSES.length} locations</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {DEMO_WAREHOUSES.map((warehouse) => (
                <div 
                  key={warehouse.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  data-testid={`warehouse-${warehouse.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Warehouse className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{warehouse.name}</h3>
                        <p className="text-sm text-slate-500">{warehouse.code}</p>
                      </div>
                    </div>
                    {warehouse.isActive && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{warehouse.city}, {warehouse.state}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">Zones</p>
                      <p className="text-lg font-semibold text-slate-900">{warehouse.zoneCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Products</p>
                      <p className="text-lg font-semibold text-slate-900">{warehouse.productCount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Stock Transfers</h2>
              <span className="text-sm text-slate-500">{DEMO_TRANSFERS.length} transfers</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">Transfer #</th>
                      <th className="px-6 py-4 font-medium">From → To</th>
                      <th className="px-6 py-4 font-medium text-center">Items</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DEMO_TRANSFERS.map((transfer) => (
                      <tr 
                        key={transfer.id} 
                        className="hover:bg-slate-50 transition-colors"
                        data-testid={`transfer-${transfer.id}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{transfer.transferNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span>{transfer.fromWarehouse}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span>{transfer.toWarehouse}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-slate-900">{transfer.itemCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <TransferStatusBadge status={transfer.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {formatDate(transfer.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reorders Tab */}
        {activeTab === 'reorders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Reorder Suggestions</h2>
              <span className="text-sm text-slate-500">{DEMO_REORDERS.length} suggestions</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium text-right">Current Stock</th>
                      <th className="px-6 py-4 font-medium text-right">Suggested Qty</th>
                      <th className="px-6 py-4 font-medium">Supplier</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DEMO_REORDERS.map((reorder) => (
                      <tr 
                        key={reorder.id} 
                        className="hover:bg-slate-50 transition-colors"
                        data-testid={`reorder-${reorder.id}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{reorder.productName}</p>
                          <p className="text-sm text-slate-500">SKU: {reorder.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-medium ${
                            reorder.currentQty === 0 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {reorder.currentQty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-slate-900">{reorder.suggestedQty}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {reorder.supplier || '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            reorder.status === 'APPROVED' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {reorder.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Audits Tab */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Stock Audits</h2>
              <span className="text-sm text-slate-500">{DEMO_AUDITS.length} audits</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">Audit #</th>
                      <th className="px-6 py-4 font-medium">Warehouse</th>
                      <th className="px-6 py-4 font-medium text-center">Items</th>
                      <th className="px-6 py-4 font-medium text-center">Variances</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DEMO_AUDITS.map((audit) => (
                      <tr 
                        key={audit.id} 
                        className="hover:bg-slate-50 transition-colors"
                        data-testid={`audit-${audit.id}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{audit.auditNumber}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {audit.warehouseName}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-slate-900">{audit.itemCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-medium ${
                            audit.varianceCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {audit.varianceCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <AuditStatusBadge status={audit.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {formatDate(audit.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Footer */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <span className="text-slate-400">Demo Mode</span>
          <span className="mx-2">•</span>
          <span>Inventory & Stock Control Suite</span>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function InventoryDemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <DemoModeProvider>
        <InventoryDemoContent />
      </DemoModeProvider>
    </Suspense>
  )
}
