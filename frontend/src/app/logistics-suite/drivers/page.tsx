'use client';

/**
 * LOGISTICS SUITE: Drivers Management Page
 * 
 * View and manage drivers/operators.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Users,
  ArrowLeft,
  Loader2,
  Filter,
  Search,
  Phone,
  Star,
  Truck,
} from 'lucide-react';

interface Driver {
  id: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseType: string;
  status: string;
  currentVehicleNumber?: string;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  isActive: boolean;
}

interface DriverStats {
  totalDrivers: number;
  activeDrivers: number;
  available: number;
  onTrip: number;
  offDuty: number;
  suspended: number;
  averageRating: number;
}

const DRIVER_STATUS: Record<string, { name: string; color: string }> = {
  AVAILABLE: { name: 'Available', color: 'bg-green-100 text-green-700' },
  ON_TRIP: { name: 'On Trip', color: 'bg-blue-100 text-blue-700' },
  OFF_DUTY: { name: 'Off Duty', color: 'bg-gray-100 text-gray-700' },
  ON_BREAK: { name: 'On Break', color: 'bg-yellow-100 text-yellow-700' },
  SUSPENDED: { name: 'Suspended', color: 'bg-red-100 text-red-700' },
};

const LICENSE_TYPES: Record<string, string> = {
  CLASS_A: 'Class A (Motorcycle)',
  CLASS_B: 'Class B (Light Vehicle)',
  CLASS_C: 'Class C (Light Truck)',
  CLASS_D: 'Class D (Heavy Vehicle)',
  CLASS_E: 'Class E (Articulated)',
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/logistics-suite/drivers?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDrivers(data.drivers);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      driver.firstName.toLowerCase().includes(search) ||
      driver.lastName.toLowerCase().includes(search) ||
      driver.phone.includes(search) ||
      driver.driverNumber.toLowerCase().includes(search)
    );
  });

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-slate-600">Loading drivers...</p>
        </div>
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
              <Link href="/logistics-suite/admin">
                <Button variant="ghost" size="sm" data-testid="back-btn">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Drivers</h1>
                  <p className="text-xs text-slate-500">{stats?.totalDrivers || 0} registered</p>
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
              <p className="text-2xl font-bold text-green-600">{stats?.available || 0}</p>
              <p className="text-xs text-slate-500">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.onTrip || 0}</p>
              <p className="text-xs text-slate-500">On Trip</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-600">{stats?.offDuty || 0}</p>
              <p className="text-xs text-slate-500">Off Duty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.suspended || 0}</p>
              <p className="text-xs text-slate-500">Suspended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.averageRating || 0}</p>
              <p className="text-xs text-slate-500">Avg Rating ⭐</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-driver"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(DRIVER_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drivers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow 
                    key={driver.id}
                    className={!driver.isActive ? 'opacity-60' : ''}
                    data-testid={`driver-${driver.driverNumber}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                        <p className="text-xs text-slate-500 font-mono">{driver.driverNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {driver.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{LICENSE_TYPES[driver.licenseType] || driver.licenseType}</p>
                    </TableCell>
                    <TableCell>
                      {driver.currentVehicleNumber ? (
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-sm">{driver.currentVehicleNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="font-medium">{driver.rating}</span>
                        </div>
                        <p className="text-xs text-slate-500">{driver.totalTrips} trips</p>
                        <p className="text-xs text-green-600">{formatNaira(driver.totalEarnings)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={DRIVER_STATUS[driver.status]?.color || 'bg-slate-100'}>
                        {DRIVER_STATUS[driver.status]?.name || driver.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredDrivers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No drivers found</p>
          </div>
        )}
      </main>
    </div>
  );
}
