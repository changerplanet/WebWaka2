/**
 * SITES & FUNNELS: Builder Forms API
 * 
 * GET /api/sites-funnels/builder/forms - Get available forms for Form Block
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireTenantRole } from '@/lib/auth/authorization';
import { getAvailableForms } from '@/lib/sites-funnels/builder';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const authCheck = await requireTenantRole(session.user.id, tenantId, ['PARTNER_ADMIN', 'PARTNER_EDITOR']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const forms = await getAvailableForms(tenantId);

    return NextResponse.json({ forms });
  } catch (error: any) {
    console.error('GET /api/sites-funnels/builder/forms error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
