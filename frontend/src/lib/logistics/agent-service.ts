/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Agent Service - Delivery agent (rider) management
 * 
 * OWNERSHIP: This module owns delivery agents.
 * DOES NOT OWN: Users/Auth (agents are NOT system users by default), Payroll.
 */

import { prisma } from '@/lib/prisma'
import { LogisticsAgentStatus, LogisticsAgentAvailability, LogisticsAgentType, Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAgentInput {
  firstName: string
  lastName: string
  phone: string
  email?: string
  photoUrl?: string
  agentType?: LogisticsAgentType
  vehicleType?: string
  vehiclePlate?: string
  vehicleModel?: string
  defaultZoneId?: string
  assignedZoneIds?: string[]
  employeeId?: string
  hireDate?: Date
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  metadata?: object
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  status?: LogisticsAgentStatus
  availability?: LogisticsAgentAvailability
}

export interface AgentLocationUpdate {
  latitude: number
  longitude: number
}

export interface AgentPerformanceMetrics {
  agentId: string
  totalDeliveries: number
  completedDeliveries: number
  failedDeliveries: number
  successRate: number
  averageRating: number | null
  totalRatings: number
  avgDeliveryTimeMin: number | null
  deliveriesToday: number
  deliveriesThisWeek: number
  deliveriesThisMonth: number
}

// ============================================================================
// AGENT SERVICE
// ============================================================================

export class AgentService {
  /**
   * Create a delivery agent
   * NOTE: Agents are NOT system users by default
   */
  static async createAgent(tenantId: string, input: CreateAgentInput) {
    return prisma.logistics_delivery_agents.create({
      data: {
        tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        photoUrl: input.photoUrl,
        agentType: input.agentType || 'IN_HOUSE',
        vehicleType: input.vehicleType,
        vehiclePlate: input.vehiclePlate,
        vehicleModel: input.vehicleModel,
        defaultZoneId: input.defaultZoneId,
        assignedZoneIds: input.assignedZoneIds || [],
        employeeId: input.employeeId,
        hireDate: input.hireDate,
        bankName: input.bankName,
        bankAccount: input.bankAccount,
        bankAccountName: input.bankAccountName,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Get all agents for a tenant
   */
  static async getAgents(
    tenantId: string,
    options: {
      status?: LogisticsAgentStatus
      availability?: LogisticsAgentAvailability
      agentType?: LogisticsAgentType
      zoneId?: string
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.logistics_delivery_agentsWhereInput = { tenantId }
    
    if (options.status) where.status = options.status
    if (options.availability) where.availability = options.availability
    if (options.agentType) where.agentType = options.agentType
    if (options.zoneId) {
      where.OR = [
        { defaultZoneId: options.zoneId },
        { assignedZoneIds: { has: options.zoneId } },
      ]
    }
    if (options.search) {
      where.OR = [
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search } },
      ]
    }

    const [agents, total] = await Promise.all([
      prisma.logistics_delivery_agents.findMany({
        where,
        include: {
          _count: { select: { logistics_delivery_assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.logistics_delivery_agents.count({ where }),
    ])

    return { agents, total }
  }

  /**
   * Get agent by ID
   */
  static async getAgentById(tenantId: string, agentId: string) {
    return prisma.logistics_delivery_agents.findFirst({
      where: { id: agentId, tenantId },
      include: {
        assignments: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { logistics_delivery_assignments: true } },
      },
    })
  }

  /**
   * Get agent by phone
   */
  static async getAgentByPhone(tenantId: string, phone: string) {
    return prisma.logistics_delivery_agents.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    })
  }

  /**
   * Update an agent
   */
  static async updateAgent(tenantId: string, agentId: string, input: UpdateAgentInput) {
    return prisma.logistics_delivery_agents.update({
      where: { id: agentId },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.phone && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
        ...(input.agentType && { agentType: input.agentType }),
        ...(input.vehicleType !== undefined && { vehicleType: input.vehicleType }),
        ...(input.vehiclePlate !== undefined && { vehiclePlate: input.vehiclePlate }),
        ...(input.vehicleModel !== undefined && { vehicleModel: input.vehicleModel }),
        ...(input.defaultZoneId !== undefined && { defaultZoneId: input.defaultZoneId }),
        ...(input.assignedZoneIds && { assignedZoneIds: input.assignedZoneIds }),
        ...(input.status && { status: input.status }),
        ...(input.availability && { availability: input.availability }),
        ...(input.employeeId !== undefined && { employeeId: input.employeeId }),
        ...(input.hireDate !== undefined && { hireDate: input.hireDate }),
        ...(input.bankName !== undefined && { bankName: input.bankName }),
        ...(input.bankAccount !== undefined && { bankAccount: input.bankAccount }),
        ...(input.bankAccountName !== undefined && { bankAccountName: input.bankAccountName }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
    })
  }

  /**
   * Update agent availability
   */
  static async updateAvailability(
    tenantId: string,
    agentId: string,
    availability: LogisticsAgentAvailability
  ) {
    return prisma.logistics_delivery_agents.update({
      where: { id: agentId },
      data: { availability },
    })
  }

  /**
   * Update agent location
   */
  static async updateLocation(
    tenantId: string,
    agentId: string,
    location: AgentLocationUpdate
  ) {
    return prisma.logistics_delivery_agents.update({
      where: { id: agentId },
      data: {
        lastLatitude: location.latitude,
        lastLongitude: location.longitude,
        lastLocationAt: new Date(),
      },
    })
  }

  /**
   * Terminate agent
   */
  static async terminateAgent(tenantId: string, agentId: string) {
    // Check for active deliveries
    const activeDeliveries = await prisma.logistics_delivery_assignments.count({
      where: {
        agentId,
        status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'] },
      },
    })

    if (activeDeliveries > 0) {
      throw new Error(`Cannot terminate agent with ${activeDeliveries} active deliveries`)
    }

    return prisma.logistics_delivery_agents.update({
      where: { id: agentId },
      data: {
        status: 'TERMINATED',
        availability: 'OFFLINE',
        terminatedAt: new Date(),
      },
    })
  }

  /**
   * Get available agents for a zone
   */
  static async getAvailableAgents(
    tenantId: string,
    options: {
      zoneId?: string
      excludeAgentIds?: string[]
      maxConcurrentDeliveries?: number
    } = {}
  ) {
    const maxDeliveries = options.maxConcurrentDeliveries || 5

    // Get agents
    const agents = await prisma.logistics_delivery_agents.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        availability: 'AVAILABLE',
        ...(options.zoneId && {
          OR: [
            { defaultZoneId: options.zoneId },
            { assignedZoneIds: { has: options.zoneId } },
          ],
        }),
        ...(options.excludeAgentIds?.length && {
          id: { notIn: options.excludeAgentIds },
        }),
      },
      include: {
        _count: {
          select: {
            assignments: {
              where: {
                status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'] },
              },
            },
          },
        },
      },
    })

    // Filter by max concurrent deliveries
    return agents.filter(agent => agent._count.assignments < maxDeliveries)
  }

  /**
   * Get agent performance metrics
   */
  static async getAgentPerformance(tenantId: string, agentId: string): Promise<AgentPerformanceMetrics | null> {
    const agent = await prisma.logistics_delivery_agents.findFirst({
      where: { id: agentId, tenantId },
    })

    if (!agent) return null

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [deliveriesToday, deliveriesThisWeek, deliveriesThisMonth, avgDuration] = await Promise.all([
      prisma.logistics_delivery_assignments.count({
        where: { agentId, status: 'DELIVERED', actualDeliveryAt: { gte: startOfDay } },
      }),
      prisma.logistics_delivery_assignments.count({
        where: { agentId, status: 'DELIVERED', actualDeliveryAt: { gte: startOfWeek } },
      }),
      prisma.logistics_delivery_assignments.count({
        where: { agentId, status: 'DELIVERED', actualDeliveryAt: { gte: startOfMonth } },
      }),
      prisma.logistics_delivery_assignments.aggregate({
        where: { agentId, status: 'DELIVERED', actualDurationMin: { not: null } },
        _avg: { actualDurationMin: true },
      }),
    ])

    const successRate = agent.totalDeliveries > 0
      ? (agent.completedDeliveries / agent.totalDeliveries) * 100
      : 0

    return {
      agentId,
      totalDeliveries: agent.totalDeliveries,
      completedDeliveries: agent.completedDeliveries,
      failedDeliveries: agent.failedDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      averageRating: agent.averageRating ? Number(agent.averageRating) : null,
      totalRatings: agent.totalRatings,
      avgDeliveryTimeMin: avgDuration._avg.actualDurationMin,
      deliveriesToday,
      deliveriesThisWeek,
      deliveriesThisMonth,
    }
  }

  /**
   * Update agent rating (after customer rates delivery)
   */
  static async updateAgentRating(agentId: string, newRating: number) {
    const agent = await prisma.logistics_delivery_agents.findUnique({
      where: { id: agentId },
    })

    if (!agent) throw new Error('Agent not found')

    // Calculate new average
    const currentTotal = (Number(agent.averageRating) || 0) * agent.totalRatings
    const newTotal = currentTotal + newRating
    const newAverage = newTotal / (agent.totalRatings + 1)

    return prisma.logistics_delivery_agents.update({
      where: { id: agentId },
      data: {
        averageRating: Math.round(newAverage * 100) / 100,
        totalRatings: { increment: 1 },
      },
    })
  }

  /**
   * Increment delivery counts
   */
  static async incrementDeliveryCount(agentId: string, type: 'completed' | 'failed') {
    return prisma.logistics_delivery_agents.update({
      where: { id: agentId },
      data: {
        totalDeliveries: { increment: 1 },
        ...(type === 'completed' && { completedDeliveries: { increment: 1 } }),
        ...(type === 'failed' && { failedDeliveries: { increment: 1 } }),
      },
    })
  }
}
