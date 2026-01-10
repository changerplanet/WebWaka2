/**
 * LEGAL PRACTICE SUITE — Document Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getDocumentById, 
  updateDocument,
  markAsEvidence,
  deleteDocument,
  type UpdateDocumentInput 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/documents/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocumentById(tenantId, id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('GET /api/legal-practice/documents/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-practice/documents/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateDocumentInput = await request.json();

    const document = await updateDocument(tenantId, id, body);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('PATCH /api/legal-practice/documents/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/documents/[id]?action=markEvidence
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'markEvidence') {
      const body = await request.json();
      if (!body.exhibitNumber) {
        return NextResponse.json({ error: 'exhibitNumber required' }, { status: 400 });
      }
      const document = await markAsEvidence(tenantId, id, body.exhibitNumber, body.exhibitLabel);
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json(document);
    }

    return NextResponse.json({ error: 'Invalid action. Use: markEvidence' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/legal-practice/documents/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal-practice/documents/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteDocument(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('DELETE /api/legal-practice/documents/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
