/**
 * ADVANCED WAREHOUSE SUITE — Receipts & Putaway Page
 * Phase 7C.3, S5 Admin UI
 * Goods Receipt and Putaway Task Management
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Boxes, 
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
import { Textarea } from '@/components/ui/textarea';

// Demo receipts data - Nigerian warehouse context
const DEMO_RECEIPTS = [
  { 
    id: '1', 
    receiptNumber: 'GRN-202601-0045',
    warehouseName: 'Lagos Main Warehouse',
    referenceType: 'PO',
    referenceNumber: 'PO-2026-0089',
    supplierName: 'Prime Pharma Ltd',
    supplierRef: 'INV-45892',
    status: 'RECEIVING',
    expectedDate: '2026-01-06',
    receivedDate: null,
    itemCount: 5,
    receivedCount: 3,
    requiresInspection: true,
    inspectionPassed: null,
    totalValueNGN: 2450000,
    createdAt: '2026-01-05T10:30:00Z',
  },
  { 
    id: '2', 
    receiptNumber: 'GRN-202601-0044',
    warehouseName: 'Lagos Main Warehouse',
    referenceType: 'PO',
    referenceNumber: 'PO-2026-0088',
    supplierName: 'MedSupply Nigeria',
    supplierRef: 'MSN-12456',
    status: 'INSPECTING',
    expectedDate: '2026-01-05',
    receivedDate: '2026-01-05',
    itemCount: 8,
    receivedCount: 8,
    requiresInspection: true,
    inspectionPassed: null,
    totalValueNGN: 3800000,
    createdAt: '2026-01-04T14:00:00Z',
  },
  { 
    id: '3', 
    receiptNumber: 'GRN-202601-0043',
    warehouseName: 'Lagos Main Warehouse',
    referenceType: 'PO',
    referenceNumber: 'PO-2026-0087',
    supplierName: 'HealthFirst Distributors',
    supplierRef: 'HFD-7890',
    status: 'COMPLETED',
    expectedDate: '2026-01-04',
    receivedDate: '2026-01-04',
    itemCount: 3,
    receivedCount: 3,
    requiresInspection: false,
    inspectionPassed: true,
    totalValueNGN: 1250000,
    createdAt: '2026-01-03T09:00:00Z',
  },
  { 
    id: '4', 
    receiptNumber: 'GRN-202601-0042',
    warehouseName: 'Ibadan Regional Depot',
    referenceType: 'TRANSFER',
    referenceNumber: 'TRF-2026-0015',
    supplierName: 'Lagos Main Warehouse',
    supplierRef: null,
    status: 'EXPECTED',
    expectedDate: '2026-01-07',
    receivedDate: null,
    itemCount: 12,
    receivedCount: 0,
    requiresInspection: false,
    inspectionPassed: null,
    totalValueNGN: 5600000,
    createdAt: '2026-01-05T16:00:00Z',
  },
  { 
    id: '5', 
    receiptNumber: 'GRN-202601-0041',
    warehouseName: 'Lagos Main Warehouse',
    referenceType: 'MANUAL',
    referenceNumber: null,
    supplierName: 'Walk-in Supplier',
    supplierRef: 'CASH-001',
    status: 'COMPLETED',
    expectedDate: '2026-01-03',
    receivedDate: '2026-01-03',
    itemCount: 2,
    receivedCount: 2,
    requiresInspection: true,
    inspectionPassed: true,
    totalValueNGN: 450000,
    createdAt: '2026-01-03T11:30:00Z',
  },
];

// Demo putaway tasks
const DEMO_PUTAWAY_TASKS = [
  {
    id: '1',
    taskNumber: 'PUT-202601-0067',
    receiptNumber: 'GRN-202601-0043',
    productName: 'Paracetamol 500mg Tablets',
    sku: 'PARA-500-100',
    batchNumber: 'PARA-2026-005',
    quantity: 5000,
    suggestedZone: 'STG-A',
    suggestedBin: 'A-02-03-01',
    actualZone: null,
    actualBin: null,
    status: 'PENDING',
    priority: 'NORMAL',
    assignedTo: null,
  },
  {
    id: '2',
    taskNumber: 'PUT-202601-0068',
    receiptNumber: 'GRN-202601-0043',
    productName: 'Ibuprofen 400mg Tablets',
    sku: 'IBU-400-100',
    batchNumber: 'IBU-2026-012',
    quantity: 3000,
    suggestedZone: 'STG-A',
    suggestedBin: 'A-02-03-02',
    actualZone: 'STG-A',
    actualBin: 'A-02-03-02',
    status: 'COMPLETED',
    priority: 'HIGH',
    assignedTo: 'Adamu Musa',
    completedAt: '2026-01-05T14:30:00Z',
  },
  {
    id: '3',
    taskNumber: 'PUT-202601-0069',
    receiptNumber: 'GRN-202601-0044',
    productName: 'Insulin Vials 100IU/ml',
    sku: 'INS-100-10',
    batchNumber: 'INS-2026-003',
    quantity: 200,
    suggestedZone: 'STG-C',
    suggestedBin: 'C-01-02-01',
    actualZone: null,
    actualBin: null,
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    assignedTo: 'Chidi Okoro',
  },
  {
    id: '4',
    taskNumber: 'PUT-202601-0070',
    receiptNumber: 'GRN-202601-0045',
    productName: 'Amoxicillin Capsules 500mg',
    sku: 'AMOX-500-50',
    batchNumber: 'AMOX-2026-008',
    quantity: 2000,
    suggestedZone: 'STG-B',
    suggestedBin: 'B-01-01-03',
    actualZone: null,
    actualBin: null,
    status: 'PENDING',
    priority: 'HIGH',
    assignedTo: null,
  },
];

const RECEIPT_STATUS_COLORS: Record<string, string> = {
  EXPECTED: 'bg-yellow-100 text-yellow-700',
  RECEIVING: 'bg-blue-100 text-blue-700',
  INSPECTING: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const PUTAWAY_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function ReceiptsPage() {
  const [receipts] = useState(DEMO_RECEIPTS);
  const [putawayTasks] = useState(DEMO_PUTAWAY_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);

  // Filter receipts
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = !searchQuery || 
      receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (receipt.referenceNumber && receipt.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter putaway tasks
  const filteredPutaway = putawayTasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Stats
  const expectedReceipts = receipts.filter((r: any) => r.status === 'EXPECTED').length;
  const receivingReceipts = receipts.filter((r: any) => r.status === 'RECEIVING').length;
  const inspectingReceipts = receipts.filter((r: any) => r.status === 'INSPECTING').length;
  const pendingPutaway = putawayTasks.filter((p: any) => p.status === 'PENDING').length;
  const inProgressPutaway = putawayTasks.filter((p: any) => p.status === 'IN_PROGRESS').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6" data-testid="receipts-page">
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
              <Boxes className="h-6 w-6 text-blue-600" />
              Receipts & Putaway
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage goods receipts, inspections, and putaway tasks
            </p>
          </div>
        </div>
        <Dialog open={showNewReceiptDialog} onOpenChange={setShowNewReceiptDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-receipt-btn">
              <Plus className="mr-2 h-4 w-4" />
              New Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Goods Receipt</DialogTitle>
              <DialogDescription>Record an expected or manual goods receipt</DialogDescription>
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
                  <Label>Reference Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PO">Purchase Order</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="RETURN">Return</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference #</Label>
                  <Input placeholder="PO-2026-0090" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prime">Prime Pharma Ltd</SelectItem>
                      <SelectItem value="med">MedSupply Nigeria</SelectItem>
                      <SelectItem value="health">HealthFirst Distributors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="requiresInspection" className="rounded" />
                <Label htmlFor="requiresInspection">Requires quality inspection</Label>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewReceiptDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewReceiptDialog(false)}>Create Receipt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{expectedReceipts}</div>
            <div className="text-sm text-gray-500">Expected</div>
          </CardContent>
        </Card>
        <Card className={receivingReceipts > 0 ? 'border-blue-300 bg-blue-50' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{receivingReceipts}</div>
            <div className="text-sm text-gray-500">Receiving</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{inspectingReceipts}</div>
            <div className="text-sm text-gray-500">Inspecting</div>
          </CardContent>
        </Card>
        <Card className={pendingPutaway > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingPutaway}</div>
            <div className="text-sm text-gray-500">Putaway Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{inProgressPutaway}</div>
            <div className="text-sm text-gray-500">Putaway Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="receipts">
        <TabsList>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Receipts ({receipts.length})
          </TabsTrigger>
          <TabsTrigger value="putaway" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Putaway Tasks ({putawayTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search receipts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-receipts"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40" data-testid="filter-receipt-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="EXPECTED">Expected</SelectItem>
                    <SelectItem value="RECEIVING">Receiving</SelectItem>
                    <SelectItem value="INSPECTING">Inspecting</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Receipts Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`receipt-row-${receipt.id}`}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-mono text-sm font-medium">{receipt.receiptNumber}</div>
                            <div className="text-xs text-gray-500">{receipt.warehouseName}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{receipt.supplierName}</div>
                          {receipt.supplierRef && (
                            <div className="text-xs text-gray-500">Ref: {receipt.supplierRef}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {receipt.referenceType}
                          </Badge>
                          {receipt.referenceNumber && (
                            <div className="text-xs text-gray-500 mt-1">{receipt.referenceNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={RECEIPT_STATUS_COLORS[receipt.status]}>
                            {receipt.status}
                          </Badge>
                          {receipt.requiresInspection && receipt.status === 'INSPECTING' && (
                            <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              QC Pending
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm">{receipt.receivedCount}/{receipt.itemCount}</div>
                          <Progress 
                            value={(receipt.receivedCount / receipt.itemCount) * 100} 
                            className="w-16 h-1.5 mt-1 mx-auto" 
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-medium">{formatCurrency(receipt.totalValueNGN)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(receipt.expectedDate).toLocaleDateString('en-NG')}
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
                              {receipt.status === 'EXPECTED' && (
                                <DropdownMenuItem><Play className="mr-2 h-4 w-4" />Start Receiving</DropdownMenuItem>
                              )}
                              {receipt.status === 'RECEIVING' && (
                                <DropdownMenuItem><Check className="mr-2 h-4 w-4" />Complete Receiving</DropdownMenuItem>
                              )}
                              {receipt.status === 'INSPECTING' && (
                                <>
                                  <DropdownMenuItem className="text-green-600"><CheckCircle className="mr-2 h-4 w-4" />Pass Inspection</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600"><X className="mr-2 h-4 w-4" />Fail Inspection</DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Print GRN</DropdownMenuItem>
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

        <TabsContent value="putaway" className="mt-4 space-y-4">
          {/* Putaway Tasks Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product / Batch</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Bin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPutaway.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`putaway-row-${task.id}`}>
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm font-medium">{task.taskNumber}</div>
                          <div className="text-xs text-gray-500">From: {task.receiptNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{task.productName}</div>
                          <div className="text-xs text-gray-500">{task.sku} • Batch: {task.batchNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {task.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono">{task.suggestedBin}</div>
                          <div className="text-xs text-gray-500">Zone: {task.suggestedZone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge className={PUTAWAY_STATUS_COLORS[task.status]}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={PRIORITY_COLORS[task.priority]} variant="outline">
                              {task.priority}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {task.assignedTo || <span className="text-gray-400">Unassigned</span>}
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
                              {task.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem><Play className="mr-2 h-4 w-4" />Start Task</DropdownMenuItem>
                                  <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Assign</DropdownMenuItem>
                                </>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <DropdownMenuItem><Check className="mr-2 h-4 w-4" />Complete</DropdownMenuItem>
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
