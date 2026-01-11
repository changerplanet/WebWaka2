export const dynamic = 'force-dynamic'

/**
 * PHASE 6: Business Presets API
 * 
 * GET - List all presets or get by type
 * POST - Get demo data for a business type
 * 
 * NO schema changes - config and labels only.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  BusinessType,
  BUSINESS_PRESETS,
  getAllPresets,
  getPreset,
  getPresetsByCategory,
  getPresetsByPhase,
} from '@/lib/business-presets/registry';
import { getDemoData } from '@/lib/business-presets/demo-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as BusinessType | null;
    const category = searchParams.get('category') as 'commerce' | 'services' | 'community' | null;
    const phase = searchParams.get('phase') as '6.1' | '6.2' | '6.3' | null;
    
    // Get single preset by type
    if (type) {
      const preset = getPreset(type);
      if (!preset) {
        return NextResponse.json(
          { success: false, error: 'Preset not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        preset,
      });
    }
    
    // Filter by category
    if (category) {
      const presets = getPresetsByCategory(category);
      return NextResponse.json({
        success: true,
        presets,
        count: presets.length,
        category,
      });
    }
    
    // Filter by phase
    if (phase) {
      const presets = getPresetsByPhase(phase);
      return NextResponse.json({
        success: true,
        presets,
        count: presets.length,
        phase,
      });
    }
    
    // Return all presets
    const allPresets = getAllPresets();
    
    // Group by phase
    const grouped = {
      '6.1': allPresets.filter((p: any) => p.phase === '6.1'),
      '6.2': allPresets.filter((p: any) => p.phase === '6.2'),
      '6.3': allPresets.filter((p: any) => p.phase === '6.3'),
    };
    
    return NextResponse.json({
      success: true,
      presets: allPresets,
      count: allPresets.length,
      grouped,
      summary: {
        total: allPresets.length,
        commerce: allPresets.filter((p: any) => p.category === 'commerce').length,
        services: allPresets.filter((p: any) => p.category === 'services').length,
        community: allPresets.filter((p: any) => p.category === 'community').length,
      },
    });
  } catch (error) {
    console.error('Business Presets API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type } = body;
    
    switch (action) {
      case 'get-demo-data': {
        if (!type || !BUSINESS_PRESETS[type as BusinessType]) {
          return NextResponse.json(
            { success: false, error: 'Valid business type required' },
            { status: 400 }
          );
        }
        
        const preset = getPreset(type as BusinessType);
        const demoData = getDemoData(type as BusinessType);
        
        return NextResponse.json({
          success: true,
          businessType: type,
          preset,
          demoData,
        });
      }
      
      case 'get-setup-config': {
        if (!type || !BUSINESS_PRESETS[type as BusinessType]) {
          return NextResponse.json(
            { success: false, error: 'Valid business type required' },
            { status: 400 }
          );
        }
        
        const preset = getPreset(type as BusinessType);
        
        return NextResponse.json({
          success: true,
          businessType: type,
          setupConfig: {
            name: preset?.name,
            description: preset?.description,
            baseSuites: preset?.baseSuites,
            features: preset?.features,
            labels: preset?.labels,
            kpis: preset?.kpis,
            pricing: preset?.pricing,
            nigeriaContext: preset?.nigeriaContext,
          },
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Business Presets API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
