/**
 * REAL ESTATE MANAGEMENT — Properties List Page
 * Phase 7A, S4 Admin UI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Demo data
const DEMO_PROPERTIES = [
  {
    id: '1',
    name: 'Harmony Estate Phase 2',
    propertyType: 'RESIDENTIAL',
    status: 'OCCUPIED',
    address: '15 Harmony Close',
    city: 'Lekki',
    state: 'Lagos',
    totalUnits: 12,
    occupiedUnits: 10,
    ownerName: 'Chief Adewale Johnson',
    monthlyRent: 2400000,
  },
  {
    id: '2',
    name: 'Victoria Plaza',
    propertyType: 'COMMERCIAL',
    status: 'OCCUPIED',
    address: '42 Broad Street',
    city: 'Lagos Island',
    state: 'Lagos',
    totalUnits: 8,
    occupiedUnits: 6,
    ownerName: 'Victoria Properties Ltd',
    monthlyRent: 4500000,
  },
  {
    id: '3',
    name: 'Green Gardens Apartments',
    propertyType: 'RESIDENTIAL',
    status: 'AVAILABLE',
    address: '7 Green Estate Road',
    city: 'Ikeja',
    state: 'Lagos',
    totalUnits: 6,
    occupiedUnits: 4,
    ownerName: 'Dr. Emmanuel Okafor',
    monthlyRent: 1800000,
  },
  {
    id: '4',
    name: 'Sunrise Business Hub',
    propertyType: 'COMMERCIAL',
    status: 'MAINTENANCE',
    address: '23 Industrial Layout',
    city: 'Aba',
    state: 'Abia',
    totalUnits: 15,
    occupiedUnits: 12,
    ownerName: 'Sunrise Holdings',
    monthlyRent: 3200000,
  },
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OCCUPIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  UNLISTED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  MIXED: 'Mixed Use',
  LAND: 'Land',
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState(DEMO_PROPERTIES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.propertyType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: properties.length,
    totalUnits: properties.reduce((sum: any, p: any) => sum + p.totalUnits, 0),
    occupiedUnits: properties.reduce((sum: any, p: any) => sum + p.occupiedUnits, 0),
    monthlyRevenue: properties.reduce((sum: any, p: any) => sum + p.monthlyRent, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/real-estate-suite" className="hover:text-foreground transition-colors">
          Real Estate
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Properties</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Properties
          </h1>
          <p className="text-muted-foreground">
            Manage your property portfolio
          </p>
        </div>
        <Button data-testid="add-property-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {Math.round((stats.occupiedUnits / stats.totalUnits) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Occupancy Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Monthly Revenue</p>
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
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="property-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="UNLISTED">Unlisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="MIXED">Mixed Use</SelectItem>
                <SelectItem value="LAND">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div className="grid gap-4">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-md transition-shadow" data-testid={`property-card-${property.id}`}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{property.name}</h3>
                      <Badge className={STATUS_COLORS[property.status]}>
                        {property.status}
                      </Badge>
                      <Badge variant="outline">{TYPE_LABELS[property.propertyType]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}, {property.city}, {property.state}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Owner: {property.ownerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {property.occupiedUnits}/{property.totalUnits}
                    </div>
                    <p className="text-xs text-muted-foreground">Units Occupied</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(property.monthlyRent)}
                    </div>
                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`property-menu-${property.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/real-estate-suite/properties/${property.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteDialog(property.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No properties found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first property to get started'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProperties.length} of {properties.length} properties
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
              Properties with active leases cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialog(null)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
