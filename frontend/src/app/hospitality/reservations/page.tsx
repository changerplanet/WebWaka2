'use client';

/**
 * HOSPITALITY SUITE: Reservations Management Page
 * 
 * View and manage hotel reservations.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarCheck,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Filter,
  LogIn,
  LogOut,
  Users,
  Clock,
  Phone,
  BedDouble,
} from 'lucide-react';

interface Reservation {
  id: string;
  reservationNumber: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  status: string;
  source: string;
  specialRequests?: string;
}

interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  todayArrivals: number;
  todayDepartures: number;
  totalRevenue: number;
}

const RESERVATION_STATUS: Record<string, { name: string; color: string }> = {
  PENDING: { name: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { name: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  CHECKED_IN: { name: 'Checked In', color: 'bg-green-100 text-green-700' },
  CHECKED_OUT: { name: 'Checked Out', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { name: 'Cancelled', color: 'bg-red-100 text-red-700' },
  NO_SHOW: { name: 'No Show', color: 'bg-red-100 text-red-700' },
};

const BOOKING_SOURCES: Record<string, string> = {
  WALK_IN: 'Walk-In',
  PHONE: 'Phone',
  WEBSITE: 'Website',
  OTA: 'OTA',
  CORPORATE: 'Corporate',
  REFERRAL: 'Referral',
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      const response = await fetch(`/api/hospitality/reservations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReservations(data.reservations);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load reservations');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (reservationId: string) => {
    try {
      setActionLoading(reservationId);
      const response = await fetch('/api/hospitality/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-in',
          reservationId,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchReservations();
      } else {
        alert(data.error || 'Failed to check in');
      }
    } catch (err) {
      alert('Failed to process check-in');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (reservationId: string) => {
    try {
      setActionLoading(reservationId);
      const response = await fetch('/api/hospitality/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-out',
          reservationId,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchReservations();
      } else {
        alert(data.error || 'Failed to check out');
      }
    } catch (err) {
      alert('Failed to process check-out');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-slate-600">Loading reservations...</p>
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
            <div className="flex items-center gap-4">
              <Link href="/hospitality/admin">
                <Button variant="ghost" size="sm" data-testid="back-btn">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Reservations</h1>
                  <p className="text-xs text-slate-500">{stats?.total || 0} total reservations</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              DEMO MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.checkedIn || 0}</p>
              <p className="text-xs text-slate-500">In-House</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.confirmed || 0}</p>
              <p className="text-xs text-slate-500">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.todayArrivals || 0}</p>
              <p className="text-xs text-slate-500">Arrivals Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.todayDepartures || 0}</p>
              <p className="text-xs text-slate-500">Departures</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-slate-900">{formatNaira(stats?.totalRevenue || 0)}</p>
              <p className="text-xs text-slate-500">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reservations</SelectItem>
              {Object.entries(RESERVATION_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reservations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((res) => (
                  <TableRow key={res.id} data-testid={`reservation-${res.reservationNumber}`}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{res.reservationNumber}</p>
                        <p className="text-xs text-slate-500">{BOOKING_SOURCES[res.source] || res.source}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{res.guestName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {res.guestPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium">{res.roomNumber}</p>
                          <p className="text-xs text-slate-500">{res.roomType}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDate(res.checkInDate)} → {formatDate(res.checkOutDate)}
                        </p>
                        <p className="text-xs text-slate-500">{res.nights} night(s)</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatNaira(res.totalAmount)}</p>
                        {res.balanceDue > 0 && (
                          <p className="text-xs text-amber-600">Due: {formatNaira(res.balanceDue)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={RESERVATION_STATUS[res.status]?.color || 'bg-slate-100'}>
                        {RESERVATION_STATUS[res.status]?.name || res.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(res.status === 'CONFIRMED' || res.status === 'PENDING') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCheckIn(res.id)}
                            disabled={actionLoading === res.id}
                            data-testid={`checkin-${res.reservationNumber}`}
                          >
                            {actionLoading === res.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <LogIn className="h-4 w-4 mr-1" /> Check In
                              </>
                            )}
                          </Button>
                        )}
                        {res.status === 'CHECKED_IN' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCheckOut(res.id)}
                            disabled={actionLoading === res.id}
                            data-testid={`checkout-${res.reservationNumber}`}
                          >
                            {actionLoading === res.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <LogOut className="h-4 w-4 mr-1" /> Check Out
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {reservations.length === 0 && (
          <div className="text-center py-12">
            <CalendarCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No reservations match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
