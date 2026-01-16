'use client'

/**
 * LOGISTICS SUITE: Demo Portal
 * 
 * Showcases Logistics Suite capabilities with Nigerian demo data.
 * Demo Scenario: Swift Dispatch Co., Lagos
 * 
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/logistics-demo
 * @phase S4-S5 (Canonicalization)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { DemoGate } from '@/components/demo'
import {
  Truck,
  Users,
  Package,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Banknote,
  Star,
  Phone,
  FileCheck,
  ArrowRight,
  ChevronRight,
  BadgeCheck,
  ClipboardCheck,
  Navigation,
  AlertTriangle,
  XCircle,
  Timer,
  BarChart3,
  Building2,
  Car,
  Bike,
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
import { DemoOverlay, QuickStartBanner, StorylineSelector } from '@/components/demo'
import { resolveQuickStart, QuickStartConfig } from '@/lib/demo/quickstart'

// Import demo data
import {
  DEMO_COMPANY_NAME,
  DEMO_COMPANY_LOCATION,
  DEMO_VEHICLES,
  DEMO_DRIVERS,
  DEMO_JOBS,
  DEMO_STATS,
} from '@/lib/logistics/demo-data'
import {
  formatNaira,
  JOB_STATUS,
  DRIVER_STATUS,
  VEHICLE_STATUS,
  JOB_PRIORITY,
  Vehicle,
  Driver,
  Job,
} from '@/lib/logistics/config'

// ============================================================================
// DEMO PREVIEW MODE (Unauthenticated)
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
          You&apos;re viewing the Logistics Suite demo without authentication. 
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
// JOB STATUS BADGE
// ============================================================================

function JobStatusBadge({ status }: { status: string }) {
  const config = JOB_STATUS[status as keyof typeof JOB_STATUS]
  if (!config) return <Badge variant="outline">{status}</Badge>
  
  return (
    <Badge className={`${config.color} border-0`}>
      {config.name}
    </Badge>
  )
}

// ============================================================================
// DRIVER STATUS BADGE
// ============================================================================

function DriverStatusBadge({ status }: { status: string }) {
  const config = DRIVER_STATUS[status as keyof typeof DRIVER_STATUS]
  if (!config) return <Badge variant="outline">{status}</Badge>
  
  return (
    <Badge className={`${config.color} border-0`}>
      {config.name}
    </Badge>
  )
}

// ============================================================================
// VEHICLE STATUS BADGE
// ============================================================================

function VehicleStatusBadge({ status }: { status: string }) {
  const config = VEHICLE_STATUS[status as keyof typeof VEHICLE_STATUS]
  if (!config) return <Badge variant="outline">{status}</Badge>
  
  return (
    <Badge className={`${config.color} border-0`}>
      {config.name}
    </Badge>
  )
}

// ============================================================================
// PRIORITY BADGE
// ============================================================================

function PriorityBadge({ priority }: { priority: string }) {
  const config = JOB_PRIORITY[priority as keyof typeof JOB_PRIORITY]
  if (!config) return <Badge variant="outline">{priority}</Badge>
  
  return (
    <Badge className={`${config.color} border-0`}>
      {config.name}
    </Badge>
  )
}

// ============================================================================
// MAIN PAGE CONTENT
// ============================================================================

function LogisticsDemoContent() {
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
    router.push('/logistics-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
  }

  // Get demo data
  const vehicles = DEMO_VEHICLES
  const drivers = DEMO_DRIVERS
  const jobs = DEMO_JOBS
  const stats = DEMO_STATS

  // Filter active jobs
  const activeJobs = jobs.filter((j: any) => 
    !['COMPLETED', 'CANCELLED', 'FAILED'].includes(j.status)
  )
  const completedJobs = jobs.filter((j: any) => j.status === 'COMPLETED')
  const failedJobs = jobs.filter((j: any) => ['CANCELLED', 'FAILED'].includes(j.status))

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
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Logistics Suite</h1>
              <p className="text-blue-100">Operations backbone for goods, people, and assets</p>
            </div>
          </div>
          
          <p className="text-blue-100 max-w-2xl mb-6">
            Complete logistics operations platform — from dispatch to delivery with proof. 
            Status-based tracking, driver management, and Commerce-safe billing.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-0">🔒 S6 FROZEN</Badge>
            <Badge className="bg-white/20 text-white border-0">Status-Based Tracking</Badge>
            <Badge className="bg-white/20 text-white border-0">Proof of Delivery</Badge>
            <Badge className="bg-white/20 text-white border-0">Nigeria-First</Badge>
            <Badge className="bg-white/20 text-white border-0">Commerce Boundary</Badge>
          </div>
        </div>
      </div>
      
      {/* Quick Start Role Cards (when no quickstart active) */}
      {!quickStartConfig && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Quick Start: Choose Your Role
            </CardTitle>
            <CardDescription>
              Experience the Logistics Suite from different perspectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/logistics-demo?quickstart=dispatcher">
                <div className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Dispatcher</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assign → track → complete
                  </p>
                </div>
              </Link>
              <Link href="/logistics-demo?quickstart=driver">
                <div className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Driver</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accept → deliver → POD
                  </p>
                </div>
              </Link>
              <Link href="/logistics-demo?quickstart=merchant">
                <div className="p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Merchant</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ship → track → confirm
                  </p>
                </div>
              </Link>
              <Link href="/logistics-demo?quickstart=logisticsAuditor">
                <div className="p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="h-5 w-5 text-purple-600" />
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
            <strong>{DEMO_COMPANY_LOCATION}</strong> — A Lagos-based logistics company handling 
            last-mile delivery, freight, and courier services. Status-based tracking works on 2G networks.
          </p>
        </CardContent>
      </Card>

      {/* Demo Preview Mode */}
      <DemoPreviewMode />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.jobs.total}</p>
            <p className="text-xs text-muted-foreground">{stats.jobs.active} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Drivers</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.drivers.total}</p>
            <p className="text-xs text-muted-foreground">{stats.drivers.onTrip} on trip</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Vehicles</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.vehicles.total}</p>
            <p className="text-xs text-muted-foreground">{stats.vehicles.inUse} in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.jobs.completed}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatNaira(stats.today.revenue)}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            Active Jobs ({activeJobs.length})
          </CardTitle>
          <CardDescription>Jobs currently in progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Pickup → Delivery</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-sm">{job.jobNumber}</TableCell>
                  <TableCell>{job.jobType}</TableCell>
                  <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  <TableCell><PriorityBadge priority={job.priority} /></TableCell>
                  <TableCell>{job.driverName || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {job.pickupAddress.split(',')[0]} → {job.deliveryAddress.split(',')[0]}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNaira(job.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Drivers ({drivers.length})
          </CardTitle>
          <CardDescription>Driver roster with status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                      <p className="text-xs text-muted-foreground">{driver.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell><DriverStatusBadge status={driver.status} /></TableCell>
                  <TableCell className="font-mono text-sm">{driver.currentVehicleNumber || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span>{driver.rating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{driver.totalTrips}</TableCell>
                  <TableCell className="text-right font-medium">{formatNaira(driver.totalEarnings)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fleet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-600" />
            Fleet ({vehicles.length})
          </CardTitle>
          <CardDescription>Vehicle inventory with status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {vehicles.slice(0, 5).map((vehicle) => (
              <div key={vehicle.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {vehicle.vehicleType === 'MOTORCYCLE' ? (
                    <Bike className="h-5 w-5 text-blue-600" />
                  ) : vehicle.vehicleType === 'TRICYCLE' ? (
                    <Car className="h-5 w-5 text-green-600" />
                  ) : (
                    <Truck className="h-5 w-5 text-purple-600" />
                  )}
                  <VehicleStatusBadge status={vehicle.status} />
                </div>
                <p className="font-mono text-sm font-medium">{vehicle.vehicleNumber}</p>
                <p className="text-xs text-muted-foreground">{vehicle.make} {vehicle.model}</p>
                {vehicle.currentDriverName && (
                  <p className="text-xs text-blue-600 mt-1">{vehicle.currentDriverName}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proof of Delivery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-emerald-600" />
            Proof of Delivery (POD)
          </CardTitle>
          <CardDescription>Digital confirmation of successful deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.filter((j: any) => j.pod).slice(0, 2).map((job) => (
              <div key={job.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-medium">{job.jobNumber}</p>
                    <p className="text-sm text-muted-foreground">{job.deliveryAddress}</p>
                  </div>
                  {job.pod?.exception ? (
                    <Badge className="bg-red-100 text-red-700 border-0">Exception</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Confirmed</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Received By</p>
                    <p className="font-medium">{job.pod?.receivedBy || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">{new Date(job.pod?.deliveredAt || '').toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Signature</p>
                    <p className="font-medium">{job.pod?.signatureData ? '✅ Captured' : '—'}</p>
                  </div>
                </div>
                {job.pod?.exception && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                    <strong>Exception:</strong> {job.pod.exceptionNotes}
                  </div>
                )}
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
              {/* Logistics Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Truck className="h-5 w-5" />
                  Logistics Domain
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-white rounded border">📦 Jobs & Dispatch</div>
                  <div className="p-2 bg-white rounded border">🚗 Fleet Management</div>
                  <div className="p-2 bg-white rounded border">👤 Driver Management</div>
                  <div className="p-2 bg-white rounded border">📍 Status Tracking</div>
                  <div className="p-2 bg-white rounded border">✅ Proof of Delivery</div>
                </div>
              </div>
              
              {/* Boundary Arrow */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-violet-600 font-medium text-center mb-2">
                  Delivery Facts
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-6 w-6 text-violet-600" />
                  <ArrowRight className="h-6 w-6 text-violet-600" />
                </div>
                <div className="text-xs text-violet-600 mt-2 text-center">
                  Amount, COD, Settlement
                </div>
              </div>
              
              {/* Commerce Domain */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <Building2 className="h-5 w-5" />
                  Commerce Suite
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-white rounded border">🧾 Invoicing</div>
                  <div className="p-2 bg-white rounded border">💰 Payment Collection</div>
                  <div className="p-2 bg-white rounded border">📊 VAT Calculation</div>
                  <div className="p-2 bg-white rounded border">📒 Accounting Journals</div>
                  <div className="p-2 bg-white rounded border">🏦 Bank Settlements</div>
                </div>
              </div>
            </div>
            
            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-violet-200">
              <p className="text-violet-800 text-sm">
                <strong>Commerce Boundary Rule:</strong> Logistics creates delivery facts (job amount, COD collected, settlements due). 
                Commerce handles all invoicing, VAT calculation, and accounting. Logistics NEVER touches money logic.
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
              <p><strong>📍 Landmark-based addressing</strong> — Lagos addresses use landmarks, not GPS</p>
              <p><strong>📱 2G-compatible tracking</strong> — Status updates work on low bandwidth</p>
              <p><strong>💵 COD support</strong> — Cash-heavy market with reconciliation</p>
            </div>
            <div className="space-y-2">
              <p><strong>🏍️ Multi-vehicle types</strong> — Okada, Keke, Van, Truck supported</p>
              <p><strong>📋 Nigerian licenses</strong> — Class A-E license type validation</p>
              <p><strong>🏦 Local settlements</strong> — NGN with Nigerian bank transfers</p>
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

export default function LogisticsDemoPage() {
  return (
    <DemoGate>
      <DemoModeProvider>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container max-w-6xl mx-auto py-8 px-4">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }>
              <LogisticsDemoContent />
            </Suspense>
          </div>
        </div>
      </DemoModeProvider>
    </DemoGate>
  )
}
