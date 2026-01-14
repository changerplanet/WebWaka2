'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Settings,
  Receipt,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  activeShifts: number;
  pendingTransactions: number;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function POSSuiteAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Request timed out. Please refresh the page.');
      }
    }, 30000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStats({
        todaySales: 47,
        todayRevenue: 285000,
        totalProducts: 156,
        activeShifts: 3,
        pendingTransactions: 2,
      });
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
    <div className="min-h-screen bg-slate-50" data-testid="pos-suite-admin">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">POS Suite</h1>
                <p className="text-xs text-slate-500">Point of Sale Dashboard</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              ⚠️ DEMO MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> This is a demonstration of the POS Suite.
            All data shown is sample data stored in-memory.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Today's Sales</p>
                  <p className="text-3xl font-bold">{stats?.todaySales || 0}</p>
                </div>
                <Receipt className="h-10 w-10 text-green-200" />
              </div>
              <p className="text-green-100 text-xs mt-2">Transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Revenue</p>
                  <p className="text-xl font-bold">{formatNaira(stats?.todayRevenue || 0)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-200" />
              </div>
              <p className="text-blue-100 text-xs mt-2">Today's earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Products</p>
                  <p className="text-3xl font-bold">{stats?.totalProducts || 0}</p>
                </div>
                <Package className="h-10 w-10 text-purple-200" />
              </div>
              <p className="text-purple-100 text-xs mt-2">In catalog</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Active Shifts</p>
                  <p className="text-3xl font-bold">{stats?.activeShifts || 0}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-200" />
              </div>
              <p className="text-amber-100 text-xs mt-2">Currently open</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow" data-testid="open-pos-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Open POS Terminal</CardTitle>
                  <CardDescription>Start selling</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Launch the point of sale terminal to process transactions and manage sales.
              </p>
              <Link href="/pos">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Open Terminal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="settings-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle>POS Settings</CardTitle>
                  <CardDescription>Configure your setup</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Manage locations, staff, products, and payment methods.
              </p>
              <Button variant="outline" className="w-full">
                View Settings <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-slate-500 py-8 border-t border-slate-200 mt-8">
          <p>WebWaka POS Suite • Demo Version</p>
          <p className="text-xs mt-1">Data shown is for demonstration purposes only</p>
        </div>
      </main>
    </div>
  );
}
