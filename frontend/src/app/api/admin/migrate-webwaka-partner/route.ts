/**
 * PHASE 4A: WebWaka Internal Partner Migration
 * 
 * POST /api/admin/migrate-webwaka-partner
 * 
 * Creates the WebWaka Digital Services partner account and
 * assigns orphan tenants (without partner) to it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

const WEBWAKA_PARTNER_SLUG = 'webwaka-digital-services'

export async function POST(request: NextRequest) {
  try {
    const results = {
      webwakaPartnerCreated: false,
      webwakaPartnerId: '',
      orphanTenantsFound: 0,
      orphanTenantsAssigned: 0,
      errors: [] as string[],
    }
    
    // 1. Get or create WebWaka internal partner
    let webwakaPartner = await prisma.partner.findUnique({
      where: { slug: WEBWAKA_PARTNER_SLUG }
    })
    
    if (!webwakaPartner) {
      webwakaPartner = await prisma.partner.create({
        data: {
          id: uuidv4(),
          name: 'WebWaka Digital Services',
          slug: WEBWAKA_PARTNER_SLUG,
          status: 'ACTIVE',
          email: 'partners@webwaka.com',
          metadata: {
            isInternalPartner: true,
            description: 'WebWaka internal partner for demos, pilots, and government projects. No special privileges - operates as a normal partner.',
            createdBy: 'PHASE_4A_MIGRATION',
            createdAt: new Date().toISOString(),
            purpose: 'Demos, pilots, government projects, direct enterprise deals',
          }
        }
      })
      results.webwakaPartnerCreated = true
    }
    
    results.webwakaPartnerId = webwakaPartner.id
    
    // 2. Find tenants without partner attribution
    const tenantsWithoutPartner = await prisma.tenant.findMany({
      where: {
        partnerReferral: null
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    })
    
    results.orphanTenantsFound = tenantsWithoutPartner.length
    
    // 3. Assign orphan tenants to WebWaka partner
    for (const tenant of tenantsWithoutPartner) {
      try {
        // Check if referral already exists (shouldn't happen, but safety check)
        const existingReferral = await prisma.partnerReferral.findFirst({
          where: { tenantId: tenant.id }
        })
        
        if (!existingReferral) {
          await prisma.partnerReferral.create({
            data: {
              id: uuidv4(),
              partnerId: webwakaPartner.id,
              tenantId: tenant.id,
              attributionMethod: 'MANUAL_ASSIGNMENT',
              referralSource: 'phase_4a_migration',
              metadata: {
                migratedAt: new Date().toISOString(),
                reason: 'Orphan tenant assigned to WebWaka internal partner',
                originalStatus: 'no_partner',
              }
            }
          })
          results.orphanTenantsAssigned++
        }
      } catch (err) {
        results.errors.push(`Failed to assign tenant ${tenant.slug}: ${(err as Error).message}`)
      }
    }
    
    // 4. Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PARTNER_CREATED',
        actorId: 'SYSTEM',
        actorEmail: 'system@webwaka.com',
        targetType: 'Partner',
        targetId: webwakaPartner.id,
        metadata: {
          ...results,
          timestamp: new Date().toISOString(),
          phase: 'PHASE_4A_WEBWAKA_PARTNER_MIGRATION',
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'WebWaka internal partner migration completed',
      ...results,
    })
  } catch (error) {
    console.error('WebWaka partner migration failed:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
