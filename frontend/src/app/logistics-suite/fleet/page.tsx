'use client';

/**
 * LOGISTICS SUITE: Fleet Management Page
 * 
 * View and manage vehicles/fleet.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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
  Truck,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Filter,
  User,
  Wrench,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: string;
  capacity: number;
  currentDriverName?: string;
  isActive: boolean;
}

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  available: number;
  inUse: number;
  maintenance: number;
  outOfService: number;
  utilizationRate: number;
}

const VEHICLE_TYPES: Record<string, string> = {
  MOTORCYCLE: 'Motorcycle',
  TRICYCLE: 'Tricycle',
  CAR: 'Car',
  VAN: 'Van',
  PICKUP: 'Pickup',
  TRUCK_SMALL: 'Small Truck',
  TRUCK_MEDIUM: 'Medium Truck',
  TRUCK_LARGE: 'Large Truck',
  BUS_MINI: 'Mini Bus',
  BUS_STANDARD: 'Standard Bus',
};

const VEHICLE_STATUS: Record<string, { name: string; color: string }> = {
  AVAILABLE: { name: 'Available', color: 'bg-green-100 text-green-700' },
  IN_USE: { name: 'In Use', color: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { name: 'Maintenance', color: 'bg-yellow-100 text-yellow-700' },
  OUT_OF_SERVICE: { name: 'Out of Service', color: 'bg-red-100 text-red-700' },
  RESERVED: { name: 'Reserved', color: 'bg-purple-100 text-purple-700' },
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('vehicleType', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/logistics-suite/fleet?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setVehicles(data.vehicles);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load fleet');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading fleet...</p>
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Fleet Management</h1>
                  <p className="text-xs text-slate-500">{stats?.totalVehicles || 0} vehicles</p>
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
              <p className="text-2xl font-bold text-blue-600">{stats?.inUse || 0}</p>
              <p className="text-xs text-slate-500">In Use</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats?.maintenance || 0}</p>
              <p className="text-xs text-slate-500">Maintenance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.outOfService || 0}</p>
              <p className="text-xs text-slate-500">Out of Service</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats?.utilizationRate || 0}%</p>
              <p className="text-xs text-slate-500">Utilization</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48" data-testid="filter-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(VEHICLE_TYPES).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(VEHICLE_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicles Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow 
                    key={vehicle.id}
                    className={!vehicle.isActive ? 'opacity-60' : ''}
                    data-testid={`vehicle-${vehicle.vehicleNumber}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-mono font-medium">{vehicle.vehicleNumber}</p>
                        <p className="text-xs text-slate-500">{vehicle.color}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{VEHICLE_TYPES[vehicle.vehicleType] || vehicle.vehicleType}</p>
                      <p className="text-xs text-slate-500">{vehicle.capacity} kg</p>
                    </TableCell>
                    <TableCell>
                      <p>{vehicle.make} {vehicle.model}</p>
                      <p className="text-xs text-slate-500">{vehicle.year}</p>
                    </TableCell>
                    <TableCell>
                      {vehicle.currentDriverName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{vehicle.currentDriverName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={VEHICLE_STATUS[vehicle.status]?.color || 'bg-slate-100'}>
                        {VEHICLE_STATUS[vehicle.status]?.name || vehicle.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {vehicles.length === 0 && !loading && (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No vehicles match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
