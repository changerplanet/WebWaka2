export const dynamic = 'force-dynamic'

/**
 * LOGISTICS SUITE: Main API Route
 * 
 * GET - Returns logistics suite configuration and stats
 * POST - Activation and management operations
 * 
 * ⚠️ DEMO ONLY - All data is in-memory
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  LOGISTICS_LABELS,
  VEHICLE_TYPES,
  VEHICLE_STATUS,
  DRIVER_STATUS,
  LICENSE_TYPES,
  JOB_TYPES,
  JOB_STATUS,
  JOB_PRIORITY,
  DISPATCH_MODE,
  POD_TYPES,
  DELIVERY_EXCEPTIONS,
  PAYMENT_METHODS,
  BILLING_TYPES,
  LOGISTICS_CAPABILITY_BUNDLE,
} from '@/lib/logistics/config';
import { DEMO_STATS, DEMO_COMPANY_NAME, DEMO_COMPANY_LOCATION } from '@/lib/logistics/demo-data';
import { getFleetStats } from '@/lib/logistics/fleet-service';
import { getDriverStats } from '@/lib/logistics/driver-service';
import { getJobStats } from '@/lib/logistics/job-service';
import { getTrackingBoard } from '@/lib/logistics/tracking-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    
    // Get all stats
    const [fleetStats, driverStats, jobStats, trackingBoard] = await Promise.all([
      getFleetStats(tenantId),
      getDriverStats(tenantId),
      getJobStats(tenantId),
      getTrackingBoard(tenantId),
    ]);
    
    return NextResponse.json({
      success: true,
      companyName: DEMO_COMPANY_NAME,
      companylocation: DEMO_COMPANY_LOCATION,
      config: {
        labels: LOGISTICS_LABELS,
        vehicleTypes: VEHICLE_TYPES,
        vehicleStatus: VEHICLE_STATUS,
        driverStatus: DRIVER_STATUS,
        licenseTypes: LICENSE_TYPES,
        jobTypes: JOB_TYPES,
        jobStatus: JOB_STATUS,
        jobPriority: JOB_PRIORITY,
        dispatchMode: DISPATCH_MODE,
        podTypes: POD_TYPES,
        deliveryExceptions: DELIVERY_EXCEPTIONS,
        paymentMethods: PAYMENT_METHODS,
        billingTypes: BILLING_TYPES,
        capabilityBundle: LOGISTICS_CAPABILITY_BUNDLE,
      },
      stats: {
        fleet: fleetStats,
        drivers: driverStats,
        jobs: jobStats,
      },
      trackingBoard,
      demo: DEMO_STATS,
    });
  } catch (error) {
    console.error('Logistics Suite API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logistics suite configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'get-demo-data':
        return NextResponse.json({
          success: true,
          message: 'Demo data loaded',
          companyName: DEMO_COMPANY_NAME,
          stats: DEMO_STATS,
        });
        
      case 'activate':
        return NextResponse.json({
          success: true,
          message: 'Logistics Suite activated successfully',
          capabilities: LOGISTICS_CAPABILITY_BUNDLE.requiredCapabilities,
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Logistics Suite API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
