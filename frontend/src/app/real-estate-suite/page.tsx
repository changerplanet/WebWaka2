/**
 * REAL ESTATE MANAGEMENT — Dashboard Page
 * Phase 7A, S4 Admin UI
 * 
 * Main dashboard for property managers.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Home, 
  FileText, 
  DollarSign, 
  Wrench,
  Plus,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  properties: { total: number; occupied: number; available: number };
  units: { total: number; occupied: number; vacant: number; occupancyRate: number };
  leases: { active: number; expiring: number; monthlyIncome: number };
  rent: { totalDue: number; collected: number; outstanding: number; collectionRate: number };
  maintenance: { open: number; inProgress: number; emergency: number };
}

export default function RealEstateDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      // For demo, show mock stats since tenant context isn't available
      // In production, these would come from the API
      setStats({
        properties: { total: 12, occupied: 8, available: 4 },
        units: { total: 48, occupied: 38, vacant: 10, occupancyRate: 79 },
        leases: { active: 38, expiring: 5, monthlyIncome: 15200000 },
        rent: { totalDue: 182400000, collected: 145920000, outstanding: 36480000, collectionRate: 80 },
        maintenance: { open: 7, inProgress: 3, emergency: 1 },
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickLinks = [
    { href: '/real-estate-suite/properties', icon: Building2, label: 'Properties', color: 'bg-blue-500' },
    { href: '/real-estate-suite/units', icon: Home, label: 'Units', color: 'bg-green-500' },
    { href: '/real-estate-suite/leases', icon: FileText, label: 'Leases', color: 'bg-purple-500' },
    { href: '/real-estate-suite/rent-schedules', icon: DollarSign, label: 'Rent', color: 'bg-yellow-500' },
    { href: '/real-estate-suite/maintenance-requests', icon: Wrench, label: 'Maintenance', color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Real Estate Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage properties, tenants, and rent collection
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          Demo Mode
        </Badge>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <div className={`${link.color} rounded-full p-3 mb-2`}>
                  <link.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Properties Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.properties.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.properties.occupied} occupied, {stats?.properties.available} available
            </p>
          </CardContent>
        </Card>

        {/* Units Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.units.occupancyRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.units.occupied} of {stats?.units.total} units occupied
            </p>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.leases.monthlyIncome || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats?.leases.active} active leases
            </p>
          </CardContent>
        </Card>

        {/* Collection Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rent.collectionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.rent.collected || 0)} collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Actions Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alerts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention Required
            </CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.leases.expiring && stats.leases.expiring > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Expiring Leases</p>
                    <p className="text-xs text-muted-foreground">{stats.leases.expiring} leases expire within 30 days</p>
                  </div>
                </div>
                <Link href="/real-estate-suite/leases?expiring=true">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {stats?.maintenance.emergency && stats.maintenance.emergency > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm">Emergency Requests</p>
                    <p className="text-xs text-muted-foreground">{stats.maintenance.emergency} emergency maintenance requests</p>
                  </div>
                </div>
                <Link href="/real-estate-suite/maintenance-requests?priority=EMERGENCY">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {stats?.rent.outstanding && stats.rent.outstanding > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">Outstanding Rent</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.rent.outstanding)} in arrears</p>
                  </div>
                </div>
                <Link href="/real-estate-suite/rent-schedules?status=OVERDUE">
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/real-estate-suite/properties?action=new">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Add New Property
              </Button>
            </Link>
            <Link href="/real-estate-suite/leases?action=new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Create New Lease
              </Button>
            </Link>
            <Link href="/real-estate-suite/rent-schedules?action=record">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Record Rent Payment
              </Button>
            </Link>
            <Link href="/real-estate-suite/maintenance-requests?action=new">
              <Button variant="outline" className="w-full justify-start">
                <Wrench className="mr-2 h-4 w-4" />
                Log Maintenance Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Vacant Units & Open Maintenance */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vacant Units */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Vacant Units
              </span>
              <Badge variant="secondary">{stats?.units.vacant || 0} available</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Units ready for new tenants
            </p>
            <Link href="/real-estate-suite/units?status=VACANT">
              <Button className="w-full">
                View Vacant Units
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Open Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Open Maintenance
              </span>
              <Badge variant="secondary">{(stats?.maintenance.open || 0) + (stats?.maintenance.inProgress || 0)} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {stats?.maintenance.open} open, {stats?.maintenance.inProgress} in progress
            </p>
            <Link href="/real-estate-suite/maintenance-requests">
              <Button className="w-full">
                View Requests
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
