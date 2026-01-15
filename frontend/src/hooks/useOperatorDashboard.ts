/**
 * useOperatorDashboard Hook (Wave G5)
 * 
 * React hook for fetching and managing multi-park operator dashboard data.
 * Read-only, no modifications.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

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

interface UseOperatorDashboardOptions {
  tenantId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseOperatorDashboardResult {
  data: OperatorDashboardData | null
  loading: boolean
  error: string | null
  lastRefresh: Date | null
  refresh: () => Promise<void>
  isDemo: boolean
}

export function useOperatorDashboard({
  tenantId,
  autoRefresh = false,
  refreshInterval = 60000
}: UseOperatorDashboardOptions): UseOperatorDashboardResult {
  const [data, setData] = useState<OperatorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/parkhub/operator-dashboard?tenantId=${encodeURIComponent(tenantId)}`
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard')
      }
      
      setData(result.data)
      setLastRefresh(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[useOperatorDashboard] Error:', message)
    } finally {
      setLoading(false)
    }
  }, [tenantId])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return
    
    const interval = setInterval(refresh, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refresh])
  
  return {
    data,
    loading,
    error,
    lastRefresh,
    refresh,
    isDemo: data?.isDemo ?? tenantId === 'demo-tenant-001'
  }
}

export default useOperatorDashboard
