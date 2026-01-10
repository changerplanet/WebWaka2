/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Offline Service - Offline support and sync
 * 
 * Rules:
 * - Delivery status updates can be queued offline
 * - Proof of delivery can be captured offline
 * - Sync must be idempotent (safe to replay)
 * - Conflicts resolved by timestamp + status precedence
 */

import { prisma } from '@/lib/prisma'
import { LogisticsDeliveryStatus } from '@prisma/client'
import { AssignmentService } from './assignment-service'
import { ProofService, CaptureProofInput } from './proof-service'

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineDataPackage {
  lastUpdated: string
  agents: OfflineAgent[]
  assignments: OfflineAssignment[]
  zones: OfflineZone[]
  config: OfflineConfig | null
}

export interface OfflineAgent {
  id: string
  firstName: string
  lastName: string
  phone: string
  status: string
  availability: string
  vehicleType: string | null
  assignedZoneIds: string[]
}

export interface OfflineAssignment {
  id: string
  orderId: string
  orderType: string
  orderNumber: string | null
  status: string
  priority: string
  agentId: string | null
  customerName: string | null
  customerPhone: string | null
  deliveryAddress: object | null
  deliveryLatitude: string | null
  deliveryLongitude: string | null
  specialInstructions: string | null
  scheduledDeliveryAt: string | null
  estimatedFee: string | null
  currency: string
}

export interface OfflineZone {
  id: string
  name: string
  city: string | null
  state: string | null
  lga: string | null
}

export interface OfflineConfig {
  proofOfDeliveryRequired: boolean
  photoProofRequired: boolean
  signatureProofRequired: boolean
  pinVerificationEnabled: boolean
  otpVerificationEnabled: boolean
}

export interface OfflineStatusUpdate {
  assignmentId: string
  status: LogisticsDeliveryStatus
  latitude?: number
  longitude?: number
  address?: string
  notes?: string
  changedBy?: string
  changedByType?: 'AGENT' | 'ADMIN' | 'SYSTEM' | 'CUSTOMER'
  offlineId: string
  recordedAt: string // ISO string
}

export interface OfflineSyncRequest {
  lastSyncAt?: string
  statusUpdates?: OfflineStatusUpdate[]
  proofs?: CaptureProofInput[]
  locationUpdates?: Array<{
    agentId: string
    latitude: number
    longitude: number
    recordedAt: string
  }>
}

export interface OfflineSyncResponse {
  success: boolean
  statusUpdates: Array<{ offlineId: string; success: boolean; error?: string }>
  logistics_delivery_proofs: Array<{ offlineId: string; success: boolean; id?: string; error?: string }>
  locationUpdates: Array<{ agentId: string; success: boolean; error?: string }>
  changes?: OfflineDataChanges
}

export interface OfflineDataChanges {
  newAssignments: OfflineAssignment[]
  updatedAssignments: OfflineAssignment[]
  cancelledAssignmentIds: string[]
}

// Status precedence for conflict resolution (higher = takes priority)
const STATUS_PRECEDENCE: Record<LogisticsDeliveryStatus, number> = {
  PENDING: 1,
  ASSIGNED: 2,
  ACCEPTED: 3,
  PICKING_UP: 4,
  PICKED_UP: 5,
  IN_TRANSIT: 6,
  ARRIVING: 7,
  DELIVERED: 10,
  FAILED: 8,
  RETURNED: 9,
  CANCELLED: 9,
}

// ============================================================================
// OFFLINE SERVICE
// ============================================================================

export class OfflineService {
  /**
   * Get offline data package for an agent
   */
  static async getOfflinePackage(tenantId: string, agentId?: string): Promise<OfflineDataPackage> {
    const [agents, assignments, zones, config] = await Promise.all([
      // Get agents (limited for offline)
      prisma.logistics_delivery_agents.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          availability: true,
          vehicleType: true,
          assignedZoneIds: true,
        },
        take: 100,
      }),

