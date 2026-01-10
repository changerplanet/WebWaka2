'use client'

/**
 * HOSPITALITY SUITE: Demo Portal
 * 
 * Showcases Hospitality Suite capabilities with Nigerian demo data.
 * Read-only, demo-safe experience for partners and investors.
 * 
 * @module app/hospitality-demo
 * @phase S5 (Narrative Integration)
 * @standard Platform Standardisation v2
 */

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Hotel,
  Users,
  UtensilsCrossed,
  Calendar,
  BedDouble,
  Receipt,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  Clock,
  Banknote,
  Shield,
  Globe,
  Building2,
  DoorOpen,
  ClipboardList,
  ChefHat,
  Coffee,
  Armchair,
  Star,
  CreditCard,
  LayoutGrid,
  BadgeCheck,
  Copy,
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

// Demo Mode Integration (S5)
import { DemoModeProvider, useDemoModeOptional, resolveQuickStart, QuickStartConfig } from '@/lib/demo'
import { DemoOverlay, QuickStartBanner } from '@/components/demo'

// ============================================================================
// TYPES
// ============================================================================

interface DemoStats {
  venues: number
  tables: number
  rooms: number
  guests: number
  reservations: number
  activeStays: number
  activeOrders: number
  staff: number
  pendingChargeFacts: number
}

interface Venue {
  id: string
  name: string
  code: string
  type: string
  totalTables: number
  totalRooms: number
  isActive: boolean
}

interface Guest {
  id: string
  guestNumber: string
  firstName: string
  lastName: string
  title?: string
  phone?: string
  isVip: boolean
  nationality?: string
}

interface Room {
  id: string
  roomNumber: string
  roomType: string
  bedCount: number
  maxOccupancy: number
  baseRate: number
  status: string
}

interface HospitalityTable {
  id: string
  tableNumber: string
  capacity: number
  location?: string
  status: string
}

interface Order {
  id: string
  orderNumber: string
  orderType: string
  guestName?: string
  covers: number
  status: string
  serverName?: string
  items?: { length: number }
  _count?: { items: number }
}

interface Stay {
  id: string
  stayNumber: string
  guest?: { firstName: string; lastName: string }
  room?: { roomNumber: string; roomType: string }
  checkInDate: string
  checkOutDate: string
  status: string
}

interface ChargeFact {
  id: string
  factType: string
  description: string
  amount: number
  status: string
  serviceDate: string
}

// ============================================================================
// HOSPITALITY MODULE CARDS
// ============================================================================

