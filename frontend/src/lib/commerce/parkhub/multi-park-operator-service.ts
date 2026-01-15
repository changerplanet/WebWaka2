/**
 * MULTI-PARK OPERATOR SERVICE (Wave G5)
 * 
 * Read-only consolidated view for operators managing multiple parks.
 * "Control tower visibility" - no execution, no automation.
 * 
 * Constraints:
 * - Read-only: No ticket sales, no payouts, no modifications
 * - No automation: No background jobs
 * - Tenant-isolated: All queries scoped to session.activeTenantId
 * - No cross-tenant visibility
 */

import { prisma } from '@/lib/prisma'

export interface ParkSummary {
  parkId: string
  parkName: string
  activeTrips: number
  boardingTrips: number
  departedToday: number
  completedToday: number
  cancelledToday: number
}

export interface TripOverview {
  tripId: string
  tripNumber: string
  parkId: string
  parkName: string
  routeName: string
  origin: string
  destination: string
  status: string
  departureMode: string
  scheduledDeparture: Date | null
  totalSeats: number
  bookedSeats: number
  availableSeats: number
  currentPrice: number
  driverName: string | null
  vehiclePlate: string | null
}

export interface TicketSalesSummary {
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

export interface AgentActivitySummary {
  activeAgents: number
  agentPerformance: Array<{
    agentId: string
    agentName: string
    parkId: string
    parkName: string
    ticketsSold: number
    revenue: number
    lastActivityAt: Date | null
  }>
}

export interface OperatorDashboardData {
  asOfTime: Date
  dateRange: {
    start: Date
    end: Date
  }
  parks: ParkSummary[]
  activeTrips: TripOverview[]
  ticketSales: TicketSalesSummary
  agentActivity: AgentActivitySummary
  isDemo: boolean
}

const DEMO_TENANT_ID = 'demo-tenant-001'

export class MultiParkOperatorService {
  constructor(private tenantId: string) {}

  private get isDemo(): boolean {
    return this.tenantId === DEMO_TENANT_ID
  }

  async getDistinctParks(): Promise<Array<{ parkId: string; parkName: string }>> {
    if (this.isDemo) {
      return this.getDemoParks()
    }

    const routes = await prisma.park_route.findMany({
      where: { tenantId: this.tenantId },
      select: { parkId: true },
      distinct: ['parkId']
    })

    const parkNames = await this.resolveParkNames(routes.map(r => r.parkId))
    return parkNames
  }

  private async resolveParkNames(parkIds: string[]): Promise<Array<{ parkId: string; parkName: string }>> {
    return parkIds.map(parkId => ({
      parkId,
      parkName: this.formatParkName(parkId)
    }))
  }

