/**
 * PARKHUB PUBLIC MARKETPLACE RESOLVER
 * Wave I.3: ParkHub Public Operator Marketplace (Exposure Only)
 * 
 * Server-side resolution for public ParkHub pages.
 * Validates tenant and operator access for public consumers.
 * Uses ONLY existing Prisma models and read-only queries.
 * 
 * CONSTRAINTS (Wave I.3 - ALL ENFORCED):
 * - ❌ No new business logic - only Prisma read queries
 * - ❌ No new booking logic - links to existing /parkhub/booking
 * - ❌ No new pricing logic - displays basePrice from park_route
 * - ❌ No schema changes - uses existing models
 * - ❌ No automation - no background jobs
 * 
 * DATA SOURCES (existing only):
 * - mvm_vendor: Transport operators (no dedicated operator model exists)
 * - park_route: Route definitions with origin/destination
 * - park_trip: Trip instances with availability
 * - tenant: Tenant resolution with activatedModules
 * 
 * ============================================================================
 * WAVE I.3 GAP DOCUMENTATION (per spec requirement)
 * ============================================================================
 * 
 * GAP 1: No dedicated transport operator model
 * - What is missing: Dedicated "operator" or "transport_company" model
 * - Current workaround: Using mvm_vendor as operators
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 2: Missing operator public metadata
 * - What is missing: Fleet size, service areas, bus types, amenities
 * - Current workaround: Displaying only available vendor fields
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 3: Missing operator logo/banner in mvm_vendor
 * - What is missing: Some vendors lack logo/banner images
 * - Current workaround: Displaying placeholder icon
 * - Why it cannot be solved in Wave I: Data seeding/upload not in scope
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 4: park_route not linked to vendors
 * - What is missing: park_route.parkId references tenant, not vendor
 * - Current workaround: Using vendor.id as parkId for filtering
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution - need park_route.operatorId
 * 
 * GAP 5: No schedule/timetable data
 * - What is missing: Structured schedule data (daily/weekly departures)
 * - Current workaround: Showing individual trips only
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 6: Missing SEO fields on operators
 * - What is missing: SEO title, description, keywords for operators
 * - Current workaround: Generating from operator name
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution
 * 
 * @module lib/parkhub/parkhub-resolver
 */

import { prisma } from '@/lib/prisma'
import { TenantContextResolver, type TenantContext } from '@/lib/tenant-context'
import type { TenantStatus } from '@prisma/client'

export interface ParkHubTenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  activatedModules: string[]
}

type StorefrontTenant = ParkHubTenant

function contextToParkHubTenant(ctx: TenantContext): ParkHubTenant {
  return {
    id: ctx.tenantId,
    name: ctx.tenantName,
    slug: ctx.tenantSlug,
    status: 'ACTIVE' as TenantStatus,
    appName: ctx.appName,
    logoUrl: ctx.logoUrl,
    faviconUrl: ctx.faviconUrl,
    primaryColor: ctx.primaryColor,
    secondaryColor: ctx.secondaryColor,
    activatedModules: ctx.enabledModules,
  }
}

export interface ParkHubOperator {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  isVerified: boolean
  averageRating: number | null
  totalRatings: number
  activeRoutesCount: number
  activeTripsCount: number
}

export interface ParkHubRoute {
  id: string
  name: string
  shortName: string | null
  origin: string
  destination: string
  distanceKm: number | null
  estimatedDurationMinutes: number | null
  basePrice: number
  isActive: boolean
}

export interface ParkHubTrip {
  id: string
  tripNumber: string
  routeId: string
  routeName: string
  origin: string
  destination: string
  status: string
  departureMode: string
  scheduledDeparture: Date | null
  totalSeats: number
  bookedSeats: number
  availableSeats: number
  currentPrice: number
}

export interface ParkHubLandingResult {
  success: true
  tenant: StorefrontTenant
  operatorCount: number
  activeRoutesCount: number
  activeTripsCount: number
  isDemo: boolean
}

export interface ParkHubOperatorListResult {
  success: true
  tenant: StorefrontTenant
  operators: ParkHubOperator[]
  isDemo: boolean
}

export interface ParkHubOperatorDetailResult {
  success: true
  tenant: StorefrontTenant
  operator: ParkHubOperator
  routes: ParkHubRoute[]
  upcomingTrips: ParkHubTrip[]
  isDemo: boolean
}