const HOSPITALITY_MODULES = [
  {
    id: 'venues',
    name: 'Venue & Layout',
    description: 'Hotels, restaurants, floors, tables, and rooms management',
    icon: Building2,
    color: 'amber',
    highlights: [
      'Multi-venue support',
      'Floor plans & zones',
      'Table/room capacity',
      'Real-time status'
    ]
  },
  {
    id: 'guests',
    name: 'Guest Management',
    description: 'Guest profiles, preferences, and visit history',
    icon: Users,
    color: 'blue',
    highlights: [
      'Nigerian guest profiles',
      'VIP tracking',
      'Preference history',
      'Guest merge capability'
    ]
  },
  {
    id: 'reservations',
    name: 'Reservations',
    description: 'Table and room reservations with availability checking',
    icon: Calendar,
    color: 'violet',
    highlights: [
      'Walk-in support',
      'Table reservations',
      'Room bookings',
      'Deposit tracking'
    ]
  },
  {
    id: 'stays',
    name: 'Hotel Stays',
    description: 'Check-in, check-out, extensions, and room changes',
    icon: BedDouble,
    color: 'emerald',
    highlights: [
      'Room check-in/out',
      'Stay extensions',
      'Room changes',
      'In-house tracking'
    ]
  },
  {
    id: 'orders',
    name: 'Orders & POS',
    description: 'Food & beverage orders with kitchen display support',
    icon: UtensilsCrossed,
    color: 'rose',
    highlights: [
      'Dine-in orders',
      'Room service',
      'Kitchen queue',
      'Split bills'
    ]
  },
  {
    id: 'staff',
    name: 'Staff & Shifts',
    description: 'Staff profiles and shift scheduling',
    icon: UserCheck,
    color: 'teal',
    highlights: [
      'Multi-shift support',
      'Role assignments',
      'Duty rosters',
      'Availability tracking'
    ]
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    violet: { bg: 'bg-violet-600', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    rose: { bg: 'bg-rose-600', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    teal: { bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  }
  return colors[color] || colors.amber
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'AVAILABLE': 'bg-green-100 text-green-800',
    'OCCUPIED': 'bg-blue-100 text-blue-800',
    'RESERVED': 'bg-yellow-100 text-yellow-800',
    'CLEANING': 'bg-orange-100 text-orange-800',
    'DIRTY': 'bg-orange-100 text-orange-800',
    'MAINTENANCE': 'bg-red-100 text-red-800',
    'OUT_OF_SERVICE': 'bg-gray-100 text-gray-800',
    'CHECKED_IN': 'bg-green-100 text-green-800',
    'IN_HOUSE': 'bg-blue-100 text-blue-800',
    'CHECKED_OUT': 'bg-gray-100 text-gray-800',
    'PLACED': 'bg-yellow-100 text-yellow-800',
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'PREPARING': 'bg-orange-100 text-orange-800',
    'READY': 'bg-green-100 text-green-800',
    'SERVED': 'bg-green-100 text-green-800',
    'COMPLETED': 'bg-gray-100 text-gray-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'BILLED': 'bg-green-100 text-green-800',
    'WAIVED': 'bg-gray-100 text-gray-800',
    'ACTIVE': 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getRoomTypeDisplay(type: string): string {
  const mapping: Record<string, string> = {
    'STANDARD': 'Standard',
    'DELUXE': 'Deluxe',
    'EXECUTIVE': 'Executive',
    'SUITE': 'Suite',
    'PRESIDENTIAL': 'Presidential',
  }
  return mapping[type] || type
}

function getOrderTypeIcon(type: string) {
  switch (type) {
    case 'DINE_IN': return UtensilsCrossed
    case 'ROOM_SERVICE': return BedDouble
    case 'TAKEAWAY': return Coffee
    case 'DELIVERY': return DoorOpen
    default: return ClipboardList
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ModuleCard({ module }: { module: typeof HOSPITALITY_MODULES[0] }) {
  const Icon = module.icon
  const colors = getColorClasses(module.color)

  return (
    <Card className="group hover:shadow-lg transition-all duration-200" data-testid={`module-card-${module.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colors.bgLight}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
        <CardTitle className="mt-4">{module.name}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {module.highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className={`w-4 h-4 ${colors.text}`} />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ 
  value, 
  label, 
  icon: Icon,
  highlight,
}: { 
  value: string | number
  label: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-white'}`} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${highlight ? 'text-amber-600' : 'text-muted-foreground'}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mb-6" data-testid="demo-banner">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Sample Nigerian Data</p>
          <p className="text-sm text-amber-700">
            This page displays demo data for <strong>PalmView Suites & Grill, Lekki, Lagos</strong>.
            All data is fictional and represents typical hospitality operations in Nigeria.
          </p>
        </div>
      </div>
    </div>
  )
}

function NigeriaFirstBadges() {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
        <CheckCircle className="w-3 h-3 mr-1" />
        S3 API Complete
      </Badge>
      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
        <Shield className="w-3 h-3 mr-1" />
        Capability Guarded
      </Badge>
      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
        <Globe className="w-3 h-3 mr-1" />
        Nigeria-First
      </Badge>
      <Badge className="bg-rose-500/20 text-rose-300 border-rose-400/30">
        <Receipt className="w-3 h-3 mr-1" />
        VAT 7.5%
      </Badge>
      <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30">
        <Banknote className="w-3 h-3 mr-1" />
        Cash-Friendly
      </Badge>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT COMPONENT
// ============================================================================

function HospitalityDemoContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [tables, setTables] = useState<HospitalityTable[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stays, setStays] = useState<Stay[]>([])
  const [chargeFacts, setChargeFacts] = useState<ChargeFact[]>([])
  const [initialized, setInitialized] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Quick Start Integration (S5)
  const quickstartParam = searchParams.get('quickstart')
  const quickStartResult = resolveQuickStart(quickstartParam)
  const quickStartConfig: QuickStartConfig | null = quickStartResult.config

  // Demo Mode Integration
  const demoContext = useDemoModeOptional()

  // Copy demo link functionality
  const copyDemoLink = useCallback((role: string) => {
    const url = `${window.location.origin}/hospitality-demo?quickstart=${role}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }, [])

  // Load demo data
  const loadDemoData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if initialized
      const configRes = await fetch('/api/hospitality?action=config')
      const configData = await configRes.json()
      
      // Check for 401 (unauthenticated) - show preview mode
      if (configRes.status === 401 || configData.error === 'Unauthorized') {
        setIsAuthenticated(false)
        setInitialized(false)
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)
      
      if (!configData.success || !configData.initialized) {
        setInitialized(false)
        setLoading(false)
        return
      }
      
      setInitialized(true)

      // Load stats
      const statsRes = await fetch('/api/hospitality?action=stats')
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Load venues
      const venuesRes = await fetch('/api/hospitality/venues')
      const venuesData = await venuesRes.json()
      if (venuesData.success && venuesData.venues?.length > 0) {
        setVenue(venuesData.venues[0])
        
        // Load venue-specific data
        const venueId = venuesData.venues[0].id
        
        // Load rooms
        const roomsRes = await fetch(`/api/hospitality/rooms?venueId=${venueId}`)
        const roomsData = await roomsRes.json()
        if (roomsData.success) {
          setRooms(roomsData.rooms || [])
        }

        // Load tables
        const tablesRes = await fetch(`/api/hospitality/tables?venueId=${venueId}`)
        const tablesData = await tablesRes.json()
        if (tablesData.success) {
          setTables(tablesData.tables || [])
        }

        // Load active orders
        const ordersRes = await fetch(`/api/hospitality/orders?action=active&venueId=${venueId}`)
        const ordersData = await ordersRes.json()
        if (ordersData.success) {
          setOrders(ordersData.orders || [])
        }

        // Load in-house stays
        const staysRes = await fetch(`/api/hospitality/stays?action=inHouse&venueId=${venueId}`)
        const staysData = await staysRes.json()
        if (staysData.success) {
          setStays(staysData.stays || [])
        }
      }

      // Load guests
      const guestsRes = await fetch('/api/hospitality/guests?limit=10')
      const guestsData = await guestsRes.json()
      if (guestsData.success) {
        setGuests(guestsData.guests || [])
      }

      // Load pending charge facts
      const chargeRes = await fetch('/api/hospitality/charge-facts?action=pending')
      const chargeData = await chargeRes.json()
      if (chargeData.success) {
        setChargeFacts(chargeData.facts || [])
      }

    } catch (err) {
      console.error('Error loading demo data:', err)
      setError('Failed to load demo data')
    } finally {
      setLoading(false)
    }
  }

  // Seed demo data
  const seedDemoData = async () => {
    setSeeding(true)
    setError(null)

    try {
      const res = await fetch('/api/hospitality/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      
      if (data.success) {
        await loadDemoData()
      } else {
        setError(data.error || data.message || 'Failed to seed demo data')
      }
    } catch (err) {
      console.error('Error seeding demo data:', err)
      setError('Failed to seed demo data')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    loadDemoData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Hospitality Suite demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Quick Start Banner (S5) */}
      {quickStartConfig && (
        <QuickStartBanner 
          config={quickStartConfig} 
          onSwitchRole={() => {
            // Navigate to demo without quickstart
            window.location.href = '/hospitality-demo'
          }}
          onDismiss={() => {
            // Navigate to demo without quickstart
            window.location.href = '/hospitality-demo'
          }}
        />
      )}

      {/* Demo Mode Overlay (S5) */}
      {demoContext?.isActive && <DemoOverlay />}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-amber-300 text-sm mb-4">
            <span>WebWaka Platform</span>
            <ChevronRight className="w-4 h-4" />
            <Link href="/commerce-demo" className="hover:text-white transition-colors">
              Commerce Suite
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/education-demo" className="hover:text-white transition-colors">
              Education Suite
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/health-demo" className="hover:text-white transition-colors">
              Health Suite
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Hospitality Suite</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="page-title">
                Hospitality Suite
              </h1>
              <p className="text-lg text-amber-100 mb-6">
                Complete hotel and restaurant management for Nigerian hospitality businesses.
                Venues, guests, reservations, stays, orders, and staff shifts — all integrated
                with cash-friendly and walk-in-first design.
              </p>
              
              <NigeriaFirstBadges />

              <p className="text-sm text-amber-200">
                Demo: <strong>PalmView Suites & Grill, Lekki, Lagos</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Armchair className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.tables || 0}</p>
                <p className="text-sm text-white/70">Tables</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <BedDouble className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.rooms || 0}</p>
                <p className="text-sm text-white/70">Rooms</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stats?.guests || 0}</p>
                <p className="text-sm text-white/70">Guests</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Receipt className="w-6 h-6 text-white/70 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">7.5%</p>
                <p className="text-sm text-white/70">VAT Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Banner */}
        <DemoBanner />

        {/* Unauthenticated Preview State */}
        {!isAuthenticated && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-4">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Demo Preview Mode</span>
              </div>
              <p className="text-blue-600 text-sm max-w-lg mx-auto mb-4">
                You are viewing the Hospitality Suite capabilities showcase. Sign in with a 
                tenant that has the <code className="bg-blue-100 px-1 rounded">hospitality</code> capability 
                enabled to seed and interact with live demo data.
              </p>
              <p className="text-xs text-blue-500">
                Preview mode - No live data displayed
              </p>
            </CardContent>
          </Card>
        )}

        {/* Authenticated but Not Initialized State */}
        {isAuthenticated && !initialized && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <Hotel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Demo Data Not Loaded</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click the button below to seed Nigerian demo data for PalmView Suites & Grill,
                including venues, rooms, tables, guests, stays, and orders.
              </p>
              <Button 
                onClick={seedDemoData} 
                disabled={seeding}
                className="bg-amber-600 hover:bg-amber-700"
                data-testid="seed-demo-btn"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding Demo Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Nigerian Demo Data
                  </>
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-600 mt-4">{error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Module Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Hospitality Suite Modules
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Six integrated modules covering the complete hospitality workflow.
            All APIs are capability-guarded, tenant-scoped, and Nigeria-first.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="module-grid">
            {HOSPITALITY_MODULES.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>

        {/* Data Preview Section - Only show if initialized */}
        {initialized && stats && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <StatCard value={stats.tables} label="Tables" icon={Armchair} />
              <StatCard value={stats.rooms} label="Rooms" icon={BedDouble} />
              <StatCard value={stats.guests} label="Guests" icon={Users} />
              <StatCard value={stats.activeStays} label="In-House" icon={DoorOpen} highlight />
              <StatCard value={stats.activeOrders} label="Active Orders" icon={UtensilsCrossed} highlight />
            </div>

            {/* Floor Plan Overview */}
            {venue && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-amber-600" />
                    {venue.name} - Floor Overview
                  </CardTitle>
                  <CardDescription>Tables and rooms status at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Tables Grid */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Armchair className="w-4 h-4" />
                        Restaurant Tables
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {tables.slice(0, 6).map(table => (
                          <div 
                            key={table.id} 
                            className={`p-3 rounded-lg border text-center ${
                              table.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' :
                              table.status === 'OCCUPIED' ? 'bg-blue-50 border-blue-200' :
                              table.status === 'RESERVED' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <p className="font-bold text-lg">{table.tableNumber}</p>
                            <p className="text-xs text-muted-foreground">{table.capacity} seats</p>
                            <Badge className={`mt-1 text-xs ${getStatusColor(table.status)}`}>
                              {table.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rooms Grid */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <BedDouble className="w-4 h-4" />
                        Hotel Rooms
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {rooms.slice(0, 6).map(room => (
                          <div 
                            key={room.id} 
                            className={`p-3 rounded-lg border text-center ${
                              room.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' :
                              room.status === 'OCCUPIED' ? 'bg-blue-50 border-blue-200' :
                              room.status === 'DIRTY' ? 'bg-orange-50 border-orange-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <p className="font-bold text-lg">{room.roomNumber}</p>
                            <p className="text-xs text-muted-foreground">{getRoomTypeDisplay(room.roomType)}</p>
                            <Badge className={`mt-1 text-xs ${getStatusColor(room.status)}`}>
                              {room.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guests Preview */}
            {guests.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Guest Registry Preview
                  </CardTitle>
                  <CardDescription>Sample guests from PalmView Suites</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>VIP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guests.slice(0, 6).map(guest => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-mono text-sm">{guest.guestNumber}</TableCell>
                          <TableCell className="font-medium">
                            {guest.title && `${guest.title} `}{guest.firstName} {guest.lastName}
                          </TableCell>
                          <TableCell>{guest.phone || '-'}</TableCell>
                          <TableCell>{guest.nationality || 'Nigerian'}</TableCell>
                          <TableCell>
                            {guest.isVip ? (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Star className="w-3 h-3 mr-1" />
                                VIP
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Two Column Layout: Stays & Orders */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* In-House Stays */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-emerald-600" />
                    In-House Guests
                  </CardTitle>
                  <CardDescription>Currently checked-in stays</CardDescription>
                </CardHeader>
                <CardContent>
                  {stays.length > 0 ? (
                    <div className="space-y-3">
                      {stays.slice(0, 5).map(stay => (
                        <div key={stay.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">
                              {stay.guest ? `${stay.guest.firstName} ${stay.guest.lastName}` : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Room {stay.room?.roomNumber} - {stay.room?.roomType ? getRoomTypeDisplay(stay.room.roomType) : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(stay.checkInDate)} - {formatDate(stay.checkOutDate)}
                            </p>
                            <Badge className={getStatusColor(stay.status)}>{stay.status.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">No in-house guests</p>
                  )}
                </CardContent>
              </Card>

              {/* Active Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-rose-600" />
                    Active Orders
                  </CardTitle>
                  <CardDescription>Orders in progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map(order => {
                        const TypeIcon = getOrderTypeIcon(order.orderType)
                        return (
                          <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-rose-50">
                                <TypeIcon className="w-4 h-4 text-rose-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{order.orderNumber}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.guestName || 'Walk-in'} - {order._count?.items || order.items?.length || 0} items
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">No active orders</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charge Facts (Commerce Boundary) */}
            {chargeFacts.length > 0 && (
              <Card className="mb-8 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    Pending Charge Facts
                    <Badge className="ml-2 bg-amber-100 text-amber-800">Commerce Boundary</Badge>
                  </CardTitle>
                  <CardDescription>Billing facts ready for Commerce - VAT calculated by Billing Suite</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargeFacts.slice(0, 5).map(fact => (
                        <TableRow key={fact.id}>
                          <TableCell>
                            <Badge variant="outline">{fact.factType.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>{fact.description}</TableCell>
                          <TableCell>{formatDate(fact.serviceDate)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(fact.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(fact.status)}>{fact.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Architecture Overview */}
        <Card className="bg-slate-900 text-white border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-center">Hospitality Suite Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-amber-400 mb-3">Venue Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>- Venues</li>
                  <li>- Floors</li>
                  <li>- Tables</li>
                  <li>- Rooms</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-blue-400 mb-3">Guest Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>- Guest Profiles</li>
                  <li>- Reservations</li>
                  <li>- Stays</li>
                  <li>- Visit History</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-rose-400 mb-3">Operations Layer</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>- Orders (POS)</li>
                  <li>- Kitchen Display</li>
                  <li>- Split Bills</li>
                  <li>- Staff Shifts</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-emerald-400 mb-3">Commerce Boundary</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>- Charge Facts</li>
                  <li>- → Billing</li>
                  <li>- → Payments</li>
                  <li>- → Accounting</li>
                </ul>
              </div>
            </div>

            {/* Commerce Boundary Notice */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-300">Commerce Boundary Compliance</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Hospitality Suite emits <strong>charge facts only</strong>. It never creates invoices, 
                    calculates VAT (7.5% for hospitality), records payments, or touches accounting journals. 
                    The canonical flow is: 
                    <code className="bg-white/10 px-1.5 py-0.5 rounded mx-1">
                      Hospitality → Billing → Payments → Accounting
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigeria-First Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-600" />
              Nigeria-First Hospitality Design
            </CardTitle>
            <CardDescription>
              Built for Nigerian hospitality realities and operational requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-emerald-600" />
                  Walk-in First
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>- Walk-in guests supported</li>
                  <li>- No mandatory reservations</li>
                  <li>- Quick guest creation</li>
                  <li>- Partial profile OK</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  Cash-Friendly
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>- Split bills supported</li>
                  <li>- No payment processing</li>
                  <li>- NGN currency default</li>
                  <li>- VAT 7.5% (Commerce handles)</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Multi-Shift Operations
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>- Morning/Afternoon/Night shifts</li>
                  <li>- Split shift support</li>
                  <li>- Clock in/out tracking</li>
                  <li>- Availability checking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Links Section (S5) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-amber-600" />
              Quick Start Demo Links
            </CardTitle>
            <CardDescription>
              Share role-specific demo experiences with partners and investors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Hotel Owner / GM</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyDemoLink('owner')}
                    className="h-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Rooms → Stays → Shifts → Charge Facts → Commerce
                </p>
                <Link 
                  href="/hospitality-demo?quickstart=owner" 
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Open as Owner →
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Restaurant Manager</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyDemoLink('manager')}
                    className="h-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Tables → Orders (POS) → Split Bills → Shifts
                </p>
                <Link 
                  href="/hospitality-demo?quickstart=manager" 
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Open as Manager →
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Guest</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyDemoLink('guest')}
                    className="h-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Reservation → Stay/Dining → Bill Transparency
                </p>
                <Link 
                  href="/hospitality-demo?quickstart=guest" 
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Open as Guest →
                </Link>
              </div>
            </div>
            {linkCopied && (
              <p className="text-sm text-green-600 mt-3 text-center">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Link copied to clipboard!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground text-sm mb-4">
            Hospitality Suite is part of the WebWaka Platform
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/commerce-demo" className="text-sm text-amber-600 hover:text-amber-700">
              Commerce Suite →
            </Link>
            <Link href="/education-demo" className="text-sm text-amber-600 hover:text-amber-700">
              Education Suite →
            </Link>
            <Link href="/health-demo" className="text-sm text-amber-600 hover:text-amber-700">
              Health Suite →
            </Link>
            <Link href="/dashboard" className="text-sm text-amber-600 hover:text-amber-700">
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================

export default function HospitalityDemoPortal() {
  return (
    <DemoModeProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      }>
        <HospitalityDemoContent />
      </Suspense>
    </DemoModeProvider>
  )
}
