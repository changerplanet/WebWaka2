export const dynamic = 'force-dynamic'

/**
 * LOGISTICS SUITE: Drivers API Route
 * 
 * GET - List/filter/search drivers
 * POST - Create driver or perform actions
 * PATCH - Update driver
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDrivers,
  getDriverById,
  getAvailableDrivers,
  searchDrivers,
  createDriver,
  updateDriverStatus,
  suspendDriver,
  reinstateDriver,
  getDriverPerformance,
  getDriverStats,
} from '@/lib/logistics/driver-service';
import {
  validateAgentStatus,
  validateLicenseType,
} from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const query = searchParams.get('query');
    
    if (id) {
      const driver = await getDriverById(tenantId, id);
      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Driver not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, driver });
    }
    
    if (search) {
      const drivers = await searchDrivers(tenantId, search);
      return NextResponse.json({ success: true, drivers, count: drivers.length });
    }
    
    if (query === 'available') {
      const licenseType = validateLicenseType(searchParams.get('licenseType'));
      const available = await getAvailableDrivers(tenantId, licenseType);
      return NextResponse.json({ success: true, drivers: available, count: available.length });
    }
    
    if (query === 'stats') {
      const stats = await getDriverStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    if (query === 'performance') {
      const driverId = searchParams.get('driverId');
      if (!driverId) {
        return NextResponse.json(
          { success: false, error: 'driverId is required for performance query' },
          { status: 400 }
        );
      }
      const performance = await getDriverPerformance(tenantId, driverId);
      return NextResponse.json({ success: true, ...performance });
    }
    
    // Phase 10C: Using enum validators to safely convert URL params
    // to service-layer enum values without unsafe casts.
    const { drivers, total, stats } = await getDrivers(tenantId, {
      status: validateAgentStatus(searchParams.get('status')),
      licenseType: validateLicenseType(searchParams.get('licenseType')),
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      hasVehicle: searchParams.get('hasVehicle') === 'true' ? true : searchParams.get('hasVehicle') === 'false' ? false : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    });
    
    return NextResponse.json({
      success: true,
      drivers,
      total,
      stats,
    });
  } catch (error) {
    console.error('Drivers API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const body = await request.json();
    const { action, driverId, ...data } = body;
    
    if (action && driverId) {
      switch (action) {
        case 'suspend': {
          const driver = await suspendDriver(tenantId, driverId, data.reason);
          if (!driver) {
            return NextResponse.json(
              { success: false, error: 'Driver not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Driver suspended',
            driver,
          });
        }
        
        case 'reinstate': {
          const driver = await reinstateDriver(tenantId, driverId);
          if (!driver) {
            return NextResponse.json(
              { success: false, error: 'Driver not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Driver reinstated',
            driver,
          });
        }
        
        case 'update-status': {
          if (!data.status) {
            return NextResponse.json(
              { success: false, error: 'status is required' },
              { status: 400 }
            );
          }
          const driver = await updateDriverStatus(
            tenantId,
            driverId,
            data.status,
            data.vehicleId,
            data.vehicleNumber,
            data.jobId
          );
          if (!driver) {
            return NextResponse.json(
              { success: false, error: 'Driver not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            driver,
          });
        }
        
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    }
    
    // Create new driver
    if (!data.firstName || !data.lastName || !data.phone || !data.licenseNumber || !data.licenseType || !data.licenseExpiry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: firstName, lastName, phone, licenseNumber, licenseType, licenseExpiry' },
        { status: 400 }
      );
    }
    
    const driver = await createDriver(tenantId, data);
    
    return NextResponse.json({
      success: true,
      message: 'Driver created successfully',
      driver,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Drivers API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process driver operation' },
      { status: 500 }
    );
  }
}
