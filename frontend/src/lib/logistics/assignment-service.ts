/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Assignment Service - Delivery assignment and workflow management
 * 
 * OWNERSHIP: This module owns delivery assignments and status tracking.
 * DOES NOT OWN: Orders (read-only reference), Payments (no financial transactions).
 */

import { prisma } from '@/lib/prisma'
import { LogisticsDeliveryStatus, LogisticsDeliveryPriority, Prisma } from '@prisma/client'
import { AgentService } from './agent-service'
import { EventService, LogisticsEvent } from './event-service'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAssignmentInput {
  // Order reference (READ-ONLY - does not duplicate orders)
  orderId: string
  orderType: 'POS_SALE' | 'SVM_ORDER' | 'MVM_ORDER'
  orderNumber?: string
  
  // Customer reference (READ-ONLY)
  customerId?: string
  customerName?: string
  customerPhone?: string
  
  // Delivery details
  zoneId?: string
  deliveryAddress?: {
    line1: string
    line2?: string
    city?: string
    state?: string
    lga?: string
    postalCode?: string
    country?: string
    landmark?: string
  }
  deliveryLatitude?: number
  deliveryLongitude?: number
  
  // Pickup details
  pickupLocationId?: string
  pickupAddress?: object
  pickupLatitude?: number
  pickupLongitude?: number
  
  // Scheduling
  priority?: LogisticsDeliveryPriority
  scheduledPickupAt?: Date
  scheduledDeliveryAt?: Date
  deliveryWindowStart?: Date
  deliveryWindowEnd?: Date
  
  // Instructions
  specialInstructions?: string
  contactOnArrival?: boolean
  
  // Package info
  packageCount?: number
  totalWeight?: number
  packageDetails?: object
  
  // Pricing (ADVISORY ONLY)
  estimatedFee?: number
  currency?: string
  feeCalculation?: object
  
  // Distance/time estimates
  estimatedDistanceKm?: number
  estimatedDurationMin?: number
  
  // Assignment
  agentId?: string
  autoAssigned?: boolean
  assignedBy?: string
  
  metadata?: object
}

export interface UpdateAssignmentInput {
  agentId?: string
  zoneId?: string
  priority?: LogisticsDeliveryPriority
  scheduledPickupAt?: Date
  scheduledDeliveryAt?: Date
  deliveryWindowStart?: Date
  deliveryWindowEnd?: Date
  specialInstructions?: string
  estimatedFee?: number
  metadata?: object
}

export interface StatusUpdateInput {
  status: LogisticsDeliveryStatus
  latitude?: number
  longitude?: number
  address?: string
  notes?: string
  changedBy?: string
  changedByType?: 'AGENT' | 'ADMIN' | 'SYSTEM' | 'CUSTOMER'
  offlineId?: string
  recordedAt?: Date
}

export interface RatingInput {
  rating: number // 1-5
  review?: string
}

// Status transition rules
const STATUS_TRANSITIONS: Record<LogisticsDeliveryStatus, LogisticsDeliveryStatus[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'PENDING', 'CANCELLED'],
  ACCEPTED: ['PICKING_UP', 'ASSIGNED', 'CANCELLED'],
  PICKING_UP: ['PICKED_UP', 'FAILED', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'RETURNED', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVING', 'DELIVERED', 'FAILED'],
  ARRIVING: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['PENDING', 'RETURNED'],
  RETURNED: [],
  CANCELLED: [],
}

// ============================================================================
// ASSIGNMENT SERVICE
// ============================================================================

