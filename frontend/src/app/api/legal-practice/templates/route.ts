/**
 * LEGAL PRACTICE SUITE — Matter Templates API
 * GET: Retrieve all templates or filter by type
 * POST: Create a matter from a template
 */

import { NextResponse } from 'next/server';
import {
  getMatterTemplates,
  getTemplatesByType,
  getTemplateById,
  createMatterFromTemplate,
  getTemplateStats,
  type CreateMatterFromTemplateInput,
} from '@/lib/legal-practice/template-service';
import { leg_MatterType } from '@prisma/client';

// GET /api/legal-practice/templates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matterType = searchParams.get('matterType') as leg_MatterType | null;
    const templateId = searchParams.get('templateId');
    const statsOnly = searchParams.get('stats') === 'true';

    // Return stats only
    if (statsOnly) {
      const stats = await getTemplateStats();
      return NextResponse.json(stats);
    }

    // Return single template
    if (templateId) {
      const template = await getTemplateById(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    // Filter by matter type
    if (matterType) {
      const templates = await getTemplatesByType(matterType);
      return NextResponse.json({ templates, total: templates.length });
    }

    // Return all templates
    const templates = await getMatterTemplates();
    return NextResponse.json({ templates, total: templates.length });
  } catch (error) {
    console.error('GET /api/legal-practice/templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/templates - Create matter from template
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id') || tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }
    
    if (!platformInstanceId) {
      return NextResponse.json({ error: 'Platform instance ID required' }, { status: 400 });
    }

    const body: CreateMatterFromTemplateInput = await request.json();

    if (!body.templateId || !body.clientId || !body.clientName || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, clientId, clientName, title' },
        { status: 400 }
      );
    }

    const result = await createMatterFromTemplate(tenantId, platformInstanceId, body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
