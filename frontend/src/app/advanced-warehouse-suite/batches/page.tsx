/**
 * ADVANCED WAREHOUSE SUITE — Batches Page
 * Phase 7C.3, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle,
  Ban,
  MoreHorizontal,
  Eye,
  Edit,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// Demo batches data (Nigerian pharma/FMCG context)
const DEMO_BATCHES = [
  { id: '1', product: 'Paracetamol 500mg', batchNumber: 'PARA-2026-001', lotNumber: 'L001', mfgDate: '2025-06-15', expiryDate: '2026-01-20', initialQty: 10000, currentQty: 5000, reserved: 200, status: 'APPROVED', supplier: 'Emzor Pharma', daysToExpiry: 14 },
  { id: '2', product: 'Amoxicillin 250mg Caps', batchNumber: 'AMOX-2025-089', lotNumber: 'L089', mfgDate: '2024-12-01', expiryDate: '2026-01-25', initialQty: 5000, currentQty: 2000, reserved: 0, status: 'APPROVED', supplier: 'Fidson Healthcare', daysToExpiry: 19 },
  { id: '3', product: 'Vitamin C 1000mg Tablets', batchNumber: 'VITC-2025-112', lotNumber: 'L112', mfgDate: '2025-02-10', expiryDate: '2026-02-05', initialQty: 15000, currentQty: 8000, reserved: 500, status: 'APPROVED', supplier: 'Swiss Pharma', daysToExpiry: 30 },
  { id: '4', product: 'Oral Rehydration Salts', batchNumber: 'ORS-2026-015', lotNumber: 'L015', mfgDate: '2025-07-20', expiryDate: '2026-01-28', initialQty: 8000, currentQty: 3500, reserved: 0, status: 'APPROVED', supplier: 'Emzor Pharma', daysToExpiry: 22 },
  { id: '5', product: 'Ibuprofen 400mg', batchNumber: 'IBU-2025-203', lotNumber: 'L203', mfgDate: '2025-01-15', expiryDate: '2026-02-10', initialQty: 12000, currentQty: 4200, reserved: 300, status: 'APPROVED', supplier: 'May & Baker', daysToExpiry: 35 },
  { id: '6', product: 'Metformin 500mg', batchNumber: 'MET-2025-078', lotNumber: 'L078', mfgDate: '2025-03-01', expiryDate: '2027-03-01', initialQty: 20000, currentQty: 18500, reserved: 1000, status: 'APPROVED', supplier: 'Sanofi Nigeria', daysToExpiry: 420 },
  { id: '7', product: 'Insulin Vials 100IU', batchNumber: 'INS-2025-045', lotNumber: 'L045', mfgDate: '2025-08-10', expiryDate: '2026-08-10', initialQty: 500, currentQty: 320, reserved: 50, status: 'APPROVED', supplier: 'Novo Nordisk', daysToExpiry: 216 },
  { id: '8', product: 'Hand Sanitizer 500ml', batchNumber: 'SAN-2025-167', lotNumber: 'L167', mfgDate: '2025-04-01', expiryDate: '2025-12-31', initialQty: 3000, currentQty: 150, reserved: 0, status: 'APPROVED', supplier: 'Local Supplier', daysToExpiry: -6, isExpired: true },
  { id: '9', product: 'Amoxicillin 500mg Caps', batchNumber: 'AMOX-2025-091', lotNumber: 'L091', mfgDate: '2024-11-15', expiryDate: '2026-03-15', initialQty: 6000, currentQty: 0, reserved: 0, status: 'RECALLED', supplier: 'Fidson Healthcare', daysToExpiry: 68, isRecalled: true, recallReason: 'Quality issue identified' },
  { id: '10', product: 'Chloroquine Tabs', batchNumber: 'CLQ-2025-034', lotNumber: 'L034', mfgDate: '2025-05-01', expiryDate: '2026-05-01', initialQty: 10000, currentQty: 7500, reserved: 0, status: 'QUARANTINE', supplier: 'May & Baker', daysToExpiry: 115, qualityNotes: 'Pending lab verification' },
];

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUARANTINE: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-700',
  RECALLED: 'bg-red-100 text-red-700',
};

export default function BatchesPage() {
  const [batches] = useState(DEMO_BATCHES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [showNewBatchDialog, setShowNewBatchDialog] = useState(false);

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = !searchQuery || 
      batch.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    const matchesExpiry = expiryFilter === 'all' || 
      (expiryFilter === 'expired' && batch.daysToExpiry < 0) ||
      (expiryFilter === 'expiring' && batch.daysToExpiry >= 0 && batch.daysToExpiry <= 30) ||
      (expiryFilter === 'good' && batch.daysToExpiry > 30);
    return matchesSearch && matchesStatus && matchesExpiry;
  });

  // Stats
  const totalBatches = batches.length;
  const expiredCount = batches.filter((b: any) => b.daysToExpiry < 0).length;
  const expiringCount = batches.filter((b: any) => b.daysToExpiry >= 0 && b.daysToExpiry <= 30).length;
  const recalledCount = batches.filter((b: any) => b.status === 'RECALLED').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-6" data-testid="batches-page">
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
              <Package className="h-6 w-6 text-purple-600" />
              Batch Tracking
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track batches, lots, and expiry dates
            </p>
          </div>
        </div>
        <Dialog open={showNewBatchDialog} onOpenChange={setShowNewBatchDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-batch-btn">
              <Plus className="mr-2 h-4 w-4" />
              New Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Batch</DialogTitle>
              <DialogDescription>Add a new batch to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="para">Paracetamol 500mg</SelectItem>
                    <SelectItem value="amox">Amoxicillin 250mg</SelectItem>
                    <SelectItem value="vitc">Vitamin C 1000mg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Number *</Label>
                  <Input placeholder="e.g., PARA-2026-002" />
                </div>
                <div className="space-y-2">
                  <Label>Lot Number</Label>
                  <Input placeholder="e.g., L002" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturing Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Initial Quantity *</Label>
                <Input type="number" placeholder="1000" />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input placeholder="e.g., Emzor Pharma" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBatchDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewBatchDialog(false)}>Register Batch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalBatches}</div>
            <div className="text-sm text-gray-500">Total Batches</div>
          </CardContent>
        </Card>
        <Card className={expiringCount > 0 ? 'border-orange-300' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <AlertTriangle className="h-5 w-5" />
              {expiringCount}
            </div>
            <div className="text-sm text-gray-500">Expiring (30 days)</div>
          </CardContent>
        </Card>
        <Card className={expiredCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <div className="text-sm text-gray-500">Expired</div>
          </CardContent>
        </Card>
        <Card className={recalledCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
              <ShieldAlert className="h-5 w-5" />
              {recalledCount}
            </div>
            <div className="text-sm text-gray-500">Recalled</div>
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
                placeholder="Search batches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-batches"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-status">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="QUARANTINE">Quarantine</SelectItem>
                <SelectItem value="RECALLED">Recalled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-expiry">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expiry</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="good">Good (30+ days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Lot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBatches.map((batch) => (
                  <tr 
                    key={batch.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${batch.daysToExpiry < 0 ? 'bg-red-50' : batch.daysToExpiry <= 30 ? 'bg-orange-50' : ''}`}
                    data-testid={`batch-row-${batch.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{batch.product}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">{batch.batchNumber}</div>
                      <div className="text-xs text-gray-500">Lot: {batch.lotNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[batch.status]}>
                        {batch.status === 'RECALLED' && <Ban className="h-3 w-3 mr-1" />}
                        {batch.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{batch.expiryDate}</div>
                      {batch.daysToExpiry < 0 ? (
                        <Badge variant="destructive" className="mt-1">Expired</Badge>
                      ) : batch.daysToExpiry <= 30 ? (
                        <Badge className="mt-1 bg-orange-100 text-orange-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {batch.daysToExpiry} days
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">{batch.daysToExpiry} days left</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{batch.currentQty.toLocaleString()} units</div>
                      <div className="text-xs text-gray-500">
                        {batch.reserved > 0 && <span className="text-orange-600">{batch.reserved} reserved</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{batch.supplier}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View History</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {batch.status !== 'RECALLED' && (
                            <DropdownMenuItem className="text-red-600">
                              <ShieldAlert className="mr-2 h-4 w-4" />Recall Batch
                            </DropdownMenuItem>
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

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Showing {filteredBatches.length} of {batches.length} batches</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {batches.filter((b: any) => b.status === 'APPROVED' && b.daysToExpiry > 30).length} Good
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-orange-500" />
                {expiringCount} Expiring
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {expiredCount} Expired
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
