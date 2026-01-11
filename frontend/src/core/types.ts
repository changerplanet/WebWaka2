/**
 * WebWaka Types
 * 
 * Core type definitions for the WebWaka platform.
 */

import { Prisma } from '@prisma/client'

// Re-export Prisma types for convenience
export type {
  User,
  Tenant,
  TenantMembership,
  TenantDomain,
  Session,
  MagicLink,
  AuditLog,
  TenantStatus,
  TenantRole,
  GlobalRole,
  DomainType,
  DomainStatus,
  AuditAction
} from '@prisma/client'

// Tenant with relations
export type TenantWithDomains = Prisma.TenantGetPayload<{
  include: { domains: true }
}>

export type TenantWithMembers = Prisma.TenantGetPayload<{
  include: {
    memberships: {
      include: { user: true }
    }
  }
}>

export type TenantWithAll = Prisma.TenantGetPayload<{
  include: {
    domains: true
    memberships: {
      include: { user: true }
    }
  }
}>

// User with memberships
export type UserWithMemberships = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: { tenant: true }
    }
  }
}>

// Membership with relations
export type MembershipWithUser = Prisma.TenantMembershipGetPayload<{
  include: { user: true }
}>

export type MembershipWithTenant = Prisma.TenantMembershipGetPayload<{
  include: { tenant: true }
}>

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Session types
export interface SessionUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  globalRole: string
  memberships: {
    tenantId: string
    tenantName: string
    tenantSlug: string
    role: string
  }[]
}

// Branding types
export interface BrandingConfig {
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}

// Domain types
export interface DomainInfo {
  id: string
  domain: string
  type: 'SUBDOMAIN' | 'CUSTOM'
  status: 'PENDING' | 'VERIFIED' | 'FAILED'
  isPrimary: boolean
  verificationToken: string | null
  verifiedAt: Date | null
}

// Audit types
export interface AuditEntry {
  id: string
  action: string
  actorId: string
  actorEmail: string
  tenantId: string | null
  targetType: string | null
  targetId: string | null
  metadata: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}
