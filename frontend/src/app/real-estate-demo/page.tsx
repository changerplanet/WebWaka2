'use client'

/**
 * REAL ESTATE SUITE: Demo Portal
 * 
 * Showcases Real Estate Suite capabilities with Nigerian demo data.
 * Demo Scenario: Emerald Heights Properties, Lekki, Lagos
 * 
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/real-estate-demo
 * @phase S4-S5 (Canonicalization)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Home,
  Users,
  Key,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Banknote,
  MapPin,
  Calendar,
  ArrowRight,
  BadgeCheck,
  Wrench,
  AlertTriangle,
  XCircle,
  BarChart3,
  DollarSign,
  FileSpreadsheet,
  Receipt,
  UserCircle,
  Bed,
  Bath,
  Maximize,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DemoModeProvider } from '@/lib/demo/context'
import { DemoOverlay, QuickStartBanner } from '@/components/demo'
import { resolveQuickStart, QuickStartConfig } from '@/lib/demo/quickstart'

// ============================================================================
// IN-MEMORY DEMO DATA (Nigerian context)
// ============================================================================

const DEMO_COMPANY_NAME = 'Emerald Heights Properties'
const DEMO_COMPANY_LOCATION = 'Lekki, Lagos'

// Demo Properties
const DEMO_PROPERTIES = [
  {
    id: 'prop-1',
    name: 'Harmony Estate Phase 2',
    propertyType: 'RESIDENTIAL',
    status: 'OCCUPIED',
    address: '15 Harmony Close, Off Admiralty Way, Lekki',
    city: 'Lagos',
    totalUnits: 12,
    occupiedUnits: 10,
    ownerName: 'Chief Adewale Johnson',
    monthlyIncome: 2800000,
  },
  {
    id: 'prop-2',
    name: 'Victoria Plaza',
    propertyType: 'COMMERCIAL',
    status: 'OCCUPIED',
    address: '42 Broad Street, Lagos Island',
    city: 'Lagos',
    totalUnits: 8,
    occupiedUnits: 6,
    ownerName: 'Mrs. Ngozi Okonkwo',
    monthlyIncome: 4200000,
  },
  {
    id: 'prop-3',
    name: 'Green Gardens Apartments',
    propertyType: 'RESIDENTIAL',
    status: 'AVAILABLE',
    address: '7 Green Estate Road, Ikeja',
    city: 'Lagos',
    totalUnits: 6,
    occupiedUnits: 4,
    ownerName: 'Alhaji Musa Ibrahim',
    monthlyIncome: 640000,
  },
]

// Demo Units
const DEMO_UNITS = [
  { id: 'unit-1', propertyName: 'Harmony Estate', unitNumber: 'Flat 1A', unitType: 'FLAT', status: 'OCCUPIED', bedrooms: 3, bathrooms: 2, sizeSqm: 120, monthlyRent: 250000, serviceCharge: 30000 },
  { id: 'unit-2', propertyName: 'Harmony Estate', unitNumber: 'Flat 1B', unitType: 'FLAT', status: 'OCCUPIED', bedrooms: 3, bathrooms: 2, sizeSqm: 120, monthlyRent: 250000, serviceCharge: 30000 },
  { id: 'unit-3', propertyName: 'Harmony Estate', unitNumber: 'Flat 2A', unitType: 'FLAT', status: 'VACANT', bedrooms: 2, bathrooms: 1, sizeSqm: 85, monthlyRent: 180000, serviceCharge: 25000 },
  { id: 'unit-4', propertyName: 'Victoria Plaza', unitNumber: 'Shop A1', unitType: 'SHOP', status: 'OCCUPIED', bedrooms: 0, bathrooms: 1, sizeSqm: 50, monthlyRent: 500000, serviceCharge: 50000 },
  { id: 'unit-5', propertyName: 'Victoria Plaza', unitNumber: 'Office 201', unitType: 'OFFICE', status: 'RESERVED', bedrooms: 0, bathrooms: 1, sizeSqm: 75, monthlyRent: 350000, serviceCharge: 40000 },
  { id: 'unit-6', propertyName: 'Green Gardens', unitNumber: 'Flat 3A', unitType: 'FLAT', status: 'OCCUPIED', bedrooms: 2, bathrooms: 1, sizeSqm: 70, monthlyRent: 150000, serviceCharge: 20000 },
]

// Demo Leases
const DEMO_LEASES = [
  { id: 'lease-1', leaseNumber: 'LSE-2026-0001', unitNumber: 'Flat 1A', tenantName: 'Mr. Chukwuma Eze', status: 'ACTIVE', startDate: '2025-01-01', endDate: '2025-12-31', monthlyRent: 250000, serviceCharge: 30000, annualAmount: 3360000 },
  { id: 'lease-2', leaseNumber: 'LSE-2026-0002', unitNumber: 'Flat 1B', tenantName: 'Mrs. Funke Williams', status: 'ACTIVE', startDate: '2025-06-01', endDate: '2026-05-31', monthlyRent: 250000, serviceCharge: 30000, annualAmount: 3360000 },
  { id: 'lease-3', leaseNumber: 'LSE-2026-0003', unitNumber: 'Shop A1', tenantName: 'Elegance Fashion Store', status: 'ACTIVE', startDate: '2024-03-01', endDate: '2027-02-28', monthlyRent: 500000, serviceCharge: 50000, annualAmount: 6600000 },
  { id: 'lease-4', leaseNumber: 'LSE-2026-0004', unitNumber: 'Flat 3A', tenantName: 'Dr. Amaka Nwachukwu', status: 'ACTIVE', startDate: '2025-03-01', endDate: '2026-02-28', monthlyRent: 150000, serviceCharge: 20000, annualAmount: 2040000 },
]

// Demo Rent Schedules
const DEMO_RENT_SCHEDULES = [
  { id: 'rent-1', leaseNumber: 'LSE-2026-0001', tenantName: 'Mr. Chukwuma Eze', dueDate: '2025-01-01', amount: 3360000, status: 'PAID', paidAmount: 3360000, paidDate: '2025-01-03' },
  { id: 'rent-2', leaseNumber: 'LSE-2026-0002', tenantName: 'Mrs. Funke Williams', dueDate: '2025-06-01', amount: 3360000, status: 'PARTIAL', paidAmount: 2000000, balance: 1360000 },
  { id: 'rent-3', leaseNumber: 'LSE-2026-0003', tenantName: 'Elegance Fashion', dueDate: '2025-12-01', amount: 6600000, status: 'OVERDUE', paidAmount: 0, lateFee: 660000, balance: 7260000 },
  { id: 'rent-4', leaseNumber: 'LSE-2026-0004', tenantName: 'Dr. Amaka Nwachukwu', dueDate: '2026-03-01', amount: 2040000, status: 'PENDING', paidAmount: 0, balance: 2040000 },
]

// Demo Maintenance Requests
const DEMO_MAINTENANCE = [
  { id: 'mnt-1', requestNumber: 'MNT-2026-00001', property: 'Harmony Estate', unit: 'Flat 1A', category: 'PLUMBING', priority: 'HIGH', status: 'IN_PROGRESS', title: 'Leaking Pipe in Kitchen', requester: 'Mr. Chukwuma Eze', estimatedCost: 25000 },
  { id: 'mnt-2', requestNumber: 'MNT-2026-00002', property: 'Victoria Plaza', unit: 'Shop A1', category: 'ELECTRICAL', priority: 'MEDIUM', status: 'OPEN', title: 'Power Outlet Not Working', requester: 'Elegance Fashion', estimatedCost: 15000 },
  { id: 'mnt-3', requestNumber: 'MNT-2026-00003', property: 'Green Gardens', unit: 'Flat 3A', category: 'SECURITY', priority: 'EMERGENCY', status: 'ASSIGNED', title: 'Broken Window Lock', requester: 'Dr. Amaka Nwachukwu', estimatedCost: 15000 },
  { id: 'mnt-4', requestNumber: 'MNT-2025-00045', property: 'Victoria Plaza', unit: 'Office 201', category: 'HVAC', priority: 'LOW', status: 'COMPLETED', title: 'AC Unit Maintenance', requester: 'Building Mgmt', actualCost: 32000 },
]

// Demo Stats
const DEMO_STATS = {
  properties: 3,
  totalUnits: 26,
  occupiedUnits: 20,
  activeLeases: 4,
  monthlyIncome: 7640000,
  pendingRent: 10660000,
  occupancyRate: 77,
  maintenanceOpen: 3,
}

// Format currency
function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ============================================================================
// STATUS BADGES
// ============================================================================

function PropertyStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OCCUPIED: 'bg-emerald-100 text-emerald-700',
    AVAILABLE: 'bg-blue-100 text-blue-700',
    MAINTENANCE: 'bg-amber-100 text-amber-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status}</Badge>
}

function UnitStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OCCUPIED: 'bg-emerald-100 text-emerald-700',
    VACANT: 'bg-blue-100 text-blue-700',
    RESERVED: 'bg-purple-100 text-purple-700',
    MAINTENANCE: 'bg-amber-100 text-amber-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status}</Badge>
}

function LeaseStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    EXPIRED: 'bg-gray-100 text-gray-700',
    TERMINATED: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status}</Badge>
}

function RentStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PENDING: 'bg-blue-100 text-blue-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status}</Badge>
}

function MaintenancePriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    EMERGENCY: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-blue-100 text-blue-700',
  }
  return <Badge className={`${colors[priority] || 'bg-gray-100 text-gray-700'} border-0`}>{priority}</Badge>
}

function MaintenanceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    ASSIGNED: 'bg-purple-100 text-purple-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  }
  return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} border-0`}>{status.replace('_', ' ')}</Badge>
}

// ============================================================================
// DEMO PREVIEW MODE
// ============================================================================

function DemoPreviewMode() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <BadgeCheck className="h-5 w-5" />
          Demo Preview Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-700 text-sm">
          You&apos;re viewing the Real Estate Suite demo without authentication. 
          Full functionality is available with Nigerian demo data.
        </p>
        <div className="flex gap-2">
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Sign In for Full Access
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN PAGE CONTENT
// ============================================================================

function RealEstateDemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Quick Start handling
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  const [quickStartConfig, setQuickStartConfig] = useState<QuickStartConfig | null>(
    quickStartResult.isActive ? quickStartResult.config : null
  )

  // Update quickstart when URL changes
  useEffect(() => {
    const result = resolveQuickStart(quickstartParam)
    setQuickStartConfig(result.isActive ? result.config : null)
  }, [quickstartParam])
  
  // Quick Start handlers
  const handleSwitchRole = () => {
    router.push('/real-estate-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
  }

  return (
    <div className="space-y-8">
      {/* Demo Overlay (for guided storylines) */}
      <DemoOverlay />
      
      {/* Quick Start Banner */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-xl p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Real Estate Suite</h1>
              <p className="text-emerald-100">Property Management Platform</p>
            </div>
          </div>
          
          <p className="text-emerald-100 max-w-2xl mb-6">
            Complete property lifecycle management — from leasing to rent collection to maintenance. 
            Nigerian annual rent norms, service charge separation, and Commerce-safe billing.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-0">🔒 S6 FROZEN</Badge>
            <Badge className="bg-white/20 text-white border-0">Capability Guarded</Badge>
            <Badge className="bg-white/20 text-white border-0">Nigeria-First</Badge>
            <Badge className="bg-white/20 text-white border-0">Annual Rent Norms</Badge>
            <Badge className="bg-white/20 text-white border-0">VAT-Aware</Badge>
          </div>
        </div>
      </div>
      
      {/* Quick Start Role Cards (when no quickstart active) */}
      {!quickStartConfig && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Quick Start: Choose Your Role
            </CardTitle>
            <CardDescription>
              Experience the Real Estate Suite from different perspectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/real-estate-demo?quickstart=propertyOwner">
                <div className="p-4 border rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">Owner</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Portfolio → leasing → income
                  </p>
                </div>
              </Link>
              <Link href="/real-estate-demo?quickstart=propertyManager">
                <div className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Manager</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tenants → maintenance → collections
                  </p>
                </div>
              </Link>
              <Link href="/real-estate-demo?quickstart=reTenant">
                <div className="p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Tenant</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lease → payments → requests
                  </p>
                </div>
              </Link>
              <Link href="/real-estate-demo?quickstart=realEstateAuditor">
                <div className="p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Auditor</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verify → reconcile → audit
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Scenario Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
            <Building2 className="h-5 w-5" />
            Demo Scenario: {DEMO_COMPANY_NAME}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 text-sm">
            <strong>{DEMO_COMPANY_LOCATION}</strong> — A property management company with 3 properties, 
            26 units, and ₦7.6M monthly income. Annual rent upfront, service charges separated, VAT-aware billing.
          </p>
        </CardContent>
      </Card>

      {/* Demo Preview Mode */}
      <DemoPreviewMode />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Properties</span>
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_STATS.properties}</p>
            <p className="text-xs text-muted-foreground">{DEMO_STATS.totalUnits} total units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Occupied</span>
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_STATS.occupiedUnits}</p>
            <p className="text-xs text-muted-foreground">{DEMO_STATS.occupancyRate}% occupancy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Active Leases</span>
            </div>
            <p className="text-2xl font-bold mt-1">{DEMO_STATS.activeLeases}</p>
            <p className="text-xs text-muted-foreground">Annual contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Monthly Income</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatNaira(DEMO_STATS.monthlyIncome)}</p>
            <p className="text-xs text-muted-foreground">Rent + service charges</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Property Portfolio ({DEMO_PROPERTIES.length})
          </CardTitle>
          <CardDescription>Your managed properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {DEMO_PROPERTIES.map((property) => (
              <div key={property.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{property.name}</h4>
                    <p className="text-xs text-muted-foreground">{property.address}</p>
                  </div>
                  <PropertyStatusBadge status={property.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{property.propertyType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Units</p>
                    <p className="font-medium">{property.occupiedUnits}/{property.totalUnits}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner</p>
                    <p className="font-medium text-xs">{property.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Income/mo</p>
                    <p className="font-medium text-emerald-600">{formatNaira(property.monthlyIncome)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Active Leases ({DEMO_LEASES.length})
          </CardTitle>
          <CardDescription>Current tenant agreements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lease #</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Annual Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_LEASES.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell className="font-mono text-sm">{lease.leaseNumber}</TableCell>
                  <TableCell>{lease.unitNumber}</TableCell>
                  <TableCell>{lease.tenantName}</TableCell>
                  <TableCell><LeaseStatusBadge status={lease.status} /></TableCell>
                  <TableCell className="text-xs">
                    {new Date(lease.startDate).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })} - {new Date(lease.endDate).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNaira(lease.annualAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rent Collection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-amber-600" />
            Rent Collection Status
          </CardTitle>
          <CardDescription>Annual rent schedules and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lease #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_RENT_SCHEDULES.map((rent) => (
                <TableRow key={rent.id}>
                  <TableCell className="font-mono text-sm">{rent.leaseNumber}</TableCell>
                  <TableCell>{rent.tenantName}</TableCell>
                  <TableCell>{new Date(rent.dueDate).toLocaleDateString('en-NG')}</TableCell>
                  <TableCell><RentStatusBadge status={rent.status} /></TableCell>
                  <TableCell className="text-right">{formatNaira(rent.amount)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatNaira(rent.paidAmount)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatNaira(rent.balance || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Maintenance Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Maintenance Requests ({DEMO_MAINTENANCE.length})
          </CardTitle>
          <CardDescription>Property maintenance and repair tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_MAINTENANCE.map((request) => (
              <div key={request.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{request.requestNumber}</span>
                      <MaintenancePriorityBadge priority={request.priority} />
                      <MaintenanceStatusBadge status={request.status} />
                    </div>
                    <p className="font-medium mt-1">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.property} · {request.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Est. Cost</p>
                    <p className="font-medium">{formatNaira(request.estimatedCost || request.actualCost || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commerce Boundary Architecture */}
      <Card className="border-violet-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-800">
            <BarChart3 className="h-5 w-5" />
            System Architecture: Commerce Boundary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-violet-50 rounded-lg p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Real Estate Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <Building2 className="h-5 w-5" />
                  Real Estate Domain
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-white rounded border">🏢 Property Management</div>
                  <div className="p-2 bg-white rounded border">🏠 Unit Inventory</div>
                  <div className="p-2 bg-white rounded border">📄 Lease Administration</div>
                  <div className="p-2 bg-white rounded border">🔧 Maintenance Tracking</div>
                  <div className="p-2 bg-white rounded border">💰 Rent Charge Facts</div>
                </div>
              </div>
              
              {/* Boundary Arrow */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-violet-600 font-medium text-center mb-2">
                  Charge Facts
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-6 w-6 text-violet-600" />
                  <ArrowRight className="h-6 w-6 text-violet-600" />
                </div>
                <div className="text-xs text-violet-600 mt-2 text-center">
                  Rent, Service Charge, Deposits
                </div>
              </div>
              
              {/* Commerce Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <DollarSign className="h-5 w-5" />
                  Commerce Suite
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-white rounded border">🧾 Invoicing</div>
                  <div className="p-2 bg-white rounded border">💳 Payment Collection</div>
                  <div className="p-2 bg-white rounded border">📊 VAT Calculation</div>
                  <div className="p-2 bg-white rounded border">📒 Accounting Journals</div>
                  <div className="p-2 bg-white rounded border">🏦 Bank Reconciliation</div>
                </div>
              </div>
            </div>
            
            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-violet-200">
              <p className="text-violet-800 text-sm">
                <strong>Commerce Boundary Rule:</strong> Real Estate creates charge facts (rent due, service charges, deposits). 
                Commerce handles invoicing, VAT calculation (commercial properties), and payment processing. 
                Real Estate NEVER calculates VAT or processes payments directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nigeria-First Notes */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            🇳🇬 Nigeria-First Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
            <div className="space-y-2">
              <p><strong>📅 Annual rent norms</strong> — Lagos landlords expect upfront annual payment</p>
              <p><strong>💵 Service charge separation</strong> — Estate maintenance tracked separately</p>
              <p><strong>🏢 Mixed VAT applicability</strong> — Commercial attracts VAT, residential exempt</p>
            </div>
            <div className="space-y-2">
              <p><strong>🏦 Cash/transfer common</strong> — Bank transfer and cash payments typical</p>
              <p><strong>📍 Nigerian addresses</strong> — Lekki, VI, Ikoyi, Ikeja zones</p>
              <p><strong>🔧 Vendor network</strong> — Plumbing, electrical, HVAC specialists</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================

export default function RealEstateDemoPage() {
  return (
    <DemoModeProvider>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          }>
            <RealEstateDemoContent />
          </Suspense>
        </div>
      </div>
    </DemoModeProvider>
  )
}