  private formatParkName(parkId: string): string {
    return parkId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  async getParksSummary(): Promise<ParkSummary[]> {
    if (this.isDemo) {
      return this.getDemoParksSummary()
    }

    const parks = await this.getDistinctParks()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const summaries: ParkSummary[] = []

    for (const park of parks) {
      const routes = await prisma.park_route.findMany({
        where: { tenantId: this.tenantId, parkId: park.parkId },
        select: { id: true }
      })
      const routeIds = routes.map(r => r.id)

      if (routeIds.length === 0) {
        summaries.push({
          parkId: park.parkId,
          parkName: park.parkName,
          activeTrips: 0,
          boardingTrips: 0,
          departedToday: 0,
          completedToday: 0,
          cancelledToday: 0
        })
        continue
      }

      const [activeTrips, boardingTrips, departedToday, completedToday, cancelledToday] = await Promise.all([
        prisma.park_trip.count({
          where: {
            tenantId: this.tenantId,
            routeId: { in: routeIds },
            status: { in: ['SCHEDULED', 'BOARDING', 'READY_TO_DEPART'] }
          }
        }),
        prisma.park_trip.count({
          where: {
            tenantId: this.tenantId,
            routeId: { in: routeIds },
            status: 'BOARDING'
          }
        }),
        prisma.park_trip.count({
          where: {
            tenantId: this.tenantId,
            routeId: { in: routeIds },
            status: 'DEPARTED',
            actualDeparture: { gte: startOfDay }
          }
        }),
        prisma.park_trip.count({
          where: {
            tenantId: this.tenantId,
            routeId: { in: routeIds },
            status: 'COMPLETED',
            updatedAt: { gte: startOfDay }
          }
        }),
        prisma.park_trip.count({
          where: {
            tenantId: this.tenantId,
            routeId: { in: routeIds },
            status: 'CANCELLED',
            updatedAt: { gte: startOfDay }
          }
        })
      ])

      summaries.push({
        parkId: park.parkId,
        parkName: park.parkName,
        activeTrips,
        boardingTrips,
        departedToday,
        completedToday,
        cancelledToday
      })
    }

    return summaries
  }

  async getActiveTrips(options?: { limit?: number }): Promise<TripOverview[]> {
    const { limit = 50 } = options || {}

    if (this.isDemo) {
      return this.getDemoActiveTrips()
    }

    const trips = await prisma.park_trip.findMany({
      where: {
        tenantId: this.tenantId,
        status: { in: ['SCHEDULED', 'BOARDING', 'READY_TO_DEPART'] }
      },
      orderBy: [
        { status: 'asc' },
        { scheduledDeparture: 'asc' }
      ],
      take: limit,
      include: {
        driver: { select: { fullName: true } },
        vehicle: { select: { plateNumber: true } }
      }
    })

    const routeIds = [...new Set(trips.map(t => t.routeId))]
    const routes = await prisma.park_route.findMany({
      where: { id: { in: routeIds } },
      select: { id: true, parkId: true, name: true, origin: true, destination: true }
    })
    const routeMap = new Map(routes.map(r => [r.id, r]))

    return trips.map(trip => {
      const route = routeMap.get(trip.routeId)
      return {
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        parkId: route?.parkId || 'unknown',
        parkName: route ? this.formatParkName(route.parkId) : 'Unknown Park',
        routeName: route?.name || 'Unknown Route',
        origin: route?.origin || '',
        destination: route?.destination || '',
        status: trip.status,
        departureMode: trip.departureMode,
        scheduledDeparture: trip.scheduledDeparture,
        totalSeats: trip.totalSeats,
        bookedSeats: trip.bookedSeats,
        availableSeats: trip.availableSeats,
        currentPrice: Number(trip.currentPrice),
        driverName: trip.driver?.fullName || null,
        vehiclePlate: trip.vehicle?.plateNumber || null
      }
    })
  }

  async getTicketSalesSummary(dateRange?: { start: Date; end: Date }): Promise<TicketSalesSummary> {
    const startOfDay = dateRange?.start || new Date(new Date().setHours(0, 0, 0, 0))
    const endOfDay = dateRange?.end || new Date(new Date().setHours(23, 59, 59, 999))

    if (this.isDemo) {
      return this.getDemoTicketSalesSummary()
    }

    const tickets = await prisma.park_ticket.findMany({
      where: {
        tenantId: this.tenantId,
        soldAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' }
      },
      include: {
        trip: {
          select: { routeId: true }
        }
      }
    })

    const routeIds = [...new Set(tickets.map(t => t.trip.routeId))]
    const routes = await prisma.park_route.findMany({
      where: { id: { in: routeIds } },
      select: { id: true, parkId: true }
    })
    const routeToPark = new Map(routes.map(r => [r.id, r.parkId]))

    let totalRevenue = 0
    let cashRevenue = 0
    let cardRevenue = 0
    let transferRevenue = 0
    const parkTotals = new Map<string, { tickets: number; revenue: number }>()
    const methodTotals = new Map<string, { count: number; amount: number }>()

    for (const ticket of tickets) {
      const amount = Number(ticket.totalPaid)
      totalRevenue += amount

      if (ticket.paymentMethod === 'CASH') cashRevenue += amount
      else if (ticket.paymentMethod === 'POS_CARD') cardRevenue += amount
      else if (ticket.paymentMethod === 'BANK_TRANSFER') transferRevenue += amount

      const parkId = routeToPark.get(ticket.trip.routeId) || 'unknown'
      const parkData = parkTotals.get(parkId) || { tickets: 0, revenue: 0 }
      parkData.tickets += 1
      parkData.revenue += amount
      parkTotals.set(parkId, parkData)

      const methodData = methodTotals.get(ticket.paymentMethod) || { count: 0, amount: 0 }
      methodData.count += 1
      methodData.amount += amount
      methodTotals.set(ticket.paymentMethod, methodData)
    }

    const ticketsByPark = Array.from(parkTotals.entries()).map(([parkId, data]) => ({
      parkId,
      parkName: this.formatParkName(parkId),
      ticketCount: data.tickets,
      revenue: data.revenue
    }))

    const ticketsByPaymentMethod = Array.from(methodTotals.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount
    }))