export interface ParkHubRoutesResult {
  success: true
  tenant: StorefrontTenant
  routes: (ParkHubRoute & { operatorName: string; operatorSlug: string })[]
  isDemo: boolean
}

type ResolutionFailure = {
  success: false
  reason: 'tenant_not_found' | 'tenant_inactive' | 'parkhub_not_enabled' | 'operator_not_found'
}

/**
 * Resolve ParkHub landing page data
 * Wave J.4: Refactored to use TenantContextResolver
 */
export async function resolveParkHubLanding(
  tenantSlug: string
): Promise<ParkHubLandingResult | ResolutionFailure> {
  const result = await TenantContextResolver.resolveForParkHub(tenantSlug)
  
  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    if (result.reason === 'module_disabled') {
      return { success: false, reason: 'parkhub_not_enabled' }
    }
    return { success: false, reason: 'tenant_inactive' }
  }

  const tenant = contextToParkHubTenant(result.context)
  const isDemo = result.context.isDemo

  const [operatorCount, activeRoutesCount, activeTripsCount] = await Promise.all([
    prisma.mvm_vendor.count({
      where: {
        tenantId: tenant.id,
        status: 'APPROVED'
      }
    }),
    prisma.park_route.count({
      where: {
        tenantId: tenant.id,
        isActive: true
      }
    }),
    prisma.park_trip.count({
      where: {
        tenantId: tenant.id,
        status: { in: ['SCHEDULED', 'BOARDING', 'READY_TO_DEPART'] }
      }
    })
  ])

  return {
    success: true,
    tenant,
    operatorCount,
    activeRoutesCount,
    activeTripsCount,
    isDemo
  }
}

/**
 * Resolve operator listing for ParkHub marketplace
 * GAP: Using MVM vendors as transport operators. No dedicated operator model.
 * Wave J.4: Refactored to use TenantContextResolver
 */
export async function resolveParkHubOperators(
  tenantSlug: string
): Promise<ParkHubOperatorListResult | ResolutionFailure> {
  const result = await TenantContextResolver.resolveForParkHub(tenantSlug)
  
  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    if (result.reason === 'module_disabled') {
      return { success: false, reason: 'parkhub_not_enabled' }
    }
    return { success: false, reason: 'tenant_inactive' }
  }

  const tenant = contextToParkHubTenant(result.context)
  const isDemo = result.context.isDemo

  const vendors = await prisma.mvm_vendor.findMany({
    where: {
      tenantId: tenant.id,
      status: 'APPROVED'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      isVerified: true,
      averageRating: true,
      reviewCount: true
    },
    orderBy: [
      { isVerified: 'desc' },
      { averageRating: 'desc' },
      { name: 'asc' }
    ]
  })

  const operators: ParkHubOperator[] = await Promise.all(
    vendors.map(async (vendor) => {
      const [activeRoutesCount, activeTripsCount] = await Promise.all([
        prisma.park_route.count({
          where: {
            tenantId: tenant.id,
            parkId: vendor.id,
            isActive: true
          }
        }),
        prisma.park_trip.count({
          where: {
            tenantId: tenant.id,
            status: { in: ['SCHEDULED', 'BOARDING', 'READY_TO_DEPART'] }
          }
        })
      ])

      return {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        description: vendor.description,
        logo: vendor.logo,
        isVerified: vendor.isVerified,
        averageRating: vendor.averageRating?.toNumber() ?? null,
        totalRatings: vendor.reviewCount,
        activeRoutesCount,
        activeTripsCount
      }
    })
  )

  return {
    success: true,
    tenant,
    operators,
    isDemo
  }
}

/**
 * Resolve single operator profile
 * Wave J.4: Refactored to use TenantContextResolver
 */
