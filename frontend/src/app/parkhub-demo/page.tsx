'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Bus, 
  MapPin, 
  Users, 
  Ticket, 
  Clock, 
  TrendingUp,
  Building2,
  UserCircle,
  Banknote,
  Shield,
  ArrowRight,
  Star,
  Wifi,
  Snowflake,
  Tv,
  Plug,
  Navigation,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuickStartBanner } from '@/components/demo/QuickStartBanner'
import { resolveQuickStart } from '@/lib/demo/quickstart'
import { PARKHUB_LABELS, TRIP_STATUS_LABELS, type TripStatus } from '@/lib/parkhub/config'

// Demo Data - Jibowu Motor Park, Lagos
const DEMO_SCENARIO = {
  parkName: 'Jibowu Motor Park',
  location: 'Yaba, Lagos, Nigeria',
  description: 'One of Lagos\' largest motor parks serving destinations across Nigeria. Multi-vendor transport marketplace with digital ticketing and real-time trip tracking.',
}

const DEMO_STATS = {
  totalCompanies: 12,
  activeRoutes: 45,
  todayTickets: 234,
  todayRevenue: 1250000,
  activeTrips: 8,
  totalDrivers: 67,
}

const DEMO_COMPANIES = [
  {
    id: '1',
    name: 'ABC Transport',
    status: 'APPROVED' as const,
    totalRoutes: 8,
    totalDrivers: 15,
    totalTickets: 1250,
    totalRevenue: 5625000,
    commissionRate: 10,
    busTypes: ['LUXURY', 'STANDARD'],
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Peace Mass Transit',
    status: 'APPROVED' as const,
    totalRoutes: 12,
    totalDrivers: 22,
    totalTickets: 2100,
    totalRevenue: 9450000,
    commissionRate: 10,
    busTypes: ['STANDARD'],
    rating: 4.2,
  },
  {
    id: '3',
    name: 'GUO Transport',
    status: 'APPROVED' as const,
    totalRoutes: 10,
    totalDrivers: 18,
    totalTickets: 1800,
    totalRevenue: 7200000,
    commissionRate: 10,
    busTypes: ['ECONOMY'],
    rating: 4.0,
  },
]

const DEMO_ROUTES = [
  { id: '1', company: 'ABC Transport', origin: 'Lagos (Jibowu)', destination: 'Abuja (Utako)', departureTime: '06:00', price: 15000, seats: 18, available: 12, busType: 'LUXURY', amenities: ['AC', 'WiFi', 'TV', 'USB'], duration: '8 hrs' },
  { id: '2', company: 'ABC Transport', origin: 'Lagos (Jibowu)', destination: 'Ibadan (Challenge)', departureTime: '07:30', price: 4500, seats: 14, available: 5, busType: 'STANDARD', amenities: ['AC', 'USB'], duration: '2 hrs' },
  { id: '3', company: 'Peace Mass Transit', origin: 'Lagos (Jibowu)', destination: 'Benin City', departureTime: '08:00', price: 8000, seats: 18, available: 18, busType: 'STANDARD', amenities: ['AC'], duration: '5 hrs' },
  { id: '4', company: 'Peace Mass Transit', origin: 'Lagos (Jibowu)', destination: 'Enugu', departureTime: '09:00', price: 12000, seats: 18, available: 10, busType: 'STANDARD', amenities: ['AC', 'USB'], duration: '7 hrs' },
  { id: '5', company: 'GUO Transport', origin: 'Lagos (Jibowu)', destination: 'Port Harcourt', departureTime: '09:00', price: 12000, seats: 22, available: 22, busType: 'ECONOMY', amenities: ['AC'], duration: '8 hrs' },
  { id: '6', company: 'GUO Transport', origin: 'Lagos (Jibowu)', destination: 'Calabar', departureTime: '08:00', price: 14000, seats: 22, available: 15, busType: 'ECONOMY', amenities: ['AC'], duration: '10 hrs' },
]

const DEMO_TRIPS = [
  { id: '1', route: 'Lagos → Abuja', company: 'ABC Transport', status: 'IN_TRANSIT' as TripStatus, departure: '06:00', driver: 'Chukwu Emmanuel', passengers: 16, capacity: 18, progress: 65 },
  { id: '2', route: 'Lagos → Ibadan', company: 'ABC Transport', status: 'BOARDING' as TripStatus, departure: '07:30', driver: 'Adebayo Kunle', passengers: 8, capacity: 14, progress: 0 },
  { id: '3', route: 'Lagos → Benin', company: 'Peace Mass Transit', status: 'SCHEDULED' as TripStatus, departure: '08:00', driver: 'Okafor Chinedu', passengers: 12, capacity: 18, progress: 0 },
  { id: '4', route: 'Lagos → Enugu', company: 'Peace Mass Transit', status: 'DEPARTED' as TripStatus, departure: '05:00', driver: 'Aliyu Bello', passengers: 18, capacity: 18, progress: 25 },
]

