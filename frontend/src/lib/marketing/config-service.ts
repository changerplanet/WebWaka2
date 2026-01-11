/**
 * MODULE 8: MARKETING AUTOMATION
 * Configuration Service
 * 
 * PHASE 0: Module Constitution
 * 
 * This module OWNS:
 * - Automation workflows
 * - Triggers and conditions
 * - Scheduling logic
 * 
 * This module DOES NOT OWN (delegates to Core):
 * - Customer, Campaign, Message, Notification, Segment
 * 
 * CRITICAL: No direct messaging. All delivery via Core Communication Engine.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface MktConfigInput {
  automationEnabled?: boolean
  smsAutomation?: boolean
  emailAutomation?: boolean
  pushAutomation?: boolean
  maxMessagesPerDay?: number
  maxMessagesPerCustomer?: number
  quietHoursStart?: number
  quietHoursEnd?: number
  defaultChannel?: string
  smsFirst?: boolean
  timezone?: string
  metadata?: Record<string, unknown>
}

export interface MktConfigOutput {
  id: string
  tenantId: string
  automationEnabled: boolean
  smsAutomation: boolean
  emailAutomation: boolean
  pushAutomation: boolean
  maxMessagesPerDay: number
  maxMessagesPerCustomer: number
  quietHoursStart: number | null
  quietHoursEnd: number | null
  defaultChannel: string
  smsFirst: boolean
  timezone: string
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class MktConfigService {
  /**
   * Get marketing automation status
   */
  static async getStatus(tenantId: string) {
    const config = await prisma.mkt_configurations.findUnique({
      where: { tenantId },
    })

    return {
      initialized: !!config,
      enabled: config?.automationEnabled ?? false,
      config: config ? this.formatConfig(config) : null,
    }
  }

  /**
   * Get configuration
   */
  static async getConfig(tenantId: string): Promise<MktConfigOutput | null> {
    const config = await prisma.mkt_configurations.findUnique({
      where: { tenantId },
    })

    return config ? this.formatConfig(config) : null
  }

  /**
   * Initialize marketing automation
   */
  static async initialize(tenantId: string, input?: MktConfigInput): Promise<MktConfigOutput> {
    const existing = await prisma.mkt_configurations.findUnique({
      where: { tenantId },
    })

    if (existing) {
      return this.updateConfig(tenantId, input || {})
    }

    const config = await prisma.mkt_configurations.create({
      data: withPrismaDefaults({
        tenantId,
        automationEnabled: input?.automationEnabled ?? true,
        smsAutomation: input?.smsAutomation ?? true,
        emailAutomation: input?.emailAutomation ?? true,
        pushAutomation: input?.pushAutomation ?? false,
        maxMessagesPerDay: input?.maxMessagesPerDay ?? 100,
        maxMessagesPerCustomer: input?.maxMessagesPerCustomer ?? 3,
        quietHoursStart: input?.quietHoursStart ?? null,
        quietHoursEnd: input?.quietHoursEnd ?? null,
        defaultChannel: input?.defaultChannel ?? 'SMS',
        smsFirst: input?.smsFirst ?? true,
        timezone: input?.timezone ?? 'Africa/Lagos',
        metadata: input?.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      }),
    })

    // Create default automation templates
    await this.createDefaultTemplates(tenantId)

    return this.formatConfig(config)
  }

  /**
   * Update configuration
   */
  static async updateConfig(tenantId: string, input: MktConfigInput): Promise<MktConfigOutput> {
    const config = await prisma.mkt_configurations.update({
      where: { tenantId },
      data: {
        ...(input.automationEnabled !== undefined && { automationEnabled: input.automationEnabled }),
        ...(input.smsAutomation !== undefined && { smsAutomation: input.smsAutomation }),
        ...(input.emailAutomation !== undefined && { emailAutomation: input.emailAutomation }),
        ...(input.pushAutomation !== undefined && { pushAutomation: input.pushAutomation }),
        ...(input.maxMessagesPerDay !== undefined && { maxMessagesPerDay: input.maxMessagesPerDay }),
        ...(input.maxMessagesPerCustomer !== undefined && { maxMessagesPerCustomer: input.maxMessagesPerCustomer }),
        ...(input.quietHoursStart !== undefined && { quietHoursStart: input.quietHoursStart }),
        ...(input.quietHoursEnd !== undefined && { quietHoursEnd: input.quietHoursEnd }),
        ...(input.defaultChannel !== undefined && { defaultChannel: input.defaultChannel }),
        ...(input.smsFirst !== undefined && { smsFirst: input.smsFirst }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
    })

    return this.formatConfig(config)
  }

  /**
   * Check if within quiet hours
   */
  static async isQuietHours(tenantId: string): Promise<boolean> {
    const config = await this.getConfig(tenantId)
    if (!config || config.quietHoursStart === null || config.quietHoursEnd === null) {
      return false
    }

    const now = new Date()
    const hour = now.getHours()
    
    if (config.quietHoursStart < config.quietHoursEnd) {
      // Normal range: e.g., 22 to 6
      return hour >= config.quietHoursStart || hour < config.quietHoursEnd
    } else {
      // Overnight range: e.g., 22 to 6
      return hour >= config.quietHoursStart || hour < config.quietHoursEnd
    }
  }

  /**
   * Create default automation templates
   */
  private static async createDefaultTemplates(tenantId: string): Promise<void> {
    const templates = [
      {
        name: 'Welcome Message',
        description: 'Send a welcome message when a new customer is created',
        templateKey: 'welcome_message',
        trigger: { type: 'EVENT', eventName: 'CUSTOMER_CREATED' },
        actions: [
          { type: 'SEND_MESSAGE', config: { template: 'welcome', channel: 'SMS' } },
        ],
      },
      {
        name: 'Thank You - First Purchase',
        description: 'Thank customer after their first purchase',
        templateKey: 'first_purchase_thanks',
        trigger: { type: 'EVENT', eventName: 'ORDER_COMPLETED', conditions: { isFirstPurchase: true } },
        actions: [
          { type: 'SEND_MESSAGE', config: { template: 'thank_you', channel: 'SMS' } },
          { type: 'AWARD_POINTS', config: { points: 100, reason: 'First purchase bonus' } },
        ],
      },
      {
        name: 'Re-engagement',
        description: 'Reach out to inactive customers',
        templateKey: 'reengagement',
        trigger: { type: 'CONDITION', scheduleType: 'INACTIVITY', scheduleDays: 30 },
        actions: [
          { type: 'SEND_MESSAGE', config: { template: 'we_miss_you', channel: 'SMS' } },
        ],
      },
      {
        name: 'Birthday Greeting',
        description: 'Send birthday wishes with a special offer',
        templateKey: 'birthday',
        trigger: { type: 'TIME', scheduleType: 'BIRTHDAY', scheduleDays: 0 },
        actions: [
          { type: 'SEND_MESSAGE', config: { template: 'birthday', channel: 'SMS' } },
          { type: 'AWARD_POINTS', config: { points: 50, reason: 'Birthday bonus' } },
        ],
      },
    ]

    for (const template of templates) {
      // Check if exists
      const existing = await prisma.mkt_automation_workflows.findFirst({
        where: { tenantId, templateKey: template.templateKey },
      })

      if (!existing) {
        const workflow = await prisma.mkt_automation_workflows.create({
          data: {
            tenantId,
            name: template.name,
            description: template.description,
            templateKey: template.templateKey,
            isTemplate: true,
            status: 'DRAFT', // Templates start as draft
          },
        })

        // Create trigger
        await prisma.mkt_automation_triggers.create({
          data: {
            workflowId: workflow.id,
            type: template.trigger.type as 'EVENT' | 'TIME' | 'CONDITION' | 'MANUAL',
            eventName: template.trigger.eventName,
            conditions: template.trigger.conditions as Prisma.InputJsonValue || Prisma.JsonNull,
            scheduleType: template.trigger.scheduleType,
            scheduleDays: template.trigger.scheduleDays,
          },
        })

        // Create actions
        for (let i = 0; i < template.actions.length; i++) {
          const action = template.actions[i]
          await prisma.mkt_automation_actions.create({
            data: {
              workflowId: workflow.id,
              type: action.type as 'SEND_MESSAGE' | 'APPLY_TAG' | 'AWARD_POINTS' | 'INTERNAL_NOTIFY' | 'WAIT',
              config: action.config as Prisma.InputJsonValue,
              sortOrder: i,
            },
          })
        }
      }
    }
  }

  /**
   * Format config for output
   */
  private static formatConfig(config: {
    id: string
    tenantId: string
    automationEnabled: boolean
    smsAutomation: boolean
    emailAutomation: boolean
    pushAutomation: boolean
    maxMessagesPerDay: number
    maxMessagesPerCustomer: number
    quietHoursStart: number | null
    quietHoursEnd: number | null
    defaultChannel: string
    smsFirst: boolean
    timezone: string
    metadata: unknown
    createdAt: Date
    updatedAt: Date
  }): MktConfigOutput {
    return {
      id: config.id,
      tenantId: config.tenantId,
      automationEnabled: config.automationEnabled,
      smsAutomation: config.smsAutomation,
      emailAutomation: config.emailAutomation,
      pushAutomation: config.pushAutomation,
      maxMessagesPerDay: config.maxMessagesPerDay,
      maxMessagesPerCustomer: config.maxMessagesPerCustomer,
      quietHoursStart: config.quietHoursStart,
      quietHoursEnd: config.quietHoursEnd,
      defaultChannel: config.defaultChannel,
      smsFirst: config.smsFirst,
      timezone: config.timezone,
      metadata: config.metadata as Record<string, unknown> | null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  }
}
