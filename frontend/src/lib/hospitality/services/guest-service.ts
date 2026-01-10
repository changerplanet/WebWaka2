/**
 * HOSPITALITY SUITE: Guest Service
 * 
 * Manages guest profiles (operational, not CRM).
 * 
 * @module lib/hospitality/services/guest-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateGuestInput {
  tenantId: string
  firstName: string
  lastName: string
  middleName?: string
  title?: string
  phone?: string
  email?: string
  nationalId?: string
  idType?: string
  idNumber?: string
  nationality?: string
  address?: object
  preferences?: object
  notes?: string
  isVip?: boolean
  vipNotes?: string
}

export interface GuestSearchOptions {
  search?: string
  phone?: string
  email?: string
  isVip?: boolean
  page?: number
  limit?: number
}

// ============================================================================
// GUEST NUMBER GENERATION
// ============================================================================

async function generateGuestNumber(tenantId: string): Promise<string> {
  const config = await prisma.hospitality_config.findUnique({
    where: { tenantId }
  })

  const prefix = config?.guestIdPrefix || 'GST'
  const nextSeq = config?.guestIdNextSeq || 1

  // Update sequence
  await prisma.hospitality_config.upsert({
    where: { tenantId },
    create: withPrismaDefaults({ tenantId, guestIdPrefix: prefix, guestIdNextSeq: nextSeq + 1 }),
    update: { guestIdNextSeq: nextSeq + 1 }
  })

  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(nextSeq).padStart(5, '0')}`
}

// ============================================================================
// GUEST OPERATIONS
// ============================================================================

export async function createGuest(input: CreateGuestInput) {
  const guestNumber = await generateGuestNumber(input.tenantId)

  return prisma.hospitality_guest.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      guestNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      title: input.title,
      phone: input.phone,
      email: input.email,
      nationalId: input.nationalId,
      idType: input.idType,
      idNumber: input.idNumber,
      nationality: input.nationality || 'Nigerian',
      address: input.address,
      preferences: input.preferences,
      notes: input.notes,
      isVip: input.isVip || false,
      vipNotes: input.vipNotes,
      isActive: true
    }) // AUTO-FIX: required by Prisma schema
  })
}

export async function getGuest(tenantId: string, guestId: string) {
  return prisma.hospitality_guest.findFirst({
    where: { id: guestId, tenantId },
    include: {
      _count: {
        select: { reservations: true, stays: true, orders: true }
      }
    }
  })
}

export async function getGuestByNumber(tenantId: string, guestNumber: string) {
  return prisma.hospitality_guest.findFirst({
    where: { guestNumber, tenantId }
  })
}

export async function getGuestByPhone(tenantId: string, phone: string) {
  return prisma.hospitality_guest.findFirst({
    where: { phone, tenantId }
  })
}

export async function listGuests(tenantId: string, options?: GuestSearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    isActive: true,
    ...(options?.isVip !== undefined && { isVip: options.isVip }),
    ...(options?.phone && { phone: { contains: options.phone } }),
    ...(options?.email && { email: { contains: options.email } }),
    ...(options?.search && {
      OR: [
        { firstName: { contains: options.search, mode: 'insensitive' as const } },
        { lastName: { contains: options.search, mode: 'insensitive' as const } },
        { phone: { contains: options.search } },
        { guestNumber: { contains: options.search } }
      ]
    })
  }

  const [guests, total] = await Promise.all([
    prisma.hospitality_guest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.hospitality_guest.count({ where })
  ])

  return { guests, total, page, limit }
}

export async function updateGuest(tenantId: string, guestId: string, data: Partial<CreateGuestInput>) {
  return prisma.hospitality_guest.update({
    where: { id: guestId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      title: data.title,
      phone: data.phone,
      email: data.email,
      nationalId: data.nationalId,
      idType: data.idType,
      idNumber: data.idNumber,
      nationality: data.nationality,
      address: data.address,
      preferences: data.preferences,
      notes: data.notes,
      isVip: data.isVip,
      vipNotes: data.vipNotes,
      updatedAt: new Date()
    }
  })
}

export async function setVipStatus(tenantId: string, guestId: string, isVip: boolean, vipNotes?: string) {
  return prisma.hospitality_guest.update({
    where: { id: guestId },
    data: { isVip, vipNotes, updatedAt: new Date() }
  })
}

// ============================================================================
// GUEST HISTORY
// ============================================================================

export async function getGuestHistory(tenantId: string, guestId: string) {
  const [stays, orders, reservations] = await Promise.all([
    prisma.hospitality_stay.findMany({
      where: { tenantId, guestId },
      include: { room: true, venue: true },
      orderBy: { checkInDate: 'desc' },
      take: 10
    }),
    prisma.hospitality_order.findMany({
      where: { tenantId, guestId },
      include: { venue: true, _count: { select: { inv_audit_items: true } } },
      orderBy: { placedAt: 'desc' },
      take: 10
    }),
    prisma.hospitality_reservation.findMany({
      where: { tenantId, guestId },
      include: { venue: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  return { stays, orders, reservations }
}

// ============================================================================
// GUEST MERGE (For duplicates)
// ============================================================================

export async function mergeGuests(tenantId: string, primaryGuestId: string, secondaryGuestId: string) {
  // Move all related records to primary guest
  await Promise.all([
    prisma.hospitality_reservation.updateMany({
      where: { tenantId, guestId: secondaryGuestId },
      data: { guestId: primaryGuestId }
    }),
    prisma.hospitality_stay.updateMany({
      where: { tenantId, guestId: secondaryGuestId },
      data: { guestId: primaryGuestId }
    }),
    prisma.hospitality_order.updateMany({
      where: { tenantId, guestId: secondaryGuestId },
      data: { guestId: primaryGuestId }
    }),
    prisma.hospitality_charge_fact.updateMany({
      where: { tenantId, guestId: secondaryGuestId },
      data: { guestId: primaryGuestId }
    })
  ])

  // Deactivate secondary guest
  await prisma.hospitality_guest.update({
    where: { id: secondaryGuestId },
    data: { isActive: false, notes: `Merged into ${primaryGuestId}` }
  })

  return prisma.hospitality_guest.findFirst({
    where: { id: primaryGuestId, tenantId }
  })
}
