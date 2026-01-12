/**
 * PRISMA RESULT TYPE MAPPERS
 * ==========================
 * 
 * Type-safe mappers for transforming Prisma query results with includes
 * into properly typed view models / DTOs.
 * 
 * These mappers eliminate unsafe `as unknown as T` casts by explicitly
 * defining the transformation from Prisma's return types to application types.
 * 
 * @module lib/db/prismaResultMappers
 */

import type { 
  PlatformInstance, 
  Tenant, 
  PartnerUser, 
  User,
  PartnerRole 
} from '@prisma/client'

// ============================================================================
// PLATFORM INSTANCE VIEW MODELS
// ============================================================================

/**
 * PlatformInstance with its related Tenant loaded
 */
export interface PlatformInstanceWithTenant extends PlatformInstance {
  tenant: Tenant
}

/**
 * Raw Prisma result type when including tenant relation
 */
type PrismaInstanceWithTenantResult = PlatformInstance & {
  tenant: Tenant | null
}

/**
 * Maps a Prisma PlatformInstance result (with tenant include) to typed DTO.
 * Returns null if the tenant relation is missing.
 * 
 * @param result - Raw Prisma query result with tenant include
 * @returns Typed PlatformInstanceWithTenant or null
 */
export function mapPlatformInstanceWithTenant(
  result: PrismaInstanceWithTenantResult | null
): PlatformInstanceWithTenant | null {
  if (!result || !result.tenant) {
    return null
  }
  
  return {
    ...result,
    tenant: result.tenant
  }
}

// ============================================================================
// PARTNER STAFF VIEW MODELS
// ============================================================================

/**
 * Staff member user info (subset of User for display)
 */
export interface StaffUserInfo {
  id: string
  name: string | null
  email: string | null
  phone: string | null
}

/**
 * Complete staff member view model for API responses
 */
export interface StaffMemberViewModel {
  id: string
  partnerId: string
  userId: string
  role: PartnerRole
  displayName: string | null
  department: string | null
  assignedTenantIds: string[]
  isActive: boolean
  createdAt: Date
  user: StaffUserInfo
}

/**
 * Raw Prisma result type when including user relation with select
 */
type PrismaPartnerUserWithUserResult = PartnerUser & {
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  } | null
}

/**
 * Maps a single Prisma PartnerUser result (with user include) to typed DTO.
 * Returns null if the user relation is missing.
 * 
 * @param result - Raw Prisma query result with user include
 * @returns Typed StaffMemberViewModel or null
 */
export function mapStaffMember(
  result: PrismaPartnerUserWithUserResult | null
): StaffMemberViewModel | null {
  if (!result || !result.user) {
    return null
  }
  
  return {
    id: result.id,
    partnerId: result.partnerId,
    userId: result.userId,
    role: result.role,
    displayName: result.displayName,
    department: result.department,
    assignedTenantIds: result.assignedTenantIds,
    isActive: result.isActive,
    createdAt: result.createdAt,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone
    }
  }
}

/**
 * Maps an array of Prisma PartnerUser results to typed DTOs.
 * Filters out any results with missing user relations.
 * 
 * @param results - Array of raw Prisma query results
 * @returns Array of typed StaffMemberViewModel
 */
export function mapStaffMembers(
  results: PrismaPartnerUserWithUserResult[]
): StaffMemberViewModel[] {
  return results
    .map(mapStaffMember)
    .filter((member): member is StaffMemberViewModel => member !== null)
}

// ============================================================================
// TENANT DOMAIN VIEW MODELS
// ============================================================================

/**
 * Domain entry with platform instance relation
 */
export interface DomainWithInstance {
  platformInstance: PlatformInstanceWithTenant | null
  tenantId: string
}

/**
 * Raw Prisma result type for domain with nested instance + tenant
 */
type PrismaDomainWithInstanceResult = {
  tenantId: string
  platformInstance: (PlatformInstance & { tenant: Tenant | null }) | null
}

/**
 * Maps domain result to extract platform instance with tenant.
 * 
 * @param result - Raw Prisma query result
 * @returns Platform instance with tenant or null
 */
export function mapDomainPlatformInstance(
  result: PrismaDomainWithInstanceResult | null
): PlatformInstanceWithTenant | null {
  if (!result?.platformInstance?.tenant) {
    return null
  }
  
  return {
    ...result.platformInstance,
    tenant: result.platformInstance.tenant
  }
}
