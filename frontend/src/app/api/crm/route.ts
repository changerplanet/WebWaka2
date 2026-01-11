/**
 * MODULE 3: CRM & Customer Engagement
 * CRM Initialization & Configuration API
 * 
 * POST /api/crm/initialize - Initialize CRM module for tenant
 * GET /api/crm/config - Get CRM configuration
 * PUT /api/crm/config - Update CRM configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';
import { SegmentationService } from '@/lib/crm/segmentation-service';
import { LoyaltyService } from '@/lib/crm/loyalty-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const config = await prisma.crm_configurations.findUnique({
      where: { tenantId: session.activeTenantId },
    });

    if (!config) {
      return NextResponse.json({
        initialized: false,
        message: 'CRM module not initialized. Call POST /api/crm/initialize first.',
      });
    }

    return NextResponse.json({
      initialized: true,
      config,
    });
  } catch (error) {
    console.error('[CRM API] Get config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const body = await request.json();
    const { action } = body;

    if (action === 'initialize') {
      // Check if already initialized
      const existing = await prisma.crm_configurations.findUnique({
        where: { tenantId: session.activeTenantId },
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'CRM module already initialized',
          action: 'exists',
        });
      }

      // Initialize default segments
      const segmentResult = await SegmentationService.initializeDefaults(
        session.activeTenantId,
        session.user.id
      );

      // Initialize loyalty program if requested
      let loyaltyResult = null;
      if (body.initializeLoyalty) {
        loyaltyResult = await LoyaltyService.initialize(
          session.activeTenantId,
          {
            name: body.loyaltyProgramName || 'Customer Rewards',
            description: 'Earn points on every purchase',
            pointsName: body.pointsName || 'Points',
            pointsSymbol: body.pointsSymbol || 'pts',
            pointsPerCurrency: body.pointsPerCurrency || 1,
          },
          session.user.id
        );
      }

      // Create configuration
      const config = await prisma.crm_configurations.create({
        data: {
          tenantId: session.activeTenantId,
          loyaltyEnabled: !!loyaltyResult,
          loyaltyProgramId: loyaltyResult?.program?.id,
          campaignsEnabled: body.enableCampaigns || false,
          smsEnabled: body.smsEnabled ?? true,
          emailEnabled: body.emailEnabled ?? true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'CRM module initialized successfully',
        action: 'created',
        config,
        segments: segmentResult,
        loyalty: loyaltyResult,
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "initialize" to set up CRM.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[CRM API] Initialize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const body = await request.json();

    const config = await prisma.crm_configurations.upsert({
      where: { tenantId: session.activeTenantId },
      create: {
        tenantId: session.activeTenantId,
        ...body,
      },
      update: body,
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[CRM API] Update config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
