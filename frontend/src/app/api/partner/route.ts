export const dynamic = 'force-dynamic'

/**
 * MODULE 11: PARTNER & RESELLER PLATFORM
 * API Routes
 * 
 * Partners are NOT tenants - they operate in a parallel plane.
 * No tenant data access, no payment execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPartnerModuleStatus,
  validatePartnerModule,
  getPartnerConfiguration,
  updatePartnerConfiguration,
  PARTNER_MODULE,
} from '@/lib/partner/config-service';
import {
  createPartnerApplication,
  submitVerificationDocuments,
  approveVerification,
  rejectVerification,
  getPartner,
  listPartners,
  getPendingVerifications,
} from '@/lib/partner/onboarding-service';
import {
  createReferralLink,
  trackReferralClick,
  listPartnerReferralLinks,
  deactivateReferralLink,
  createAttribution,
  getAttributionByTenant,
  getAttributionsByPartner,
} from '@/lib/partner/referral-service';
import {
  createCommissionRule,
  listCommissionRules,
  getPartnerEarningsSummary,
  listCommissionRecords,
  markCommissionReadyForPayout,
} from '@/lib/partner/commission-service';
import {
  handleSubscriptionCreated,
  handleSubscriptionRenewed,
  handleSubscriptionUpgraded,
  getPartnerEvents,
} from '@/lib/partner/event-service';
import { getPartnerEntitlements } from '@/lib/partner/entitlements-service';

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    
    switch (action) {
      // =====================================================================
      // MODULE STATUS
      // =====================================================================
      case 'status': {
        const status = await getPartnerModuleStatus();
        return NextResponse.json(status);
      }
      
      case 'manifest': {
        return NextResponse.json(PARTNER_MODULE);
      }
      
      case 'validate': {
        const validation = await validatePartnerModule();
        return NextResponse.json(validation);
      }
      
      case 'config': {
        const config = await getPartnerConfiguration();
        return NextResponse.json({ config });
      }
      
      case 'entitlements': {
        const tenantId = searchParams.get('tenantId') || undefined;
        const entitlements = await getPartnerEntitlements(tenantId);
        return NextResponse.json({ entitlements });
      }
      
      // =====================================================================
      // PARTNER QUERIES
      // =====================================================================
      case 'partners': {
        const status = searchParams.get('status') as any;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listPartners({ status, search, page, limit });
        return NextResponse.json(result);
      }
      
      case 'partner': {
        const partnerId = searchParams.get('partnerId');
        if (!partnerId) {
          return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }
        
        const partner = await getPartner(partnerId);
        if (!partner) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }
        
        return NextResponse.json({ partner });
      }
      
      case 'pending-verifications': {
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await getPendingVerifications(page, limit);
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // REFERRAL QUERIES
      // =====================================================================
      case 'referral-links': {
        const partnerId = searchParams.get('partnerId');
        if (!partnerId) {
          return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }
        
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const links = await listPartnerReferralLinks(partnerId, activeOnly);
        return NextResponse.json({ referralLinks: links });
      }
      
      case 'track-click': {
        const code = searchParams.get('code');
        if (!code) {
          return NextResponse.json({ error: 'code required' }, { status: 400 });
        }
        
        const result = await trackReferralClick(code);
        return NextResponse.json(result);
      }
      
      case 'attributions': {
        const partnerId = searchParams.get('partnerId');
        if (!partnerId) {
          return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }
        
        const status = searchParams.get('status') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await getAttributionsByPartner(partnerId, { status, page, limit });
        return NextResponse.json(result);
      }
      
      case 'attribution-by-tenant': {
        const tenantId = searchParams.get('tenantId');
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const attribution = await getAttributionByTenant(tenantId);
        return NextResponse.json({ attribution });
      }
      
      // =====================================================================
      // COMMISSION QUERIES
      // =====================================================================
      case 'commission-rules': {
        const partnerId = searchParams.get('partnerId');
        const planId = searchParams.get('planId') || undefined;
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        
        const rules = await listCommissionRules({
          partnerId: partnerId || undefined,
          planId,
          activeOnly,
        });
        return NextResponse.json({ rules });
      }
      
      case 'commissions': {
        const partnerId = searchParams.get('partnerId') || undefined;
        const attributionId = searchParams.get('attributionId') || undefined;
        const status = searchParams.get('status') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listCommissionRecords({
          partnerId,
          attributionId,
          status,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      case 'earnings-summary': {
        const partnerId = searchParams.get('partnerId');
        if (!partnerId) {
          return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }
        
        const summary = await getPartnerEarningsSummary(partnerId);
        return NextResponse.json({ summary });
      }
      
      // =====================================================================
      // EVENT QUERIES
      // =====================================================================
      case 'events': {
        const partnerId = searchParams.get('partnerId') || undefined;
        const eventType = searchParams.get('eventType') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const result = await getPartnerEvents({
          partnerId,
          eventType,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Partner API GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      // =====================================================================
      // CONFIGURATION
      // =====================================================================
      case 'update-config': {
        const config = await updatePartnerConfiguration(body.data || {});
        return NextResponse.json({ success: true, config });
      }
      
      // =====================================================================
      // PARTNER ONBOARDING
      // =====================================================================
      case 'create-partner': {
        const result = await createPartnerApplication(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'submit-verification': {
        const { partnerId, documentType, documentNumber, documentUrl } = body;
        
        if (!partnerId || !documentType || !documentNumber) {
          return NextResponse.json(
            { error: 'partnerId, documentType, and documentNumber required' },
            { status: 400 }
          );
        }
        
        const result = await submitVerificationDocuments({
          partnerId,
          documentType,
          documentNumber,
          documentUrl,
        });
        
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'approve-verification': {
        const { partnerId, approvedBy } = body;
        
        if (!partnerId || !approvedBy) {
          return NextResponse.json(
            { error: 'partnerId and approvedBy required' },
            { status: 400 }
          );
        }
        
        const result = await approveVerification(partnerId, approvedBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'reject-verification': {
        const { partnerId, rejectedBy, reason } = body;
        
        if (!partnerId || !rejectedBy || !reason) {
          return NextResponse.json(
            { error: 'partnerId, rejectedBy, and reason required' },
            { status: 400 }
          );
        }
        
        const result = await rejectVerification(partnerId, rejectedBy, reason);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // REFERRAL MANAGEMENT
      // =====================================================================
      case 'create-referral-link': {
        const { partnerId, name, destinationUrl, campaign, source, medium, expiresAt } = body;
        
        if (!partnerId) {
          return NextResponse.json(
            { error: 'partnerId required' },
            { status: 400 }
          );
        }
        
        const result = await createReferralLink({
          partnerId,
          name,
          destinationUrl,
          campaign,
          source,
          medium,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });
        
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'deactivate-referral-link': {
        const { linkId } = body;
        
        if (!linkId) {
          return NextResponse.json(
            { error: 'linkId required' },
            { status: 400 }
          );
        }
        
        const result = await deactivateReferralLink(linkId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'create-attribution': {
        const { partnerId, tenantId, tenantSlug, referralLinkId, utmSource, utmMedium, utmCampaign } = body;
        
        if (!partnerId || !tenantId) {
          return NextResponse.json(
            { error: 'partnerId and tenantId required' },
            { status: 400 }
          );
        }
        
        const result = await createAttribution({
          partnerId,
          tenantId,
          tenantSlug,
          referralLinkId,
          utmSource,
          utmMedium,
          utmCampaign,
        });
        
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      // =====================================================================
      // COMMISSION MANAGEMENT
      // =====================================================================
      case 'create-commission-rule': {
        const result = await createCommissionRule(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'mark-ready-for-payout': {
        const { commissionId } = body;
        
        if (!commissionId) {
          return NextResponse.json(
            { error: 'commissionId required' },
            { status: 400 }
          );
        }
        
        const result = await markCommissionReadyForPayout(commissionId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // EVENT PROCESSING
      // =====================================================================
      case 'process-subscription-created': {
        const result = await handleSubscriptionCreated(body);
        return NextResponse.json(result);
      }
      
      case 'process-subscription-renewed': {
        const result = await handleSubscriptionRenewed(body);
        return NextResponse.json(result);
      }
      
      case 'process-subscription-upgraded': {
        const result = await handleSubscriptionUpgraded(body);
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Partner API POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
