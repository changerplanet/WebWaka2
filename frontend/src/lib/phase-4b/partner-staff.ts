/**
 * PHASE 4B: Partner Staff Management
 * 
 * Manages partner's internal team:
 * - Staff roles (Owner, Admin, Sales, Support)
 * - Client visibility scoping
 * - Cross-client operation
 * 
 * RULES:
 * - Staff NEVER become tenant users
 * - Staff operate at partner level, across clients
 * - Role-based permissions enforced
 */

import { prisma } from '../prisma'
import { PartnerRole } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { withPrismaDefaults } from '../db/prismaDefaults'
import { 
  mapStaffMember, 
  mapStaffMembers,
  type StaffMemberViewModel 
} from '../db/prismaResultMappers'

// ============================================================================
// TYPES
// ============================================================================

export interface AddStaffInput {
  partnerId: string
  userId: string
  role: PartnerRole
  displayName?: string
  department?: string
  assignedTenantIds?: string[]
}

export interface UpdateStaffInput {
  role?: PartnerRole
  displayName?: string
  department?: string
  assignedTenantIds?: string[]
  isActive?: boolean
}

export interface StaffMember {
  id: string
  partnerId: string
  userId: string
  role: PartnerRole
  displayName: string | null
  department: string | null
  assignedTenantIds: string[]
  isActive: boolean
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  }
}

export interface StaffResult {
  success: boolean
  staff?: any
  error?: string
  errorCode?: string
}

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

export const ROLE_PERMISSIONS: Record<PartnerRole, {
  canManageStaff: boolean
  canManageClients: boolean
  canManagePackages: boolean
  canViewEarnings: boolean
  canCreateClients: boolean
  canSuspendClients: boolean
  canViewAllClients: boolean
}> = {
  PARTNER_OWNER: {
    canManageStaff: true,
    canManageClients: true,
    canManagePackages: true,
    canViewEarnings: true,
    canCreateClients: true,
    canSuspendClients: true,
    canViewAllClients: true,
  },
  PARTNER_ADMIN: {
    canManageStaff: true,
    canManageClients: true,
    canManagePackages: true,
    canViewEarnings: true,
    canCreateClients: true,
    canSuspendClients: true,
    canViewAllClients: true,
  },
  PARTNER_SALES: {
    canManageStaff: false,
    canManageClients: false,
    canManagePackages: false,
    canViewEarnings: false,
    canCreateClients: true,
    canSuspendClients: false,
    canViewAllClients: false, // Only sees assigned clients
  },
  PARTNER_SUPPORT: {
    canManageStaff: false,
    canManageClients: false,
    canManagePackages: false,
    canViewEarnings: false,
    canCreateClients: false,
    canSuspendClients: false,
    canViewAllClients: false, // Only sees assigned clients
  },
  PARTNER_STAFF: {
    canManageStaff: false,
    canManageClients: false,
    canManagePackages: false,
    canViewEarnings: true,
    canCreateClients: false,
    canSuspendClients: false,
    canViewAllClients: false,
  },
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: PartnerRole, 
  permission: keyof typeof ROLE_PERMISSIONS.PARTNER_OWNER
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

// ============================================================================
// ADD STAFF
// ============================================================================

/**
 * Add a new staff member to a partner organization
 */
export async function addPartnerStaff(input: AddStaffInput): Promise<StaffResult> {
  try {
    // Check if user is already a partner member
    const existing = await prisma.partnerUser.findUnique({
      where: { userId: input.userId }
    })
    
    if (existing) {
      return {
        success: false,
        error: 'User is already a partner member',
        errorCode: 'ALREADY_MEMBER',
      }
    }
    
    // Create staff member
    const staff = await prisma.partnerUser.create({
      data: withPrismaDefaults({
        partnerId: input.partnerId,
        userId: input.userId,
        role: input.role,
        displayName: input.displayName,
        department: input.department,
        assignedTenantIds: input.assignedTenantIds || [],
      }),
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })
    
    return { success: true, staff }
  } catch (error) {
    console.error('Failed to add staff:', error)
    return {
      success: false,
      error: 'Failed to add staff member',
      errorCode: 'ADD_FAILED',
    }
  }
}

// ============================================================================
// GET STAFF
// ============================================================================

/**
 * Get all staff members for a partner
 */
export async function getPartnerStaff(
  partnerId: string,
  options?: {
    includeInactive?: boolean
    role?: PartnerRole[]
    department?: string
  }
): Promise<StaffMember[]> {
  const where: any = { partnerId }
  
  if (!options?.includeInactive) {
    where.isActive = true
  }
  
  if (options?.role?.length) {
    where.role = { in: options.role }
  }
  
  if (options?.department) {
    where.department = options.department
  }
  
  const staff = await prisma.partnerUser.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true }
      }
    },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' }
    ]
  })
  
  return staff as unknown as StaffMember[]
}

/**
 * Get a single staff member
 */
export async function getStaffById(staffId: string): Promise<StaffMember | null> {
  const staff = await prisma.partnerUser.findUnique({
    where: { id: staffId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true }
      }
    }
  })
  
  return staff as unknown as StaffMember
}

// ============================================================================
// UPDATE STAFF
// ============================================================================

/**
 * Update a staff member
 */
