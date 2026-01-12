export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Dues API
 * 
 * GET - List dues records with filters
 * POST - Create dues, record payments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDuesRecords,
  getDuesById,
  createDuesRecord,
  recordPayment,
  waiveDues,
  generateMonthlyDues,
  getOverdueConstituents,
  getDuesStats,
} from '@/lib/civic/dues-service';
import {
  validatePaymentStatus,
  validateDuesType,
} from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const { searchParams } = new URL(request.url);
    
    // Check for single dues fetch
    const id = searchParams.get('id');
    if (id) {
      const dues = await getDuesById(tenantId, id);
      if (!dues) {
        return NextResponse.json(
          { success: false, error: 'Dues record not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, dues });
    }
    
    // Check for overdue list
    const listType = searchParams.get('list');
    if (listType === 'overdue') {
      const overdue = await getOverdueConstituents(tenantId);
      return NextResponse.json({ success: true, overdue });
    }
    
    // Check for stats only
    if (searchParams.get('statsOnly') === 'true') {
      const stats = await getDuesStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    // Get list with filters
    // Phase 10C: Using enum validators
    const options = {
      constituentId: searchParams.get('constituentId') || undefined,
      status: validatePaymentStatus(searchParams.get('status')),
      duesType: validateDuesType(searchParams.get('duesType')),
      period: searchParams.get('period') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getDuesRecords(tenantId, options);
    
    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });
  } catch (error) {
    console.error('Dues API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dues records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'record-payment':
        if (!data.id || !data.amount) {
          return NextResponse.json(
            { success: false, error: 'Dues ID and amount required' },
            { status: 400 }
          );
        }
        const paid = await recordPayment(tenantId, data.id, data.amount, data.receiptNumber);
        if (!paid) {
          return NextResponse.json(
            { success: false, error: 'Dues record not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          dues: paid,
          message: 'Payment recorded successfully',
        });
        
      case 'waive':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Dues ID required' },
            { status: 400 }
          );
        }
        const waived = await waiveDues(tenantId, data.id, data.reason);
        if (!waived) {
          return NextResponse.json(
            { success: false, error: 'Dues record not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          dues: waived,
          message: 'Dues waived successfully',
        });
        
      case 'generate-monthly':
        if (!data.duesType || !data.amount || !data.period) {
          return NextResponse.json(
            { success: false, error: 'Dues type, amount, and period required' },
            { status: 400 }
          );
        }
        const generated = await generateMonthlyDues(
          tenantId,
          data.duesType,
          data.amount,
          data.period
        );
        return NextResponse.json({
          success: true,
          ...generated,
          message: `Generated ${generated.created} dues records, skipped ${generated.skipped} existing`,
        });
        
      default:
        // Create new dues record
        const dues = await createDuesRecord(tenantId, data);
        return NextResponse.json({
          success: true,
          dues,
          message: 'Dues record created successfully',
        }, { status: 201 });
    }
  } catch (error) {
    console.error('Dues API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process dues request' },
      { status: 500 }
    );
  }
}