    return {
      totalTicketsSold: tickets.length,
      totalRevenue,
      cashRevenue,
      cardRevenue,
      transferRevenue,
      averageTicketPrice: tickets.length > 0 ? totalRevenue / tickets.length : 0,
      ticketsByPark,
      ticketsByPaymentMethod
    }
  }

  async getAgentActivitySummary(): Promise<AgentActivitySummary> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    if (this.isDemo) {
      return this.getDemoAgentActivitySummary()
    }

    const tickets = await prisma.park_ticket.findMany({
      where: {
        tenantId: this.tenantId,
        soldAt: { gte: startOfDay },
        status: { not: 'CANCELLED' },
        soldById: { not: null }
      },
      include: {
        trip: { select: { routeId: true } }
      }
    })

    const routeIds = [...new Set(tickets.map(t => t.trip.routeId))]
    const routes = await prisma.park_route.findMany({
      where: { id: { in: routeIds } },
      select: { id: true, parkId: true }
    })
    const routeToPark = new Map(routes.map(r => [r.id, r.parkId]))

    const agentMap = new Map<string, {
      agentName: string
      parkId: string
      ticketsSold: number
      revenue: number
      lastActivityAt: Date | null
    }>()

    for (const ticket of tickets) {
      if (!ticket.soldById) continue

      const existing = agentMap.get(ticket.soldById)
      const parkId = routeToPark.get(ticket.trip.routeId) || 'unknown'
      const amount = Number(ticket.totalPaid)

      if (existing) {
        existing.ticketsSold += 1
        existing.revenue += amount
        if (!existing.lastActivityAt || ticket.soldAt > existing.lastActivityAt) {
          existing.lastActivityAt = ticket.soldAt
        }
      } else {
        agentMap.set(ticket.soldById, {
          agentName: ticket.soldByName || 'Unknown Agent',
          parkId,
          ticketsSold: 1,
          revenue: amount,
          lastActivityAt: ticket.soldAt
        })
      }
    }

    const agentPerformance = Array.from(agentMap.entries())
      .map(([agentId, data]) => ({
        agentId,
        agentName: data.agentName,
        parkId: data.parkId,
        parkName: this.formatParkName(data.parkId),
        ticketsSold: data.ticketsSold,
        revenue: data.revenue,
        lastActivityAt: data.lastActivityAt
      }))
      .sort((a, b) => b.ticketsSold - a.ticketsSold)

