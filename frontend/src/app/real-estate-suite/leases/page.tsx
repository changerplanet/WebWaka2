/**
 * REAL ESTATE MANAGEMENT — Leases List Page
 * Phase 7A, S4 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  AlertTriangle,
  Users,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Demo data
const DEMO_LEASES = [
  { 
    id: '1', 
    leaseNumber: 'LSE-2026-0001', 
    tenantName: 'Mr. Chukwuma Eze', 
    tenantPhone: '08012345678',
    unitNumber: 'Flat 1A', 
    propertyName: 'Harmony Estate Phase 2',
    status: 'ACTIVE', 
    startDate: '2025-01-01', 
    endDate: '2025-12-31', 
    monthlyRent: 250000,
    rentFrequency: 'ANNUALLY',
  },
  { 
    id: '2', 
    leaseNumber: 'LSE-2026-0002', 
    tenantName: 'Mrs. Funke Williams', 
    tenantPhone: '08098765432',
    unitNumber: 'Flat 1B', 
    propertyName: 'Harmony Estate Phase 2',
    status: 'ACTIVE', 
    startDate: '2025-06-01', 
    endDate: '2026-05-31', 
    monthlyRent: 250000,
    rentFrequency: 'ANNUALLY',
  },
  { 
    id: '3', 
    leaseNumber: 'LSE-2026-0003', 
    tenantName: 'Elegance Fashion Store', 
    tenantPhone: '07011223344',
    unitNumber: 'Shop A1', 
    propertyName: 'Victoria Plaza',
    status: 'ACTIVE', 
    startDate: '2024-03-01', 
    endDate: '2027-02-28', 
    monthlyRent: 500000,
    rentFrequency: 'ANNUALLY',
  },
  { 
    id: '4', 
    leaseNumber: 'LSE-2025-0045', 
    tenantName: 'Dr. Amaka Nwachukwu', 
    tenantPhone: '08055667788',
    unitNumber: 'Flat 3A', 
    propertyName: 'Green Gardens Apartments',
    status: 'EXPIRED', 
    startDate: '2024-01-01', 
    endDate: '2024-12-31', 
    monthlyRent: 180000,
    rentFrequency: 'ANNUALLY',
  },
  { 
    id: '5', 
    leaseNumber: 'LSE-2026-0004', 
    tenantName: 'TechHub Solutions', 
    tenantPhone: '09012345678',
    unitNumber: 'Office 201', 
    propertyName: 'Victoria Plaza',
    status: 'DRAFT', 
    startDate: '2026-02-01', 
    endDate: '2027-01-31', 
    monthlyRent: 350000,
    rentFrequency: 'ANNUALLY',
  },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  TERMINATED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RENEWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function LeasesPage() {
  const [leases] = useState(DEMO_LEASES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntil = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  };

  const filteredLeases = leases.filter((l) => {
    const matchesSearch = 
      l.leaseNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      l.unitNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leases.length,
    active: leases.filter((l: any) => l.status === 'ACTIVE').length,
    expiring: leases.filter((l: any) => l.status === 'ACTIVE' && isExpiringSoon(l.endDate)).length,
    monthlyIncome: leases.filter((l: any) => l.status === 'ACTIVE').reduce((sum: any, l: any) => sum + l.monthlyRent, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/real-estate-suite" className="hover:text-foreground transition-colors">Real Estate</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Leases</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Leases
          </h1>
          <p className="text-muted-foreground">Manage tenant agreements</p>
        </div>
        <Button data-testid="add-lease-btn">
          <Plus className="mr-2 h-4 w-4" />
          New Lease
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">Monthly Income</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="lease-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leases Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lease #</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeases.map((lease) => (
              <TableRow key={lease.id} data-testid={`lease-row-${lease.id}`}>
                <TableCell className="font-medium font-mono">
                  {lease.leaseNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lease.tenantName}
                    </div>
                    <div className="text-xs text-muted-foreground">{lease.tenantPhone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{lease.unitNumber}</div>
                    <div className="text-xs text-muted-foreground">{lease.propertyName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[lease.status]}>
                      {lease.status}
                    </Badge>
                    {lease.status === 'ACTIVE' && isExpiringSoon(lease.endDate) && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="Expiring soon" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(lease.monthlyRent)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Lease
                      </DropdownMenuItem>
                      {lease.status === 'DRAFT' && (
                        <DropdownMenuItem className="text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      {lease.status === 'ACTIVE' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <XCircle className="mr-2 h-4 w-4" />
                            Terminate
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredLeases.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No leases found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
