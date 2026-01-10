/**
 * LEGAL PRACTICE SUITE — Documents API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createDocument, 
  getDocuments, 
  getDocumentStats,
  type CreateDocumentInput,
  type DocumentFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/documents
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Stats endpoint
    if (searchParams.get('stats') === 'true') {
      const matterId = searchParams.get('matterId') || undefined;
      const stats = await getDocumentStats(tenantId, matterId);
      return NextResponse.json(stats);
    }

    const filters: DocumentFilters = {
      matterId: searchParams.get('matterId') || undefined,
      category: searchParams.get('category') || undefined,
      isEvidence: searchParams.get('isEvidence') === 'true' ? true : searchParams.get('isEvidence') === 'false' ? false : undefined,
      isConfidential: searchParams.get('isConfidential') === 'true' ? true : searchParams.get('isConfidential') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getDocuments(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/documents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/documents
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateDocumentInput = await request.json();

    if (!body.matterId || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, title' },
        { status: 400 }
      );
    }

    const document = await createDocument(tenantId, body);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/documents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
