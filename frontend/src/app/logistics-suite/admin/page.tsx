'use client';

/**
 * LOGISTICS SUITE: Admin Dashboard
 * 
 * Main dashboard showing key metrics for logistics operations.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Users,
  Package,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    available: number;
    inUse: number;
    maintenance: number;
    utilizationRate: number;
  };
  drivers: {
    totalDrivers: number;
    activeDrivers: number;
    available: number;
    onTrip: number;
    offDuty: number;
    averageRating: number;
  };
  jobs: {
    totalJobs: number;
    activeJobs: number;
    pendingJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    totalRevenue: number;
    onTimeRate: number;
  };
}

interface TrackingBoardItem {
  jobId: string;
  jobNumber: string;
  status: string;
  priority: string;
  driverName?: string;
  deliveryAddress: string;
  lastUpdate: string;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-indigo-100 text-indigo-700',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-700',
  AT_PICKUP: 'bg-orange-100 text-orange-700',
  PICKED_UP: 'bg-cyan-100 text-cyan-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  AT_DELIVERY: 'bg-orange-100 text-orange-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  EXPRESS: 'bg-purple-500 text-white',
  URGENT: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  NORMAL: 'bg-blue-100 text-blue-700',
  LOW: 'bg-slate-100 text-slate-600',
};

export default function LogisticsSuiteAdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trackingBoard, setTrackingBoard] = useState<TrackingBoardItem[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logistics-suite');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setTrackingBoard(data.trackingBoard || []);
        setCompanyName(data.companyName);
      } else {
        setError(data.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{companyName}</h1>
                <p className="text-xs text-slate-500">Logistics Suite Dashboard</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              ⚠️ DEMO MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Notice */}
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> This is a demonstration of the Logistics Suite. 
            All data is stored in-memory and will reset on page refresh.
          </AlertDescription>
        </Alert>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Jobs</p>
                  <p className="text-3xl font-bold">{stats?.jobs.activeJobs || 0}</p>
                </div>
                <Package className="h-10 w-10 text-blue-200" />
              </div>
              <p className="text-blue-100 text-xs mt-2">
                {stats?.jobs.pendingJobs || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">On-Time Rate</p>
                  <p className="text-3xl font-bold">{stats?.jobs.onTimeRate || 0}%</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
              <p className="text-green-100 text-xs mt-2">
                {stats?.jobs.completedJobs || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Drivers Active</p>
                  <p className="text-3xl font-bold">{stats?.drivers.onTrip || 0}</p>
                </div>
                <Users className="h-10 w-10 text-purple-200" />
              </div>
              <p className="text-purple-100 text-xs mt-2">
                {stats?.drivers.available || 0} available
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Revenue</p>
                  <p className="text-xl font-bold">{formatNaira(stats?.jobs.totalRevenue || 0)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-amber-200" />
              </div>
              <p className="text-amber-100 text-xs mt-2">
                From {stats?.jobs.completedJobs || 0} deliveries
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Module Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Fleet */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="fleet-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Fleet</CardTitle>
                      <CardDescription>Manage vehicles</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Available:</span>
                      <span className="font-medium text-green-600">{stats?.fleet.available || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">In Use:</span>
                      <span className="font-medium text-blue-600">{stats?.fleet.inUse || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Maintenance:</span>
                      <span className="font-medium text-amber-600">{stats?.fleet.maintenance || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Utilization:</span>
                      <span className="font-medium">{stats?.fleet.utilizationRate || 0}%</span>
                    </div>
                  </div>
                  <Link href="/logistics-suite/fleet">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="view-fleet-btn">
                      View Fleet <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Drivers */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="drivers-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Drivers</CardTitle>
                      <CardDescription>Manage operators</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Available:</span>
                      <span className="font-medium text-green-600">{stats?.drivers.available || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">On Trip:</span>
                      <span className="font-medium text-blue-600">{stats?.drivers.onTrip || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Off Duty:</span>
                      <span className="font-medium text-slate-600">{stats?.drivers.offDuty || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Rating:</span>
                      <span className="font-medium">{stats?.drivers.averageRating || 0}⭐</span>
                    </div>
                  </div>
                  <Link href="/logistics-suite/drivers">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="view-drivers-btn">
                      View Drivers <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Jobs */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="jobs-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Jobs & Dispatch</CardTitle>
                      <CardDescription>Manage deliveries</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active:</span>
                      <span className="font-medium text-blue-600">{stats?.jobs.activeJobs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending:</span>
                      <span className="font-medium text-amber-600">{stats?.jobs.pendingJobs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Completed:</span>
                      <span className="font-medium text-green-600">{stats?.jobs.completedJobs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cancelled:</span>
                      <span className="font-medium text-red-600">{stats?.jobs.cancelledJobs || 0}</span>
                    </div>
                  </div>
                  <Link href="/logistics-suite/jobs">
                    <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="view-jobs-btn">
                      View Jobs <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="hover:shadow-lg transition-shadow bg-slate-50" data-testid="quick-actions-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 rounded-lg">
                      <MapPin className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                      <CardDescription>Common operations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/logistics-suite/jobs?action=new">
                    <Button variant="outline" className="w-full justify-start" data-testid="new-job-btn">
                      <Package className="mr-2 h-4 w-4" /> Create New Job
                    </Button>
                  </Link>
                  <Link href="/logistics-suite/jobs?view=pending">
                    <Button variant="outline" className="w-full justify-start" data-testid="pending-jobs-btn">
                      <Clock className="mr-2 h-4 w-4" /> View Pending Jobs
                    </Button>
                  </Link>
                  <Link href="/logistics-suite/drivers?status=available">
                    <Button variant="outline" className="w-full justify-start" data-testid="available-drivers-btn">
                      <Users className="mr-2 h-4 w-4" /> Available Drivers
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Tracking Board */}
          <Card className="h-fit" data-testid="tracking-board">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Live Tracking
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {trackingBoard.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {trackingBoard.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active deliveries</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {trackingBoard.slice(0, 6).map((item) => (
                    <div 
                      key={item.jobId} 
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                      data-testid={`tracking-${item.jobNumber}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-slate-500">{item.jobNumber}</span>
                        <Badge className={PRIORITY_COLORS[item.priority] || 'bg-slate-100'}>
                          {item.priority}
                        </Badge>
                      </div>
                      <Badge className={`${STATUS_COLORS[item.status] || 'bg-slate-100'} mb-2`}>
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm text-slate-600 truncate" title={item.deliveryAddress}>
                        → {item.deliveryAddress}
                      </p>
                      {item.driverName && (
                        <p className="text-xs text-slate-500 mt-1">
                          Driver: {item.driverName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {trackingBoard.length > 6 && (
                <Link href="/logistics-suite/jobs?view=active">
                  <Button variant="link" className="w-full mt-2">
                    View all {trackingBoard.length} active jobs
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 py-4 border-t border-slate-200">
          <p>WebWaka Logistics Suite • Demo Version</p>
          <p className="text-xs mt-1">Data shown is for demonstration purposes only</p>
        </div>
      </main>
    </div>
  );
}