export class AssignmentService {
  /**
   * Create a delivery assignment
   * NOTE: This does NOT duplicate orders - only references by orderId
   */
  static async createAssignment(tenantId: string, input: CreateAssignmentInput) {
    // Check for existing assignment for this order
    const existing = await prisma.logistics_delivery_assignments.findUnique({
      where: {
        orderId_orderType: { orderId: input.orderId, orderType: input.orderType },
      },
    })

    if (existing) {
      throw new Error('Delivery assignment already exists for this order')
    }

    const assignment = await prisma.logistics_delivery_assignments.create({
      data: {
        tenantId,
        orderId: input.orderId,
        orderType: input.orderType,
        orderNumber: input.orderNumber,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        zoneId: input.zoneId,
        deliveryAddress: input.deliveryAddress as Prisma.InputJsonValue,
        deliveryLatitude: input.deliveryLatitude,
        deliveryLongitude: input.deliveryLongitude,
        pickupLocationId: input.pickupLocationId,
        pickupAddress: input.pickupAddress as Prisma.InputJsonValue,
        pickupLatitude: input.pickupLatitude,
        pickupLongitude: input.pickupLongitude,
        priority: input.priority || 'STANDARD',
        scheduledPickupAt: input.scheduledPickupAt,
        scheduledDeliveryAt: input.scheduledDeliveryAt,
        deliveryWindowStart: input.deliveryWindowStart,
        deliveryWindowEnd: input.deliveryWindowEnd,
        specialInstructions: input.specialInstructions,
        contactOnArrival: input.contactOnArrival ?? true,
        packageCount: input.packageCount || 1,
        totalWeight: input.totalWeight,
        packageDetails: input.packageDetails as Prisma.InputJsonValue,
        estimatedFee: input.estimatedFee,
        currency: input.currency || 'NGN',
        feeCalculation: input.feeCalculation as Prisma.InputJsonValue,
        estimatedDistanceKm: input.estimatedDistanceKm,
        estimatedDurationMin: input.estimatedDurationMin,
        agentId: input.agentId,
        autoAssigned: input.autoAssigned || false,
        assignedBy: input.assignedBy,
        assignedAt: input.agentId ? new Date() : undefined,
        status: input.agentId ? 'ASSIGNED' : 'PENDING',
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      include: {
        agent: true,
        zone: true,
      },
    })

    // Create initial status history
    await this.addStatusHistory(assignment.id, {
      status: assignment.status,
      changedBy: input.assignedBy,
      changedByType: 'SYSTEM',
      notes: 'Assignment created',
    })

    // Emit event
    if (input.agentId) {
      await EventService.emitEvent(tenantId, {
        eventType: 'DELIVERY_ASSIGNED',
        payload: {
          assignmentId: assignment.id,
          orderId: input.orderId,
          orderType: input.orderType,
          agentId: input.agentId,
          customerId: input.customerId,
        },
      })
    }

    return assignment
  }

  /**
   * Get assignments for a tenant
   */
  static async getAssignments(
    tenantId: string,
    options: {
      status?: LogisticsDeliveryStatus | LogisticsDeliveryStatus[]
      agentId?: string
      zoneId?: string
      priority?: LogisticsDeliveryPriority
      dateFrom?: Date
      dateTo?: Date
      orderId?: string
      customerId?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.LogisticsDeliveryAssignmentWhereInput = { tenantId }

    if (options.status) {
      where.status = Array.isArray(options.status) ? { in: options.status } : options.status
    }
    if (options.agentId) where.agentId = options.agentId
    if (options.zoneId) where.zoneId = options.zoneId
    if (options.priority) where.priority = options.priority
    if (options.orderId) where.orderId = options.orderId
    if (options.customerId) where.customerId = options.customerId
    if (options.dateFrom || options.dateTo) {
      where.createdAt = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      }
    }

    const [assignments, total] = await Promise.all([
      prisma.logistics_delivery_assignments.findMany({
        where,
        include: {
          agent: { select: { id: true, firstName: true, lastName: true, phone: true } },
          zone: { select: { id: true, name: true, city: true } },
          _count: { select: { statusHistory: true, proofs: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.logistics_delivery_assignments.count({ where }),
    ])

    return { assignments, total }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(tenantId: string, assignmentId: string) {
    return prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId },
      include: {
        agent: true,
        zone: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        proofs: { orderBy: { capturedAt: 'desc' } },
      },
    })
  }

  /**
   * Get assignment by order
   */
  static async getAssignmentByOrder(orderId: string, orderType: string) {
    return prisma.logistics_delivery_assignments.findUnique({
      where: {
        orderId_orderType: { orderId, orderType },
      },
      include: {
        agent: true,
        zone: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })
  }

  /**
   * Update assignment
   */
  static async updateAssignment(tenantId: string, assignmentId: string, input: UpdateAssignmentInput) {
    return prisma.logistics_delivery_assignments.update({
      where: { id: assignmentId },
      data: {
        ...(input.agentId !== undefined && { 
          agentId: input.agentId,
          ...(input.agentId && { assignedAt: new Date() }),
        }),
        ...(input.zoneId !== undefined && { zoneId: input.zoneId }),
        ...(input.priority && { priority: input.priority }),
        ...(input.scheduledPickupAt !== undefined && { scheduledPickupAt: input.scheduledPickupAt }),
        ...(input.scheduledDeliveryAt !== undefined && { scheduledDeliveryAt: input.scheduledDeliveryAt }),
        ...(input.deliveryWindowStart !== undefined && { deliveryWindowStart: input.deliveryWindowStart }),
        ...(input.deliveryWindowEnd !== undefined && { deliveryWindowEnd: input.deliveryWindowEnd }),
        ...(input.specialInstructions !== undefined && { specialInstructions: input.specialInstructions }),
        ...(input.estimatedFee !== undefined && { estimatedFee: input.estimatedFee }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
      include: {
        agent: true,
        zone: true,
      },
    })
  }

  /**
   * Assign agent to delivery
   */
  static async assignAgent(
    tenantId: string,
    assignmentId: string,
    agentId: string,
    assignedBy: string,
    autoAssigned: boolean = false
  ) {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId },
    })

    if (!assignment) throw new Error('Assignment not found')
    if (assignment.status !== 'PENDING' && assignment.status !== 'ASSIGNED') {
      throw new Error(`Cannot assign agent to delivery in ${assignment.status} status`)
    }

    const agent = await prisma.logistics_delivery_agents.findFirst({
      where: { id: agentId, tenantId, status: 'ACTIVE' },
    })

    if (!agent) throw new Error('Agent not found or not active')

    const updated = await prisma.logistics_delivery_assignments.update({
      where: { id: assignmentId },
      data: {
        agentId,
        assignedBy,
        assignedAt: new Date(),
        autoAssigned,
        status: 'ASSIGNED',
      },
      include: { agent: true },
    })

    // Record status change
    await this.addStatusHistory(assignmentId, {
      status: 'ASSIGNED',
      changedBy: assignedBy,
      changedByType: autoAssigned ? 'SYSTEM' : 'ADMIN',
      notes: `Assigned to ${agent.firstName} ${agent.lastName}`,
    })

    // Update agent availability
    await AgentService.updateAvailability(tenantId, agentId, 'ON_DELIVERY')

    // Emit event
    await EventService.emitEvent(tenantId, {
      eventType: 'DELIVERY_ASSIGNED',
      payload: {
        assignmentId,
        orderId: assignment.orderId,
        orderType: assignment.orderType,
        agentId,
        customerId: assignment.customerId,
      },
    })

    return updated
  }

  /**
   * Update delivery status
   */
  static async updateStatus(
    tenantId: string,
    assignmentId: string,
    input: StatusUpdateInput
  ) {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId },
    })

    if (!assignment) throw new Error('Assignment not found')

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[assignment.status]
    if (!allowedTransitions.includes(input.status)) {
      throw new Error(`Invalid status transition from ${assignment.status} to ${input.status}`)
    }

    // Prepare update data based on status
    const updateData: Prisma.LogisticsDeliveryAssignmentUpdateInput = {
      status: input.status,
    }

    switch (input.status) {
      case 'PICKED_UP':
        updateData.actualPickupAt = input.recordedAt || new Date()
        break
      case 'DELIVERED':
        updateData.actualDeliveryAt = input.recordedAt || new Date()
        if (assignment.actualPickupAt) {
          const pickupTime = assignment.actualPickupAt.getTime()
          const deliveryTime = (input.recordedAt || new Date()).getTime()
          updateData.actualDurationMin = Math.round((deliveryTime - pickupTime) / 60000)
        }
        break
      case 'FAILED':
        updateData.failedAttempts = { increment: 1 }
        updateData.failureReason = input.notes
        break
    }

    const updated = await prisma.logistics_delivery_assignments.update({
      where: { id: assignmentId },
      data: updateData,
      include: { agent: true },
    })

    // Record status history
    await this.addStatusHistory(assignmentId, {
      status: input.status,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      notes: input.notes,
      changedBy: input.changedBy,
      changedByType: input.changedByType,
      offlineId: input.offlineId,
      recordedAt: input.recordedAt,
    })

    // Handle agent updates
    if (assignment.agentId) {
      if (input.status === 'DELIVERED') {
        await AgentService.incrementDeliveryCount(assignment.agentId, 'completed')
        await AgentService.updateAvailability(tenantId, assignment.agentId, 'AVAILABLE')
      } else if (input.status === 'FAILED') {
        await AgentService.incrementDeliveryCount(assignment.agentId, 'failed')
        if (updated.failedAttempts >= updated.maxAttempts) {
          await AgentService.updateAvailability(tenantId, assignment.agentId, 'AVAILABLE')
        }
      } else if (input.status === 'CANCELLED' || input.status === 'RETURNED') {
        await AgentService.updateAvailability(tenantId, assignment.agentId, 'AVAILABLE')
      }
    }

    // Emit appropriate event
    const eventMap: Record<string, LogisticsEvent['eventType']> = {
      PICKED_UP: 'DELIVERY_PICKED_UP',
      IN_TRANSIT: 'DELIVERY_IN_TRANSIT',
      DELIVERED: 'DELIVERY_COMPLETED',
      FAILED: 'DELIVERY_FAILED',
    }

    if (eventMap[input.status]) {
      await EventService.emitEvent(tenantId, {
        eventType: eventMap[input.status],
        payload: {
          assignmentId,
          orderId: assignment.orderId,
          orderType: assignment.orderType,
          agentId: assignment.agentId,
          customerId: assignment.customerId,
          ...(input.status === 'FAILED' && { reason: input.notes }),
        },
      })
    }

    return updated
  }

  /**
   * Add status history entry
   */
  private static async addStatusHistory(
    assignmentId: string,
    input: {
      status: LogisticsDeliveryStatus
      latitude?: number
      longitude?: number
      address?: string
      notes?: string
      changedBy?: string
      changedByType?: string
      offlineId?: string
      recordedAt?: Date
    }
  ) {
    // Get current status for fromStatus
    const assignment = await prisma.logistics_delivery_assignments.findUnique({
      where: { id: assignmentId },
      select: { status: true },
    })

    return prisma.logisticsDeliveryStatusHistory.create({
      data: {
        assignmentId,
        fromStatus: assignment?.status !== input.status ? assignment?.status : null,
        toStatus: input.status,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        notes: input.notes,
        changedBy: input.changedBy,
        changedByType: input.changedByType,
        offlineId: input.offlineId,
        recordedAt: input.recordedAt || new Date(),
        syncedAt: input.offlineId ? new Date() : null,
      },
    })
  }

  /**
   * Rate delivery
   */
  static async rateDelivery(
    tenantId: string,
    assignmentId: string,
    input: RatingInput
  ) {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId, status: 'DELIVERED' },
    })

    if (!assignment) throw new Error('Delivered assignment not found')
    if (assignment.customerRating) throw new Error('Delivery already rated')

    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const updated = await prisma.logistics_delivery_assignments.update({
      where: { id: assignmentId },
      data: {
        customerRating: input.rating,
        customerReview: input.review,
        ratedAt: new Date(),
      },
    })

    // Update agent rating
    if (assignment.agentId) {
      await AgentService.updateAgentRating(assignment.agentId, input.rating)
    }

    return updated
  }

  /**
   * Cancel assignment
   */
  static async cancelAssignment(
    tenantId: string,
    assignmentId: string,
    reason: string,
    cancelledBy: string
  ) {
    return this.updateStatus(tenantId, assignmentId, {
      status: 'CANCELLED',
      notes: reason,
      changedBy: cancelledBy,
      changedByType: 'ADMIN',
    })
  }

  /**
   * Auto-assign delivery to best available agent
   */
  static async autoAssign(
    tenantId: string,
    assignmentId: string,
    algorithm: 'NEAREST' | 'ROUND_ROBIN' | 'LEAST_BUSY' = 'NEAREST',
    assignedBy: string
  ) {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId, status: 'PENDING' },
    })

    if (!assignment) throw new Error('Pending assignment not found')

    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
    })

    const availableAgents = await AgentService.getAvailableAgents(tenantId, {
      zoneId: assignment.zoneId || undefined,
      maxConcurrentDeliveries: config?.maxConcurrentDeliveries || 5,
    })

    if (availableAgents.length === 0) {
      throw new Error('No available agents')
    }

    let selectedAgent
    switch (algorithm) {
      case 'ROUND_ROBIN':
        // Get agent with oldest last assignment
        selectedAgent = availableAgents[0]
        break
      
      case 'LEAST_BUSY':
        // Get agent with fewest active deliveries
        selectedAgent = availableAgents.sort((a, b) => 
          a._count.assignments - b._count.assignments
        )[0]
        break
      
      case 'NEAREST':
      default:
        // If we have delivery coordinates, find nearest
        if (assignment.deliveryLatitude && assignment.deliveryLongitude) {
          const agentsWithLocation = availableAgents.filter(a => a.lastLatitude && a.lastLongitude)
          if (agentsWithLocation.length > 0) {
            selectedAgent = agentsWithLocation.sort((a, b) => {
              const distA = this.calculateDistance(
                Number(assignment.deliveryLatitude),
                Number(assignment.deliveryLongitude),
                Number(a.lastLatitude),
                Number(a.lastLongitude)
              )
              const distB = this.calculateDistance(
                Number(assignment.deliveryLatitude),
                Number(assignment.deliveryLongitude),
                Number(b.lastLatitude),
                Number(b.lastLongitude)
              )
              return distA - distB
            })[0]
          }
        }
        // Fallback to first available
        if (!selectedAgent) selectedAgent = availableAgents[0]
        break
    }

    return this.assignAgent(tenantId, assignmentId, selectedAgent.id, assignedBy, true)
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private static toRad(deg: number): number {
    return deg * Math.PI / 180
  }

  /**
   * Get delivery statistics
   */
  static async getStatistics(
    tenantId: string,
    options: { dateFrom?: Date; dateTo?: Date } = {}
  ) {
    const where: Prisma.LogisticsDeliveryAssignmentWhereInput = { tenantId }
    if (options.dateFrom || options.dateTo) {
      where.createdAt = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      }
    }

    const [total, byStatus, byPriority, avgRating] = await Promise.all([
      prisma.logistics_delivery_assignments.count({ where }),
      prisma.logistics_delivery_assignments.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.logistics_delivery_assignments.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.logistics_delivery_assignments.aggregate({
        where: { ...where, customerRating: { not: null } },
        _avg: { customerRating: true },
      }),
    ])

    const statusCounts: Record<string, number> = {}
    byStatus.forEach(s => { statusCounts[s.status] = s._count })

    const priorityCounts: Record<string, number> = {}
    byPriority.forEach(p => { priorityCounts[p.priority] = p._count })

    return {
      total,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      delivered: statusCounts['DELIVERED'] || 0,
      failed: statusCounts['FAILED'] || 0,
      pending: statusCounts['PENDING'] || 0,
      inProgress: total - (statusCounts['DELIVERED'] || 0) - (statusCounts['FAILED'] || 0) - 
                  (statusCounts['CANCELLED'] || 0) - (statusCounts['RETURNED'] || 0),
      successRate: total > 0 
        ? Math.round(((statusCounts['DELIVERED'] || 0) / total) * 100 * 100) / 100
        : 0,
      averageRating: avgRating._avg.customerRating 
        ? Math.round(Number(avgRating._avg.customerRating) * 100) / 100
        : null,
    }
  }
}
