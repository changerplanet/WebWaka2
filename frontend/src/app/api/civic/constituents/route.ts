/**
 * CIVIC SUITE: Constituents API
 * 
 * GET - List constituents with filters
 * POST - Create new constituent
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConstituents,
  getConstituentById,
  createConstituent,
  updateConstituent,
  updateMembershipStatus,
  getWards,
  getZones,
} from '@/lib/civic/constituent-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const { searchParams } = new URL(request.url);
    
    // Check for single constituent fetch
    const id = searchParams.get('id');
    if (id) {
      const constituent = await getConstituentById(tenantId, id);
      if (!constituent) {
        return NextResponse.json(
          { success: false, error: 'Constituent not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, constituent });
    }
    
    // Check for ward/zone list
    const listType = searchParams.get('list');
    if (listType === 'wards') {
      const wards = await getWards(tenantId);
      return NextResponse.json({ success: true, wards });
    }
    if (listType === 'zones') {
      const zones = await getZones(tenantId);
      return NextResponse.json({ success: true, zones });
    }
    
    // Get list with filters
    const options = {
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      ward: searchParams.get('ward') || undefined,
      zone: searchParams.get('zone') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getConstituents(tenantId, options);
    
    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });
  } catch (error) {
    console.error('Constituents API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch constituents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const body = await request.json();
    const { action, ...data } = body;
    
    if (action === 'update' && data.id) {
      const updated = await updateConstituent(tenantId, data.id, data);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Constituent not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, constituent: updated });
    }
    
    if (action === 'update-status' && data.id && data.status) {
      const updated = await updateMembershipStatus(tenantId, data.id, data.status);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Constituent not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, constituent: updated });
    }
    
    // Create new constituent
    const constituent = await createConstituent(tenantId, data);
    
    return NextResponse.json({
      success: true,
      constituent,
      message: 'Constituent registered successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Constituents API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create constituent' },
      { status: 500 }
    );
  }
}
