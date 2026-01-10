'use client'

/**
 * ADVANCED WAREHOUSE SUITE DEMO PAGE
 * Platform Standardisation v2 - S4 Demo UI
 * 
 * Nigeria-First demo scenario: SwiftStock Distribution Ltd, Lagos
 * A pharmaceutical and FMCG distribution warehouse managing
 * inventory across multiple zones with batch tracking.
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Warehouse,
  Package,
  Boxes,
  ClipboardList,
  Truck,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  MapPin,
  BadgeCheck,
  Shield,
  DollarSign,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Play,
  ChevronRight,
  Calendar,
  Handshake,
  ScanLine,
  PackageCheck,
  PackageX,
  LayoutGrid,
  Users,
  Timer
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { DemoModeProvider, useDemoMode } from '@/lib/demo/context'
import { DemoOverlay } from '@/components/demo/DemoOverlay'
import { QuickStartBanner } from '@/components/demo/QuickStartBanner'
import { resolveQuickStart } from '@/lib/demo/quickstart'

// ============================================================================
// DEMO DATA: SWIFTSTOCK DISTRIBUTION LTD, LAGOS
// ============================================================================

const DEMO_SCENARIO = {
  company: 'SwiftStock Distribution Ltd',
  location: 'Apapa Industrial Estate, Lagos, Nigeria',
  industry: 'Pharmaceutical & FMCG Distribution',
  description: 'A licensed pharmaceutical and FMCG distribution warehouse serving retailers across Lagos State. Manages temperature-controlled storage, batch tracking, and NAFDAC-compliant inventory.',
  stats: {
    totalZones: 8,
    activeBins: 120,
    pendingReceipts: 4,
    pickListsToday: 12
  }
}

const DEMO_ZONES = [
  {
    id: 'ZONE-RCV',
    name: 'Receiving Bay',
    code: 'RCV-01',
    type: 'RECEIVING',
    bins: 8,
    utilization: 45,
    status: 'ACTIVE'
  },
  {
    id: 'ZONE-AMB-A',
    name: 'Ambient Storage A',
    code: 'AMB-A',
    type: 'STORAGE',
    bins: 32,
    utilization: 78,
    status: 'ACTIVE'
  },
  {
    id: 'ZONE-AMB-B',
    name: 'Ambient Storage B',
    code: 'AMB-B',
    type: 'STORAGE',
    bins: 28,
    utilization: 65,
    status: 'ACTIVE'
  },
  {
    id: 'ZONE-COLD',
    name: 'Cold Chain (2-8°C)',
    code: 'COLD-01',
    type: 'COLD_STORAGE',
    bins: 16,
    utilization: 82,
    status: 'ACTIVE'
  },
  {
    id: 'ZONE-PICK',
    name: 'Picking Area',
    code: 'PICK-01',
    type: 'PICKING',
    bins: 24,
    utilization: 55,
    status: 'ACTIVE'
  },
  {
    id: 'ZONE-SHIP',
    name: 'Shipping Dock',
    code: 'SHIP-01',
    type: 'SHIPPING',
    bins: 12,
    utilization: 40,
    status: 'ACTIVE'
  }
]

const DEMO_RECEIPTS = [
  {
    id: 'RCV-2026-0045',
    supplier: 'May & Baker Nigeria Plc',
    poNumber: 'PO-2026-0112',
    items: 8,
    status: 'RECEIVING',
    expectedDate: 'Jan 7, 2026',
    receivedItems: 5,
    totalItems: 8
  },
  {
    id: 'RCV-2026-0046',
    supplier: 'GlaxoSmithKline Nigeria',
    poNumber: 'PO-2026-0115',
    items: 12,
    status: 'SCHEDULED',
    expectedDate: 'Jan 8, 2026',
    receivedItems: 0,
    totalItems: 12
  },
  {
    id: 'RCV-2026-0047',
    supplier: 'Emzor Pharmaceuticals',
    poNumber: 'PO-2026-0118',
    items: 6,
    status: 'SCHEDULED',
    expectedDate: 'Jan 8, 2026',
    receivedItems: 0,
    totalItems: 6
  },
  {
    id: 'RCV-2026-0044',
    supplier: 'Fidson Healthcare',
    poNumber: 'PO-2026-0108',
    items: 10,
    status: 'COMPLETED',
    expectedDate: 'Jan 6, 2026',
    receivedItems: 10,
    totalItems: 10
  }
]

const DEMO_PICK_LISTS = [
  {
    id: 'PL-2026-0089',
    customer: 'HealthPlus Pharmacy',
    salesOrder: 'SO-2026-0234',
    items: 15,
    status: 'PICKING',
    picker: 'Chidi Okonkwo',
    progress: 60,
    priority: 'HIGH'
  },
  {
    id: 'PL-2026-0090',
    customer: 'MedPlus Nigeria',
    salesOrder: 'SO-2026-0235',
    items: 8,
    status: 'PENDING',
    picker: 'Unassigned',
    progress: 0,
    priority: 'MEDIUM'
  },
  {
    id: 'PL-2026-0091',
    customer: 'Alpha Pharmacy Chain',
    salesOrder: 'SO-2026-0237',
    items: 22,
    status: 'PICKING',
    picker: 'Adaeze Eze',
    progress: 35,
    priority: 'HIGH'
  },
  {
    id: 'PL-2026-0088',
    customer: 'Bola Pharmacy',
    salesOrder: 'SO-2026-0231',
    items: 6,
    status: 'PACKED',
    picker: 'Emeka Nwosu',
    progress: 100,
    priority: 'MEDIUM'
  }
]

const DEMO_BATCHES = [
  {
    id: 'BATCH-001',
    product: 'Paracetamol 500mg Tablets',
    batchNumber: 'PARA-2026-001',
    nafdacNumber: 'A4-1234',
    expiryDate: 'Jan 20, 2026',
    daysToExpiry: 13,
    quantity: 5000,
    zone: 'AMB-A',
    status: 'EXPIRING_SOON'
  },
  {
    id: 'BATCH-002',
    product: 'Amoxicillin 500mg Capsules',
    batchNumber: 'AMOX-2025-089',
    nafdacNumber: 'A4-2345',
    expiryDate: 'Jan 25, 2026',
    daysToExpiry: 18,
    quantity: 2000,
    zone: 'AMB-B',
    status: 'EXPIRING_SOON'
  },
  {
    id: 'BATCH-003',
    product: 'Insulin (Rapid Acting)',
    batchNumber: 'INS-2025-045',
    nafdacNumber: 'B1-5678',
    expiryDate: 'Mar 15, 2026',
    daysToExpiry: 67,
    quantity: 500,
    zone: 'COLD-01',
    status: 'GOOD'
  },
  {
    id: 'BATCH-004',
    product: 'Oral Rehydration Salts',
    batchNumber: 'ORS-2026-015',
    nafdacNumber: 'A4-3456',
    expiryDate: 'Dec 31, 2026',
    daysToExpiry: 358,
    quantity: 8000,
    zone: 'AMB-A',
    status: 'GOOD'
  }
]

const DEMO_MOVEMENTS = [
  {
    id: 'MOV-001',
    type: 'RECEIPT',
    product: 'Vitamin C 1000mg',
    quantity: 2000,
    fromLocation: 'RCV-01-A1',
    toLocation: 'AMB-A-B3',
    timestamp: '10:45 AM',
    operator: 'Chidi Okonkwo'
  },
  {
    id: 'MOV-002',
    type: 'PICK',
    product: 'Paracetamol 500mg',
    quantity: 500,
    fromLocation: 'AMB-A-C2',
    toLocation: 'PICK-01-A1',
    timestamp: '10:30 AM',
    operator: 'Adaeze Eze'
  },
  {
    id: 'MOV-003',
    type: 'TRANSFER',
    product: 'Insulin (Rapid)',
    quantity: 100,
    fromLocation: 'COLD-01-A1',
    toLocation: 'COLD-01-B2',
    timestamp: '10:15 AM',
    operator: 'Emeka Nwosu'
  },
  {
    id: 'MOV-004',
    type: 'ADJUSTMENT',
    product: 'Ibuprofen 400mg',
    quantity: -50,
    fromLocation: 'AMB-B-D4',
    toLocation: 'DAMAGE',
    timestamp: '09:45 AM',
    operator: 'Supervisor'
  }
]

// ============================================================================
// QUICK START ROLE CARDS
// ============================================================================

const ROLE_CARDS = [
  {
    role: 'warehouseManager',
    title: 'Warehouse Manager',
    description: 'Oversee operations, manage zones, track KPIs',
    icon: Warehouse,
    color: 'bg-blue-500'
  },
  {
    role: 'receivingClerk',
    title: 'Receiving Clerk',
    description: 'Process inbound shipments, verify receipts',
    icon: Truck,
    color: 'bg-green-500'
  },
  {
    role: 'picker',
    title: 'Picker / Packer',
    description: 'Execute pick lists, pack orders for dispatch',
    icon: PackageCheck,
    color: 'bg-orange-500'
  },
  {
    role: 'warehouseAuditor',
    title: 'Warehouse Auditor',
    description: 'Audit inventory, verify batches, check Commerce boundary',
    icon: ClipboardList,
    color: 'bg-purple-500'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-800',
    'RECEIVING': 'bg-blue-100 text-blue-800',
    'SCHEDULED': 'bg-yellow-100 text-yellow-800',
    'COMPLETED': 'bg-gray-100 text-gray-800',
    'PICKING': 'bg-orange-100 text-orange-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'PACKED': 'bg-green-100 text-green-800',
    'DISPATCHED': 'bg-gray-100 text-gray-800',
    'EXPIRING_SOON': 'bg-red-100 text-red-800',
    'GOOD': 'bg-green-100 text-green-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getMovementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'RECEIPT': 'bg-green-100 text-green-800',
    'PICK': 'bg-blue-100 text-blue-800',
    'TRANSFER': 'bg-purple-100 text-purple-800',
    'ADJUSTMENT': 'bg-orange-100 text-orange-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'HIGH': 'bg-red-100 text-red-800',
    'MEDIUM': 'bg-yellow-100 text-yellow-800',
    'LOW': 'bg-green-100 text-green-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

function getZoneTypeIcon(type: string) {
  const icons: Record<string, typeof Warehouse> = {
    'RECEIVING': Truck,
    'STORAGE': Boxes,
    'COLD_STORAGE': Package,
    'PICKING': ScanLine,
    'SHIPPING': Truck
  }
  return icons[type] || Warehouse
}

// ============================================================================
// MAIN DEMO CONTENT
// ============================================================================

function WarehouseDemoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  
  // Quick Start state
  const [quickStartConfig, setQuickStartConfig] = useState<typeof quickStartResult.config>(
    quickStartResult.isActive ? quickStartResult.config : null
  )
  
  // Update quickstart when URL changes
  useEffect(() => {
    const result = resolveQuickStart(quickstartParam)
    setQuickStartConfig(result.isActive ? result.config : null)
  }, [quickstartParam])
  
  // Quick Start handlers
  const handleSwitchRole = () => {
    router.push('/warehouse-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
  }
  
  const demoContext = useDemoMode()
  const isInDemoMode = demoContext?.isActive ?? false

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Quick Start Banner */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}

      {/* Demo Overlay for guided tours */}
      <DemoOverlay />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* S5 Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Badge variant="secondary" className="bg-green-500 text-white">
                S5 Narrative Ready
              </Badge>
              <span className="text-sm text-amber-100">Platform Standardisation v2</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Advanced Warehouse Suite
            </h1>
            <p className="text-xl text-amber-100 max-w-3xl mx-auto mb-8">
              Enterprise warehouse management for Nigerian distributors.
              Zones, bins, batch tracking, pick lists — with Commerce integration.
            </p>

            {/* Nigeria-First Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <Shield className="h-3 w-3 mr-1" />
                Capability Guarded
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <MapPin className="h-3 w-3 mr-1" />
                Nigeria-First
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <Package className="h-3 w-3 mr-1" />
                NAFDAC Compliant
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                <Handshake className="h-3 w-3 mr-1" />
                Commerce Boundary
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50">
                <Play className="h-4 w-4 mr-2" />
                Start Demo Tour
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Role Selector */}
      {!quickStartConfig && (
        <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quick Start: Choose Your Role
            </h2>
            <p className="text-gray-600">
              Select a perspective to explore the Advanced Warehouse Suite
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_CARDS.map((card) => (
              <Link
                key={card.role}
                href={`/warehouse-demo?quickstart=${card.role}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-amber-300">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center mx-auto mb-4`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Demo Scenario Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Warehouse className="h-8 w-8 text-amber-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    Demo Scenario
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{DEMO_SCENARIO.company}</h3>
                <p className="text-gray-600 flex items-center gap-1 mb-2">
                  <MapPin className="h-4 w-4" />
                  {DEMO_SCENARIO.location} • {DEMO_SCENARIO.industry}
                </p>
                <p className="text-sm text-gray-700">{DEMO_SCENARIO.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Demo Preview Mode Notice */}
      <section className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Demo Preview Mode</p>
                <p className="text-sm text-amber-700">
                  You're viewing sample data from SwiftStock Distribution Ltd. All data is fictional and for demonstration purposes only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Zones</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.totalZones}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <LayoutGrid className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Bins</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.activeBins}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Boxes className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Receipts</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.pendingReceipts}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pick Lists Today</p>
                  <p className="text-3xl font-bold text-gray-900">{DEMO_SCENARIO.stats.pickListsToday}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Warehouse Zones */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-blue-600" />
              Warehouse Zones
            </CardTitle>
            <CardDescription>
              Storage zones with bin locations and utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_ZONES.map((zone) => {
                const ZoneIcon = getZoneTypeIcon(zone.type)
                return (
                  <Card key={zone.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <ZoneIcon className="h-4 w-4 text-amber-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{zone.name}</p>
                            <p className="text-xs text-gray-500">{zone.code}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(zone.status)} variant="outline">
                          {zone.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bins</span>
                          <span className="font-medium">{zone.bins}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Utilization</span>
                          <span className="font-medium">{zone.utilization}%</span>
                        </div>
                        <Progress value={zone.utilization} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Receipts & Pick Lists Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inbound Receipts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                Inbound Receipts
              </CardTitle>
              <CardDescription>
                Expected and in-progress goods receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_RECEIPTS.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(receipt.status)} variant="outline">
                          {receipt.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{receipt.supplier}</p>
                      <p className="text-xs text-gray-600">{receipt.id} • {receipt.poNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{receipt.receivedItems}/{receipt.totalItems} items</p>
                      <p className="text-xs text-gray-500">{receipt.expectedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pick Lists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-600" />
                Active Pick Lists
              </CardTitle>
              <CardDescription>
                Orders being picked and packed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_PICK_LISTS.map((pickList) => (
                  <div key={pickList.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(pickList.priority)} variant="outline">
                          {pickList.priority}
                        </Badge>
                        <Badge className={getStatusColor(pickList.status)} variant="outline">
                          {pickList.status}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{pickList.items} items</span>
                    </div>
                    <p className="font-medium text-sm">{pickList.customer}</p>
                    <p className="text-xs text-gray-600">{pickList.id} • {pickList.salesOrder}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={pickList.progress} className="h-2 flex-1" />
                      <span className="text-xs text-gray-500">{pickList.progress}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Picker: {pickList.picker}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Batch Tracking */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Batch Tracking (NAFDAC Compliant)
            </CardTitle>
            <CardDescription>
              Batch-level inventory with expiry tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>NAFDAC</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_BATCHES.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.product}</TableCell>
                    <TableCell>{batch.batchNumber}</TableCell>
                    <TableCell className="text-sm">{batch.nafdacNumber}</TableCell>
                    <TableCell>{batch.zone}</TableCell>
                    <TableCell>{batch.quantity.toLocaleString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{batch.expiryDate}</p>
                        <p className={`text-xs ${batch.daysToExpiry <= 30 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {batch.daysToExpiry} days
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Stock Movements */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              Recent Stock Movements
            </CardTitle>
            <CardDescription>
              Today's inventory movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_MOVEMENTS.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <Badge className={getMovementTypeColor(movement.type)}>
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{movement.product}</TableCell>
                    <TableCell className={movement.quantity < 0 ? 'text-red-600' : ''}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm">{movement.fromLocation}</TableCell>
                    <TableCell className="text-sm">{movement.toLocation}</TableCell>
                    <TableCell>{movement.operator}</TableCell>
                    <TableCell className="text-sm text-gray-500">{movement.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Commerce Boundary Architecture */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card className="border-2 border-dashed border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-amber-600" />
              Commerce Boundary Architecture
            </CardTitle>
            <CardDescription>
              Warehouse emits inventory facts. Commerce handles billing and accounting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Warehouse Module */}
              <div className="p-6 bg-white rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Warehouse className="h-5 w-5 text-amber-600" />
                  </div>
                  <h4 className="font-semibold">Warehouse Suite</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Zone & Bin Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Goods Receipt
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Batch Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Pick List Execution
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Stock Movement Facts
                  </li>
                </ul>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="h-0.5 w-8 bg-gray-300" />
                    <ArrowRight className="h-6 w-6" />
                    <div className="h-0.5 w-8 bg-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Inventory Facts</p>
                  <p className="text-xs text-gray-400">(Qty, Batch, Location)</p>
                </div>
              </div>

              {/* Commerce Module */}
              <div className="p-6 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold">Commerce Suite</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Purchase Orders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Sales Orders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Invoicing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Payment Collection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Inventory Valuation
                  </li>
                </ul>
              </div>
            </div>

            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-amber-100 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Boundary Rule:</strong> Advanced Warehouse creates inventory facts (quantities, batches, locations, movements). 
                Commerce handles purchase orders, sales orders, invoicing, and inventory valuation.
                Warehouse NEVER handles pricing or payments directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Nigeria-First Design Notes */}
      <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MapPin className="h-5 w-5" />
              Nigeria-First Design Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <h4 className="font-semibold mb-2">Compliance</h4>
                <ul className="space-y-1">
                  <li>• NAFDAC batch number tracking</li>
                  <li>• Expiry date management (required)</li>
                  <li>• Cold chain temperature logging</li>
                  <li>• Pharmaceutical distribution license</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Operations</h4>
                <ul className="space-y-1">
                  <li>• Nigerian supplier integration</li>
                  <li>• Lagos-based distribution network</li>
                  <li>• Power backup for cold storage</li>
                  <li>• FEFO (First Expiry, First Out)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/commerce-demo" 
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Commerce Demo
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">
                Platform Standardisation v2
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Demo / Sample Data
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                S4-S5 Complete
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// PAGE WRAPPER WITH PROVIDERS
// ============================================================================

function WarehouseDemoInner() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    }>
      <WarehouseDemoContent />
    </Suspense>
  )
}

export default function WarehouseDemoPage() {
  return (
    <DemoModeProvider>
      <WarehouseDemoInner />
    </DemoModeProvider>
  )
}
