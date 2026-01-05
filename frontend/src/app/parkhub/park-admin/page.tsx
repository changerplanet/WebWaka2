'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Bus,
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PARKHUB_LABELS } from '@/lib/parkhub/config';

interface TransportCompany {
  id: string;
  name: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED';
  totalRoutes: number;
  totalDrivers: number;
  totalTickets: number;
  totalRevenue: number;
  commissionRate: number;
  createdAt: string;
}

interface DashboardStats {
  totalCompanies: number;
  activeRoutes: number;
  todayTickets: number;
  todayRevenue: number;
  pendingApprovals: number;
  activeTrips: number;
}

export default function ParkAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<TransportCompany[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeRoutes: 0,
    todayTickets: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    activeTrips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    // Simulated data - in production, fetches from MVM APIs
    setStats({
      totalCompanies: 12,
      activeRoutes: 45,
      todayTickets: 234,
      todayRevenue: 1250000,
      pendingApprovals: 3,
      activeTrips: 8,
    });
    
    setCompanies([
      {
        id: '1',
        name: 'ABC Transport',
        status: 'APPROVED',
        totalRoutes: 8,
        totalDrivers: 15,
        totalTickets: 1250,
        totalRevenue: 5625000,
        commissionRate: 10,
        createdAt: '2025-06-15',
      },
      {
        id: '2',
        name: 'Peace Mass Transit',
        status: 'APPROVED',
        totalRoutes: 12,
        totalDrivers: 22,
        totalTickets: 2100,
        totalRevenue: 9450000,
        commissionRate: 10,
        createdAt: '2025-04-20',
      },
      {
        id: '3',
        name: 'GUO Transport',
        status: 'PENDING_APPROVAL',
        totalRoutes: 0,
        totalDrivers: 0,
        totalTickets: 0,
        totalRevenue: 0,
        commissionRate: 10,
        createdAt: '2026-01-03',
      },
    ]);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
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
    <div className="p-6 space-y-6" data-testid="park-admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Motor Park Dashboard</h1>
          <p className="text-muted-foreground">
            Manage {PARKHUB_LABELS.vendors} and monitor operations
          </p>
        </div>
        <Button onClick={() => router.push('/parkhub/park-admin/operators/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add {PARKHUB_LABELS.vendor}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Bus className="w-4 h-4" />
            <span className="text-xs">{PARKHUB_LABELS.vendors}</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalCompanies}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Active {PARKHUB_LABELS.products}</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeRoutes}</p>
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
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Pending Approvals</span>
          </div>
          <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Active Trips</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeTrips}</p>
        </div>
      </div>

      {/* Transport Companies List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">{PARKHUB_LABELS.vendors}</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${PARKHUB_LABELS.vendors.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Company Name</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-center p-3 text-sm font-medium">{PARKHUB_LABELS.products}</th>
                <th className="text-center p-3 text-sm font-medium">Drivers</th>
                <th className="text-center p-3 text-sm font-medium">{PARKHUB_LABELS.orders}</th>
                <th className="text-right p-3 text-sm font-medium">Revenue</th>
                <th className="text-center p-3 text-sm font-medium">Commission</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Since {new Date(company.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(company.status)}`}>
                      {company.status === 'PENDING_APPROVAL' ? 'Pending' : company.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">{company.totalRoutes}</td>
                  <td className="p-3 text-center">{company.totalDrivers}</td>
                  <td className="p-3 text-center">{company.totalTickets.toLocaleString()}</td>
                  <td className="p-3 text-right">{formatCurrency(company.totalRevenue)}</td>
                  <td className="p-3 text-center">{company.commissionRate}%</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View {PARKHUB_LABELS.products}</DropdownMenuItem>
                        <DropdownMenuItem>View Drivers</DropdownMenuItem>
                        {company.status === 'PENDING_APPROVAL' && (
                          <>
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {company.status === 'APPROVED' && (
                          <DropdownMenuItem className="text-red-600">Suspend</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => router.push('/parkhub/park-admin/trips')}
        >
          <Clock className="w-6 h-6 mb-2" />
          <span>Active Trips</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => router.push('/parkhub/park-admin/routes')}
        >
          <MapPin className="w-6 h-6 mb-2" />
          <span>All {PARKHUB_LABELS.products}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => router.push('/parkhub/park-admin/tickets')}
        >
          <Ticket className="w-6 h-6 mb-2" />
          <span>Today's {PARKHUB_LABELS.orders}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col"
          onClick={() => router.push('/parkhub/park-admin/commissions')}
        >
          <DollarSign className="w-6 h-6 mb-2" />
          <span>{PARKHUB_LABELS.commission}</span>
        </Button>
      </div>
    </div>
  );
}
