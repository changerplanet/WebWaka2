/**
 * SITES & FUNNELS: Seed Templates API
 * 
 * Seeds template categories and starter templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { seedStarterTemplates, seedTemplateCategories } from '@/lib/sites-funnels/template-service';

export async function POST(request: NextRequest) {
  try {
    // Seed categories first
    await seedTemplateCategories();
    
    // Seed starter templates
    await seedStarterTemplates();
    
    return NextResponse.json({
      success: true,
      message: 'Templates seeded successfully',
    });
  } catch (error: any) {
    console.error('Seed templates error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed templates' },
      { status: 500 }
    );
  }
}