export async function resolveParkHubOperator(
  tenantSlug: string,
  operatorSlug: string
): Promise<ParkHubOperatorDetailResult | ResolutionFailure> {
  const result = await TenantContextResolver.resolveForParkHub(tenantSlug)
  
  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    if (result.reason === 'module_disabled') {
      return { success: false, reason: 'parkhub_not_enabled' }
    }
    return { success: false, reason: 'tenant_inactive' }
  }

  const tenant = contextToParkHubTenant(result.context)
  const isDemo = result.context.isDemo

  const vendor = await prisma.mvm_vendor.findFirst({
    where: {
      tenantId: tenant.id,
      slug: operatorSlug,
      status: 'APPROVED'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      isVerified: true,
      averageRating: true,
      reviewCount: true
    }
  })

  if (!vendor) {
    return { success: false, reason: 'operator_not_found' }
  }

  const [routes, activeTripsCount] = await Promise.all([
    prisma.park_route.findMany({
      where: {
        tenantId: tenant.id,
        parkId: vendor.id,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    }),
    prisma.park_trip.count({
      where: {
        tenantId: tenant.id,
        status: { in: ['SCHEDULED', 'BOARDING', 'READY_TO_DEPART'] }
      }
    })
  ])

  const upcomingTrips = await prisma.park_trip.findMany({
    where: {
      tenantId: tenant.id,
      routeId: { in: routes.map(r => r.id) },
      status: { in: ['SCHEDULED', 'BOARDING', 'READY_TO_DEPART'] },
      availableSeats: { gt: 0 }
    },
    orderBy: [
      { scheduledDeparture: 'asc' },
      { createdAt: 'asc' }
    ],
    take: 10
  })

  const routeMap = new Map(routes.map(r => [r.id, r]))

  const operator: ParkHubOperator = {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    description: vendor.description,
    logo: vendor.logo,
    isVerified: vendor.isVerified,
    averageRating: vendor.averageRating?.toNumber() ?? null,
    totalRatings: vendor.reviewCount,
    activeRoutesCount: routes.length,
    activeTripsCount
  }

  return {
    success: true,
    tenant,
    operator,
    routes: routes.map(r => ({
      id: r.id,
      name: r.name,
      shortName: r.shortName,
      origin: r.origin,
      destination: r.destination,
      distanceKm: r.distanceKm,
      estimatedDurationMinutes: r.estimatedDurationMinutes,
      basePrice: Number(r.basePrice),
      isActive: r.isActive
    })),
    upcomingTrips: upcomingTrips.map(t => {
      const route = routeMap.get(t.routeId)
      return {
        id: t.id,
        tripNumber: t.tripNumber,
        routeId: t.routeId,
        routeName: route?.name || 'Unknown Route',
        origin: route?.origin || 'Unknown',
        destination: route?.destination || 'Unknown',
        status: t.status,
        departureMode: t.departureMode,
        scheduledDeparture: t.scheduledDeparture,
        totalSeats: t.totalSeats,
        bookedSeats: t.bookedSeats,
        availableSeats: t.availableSeats,
        currentPrice: Number(t.currentPrice)
      }
    }),
    isDemo
  }
}

/**
 * Resolve public routes browser
 * Shows all routes across all operators
 * Wave J.4: Refactored to use TenantContextResolver
 */
export async function resolveParkHubRoutes(
  tenantSlug: string
): Promise<ParkHubRoutesResult | ResolutionFailure> {
  const result = await TenantContextResolver.resolveForParkHub(tenantSlug)
  
  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    if (result.reason === 'module_disabled') {
      return { success: false, reason: 'parkhub_not_enabled' }
    }
    return { success: false, reason: 'tenant_inactive' }
  }

  const tenant = contextToParkHubTenant(result.context)
  const isDemo = result.context.isDemo

  const routes = await prisma.park_route.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true
    },
    orderBy: [
      { origin: 'asc' },
      { destination: 'asc' }
    ]
  })

  const parkIds = [...new Set(routes.map(r => r.parkId))]
  const vendors = await prisma.mvm_vendor.findMany({
    where: {
      id: { in: parkIds }
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  })

  const vendorMap = new Map(vendors.map(v => [v.id, v]))

  return {
    success: true,
    tenant,
    routes: routes.map(r => {
      const vendor = vendorMap.get(r.parkId)
      return {
        id: r.id,
        name: r.name,
        shortName: r.shortName,
        origin: r.origin,
        destination: r.destination,
        distanceKm: r.distanceKm,
        estimatedDurationMinutes: r.estimatedDurationMinutes,
        basePrice: Number(r.basePrice),
        isActive: r.isActive,
        operatorName: vendor?.name || 'Unknown Operator',
        operatorSlug: vendor?.slug || ''
      }
    }),
    isDemo
  }
}
