export const dynamic = 'force-dynamic'

/**
 * MODULE 14: AI & AUTOMATION
 * API Routes
 * 
 * Advisory-first, human control always.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAIModuleStatus,
  validateAIModule,
  AI_MODULE,
} from '@/lib/ai/config-service';
import {
  generateInsight,
  getInsight,
  listInsights,
  acknowledgeInsight,
  dismissInsight,
  generateSampleSalesTrendInsight,
  generateSampleInventoryRiskInsight,
} from '@/lib/ai/insights-service';
import {
  createRecommendation,
  getRecommendation,
  listRecommendations,
  acceptRecommendation,
  rejectRecommendation,
  generateSampleReorderRecommendation,
} from '@/lib/ai/recommendations-service';
import {
  createAutomationRule,
  getAutomationRule,
  listAutomationRules,
  updateAutomationRule,
  deactivateRule,
  triggerAutomationRule,
  listAutomationRuns,
  approveRun,
  rejectRun,
  ACTION_TYPES,
  TRIGGER_TYPES,
} from '@/lib/ai/automation-service';
import { getAIEvents } from '@/lib/ai/event-service';

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    const tenantId = searchParams.get('tenantId');
    
    switch (action) {
      // =====================================================================
      // MODULE STATUS
      // =====================================================================
      case 'status': {
        const status = await getAIModuleStatus(tenantId || undefined);
        return NextResponse.json(status);
      }
      
      case 'manifest': {
        return NextResponse.json(AI_MODULE);
      }
      
      case 'validate': {
        const validation = await validateAIModule();
        return NextResponse.json(validation);
      }
      
      case 'action-types': {
        return NextResponse.json({ actionTypes: ACTION_TYPES, triggerTypes: TRIGGER_TYPES });
      }
      
      // =====================================================================
      // INSIGHTS
      // =====================================================================
      case 'insights': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const insightType = searchParams.get('insightType') || undefined;
        const severity = searchParams.get('severity') || undefined;
        const status = searchParams.get('status') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listInsights({
          tenantId,
          insightType,
          severity,
          status,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      case 'insight': {
        const insightId = searchParams.get('insightId');
        if (!insightId) {
          return NextResponse.json({ error: 'insightId required' }, { status: 400 });
        }
        const insight = await getInsight(insightId);
        return NextResponse.json({ insight });
      }
      
      // =====================================================================
      // RECOMMENDATIONS
      // =====================================================================
      case 'recommendations': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const recommendationType = searchParams.get('recommendationType') || undefined;
        const status = searchParams.get('status') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listRecommendations({
          tenantId,
          recommendationType,
          status,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      case 'recommendation': {
        const recommendationId = searchParams.get('recommendationId');
        if (!recommendationId) {
          return NextResponse.json({ error: 'recommendationId required' }, { status: 400 });
        }
        const recommendation = await getRecommendation(recommendationId);
        return NextResponse.json({ recommendation });
      }
      
      // =====================================================================
      // AUTOMATION RULES
      // =====================================================================
      case 'rules': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const triggerType = searchParams.get('triggerType') || undefined;
        const actionType = searchParams.get('actionType') || undefined;
        
        const rules = await listAutomationRules({
          tenantId,
          activeOnly,
          triggerType,
          actionType,
        });
        return NextResponse.json({ rules });
      }
      
      case 'rule': {
        const ruleId = searchParams.get('ruleId');
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId required' }, { status: 400 });
        }
        const rule = await getAutomationRule(ruleId);
        return NextResponse.json({ rule });
      }
      
      case 'runs': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const ruleId = searchParams.get('ruleId') || undefined;
        const status = searchParams.get('status') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listAutomationRuns({
          tenantId,
          ruleId,
          status,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // EVENTS
      // =====================================================================
      case 'events': {
        const eventType = searchParams.get('eventType') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const result = await getAIEvents({
          tenantId: tenantId || undefined,
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
    console.error('AI API GET error:', error);
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
      // INSIGHTS
      // =====================================================================
      case 'generate-insight': {
        const result = await generateInsight(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'acknowledge-insight': {
        const { insightId, acknowledgedBy } = body;
        if (!insightId || !acknowledgedBy) {
          return NextResponse.json(
            { error: 'insightId and acknowledgedBy required' },
            { status: 400 }
          );
        }
        const result = await acknowledgeInsight(insightId, acknowledgedBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'dismiss-insight': {
        const { insightId } = body;
        if (!insightId) {
          return NextResponse.json({ error: 'insightId required' }, { status: 400 });
        }
        const result = await dismissInsight(insightId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'generate-sample-insights': {
        const { tenantId } = body;
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const [salesInsight, inventoryInsight] = await Promise.all([
          generateSampleSalesTrendInsight(tenantId),
          generateSampleInventoryRiskInsight(tenantId),
        ]);
        return NextResponse.json({
          success: true,
          insights: [salesInsight.insight, inventoryInsight.insight],
        });
      }
      
      // =====================================================================
      // RECOMMENDATIONS
      // =====================================================================
      case 'create-recommendation': {
        const result = await createRecommendation(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'accept-recommendation': {
        const { recommendationId, acceptedBy } = body;
        if (!recommendationId || !acceptedBy) {
          return NextResponse.json(
            { error: 'recommendationId and acceptedBy required' },
            { status: 400 }
          );
        }
        const result = await acceptRecommendation(recommendationId, acceptedBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'reject-recommendation': {
        const { recommendationId, rejectedBy, reason } = body;
        if (!recommendationId || !rejectedBy) {
          return NextResponse.json(
            { error: 'recommendationId and rejectedBy required' },
            { status: 400 }
          );
        }
        const result = await rejectRecommendation(recommendationId, rejectedBy, reason);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'generate-sample-recommendation': {
        const { tenantId } = body;
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const result = await generateSampleReorderRecommendation(tenantId);
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // AUTOMATION RULES
      // =====================================================================
      case 'create-rule': {
        const result = await createAutomationRule(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'update-rule': {
        const { ruleId, ...data } = body;
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId required' }, { status: 400 });
        }
        const result = await updateAutomationRule(ruleId, data);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'deactivate-rule': {
        const { ruleId } = body;
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId required' }, { status: 400 });
        }
        const result = await deactivateRule(ruleId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'trigger-rule': {
        const { ruleId, triggerData } = body;
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId required' }, { status: 400 });
        }
        const result = await triggerAutomationRule({
          ruleId,
          triggerData: triggerData || {},
        });
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'approve-run': {
        const { runId, approvedBy } = body;
        if (!runId || !approvedBy) {
          return NextResponse.json(
            { error: 'runId and approvedBy required' },
            { status: 400 }
          );
        }
        const result = await approveRun(runId, approvedBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'reject-run': {
        const { runId, rejectedBy } = body;
        if (!runId || !rejectedBy) {
          return NextResponse.json(
            { error: 'runId and rejectedBy required' },
            { status: 400 }
          );
        }
        const result = await rejectRun(runId, rejectedBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('AI API POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
