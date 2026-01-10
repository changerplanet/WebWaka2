/**
 * EDUCATION SUITE: Fees API Routes
 * 
 * STATUS: GOVERNANCE LOCKED (v2-FROZEN)
 * 
 * This route has been deactivated because it references a schema model
 * (contact) that does not exist in the Prisma schema.
 * 
 * Resolution requires:
 * - Proper Student/Guardian model design
 * - Governance approval for schema changes
 * - Migration planning
 * 
 * Deactivated: Phase 3C-1 (Contact Route Deactivation)
 */

import { NextRequest, NextResponse } from 'next/server';

const GOVERNANCE_RESPONSE = {
  success: false,
  error: 'Feature Locked',
  code: 'GOVERNANCE_LOCKED',
  message: 'This Education suite endpoint is currently locked pending schema approval. The underlying data model requires governance review before activation.',
  suite: 'education',
  endpoint: 'fees',
  status: 'v2-FROZEN'
};

/**
 * GET /api/education/fees
 * LOCKED - Pending schema approval
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(GOVERNANCE_RESPONSE, { status: 501 });
}

/**
 * POST /api/education/fees
 * LOCKED - Pending schema approval
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(GOVERNANCE_RESPONSE, { status: 501 });
}

/**
 * PUT /api/education/fees
 * LOCKED - Pending schema approval
 */
export async function PUT(request: NextRequest) {
  return NextResponse.json(GOVERNANCE_RESPONSE, { status: 501 });
}

/**
 * DELETE /api/education/fees
 * LOCKED - Pending schema approval
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json(GOVERNANCE_RESPONSE, { status: 501 });
}
