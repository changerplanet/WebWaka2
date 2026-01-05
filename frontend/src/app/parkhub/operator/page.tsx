'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Bus,
  Users,
  Ticket,
  DollarSign,
  MapPin,
  Clock,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PARKHUB_LABELS, TRIP_STATUS_LABELS, type TripStatus } from '@/lib/parkhub/config';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  busType: string;
}

interface Trip {
  id: string;
  routeName: string;
  status: TripStatus;
  departureTime: string;
  driverName: string;
  passengersBoarded: number;
  totalPassengers: number;
}

interface OperatorStats {
  totalRoutes: number;
  todayTickets: number;
  todayRevenue: number;
  totalDrivers: number;
  activeTrips: number;
  commissionPaid: number;
}

export default function OperatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<OperatorStats>({
    totalRoutes: 0,
    todayTickets: 0,
    todayRevenue: 0,
    totalDrivers: 0,
    activeTrips: 0,
    commissionPaid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Simulated data - in production uses MVM vendor APIs
    setStats({
      totalRoutes: 8,
      todayTickets: 45,
      todayRevenue: 202500,
      totalDrivers: 12,
      activeTrips: 3,
      commissionPaid: 20250,
    });

    setRoutes([
      {
        id: '1',
        name: 'Lagos - Abuja Express',
        origin: 'Lagos (Jibowu)',
        destination: 'Abuja (Utako)',
        departureTime: '06:00',
        price: 15000,
        availableSeats: 12,
        totalSeats: 18,
        busType: 'LUXURY',
      },
      {
        id: '2',
        name: 'Lagos - Ibadan',
        origin: 'Lagos (Jibowu)',
        destination: 'Ibadan (Challenge)',
        departureTime: '07:30',
        price: 4500,
        availableSeats: 5,
        totalSeats: 14,
        busType: 'STANDARD',
      },
      {
        id: '3',
        name: 'Lagos - Benin',
        origin: 'Lagos (Jibowu)',
        destination: 'Benin City',
        departureTime: '08:00',
        price: 8000,
        availableSeats: 18,
        totalSeats: 18,
        busType: 'STANDARD',
      },
    ]);

    setTrips([
      {
        id: '1',
        routeName: 'Lagos - Abuja Express',
        status: 'IN_TRANSIT',
        departureTime: '06:00',
        driverName: 'Chukwu Emmanuel',
        passengersBoarded: 16,
        totalPassengers: 16,
      },
      {
        id: '2',
        routeName: 'Lagos - Ibadan',
        status: 'BOARDING',
        departureTime: '07:30',
        driverName: 'Adebayo Kunle',
        passengersBoarded: 8,
        totalPassengers: 14,
      },
      {
        id: '3',
        routeName: 'Lagos - Benin',
        status: 'SCHEDULED',
        departureTime: '08:00',
        driverName: 'Okonkwo Peter',
        passengersBoarded: 0,
        totalPassengers: 12,
      },
    ]);

    setLoading(false);
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800';
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800';
      case 'SCHEDULED': return 'bg-gray-100 text-gray-800';
      case 'DEPARTED': return 'bg-indigo-100 text-indigo-800';
      case 'ARRIVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="operator-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{PARKHUB_LABELS.vendor} Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your {PARKHUB_LABELS.products.toLowerCase()}, drivers, and {PARKHUB_LABELS.orders.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/parkhub/operator/drivers')}>
            <Users className="w-4 h-4 mr-2" />
            Manage Drivers
          </Button>
          <Button onClick={() => router.push('/parkhub/operator/routes/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add {PARKHUB_LABELS.product}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">{PARKHUB_LABELS.products}</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalRoutes}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Ticket className="w-4 h-4" />
            <span className="text-xs">Today's {PARKHUB_LABELS.orders}</span>
          </div>
          <p className="text-2xl font-bold">{stats.todayTickets}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Today's Revenue</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Drivers</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalDrivers}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Bus className="w-4 h-4" />
            <span className="text-xs">Active Trips</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeTrips}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">{PARKHUB_LABELS.commission} (Today)</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.commissionPaid)}</p>
        </div>
      </div>

      {/* Active Trips */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Today's Trips</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/parkhub/operator/trips')}>
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="divide-y">
          {trips.map((trip) => (
            <div key={trip.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{trip.routeName}</div>
                  <div className="text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {trip.departureTime} • Driver: {trip.driverName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {trip.passengersBoarded}/{trip.totalPassengers} {PARKHUB_LABELS.customers}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(trip.status)}`}>
                    {TRIP_STATUS_LABELS[trip.status]}
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routes List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Your {PARKHUB_LABELS.products}</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/parkhub/operator/routes')}>
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">{PARKHUB_LABELS.product}</th>
                <th className="text-left p-3 text-sm font-medium">Departure</th>
                <th className="text-right p-3 text-sm font-medium">Price</th>
                <th className="text-center p-3 text-sm font-medium">{PARKHUB_LABELS.inventory}</th>
                <th className="text-center p-3 text-sm font-medium">Bus Type</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{route.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {route.origin} → {route.destination}
                    </div>
                  </td>
                  <td className="p-3">{route.departureTime}</td>
                  <td className="p-3 text-right">{formatCurrency(route.price)}</td>
                  <td className="p-3 text-center">
                    <span className={route.availableSeats < 5 ? 'text-red-600 font-medium' : ''}>
                      {route.availableSeats}/{route.totalSeats}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                      {route.busType}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
