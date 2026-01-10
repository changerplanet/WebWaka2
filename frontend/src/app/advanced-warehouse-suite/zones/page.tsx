/**
 * ADVANCED WAREHOUSE SUITE — Zones & Bins Page
 * Phase 7C.3, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Warehouse, 
  Plus, 
  Search, 
  Filter,
  Grid3X3,
  ArrowLeft,
  Package,
  Lock,
  Unlock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Demo zones data
const DEMO_ZONES = [
  { id: '1', code: 'RCV-01', name: 'Receiving Bay 1', type: 'RECEIVING', warehouse: 'Lagos Main', totalBins: 8, occupiedBins: 5, blockedBins: 0 },
  { id: '2', code: 'STG-A', name: 'Storage Zone A', type: 'STORAGE', warehouse: 'Lagos Main', totalBins: 40, occupiedBins: 32, blockedBins: 1 },
  { id: '3', code: 'STG-B', name: 'Storage Zone B', type: 'STORAGE', warehouse: 'Lagos Main', totalBins: 40, occupiedBins: 28, blockedBins: 0 },
  { id: '4', code: 'STG-C', name: 'Cold Storage', type: 'COLD', warehouse: 'Lagos Main', totalBins: 20, occupiedBins: 18, blockedBins: 2 },
  { id: '5', code: 'PCK-01', name: 'Picking Zone 1', type: 'PICKING', warehouse: 'Lagos Main', totalBins: 15, occupiedBins: 12, blockedBins: 0 },
  { id: '6', code: 'SHP-01', name: 'Shipping Dock', type: 'SHIPPING', warehouse: 'Lagos Main', totalBins: 6, occupiedBins: 3, blockedBins: 0 },
  { id: '7', code: 'QTN-01', name: 'Quarantine Area', type: 'QUARANTINE', warehouse: 'Lagos Main', totalBins: 10, occupiedBins: 4, blockedBins: 0 },
  { id: '8', code: 'RET-01', name: 'Returns Processing', type: 'RETURNS', warehouse: 'Lagos Main', totalBins: 5, occupiedBins: 2, blockedBins: 0 },
];

// Demo bins data
const DEMO_BINS = [
  { id: '1', code: 'A-01-01-01', zone: 'STG-A', type: 'SHELF', isEmpty: false, isBlocked: false, currentUnits: 120, maxUnits: 150, product: 'Paracetamol 500mg' },
  { id: '2', code: 'A-01-01-02', zone: 'STG-A', type: 'SHELF', isEmpty: false, isBlocked: false, currentUnits: 80, maxUnits: 150, product: 'Ibuprofen 400mg' },
  { id: '3', code: 'A-01-01-03', zone: 'STG-A', type: 'SHELF', isEmpty: true, isBlocked: false, currentUnits: 0, maxUnits: 150, product: null },
  { id: '4', code: 'A-01-02-01', zone: 'STG-A', type: 'SHELF', isEmpty: false, isBlocked: true, currentUnits: 45, maxUnits: 150, product: 'Amoxicillin Caps', blockReason: 'Pending inspection' },
  { id: '5', code: 'A-01-02-02', zone: 'STG-A', type: 'SHELF', isEmpty: false, isBlocked: false, currentUnits: 200, maxUnits: 200, product: 'Vitamin C Tabs' },
  { id: '6', code: 'B-01-01-01', zone: 'STG-B', type: 'PALLET', isEmpty: false, isBlocked: false, currentUnits: 500, maxUnits: 600, product: 'ORS Sachets' },
  { id: '7', code: 'B-01-01-02', zone: 'STG-B', type: 'PALLET', isEmpty: true, isBlocked: false, currentUnits: 0, maxUnits: 600, product: null },
  { id: '8', code: 'C-01-01-01', zone: 'STG-C', type: 'COLD', isEmpty: false, isBlocked: false, currentUnits: 150, maxUnits: 200, product: 'Insulin Vials' },
  { id: '9', code: 'C-01-01-02', zone: 'STG-C', type: 'COLD', isEmpty: false, isBlocked: true, currentUnits: 80, maxUnits: 200, product: 'Vaccines', blockReason: 'Temperature variance' },
  { id: '10', code: 'P-01-01-01', zone: 'PCK-01', type: 'SHELF', isEmpty: false, isBlocked: false, currentUnits: 50, maxUnits: 100, product: 'Mixed items' },
];

const ZONE_TYPE_COLORS: Record<string, string> = {
  RECEIVING: 'bg-blue-100 text-blue-700',
  STORAGE: 'bg-green-100 text-green-700',
  PICKING: 'bg-purple-100 text-purple-700',
  SHIPPING: 'bg-orange-100 text-orange-700',
  QUARANTINE: 'bg-red-100 text-red-700',
  RETURNS: 'bg-gray-100 text-gray-700',
  COLD: 'bg-cyan-100 text-cyan-700',
  BULK: 'bg-amber-100 text-amber-700',
};

const BIN_TYPE_COLORS: Record<string, string> = {
  SHELF: 'bg-blue-100 text-blue-700',
  PALLET: 'bg-green-100 text-green-700',
  COLD: 'bg-cyan-100 text-cyan-700',
  BULK: 'bg-amber-100 text-amber-700',
  HAZMAT: 'bg-red-100 text-red-700',
};

export default function ZonesPage() {
  const [zones] = useState(DEMO_ZONES);
  const [bins] = useState(DEMO_BINS);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [showNewZoneDialog, setShowNewZoneDialog] = useState(false);
  const [showNewBinDialog, setShowNewBinDialog] = useState(false);

  const filteredZones = zones.filter(zone => {
    const matchesSearch = !searchQuery || 
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredBins = bins.filter(bin => {
    const matchesSearch = !searchQuery || 
      bin.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bin.product && bin.product.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesZone = zoneFilter === 'all' || bin.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  // Stats
  const totalBins = bins.length;
  const emptyBins = bins.filter((b: any) => b.isEmpty).length;
  const blockedBins = bins.filter((b: any) => b.isBlocked).length;
  const occupancyRate = Math.round(((totalBins - emptyBins) / totalBins) * 100);

  return (
    <div className="space-y-6" data-testid="zones-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/advanced-warehouse-suite">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-amber-600" />
              Zones & Bins
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage warehouse structure and storage locations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewZoneDialog} onOpenChange={setShowNewZoneDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="create-zone-btn">
                <Plus className="mr-2 h-4 w-4" />
                New Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Zone</DialogTitle>
                <DialogDescription>Add a new zone to the warehouse</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Zone Code *</Label>
                  <Input placeholder="e.g., STG-D" />
                </div>
                <div className="space-y-2">
                  <Label>Zone Name *</Label>
                  <Input placeholder="e.g., Storage Zone D" />
                </div>
                <div className="space-y-2">
                  <Label>Zone Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVING">Receiving</SelectItem>
                      <SelectItem value="STORAGE">Storage</SelectItem>
                      <SelectItem value="PICKING">Picking</SelectItem>
                      <SelectItem value="SHIPPING">Shipping</SelectItem>
                      <SelectItem value="QUARANTINE">Quarantine</SelectItem>
                      <SelectItem value="COLD">Cold Storage</SelectItem>
                      <SelectItem value="BULK">Bulk Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewZoneDialog(false)}>Cancel</Button>
                <Button onClick={() => setShowNewZoneDialog(false)}>Create Zone</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNewBinDialog} onOpenChange={setShowNewBinDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-bin-btn">
                <Plus className="mr-2 h-4 w-4" />
                New Bin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Bin</DialogTitle>
                <DialogDescription>Add a new bin location</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Zone *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z: any) => (
                        <SelectItem key={z.id} value={z.code}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-2">
                    <Label>Aisle</Label>
                    <Input placeholder="A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rack</Label>
                    <Input placeholder="01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Input placeholder="01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input placeholder="01" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bin Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHELF">Shelf</SelectItem>
                      <SelectItem value="PALLET">Pallet</SelectItem>
                      <SelectItem value="BULK">Bulk</SelectItem>
                      <SelectItem value="COLD">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Units</Label>
                  <Input type="number" placeholder="100" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewBinDialog(false)}>Cancel</Button>
                <Button onClick={() => setShowNewBinDialog(false)}>Create Bin</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{zones.length}</div>
            <div className="text-sm text-gray-500">Total Zones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalBins}</div>
            <div className="text-sm text-gray-500">Total Bins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{occupancyRate}%</div>
            <div className="text-sm text-gray-500">Occupancy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{blockedBins}</div>
            <div className="text-sm text-gray-500">Blocked Bins</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Zones ({zones.length})
          </TabsTrigger>
          <TabsTrigger value="bins" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Bins ({bins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-4">
          {/* Zones Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredZones.map((zone) => {
              const zoneOccupancy = Math.round((zone.occupiedBins / zone.totalBins) * 100);
              return (
                <Card key={zone.id} className="hover:shadow-md transition-shadow" data-testid={`zone-card-${zone.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{zone.code}</span>
                          <Badge className={ZONE_TYPE_COLORS[zone.type]}>{zone.type}</Badge>
                        </div>
                        <h3 className="font-medium mt-1">{zone.name}</h3>
                        <p className="text-xs text-gray-500">{zone.warehouse}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Bins</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Bins: {zone.occupiedBins}/{zone.totalBins}</span>
                        <span className="font-medium">{zoneOccupancy}%</span>
                      </div>
                      <Progress value={zoneOccupancy} className="h-2" />
                      {zone.blockedBins > 0 && (
                        <div className="text-xs text-red-600 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {zone.blockedBins} blocked
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="bins" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-bins"
                  />
                </div>
                <Select value={zoneFilter} onValueChange={setZoneFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="filter-zone">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map((z: any) => (
                      <SelectItem key={z.code} value={z.code}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bins Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bin Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contents</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBins.map((bin) => (
                      <tr key={bin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`bin-row-${bin.id}`}>
                        <td className="px-4 py-3 font-mono text-sm">{bin.code}</td>
                        <td className="px-4 py-3 text-sm">{bin.zone}</td>
                        <td className="px-4 py-3">
                          <Badge className={BIN_TYPE_COLORS[bin.type]}>{bin.type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {bin.isBlocked ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <Lock className="h-3 w-3" />
                              Blocked
                            </Badge>
                          ) : bin.isEmpty ? (
                            <Badge variant="outline" className="text-gray-500">Empty</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">Occupied</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {bin.product || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={(bin.currentUnits / bin.maxUnits) * 100} className="w-16 h-2" />
                            <span className="text-xs text-gray-500">{bin.currentUnits}/{bin.maxUnits}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              {bin.isBlocked ? (
                                <DropdownMenuItem><Unlock className="mr-2 h-4 w-4" />Unblock</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem><Lock className="mr-2 h-4 w-4" />Block</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
