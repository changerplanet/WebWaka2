/**
 * Multi-Park Operator Dashboard Component (Wave G5)
 * 
 * Mobile-first, tablet-friendly consolidated view for operators
 * managing multiple parks.
 * 
 * Features:
 * - Cross-park summaries
 * - Active trips overview
 * - Ticket sales breakdown
 * - Agent activity monitoring
 * 
 * Constraints:
 * - Read-only: No modifications
 * - No automation
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface ParkSummary {
  parkId: string
  parkName: string
  activeTrips: number
  boardingTrips: number
  departedToday: number
  completedToday: number
  cancelledToday: number
}

interface TripOverview {
  tripId: string
  tripNumber: string
  parkId: string
  parkName: string
  routeName: string
  origin: string
  destination: string
  status: string
  departureMode: string
  scheduledDeparture: string | null
  totalSeats: number
  bookedSeats: number
  availableSeats: number
  currentPrice: number
  driverName: string | null
  vehiclePlate: string | null
}

interface TicketSalesSummary {
  totalTicketsSold: number
  totalRevenue: number
  cashRevenue: number
  cardRevenue: number
  transferRevenue: number
  averageTicketPrice: number
  ticketsByPark: Array<{
    parkId: string
    parkName: string
    ticketCount: number
    revenue: number
  }>
  ticketsByPaymentMethod: Array<{
    method: string
    count: number
    amount: number
  }>
}

interface AgentActivitySummary {
  activeAgents: number
  agentPerformance: Array<{
    agentId: string
    agentName: string
    parkId: string
    parkName: string
    ticketsSold: number
    revenue: number
    lastActivityAt: string | null
  }>
}

interface OperatorDashboardData {
  asOfTime: string
  dateRange: { start: string; end: string }
  parks: ParkSummary[]
  activeTrips: TripOverview[]
  ticketSales: TicketSalesSummary
  agentActivity: AgentActivitySummary
  isDemo: boolean
}

interface OperatorDashboardProps {
  tenantId: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Scheduled' },
  BOARDING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Boarding' },
  READY_TO_DEPART: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
  DEPARTED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Departed' },
  IN_TRANSIT: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'In Transit' },
  ARRIVED: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Arrived' },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-NG')
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

function SeatIndicator({ booked, total }: { booked: number; total: number }) {
  const percentage = (booked / total) * 100
  let bgColor = 'bg-gray-200'
  let fillColor = 'bg-blue-500'
  
  if (percentage >= 90) fillColor = 'bg-green-500'
  else if (percentage >= 70) fillColor = 'bg-yellow-500'
  else if (percentage >= 50) fillColor = 'bg-orange-500'
  
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-16 rounded-full ${bgColor} overflow-hidden`}>
        <div 
          className={`h-full ${fillColor} transition-all duration-300`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">
        {booked}/{total}
      </span>
    </div>
  )
}

export function OperatorDashboard({ tenantId }: OperatorDashboardProps) {
  const [data, setData] = useState<OperatorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'sales' | 'agents'>('overview')
  
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/parkhub/operator-dashboard?tenantId=${encodeURIComponent(tenantId)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch dashboard')
      }
      
      const result = await response.json()
      setData(result.data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [tenantId])
  
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])
  
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
          <p className="text-red-700 font-medium">Error loading dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  if (!data) return null
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Operator Dashboard</h1>
              <p className="text-xs text-gray-500">
                {data.isDemo && <span className="text-orange-600 font-medium">DEMO MODE</span>}
                {lastRefresh && (
                  <span className="ml-2">
                    Updated {formatRelativeTime(lastRefresh.toISOString())}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <svg 
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <nav className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {(['overview', 'trips', 'sales', 'agents'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>
      
      <main className="p-4">
        {activeTab === 'overview' && (
          <OverviewTab data={data} />
        )}
        {activeTab === 'trips' && (
          <TripsTab trips={data.activeTrips} />
        )}
        {activeTab === 'sales' && (
          <SalesTab sales={data.ticketSales} />
        )}
        {activeTab === 'agents' && (
          <AgentsTab activity={data.agentActivity} />
        )}
      </main>
    </div>
  )
}

function OverviewTab({ data }: { data: OperatorDashboardData }) {
  const totalActiveTrips = data.parks.reduce((sum, p) => sum + p.activeTrips, 0)
  const totalBoarding = data.parks.reduce((sum, p) => sum + p.boardingTrips, 0)
  const totalDeparted = data.parks.reduce((sum, p) => sum + p.departedToday, 0)
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard 
          label="Active Trips" 
          value={totalActiveTrips} 
          color="blue"
        />
        <MetricCard 
          label="Boarding Now" 
          value={totalBoarding} 
          color="green"
        />
        <MetricCard 
          label="Departed Today" 
          value={totalDeparted} 
          color="purple"
        />
        <MetricCard 
          label="Total Revenue" 
          value={formatCurrency(data.ticketSales.totalRevenue)} 
          color="yellow"
          isMonetary
        />
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Parks Overview</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {data.parks.map(park => (
            <div key={park.parkId} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{park.parkName}</h3>
                <span className="text-sm text-blue-600 font-medium">
                  {park.activeTrips} active
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>{park.boardingTrips} boarding</span>
                <span>{park.departedToday} departed</span>
                <span>{park.completedToday} completed</span>
                {park.cancelledToday > 0 && (
                  <span className="text-red-500">{park.cancelledToday} cancelled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Top Agents Today</h2>
          <span className="text-xs text-gray-500">
            {data.agentActivity.activeAgents} active
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {data.agentActivity.agentPerformance.slice(0, 5).map((agent, idx) => (
            <div key={agent.agentId} className="px-4 py-2 flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                idx === 1 ? 'bg-gray-100 text-gray-600' :
                idx === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{agent.agentName}</p>
                <p className="text-xs text-gray-500">{agent.parkName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{agent.ticketsSold} tickets</p>
                <p className="text-xs text-gray-500">{formatCurrency(agent.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TripsTab({ trips }: { trips: TripOverview[] }) {
  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No active trips</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {trips.map(trip => (
        <div key={trip.tripId} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono text-gray-600">{trip.tripNumber}</span>
                <StatusBadge status={trip.status} />
              </div>
              <p className="font-medium text-gray-900 mt-1">{trip.routeName}</p>
              <p className="text-xs text-gray-500">{trip.parkName}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{formatCurrency(trip.currentPrice)}</p>
              <p className="text-xs text-gray-500">per seat</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <SeatIndicator booked={trip.bookedSeats} total={trip.totalSeats} />
              {trip.scheduledDeparture && (
                <span className="text-xs text-gray-500">
                  Departs {formatTime(trip.scheduledDeparture)}
                </span>
              )}
            </div>
            {trip.driverName && (
              <div className="text-xs text-gray-500 text-right">
                <p>{trip.driverName}</p>
                {trip.vehiclePlate && <p className="font-mono">{trip.vehiclePlate}</p>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SalesTab({ sales }: { sales: TicketSalesSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Tickets Sold" 
          value={sales.totalTicketsSold} 
          color="blue"
        />
        <MetricCard 
          label="Total Revenue" 
          value={formatCurrency(sales.totalRevenue)} 
          color="green"
          isMonetary
        />
        <MetricCard 
          label="Avg. Price" 
          value={formatCurrency(sales.averageTicketPrice)} 
          color="purple"
          isMonetary
        />
        <MetricCard 
          label="Cash Sales" 
          value={formatCurrency(sales.cashRevenue)} 
          color="yellow"
          isMonetary
        />
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Revenue by Park</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sales.ticketsByPark.map(park => (
            <div key={park.parkId} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{park.parkName}</p>
                <p className="text-xs text-gray-500">{park.ticketCount} tickets</p>
              </div>
              <p className="font-medium text-gray-900">{formatCurrency(park.revenue)}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">By Payment Method</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sales.ticketsByPaymentMethod.map(method => (
            <div key={method.method} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {method.method === 'CASH' ? 'Cash' : 
                   method.method === 'POS_CARD' ? 'Card (POS)' : 
                   method.method === 'BANK_TRANSFER' ? 'Bank Transfer' : 
                   method.method}
                </p>
                <p className="text-xs text-gray-500">{method.count} transactions</p>
              </div>
              <p className="font-medium text-gray-900">{formatCurrency(method.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentsTab({ activity }: { activity: AgentActivitySummary }) {
  if (activity.agentPerformance.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No agent activity today</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <p className="text-blue-800 font-medium">{activity.activeAgents} Active Agents</p>
        <p className="text-blue-600 text-sm">Agents with ticket sales today</p>
      </div>
      
      <div className="space-y-2">
        {activity.agentPerformance.map((agent, idx) => (
          <div key={agent.agentId} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                idx === 1 ? 'bg-gray-200 text-gray-600' :
                idx === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                #{idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{agent.agentName}</p>
                <p className="text-xs text-gray-500">{agent.parkName}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-lg font-semibold text-gray-900">{agent.ticketsSold}</p>
                <p className="text-xs text-gray-500">Tickets</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(agent.revenue)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{formatRelativeTime(agent.lastActivityAt)}</p>
                <p className="text-xs text-gray-500">Last Sale</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ 
  label, 
  value, 
  color,
  isMonetary = false
}: { 
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  isMonetary?: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200'
  }
  
  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`font-semibold ${isMonetary ? 'text-lg' : 'text-2xl'} text-gray-900`}>
        {value}
      </p>
    </div>
  )
}

export default OperatorDashboard
