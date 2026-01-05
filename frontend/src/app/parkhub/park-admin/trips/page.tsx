'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bus,
  Clock,
  MapPin,
  User,
  Phone,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  PARKHUB_LABELS, 
  TRIP_STATUS_LABELS, 
  TRIP_STATUS_MAP,
  type TripStatus 
} from '@/lib/parkhub/config';

interface Trip {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  companyName: string;
  departureTime: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  status: TripStatus;
  driver: {
    id: string;
    name: string;
    phone: string;
    photo?: string;
  } | null;
  bus: {
    id: string;
    plateNumber: string;
    type: string;
  };
  passengers: {
    boarded: number;
    total: number;
  };
  lastUpdate: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  vehicleType: string;
  currentTrip?: string;
}

export default function TripManagementPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showAssignDriver, setShowAssignDriver] = useState(false);

  useEffect(() => {
    fetchTrips();
    fetchDrivers();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    // Simulated - uses Logistics assignment API in production
    setTrips([
      {
        id: '1',
        routeName: 'Lagos - Abuja Express',
        origin: 'Lagos (Jibowu)',
        destination: 'Abuja (Utako)',
        companyName: 'ABC Transport',
        departureTime: '06:00',
        scheduledDeparture: '2026-01-05T06:00:00',
        actualDeparture: '2026-01-05T06:15:00',
        status: 'IN_TRANSIT',
        driver: {
          id: 'd1',
          name: 'Chukwu Emmanuel',
          phone: '08012345678',
        },
        bus: {
          id: 'b1',
          plateNumber: 'LAG-234-ABC',
          type: 'LUXURY',
        },
        passengers: {
          boarded: 16,
          total: 16,
        },
        lastUpdate: '2026-01-05T08:30:00',
      },
      {
        id: '2',
        routeName: 'Lagos - Ibadan',
        origin: 'Lagos (Jibowu)',
        destination: 'Ibadan (Challenge)',
        companyName: 'ABC Transport',
        departureTime: '07:30',
        scheduledDeparture: '2026-01-05T07:30:00',
        status: 'BOARDING',
        driver: {
          id: 'd2',
          name: 'Adebayo Kunle',
          phone: '08023456789',
        },
        bus: {
          id: 'b2',
          plateNumber: 'LAG-567-DEF',
          type: 'STANDARD',
        },
        passengers: {
          boarded: 8,
          total: 14,
        },
        lastUpdate: '2026-01-05T07:25:00',
      },
      {
        id: '3',
        routeName: 'Lagos - Benin',
        origin: 'Lagos (Jibowu)',
        destination: 'Benin City',
        companyName: 'Peace Mass Transit',
        departureTime: '08:00',
        scheduledDeparture: '2026-01-05T08:00:00',
        status: 'SCHEDULED',
        driver: null,
        bus: {
          id: 'b3',
          plateNumber: 'LAG-890-GHI',
          type: 'STANDARD',
        },
        passengers: {
          boarded: 0,
          total: 12,
        },
        lastUpdate: '2026-01-05T07:00:00',
      },
    ]);
    setLoading(false);
  };

  const fetchDrivers = async () => {
    // Simulated - uses Logistics agent API in production
    setDrivers([
      { id: 'd1', name: 'Chukwu Emmanuel', phone: '08012345678', status: 'BUSY', vehicleType: 'BUS', currentTrip: '1' },
      { id: 'd2', name: 'Adebayo Kunle', phone: '08023456789', status: 'BUSY', vehicleType: 'BUS', currentTrip: '2' },
      { id: 'd3', name: 'Okonkwo Peter', phone: '08034567890', status: 'AVAILABLE', vehicleType: 'BUS' },
      { id: 'd4', name: 'Ibrahim Musa', phone: '08045678901', status: 'AVAILABLE', vehicleType: 'BUS' },
      { id: 'd5', name: 'Ojo Taiwo', phone: '08056789012', status: 'OFFLINE', vehicleType: 'MINI_BUS' },
    ]);
  };

  const updateTripStatus = async (tripId: string, newStatus: TripStatus) => {
    // In production: calls Logistics assignment status update API
    setTrips(trips.map(trip =>
      trip.id === tripId ? { ...trip, status: newStatus, lastUpdate: new Date().toISOString() } : trip
    ));
  };

  const assignDriver = async (tripId: string, driverId: string) => {
    // In production: calls Logistics assignment assign API
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setTrips(trips.map(trip =>
        trip.id === tripId ? { 
          ...trip, 
          driver: { id: driver.id, name: driver.name, phone: driver.phone },
          lastUpdate: new Date().toISOString() 
        } : trip
      ));
      setDrivers(drivers.map(d =>
        d.id === driverId ? { ...d, status: 'BUSY', currentTrip: tripId } : d
      ));
    }
    setShowAssignDriver(false);
    setSelectedTrip(null);
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-gray-100 text-gray-800';
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800';
      case 'DEPARTED': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-indigo-100 text-indigo-800';
      case 'ARRIVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TripStatus) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="w-4 h-4" />;
      case 'BOARDING': return <User className="w-4 h-4" />;
      case 'DEPARTED': return <PlayCircle className="w-4 h-4" />;
      case 'IN_TRANSIT': return <Bus className="w-4 h-4" />;
      case 'ARRIVED': return <MapPin className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getNextStatus = (current: TripStatus): TripStatus | null => {
    const flow: TripStatus[] = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.routeName.toLowerCase().includes(search.toLowerCase()) ||
      trip.companyName.toLowerCase().includes(search.toLowerCase()) ||
      trip.driver?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="trip-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trip Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage active trips with driver assignments
          </p>
        </div>
        <Button onClick={fetchTrips}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trips, companies, or drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(TRIP_STATUS_LABELS).map((status) => (
              <SelectItem key={status} value={status}>
                {TRIP_STATUS_LABELS[status as TripStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trip Cards */}
      <div className="grid gap-4">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-start justify-between">
              {/* Trip Info */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{trip.routeName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(trip.status)}`}>
                      {getStatusIcon(trip.status)}
                      {TRIP_STATUS_LABELS[trip.status]}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>{trip.companyName}</span>
                    <span className="mx-2">•</span>
                    <span>Bus: {trip.bus.plateNumber}</span>
                    <span className="mx-2">•</span>
                    <span>{trip.bus.type}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {trip.departureTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {trip.origin}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {trip.destination}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Driver & Passengers */}
              <div className="text-right">
                {trip.driver ? (
                  <div className="flex items-center gap-2 justify-end">
                    <div>
                      <div className="text-sm font-medium">{trip.driver.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Phone className="w-3 h-3" />
                        {trip.driver.phone}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTrip(trip);
                      setShowAssignDriver(true);
                    }}
                  >
                    <User className="w-4 h-4 mr-1" />
                    Assign Driver
                  </Button>
                )}
                <div className="mt-2 text-sm">
                  <span className="font-medium">{trip.passengers.boarded}</span>
                  <span className="text-muted-foreground">/{trip.passengers.total}</span>
                  <span className="text-muted-foreground ml-1">{PARKHUB_LABELS.customers}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Last update: {new Date(trip.lastUpdate).toLocaleTimeString()}
              </div>
              <div className="flex gap-2">
                {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                  <>
                    {getNextStatus(trip.status) && (
                      <Button 
                        size="sm"
                        onClick={() => updateTripStatus(trip.id, getNextStatus(trip.status)!)}
                      >
                        Mark as {TRIP_STATUS_LABELS[getNextStatus(trip.status)!]}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600"
                      onClick={() => updateTripStatus(trip.id, 'CANCELLED')}
                    >
                      Cancel Trip
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Driver Dialog */}
      <Dialog open={showAssignDriver} onOpenChange={setShowAssignDriver}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver to Trip</DialogTitle>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="py-4">
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <div className="font-medium">{selectedTrip.routeName}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedTrip.departureTime} • Bus: {selectedTrip.bus.plateNumber}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Available Drivers</div>
                {drivers.filter(d => d.status === 'AVAILABLE').map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => assignDriver(selectedTrip.id, driver.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">{driver.phone}</div>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      {driver.vehicleType}
                    </span>
                  </button>
                ))}
                {drivers.filter(d => d.status === 'AVAILABLE').length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No available drivers
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDriver(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
