/**
 * Transactions List API
 * 
 * Phase E1.2: List and query transactions
 * 
 * GET /api/payments/transactions
 * 
 * Query parameters:
 * - tenantId: string (required)
 * - partnerId: string (optional)
 * - status: string | string[] (optional)
 * - provider: string (optional)
 * - customerEmail: string (optional)
 * - sourceModule: string (optional)
 * - sourceType: string (optional)
 * - sourceId: string (optional)
 * - fromDate: ISO date string (optional)
 * - toDate: ISO date string (optional)
 * - includeDemo: boolean (optional, default: false)
 * - limit: number (optional, default: 50)
 * - offset: number (optional, default: 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentExecutionService } from '@/lib/payment-execution'
import type { TransactionStatus } from '@/lib/payment-execution'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const statusParam = searchParams.get('status')
    let status: TransactionStatus | TransactionStatus[] | undefined
    
    if (statusParam) {
      if (statusParam.includes(',')) {
        status = statusParam.split(',') as TransactionStatus[]
      } else {
        status = statusParam as TransactionStatus
      }
    }
    
    const fromDateStr = searchParams.get('fromDate')
    const toDateStr = searchParams.get('toDate')
    
    const result = await PaymentExecutionService.listTransactions({
      tenantId,
      partnerId: searchParams.get('partnerId') || undefined,
      status,
      provider: searchParams.get('provider') || undefined,
      customerEmail: searchParams.get('customerEmail') || undefined,
      sourceModule: searchParams.get('sourceModule') || undefined,
      sourceType: searchParams.get('sourceType') || undefined,
      sourceId: searchParams.get('sourceId') || undefined,
      fromDate: fromDateStr ? new Date(fromDateStr) : undefined,
      toDate: toDateStr ? new Date(toDateStr) : undefined,
      includeDemo: searchParams.get('includeDemo') === 'true',
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10)
    })
    
    return NextResponse.json({
      success: true,
      transactions: result.transactions,
      total: result.total,
      limit: result.limit,
      offset: result.offset
    })
    
  } catch (error) {
    console.error('Transaction list error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list transactions' },
      { status: 500 }
    )
  }
}
