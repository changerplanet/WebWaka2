/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Event Service - Event emission and consumption
 * 
 * PHASE 7: Events & Integration
 * 
 * This module EMITS:
 * - PURCHASE_REQUEST_CREATED
 * - PURCHASE_REQUEST_APPROVED
 * - PURCHASE_ORDER_CREATED
 * - GOODS_RECEIVED
 * - SUPPLIER_PERFORMANCE_UPDATED
 * - INVENTORY_ADJUSTMENT_REQUESTED (for Core to consume)
 * 
 * This module CONSUMES:
 * - INVENTORY_LOW (to suggest reorders)
 * - SUPPLIER_UPDATED (to sync supplier data)
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface ProcEventInput {
  eventType: string
  entityType: string
  entityId: string
  actorId?: string
  actorType?: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface ProcEventFilters {
  eventType?: string[]
  entityType?: string
  entityId?: string
  actorId?: string
  fromDate?: Date
  toDate?: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class ProcEventService {
  /**
   * Emit a procurement event
   */
  static async emitEvent(tenantId: string, input: ProcEventInput) {
    const event = await prisma.procEventLog.create({
      data: {
        tenantId,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
        actorType: input.actorType || 'USER',
        eventData: input.data as Prisma.InputJsonValue,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })

    // In a real implementation, this would publish to a message queue
    // For now, we just log and store
    console.log(`[PROCUREMENT EVENT] ${input.eventType}:`, {
      entityType: input.entityType,
      entityId: input.entityId,
      tenantId,
    })

    return {
      id: event.id,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      occurredAt: event.occurredAt,
    }
  }

  /**
   * Get events with filters
   */
  static async getEvents(tenantId: string, filters: ProcEventFilters = {}, limit: number = 50) {
    const where: Prisma.ProcEventLogWhereInput = {
      tenantId,
      ...(filters.eventType && { eventType: { in: filters.eventType } }),
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.actorId && { actorId: filters.actorId }),
      ...(filters.fromDate && { occurredAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { occurredAt: { lte: filters.toDate } }),
    }

    const events = await prisma.procEventLog.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit,
    })

    return events.map(e => ({
      id: e.id,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      actorId: e.actorId,
      actorType: e.actorType,
      data: e.eventData,
      metadata: e.metadata,
      occurredAt: e.occurredAt,
    }))
  }

  /**
   * Get events for a specific entity
   */
  static async getEntityEvents(tenantId: string, entityType: string, entityId: string) {
    return this.getEvents(tenantId, { entityType, entityId }, 100)
  }

  /**
   * Process INVENTORY_LOW event (from Core)
   * Creates a suggested purchase request
   */
  static async processInventoryLowEvent(
    tenantId: string,
    eventData: {
      productId: string
      productName: string
      currentStock: number
      reorderPoint: number
      suggestedQuantity: number
      preferredSupplierId?: string
    }
  ) {
    // Log event consumption
    await this.emitEvent(tenantId, {
      eventType: 'INVENTORY_LOW_CONSUMED',
      entityType: 'PRODUCT',
      entityId: eventData.productId,
      actorType: 'SYSTEM',
      data: eventData,
    })

    // This would typically create a suggested purchase request
    // For now, just return the suggestion
    return {
      suggestion: 'PURCHASE_REQUEST',
      productId: eventData.productId,
      productName: eventData.productName,
      suggestedQuantity: eventData.suggestedQuantity,
      preferredSupplierId: eventData.preferredSupplierId,
      reason: `Stock (${eventData.currentStock}) below reorder point (${eventData.reorderPoint})`,
    }
  }

  /**
   * Process SUPPLIER_UPDATED event (from Core)
   * Syncs supplier data changes
   */
  static async processSupplierUpdatedEvent(
    tenantId: string,
    eventData: {
      supplierId: string
      changes: Record<string, unknown>
    }
  ) {
    // Log event consumption
    await this.emitEvent(tenantId, {
      eventType: 'SUPPLIER_UPDATED_CONSUMED',
      entityType: 'SUPPLIER',
      entityId: eventData.supplierId,
      actorType: 'SYSTEM',
      data: eventData,
    })

    // Check if supplier has active POs that might be affected
    const activePOs = await prisma.procPurchaseOrder.count({
      where: {
        tenantId,
        supplierId: eventData.supplierId,
        status: { in: ['DRAFT', 'PENDING', 'CONFIRMED', 'PARTIALLY_RECEIVED'] },
      },
    })

    return {
      processed: true,
      activePOsAffected: activePOs,
    }
  }

  /**
   * Get event statistics
   */
  static async getStatistics(tenantId: string, days: number = 30) {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [eventCounts, recentEvents] = await Promise.all([
      prisma.procEventLog.groupBy({
        by: ['eventType'],
        where: { tenantId, occurredAt: { gte: fromDate } },
        _count: true,
      }),
      prisma.procEventLog.count({
        where: { tenantId, occurredAt: { gte: fromDate } },
      }),
    ])

    return {
      totalEvents: recentEvents,
      byType: Object.fromEntries(eventCounts.map(e => [e.eventType, e._count])),
      periodDays: days,
    }
  }
}
