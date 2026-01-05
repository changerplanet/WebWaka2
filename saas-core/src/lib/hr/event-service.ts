/**
 * MODULE 5: HR & PAYROLL
 * Event Service - Event consumption and emission
 * 
 * PHASE 7: Events & Integration
 * 
 * EMITS:
 * - ATTENDANCE_RECORDED
 * - LEAVE_APPROVED
 * - PAYROLL_CALCULATED
 * - PAYSLIP_GENERATED
 * 
 * CONSUMES:
 * - STAFF_CREATED
 * - STAFF_UPDATED
 */

import { prisma } from '@/lib/prisma'
import { EmployeeService } from './employee-service'

// ============================================================================
// TYPES
// ============================================================================

export type HrEventType =
  | 'ATTENDANCE_RECORDED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'PAYROLL_CALCULATED'
  | 'PAYSLIP_GENERATED'

export type ConsumedEventType =
  | 'STAFF_CREATED'
  | 'STAFF_UPDATED'

export interface HrEvent {
  eventType: HrEventType
  payload: {
    tenantId: string
    employeeProfileId?: string
    staffId?: string
    periodId?: string
    payslipId?: string
    leaveRequestId?: string
    attendanceRecordId?: string
    metadata?: object
  }
}

export interface StaffCreatedEvent {
  eventType: 'STAFF_CREATED'
  tenantId: string
  staffId: string
  fullName: string
  email: string
  phone: string
  role: string
}

export interface StaffUpdatedEvent {
  eventType: 'STAFF_UPDATED'
  tenantId: string
  staffId: string
  changes: Record<string, unknown>
}

// In-memory event log for idempotency
const processedEvents = new Map<string, { processedAt: Date }>()

// ============================================================================
// EVENT SERVICE
// ============================================================================

export class HrEventService {
  /**
   * Process incoming event from Core
   */
  static async processEvent(event: StaffCreatedEvent | StaffUpdatedEvent): Promise<boolean> {
    const eventId = `${event.eventType}:${event.staffId}`
    
    // Check for duplicate (idempotency)
    if (processedEvents.has(eventId)) {
      console.log(`HR Event already processed: ${eventId}`)
      return true
    }

    try {
      switch (event.eventType) {
        case 'STAFF_CREATED':
          await this.handleStaffCreated(event as StaffCreatedEvent)
          break
        
        case 'STAFF_UPDATED':
          await this.handleStaffUpdated(event as StaffUpdatedEvent)
          break
        
        default:
          console.log(`Unknown HR event type: ${(event as { eventType: string }).eventType}`)
          return false
      }

      // Mark as processed
      processedEvents.set(eventId, { processedAt: new Date() })
      return true
    } catch (error) {
      console.error(`Error processing HR event ${eventId}:`, error)
      throw error
    }
  }

  /**
   * Handle STAFF_CREATED event
   * Auto-creates employee profile if HR module is enabled
   */
  private static async handleStaffCreated(event: StaffCreatedEvent) {
    // Check if HR is enabled for tenant
    const config = await prisma.hrConfiguration.findUnique({
      where: { tenantId: event.tenantId },
    })

    if (!config?.hrEnabled) {
      console.log(`HR not enabled for tenant ${event.tenantId}, skipping profile creation`)
      return
    }

    // Check if profile already exists
    const existing = await prisma.hrEmployeeProfile.findUnique({
      where: { staffId: event.staffId },
    })

    if (existing) {
      console.log(`HR profile already exists for staff ${event.staffId}`)
      return
    }

    // Auto-create basic employee profile
    try {
      await EmployeeService.createEmployeeProfile(event.tenantId, {
        staffId: event.staffId,
        employmentType: 'FULL_TIME',
        payFrequency: config.defaultPayFrequency,
        paymentMethod: config.defaultPaymentMethod,
        currency: config.defaultCurrency,
        annualLeaveEntitlement: config.defaultAnnualLeave,
        sickLeaveEntitlement: config.defaultSickLeave,
        casualLeaveEntitlement: config.defaultCasualLeave,
      })
      console.log(`Created HR profile for new staff ${event.staffId}`)
    } catch (error) {
      console.error(`Failed to create HR profile for staff ${event.staffId}:`, error)
    }
  }

  /**
   * Handle STAFF_UPDATED event
   */
  private static async handleStaffUpdated(event: StaffUpdatedEvent) {
    // Currently no action needed - staff data is read from Core
    console.log(`Staff updated: ${event.staffId}`)
  }

  /**
   * Emit HR event to Core/other modules
   */
  static async emitEvent(event: HrEvent) {
    console.log(`[HR EVENT] ${event.eventType}:`, event.payload)

    // In production, this would:
    // 1. Publish to message queue
    // 2. Call webhook endpoints
    // 3. Trigger notifications

    return event
  }

  /**
   * Get processed events (for debugging)
   */
  static getProcessedEvents() {
    return Array.from(processedEvents.entries()).map(([id, data]) => ({
      eventId: id,
      ...data,
    }))
  }

  /**
   * Clear event log (for testing)
   */
  static clearEventLog() {
    processedEvents.clear()
  }

  // ============================================================================
  // EVENT EMISSION HELPERS
  // ============================================================================

  /**
   * Emit attendance recorded event
   */
  static async emitAttendanceRecorded(
    tenantId: string,
    attendanceRecordId: string,
    employeeProfileId: string
  ) {
    return this.emitEvent({
      eventType: 'ATTENDANCE_RECORDED',
      payload: { tenantId, attendanceRecordId, employeeProfileId },
    })
  }

  /**
   * Emit leave approved event
   */
  static async emitLeaveApproved(
    tenantId: string,
    leaveRequestId: string,
    employeeProfileId: string
  ) {
    return this.emitEvent({
      eventType: 'LEAVE_APPROVED',
      payload: { tenantId, leaveRequestId, employeeProfileId },
    })
  }

  /**
   * Emit leave rejected event
   */
  static async emitLeaveRejected(
    tenantId: string,
    leaveRequestId: string,
    employeeProfileId: string
  ) {
    return this.emitEvent({
      eventType: 'LEAVE_REJECTED',
      payload: { tenantId, leaveRequestId, employeeProfileId },
    })
  }

  /**
   * Emit payroll calculated event
   */
  static async emitPayrollCalculated(tenantId: string, periodId: string) {
    return this.emitEvent({
      eventType: 'PAYROLL_CALCULATED',
      payload: { tenantId, periodId },
    })
  }

  /**
   * Emit payslip generated event
   */
  static async emitPayslipGenerated(
    tenantId: string,
    payslipId: string,
    employeeProfileId: string
  ) {
    return this.emitEvent({
      eventType: 'PAYSLIP_GENERATED',
      payload: { tenantId, payslipId, employeeProfileId },
    })
  }
}
