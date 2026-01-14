'use client';

/**
 * HOSPITALITY SUITE: Admin Dashboard
 * 
 * Main dashboard showing key metrics for hotel operations.
 * ⚠️ DEMO ONLY - All data is in-memory, not persisted to database.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  BedDouble,
  CalendarCheck,
  Users,
  Sparkles,
  Receipt,
  ArrowRight,
  LogIn,
  LogOut,
  AlertCircle,
  Hotel,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  rooms: {
    totalRooms: number;
    activeRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    occupancyRate: number;
    outOfOrder: number;
    dirtyRooms: number;
  };
  reservations: {
    total: number;
    checkedIn: number;
    todayArrivals: number;
    todayDepartures: number;
    totalRevenue: number;
  };
  guests: {
    totalGuests: number;
    vipGuests: number;
    newGuestsThisMonth: number;
  };
  housekeeping: {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    urgentTasks: number;
  };
  folios: {
    openFolios: number;
    outstandingBalance: number;
    totalRevenue: number;
  };
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function HospitalityAdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotelName, setHotelName] = useState<string>('');
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
      const response = await fetch('/api/hospitality');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setHotelName(data.hotelName);
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
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
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
              <div className="p-2 bg-amber-100 rounded-lg">
                <Hotel className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{hotelName}</h1>
                <p className="text-xs text-slate-500">Hospitality Suite Dashboard</p>
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
            <strong>Demo Mode:</strong> This is a demonstration of the Hospitality Suite. 
            All data shown is sample data stored in-memory and will reset on page refresh.
          </AlertDescription>
        </Alert>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Occupancy</p>
                  <p className="text-3xl font-bold">{stats?.rooms.occupancyRate || 0}%</p>
                </div>
                <BedDouble className="h-10 w-10 text-blue-200" />
              </div>
              <p className="text-blue-100 text-xs mt-2">
                {stats?.rooms.occupiedRooms} of {stats?.rooms.activeRooms} rooms
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">In-House</p>
                  <p className="text-3xl font-bold">{stats?.reservations.checkedIn || 0}</p>
                </div>
                <Users className="h-10 w-10 text-green-200" />
              </div>
              <p className="text-green-100 text-xs mt-2">
                Checked in guests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Arrivals</p>
                  <p className="text-3xl font-bold">{stats?.reservations.todayArrivals || 0}</p>
                </div>
                <LogIn className="h-10 w-10 text-amber-200" />
              </div>
              <p className="text-amber-100 text-xs mt-2">
                Expected today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Departures</p>
                  <p className="text-3xl font-bold">{stats?.reservations.todayDepartures || 0}</p>
                </div>
                <LogOut className="h-10 w-10 text-purple-200" />
              </div>
              <p className="text-purple-100 text-xs mt-2">
                Checking out today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Rooms */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="rooms-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BedDouble className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Rooms</CardTitle>
                  <CardDescription>Manage room inventory</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Available:</span>
                  <span className="font-medium text-green-600">{stats?.rooms.vacantRooms || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Occupied:</span>
                  <span className="font-medium text-blue-600">{stats?.rooms.occupiedRooms || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dirty:</span>
                  <span className="font-medium text-amber-600">{stats?.rooms.dirtyRooms || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Out of Order:</span>
                  <span className="font-medium text-red-600">{stats?.rooms.outOfOrder || 0}</span>
                </div>
              </div>
              <Link href="/hospitality/rooms">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="view-rooms-btn">
                  View Rooms <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Reservations */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="reservations-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Reservations</CardTitle>
                  <CardDescription>Manage bookings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total:</span>
                  <span className="font-medium">{stats?.reservations.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Checked In:</span>
                  <span className="font-medium text-green-600">{stats?.reservations.checkedIn || 0}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Revenue: <span className="font-semibold text-slate-900">{formatNaira(stats?.reservations.totalRevenue || 0)}</span>
              </p>
              <Link href="/hospitality/reservations">
                <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="view-reservations-btn">
                  View Reservations <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Guests */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="guests-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Guests</CardTitle>
                  <CardDescription>Guest profiles & loyalty</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total:</span>
                  <span className="font-medium">{stats?.guests.totalGuests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VIP:</span>
                  <span className="font-medium text-amber-600">{stats?.guests.vipGuests || 0}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                New this month: <span className="font-semibold text-slate-900">{stats?.guests.newGuestsThisMonth || 0}</span>
              </p>
              <Link href="/hospitality/guests">
                <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="view-guests-btn">
                  View Guests <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Housekeeping */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="housekeeping-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Housekeeping</CardTitle>
                  <CardDescription>Cleaning tasks & status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending:</span>
                  <span className="font-medium text-amber-600">{stats?.housekeeping.pendingTasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">In Progress:</span>
                  <span className="font-medium text-blue-600">{stats?.housekeeping.inProgressTasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Urgent:</span>
                  <span className="font-medium text-red-600">{stats?.housekeeping.urgentTasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total:</span>
                  <span className="font-medium">{stats?.housekeeping.totalTasks || 0}</span>
                </div>
              </div>
              <Link href="/hospitality/housekeeping">
                <Button className="w-full bg-amber-600 hover:bg-amber-700" data-testid="view-housekeeping-btn">
                  View Tasks <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Folios */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="folios-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Guest Folios</CardTitle>
                  <CardDescription>Charges & billing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Open Folios:</span>
                  <span className="font-medium">{stats?.folios.openFolios || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding:</span>
                  <span className="font-medium text-amber-600">{formatNaira(stats?.folios.outstandingBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Revenue:</span>
                  <span className="font-medium text-green-600">{formatNaira(stats?.folios.totalRevenue || 0)}</span>
                </div>
              </div>
              <Link href="/hospitality/folios">
                <Button className="w-full bg-teal-600 hover:bg-teal-700" data-testid="view-folios-btn">
                  View Folios <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-shadow bg-slate-50" data-testid="quick-actions-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 rounded-lg">
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common operations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/hospitality/reservations?action=new">
                <Button variant="outline" className="w-full justify-start" data-testid="new-reservation-btn">
                  <CalendarCheck className="mr-2 h-4 w-4" /> New Reservation
                </Button>
              </Link>
              <Link href="/hospitality/guests?action=new">
                <Button variant="outline" className="w-full justify-start" data-testid="new-guest-btn">
                  <Users className="mr-2 h-4 w-4" /> Register Guest
                </Button>
              </Link>
              <Link href="/hospitality/rooms?view=status">
                <Button variant="outline" className="w-full justify-start" data-testid="room-status-btn">
                  <BedDouble className="mr-2 h-4 w-4" /> Room Status Board
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 py-4 border-t border-slate-200">
          <p>WebWaka Hospitality Suite • Demo Version</p>
          <p className="text-xs mt-1">Data shown is for demonstration purposes only</p>
        </div>
      </main>
    </div>
  );
}
