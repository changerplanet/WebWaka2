import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { User, GlobalRole, TenantRole, Tenant, TenantMembership } from '@prisma/client'

// Token expiration times
const MAGIC_LINK_EXPIRY_MINUTES = 15
const SESSION_EXPIRY_DAYS = 7

// Types
export type SessionUser = User & {
  memberships: (TenantMembership & {
    tenant: Tenant
  })[]
}

export type AuthSession = {
  user: SessionUser
  sessionId: string
  sessionToken: string
  activeTenantId: string | null
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return uuidv4() + '-' + uuidv4()
}

/**
 * Create a magic link for a user
 * If user doesn't exist, creates them
 */
export async function createMagicLink(email: string, tenantId?: string): Promise<{ token: string; user: User }> {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: normalizedEmail,
        globalRole: 'USER'
      }
    })
  }
  
  // Generate token
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_EXPIRY_MINUTES)
  
  // Create magic link record
  await prisma.magicLink.create({
    data: {
      id: uuidv4(),
      token,
      userId: user.id,
      tenantId: tenantId || null,
      expiresAt
    }
  })
  
  return { token, user }
}

/**
 * Verify and consume a magic link
 * Returns user and creates session if valid
 */
export async function verifyMagicLink(token: string): Promise<{ user: SessionUser; session: { id: string; token: string }; tenantId: string | null } | null> {
  // Find the magic link
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true }
  })
  
  if (!magicLink) {
    return null
  }
  
  // Check if expired
  if (magicLink.expiresAt < new Date()) {
    // Delete expired token
    await prisma.magicLink.delete({ where: { id: magicLink.id } })
    return null
  }
  
  // Check if already used
  if (magicLink.usedAt) {
    return null
  }
  
  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() }
  })
  
  // Update user's last login
  await prisma.user.update({
    where: { id: magicLink.userId },
    data: { lastLoginAt: new Date() }
  })
  
  // Create session
  const sessionToken = generateToken()
  const sessionExpiresAt = new Date()
  sessionExpiresAt.setDate(sessionExpiresAt.getDate() + SESSION_EXPIRY_DAYS)
  
  const session = await prisma.session.create({
    data: {
      id: uuidv4(),
      userId: magicLink.userId,
      token: sessionToken,
      activeTenant: magicLink.tenantId,
      expiresAt: sessionExpiresAt
    }
  })
  
  // Get user with memberships
  const user = await prisma.user.findUnique({
    where: { id: magicLink.userId },
    include: {
      memberships: {
        where: { isActive: true },
        include: { tenant: true }
      }
    }
  })
  
  return {
    user: user as SessionUser,
    session: { id: session.id, token: sessionToken },
    tenantId: magicLink.tenantId
  }
}

/**
 * Get session from token
 */
export async function getSessionByToken(token: string): Promise<AuthSession | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: {
            where: { isActive: true },
            include: { tenant: true }
          }
        }
      }
    }
  })
  
  if (!session) {
    return null
  }
  
  // Check if expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }
  
  // Update last active
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() }
  })
  
  return {
    user: session.user as SessionUser,
    sessionId: session.id,
    activeTenantId: session.activeTenant
  }
}

/**
 * Get current session from cookies
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    return null
  }
  
  return getSessionByToken(sessionToken)
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // days to seconds
    path: '/'
  })
}

/**
 * Clear session cookie and delete session
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (sessionToken) {
    // Delete session from database
    await prisma.session.deleteMany({
      where: { token: sessionToken }
    })
  }
  
  // Clear cookie
  cookieStore.delete('session_token')
}

/**
 * Switch active tenant for a session
 */
export async function switchTenant(sessionToken: string, tenantId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: { include: { memberships: true } } }
  })
  
  if (!session) return false
  
  // Check if user has access to this tenant
  const hasMembership = session.user.memberships.some(
    m => m.tenantId === tenantId && m.isActive
  )
  
  // Super admins can access any tenant
  const isSuperAdmin = session.user.globalRole === 'SUPER_ADMIN'
  
  if (!hasMembership && !isSuperAdmin) {
    return false
  }
  
  await prisma.session.update({
    where: { id: session.id },
    data: { activeTenant: tenantId }
  })
  
  return true
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(user: User): boolean {
  return user.globalRole === 'SUPER_ADMIN'
}

/**
 * Check if user is Tenant Admin for a specific tenant
 */
export async function isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: { userId, tenantId }
    }
  })
  
  return membership?.role === 'TENANT_ADMIN' && membership.isActive
}
