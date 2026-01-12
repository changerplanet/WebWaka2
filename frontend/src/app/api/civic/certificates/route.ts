export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Certificates API
 * 
 * GET - List certificates, verify certificates
 * POST - Request, approve, issue, reject certificates
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCertificates,
  getCertificateById,
  requestCertificate,
  approveCertificate,
  issueCertificate,
  rejectCertificate,
  revokeCertificate,
  verifyCertificate,
  getCertificateStats,
} from '@/lib/civic/certificate-service';
import {
  validateCertificateStatus,
  validateCertificateType,
} from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const { searchParams } = new URL(request.url);
    
    // Check for verification
    const verifyCode = searchParams.get('verify');
    if (verifyCode) {
      const result = await verifyCertificate(verifyCode);
      return NextResponse.json({ success: true, ...result });
    }
    
    // Check for single certificate fetch
    const id = searchParams.get('id');
    if (id) {
      const certificate = await getCertificateById(tenantId, id);
      if (!certificate) {
        return NextResponse.json(
          { success: false, error: 'Certificate not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, certificate });
    }
    
    // Check for stats only
    if (searchParams.get('statsOnly') === 'true') {
      const stats = await getCertificateStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    // Get list with filters
    // Phase 10C: Using enum validators
    const options = {
      status: validateCertificateStatus(searchParams.get('status')),
      type: validateCertificateType(searchParams.get('type')),
      constituentId: searchParams.get('constituentId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getCertificates(tenantId, options);
    
    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });
  } catch (error) {
    console.error('Certificates API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificates' },
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
      case 'request':
        if (!data.constituentId || !data.certificateType) {
          return NextResponse.json(
            { success: false, error: 'Constituent ID and certificate type required' },
            { status: 400 }
          );
        }
        const requested = await requestCertificate(tenantId, {
          constituentId: data.constituentId,
          certificateType: data.certificateType,
          purpose: data.purpose,
        });
        return NextResponse.json({
          success: true,
          certificate: requested,
          message: 'Certificate request submitted successfully',
        }, { status: 201 });
        
      case 'approve':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Certificate ID required' },
            { status: 400 }
          );
        }
        const approved = await approveCertificate(tenantId, data.id);
        if (!approved) {
          return NextResponse.json(
            { success: false, error: 'Certificate not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          certificate: approved,
          message: 'Certificate approved',
        });
        
      case 'issue':
        if (!data.id || !data.issuedBy) {
          return NextResponse.json(
            { success: false, error: 'Certificate ID and issuer required' },
            { status: 400 }
          );
        }
        const issued = await issueCertificate(tenantId, data.id, data.issuedBy);
        if (!issued) {
          return NextResponse.json(
            { success: false, error: 'Certificate not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          certificate: issued,
          message: 'Certificate issued successfully',
        });
        
      case 'reject':
        if (!data.id || !data.reason) {
          return NextResponse.json(
            { success: false, error: 'Certificate ID and rejection reason required' },
            { status: 400 }
          );
        }
        const rejected = await rejectCertificate(tenantId, data.id, data.reason);
        if (!rejected) {
          return NextResponse.json(
            { success: false, error: 'Certificate not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          certificate: rejected,
          message: 'Certificate request rejected',
        });
        
      case 'revoke':
        if (!data.id || !data.reason) {
          return NextResponse.json(
            { success: false, error: 'Certificate ID and revocation reason required' },
            { status: 400 }
          );
        }
        const revoked = await revokeCertificate(tenantId, data.id, data.reason);
        if (!revoked) {
          return NextResponse.json(
            { success: false, error: 'Certificate not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          certificate: revoked,
          message: 'Certificate revoked',
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: request, approve, issue, reject, revoke' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Certificates API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process certificate request' },
      { status: 500 }
    );
  }
}
