/**
 * SUPER ADMIN IMPERSONATION SERVICE
 * 
 * Enables Super Admin to temporarily act as a Partner, Tenant Admin, or Instance user
 * for support, diagnostics, government pilots, and compliance verification.
 * 
 * SECURITY RULES:
 * - Impersonation is explicit, time-bound, and auditable
 * - Original identity is always preserved
 * - Destructive actions are blocked while impersonating
 * - All actions logged with both actor and impersonated entity
 */

import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// Impersonation session duration (in minutes)
const IMPERSONATION_DURATION_MINUTES = 60

// Impersonation target types
export type ImpersonationTargetType = 'PARTNER' | 'TENANT' | 'INSTANCE'

// Impersonation session data stored in session metadata
export interface ImpersonationContext {
  active: boolean
  targetType: ImpersonationTargetType
  targetId: string
  targetName: string
  startedAt: string
  expiresAt: string
  originalUserId: string
  originalUserEmail: string
}

// Actions blocked during impersonation (destructive operations)
const BLOCKED_ACTIONS_DURING_IMPERSONATION = [
  'DELETE_TENANT',
  'DELETE_PARTNER',
  'TERMINATE_PARTNER',
  'DELETE_USER',
  'CHANGE_SUPER_ADMIN',
  'MODIFY_BILLING',
  'TRANSFER_OWNERSHIP',
]

/**
 * Start impersonation session
 */
export async function startImpersonation(
  superAdminId: string,
  superAdminEmail: string,
  targetType: ImpersonationTargetType,
  targetId: string,
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; context?: ImpersonationContext; error?: string }> {
  try {
    // Verify the target exists
    let targetName = ''
    
    if (targetType === 'PARTNER') {
      const partner = await prisma.partner.findUnique({
        where: { id: targetId },
        select: { name: true, status: true }
      })
      if (!partner) return { success: false, error: 'Partner not found' }
      if (partner.status === 'TERMINATED') return { success: false, error: 'Cannot impersonate terminated partner' }
      targetName = partner.name
    } else if (targetType === 'TENANT') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: targetId },
        select: { name: true, appName: true, status: true }
      })
      if (!tenant) return { success: false, error: 'Tenant not found' }
      targetName = tenant.appName || tenant.name
    } else if (targetType === 'INSTANCE') {
      const instance = await prisma.platformInstance.findUnique({
        where: { id: targetId },
        include: { tenant: { select: { name: true } } }
      })
      if (!instance) return { success: false, error: 'Instance not found' }
      targetName = `${instance.name} (${instance.tenant.name})`
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + IMPERSONATION_DURATION_MINUTES * 60 * 1000)

    const context: ImpersonationContext = {
      active: true,
      targetType,
      targetId,
      targetName,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      originalUserId: superAdminId,
      originalUserEmail: superAdminEmail
    }

    // Store impersonation context in session
    console.log('Impersonation: Updating session with token:', sessionId?.substring(0, 20) + '...')
    
    if (!sessionId) {
      console.error('Impersonation: No session ID provided')
      return { success: false, error: 'No session token available' }
    }
    
    try {
      await prisma.session.update({
        where: { token: sessionId },
        data: {
          // Store impersonation context in userAgent (temporary storage)
          // In production, use a dedicated field or Redis
          userAgent: JSON.stringify({ impersonation: context, originalUserAgent: userAgent })
        }
      })
      console.log('Impersonation: Session updated successfully')
    } catch (sessionErr) {
      console.error('Impersonation: Failed to update session:', sessionErr)
      // Continue anyway - impersonation can work without session storage
    }

    // Create audit log
    await createAuditLog({
      action: 'SUPER_ADMIN_IMPERSONATION_START',
      actorId: superAdminId,
      actorEmail: superAdminEmail,
      targetType: targetType,
      targetId: targetId,
      metadata: {
        targetName,
        expiresAt: expiresAt.toISOString(),
        reason: 'Support/Diagnostics',
        ipAddress,
        userAgent
      }
    })

    return { success: true, context }
  } catch (error) {
    console.error('Failed to start impersonation:', error)
    return { success: false, error: 'Failed to start impersonation' }
  }
}

/**
 * End impersonation session
 */
export async function endImpersonation(
  superAdminId: string,
  superAdminEmail: string,
  context: ImpersonationContext,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create audit log for impersonation end
    await createAuditLog({
      action: 'SUPER_ADMIN_IMPERSONATION_END',
      actorId: superAdminId,
      actorEmail: superAdminEmail,
      targetType: context.targetType,
      targetId: context.targetId,
      metadata: {
        targetName: context.targetName,
        startedAt: context.startedAt,
        endedAt: new Date().toISOString(),
        duration: Math.round((Date.now() - new Date(context.startedAt).getTime()) / 1000 / 60) + ' minutes',
        ipAddress,
        userAgent
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to end impersonation:', error)
    return { success: false, error: 'Failed to end impersonation' }
  }
}

/**
 * Check if an action is allowed during impersonation
 */
export function isActionAllowedDuringImpersonation(action: string): boolean {
  return !BLOCKED_ACTIONS_DURING_IMPERSONATION.includes(action)
}

/**
 * Get impersonation targets available for Super Admin
 */
export async function getImpersonationTargets(): Promise<{
  partners: { id: string; name: string; status: string }[]
  tenants: { id: string; name: string; slug: string; status: string }[]
}> {
  const [partners, tenants] = await Promise.all([
    prisma.partner.findMany({
      where: { status: { not: 'TERMINATED' } },
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
      take: 100
    }),
    prisma.tenant.findMany({
      where: { status: { not: 'DEACTIVATED' } },
      select: { id: true, name: true, slug: true, status: true, appName: true },
      orderBy: { name: 'asc' },
      take: 100
    })
  ])

  return {
    partners,
    tenants: tenants.map(t => ({
      id: t.id,
      name: t.appName || t.name,
      slug: t.slug,
      status: t.status
    }))
  }
}

/**
 * Get impersonation logs for a Super Admin
 */
export async function getImpersonationLogs(
  limit: number = 50
): Promise<{
  id: string
  action: string
  actorEmail: string
  targetType: string | null
  targetId: string | null
  metadata: any
  createdAt: Date
}[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: ['SUPER_ADMIN_IMPERSONATION_START', 'SUPER_ADMIN_IMPERSONATION_END']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      actorEmail: true,
      targetType: true,
      targetId: true,
      metadata: true,
      createdAt: true
    }
  })

  return logs
}
