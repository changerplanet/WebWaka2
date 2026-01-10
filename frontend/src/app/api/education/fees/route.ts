/**
 * EDUCATION SUITE: Fees API Routes
 * 
 * STATUS: RE-ENABLED (v2-CLEAN)
 * 
 * Re-enabled as part of Phase 4A governance action.
 * Uses edu_fee_structure and edu_fee_assignment Prisma models.
 * 
 * IMPORTANT: Education owns fee facts; Billing Suite creates invoices.
 * Education NEVER handles money directly.
 * 
 * @module api/education/fees
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';
import {
  createFeeStructureEntity,
  createFeeAssignmentEntity,
  generateFeeAssignmentNumber,
  calculateTotalFees,
  validateFeeStructureInput,
  validateAssignFeeInput,
  isValidFeeAssignmentStatusTransition,
  calculatePaymentStatus,
  getFeeTypeLabel,
} from '@/lib/education';

// ============================================================================
// GET - Get fee structures and assignments
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'structures';

    switch (entity) {
      case 'structures': {
        const classId = searchParams.get('classId');
        const termId = searchParams.get('termId');
        const feeType = searchParams.get('feeType');
        const isActive = searchParams.get('isActive');

        const where: any = { tenantId };
        if (classId) where.classId = classId;
        if (termId) where.termId = termId;
        if (feeType) where.feeType = feeType;
        if (isActive !== null) where.isActive = isActive === 'true';

        const structures = await prisma.edu_fee_structure.findMany({
          where,
          include: {
            class: { select: { id: true, name: true } },
            term: { select: { id: true, name: true } },
            _count: { select: { feeAssignments: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, structures });
      }

      case 'assignments': {
        const studentId = searchParams.get('studentId');
        const feeStructureId = searchParams.get('feeStructureId');
        const status = searchParams.get('status');

        const where: any = { tenantId };
        if (studentId) where.studentId = studentId;
        if (feeStructureId) where.feeStructureId = feeStructureId;
        if (status) where.status = status;

        const assignments = await prisma.edu_fee_assignment.findMany({
          where,
          include: {
            student: { select: { id: true, fullName: true, studentId: true } },
            feeStructure: { select: { id: true, name: true, feeType: true, amount: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, assignments });
      }

      case 'student-summary': {
        const studentId = searchParams.get('studentId');
        if (!studentId) {
          return NextResponse.json({ error: 'studentId required' }, { status: 400 });
        }

        const assignments = await prisma.edu_fee_assignment.findMany({
          where: { tenantId, studentId },
          include: {
            feeStructure: { select: { name: true, feeType: true } },
          },
        });

        const summary = {
          totalAssigned: assignments.reduce((sum, a) => sum + Number(a.finalAmount), 0),
          totalPaid: assignments.reduce((sum, a) => sum + Number(a.amountPaid), 0),
          totalOutstanding: assignments.reduce((sum, a) => sum + Number(a.amountOutstanding), 0),
          byStatus: {
            pending: assignments.filter(a => a.status === 'PENDING').length,
            billed: assignments.filter(a => a.status === 'BILLED').length,
            partiallyPaid: assignments.filter(a => a.status === 'PARTIALLY_PAID').length,
            paid: assignments.filter(a => a.status === 'PAID').length,
          },
        };

        return NextResponse.json({ success: true, summary, assignments });
      }

      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education Fees API] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create fee structures and assignments
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const body = await request.json();
    const { action = 'create-structure' } = body;

    switch (action) {
      case 'create-structure': {
        const input = {
          tenantId,
          platformInstanceId: body.platformInstanceId,
          classId: body.classId,
          termId: body.termId,
          name: body.name,
          feeType: body.feeType,
          description: body.description,
          amount: body.amount,
          allowInstallments: body.allowInstallments,
          installmentCount: body.installmentCount,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          gracePeriodDays: body.gracePeriodDays,
          lateFeeAmount: body.lateFeeAmount,
          lateFeePercent: body.lateFeePercent,
        };

        const validation = validateFeeStructureInput(input);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.errors.join(', ') },
            { status: 400 }
          );
        }

        const entity = createFeeStructureEntity(input);

        const structure = await (prisma.edu_fee_structure.create as any)({
          data: entity,
        });

        return NextResponse.json({ success: true, structureId: structure.id });
      }

      case 'assign-fee': {
        const { studentId, feeStructureId, discountAmount, discountReason, dueDate, notes } = body;

        const input = {
          tenantId,
          studentId,
          feeStructureId,
          discountAmount,
          discountReason,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes,
        };

        const validation = validateAssignFeeInput(input);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.errors.join(', ') },
            { status: 400 }
          );
        }

        // Get fee structure
        const feeStructure = await prisma.edu_fee_structure.findFirst({
          where: { id: feeStructureId, tenantId },
        });

        if (!feeStructure) {
          return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
        }

        // Generate assignment number
        const year = new Date().getFullYear();
        const count = await prisma.edu_fee_assignment.count({ where: { tenantId } });
        const assignmentNumber = generateFeeAssignmentNumber(year, count + 1);

        const entity = createFeeAssignmentEntity(input, feeStructure as any, assignmentNumber);

        const assignment = await (prisma.edu_fee_assignment.create as any)({
          data: entity,
        });

        return NextResponse.json({ success: true, assignmentId: assignment.id, assignmentNumber });
      }

      case 'bulk-assign': {
        const { feeStructureId, studentIds, discountAmount, discountReason } = body;

        if (!feeStructureId || !studentIds?.length) {
          return NextResponse.json(
            { error: 'feeStructureId and studentIds array required' },
            { status: 400 }
          );
        }

        const feeStructure = await prisma.edu_fee_structure.findFirst({
          where: { id: feeStructureId, tenantId },
        });

        if (!feeStructure) {
          return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
        }

        const year = new Date().getFullYear();
        let count = await prisma.edu_fee_assignment.count({ where: { tenantId } });

        const assignments = await prisma.$transaction(
          studentIds.map((studentId: string) => {
            count++;
            const assignmentNumber = generateFeeAssignmentNumber(year, count);
            const entity = createFeeAssignmentEntity(
              { tenantId, studentId, feeStructureId, discountAmount, discountReason },
              feeStructure as any,
              assignmentNumber
            );
            return (prisma.edu_fee_assignment.create as any)({ data: entity });
          })
        );

        return NextResponse.json({
          success: true,
          count: assignments.length,
          ids: assignments.map((a: any) => a.id),
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education Fees API] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update fee structures and assignments
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const body = await request.json();
    const { action = 'update-structure' } = body;

    switch (action) {
      case 'update-structure': {
        const { structureId, ...updates } = body;

        if (!structureId) {
          return NextResponse.json({ error: 'structureId required' }, { status: 400 });
        }

        const existing = await prisma.edu_fee_structure.findFirst({
          where: { id: structureId, tenantId },
        });

        if (!existing) {
          return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
        }

        const updated = await prisma.edu_fee_structure.update({
          where: { id: structureId },
          data: {
            name: updates.name,
            description: updates.description,
            amount: updates.amount,
            dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
            isActive: updates.isActive,
          },
        });

        return NextResponse.json({ success: true, structure: updated });
      }

      case 'update-assignment': {
        const { assignmentId, discountAmount, discountReason, notes } = body;

        if (!assignmentId) {
          return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });
        }

        const existing = await prisma.edu_fee_assignment.findFirst({
          where: { id: assignmentId, tenantId },
          include: { feeStructure: true },
        });

        if (!existing) {
          return NextResponse.json({ error: 'Fee assignment not found' }, { status: 404 });
        }

        // Recalculate final amount if discount changed
        const newDiscount = discountAmount ?? Number(existing.discountAmount);
        const finalAmount = Number(existing.originalAmount) - newDiscount;
        const amountOutstanding = finalAmount - Number(existing.amountPaid);

        const updated = await prisma.edu_fee_assignment.update({
          where: { id: assignmentId },
          data: {
            discountAmount: newDiscount,
            discountReason: discountReason ?? existing.discountReason,
            finalAmount,
            amountOutstanding,
            notes: notes ?? existing.notes,
          },
        });

        return NextResponse.json({ success: true, assignment: updated });
      }

      case 'update-payment-status': {
        // Called by Billing Suite to update payment tracking
        const { assignmentId, amountPaid, billingInvoiceId, billingInvoiceRef } = body;

        if (!assignmentId) {
          return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });
        }

        const existing = await prisma.edu_fee_assignment.findFirst({
          where: { id: assignmentId, tenantId },
        });

        if (!existing) {
          return NextResponse.json({ error: 'Fee assignment not found' }, { status: 404 });
        }

        const newAmountPaid = amountPaid ?? Number(existing.amountPaid);
        const newStatus = calculatePaymentStatus(newAmountPaid, Number(existing.finalAmount));
        const amountOutstanding = Number(existing.finalAmount) - newAmountPaid;

        const updated = await prisma.edu_fee_assignment.update({
          where: { id: assignmentId },
          data: {
            amountPaid: newAmountPaid,
            amountOutstanding,
            status: newStatus,
            billingInvoiceId: billingInvoiceId ?? existing.billingInvoiceId,
            billingInvoiceRef: billingInvoiceRef ?? existing.billingInvoiceRef,
            lastPaymentDate: amountPaid ? new Date() : existing.lastPaymentDate,
          },
        });

        return NextResponse.json({ success: true, assignment: updated });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education Fees API] PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete fee structures (soft) or cancel assignments
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'structure';
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    switch (entity) {
      case 'structure': {
        // Soft delete - just deactivate
        const existing = await prisma.edu_fee_structure.findFirst({
          where: { id, tenantId },
        });

        if (!existing) {
          return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
        }

        await prisma.edu_fee_structure.update({
          where: { id },
          data: { isActive: false },
        });

        return NextResponse.json({ success: true, message: 'Fee structure deactivated' });
      }

      case 'assignment': {
        // Cancel assignment - only if not yet paid
        const existing = await prisma.edu_fee_assignment.findFirst({
          where: { id, tenantId },
        });

        if (!existing) {
          return NextResponse.json({ error: 'Fee assignment not found' }, { status: 404 });
        }

        if (existing.status === 'PAID' || existing.status === 'PARTIALLY_PAID') {
          return NextResponse.json(
            { error: 'Cannot cancel an assignment that has payments' },
            { status: 400 }
          );
        }

        await prisma.edu_fee_assignment.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        return NextResponse.json({ success: true, message: 'Fee assignment cancelled' });
      }

      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education Fees API] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