export async function updatePartnerStaff(
  staffId: string,
  input: UpdateStaffInput
): Promise<StaffResult> {
  try {
    const existing = await prisma.partnerUser.findUnique({
      where: { id: staffId }
    })
    
    if (!existing) {
      return {
        success: false,
        error: 'Staff member not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    // Cannot demote owner if they're the only owner
    if (existing.role === 'PARTNER_OWNER' && input.role && input.role !== 'PARTNER_OWNER') {
      const ownerCount = await prisma.partnerUser.count({
        where: {
          partnerId: existing.partnerId,
          role: 'PARTNER_OWNER',
          isActive: true,
        }
      })
      
      if (ownerCount <= 1) {
        return {
          success: false,
          error: 'Cannot remove the only owner',
          errorCode: 'LAST_OWNER',
        }
      }
    }
    
    const staff = await prisma.partnerUser.update({
      where: { id: staffId },
      data: {
        role: input.role,
        displayName: input.displayName,
        department: input.department,
        assignedTenantIds: input.assignedTenantIds,
        isActive: input.isActive,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })
    
    return { success: true, staff }
  } catch (error) {
    console.error('Failed to update staff:', error)
    return {
      success: false,
      error: 'Failed to update staff member',
      errorCode: 'UPDATE_FAILED',
    }
  }
}

// ============================================================================
// REMOVE STAFF
// ============================================================================

/**
 * Remove (deactivate) a staff member
 */
export async function removePartnerStaff(staffId: string): Promise<StaffResult> {
  try {
    const existing = await prisma.partnerUser.findUnique({
      where: { id: staffId }
    })
    
    if (!existing) {
      return {
        success: false,
        error: 'Staff member not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    // Cannot remove owner if they're the only owner
    if (existing.role === 'PARTNER_OWNER') {
      const ownerCount = await prisma.partnerUser.count({
        where: {
          partnerId: existing.partnerId,
          role: 'PARTNER_OWNER',
          isActive: true,
        }
      })
      
      if (ownerCount <= 1) {
        return {
          success: false,
          error: 'Cannot remove the only owner',
          errorCode: 'LAST_OWNER',
        }
      }
    }
    
    const staff = await prisma.partnerUser.update({
      where: { id: staffId },
      data: { isActive: false }
    })
    
    return { success: true, staff }
  } catch (error) {
    console.error('Failed to remove staff:', error)
    return {
      success: false,
      error: 'Failed to remove staff member',
      errorCode: 'REMOVE_FAILED',
    }
  }
}

// ============================================================================
// ASSIGN CLIENTS
// ============================================================================

/**
 * Assign specific clients to a staff member
 * Only applicable for Sales and Support roles
 */
export async function assignClientsToStaff(
  staffId: string,
  tenantIds: string[]
): Promise<StaffResult> {
  try {
    const staff = await prisma.partnerUser.findUnique({
      where: { id: staffId }
    })
    
    if (!staff) {
      return {
        success: false,
        error: 'Staff member not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    // Only Sales and Support have client scoping
    if (staff.role !== 'PARTNER_SALES' && staff.role !== 'PARTNER_SUPPORT') {
      return {
        success: false,
        error: 'Client assignment only applies to Sales and Support roles',
        errorCode: 'INVALID_ROLE',
      }
    }
    
    // Verify tenants belong to this partner
    const instances = await prisma.platformInstance.findMany({
      where: {
        createdByPartnerId: staff.partnerId,
        tenantId: { in: tenantIds }
      },
      select: { tenantId: true }
    })
    
    const validTenantIds = [...new Set(instances.map(i => i.tenantId))]
    
    const updated = await prisma.partnerUser.update({
      where: { id: staffId },
      data: { assignedTenantIds: validTenantIds }
    })
    
    return { success: true, staff: updated }
  } catch (error) {
    console.error('Failed to assign clients:', error)
    return {
      success: false,
      error: 'Failed to assign clients',
      errorCode: 'ASSIGN_FAILED',
    }
  }
}

// ============================================================================
// GET ACCESSIBLE CLIENTS
// ============================================================================

/**
 * Get list of clients a staff member can access
 * Based on role and assigned tenants
 */
export async function getAccessibleClients(
  staffId: string
): Promise<{ tenantId: string; tenantName: string }[]> {
  const staff = await prisma.partnerUser.findUnique({
    where: { id: staffId }
  })
  
  if (!staff) return []
  
  // Owners, Admins, and Staff see all clients
  if (hasPermission(staff.role, 'canViewAllClients')) {
    const instances = await prisma.platformInstance.findMany({
      where: { createdByPartnerId: staff.partnerId },
      include: { tenant: { select: { id: true, name: true } } },
      distinct: ['tenantId']
    })
    
    return instances.map(i => ({
      tenantId: i.tenant?.id || '',
      tenantName: i.tenant?.name || 'Unknown',
    }))
  }
  
  // Sales and Support only see assigned clients
  if (staff.assignedTenantIds.length === 0) {
    return [] // No clients assigned
  }
  
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: staff.assignedTenantIds } },
    select: { id: true, name: true }
  })
  
  return tenants.map(t => ({
    tenantId: t.id,
    tenantName: t.name,
  }))
}