      // Get active assignments
      prisma.logistics_delivery_assignments.findMany({
        where: {
          tenantId,
          status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
          ...(agentId && { agentId }),
        },
        select: {
          id: true,
          orderId: true,
          orderType: true,
          orderNumber: true,
          status: true,
          priority: true,
          agentId: true,
          customerName: true,
          customerPhone: true,
          deliveryAddress: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          specialInstructions: true,
          scheduledDeliveryAt: true,
          estimatedFee: true,
          currency: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),

      // Get active zones
      prisma.logistics_delivery_zones.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          lga: true,
        },
      }),

      // Get config
      prisma.logistics_configurations.findUnique({
        where: { tenantId },
        select: {
          proofOfDeliveryRequired: true,
          photoProofRequired: true,
          signatureProofRequired: true,
          pinVerificationEnabled: true,
          otpVerificationEnabled: true,
        },
      }),
    ])

    return {
      lastUpdated: new Date().toISOString(),
      agents: agents.map(a => ({
        ...a,
        status: a.status,
        availability: a.availability,
      })),
      assignments: assignments.map(a => ({
        ...a,
        deliveryAddress: a.deliveryAddress as object | null,
        deliveryLatitude: a.deliveryLatitude?.toString() || null,
        deliveryLongitude: a.deliveryLongitude?.toString() || null,
        estimatedFee: a.estimatedFee?.toString() || null,
        scheduledDeliveryAt: a.scheduledDeliveryAt?.toISOString() || null,
      })),
      zones,
      config,
    }
  }

  /**
   * Sync offline changes
   */
  static async syncOfflineChanges(
    tenantId: string,
    request: OfflineSyncRequest
  ): Promise<OfflineSyncResponse> {
    const response: OfflineSyncResponse = {
      success: true,
      statusUpdates: [],
      logistics_delivery_proofs: [],
      locationUpdates: [],
    }

    // Process status updates
    if (request.statusUpdates?.length) {
      for (const update of request.statusUpdates) {
        try {
          await this.processOfflineStatusUpdate(tenantId, update)
          response.statusUpdates.push({ offlineId: update.offlineId, success: true })
        } catch (error) {
          response.statusUpdates.push({
            offlineId: update.offlineId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          response.success = false
        }
      }
    }

    // Process proofs
    if (request.proofs?.length) {
      const proofResults = await ProofService.syncOfflineProofs(tenantId, request.proofs)
      response.proofs = proofResults.map(r => ({
        offlineId: r.offlineId || '',
        success: r.success,
        id: r.success ? r.id : undefined,
        error: !r.success ? r.error : undefined,
      }))
    }

    // Process location updates
    if (request.locationUpdates?.length) {
      for (const locUpdate of request.locationUpdates) {
        try {
          await prisma.logistics_delivery_agents.update({
            where: { id: locUpdate.agentId },
            data: {
              lastLatitude: locUpdate.latitude,
              lastLongitude: locUpdate.longitude,
              lastLocationAt: new Date(locUpdate.recordedAt),
            },
          })
          response.locationUpdates.push({ agentId: locUpdate.agentId, success: true })
        } catch (error) {
          response.locationUpdates.push({
            agentId: locUpdate.agentId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    // Get changes since last sync
    if (request.lastSyncAt) {
      response.changes = await this.getChangesSince(tenantId, new Date(request.lastSyncAt))
    }

    return response
  }

  /**
   * Process a single offline status update with conflict resolution
   */
  private static async processOfflineStatusUpdate(
    tenantId: string,
    update: OfflineStatusUpdate
  ) {
    // Check for duplicate
    const existingHistory = await prisma.logistics_delivery_status_history.findFirst({
      where: { offlineId: update.offlineId },
    })

    if (existingHistory) {
      console.log(`Duplicate offline status update: ${update.offlineId}`)
      return existingHistory
    }

    // Get current assignment state
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: update.assignmentId, tenantId },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // Conflict resolution: check if offline update should be applied
    const offlineTime = new Date(update.recordedAt)
    const currentPrecedence = STATUS_PRECEDENCE[assignment.status]
    const updatePrecedence = STATUS_PRECEDENCE[update.status]

    // If server status has higher precedence and was updated after offline change, skip
    if (currentPrecedence > updatePrecedence && assignment.updatedAt > offlineTime) {
      console.log(`Skipping offline update - server status ${assignment.status} takes precedence`)
      // Still record in history for audit
      await prisma.logistics_delivery_status_history.create({
        data: {
          assignmentId: update.assignmentId,
          fromStatus: assignment.status,
          toStatus: update.status,
          latitude: update.latitude,
          longitude: update.longitude,
          address: update.address,
          notes: `[SKIPPED] ${update.notes || ''}`,
          changedBy: update.changedBy,
          changedByType: update.changedByType,
          offlineId: update.offlineId,
          recordedAt: offlineTime,
          syncedAt: new Date(),
        },
      })
      return null
    }

    // Apply the status update
    return AssignmentService.updateStatus(tenantId, update.assignmentId, {
      status: update.status,
      latitude: update.latitude,
      longitude: update.longitude,
      address: update.address,
      notes: update.notes,
      changedBy: update.changedBy,
      changedByType: update.changedByType,
      offlineId: update.offlineId,
      recordedAt: offlineTime,
    })
  }

  /**
   * Get changes since last sync
   */
  private static async getChangesSince(
    tenantId: string,
    lastSyncAt: Date
  ): Promise<OfflineDataChanges> {
    const [newAssignments, updatedAssignments, cancelledAssignments] = await Promise.all([
      // New assignments
      prisma.logistics_delivery_assignments.findMany({
        where: {
          tenantId,
          createdAt: { gt: lastSyncAt },
          status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
        },
        select: {
          id: true,
          orderId: true,
          orderType: true,
          orderNumber: true,
          status: true,
          priority: true,
          agentId: true,
          customerName: true,
          customerPhone: true,
          deliveryAddress: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          specialInstructions: true,
          scheduledDeliveryAt: true,
          estimatedFee: true,
          currency: true,
        },
      }),

      // Updated assignments
      prisma.logistics_delivery_assignments.findMany({
        where: {
          tenantId,
          updatedAt: { gt: lastSyncAt },
          createdAt: { lte: lastSyncAt },
          status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
        },
        select: {
          id: true,
          orderId: true,
          orderType: true,
          orderNumber: true,
          status: true,
          priority: true,
          agentId: true,
          customerName: true,
          customerPhone: true,
          deliveryAddress: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          specialInstructions: true,
          scheduledDeliveryAt: true,
          estimatedFee: true,
          currency: true,
        },
      }),

      // Cancelled/completed assignments
      prisma.logistics_delivery_assignments.findMany({
        where: {
          tenantId,
          updatedAt: { gt: lastSyncAt },
          status: { in: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
        },
        select: { id: true },
      }),
    ])

    const formatAssignment = (a: typeof newAssignments[0]): OfflineAssignment => ({
      ...a,
      deliveryAddress: a.deliveryAddress as object | null,
      deliveryLatitude: a.deliveryLatitude?.toString() || null,
      deliveryLongitude: a.deliveryLongitude?.toString() || null,
      estimatedFee: a.estimatedFee?.toString() || null,
      scheduledDeliveryAt: a.scheduledDeliveryAt?.toISOString() || null,
    })

    return {
      newAssignments: newAssignments.map(formatAssignment),
      updatedAssignments: updatedAssignments.map(formatAssignment),
      cancelledAssignmentIds: cancelledAssignments.map(a => a.id),
    }
  }

  /**
   * Validate offline data integrity
   */
  static async validateOfflineData(
    tenantId: string,
    data: { assignmentIds: string[] }
  ): Promise<{
    valid: string[]
    invalid: string[]
    updated: string[]
  }> {
    const serverAssignments = await prisma.logistics_delivery_assignments.findMany({
      where: {
        tenantId,
        id: { in: data.assignmentIds },
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    })

    const serverMap = new Map(serverAssignments.map(a => [a.id, a]))
    
    const valid: string[] = []
    const invalid: string[] = []
    const updated: string[] = []

    for (const id of data.assignmentIds) {
      const serverData = serverMap.get(id)
      if (!serverData) {
        invalid.push(id)
      } else if (serverData.status === 'DELIVERED' || serverData.status === 'CANCELLED') {
        updated.push(id)
      } else {
        valid.push(id)
      }
    }

    return { valid, invalid, updated }
  }
}
