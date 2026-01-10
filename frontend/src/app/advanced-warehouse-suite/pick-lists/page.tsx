/**
 * ADVANCED WAREHOUSE SUITE — Pick Lists Page
 * Phase 7C.3, S5 Admin UI
 * Pick Lists, Packing, and Dispatch Management
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter,
  ArrowLeft,
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Play,
  Check,
  X,
  FileText,
  PackageCheck,
  Send
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
import { Textarea } from '@/components/ui/textarea';

// Demo pick lists - Nigerian e-commerce/distribution context
const DEMO_PICK_LISTS = [
  { 
    id: '1', 
    pickNumber: 'PICK-202601-0089',
    warehouseName: 'Lagos Main Warehouse',
    pickType: 'ORDER',
    sourceType: 'ORDER',
    sourceNumber: 'ORD-2026-1245',
    customerName: 'Shoprite Victoria Island',
    status: 'PENDING',
    priority: 'HIGH',
    itemCount: 8,
    pickedCount: 0,
    totalUnits: 450,
    pickedUnits: 0,
    assignedTo: null,
    createdAt: '2026-01-06T08:00:00Z',
    dueBy: '2026-01-06T14:00:00Z',
  },
  { 
    id: '2', 
    pickNumber: 'PICK-202601-0088',
    warehouseName: 'Lagos Main Warehouse',
    pickType: 'ORDER',
    sourceType: 'ORDER',
    sourceNumber: 'ORD-2026-1244',
    customerName: 'MedPlus Pharmacy Ikeja',
    status: 'PICKING',
    priority: 'URGENT',
    itemCount: 5,
    pickedCount: 3,
    totalUnits: 280,
    pickedUnits: 180,
    assignedTo: 'Emeka Obi',
    createdAt: '2026-01-06T07:30:00Z',
    dueBy: '2026-01-06T12:00:00Z',
  },
  { 
    id: '3', 
    pickNumber: 'PICK-202601-0087',
    warehouseName: 'Lagos Main Warehouse',
    pickType: 'TRANSFER',
    sourceType: 'TRANSFER',
    sourceNumber: 'TRF-2026-0015',
    customerName: 'Ibadan Regional Depot',
    status: 'PICKED',
    priority: 'NORMAL',
    itemCount: 12,
    pickedCount: 12,
    totalUnits: 1500,
    pickedUnits: 1500,
    assignedTo: 'Adamu Musa',
    createdAt: '2026-01-05T14:00:00Z',
    dueBy: '2026-01-06T10:00:00Z',
  },
  { 
    id: '4', 
    pickNumber: 'PICK-202601-0086',
    warehouseName: 'Lagos Main Warehouse',
    pickType: 'ORDER',
    sourceType: 'ORDER',
    sourceNumber: 'ORD-2026-1243',
    customerName: 'HealthPlus Lekki',
    status: 'PACKED',
    priority: 'HIGH',
    itemCount: 6,
    pickedCount: 6,
    totalUnits: 320,
    pickedUnits: 320,
    packageCount: 3,
    totalWeight: 12.5,
    assignedTo: 'Chidi Okoro',
    createdAt: '2026-01-05T11:00:00Z',
    dueBy: '2026-01-06T09:00:00Z',
  },
  { 
    id: '5', 
    pickNumber: 'PICK-202601-0085',
    warehouseName: 'Lagos Main Warehouse',
    pickType: 'ORDER',
    sourceType: 'ORDER',
    sourceNumber: 'ORD-2026-1242',
    customerName: 'Medbury Surulere',
    status: 'DISPATCHED',
    priority: 'NORMAL',
    itemCount: 4,
    pickedCount: 4,
    totalUnits: 200,
    pickedUnits: 200,
    packageCount: 2,
    totalWeight: 8.0,
    waybillNumber: 'WB-LAG-202601-0034',
    carrierName: 'GIG Logistics',
    dispatchedAt: '2026-01-06T07:00:00Z',
    assignedTo: 'Ngozi Eze',
    createdAt: '2026-01-05T09:00:00Z',
    dueBy: '2026-01-05T16:00:00Z',
  },
  { 
    id: '6', 
    pickNumber: 'PICK-202601-0084',
    warehouseName: 'Lagos Main Warehouse',
    pickType: 'ORDER',
    sourceType: 'ORDER',
    sourceNumber: 'ORD-2026-1241',
    customerName: 'Alpha Pharmacy Marina',
    status: 'DISPATCHED',
    priority: 'HIGH',
    itemCount: 10,
    pickedCount: 10,
    totalUnits: 560,
    pickedUnits: 560,
    packageCount: 5,
    totalWeight: 22.0,
    waybillNumber: 'WB-LAG-202601-0033',
    carrierName: 'DHL',
    dispatchedAt: '2026-01-05T17:00:00Z',
    assignedTo: 'Emeka Obi',
    createdAt: '2026-01-05T08:00:00Z',
    dueBy: '2026-01-05T15:00:00Z',
  },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PICKING: 'bg-blue-100 text-blue-700',
  PICKED: 'bg-purple-100 text-purple-700',
  PACKED: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  PICKING: Package,
  PICKED: CheckCircle,
  PACKED: PackageCheck,
  DISPATCHED: Truck,
};

export default function PickListsPage() {
  const [pickLists] = useState(DEMO_PICK_LISTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewPickListDialog, setShowNewPickListDialog] = useState(false);

  // Filter pick lists
  const filteredPickLists = pickLists.filter(pick => {
    const matchesSearch = !searchQuery || 
      pick.pickNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pick.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pick.sourceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pick.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const pendingPicks = pickLists.filter((p: any) => p.status === 'PENDING').length;
  const pickingActive = pickLists.filter((p: any) => p.status === 'PICKING').length;
  const awaitingPack = pickLists.filter((p: any) => p.status === 'PICKED').length;
  const readyDispatch = pickLists.filter((p: any) => p.status === 'PACKED').length;
  const dispatchedToday = pickLists.filter((p: any) => p.status === 'DISPATCHED').length;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dueBy: string, status: string) => {
    if (['DISPATCHED', 'CANCELLED'].includes(status)) return false;
    return new Date(dueBy) < new Date();
  };

  return (
    <div className="space-y-6" data-testid="pick-lists-page">
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
              <ClipboardList className="h-6 w-6 text-green-600" />
              Pick Lists & Dispatch
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage order picking, packing, and shipment dispatch
            </p>
          </div>
        </div>
        <Dialog open={showNewPickListDialog} onOpenChange={setShowNewPickListDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-pick-list-btn">
              <Plus className="mr-2 h-4 w-4" />
              New Pick List
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Pick List</DialogTitle>
              <DialogDescription>Generate a new pick list from orders or transfers</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lagos">Lagos Main Warehouse</SelectItem>
                    <SelectItem value="ibadan">Ibadan Regional Depot</SelectItem>
                    <SelectItem value="abuja">Abuja Distribution Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pick Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDER">Sales Order</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="REPLENISH">Replenishment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Source Order/Transfer #</Label>
                <Input placeholder="ORD-2026-1246" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Special instructions..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPickListDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewPickListDialog(false)}>Create Pick List</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Pipeline View */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={pendingPicks > 0 ? 'border-yellow-300' : ''}>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{pendingPicks}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card className={pickingActive > 0 ? 'border-blue-300 bg-blue-50' : ''}>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{pickingActive}</div>
            <div className="text-sm text-gray-500">Picking</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{awaitingPack}</div>
            <div className="text-sm text-gray-500">To Pack</div>
          </CardContent>
        </Card>
        <Card className={readyDispatch > 0 ? 'border-indigo-300 bg-indigo-50' : ''}>
          <CardContent className="p-4 text-center">
            <PackageCheck className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
            <div className="text-2xl font-bold text-indigo-600">{readyDispatch}</div>
            <div className="text-sm text-gray-500">Ready</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{dispatchedToday}</div>
            <div className="text-sm text-gray-500">Dispatched</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by pick #, customer, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-pick-lists"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-pick-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PICKING">Picking</SelectItem>
                <SelectItem value="PICKED">Picked</SelectItem>
                <SelectItem value="PACKED">Packed</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pick Lists Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pick #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer / Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due By</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPickLists.map((pick) => {
                  const StatusIcon = STATUS_ICONS[pick.status] || Clock;
                  const overdue = isOverdue(pick.dueBy, pick.status);
                  
                  return (
                    <tr 
                      key={pick.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${overdue ? 'bg-red-50' : ''}`}
                      data-testid={`pick-row-${pick.id}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-mono text-sm font-medium flex items-center gap-2">
                            {pick.pickNumber}
                            <Badge className={PRIORITY_COLORS[pick.priority]} variant="outline">
                              {pick.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {pick.sourceType}: {pick.sourceNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{pick.customerName}</div>
                        <div className="text-xs text-gray-500">{pick.warehouseName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[pick.status]} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {pick.status}
                        </Badge>
                        {pick.status === 'DISPATCHED' && pick.waybillNumber && (
                          <div className="text-xs text-gray-500 mt-1">
                            {pick.waybillNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm">{pick.pickedCount}/{pick.itemCount} items</div>
                        <Progress 
                          value={(pick.pickedUnits / pick.totalUnits) * 100} 
                          className="w-20 h-1.5 mt-1 mx-auto" 
                        />
                        <div className="text-xs text-gray-500">{pick.pickedUnits}/{pick.totalUnits} units</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {pick.assignedTo || <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                          {formatTime(pick.dueBy)}
                        </div>
                        {overdue && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
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
                            {pick.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Assign Picker</DropdownMenuItem>
                                <DropdownMenuItem><Play className="mr-2 h-4 w-4" />Start Picking</DropdownMenuItem>
                              </>
                            )}
                            {pick.status === 'PICKING' && (
                              <DropdownMenuItem><Check className="mr-2 h-4 w-4" />Complete Picking</DropdownMenuItem>
                            )}
                            {pick.status === 'PICKED' && (
                              <DropdownMenuItem><PackageCheck className="mr-2 h-4 w-4" />Start Packing</DropdownMenuItem>
                            )}
                            {pick.status === 'PACKED' && (
                              <DropdownMenuItem><Send className="mr-2 h-4 w-4" />Dispatch</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Print Pick Sheet</DropdownMenuItem>
                            {pick.status === 'PACKED' && (
                              <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Print Packing Slip</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredPickLists.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No pick lists found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new pick list</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
