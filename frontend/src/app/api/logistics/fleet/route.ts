export const dynamic = 'force-dynamic'

/**
 * LOGISTICS SUITE: Fleet API Route
 * 
 * GET - List/filter vehicles
 * POST - Create vehicle
 * PATCH - Update vehicle status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getVehicles,
  getVehicleById,
  getAvailableVehicles,
  updateVehicleStatus,
  createVehicle,
  getFleetStats,
} from '@/lib/logistics/fleet-service';
import { validateVehicleType, validateVehicleStatus } from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const query = searchParams.get('query');
    
    if (id) {
      const vehicle = await getVehicleById(tenantId, id);
      if (!vehicle) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, vehicle });
    }
    
    if (query === 'available') {
      const vehicleType = validateVehicleType(searchParams.get('vehicleType'));
      const available = await getAvailableVehicles(tenantId, vehicleType);
      return NextResponse.json({ success: true, vehicles: available, count: available.length });
    }
    
    if (query === 'stats') {
      const stats = await getFleetStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    const { vehicles, total, stats } = await getVehicles(tenantId, {
      vehicleType: validateVehicleType(searchParams.get('vehicleType')),
      status: searchParams.get('status') as any, // TODO: Phase 10C - vehicle status enum
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      hasDriver: searchParams.get('hasDriver') === 'true' ? true : searchParams.get('hasDriver') === 'false' ? false : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    });
    
    return NextResponse.json({
      success: true,
      vehicles,
      total,
      stats,
    });
  } catch (error) {
    console.error('Fleet API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const body = await request.json();
    
    if (!body.vehicleNumber || !body.vehicleType || !body.make || !body.model) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vehicleNumber, vehicleType, make, model' },
        { status: 400 }
      );
    }
    
    const vehicle = await createVehicle(tenantId, body);
    
    return NextResponse.json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Fleet API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const body = await request.json();
    const { vehicleId, status, driverId, driverName } = body;
    
    if (!vehicleId || !status) {
      return NextResponse.json(
        { success: false, error: 'vehicleId and status are required' },
        { status: 400 }
      );
    }
    
    const vehicle = await updateVehicleStatus(tenantId, vehicleId, status, driverId, driverName);
    
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      vehicle,
    });
  } catch (error) {
    console.error('Fleet API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}
