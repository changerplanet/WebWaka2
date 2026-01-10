/**
 * REAL ESTATE MANAGEMENT — Rent Schedules Page
 * Phase 7A, S4 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Search, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MoreVertical,
  Eye,
  CreditCard
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
import { Progress } from '@/components/ui/progress';

// Demo data
const DEMO_SCHEDULES = [
  { 
    id: '1', 
    dueDate: '2026-01-01', 
    amount: 3000000, 
    paidAmount: 3000000,
    status: 'PAID',
    tenantName: 'Mr. Chukwuma Eze',
    unitNumber: 'Flat 1A',
    propertyName: 'Harmony Estate Phase 2',
    description: 'Annual Rent 2026',
  },
  { 
    id: '2', 
    dueDate: '2026-01-15', 
    amount: 6000000, 
    paidAmount: 4000000,
    status: 'PARTIAL',
    tenantName: 'Mrs. Funke Williams',
    unitNumber: 'Flat 1B',
    propertyName: 'Harmony Estate Phase 2',
    description: 'Annual Rent 2026',
  },
  { 
    id: '3', 
    dueDate: '2025-12-01', 
    amount: 500000, 
    paidAmount: 0,
    status: 'OVERDUE',
    tenantName: 'Elegance Fashion Store',
    unitNumber: 'Shop A1',
    propertyName: 'Victoria Plaza',
    description: 'Monthly Rent December 2025',
  },
  { 
    id: '4', 
    dueDate: '2026-02-01', 
    amount: 4200000, 
    paidAmount: 0,
    status: 'PENDING',
    tenantName: 'TechHub Solutions',
    unitNumber: 'Office 201',
    propertyName: 'Victoria Plaza',
    description: 'Annual Rent 2026',
  },
  { 
    id: '5', 
    dueDate: '2026-01-01', 
    amount: 2160000, 
    paidAmount: 2160000,
    status: 'PAID',
    tenantName: 'Dr. Amaka Nwachukwu',
    unitNumber: 'Flat 3A',
    propertyName: 'Green Gardens Apartments',
    description: 'Annual Rent 2026',
  },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  WAIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PAID: <CheckCircle2 className="h-4 w-4" />,
  PARTIAL: <AlertCircle className="h-4 w-4" />,
  OVERDUE: <AlertCircle className="h-4 w-4" />,
};

export default function RentSchedulesPage() {
  const [schedules] = useState(DEMO_SCHEDULES);
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

  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch = 
      s.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      s.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.propertyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDue = schedules.reduce((sum: any, s: any) => sum + s.amount, 0);
  const totalCollected = schedules.reduce((sum: any, s: any) => sum + s.paidAmount, 0);
  const collectionRate = Math.round((totalCollected / totalDue) * 100);

  const stats = {
    totalDue,
    totalCollected,
    outstanding: totalDue - totalCollected,
    collectionRate,
    overdue: schedules.filter((s: any) => s.status === 'OVERDUE').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/real-estate-suite" className="hover:text-foreground transition-colors">Real Estate</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Rent Collection</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Rent Collection
          </h1>
          <p className="text-muted-foreground">Track rent payments and arrears</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="mark-overdue-btn">
            Mark Overdue
          </Button>
          <Button data-testid="record-payment-btn">
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDue)}</div>
            <p className="text-xs text-muted-foreground">Total Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</div>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.outstanding)}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.collectionRate}%</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Progress value={stats.collectionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Collection Rate</p>
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
                placeholder="Search by tenant, unit, property..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="rent-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rent Schedules Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due Date</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.map((schedule) => (
              <TableRow key={schedule.id} data-testid={`schedule-row-${schedule.id}`}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {formatDate(schedule.dueDate)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{schedule.tenantName}</TableCell>
                <TableCell>
                  <div>
                    <div>{schedule.unitNumber}</div>
                    <div className="text-xs text-muted-foreground">{schedule.propertyName}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {schedule.description}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(schedule.amount)}
                </TableCell>
                <TableCell className="text-green-600">
                  {formatCurrency(schedule.paidAmount)}
                </TableCell>
                <TableCell>
                  <Badge className={`${STATUS_COLORS[schedule.status]} flex items-center gap-1 w-fit`}>
                    {STATUS_ICONS[schedule.status]}
                    {schedule.status}
                  </Badge>
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
                      {schedule.status !== 'PAID' && (
                        <DropdownMenuItem className="text-green-600">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Record Payment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredSchedules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No rent schedules found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
