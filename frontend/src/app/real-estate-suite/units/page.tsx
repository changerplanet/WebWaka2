/**
 * REAL ESTATE MANAGEMENT — Units List Page
 * Phase 7A, S4 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Plus, 
  Search, 
  Building2,
  Users,
  DollarSign,
  MoreVertical,
  Eye,
  Edit,
  Trash2
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

// Demo data
const DEMO_UNITS = [
  { id: '1', unitNumber: 'Flat 1A', unitType: 'FLAT', status: 'OCCUPIED', propertyName: 'Harmony Estate Phase 2', bedrooms: 3, bathrooms: 2, monthlyRent: 250000, tenant: 'Mr. Chukwuma Eze' },
  { id: '2', unitNumber: 'Flat 1B', unitType: 'FLAT', status: 'OCCUPIED', propertyName: 'Harmony Estate Phase 2', bedrooms: 3, bathrooms: 2, monthlyRent: 250000, tenant: 'Mrs. Funke Williams' },
  { id: '3', unitNumber: 'Flat 2A', unitType: 'FLAT', status: 'VACANT', propertyName: 'Harmony Estate Phase 2', bedrooms: 2, bathrooms: 1, monthlyRent: 180000, tenant: null },
  { id: '4', unitNumber: 'Shop A1', unitType: 'SHOP', status: 'OCCUPIED', propertyName: 'Victoria Plaza', bedrooms: null, bathrooms: 1, monthlyRent: 500000, tenant: 'Elegance Fashion Store' },
  { id: '5', unitNumber: 'Office 201', unitType: 'OFFICE', status: 'RESERVED', propertyName: 'Victoria Plaza', bedrooms: null, bathrooms: 1, monthlyRent: 350000, tenant: null },
  { id: '6', unitNumber: 'Room 5', unitType: 'ROOM', status: 'MAINTENANCE', propertyName: 'Green Gardens Apartments', bedrooms: 1, bathrooms: 1, monthlyRent: 80000, tenant: null },
];

const STATUS_COLORS: Record<string, string> = {
  VACANT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OCCUPIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RESERVED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const TYPE_ICONS: Record<string, string> = {
  FLAT: '🏠',
  ROOM: '🛏️',
  SHOP: '🏪',
  OFFICE: '🏢',
  WAREHOUSE: '📦',
  PARKING: '🅿️',
};

export default function UnitsPage() {
  const [units] = useState(DEMO_UNITS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredUnits = units.filter((u) => {
    const matchesSearch = 
      u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      u.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      (u.tenant && u.tenant.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesType = typeFilter === 'all' || u.unitType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: units.length,
    vacant: units.filter((u: any) => u.status === 'VACANT').length,
    occupied: units.filter((u: any) => u.status === 'OCCUPIED').length,
    occupancyRate: Math.round((units.filter((u: any) => u.status === 'OCCUPIED').length / units.length) * 100),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/real-estate-suite" className="hover:text-foreground transition-colors">Real Estate</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Units</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6" />
            Units
          </h1>
          <p className="text-muted-foreground">Manage units across all properties</p>
        </div>
        <Button data-testid="add-unit-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.vacant}</div>
            <p className="text-xs text-muted-foreground">Vacant</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.occupied}</div>
            <p className="text-xs text-muted-foreground">Occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">Occupancy Rate</p>
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
                placeholder="Search units..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="unit-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="VACANT">Vacant</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FLAT">Flat</SelectItem>
                <SelectItem value="ROOM">Room</SelectItem>
                <SelectItem value="SHOP">Shop</SelectItem>
                <SelectItem value="OFFICE">Office</SelectItem>
                <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Specs</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.map((unit) => (
              <TableRow key={unit.id} data-testid={`unit-row-${unit.id}`}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{TYPE_ICONS[unit.unitType]}</span>
                    {unit.unitNumber}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {unit.propertyName}
                  </div>
                </TableCell>
                <TableCell>{unit.unitType}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[unit.status]}>
                    {unit.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {unit.bedrooms !== null ? `${unit.bedrooms}BR / ${unit.bathrooms}BA` : `${unit.bathrooms}BA`}
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(unit.monthlyRent)}
                </TableCell>
                <TableCell>
                  {unit.tenant ? (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-sm">{unit.tenant}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
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
                        Edit Unit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredUnits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No units found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