const DEMO_RECENT_TICKETS = [
  { id: 'TKT-001', passenger: 'Adewale Johnson', route: 'Lagos → Abuja', company: 'ABC Transport', price: 15000, time: '10:45 AM', seat: 'A3' },
  { id: 'TKT-002', passenger: 'Ngozi Okonkwo', route: 'Lagos → Ibadan', company: 'ABC Transport', price: 4500, time: '10:32 AM', seat: 'B1' },
  { id: 'TKT-003', passenger: 'Mohammed Yusuf', route: 'Lagos → Enugu', company: 'Peace Mass Transit', price: 12000, time: '10:15 AM', seat: 'C5' },
  { id: 'TKT-004', passenger: 'Chioma Eze', route: 'Lagos → Port Harcourt', company: 'GUO Transport', price: 12000, time: '09:58 AM', seat: 'D2' },
]

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'AC': <Snowflake className="w-3 h-3" />,
  'WiFi': <Wifi className="w-3 h-3" />,
  'TV': <Tv className="w-3 h-3" />,
  'USB': <Plug className="w-3 h-3" />,
}

const QUICK_START_ROLES = [
  {
    id: 'parkAdmin',
    title: 'Park Administrator',
    description: 'Manage transport companies, set commissions, view park analytics',
    icon: Building2,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  {
    id: 'operator',
    title: 'Transport Operator',
    description: 'Manage routes, drivers, view tickets and earnings',
    icon: Bus,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  {
    id: 'parkAgent',
    title: 'Park Agent (POS)',
    description: 'Sell tickets at counter, process walk-in passengers',
    icon: Ticket,
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  {
    id: 'passenger',
    title: 'Passenger',
    description: 'Search routes, book tickets, track your trip',
    icon: UserCircle,
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  },
]

export default function ParkHubDemoPage() {
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
    router.push('/parkhub-demo')
  }
  
  const handleDismissQuickStart = () => {
    router.push('/commerce-demo')
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
  }

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800'
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800'
      case 'SCHEDULED': return 'bg-gray-100 text-gray-800'
      case 'DEPARTED': return 'bg-indigo-100 text-indigo-800'
      case 'ARRIVED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBusTypeColor = (type: string) => {
    switch (type) {
      case 'LUXURY': return 'bg-purple-100 text-purple-800'
      case 'STANDARD': return 'bg-blue-100 text-blue-800'
      case 'ECONOMY': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Quick Start Banner */}
      {quickStartConfig && (
        <QuickStartBanner
          config={quickStartConfig}
          onSwitchRole={handleSwitchRole}
          onDismiss={handleDismissQuickStart}
        />
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-white/20 text-white hover:bg-white/30">S5 Narrative Ready</Badge>
            <Badge variant="outline" className="border-white/40 text-white">Platform Standardisation v2</Badge>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Bus className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">ParkHub - Motor Park Marketplace</h1>
              <p className="text-blue-100 text-lg">Transport vertical for Nigerian motor parks</p>
            </div>
          </div>

          {/* Nigeria-First Badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge className="bg-green-500/20 text-green-100 border border-green-400/30">
              <Shield className="w-3 h-3 mr-1" />
              Capability Guarded
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-100 border border-amber-400/30">
              <MapPin className="w-3 h-3 mr-1" />
              Nigeria-First
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-100 border border-blue-400/30">
              <Building2 className="w-3 h-3 mr-1" />
              MVM Configuration
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-100 border border-purple-400/30">
              <Banknote className="w-3 h-3 mr-1" />
              Commerce Boundary
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Start Role Selector */}
        {!quickStartConfig && (
          <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Quick Start: Choose Your Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_START_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => router.push(`/parkhub-demo?quickstart=${role.id}`)}
                    className={`p-4 rounded-lg text-left transition-all ${role.color}`}
                  >
                    <role.icon className="w-8 h-8 mb-2" />
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm opacity-80">{role.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Scenario */}
        <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <MapPin className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Demo Scenario: {DEMO_SCENARIO.parkName}</h3>
                <p className="text-amber-700">{DEMO_SCENARIO.location}</p>
                <p className="text-sm text-amber-600 mt-1">{DEMO_SCENARIO.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Preview Mode Notice */}
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Demo Preview Mode</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            This is a demonstration of ParkHub capabilities. In production, this data would come from authenticated API calls.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs">{PARKHUB_LABELS.vendors}</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.totalCompanies}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">Active {PARKHUB_LABELS.products}</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.activeRoutes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Ticket className="w-4 h-4" />
                <span className="text-xs">Today's {PARKHUB_LABELS.orders}</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.todayTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Banknote className="w-4 h-4" />
                <span className="text-xs">Today's Revenue</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(DEMO_STATS.todayRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Navigation className="w-4 h-4" />
                <span className="text-xs">Active Trips</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.activeTrips}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Total Drivers</span>
              </div>
              <p className="text-2xl font-bold">{DEMO_STATS.totalDrivers}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Transport Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {PARKHUB_LABELS.vendors}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_COMPANIES.map((company) => (
                  <div key={company.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{company.rating}</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{company.status}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{PARKHUB_LABELS.products}</span>
                        <p className="font-medium">{company.totalRoutes}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Drivers</span>
                        <p className="font-medium">{company.totalDrivers}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{PARKHUB_LABELS.orders}</span>
                        <p className="font-medium">{company.totalTickets.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Commission</span>
                        <p className="font-medium">{company.commissionRate}%</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {company.busTypes.map((type) => (
                        <span key={type} className={`text-xs px-2 py-0.5 rounded ${getBusTypeColor(type)}`}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Active Trips Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_TRIPS.map((trip) => (
                  <div key={trip.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{trip.route}</h3>
                        <p className="text-sm text-muted-foreground">{trip.company}</p>
                      </div>
                      <Badge className={getStatusColor(trip.status)}>
                        {TRIP_STATUS_LABELS[trip.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{trip.departure}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{trip.passengers}/{trip.capacity} passengers</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <UserCircle className="w-4 h-4" />
                      <span>Driver: {trip.driver}</span>
                    </div>
                    {trip.status === 'IN_TRANSIT' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Trip Progress</span>
                          <span>{trip.progress}%</span>
                        </div>
                        <Progress value={trip.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Routes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Available {PARKHUB_LABELS.products} Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_ROUTES.map((route) => (
                <div key={route.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${getBusTypeColor(route.busType)}`}>
                      {route.busType}
                    </span>
                    <span className="text-xs text-muted-foreground">{route.company}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{route.origin}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{route.destination}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{route.departureTime}</span>
                    </div>
                    <span>{route.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {route.amenities.map((amenity) => (
                      <span key={amenity} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded">
                        {AMENITY_ICONS[amenity]}
                        <span>{amenity}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(route.price)}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm ${route.available < 5 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {route.available}/{route.seats} seats
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Recent {PARKHUB_LABELS.orders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">{PARKHUB_LABELS.order} #</th>
                    <th className="text-left p-3 text-sm font-medium">{PARKHUB_LABELS.customer}</th>
                    <th className="text-left p-3 text-sm font-medium">{PARKHUB_LABELS.product}</th>
                    <th className="text-left p-3 text-sm font-medium">{PARKHUB_LABELS.vendor}</th>
                    <th className="text-center p-3 text-sm font-medium">Seat</th>
                    <th className="text-right p-3 text-sm font-medium">Price</th>
                    <th className="text-right p-3 text-sm font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_RECENT_TICKETS.map((ticket) => (
                    <tr key={ticket.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-mono text-sm">{ticket.id}</td>
                      <td className="p-3">{ticket.passenger}</td>
                      <td className="p-3">{ticket.route}</td>
                      <td className="p-3 text-sm text-muted-foreground">{ticket.company}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">{ticket.seat}</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(ticket.price)}</td>
                      <td className="p-3 text-right text-sm text-muted-foreground">{ticket.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Commerce Boundary Architecture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Commerce Boundary Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ParkHub Suite */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/50">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  ParkHub Suite (This Vertical)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Transport Company Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Route & Schedule Configuration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Driver & Trip Assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Real-time Trip Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    POS Ticket Sales
                  </li>
                </ul>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <ArrowRight className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Emits transport<br />& booking facts</p>
                </div>
              </div>

              {/* Commerce Suite */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/50">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Commerce Suite (Handles Financials)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    MVM: Products, Orders, Vendors
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Commission Calculation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Payment Processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Wallet & Settlement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Revenue Analytics
                  </li>
                </ul>
              </div>
            </div>

            {/* Boundary Rule */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Boundary Rule</h4>
              <p className="text-amber-700 text-sm">
                ParkHub is a <strong>configuration of MVM</strong> (Multi-Vendor Marketplace), not a new module. 
                Routes are stored as products with metadata. Tickets are orders. Transport companies are vendors. 
                Commission flows through MVM's existing commission engine. <strong>No transport-specific database tables exist.</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nigeria-First Design Notes */}
        <Card className="mb-8 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <MapPin className="w-5 h-5" />
              Nigeria-First Design Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Transport Industry Context</h4>
                <ul className="space-y-1 text-amber-800">
                  <li>• Motor parks are major transport hubs across Nigeria</li>
                  <li>• Multiple transport companies operate from single parks</li>
                  <li>• Park administrators collect commission on ticket sales</li>
                  <li>• Mix of online booking and walk-in passengers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Demo Data Authenticity</h4>
                <ul className="space-y-1 text-amber-800">
                  <li>• Real transport companies: ABC, Peace Mass, GUO</li>
                  <li>• Real routes: Lagos-Abuja, Lagos-Ibadan, etc.</li>
                  <li>• Realistic pricing in NGN</li>
                  <li>• Nigerian driver and passenger names</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Offline-First Operations</h4>
                <ul className="space-y-1 text-amber-800">
                  <li>• POS works offline for ticket sales</li>
                  <li>• Trip status syncs when connectivity restored</li>
                  <li>• Driver manifests cached locally</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Payment Methods</h4>
                <ul className="space-y-1 text-amber-800">
                  <li>• Cash (primary at motor parks)</li>
                  <li>• Bank transfer</li>
                  <li>• Card payment</li>
                  <li>• USSD (mobile banking)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