    return {
      activeAgents: agentPerformance.length,
      agentPerformance
    }
  }

  async getOperatorDashboard(): Promise<OperatorDashboardData> {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const [parks, activeTrips, ticketSales, agentActivity] = await Promise.all([
      this.getParksSummary(),
      this.getActiveTrips({ limit: 50 }),
      this.getTicketSalesSummary({ start: startOfDay, end: endOfDay }),
      this.getAgentActivitySummary()
    ])

    return {
      asOfTime: now,
      dateRange: { start: startOfDay, end: endOfDay },
      parks,
      activeTrips,
      ticketSales,
      agentActivity,
      isDemo: this.isDemo
    }
  }

  private getDemoParks(): Array<{ parkId: string; parkName: string }> {
    return [
      { parkId: 'jibowu-park', parkName: 'Jibowu Motor Park' },
      { parkId: 'ojota-park', parkName: 'Ojota Motor Park' },
      { parkId: 'iyana-oworo-park', parkName: 'Iyana Oworo Park' }
    ]
  }

  private getDemoParksSummary(): ParkSummary[] {
    return [
      {
        parkId: 'jibowu-park',
        parkName: 'Jibowu Motor Park',
        activeTrips: 8,
        boardingTrips: 3,
        departedToday: 12,
        completedToday: 10,
        cancelledToday: 1
      },
      {
        parkId: 'ojota-park',
        parkName: 'Ojota Motor Park',
        activeTrips: 5,
        boardingTrips: 2,
        departedToday: 8,
        completedToday: 6,
        cancelledToday: 0
      },
      {
        parkId: 'iyana-oworo-park',
        parkName: 'Iyana Oworo Park',
        activeTrips: 3,
        boardingTrips: 1,
        departedToday: 5,
        completedToday: 4,
        cancelledToday: 0
      }
    ]
  }

  private getDemoActiveTrips(): TripOverview[] {
    const now = new Date()
    return [
      {
        tripId: 'demo-trip-001',
        tripNumber: 'TRIP-20260115-0001',
        parkId: 'jibowu-park',
        parkName: 'Jibowu Motor Park',
        routeName: 'Lagos → Ibadan',
        origin: 'Lagos',
        destination: 'Ibadan',
        status: 'BOARDING',
        departureMode: 'WHEN_FULL',
        scheduledDeparture: new Date(now.getTime() + 30 * 60 * 1000),
        totalSeats: 18,
        bookedSeats: 14,
        availableSeats: 4,
        currentPrice: 5500,
        driverName: 'Adebayo Okonkwo',
        vehiclePlate: 'LND-234-XY'
      },
      {
        tripId: 'demo-trip-002',
        tripNumber: 'TRIP-20260115-0002',
        parkId: 'jibowu-park',
        parkName: 'Jibowu Motor Park',
        routeName: 'Lagos → Abuja',
        origin: 'Lagos',
        destination: 'Abuja',
        status: 'BOARDING',
        departureMode: 'SCHEDULED',
        scheduledDeparture: new Date(now.getTime() + 45 * 60 * 1000),
        totalSeats: 48,
        bookedSeats: 32,
        availableSeats: 16,
        currentPrice: 18500,
        driverName: 'Emeka Nwachukwu',
        vehiclePlate: 'ABC-789-GH'
      },
      {
        tripId: 'demo-trip-003',
        tripNumber: 'TRIP-20260115-0003',
        parkId: 'ojota-park',
        parkName: 'Ojota Motor Park',
        routeName: 'Lagos → Benin',
        origin: 'Lagos',
        destination: 'Benin City',
        status: 'READY_TO_DEPART',
        departureMode: 'WHEN_FULL',
        scheduledDeparture: null,
        totalSeats: 18,
        bookedSeats: 18,
        availableSeats: 0,
        currentPrice: 8000,
        driverName: 'Chukwuma Eze',
        vehiclePlate: 'KJA-567-LM'
      },
      {
        tripId: 'demo-trip-004',
        tripNumber: 'TRIP-20260115-0004',
        parkId: 'ojota-park',
        parkName: 'Ojota Motor Park',
        routeName: 'Lagos → Owerri',
        origin: 'Lagos',
        destination: 'Owerri',
        status: 'SCHEDULED',
        departureMode: 'HYBRID',
        scheduledDeparture: new Date(now.getTime() + 90 * 60 * 1000),
        totalSeats: 18,
        bookedSeats: 6,
        availableSeats: 12,
        currentPrice: 12000,
        driverName: null,
        vehiclePlate: null
      },
      {
        tripId: 'demo-trip-005',
        tripNumber: 'TRIP-20260115-0005',
        parkId: 'iyana-oworo-park',
        parkName: 'Iyana Oworo Park',
        routeName: 'Lagos → Ilorin',
        origin: 'Lagos',
        destination: 'Ilorin',
        status: 'BOARDING',
        departureMode: 'WHEN_FULL',
        scheduledDeparture: null,
        totalSeats: 14,
        bookedSeats: 10,
        availableSeats: 4,
        currentPrice: 7500,
        driverName: 'Ibrahim Musa',
        vehiclePlate: 'APP-123-RS'
      }
    ]
  }

  private getDemoTicketSalesSummary(): TicketSalesSummary {
    return {
      totalTicketsSold: 156,
      totalRevenue: 1425000,
      cashRevenue: 892500,
      cardRevenue: 285000,
      transferRevenue: 247500,
      averageTicketPrice: 9135,
      ticketsByPark: [
        { parkId: 'jibowu-park', parkName: 'Jibowu Motor Park', ticketCount: 78, revenue: 712500 },
        { parkId: 'ojota-park', parkName: 'Ojota Motor Park', ticketCount: 52, revenue: 475000 },
        { parkId: 'iyana-oworo-park', parkName: 'Iyana Oworo Park', ticketCount: 26, revenue: 237500 }
      ],
      ticketsByPaymentMethod: [
        { method: 'CASH', count: 98, amount: 892500 },
        { method: 'POS_CARD', count: 31, amount: 285000 },
        { method: 'BANK_TRANSFER', count: 27, amount: 247500 }
      ]
    }
  }

  private getDemoAgentActivitySummary(): AgentActivitySummary {
    const now = new Date()
    return {
      activeAgents: 8,
      agentPerformance: [
        {
          agentId: 'demo-agent-001',
          agentName: 'Funke Adeyemi',
          parkId: 'jibowu-park',
          parkName: 'Jibowu Motor Park',
          ticketsSold: 28,
          revenue: 256000,
          lastActivityAt: new Date(now.getTime() - 5 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-002',
          agentName: 'Chibueze Okafor',
          parkId: 'jibowu-park',
          parkName: 'Jibowu Motor Park',
          ticketsSold: 24,
          revenue: 220000,
          lastActivityAt: new Date(now.getTime() - 12 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-003',
          agentName: 'Amaka Nnadi',
          parkId: 'ojota-park',
          parkName: 'Ojota Motor Park',
          ticketsSold: 22,
          revenue: 198000,
          lastActivityAt: new Date(now.getTime() - 8 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-004',
          agentName: 'Tunde Bakare',
          parkId: 'ojota-park',
          parkName: 'Ojota Motor Park',
          ticketsSold: 18,
          revenue: 165000,
          lastActivityAt: new Date(now.getTime() - 20 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-005',
          agentName: 'Blessing Ojo',
          parkId: 'jibowu-park',
          parkName: 'Jibowu Motor Park',
          ticketsSold: 16,
          revenue: 148000,
          lastActivityAt: new Date(now.getTime() - 15 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-006',
          agentName: 'Yusuf Abdullahi',
          parkId: 'iyana-oworo-park',
          parkName: 'Iyana Oworo Park',
          ticketsSold: 14,
          revenue: 105000,
          lastActivityAt: new Date(now.getTime() - 25 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-007',
          agentName: 'Grace Nwosu',
          parkId: 'iyana-oworo-park',
          parkName: 'Iyana Oworo Park',
          ticketsSold: 12,
          revenue: 90000,
          lastActivityAt: new Date(now.getTime() - 30 * 60 * 1000)
        },
        {
          agentId: 'demo-agent-008',
          agentName: 'Segun Afolabi',
          parkId: 'ojota-park',
          parkName: 'Ojota Motor Park',
          ticketsSold: 10,
          revenue: 91500,
          lastActivityAt: new Date(now.getTime() - 45 * 60 * 1000)
        }
      ]
    }
  }
}

export function createMultiParkOperatorService(tenantId: string): MultiParkOperatorService {
  return new MultiParkOperatorService(tenantId)
}
